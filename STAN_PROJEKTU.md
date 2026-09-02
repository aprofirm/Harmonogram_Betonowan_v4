# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-09-02

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **6B.2 — normalizacja bez utraty źródła**.
- Punkty **5A–5J** są zakończone.
- Cały **Etap 5 — Pełny silnik harmonogramu, konflikty i korekty** jest zakończony.
- **Etap 6** jest rozpoczęty. Podetapy **6A.1–6A.3**, cały punkt **6A** oraz
  podetapy **6B.1–6B.2** są zakończone; punkt 6B i cały Etap 6 pozostają otwarte.
- Pełna regresja po 6B.2 przechodzi **100/100 zestawów testów**.
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

Rozpocząć **6B.3 — statusy i komunikaty adresu**. Lokalnie rozróżnić adres
pełny, niepełny, zbyt ubogi, niejednoznaczny i nieznaleziony. Brak lub słaba
jakość adresu nie mogą blokować ręcznych czasów ani harmonogramu. Konkretnej
usługi mapowej nadal nie podłączać — jej porównanie i wybór należą do **6E.1**.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md`, `STAN_PROJEKTU.md` i `testy/SCENARIUSZ_OPERATORA_5J_3.md`, a następnie sprawdzić aktualny `main`.
