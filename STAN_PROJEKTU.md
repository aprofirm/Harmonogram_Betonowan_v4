# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-30

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5F.2 — limit indywidualny budowy**.
- Commit z implementacją 5F.2 na `main`: `d8ec8a73da49319b1ef06462fd9864b85dad415a`.
- Punkt nadrzędny **5F — limit opóźnienia rozpoczęcia budowy** pozostaje otwarty.
- Etapy 5A–5E są zakończone.
- 5F.1 i 5F.2 są zakończone.
- Pełna regresja po 5F.2 przeszła poprawnie na PR i po scaleniu do `main`.
- GitHub Pages po 5F.2 został poprawnie zbudowany i wdrożony.

## Co działa po 5F.2

- globalny limit opóźnienia startu jest parametrem programu; domyślnie `30 min`;
- każda budowa może mieć własny `maksymalneOpoznienieStartuBudowyMinuty`;
- brak wartości indywidualnej oznacza dziedziczenie limitu globalnego;
- `0` jest prawidłowym limitem indywidualnym;
- operator może usunąć wyjątek przyciskiem `↺` i wrócić do limitu globalnego;
- wyjątek budowy jest zachowywany w bieżącym planie i historii;
- starsze zapisane plany bez nowego pola nadal działają i korzystają z limitu globalnego;
- 5F.2 nie klasyfikuje jeszcze przekroczenia limitu jako konfliktu.

## Następny krok

**5F.3 — klasyfikacja wyniku.**

Zakres następnego podetapu:

1. dla każdej budowy wyznaczyć efektywny limit: indywidualny, jeżeli istnieje, w przeciwnym razie globalny;
2. porównać faktyczne przesunięcie `StartRoboczy` względem `StartZadany` z efektywnym limitem;
3. przesunięcie mieszczące się w limicie pozostawić jako zwykłą korektę;
4. przekroczenie limitu oznaczyć jako jawny konflikt z godziną i liczbą minut;
5. nie wyprzedzać jeszcze wspólnego modelu konfliktów z 5H bardziej, niż wymaga tego 5F.3;
6. dodać test 5F.3 i uruchomić pełną regresję;
7. po zaliczeniu zaktualizować dokumentację, scalić do `main` i sprawdzić GitHub Pages.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5F.3.
