# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-09-03

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **6H.3 — brak trasy i tryb offline**.
- Punkty **5A–5J** są zakończone.
- Cały **Etap 5 — Pełny silnik harmonogramu, konflikty i korekty** jest zakończony.
- **Etap 6** jest rozpoczęty. Punkty **6A–6H** są zakończone; cały Etap 6 pozostaje otwarty.
- Punkt **6H** jest zakończony.
- Pełna regresja po 6H.3 przechodzi **119/119 zestawów testów**.
- `KONTRAKT_LOKALIZACJI_I_TRAS.md` wskazuje `aplikacja.lokalizacje` jako jedną
  bramę roboczego wyniku trasy i opisuje model danych wersji `1`.
- `js/lokalizacje/model_lokalizacji_i_trasy.js` rozdziela dane źródłowe,
  automatyczne i robocze lokalizacji oraz kierunkowej trasy.
- Starsze plany i książka tras `v1` są podłączane do nowego modelu bez utraty
  ręcznych czasów. Zapis planu aplikacji ma wersję `4` i przechowuje modele.
- Importer rozpoznaje pełny adres albo osobne części adresu w zmiennym układzie
  KDX/CSV, zachowując nazwę budowy jako oddzielną informację.
- Źródłowy adres pozostaje nienadpisany, a warstwa robocza ma deterministycznie
  składany tekst i `tekstZnormalizowany` do późniejszego wyszukania.
- Normalizacja nie używa podobieństwa tekstowego; stabilne `idLokalizacji` nadal
  rozdziela różne budowy nawet przy identycznym swobodnym opisie.
- Warstwa robocza lokalnie rozróżnia adres pełny, niepełny, niewystarczający
  i brak adresu; statusy niejednoznaczny i nieznaleziony są przygotowane na
  jawny wynik późniejszego geokodowania.
- Każdy status ma prosty komunikat dla operatora, a słaby adres nie blokuje
  ręcznych ani zapamiętanych czasów przejazdu.
- Aktywny węzeł ma własny model ze stabilnym ID, nazwą oraz wersjonowanym
  modelem lokalizacji przechowującym adres i współrzędne.
- Bieżące modele tras, pamięć tras i przyszłe zapytanie mapowe pobierają ID z
  modelu aktywnego węzła.
- Operator może świadomie ustawić nazwę, adres albo pełne współrzędne aktywnego
  węzła w kompaktowym formularzu; korekta nie zmienia jego stabilnego ID.
- Dane węzła są wersjonowane i lokalnie zapamiętywane, a przy niedostępnej
  pamięci trwałej działają do końca bieżącej sesji.
- Modele lokalizacji i tras mają jawny zakres `idWezla` oraz klucze zawierające
  ID węzła; identyczne budowy z różnych betoniarni nie współdzielą wpisu cache.
