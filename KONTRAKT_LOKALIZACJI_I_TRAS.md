# Kontrakt lokalizacji i tras — granice modułów

Status: **6A–6D oraz 6E.1 zakończone 2026-09-02; następny podetap 6E.2**.

Ten dokument opisuje wynik inwentaryzacji 6A.1, model danych wersji `1`
wdrożony w 6A.2 oraz migrację zgodnościową z 6A.3. Ustala miejsce, w którym
powstaje roboczy wynik trasy,
odpowiedzialności obecnych modułów i rozdział danych źródłowych, automatycznych
oraz roboczych. Od 6E.1 zapisuje wybór dostawcy dla pierwszej integracji, ale
nie podłącza jeszcze jego API i nie zmienia dotychczasowego działania interfejsu.

## Jedna brama domenowa

Jedyną bramą domenową dla wyboru, utworzenia i zastosowania roboczego wyniku
trasy jest moduł **`aplikacja.lokalizacje`** w
`js/lokalizacje/lokalizacje.js`.

Wszystkie źródła trasy — bieżący plan, import, ręczna wartość operatora,
`pamiecTras` oraz przyszły adapter map — mają zbiegać się w tej bramie. Dopiero
zaakceptowany wynik roboczy może zasilić model budowy albo istniejący kontrakt
przejazdu pompy. Silnik harmonogramu nie wybiera źródła i nie pobiera trasy.

Funkcja `pobierzLubUstalTrase` jest wspólnym przepływem tej bramy:
zachowuje kolejność bieżące czasy → pamięć tras → wstrzyknięta funkcja mapowa →
jawny brak trasy. Od 6A.3 każdy z tych wyników jest synchronizowany z modelem
wersji `1`, a bezpieczne pierwszeństwo ręcznej warstwy pozostaje obowiązujące.

## Inwentaryzacja obecnych modułów

| Moduł | Obecna odpowiedzialność | Granica po 6A.1 |
| --- | --- | --- |
| `js/import/import_csv.js` | Rozpoznaje dane budowy i opcjonalne czasy, zachowuje pola źródłowe w `daneZrodlowe`. | Dostarcza dane źródłowe; nie geokoduje, nie wyznacza tras i nie wywołuje sieci. |
| `js/budowy/budowy.js` | Przechowuje i waliduje roboczy dojazd, powrót oraz ich źródła. | Jest modelem wartości używanych przez plan; nie ustala pierwszeństwa źródeł i nie zna dostawcy map. |
| `js/lokalizacje/model_lokalizacji_i_trasy.js` | Tworzy i waliduje kontrakt danych wersji `1`. | Rozdziela trzy warstwy danych bez wybierania dostawcy i bez wykonywania zapytań. |
| `js/lokalizacje/lokalizacje.js` | Łączy budowę z książką tras i ma przepływ `pobierzLubUstalTrase`. | Jest jedyną bramą domenową roboczego wyniku trasy. |
| `js/pamiec/pamiec_tras.js` | Zapisuje wersję `v2` lokalnej książki tras i rozpoznaje stabilny klucz zakresowany węzłem. | Jest wyłącznie trwałą pamięcią przyjętych danych; nie mutuje modelu i nie wyznacza tras. |
| `js/pompy/przejazdy_pomp.js` oraz moduły edycji przejazdów | Zużywają kierunkowe `czasPrzejazduMinuty` i `zrodloCzasuPrzejazdu`. | Nie pytają map ani pamięci; otrzymują przygotowany roboczy wynik relacji budowa → budowa. |
| `js/harmonogram/harmonogram.js` | Składa robocze budowy, kursy, pompy, gruszki i konflikty. | Otrzymuje gotowe wartości robocze; nie używa sieci, geokodowania ani `localStorage`. |
| `js/aplikacja.js` i interfejs | Importują dane, zbierają decyzje operatora i uruchamiają przeliczenie. | Sterują przepływem i prezentacją; nie implementują reguł routingu ani pierwszeństwa źródeł. |

## Obecne luki po zamknięciu 6A

