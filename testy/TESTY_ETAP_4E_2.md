# TESTY — ETAP 4E.2

## Zakres

Podetap **4E.2 — przejazd pompy między budowami** dodaje niezależny mechanizm przejazdu z zakończonej budowy A do kolejnej budowy B.

Mechanizm:

- rozpoczyna przejazd dopiero po pełnym zakończeniu zajętości pompy na budowie A;
- przyjmuje gotowy czas przejazdu `A → B` wraz ze źródłem tej wartości;
- nie zakłada, że przejazd między budowami jest równy trasie z betoniarni;
- oznacza przejazd jako wpływający na dostępność pompy;
- wyznacza minutę wyjazdu, przyjazdu, planowanego rozpoczęcia przygotowania na B oraz gotowości do betonowania po przejeździe;
- nie przydziela jeszcze konkretnej pompy i nie przesuwa `StartPlanowany`, `StartZadany` ani `StartRoboczy` — to pozostaje zakresem 4F i Etapu 5;
- nie korzysta z map ani internetu. Czas może dziś pochodzić z wpisu ręcznego lub pamięci, a później z warstwy mapowej bez zmiany kontraktu silnika.

## Test automatyczny

Plik: `testy/etap_4e_2.test.js`

Test potwierdza, że:

1. pełny cykl budowy A kończy się przed rozpoczęciem przejazdu;
2. czas `40 min` jest dodawany do rzeczywistego końca zajętości pompy na A;
3. wynik przechowuje kierunek `BUDOWA-A → BUDOWA-B` i źródło `pamiec`;
4. przygotowanie wymagane na budowie B jest uwzględnione przy wyznaczeniu gotowości pompy;
5. przejazd ma `czyWplywaNaDostepnoscPompy: true`;
6. obliczenie nie zmienia budów ani kursów wejściowych;
7. samo 4E.2 nie zmienia godzin planu ani nie wykonuje przydziału pompy.

Przypadki brzegowe: brak trasy, `0 min`, różne czasy `A → B` i `B → A` oraz przejazd wymuszający późniejszy start są świadomie pozostawione do **4E.4**, zgodnie z roadmapą.

## Wynik regresji — 2026-08-26

GitHub Actions dla commita `f7a9b6e` zakończył pełną regresję powodzeniem. Wszystkie **34/34** pliki `testy/*.test.js` przeszły poprawnie.

Podetap **4E.2 jest zaimplementowany i przetestowany**. Następny podetap: **4E.3 — niezależność od map**.