- Pamięć tras nie uzupełnia już brakującego ID węzła wartością domyślną.
- Książka tras ma format `v2`: przechowuje adres, współrzędne, dystanse, oba kierunki czasu, źródło, dostawcę danych i daty.
- Gdy `v2` nie istnieje, wcześniejsza książka `v1` jest bezpiecznie kopiowana do nowego formatu; oryginalny zapis `v1` pozostaje kopią bezpieczeństwa.
- Tożsamość wpisu pamięci tras preferuje współrzędne, potem znormalizowany rzeczywisty adres; opis `Firma | Budowa` jest tylko ścieżką zgodnościową.
- Ten sam opis przy różnych adresach pozostaje rozdzielony, a opis bez adresu nie wybiera automatycznie między kilkoma zapamiętanymi lokalizacjami.
- Po braku dokładnego trafienia aplikacja przeszukuje pamięć lokalnie przed internetem; znalezione wpisy są tylko podpowiedziami i wymagają jawnego wyboru konkretnego klucza trasy.
- Okno zapisanych tras pozwala offline wyszukiwać po nazwie i adresie, a samo wyszukiwanie nie zmienia wpisu ani daty ostatniego użycia.
- Do pierwszej integracji internetowej wybrano **openrouteservice / HeiGIT** i aktualny host `api.heigit.org`; routing ciężarowy ma korzystać z profilu `driving-hgv`.
- **TomTom** pozostaje pierwszym kandydatem do dodatkowego adaptera, jeżeli później potrzebne będą bieżące dane o ruchu drogowym.
- Klucz API dostawcy nie trafia do repozytorium, planu ani diagnostyki; nazwa dostawcy, endpoint i sposób autoryzacji mają pozostać za neutralnym adapterem.
- `js/lokalizacje/adapter_uslug_mapowych.js` wystawia własny kontrakt geokodowania i routingu, niezależny od formatu konkretnego API.
- Implementacja openrouteservice mapuje adresy, współrzędne, dystans, czas i ograniczenia HGV wewnątrz adaptera; surowa odpowiedź dostawcy nie przechodzi do silnika.
- Brama lokalizacji przyjmuje zarówno starszą funkcję mapową, jak i obiekt neutralnego adaptera, zachowując kolejność bieżące czasy → dokładny cache → lokalne podpowiedzi → internet.
- Błędy zewnętrznej usługi są neutralizowane do stałych statusów projektu; timeout, brak sieci, limit, HTTP 4xx/5xx i wadliwa odpowiedź nie przerywają działania harmonogramu.
- Diagnostyka błędu mapy nie zapisuje adresów, URL-i, surowych odpowiedzi ani klucza API.
- Geokodowanie budowy jest uruchamiane tylko dla adresów wystarczających do wyszukania i dopiero po sprawdzeniu zapisanych danych lokalnych.
- Pojedynczy wynik geokodowania jest zapisywany w `daneAutomatyczne` ze źródłem `mapa`; nie staje się roboczą, potwierdzoną lokalizacją bez decyzji operatora.
- Brak wyniku i wiele wyników są jawnie rozróżniane, a pierwszy kandydat nigdy nie jest wybierany po cichu.
- Kandydaci geokodowania mają neutralny poziom pewności `wysoka`, `srednia`, `niska` albo `brak-oceny`; jest to wyłącznie wskazówka dla operatora.
- Okno kandydatów pozwala świadomie wybrać konkretny wynik albo ręcznie poprawić adres i współrzędne. Wybrany kandydat staje się `potwierdzona` lokalizacją roboczą dopiero po kliknięciu operatora.
- Ręczne współrzędne tworzą potwierdzoną lokalizację ze źródłem `reczny`; sama korekta adresu bez współrzędnych usuwa stare współrzędne i wymaga ponownego geokodowania zamiast udawać potwierdzony punkt.
- `js/lokalizacje/kontrakt_trasy_kierunkowej.js` definiuje kontrakt 6G.1 dla relacji węzeł ↔ budowa: dwa jawne kierunki, punkty końcowe z pełnymi współrzędnymi, drogowy dystans, czas przejazdu, źródło oraz datę wyznaczenia.
- Routing węzeł ↔ budowa może być przygotowany dopiero wtedy, gdy aktywny węzeł ma pełne współrzędne, a lokalizacja robocza budowy ma status `potwierdzona` i pełne współrzędne.
- `js/lokalizacje/routing_wezel_budowa.js` realizuje 6G.2: wywołuje neutralny adapter osobno dla `do-budowy` i `do-wezla`, przekazuje profil pojazdu i waliduje oba wyniki przez kontrakt 6G.1.
- Błąd pierwszego kierunku zatrzymuje drugi; timeout, brak adaptera, niegotowa lokalizacja i niepoprawne liczby zwracają jawny status zamiast częściowej trasy.
- Wynik 6G.2 zachowuje oddzielny dystans, czas, kierunek, punkty, źródło i wspólną datę wyznaczenia dla obu kierunków.
- `js/lokalizacje/wartosci_trasy_wezel_budowa.js` realizuje 6G.3: zapisuje zweryfikowany wynik routingu do `daneAutomatyczne` obu kierunkowych modeli i synchronizuje wartość roboczą tylko wtedy, gdy nie chroni jej decyzja operatora ani cache/import.
- Ręczny, zapamiętany albo źródłowy czas roboczy nie jest cicho nadpisywany nowym wynikiem mapy; automatyczna podpowiedź pozostaje zachowana obok i może być świadomie przywrócona osobno dla dojazdu, powrotu albo obu kierunków.
- Brama udostępnia stan wartości roboczej i automatycznej razem ze źródłem oraz informacją, czy istnieje wartość automatyczna możliwa do przywrócenia; docelowe pokazanie tych danych w tabeli należy do 6I.1.
- `index.html` ładuje teraz kolejno kontrakt 6G.1, routing 6G.2 i warstwę wartości 6G.3, dzięki czemu mechanizm jest dostępny także w wersji przeglądarkowej, a nie wyłącznie w testach Node.js.
- `js/lokalizacje/routing_budowa_budowa.js` realizuje 6H.1: wymaga dwóch różnych, potwierdzonych lokalizacji budów z pełnymi współrzędnymi i przygotowuje dwie niezależne relacje kierunkowe.
- Routing `A → B` oraz `B → A` jest wywoływany osobno przez ten sam neutralny adapter, dzięki czemu każdy kierunek może mieć inny dystans i czas przejazdu.
- Wynik 6H.1 zachowuje punkty końcowe, drogowy dystans, czas, źródło i datę; błąd dowolnego kierunku nie pozostawia częściowego wyniku.
- `js/lokalizacje/integracja_przejazdow_pomp.js` realizuje 6H.2: waliduje oba kierunki wyniku 6H.1, a następnie zasila istniejące `przejazdyPompyMinuty` i `zrodlaPrzejazdowPompy`, z których już korzystają panel i centralny provider `czasPrzejazduMinuty`.
- Istniejący czas ze źródła `reczny`, `csv` albo `pamiec` jest chroniony przed automatycznym nadpisaniem; brakującą wartość może zasilić mapa lub pamięć, a poprzedni wynik ze źródła `mapa` może zostać odświeżony.
- Oba kierunki są sprawdzane przed pierwszą mutacją, więc błędny wynik odwrotny nie pozostawia częściowo zmienionej mapy przejazdów. Algorytm przydziału pomp nie został przebudowany — nadal korzysta z tego samego kontraktu danych.
- `index.html` ładuje moduły 6H.1 i 6H.2 przed `harmonogram.js`, więc mechanizm jest dostępny w zwykłym uruchomieniu przeglądarkowym.
- 6H.3 rozszerza tę samą bramę o jawny stan każdego kierunku: `gotowy` albo `brak-trasy`, wraz z informacją o źródle, możliwości użycia offline i możliwości ręcznego wpisania czasu.
- Jeżeli oba kierunki mają już poprawny czas — także ze źródła `pamiec` albo z wcześniej zapisanego wyniku `mapa` — `pobierzIZastosujTrasyPrzejazdowPomp` używa ich bez wywołania adaptera mapowego.
- Brak adaptera, brak sieci albo inny błąd routingu nie kasuje istniejącego kierunku. Częściowo znana para pozostaje dostępna offline, a brakujący kierunek może być nadal uzupełniony ręcznie w istniejącym panelu przejazdów pomp.
- Centralne przeliczanie harmonogramu nadal wyłącznie odczytuje `przejazdyPompyMinuty`; nie wywołuje routingu ani adaptera mapowego. Gdy potrzebny kierunek nie ma czasu, silnik pomp zwraca `brak-trasy`, z którego powstaje jawny konflikt dla operatora.

