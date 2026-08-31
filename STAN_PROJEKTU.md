# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5J.2 — publikacja**.
- Punkty **5A–5I** oraz **5J.1–5J.2** są zakończone.
- **5J.3 jest przygotowany, ale nie został jeszcze wykonany przez operatora.**
- Punkt **5J** i cały **Etap 5** pozostają otwarte wyłącznie do zaliczenia testu operatora 5J.3.
- Repo po przygotowaniu 5J.3 powinno przechodzić **94/94 zestawy testów**.

## Potwierdzenie końcowej publikacji 5J.2

- końcowy commit `main`: `5a78bc2e0ce56343fae4831f4dc3c3822cb22fc9`;
- GitHub Actions `Testy automatyczne`: run `33397802083` — `success`;
- GitHub Pages: run `33397801203` — `success`;
- `pages_build_version`: `5a78bc2e0ce56343fae4831f4dc3c3822cb22fc9`;
- adres: `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`.

## Gotowy test operatora 5J.3

Instrukcja: `testy/SCENARIUSZ_OPERATORA_5J_3.md`.

Dane: `przyklady/5j3_test_operatora.csv`.

Automatyczna kontrola scenariusza: `testy/etap_5j_3_przygotowanie.test.js`.

### Scenariusz A — główny

- jedna gruszka;
- jedna aktywna pompa 32 m od 07:00;
- przejazdy pompy A → B, A → C i B → C ustawione na 0 min;
- globalny limit startu 30 min;
- testowy limit przestoju 5 min;
- oczekiwane `StartRoboczy`: A `08:00`, B `09:30`, C `11:25`;
- oczekiwany konflikt limitu C: 35 min opóźnienia przy limicie 30 min;
- oczekiwany co najmniej jeden czytelny konflikt przestoju;
- widoczne opóźnienie co najmniej jednego kursu z powodu jednej gruszki.

### Scenariusz B — brak zasobu

- B1: ustawić `0` gruszek → oczekiwany jawny **Brak gruszki**;
- B2: przywrócić `1` gruszkę i ustawić `0` pomp → oczekiwany jawny **Brak pompy**.

Operator po wykonaniu podaje tylko:

- `A — OK / NIE`;
- `B1 — OK / NIE`;
- `B2 — OK / NIE`.

Przy niezgodności najlepiej dołączyć zrzut ekranu.

## Następny krok

Gdy operator będzie przy komputerze, wykonać dokładnie `testy/SCENARIUSZ_OPERATORA_5J_3.md`. Dopiero po wyniku A/B1/B2 można oznaczyć **5J.3**, **5J** i cały **Etap 5** jako zakończone.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md`, `STAN_PROJEKTU.md` i `testy/SCENARIUSZ_OPERATORA_5J_3.md`, a następnie sprawdzić aktualny `main`.
