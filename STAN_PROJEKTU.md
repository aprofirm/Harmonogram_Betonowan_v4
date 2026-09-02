# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-09-02

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **6F.2 — wiele wyników**.
- Punkty **5A–5J** są zakończone.
- Cały **Etap 5 — Pełny silnik harmonogramu, konflikty i korekty** jest zakończony.
- **Etap 6** jest rozpoczęty. Punkty **6A–6E** oraz **6F.1–6F.2** są zakończone; cały Etap 6 pozostaje otwarty.
- Pełna regresja po 6F.2 przechodzi **112/112 zestawów testów**.
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
- Gotowe okno kandydatów pokazuje adres, pewność, typ i współrzędne, ale 6F.2 nie stosuje jeszcze żadnego wyniku do warstwy roboczej.

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

Rozpocząć **6F.3 — ręczne wskazanie**. Pozwolić operatorowi świadomie wybrać jednego z kandydatów, poprawić adres albo podać pełne współrzędne; dopiero zatwierdzona lokalizacja ma trafić do warstwy roboczej jako `potwierdzona`.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md`, `STAN_PROJEKTU.md` i `testy/SCENARIUSZ_OPERATORA_5J_3.md`, a następnie sprawdzić aktualny `main`.