## Potwierdzenie końcowej publikacji 5J.2

- końcowy commit `main`: `5a78bc2e0ce56343fae4831f4dc3c3822cb22fc9`;
- GitHub Actions `Testy automatyczne`: run `33397802083` — `success`;
- GitHub Pages: run `33397801203` — `success`;
- `pages_build_version`: `5a78bc2e0ce56343fae4831f4dc3c3822cb22fc9`;
- adres: `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`.

## Wynik testu operatora 5J.3 — 2026-09-02

Instrukcja: `testy/SCENARIUSZ_OPERATORA_5J_3.md`.

Dane: `przyklady/5j3_test_operatora.csv`.

Automatyczna kontrola scenariusza: `testy/etap_5j_3_przygotowanie.test.js`.

### Scenariusz A — OK

- jedna gruszka;
- jedna aktywna pompa 32 m od 07:00;
- przejazdy pompy A → B, A → C i B → C ustawione na 0 min;
- globalny limit startu 30 min;
- testowy limit przestoju 5 min;
- potwierdzone `StartRoboczy`: A `08:00`, B `09:30`, C `11:25`;
- potwierdzony konflikt limitu C: 35 min opóźnienia przy limicie 30 min;
- potwierdzony czytelny konflikt przestoju;
- potwierdzone opóźnienie kursów z powodu jednej gruszki.

### Scenariusz B — OK

- B1: `0` gruszek → potwierdzony jawny konflikt **Brak gruszki**;
- B2: `1` gruszka i `0` pomp → potwierdzone trzy jawne konflikty
  **Brak pompy** dla budów A, B i C.

## Następny krok

Rozpocząć **6I.1 — widoczny wynik trasy przy budowie**. Pokazać operatorowi w tabeli wartość roboczą i automatyczną, źródło danych oraz stan wymagający uwagi bez zmiany zasad priorytetu wypracowanych w 6G–6H.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md`, `STAN_PROJEKTU.md` i `testy/SCENARIUSZ_OPERATORA_5J_3.md`, a następnie sprawdzić aktualny `main`.
