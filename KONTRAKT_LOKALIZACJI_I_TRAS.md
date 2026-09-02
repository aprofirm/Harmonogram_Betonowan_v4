# Kontrakt lokalizacji i tras — granice modułów

Status: **6A.1–6A.3 i 6B.1–6B.3 oraz całe punkty 6A–6B zakończone 2026-09-02**.

Ten dokument opisuje wynik inwentaryzacji 6A.1, model danych wersji `1`
wdrożony w 6A.2 oraz migrację zgodnościową z 6A.3. Ustala miejsce, w którym
powstaje roboczy wynik trasy,
odpowiedzialności obecnych modułów i rozdział danych źródłowych, automatycznych
oraz roboczych. Nie podłącza dostawcy map i nie zmienia dotychczasowego
działania interfejsu.

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
| `js/pamiec/pamiec_tras.js` | Zapisuje wersję `v1` lokalnej książki tras i rozpoznaje dokładny klucz. | Jest wyłącznie trwałą pamięcią przyjętych danych; nie mutuje modelu i nie wyznacza tras. |
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
