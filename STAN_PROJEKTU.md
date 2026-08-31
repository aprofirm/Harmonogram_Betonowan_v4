# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5G.2 — parametr maksymalnego przestoju**.
- Commit z implementacją 5G.2 na `main`: `fc506f13859d2859ed5e0d0fdb6df6612b479dea`.
- Cały punkt **5F — limit opóźnienia rozpoczęcia budowy** oraz podetapy **5G.1–5G.2** są zakończone.
- Punkty 5A–5F są zakończone; punkt 5G i cały Etap 5 pozostają otwarte.
- Pełna regresja po 5G.2: **84 zestawy testów — wszystkie poprawne**.
- GitHub Actions dla commita 5G.2 zakończył się powodzeniem.
- GitHub Pages po 5G.2 został poprawnie zbudowany i wdrożony.

## Co działa po 5G.2

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
- porównanie godzin uwzględnia przejście przez północ;
- każda robocza budowa otrzymuje `analizaPrzestojowBetonowania` utworzoną z końcowego sprzężonego przydziału gruszek;
- analiza korzysta wyłącznie z kursów o statusie `przydzielony` i porządkuje je według rzeczywistego początku rozładunku;
- każda kolejna para dostaw zachowuje ID i numery obu kursów, rzeczywisty koniec poprzedniego rozładunku, rzeczywisty początek następnego oraz `przestojMinuty`;
- stykające się lub nakładające rozładunki mają `0 min`, a budowa bez przydzielonych dostaw albo z jedną dostawą ma pustą listę par;
- opóźnienie pierwszej dostawy nie jest przestojem, ponieważ nie ma ona poprzedniej dostawy tej samej budowy;
- osobny parametr `maksymalnyPrzestojMinuty` ma zatwierdzoną wartość domyślną `15 min` w konfiguracji programu;
- limit przestoju jest niezależny od maksymalnego opóźnienia startu i może zostać nadpisany dla pojedynczego przeliczenia;
- skuteczna wartość jest normalizowana do liczby, musi być skończona i nieujemna, a `0` jest prawidłowe;
- wynik zwraca skuteczny limit w `wynik.parametry.maksymalnyPrzestojMinuty` bez mutowania konfiguracji i parametrów wejściowych;
- przerwa równa limitowi pozostaje dozwolona; konflikt po ścisłym przekroczeniu należy jeszcze do 5G.3;
- pole operatora i trwałe zapamiętywanie parametru pozostają zakresem 5I.

## Następny krok

**5G.3 — konflikt ciągłości dla konkretnej pary dostaw.**

Zakres następnego podetapu:

1. po końcowym sprzężonym przeliczeniu porównać `przestojMinuty` każdej rzeczywistej pary dostaw ze skutecznym `maksymalnyPrzestojMinuty`;
2. pozostawić przerwę równą limitowi bez konfliktu i klasyfikować wyłącznie ścisłe przekroczenie;
3. utworzyć osobny konflikt dla każdej problematycznej pary, wskazujący budowę, oba kursy, obie godziny, pełny przestój, użyty limit i liczbę minut ponad limit;
4. nie tworzyć konfliktu dla pierwszej dostawy, pary z `0 min`, przerwy w limicie ani kursu nieprzydzielonego;
5. sprawdzić co najmniej granicę `15 min`, pierwszy konflikt od `16 min`, wiele par, deterministyczność i brak mutowania źródła;
6. dodać test 5G.3, uruchomić pełną regresję, zaktualizować dokumentację i opublikować wynik na `main` oraz Pages.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5G.3.