- Budowa nie ma jeszcze oddzielnych pól adresu, współrzędnych, dystansu i
  statusu jakości lokalizacji.
- `pamiecTras` w wersji `v1` tworzy klucz z domyślnego ID węzła oraz tekstu
  `firma | budowa`, a nie z jednoznacznego adresu lub współrzędnych.
- Wstrzyknięta funkcja mapowa zwraca obecnie głównie czasy; pełny dystans,
  współrzędne i metadane wyniku zostaną podłączone w 6E–6G.
- Nie istnieje jeszcze wersjonowany model punktu węzła; jego zakres zaczyna się
  w 6C.

## Docelowy przepływ zależności

1. Import albo interfejs przekazuje źródłowy adres, bieżące czasy lub ręczną
   decyzję do `aplikacja.lokalizacje`.
2. Brama zachowuje kompletne wartości robocze, a przy ich braku sprawdza
   `pamiecTras` przed próbą użycia wymiennego adaptera map.
3. Adapter tylko zwraca kandydatów lokalizacji lub wynik trasy. Nie zmienia
   budowy, pamięci ani harmonogramu.
4. Brama waliduje i akceptuje wynik, rozdziela dane automatyczne od roboczych,
   a dopiero potem aktualizuje model oraz zapisuje zaakceptowane dane w cache.
5. Harmonogram i silnik pomp otrzymują wyłącznie przygotowane wartości robocze.

Dozwolony kierunek zależności to:

`import/interfejs → lokalizacje → pamięć lub adapter → model roboczy → harmonogram`.

Poza bramą nie wolno wybierać pomiędzy czasem ręcznym, cache i mapą. Adapter
nie może wywoływać harmonogramu, a harmonogram nie może wywoływać adaptera,
`fetch`, geokodowania ani pamięci przeglądarki.

## Model danych wersji 1

Moduł `js/lokalizacje/model_lokalizacji_i_trasy.js` udostępnia
`utworzModelLokalizacji` i `utworzModelTrasy`. Oba modele mają
`wersjaKontraktu: 1` oraz trzy niezależne warstwy:

- `daneZrodlowe` — dokładna informacja otrzymana z importu albo starszego
  zapisu;
- `daneAutomatyczne` — podpowiedź przygotowana przez przyszłe geokodowanie lub
  routing;
- `daneRobocze` — wartość świadomie używana przez aplikację i później przez
  harmonogram.

Model lokalizacji zawiera stabilne `idLokalizacji`, `typLokalizacji` oraz w
każdej warstwie:

- adres z tekstem, tekstem znormalizowanym i elastycznym obiektem `czesci`;
- opcjonalną parę współrzędnych geograficznych;
- `statusJakosci`, `zrodlo` i `czyKorektaReczna`.

Model trasy zawiera `idTrasy`, rodzaj relacji, kierunek, punkt początkowy i
docelowy oraz w każdej warstwie:

- `dystansDrogowyMetry` i `czasPrzejazduMinuty`;
- `statusJakosci`, `zrodlo` i `czyKorektaReczna`.

Punkty trasy wyznaczają kierunek: węzeł → budowa, budowa → węzeł albo budowa →
budowa. Model odrzuca niezgodny kierunek, ujemny czas lub dystans,
niekompletne współrzędne i wartości spoza zakresu geograficznego. Nie
przechowuje nazw ani pól charakterystycznych dla konkretnego dostawcy map.

## Niezmienniki bezpieczeństwa i zgodności

- Istniejące ręczne czasy i kompletne wartości bieżącego planu mają
  pierwszeństwo; automatyka ich cicho nie nadpisuje.
- Cache jest sprawdzany przed siecią.
- Adres niejednoznaczny nie jest automatycznie uznawany za poprawną
  lokalizację.
- Trasy są kierunkowe; `A → B` nie oznacza automatycznie `B → A`.
- Brak trasy nie staje się czasem `0`, trasą w linii prostej ani trasą przez
  domyślny węzeł.
- Brak internetu lub dostawcy map nie blokuje harmonogramu opartego na
  ręcznych albo zapamiętanych czasach.
