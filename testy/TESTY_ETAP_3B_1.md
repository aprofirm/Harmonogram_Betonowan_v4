# Test ręczny — Etap 3B.1

## Cel

Potwierdzić obliczanie godzin pełnego cyklu kursu bez przydzielania jeszcze
konkretnych numerów gruszek.

## Ustawienia testowe

- pojemność gruszki: `8 m³`,
- czas załadunku: `10 min`,
- czas rozładunku: `15 min`,
- czas dojazdu przy każdej aktywnej budowie: `25 min`,
- czas powrotu przy każdej aktywnej budowie: `25 min`,
- dodatkowy czas załadunku i rozładunku: `0 min`.

Pozycji zrealizowanych `0,0 m³` nie trzeba uzupełniać.

## Test podstawowy

1. Otwórz najnowszą wersję na GitHub Pages i odśwież stronę.
2. Wczytaj ten sam sprawdzony plik KDX zawierający 6 aktywnych budów.
3. Uzupełnij po `25` minut dojazdu i powrotu przy każdej budowie.
4. Zostaw dodatkowe czasy jako `0`.
5. Wybierz **Przelicz harmonogram**.
6. Licznik powinien nadal pokazywać `16 kursów`.
7. Dla budowy rozpoczynającej się o `08:00` pierwszy kurs powinien mieć:
   - załadunek `07:25–07:35`,
   - dojazd `07:35–08:00`,
   - rozładunek `08:00–08:15`,
   - powrót `08:15–08:40`,
   - ponowną gotowość `08:40`.

## Test wydłużenia

1. Przy budowie `60 m³`, rozpoczynającej się o `09:00`, wpisz:
   - dodatkowy czas załadunku: `5 min`,
   - dodatkowy czas rozładunku: `10 min`.
2. Przelicz ponownie.
3. Liczba kursów nadal powinna wynosić `16`.
4. Pierwszy kurs tej budowy powinien mieć:
   - załadunek `08:20–08:35`,
   - rozładunek `09:00–09:25`,
   - ponowną gotowość `09:50`.
5. Drugi kurs powinien rozpocząć rozładunek o `09:25` i być ponownie gotowy
   o `10:15`.

## Test komunikatu o brakujących danych

1. Wyczyść czas powrotu przy jednej aktywnej budowie.
2. Przelicz harmonogram.
3. Program powinien wskazać ID budowy i poprosić o uzupełnienie czasu powrotu,
   bez awarii strony.

## Oczekiwany wynik

Program zachowuje liczbę kursów z punktu 3A, oblicza pełne godziny cyklu,
uwzględnia wydłużenie załadunku i rozładunku oraz jawnie zgłasza brak czasu
przejazdu. W tabeli kursów nie ma jeszcze numerów gruszek — to zakres punktu 3C.

## Test automatyczny dla programisty

    node testy/etap_3b_1.test.js
