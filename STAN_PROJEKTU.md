# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5F.3 — klasyfikacja wyniku**.
- Commit z implementacją 5F.3 na `main`: `d58cf0b8074c64436d1396ff96365688d532a49f`.
- Cały punkt **5F — limit opóźnienia rozpoczęcia budowy** jest zakończony.
- Etapy 5A–5F są zakończone; cały Etap 5 pozostaje otwarty.
- Pełna regresja po 5F.3: **82 zestawy testów — wszystkie poprawne**.
- GitHub Actions dla commita 5F.3 zakończył się powodzeniem.
- GitHub Pages po 5F.3 został poprawnie zbudowany i wdrożony.

## Co działa po 5F.3

- globalny limit opóźnienia startu jest parametrem programu; domyślnie `30 min`;
- każda budowa może mieć własny `maksymalneOpoznienieStartuBudowyMinuty`;
- brak wartości indywidualnej oznacza dziedziczenie limitu globalnego, a `0` jest prawidłowym wyjątkiem;
- klasyfikacja korzysta z końcowego `StartRoboczy` po stabilizacji harmonogramu;
- każda budowa otrzymuje `ocenaOpoznieniaStartu` z obiema godzinami, pełnym opóźnieniem, użytym limitem i liczbą minut ponad limit;
- brak opóźnienia ma status `bez-opoznienia`;
- dodatnie przesunięcie mniejsze lub równe limitowi ma status `korekta-w-limicie` i nie tworzy konfliktu;
- ścisłe przekroczenie tworzy konflikt `PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU` przypisany do konkretnej budowy;
- konflikt podaje `StartZadany`, `StartRoboczy`, pełne opóźnienie, efektywny limit i liczbę minut przekroczenia;
- źródłowe budowy z importu nie są mutowane, a identyczne przeliczenia dają identyczną klasyfikację;
- porównanie godzin uwzględnia przejście przez północ.

## Następny krok

**5G.1 — osobna definicja przestoju podczas betonowania.**

Zakres następnego podetapu:

1. liczyć przestój pomiędzy rzeczywistym końcem rozładunku poprzedniej dostawy a rzeczywistym początkiem następnej dostawy tej samej budowy;
2. nie mylić opóźnienia pierwszej dostawy i rozpoczęcia budowy z przestojem podczas już trwającego betonowania;
3. oprzeć obliczenie wyłącznie na faktycznie przydzielonych kursach po sprzężonym przeliczeniu;
4. wskazywać konkretną parę dostaw i długość przerwy, jeszcze bez klasyfikowania jej według przyszłego parametru `MaksPrzestojMin` z 5G.2;
5. dodać test 5G.1 i uruchomić pełną regresję;
6. po zaliczeniu zaktualizować dokumentację, wysłać zmianę na `main` i sprawdzić GitHub Pages.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5G.1.

