# Kontrakt lokalizacji i tras — granice modułów

Status: **6A.1 zakończony 2026-09-02**.

Ten dokument jest technicznym wynikiem inwentaryzacji 6A.1. Ustala miejsce,
w którym powstaje roboczy wynik trasy, oraz odpowiedzialności obecnych modułów.
Nie definiuje jeszcze finalnego modelu pól z 6A.2, nie podłącza dostawcy map i
nie zmienia dotychczasowego działania interfejsu.

## Jedna brama domenowa

Jedyną bramą domenową dla wyboru, utworzenia i zastosowania roboczego wyniku
trasy jest moduł **`aplikacja.lokalizacje`** w
`js/lokalizacje/lokalizacje.js`.

Wszystkie źródła trasy — bieżący plan, import, ręczna wartość operatora,
`pamiecTras` oraz przyszły adapter map — mają zbiegać się w tej bramie. Dopiero
zaakceptowany wynik roboczy może zasilić model budowy albo istniejący kontrakt
przejazdu pompy. Silnik harmonogramu nie wybiera źródła i nie pobiera trasy.

Obecna funkcja `pobierzLubUstalTrase` jest pierwszym przepływem tej bramy:
zachowuje kolejność bieżące czasy → pamięć tras → wstrzyknięta funkcja mapowa →
jawny brak trasy. W 6A.2 zostanie oparta na wersjonowanym modelu, ale jej
bezpieczne pierwszeństwo źródeł pozostaje obowiązujące.

## Inwentaryzacja obecnych modułów

| Moduł | Obecna odpowiedzialność | Granica po 6A.1 |
| --- | --- | --- |
| `js/import/import_csv.js` | Rozpoznaje dane budowy i opcjonalne czasy, zachowuje pola źródłowe w `daneZrodlowe`. | Dostarcza dane źródłowe; nie geokoduje, nie wyznacza tras i nie wywołuje sieci. |
| `js/budowy/budowy.js` | Przechowuje i waliduje roboczy dojazd, powrót oraz ich źródła. | Jest modelem wartości używanych przez plan; nie ustala pierwszeństwa źródeł i nie zna dostawcy map. |
| `js/lokalizacje/lokalizacje.js` | Łączy budowę z książką tras i ma przepływ `pobierzLubUstalTrase`. | Jest jedyną bramą domenową roboczego wyniku trasy. |
| `js/pamiec/pamiec_tras.js` | Zapisuje wersję `v1` lokalnej książki tras i rozpoznaje dokładny klucz. | Jest wyłącznie trwałą pamięcią przyjętych danych; nie mutuje modelu i nie wyznacza tras. |
| `js/pompy/przejazdy_pomp.js` oraz moduły edycji przejazdów | Zużywają kierunkowe `czasPrzejazduMinuty` i `zrodloCzasuPrzejazdu`. | Nie pytają map ani pamięci; otrzymują przygotowany roboczy wynik relacji budowa → budowa. |
| `js/harmonogram/harmonogram.js` | Składa robocze budowy, kursy, pompy, gruszki i konflikty. | Otrzymuje gotowe wartości robocze; nie używa sieci, geokodowania ani `localStorage`. |
| `js/aplikacja.js` i interfejs | Importują dane, zbierają decyzje operatora i uruchamiają przeliczenie. | Sterują przepływem i prezentacją; nie implementują reguł routingu ani pierwszeństwa źródeł. |

## Obecne luki, które pozostają otwarte

- Budowa nie ma jeszcze oddzielnych pól adresu, współrzędnych, dystansu i
  statusu jakości lokalizacji.
- `pamiecTras` w wersji `v1` tworzy klucz z domyślnego ID węzła oraz tekstu
  `firma | budowa`, a nie z jednoznacznego adresu lub współrzędnych.
- Wstrzyknięta funkcja mapowa zwraca obecnie głównie czasy; pełny,
  wersjonowany wynik powstanie w 6A.2.
- Ręczna edycja czasu w interfejsie wywołuje dziś bezpośrednio prymityw modelu
  `budowy`, a następnie osobno zapisuje pamięć. Ta ścieżka pozostaje czasowo dla
  zgodności i ma przejść przez bramę `aplikacja.lokalizacje` w 6A.2–6A.3.
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

## Roboczy wynik trasy — wymagania przed modelem 6A.2

Dokładne nazwy i struktura pól należą do 6A.2. Już teraz każdy przyszły wynik
roboczy musi jednak jednoznacznie opisywać:

- rodzaj relacji: węzeł ↔ budowa albo budowa → budowa;
- oba punkty końcowe oraz kierunek;
- roboczy czas i, gdy jest znany, drogowy dystans;
- źródło, status jakości i informację o ręcznej korekcie;
- stan braku wyniku bez podstawiania fikcyjnego `0`;
- wersję kontraktu niezależną od formatu konkretnego dostawcy.

Pola charakterystyczne dla dostawcy map nie mogą przenikać do modelu silnika.

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

Następny podetap: **6A.2 — wersjonowany model lokalizacji i trasy**.
