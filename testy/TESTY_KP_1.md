# Test ręczny — KP-1: pamięć planu dnia

## Status

Plan testu został przygotowany w KP-1.1, a test modułu pamięci dodano w KP-1.2.
Test operatorski wykonujemy dopiero po zakończeniu implementacji i testów
automatycznych KP-1.3–KP-1.6.

## Cel

Potwierdzić, że odświeżenie strony nie usuwa bieżącego planu, a operator może
świadomie wyczyścić dane dnia bez usuwania diagnostyki.

## Przygotowanie

1. Otwórz najnowszą wersję aplikacji na GitHub Pages.
2. Wczytaj sprawdzony plik KDX z 6 aktywnymi budowami.
3. Wpisz po `25 min` dojazdu; czas powrotu powinien uzupełnić się automatycznie.
4. Zmień jeden czas powrotu na `30 min`, aby sprawdzić zachowanie ręcznej korekty.
5. Zostaw pojemność gruszki `8 m³`, załadunek `10 min` i rozładunek `15 min`.
6. Przelicz harmonogram i potwierdź wynik `16 kursów`.

## Test 1 — odtworzenie przeliczonego planu

1. Zapamiętaj pierwszy widoczny kurs oraz zmieniony czas powrotu `30 min`.
2. Odśwież stronę.
3. Sprawdź, czy nadal widoczne są:
   - nazwa wcześniej wczytanego pliku,
   - 6 budów,
   - czasy dojazdu i powrotu, w tym ręczna wartość `30 min`,
   - ustawienia programu,
   - 16 ponownie obliczonych kursów.

## Test 2 — odtworzenie niepełnego planu

1. Wyczyść plan zgodnie z Testem 4.
2. Ponownie wczytaj plik KDX.
3. Uzupełnij czasy tylko przy jednej budowie i nie przeliczaj harmonogramu.
4. Odśwież stronę.
5. Sprawdź, czy budowy i częściowo wpisane czasy zostały odtworzone, ale program
   nie uruchomił automatycznie niepełnego przeliczenia i nie uległ awarii.

## Test 3 — anulowanie czyszczenia

1. Wybierz czerwony przycisk **Wyczyść plan dnia**.
2. Anuluj pytanie potwierdzające.
3. Sprawdź, czy żadna budowa, wartość ani wynik nie zostały usunięte.

## Test 4 — potwierdzone czyszczenie

1. Ponownie wybierz **Wyczyść plan dnia** i potwierdź operację.
2. Sprawdź, czy lista budów i kursów jest pusta, a parametry mają wartości
   domyślne.
3. Otwórz diagnostykę i potwierdź, że logi nadal są dostępne.
4. Odśwież stronę i sprawdź, czy pusty stan pozostał pusty.

## Oczekiwany wynik

Program automatycznie odtwarza poprawny zapis planu, nie wysyła danych do
internetu, nie ulega awarii przy niepełnym stanie i usuwa dane dnia wyłącznie po
potwierdzeniu operatora. Czyszczenie planu nie usuwa logów diagnostycznych.

## Testy automatyczne dla programisty

Test wersjonowanego modułu pamięci:

    node testy/pamiec_planu.test.js

Test będzie rozszerzany przy kolejnych podetapach. Pełna regresja ma nadal
obejmować Etapy 1–3B.1, import KDX oraz diagnostykę.