- Rzeczywiste adresy operatora nie trafiają do repozytorium ani testów.

## Kryterium zamknięcia 6A.1

- zinwentaryzowano wszystkie moduły uczestniczące w przepływie trasy;
- wskazano `aplikacja.lokalizacje` jako jedną bramę domenową;
- zapisano dozwolone zależności oraz istniejące odstępstwa zgodnościowe;
- zachowano obecne działanie offline, ręczne czasy i interfejs;
- test automatyczny pilnuje granicy silnika i statusu planu.

## Kryterium zamknięcia 6A.2

- model ma jawną wersję `1`;
- lokalizacja i trasa mają niezależne warstwy źródłową, automatyczną i roboczą;
- adres, współrzędne, dystans, czas, jakość, źródło i ręczna korekta mają
  jednoznaczne miejsce;
- trasa zachowuje oba punkty i kierunek;
- konstruktory walidują liczby, współrzędne, statusy i zgodność relacji;
- dotychczasowa brama `aplikacja.lokalizacje` pozostaje dostępna.

## Migracja zgodnościowa 6A.3

Każda budowa używana przez aplikację przechowuje trzy pola:

- `modelLokalizacji` — lokalizacja budowy;
- `modelTrasyDojazdu` — kierunek domyślny węzeł → budowa;
- `modelTrasyPowrotu` — kierunek budowa → domyślny węzeł.

Starsze płaskie czasy są przy pierwszym użyciu przenoszone do warstwy źródłowej
i roboczej. Czas ze źródłem `mapa` trafia również do warstwy automatycznej.
Trafienie w dotychczasowej książce tras zasila warstwę roboczą ze źródłem
`pamiec`, bez przedwczesnej zmiany formatu cache `v1`.

Ręczna warstwa robocza ma pierwszeństwo przed niespójną płaską wartością
automatyczną. Ręczna edycja z tabeli przechodzi przez
`aplikacja.lokalizacje.zmienCzasRoboczyBudowy`, zachowuje podpowiedź
automatyczną i aktualizuje zgodnościowe płaskie pole używane przez silnik.
Usunięcie ręcznej wartości jest świadomą zmianą i nie przywraca jej samoczynnie.

Zapis planu aplikacji ma wersję `4` i przechowuje wszystkie trzy modele. Starszy
plan bez modeli jest migrowany przy odtworzeniu oraz ponownie zapisany. Moduł
harmonogramu nadal nie odczytuje modeli, pamięci ani sieci — otrzymuje wyłącznie
gotowe płaskie wartości robocze.

## Kryterium zamknięcia 6A.3

- starsze plany zachowują czasy i otrzymują modele wersji `1`;
- obecna książka tras nadal zasila plan przed ewentualną usługą mapową;
- ręczna wartość nie jest nadpisywana przez cache ani automatykę;
- edycja ręczna przechodzi przez jedną bramę domenową;
- zapis i odtworzenie zachowują trzy modele;
- silnik nie zna modeli lokalizacji, sieci ani konkretnego dostawcy map.

## Normalizacja 6B.2

Normalizacja nie zmienia `daneZrodlowe`. Powtarzalny tekst przeznaczony do
późniejszego wyszukania powstaje wyłącznie w `daneRobocze.adres`:

- istniejący pełny tekst adresu ma pierwszeństwo przed ponownym składaniem;
- jeżeli pełnego tekstu nie ma, znane części są składane w stałej kolejności:
  ulica i numer, kod i miejscowość, gmina, powiat, województwo, kraj;
- `tekstZnormalizowany` ujednolica wielkość liter, polskie znaki, interpunkcję i
  odstępy;
- normalizacja nie rozwija skrótów, nie stosuje podobieństwa tekstowego i nie
  może sama uznać dwóch swobodnych nazw za tę samą lokalizację;
- `idLokalizacji` nadal pochodzi ze stabilnego ID budowy, dlatego identyczny
  opis zgodnościowy nie scala różnych pozycji;
- starszy model wersji `1` jest uzupełniany bez nadpisywania tekstu ręcznej
  warstwy roboczej ani jej źródła;
