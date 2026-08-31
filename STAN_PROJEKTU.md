# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5G.1 — osobna definicja przestoju podczas betonowania**.
- Commit z implementacją 5G.1 na `main`: `0b8776a3c22c3058583b633a1f459423ae124cf8`.
- Cały punkt **5F — limit opóźnienia rozpoczęcia budowy** oraz podetap **5G.1** są zakończone.
- Punkty 5A–5F są zakończone; punkt 5G i cały Etap 5 pozostają otwarte.
- Pełna regresja po 5G.1: **83 zestawy testów — wszystkie poprawne**.
- GitHub Actions dla commita 5G.1 zakończył się powodzeniem.
- GitHub Pages po 5G.1 został poprawnie zbudowany i wdrożony.

## Co działa po 5G.1

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
- każda robocza budowa otrzymuje `analizaPrzestojowBetonowania` utworzoną z końcowego sprzężonego przydziału gruszek;
- analiza korzysta wyłącznie z kursów o statusie `przydzielony` i porządkuje je według rzeczywistego początku rozładunku;
- każda kolejna para dostaw zachowuje ID i numery obu kursów, rzeczywisty koniec poprzedniego rozładunku, rzeczywisty początek następnego oraz `przestojMinuty`;
- stykające się lub nakładające rozładunki mają `0 min`, a budowa bez przydzielonych dostaw albo z jedną dostawą ma pustą listę par;
- opóźnienie pierwszej dostawy nie jest przestojem, ponieważ nie ma ona poprzedniej dostawy tej samej budowy;
- 5G.1 nie dodaje jeszcze `MaksPrzestojMin` ani konfliktu przekroczenia.

## Następny krok

**5G.2 — parametr `MaksPrzestojMin`.**

Zakres następnego podetapu:

1. przed rozpoczęciem implementacji uzgodnić z operatorem domyślną wartość `MaksPrzestojMin` — nie wpisywać przypadkowej liczby;
2. przechowywać limit jako osobny parametr programu, niezależny od maksymalnego opóźnienia rozpoczęcia budowy;
3. walidować skuteczną wartość również przy bezpośrednim wywołaniu silnika i zwracać ją w wyniku bieżącego przeliczenia;
4. nie tworzyć jeszcze konfliktu przekroczenia — porównanie konkretnych par z limitem należy do 5G.3;
5. dodać test 5G.2, uruchomić pełną regresję, zaktualizować dokumentację i opublikować wynik na `main` oraz Pages.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` i uzgodnić domyślną wartość `MaksPrzestojMin` przed rozpoczęciem 5G.2.
