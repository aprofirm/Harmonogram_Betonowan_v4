# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5G.3 — konflikt ciągłości dla konkretnej pary dostaw**.
- Commit z implementacją 5G.3 na `main`: `d4ebe8283249e185390fc626b8a2c6562d6a7216`.
- Commit poprawiający zgodność pełnej regresji po przejściu na 5G.3: `ed8dcc3ea2f6842d76ceaca86c9f941bec1b4b2e`.
- Cały punkt **5G — maksymalny przestój podczas betonowania** jest zakończony.
- Punkty **5A–5G** są zakończone; cały Etap 5 pozostaje otwarty.
- Pełna regresja po 5G.3: **85 zestawów testów — wszystkie poprawne**.
- GitHub Actions dla końcowego `main` po 5G.3 zakończył się powodzeniem.
- GitHub Pages po 5G.3 został poprawnie zbudowany i wdrożony.

## Co działa po 5G.3

- globalny limit opóźnienia startu jest parametrem programu; domyślnie `30 min`;
- każda budowa może mieć własny `maksymalneOpoznienieStartuBudowyMinuty`;
- brak wartości indywidualnej oznacza dziedziczenie limitu globalnego, a `0` jest prawidłowym wyjątkiem;
- klasyfikacja korzysta z końcowego `StartRoboczy` po stabilizacji harmonogramu;
- każda budowa otrzymuje `ocenaOpoznieniaStartu` z obiema godzinami, pełnym opóźnieniem, użytym limitem i liczbą minut ponad limit;
- ścisłe przekroczenie limitu startu tworzy konflikt `PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU`;
- każda robocza budowa otrzymuje `analizaPrzestojowBetonowania` utworzoną z końcowego sprzężonego przydziału gruszek;
- analiza korzysta wyłącznie z kursów o statusie `przydzielony` i porządkuje je według rzeczywistego początku rozładunku;
- każda kolejna para dostaw zachowuje ID i numery obu kursów, rzeczywisty koniec poprzedniego rozładunku, rzeczywisty początek następnego oraz `przestojMinuty`;
- osobny parametr `maksymalnyPrzestojMinuty` ma domyślną wartość `15 min`;
- przerwa równa limitowi pozostaje dozwolona, więc `15 min` nie tworzy konfliktu, a pierwszy konflikt przy wartości domyślnej powstaje od `16 min`;
- każda rzeczywista para przekraczająca limit tworzy osobny konflikt `PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA`;
- konflikt przestoju wskazuje konkretną budowę, oba kursy, rzeczywisty koniec poprzedniego rozładunku, rzeczywisty początek następnego, pełny przestój, użyty limit oraz liczbę minut ponad limit;
- pierwsza dostawa, para z `0 min`, przerwa mieszcząca się w limicie oraz kurs nieprzydzielony nie tworzą fikcyjnego konfliktu;
- identyczne przeliczenia dają identyczne konflikty, a źródłowy stan importu nie jest mutowany;
- klasyfikacja 5G.3 jest wydzielona do `js/harmonogram/konflikty_przestojow.js`, bez przenoszenia logiki biznesowej do interfejsu;
- wersja webowa ładuje moduł 5G.3 przed uruchomieniem interfejsu.

## Następny krok

**5H.1 — wspólny kontrakt konfliktu.**

Zakres następnego podetapu:

1. zdefiniować jeden stabilny format konfliktu dla różnych przyczyn występujących w pełnym harmonogramie;
2. objąć kontraktem co najmniej brak gruszki, brak pompy, niedostępność, niezgodny parametr, kolizję, brak trasy, przekroczenie limitu startu i przekroczenie limitu przestoju;
3. zachować czytelne powiązanie konfliktu z budową, kursem albo zasobem bez utraty szczegółów potrzebnych operatorowi;
4. nie przebudowywać jeszcze sposobu agregacji ani docelowej prezentacji — to zakres odpowiednio 5H.2 i 5H.3;
5. dodać test 5H.1 i uruchomić pełną regresję przed publikacją.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5H.1. Jeżeli skrót statusu w `ETAPY_ROZWOJU.md` nie został jeszcze zsynchronizowany z tym punktem wznowienia, jako nowszy stan traktować zakończone 5G.3 i przed kodowaniem 5H.1 najpierw zaktualizować checklistę Etapu 5.