- 6B.2 nie przyznaje statusu jakości i nie wywołuje sieci.

## Jakość adresu 6B.3

Lokalna ocena dotyczy wyłącznie warstwy `daneRobocze` i nie zmienia treści ani
statusu warstwy źródłowej. Obowiązują następujące zasady:

- `pelna` — adres ma ulicę, numer i miejscowość albo pełny tekst zawiera numer
  oraz wyraźnie rozdzielone części lub kod pocztowy;
- `niepelna` — danych jest dość do ostrożnej próby przyszłego wyszukania, ale
  wynik wymaga sprawdzenia;
- `niewystarczajaca` — danych jest za mało, a sama firma lub swobodna nazwa
  budowy nie są traktowane jako bezpieczny adres;
- `brak` — nie ma rzeczywistych danych adresowych;
- `niejednoznaczna` i `nieznaleziona` są jawnymi statusami przyszłego wyniku
  geokodowania i nie mogą być lokalnie zgadywane;
- `potwierdzona` oznacza świadomie zaakceptowaną lokalizację i nie jest
  nadpisywana ponowną lokalną oceną.

Każdy status ma prosty komunikat operatorski dostępny przez model lokalizacji.
Status adresu nie decyduje o możliwości użycia ręcznych lub zapamiętanych
czasów i nie może sam zatrzymać harmonogramu. 6B.3 nadal nie wykonuje zapytań
sieciowych ani nie wybiera dostawcy map.

Następny podetap projektu to **6C.1 — model węzła**.

## Model węzła 6C.1

Węzeł korzysta z tego samego kontraktu lokalizacji wersji `1` co budowa. Model
węzła ma postać:

```text
{
  wersjaKontraktu,
  idWezla,
  nazwa,
  modelLokalizacji
}
```

`modelLokalizacji` musi mieć `idLokalizacji` zgodne z `idWezla` i typ `wezel`.
Dzięki temu adres, współrzędne, status jakości, źródło i ręczna korekta nie są
duplikowane w drugim formacie. Bieżące trasy pobierają ID punktu węzła z
aktywnego modelu. Ustawianie danych przez operatora oraz trwała pamięć modelu
są świadomie pozostawione do **6C.2**.


## Ustawienie i pamięć węzła 6C.2

Aktywny węzeł korzysta z tego samego modelu `v1`, ale od 6C.2 jego dane mogą być
świadomie ustawione przez operatora i odtworzone z pamięci lokalnej.

Kontrakt zapisu:

- klucz: `harmonogramBetonowan.aktywnyWezel.v1`;
- wersja zapisu: `1`;
- wartość: pełny `modelWezla` oraz znacznik czasu zapisu;
- poprawny odczyt jest ponownie walidowany przez `utworzModelWezla`;
- niezgodna wersja nie jest automatycznie nadpisywana;
- uszkodzony zapis jest pomijany, a aplikacja wraca do modelu startowego;
- brak `localStorage` przełącza pamięć na bieżącą sesję.

Korekta operatora nie zmienia `idWezla`. Różne fizyczne węzły i osobne ID są
zakresem 6C.3.


## Zakres wielu węzłów 6C.3

Od 6C.3 modele używane przez aplikację są jawnie zakresowane aktywnym węzłem.
`idLokalizacji` i `idTrasy` pozostają zgodnymi wstecz identyfikatorami domenowymi,
a osobne pola zakresu zapobiegają mieszaniu danych pomiędzy betoniarniami:

- `modelLokalizacji.idWezla` wskazuje węzeł, w którego kontekście używana jest lokalizacja;
- `modelLokalizacji.kluczLokalizacji` ma postać `ID_WEZLA::lokalizacja::ID_LOKALIZACJI`;
- `modelTrasy.idWezla` wskazuje węzeł zakresu trasy;
- `modelTrasy.kluczTrasy` ma postać `ID_WEZLA::trasa::PUNKT_A->PUNKT_B`;
- dla trasy węzeł ↔ budowa ID węzła jest wyznaczane z punktu typu `wezel`;
- dla przyszłej relacji budowa → budowa ID węzła musi zostać przekazane jawnie, aby trasa pompy nie była współdzielona pomiędzy betoniarniami.

