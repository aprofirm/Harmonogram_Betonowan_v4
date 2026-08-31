# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5J.2 — publikacja**.
- Punkty **5A–5I** oraz **5J.1–5J.2** są zakończone.
- Punkt **5J** i cały **Etap 5** pozostają otwarte wyłącznie dlatego, że nie wykonano jeszcze testu operatora 5J.3.
- Pełna regresja po 5J.1 obejmuje **92 zestawy testów**; po dodaniu strażnika 5J.2 repo zawiera **93 zestawy**.
- 5J.2 nie zmienia logiki planowania, konfliktów, gruszek ani pomp.

## Potwierdzenie publikacji 5J.2

- zweryfikowany commit `main`: `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;
- GitHub Actions `Testy automatyczne`: run `33396511183` — `success`;
- GitHub Pages: run `33396509870` — `success`;
- `pages_build_version`: `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;
- środowisko deploymentu wskazało: `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`.

Po scaleniu zapisu 5J.2 trzeba ponownie potwierdzić zielone Actions i Pages dla końcowego commita `main`.

## Następny krok

**5J.3 — test operatora.**

Test ma objąć na rzeczywistym planie co najmniej:

1. przesunięcie budowy przez pompę;
2. niedobór gruszek;
3. kaskadę kilku budów;
4. przekroczenie limitu startu;
5. przestój pomiędzy dostawami;
6. brak możliwego zasobu.

Dopiero po zaliczeniu 5J.3 można zamknąć **5J i cały Etap 5**.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5J.3.
