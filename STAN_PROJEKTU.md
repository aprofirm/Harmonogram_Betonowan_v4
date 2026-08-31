# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5J.1 — pełna regresja automatyczna Etapu 5**.
- Punkty **5A–5I** oraz **5J.1** są zakończone; punkt 5J i cały Etap 5 pozostają otwarte.
- Końcowy test `testy/etap_5j_1.test.js` pilnuje obecności wszystkich 27 testów 5A–5I oraz kluczowej regresji wcześniejszych etapów.
- `testy/TESTY_ETAP_5.md` jest zsynchronizowany z faktycznym stanem 5G.3, 5H i 5I.
- Pełny runner `.github/workflows/testy.yml` uruchamia każdy `testy/*.test.js` dla `main` i pull requestów.
- Po dodaniu 5J.1 pełna regresja obejmuje **92 zestawy testów**.
- 5J.1 nie zmienia logiki planowania, konfliktów, gruszek ani pomp.

## Zakres potwierdzony przez 5J.1

- import KDX/CSV i zmienne kolumny;
- pamięć planu, historia, pamięć tras i ponowne odtwarzanie;
- Etap 3 — generowanie kursów, przydział gruszek i ograniczona flota;
- Etap 4 — pompy, przejazdy, dostępność i oba tryby zasobów;
- Etap 5 — StartPlanowany/StartZadany/StartRoboczy, sprzężenie pomp i gruszek, kaskady, stabilizacja, limity startu, przestoje, wspólny kontrakt konfliktów, tekst operatorski, interfejs i stan nieaktualny.

## Następny krok

**5J.2 — publikacja.**

Zakres:

1. potwierdzić aktualny `main` po 5J.1;
2. potwierdzić zielony GitHub Actions dla pełnych 92 testów;
3. potwierdzić poprawne GitHub Pages dla tego samego stanu;
4. nie dodawać nowych funkcji biznesowych;
5. po publikacji przejść do **5J.3 — test operatora**.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5J.2.