Pamięć tras `v1` nadal zachowuje obecny format, ale wymaga jawnego `idWezla` przy zapisie i odczycie. Brak ID jest błędem, a nie sygnałem do użycia `wezel-domyslny`. Pełne rozszerzenie formatu pamięci, adresy, współrzędne i migracja należą do 6D.1.


## Pamięć tras v2 — 6D.1

Format trwałej książki tras jest niezależnie wersjonowany od kontraktu domenowego lokalizacji i tras. W 6D.1 książka przechodzi z `v1` na `v2`, podczas gdy `wersjaKontraktu` modeli domenowych pozostaje `1`.

`v2` może przechować adres i współrzędne lokalizacji, dystanse kierunkowe, oba czasy przejazdu, pierwotne źródła czasu, ogólne źródło danych, identyfikator dostawcy oraz daty utworzenia, aktualizacji i ostatniego użycia. Brak tych metadanych po migracji starego wpisu jest poprawnym stanem i nie unieważnia zachowanych ręcznych czasów.

Migracja jest jednokierunkową kopią: gdy nie ma zapisu `v2`, poprawny `v1` zostaje przekształcony i zapisany pod nowym kluczem, a oryginalny `v1` nie jest kasowany. 6D.1 nie zmienia jeszcze tożsamości wpisu; stabilny klucz na podstawie adresu lub współrzędnych należy do 6D.2.

## Stabilny klucz pamięci tras — 6D.2

Format książki pozostaje `v2`, ale tożsamość wpisu nie jest już oparta wyłącznie
na etykiecie `Firma | Budowa`. Klucz ma zawsze zakres `idWezla`, a część
lokalizacyjna jest wybierana deterministycznie w kolejności:

1. dokładna para współrzędnych po normalizacji liczbowej;
2. znormalizowany rzeczywisty adres;
3. dokładnie znormalizowany opis zgodnościowy — tylko gdy brakuje dwóch
   silniejszych danych.

Adres zawierający wyłącznie zgodnościowe części `firma`/`nazwaBudowy` nie jest
udawany jako rzeczywisty adres. Nie stosujemy podobieństwa tekstowego, odległości
współrzędnych ani innych progów fuzzy.

Stare wywołanie `pobierzTrase(opis, idWezla)` pozostaje zgodne: może odnaleźć
wpis przez dokładny opis tylko wtedy, gdy dla danego węzła istnieje najwyżej
jedna taka lokalizacja. Jeżeli ten sam opis występuje przy kilku stabilnych
adresach lub punktach, pamięć zwraca stan `niejednoznaczna-lokalizacja` zamiast
wybierać wpis automatycznie.

Istniejący zapis `v2` sprzed 6D.2 jest rozpoznawany przy pierwszym odczycie,
przekluczowany według powyższej reguły i zapisany ponownie jako `v2`. Jeżeli
kilka starych etykiet prowadzi do dokładnie tego samego stabilnego klucza,
zostaje jeden, najnowszy wpis. Migracja `v1 → v2` z 6D.1 nadal działa, a wpisy
bez adresu i współrzędnych zachowują opis zgodnościowy, więc wcześniejsze ręczne
czasy nie znikają.


## Cache i lokalne podpowiedzi — 6D.3

Po 6D.3 brama `aplikacja.lokalizacje` rozróżnia dwa poziomy użycia pamięci:

1. **dokładne trafienie stabilnej tożsamości** — może automatycznie zasilić robocze czasy i kończy przepływ przed internetem;
2. **lokalne wyszukanie kandydatów** — zwraca podpowiedzi, ale nie zmienia budowy i nie wybiera wpisu automatycznie.

Wyszukiwanie działa wyłącznie na lokalnej książce `v2`, w obrębie aktywnego `idWezla`, i przeszukuje znormalizowaną etykietę oraz rzeczywisty adres. To wyszukiwanie deterministyczne: wszystkie słowa zapytania muszą występować w danych wpisu. Nie jest to fuzzy matching ani reguła tożsamości.

