# Test ręczny — Etap 3B.1

## Cel

Potwierdzić obliczanie godzin pełnego cyklu kursu bez przydzielania jeszcze
konkretnych numerów gruszek.

## Ustawienia testowe

- pojemność gruszki: `8 m³`,
- czas załadunku: `10 min`,
- czas rozładunku: `15 min`,
- czas dojazdu przy każdej aktywnej budowie: `25 min`,
- czas powrotu automatycznie przyjmie początkowo tę samą wartość,
- dodatkowy czas załadunku: `0 min`.

Pozycji zrealizowanych `0,0 m³` nie trzeba uzupełniać.

## Test podstawowy

1. Otwórz najnowszą wersję na GitHub Pages i odśwież stronę.
2. Wczytaj ten sam sprawdzony plik KDX zawierający 6 aktywnych budów.
3. Wpisz po `25` minut tylko w kolumnie **Dojazd** przy każdej budowie.
4. Sprawdź, czy program automatycznie wpisał `25` również w kolumnie **Powrót**.
5. Zostaw dodatkowy czas załadunku jako `0` i sprawdź, czy kolumna
   **Rozładunek** pokazuje `15` ze znacznikiem **Z ustawień**.
6. Wybierz **Przelicz harmonogram**.
7. Licznik powinien nadal pokazywać `16 kursów`.
8. Dla budowy rozpoczynającej się o `08:00` pierwszy kurs powinien mieć:
   - załadunek `07:25–07:35`,
   - dojazd `07:35–08:00`,
   - rozładunek `08:00–08:15`,
   - powrót `08:15–08:40`,
   - ponowną gotowość `08:40`.

## Test niezależnej zmiany powrotu

1. Przy jednej budowie zmień czas powrotu z `25` na `30 min`.
2. Sprawdź, czy czas dojazdu przy tej budowie pozostał równy `25 min`.
3. Przelicz harmonogram i sprawdź, czy czas powrotu tego kursu wydłużył się
   o `5 min`, bez zmiany odcinka dojazdu.

## Test dokładnego czasu rozładunku

1. Przy budowie `60 m³`, rozpoczynającej się o `09:00`, wpisz:
   - dodatkowy czas załadunku: `5 min`,
   - dokładny czas w kolumnie **Rozładunek**: `25 min`.
2. Przelicz ponownie.
3. Liczba kursów nadal powinna wynosić `16`.
4. Pierwszy kurs tej budowy powinien mieć:
   - załadunek `08:20–08:35`,
   - rozładunek `09:00–09:25`,
   - ponowną gotowość `09:50`.
5. Drugi kurs powinien rozpocząć rozładunek o `09:25` i być ponownie gotowy
   o `10:15`.

## Test wartości globalnej i przywracania

1. Zmień globalny **Czas rozładunku** z `15` na `18 min`.
2. Sprawdź, czy budowy bez wyjątku pokazują `18`, a budowa z ręcznym czasem
   `25` nadal pokazuje `25`.
3. Przy budowie z wartością `25` wybierz przycisk `↺`.
4. Sprawdź, czy pole pokazuje teraz `18` i znacznik **Z ustawień**.
5. Wpisz ponownie ręcznie `20`, odśwież stronę i potwierdź, że wartość `20`
   oraz znacznik **Ręcznie** pozostały zapisane.

## Test komunikatu o brakujących danych

1. Wyczyść czas powrotu przy jednej aktywnej budowie.
2. Przelicz harmonogram.
3. Program powinien wskazać ID budowy i poprosić o uzupełnienie czasu powrotu,
   bez awarii strony.

## Oczekiwany wynik

Program zachowuje liczbę kursów z punktu 3A, oblicza pełne godziny cyklu,
uwzględnia wydłużenie załadunku i dokładny czas rozładunku, zachowuje ręczny
wyjątek oraz jawnie zgłasza brak czasu przejazdu. W tabeli kursów nie ma jeszcze
numerów gruszek — to zakres punktu 3C.

## Test automatyczny dla programisty

    node testy/etap_3b_1.test.js
    node testy/pamiec_aplikacji.test.js