Jeżeli po braku dokładnego cache istnieje co najmniej jedna lokalna podpowiedź, `pobierzLubUstalTrase` zwraca stan `wymagany-wybor-z-pamieci` i **nie wywołuje adaptera internetowego**. Operator albo późniejszy interfejs może zastosować wyłącznie konkretny wpis wskazany przez jego pełny `kluczTrasy`.

Świadomie wybrany wpis może uzupełnić roboczy adres lub współrzędne oraz oba czasy ze źródłem `pamiec`, ale nie zmienia `daneZrodlowe`. Jeżeli budowa ma już którykolwiek roboczy czas, wybór z pamięci go nie nadpisuje. Samo wyszukiwanie nie aktualizuje `ostatnioUzyto`; data zmienia się dopiero po faktycznym odczycie wybranego wpisu.

Kolejność bramy po 6D.3: **bieżące czasy → dokładny cache → lokalne podpowiedzi wymagające wyboru → adapter internetowy → jawny brak trasy**. Konkretna usługa mapowa nie należy do 6D. W 6E.1 wybrano openrouteservice / HeiGIT do pierwszej integracji, natomiast jej wywołanie pozostaje zakresem neutralnego adaptera 6E.2.


## Granica dostawcy po 6E.1

Do pierwszej integracji wybrano **openrouteservice / HeiGIT**, ale ta decyzja nie rozszerza kontraktu domenowego o pola konkretnej usługi. Obowiązuje następująca granica:

- `aplikacja.lokalizacje` i model wersji `1` operują wyłącznie na własnych danych projektu;
- endpoint `api.heigit.org`, klucz API, limity, nagłówki i format odpowiedzi są szczegółami adaptera;
- adapter ma przekształcić wynik dostawcy do istniejącego modelu lokalizacji albo trasy i nie może sam zmieniać budowy, cache ani harmonogramu;
- późniejszy adapter TomTom lub innego dostawcy może zastąpić albo uzupełnić openrouteservice bez zmiany silnika;
- testy adaptera nie wykonują rzeczywistych zapytań sieciowych;
- ręczna korekta i dokładny cache nadal mają pierwszeństwo przed usługą zewnętrzną.

Implementacja tej granicy jest zakresem **6E.2 — neutralny adapter**.


## Neutralny adapter usług mapowych — 6E.2

Warstwa `aplikacja.uslugiMapowe` jest jedynym miejscem, w którym mogą występować szczegóły konkretnego dostawcy usług geokodowania i routingu. Jej kontrakt ma wersję `1` i udostępnia dwie podstawowe operacje:

- `geokoduj({ tekstAdresu, limitWynikow })` → neutralna lista kandydatów z adresem, współrzędnymi, statusem `nieoceniona` i źródłem `mapa`;
- `wyznaczTrase({ punktPoczatkowy, punktDocelowy, profilPojazdu })` → neutralny dystans drogowy w metrach, czas przejazdu w minutach i źródło `mapa`.

Dodatkowa metoda `pobierzTraseDlaBudowy` jest mostem zgodnościowym do istniejącej bramy `pobierzLubUstalTrase`: wyznacza niezależnie kierunek węzeł → budowa oraz budowa → węzeł, ale tylko wtedy, gdy oba punkty mają robocze współrzędne. Brama nadal sprawdza bieżące czasy, dokładny cache i lokalne podpowiedzi przed jakimkolwiek wywołaniem adaptera.

Implementacja openrouteservice pozostaje wewnątrz adaptera. Do silnika harmonogramu i modeli domenowych nie mogą przenikać `api.heigit.org`, profil `driving-hgv`, nagłówek autoryzacji, nazwy pól ograniczeń dostawcy ani surowa odpowiedź HTTP. Klucz API jest przekazywany adapterowi wyłącznie w runtime i nie może być zapisywany w danych projektu.

6E.2 normalizuje poprawne wyniki i utrzymuje wymienność dostawcy. Ujednolicone statusy dla timeoutu, braku sieci, limitu, HTTP 5xx i wadliwej odpowiedzi należą do 6E.3.
