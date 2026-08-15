# Test ręczny — KP-1: pamięć planu dnia

## Status

Implementacja KP-1.1–KP-1.8 oraz pełna regresja automatyczna są zakończone.
Poniższy test operatorski jest ostatnim podetapem KP-1.9.

## Cel

Potwierdzić, że odświeżenie strony nie usuwa bieżącego planu, można przywrócić
wybrany historyczny zapis, a czyszczenie bieżącego dnia nie usuwa historii ani
diagnostyki.

## Przygotowanie

1. Otwórz najnowszą wersję aplikacji na GitHub Pages.
2. Wczytaj sprawdzony plik KDX z 6 aktywnymi budowami.
3. Wpisz po `25 min` dojazdu; czas powrotu powinien uzupełnić się automatycznie.
4. Zmień jeden czas powrotu na `30 min`, aby sprawdzić zachowanie ręcznej korekty.
5. Zostaw pojemność gruszki `8 m³`, załadunek `10 min` i rozładunek `15 min`.
6. Przelicz harmonogram i potwierdź wynik `16 kursów`.
7. Na dole lewego panelu sprawdź, czy licznik historii pokazuje co najmniej
   `1` zapis.

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

## Test 3 — historia zapisów

1. Zmień jeden czas powrotu z `30` na `35 min` i ponownie przelicz harmonogram.
2. Na dole panelu wybierz **Wczytaj zapis historyczny**.
3. Sprawdź, czy lista jest ułożona od najnowszego zapisu i pokazuje datę,
   godzinę, nazwę pliku oraz liczbę budów.
4. Wczytaj wcześniejszy zapis i potwierdź operację.
5. Sprawdź, czy wcześniejszy czas powrotu `30 min` oraz wynik `16 kursów`
   zostały przywrócone.

## Test 4 — anulowanie czyszczenia

1. Wybierz czerwony przycisk **Wyczyść plan dnia**.
2. Anuluj pytanie potwierdzające.
3. Sprawdź, czy żadna budowa, wartość ani wynik nie zostały usunięte.

## Test 5 — potwierdzone czyszczenie

1. Ponownie wybierz **Wyczyść plan dnia** i potwierdź operację.
2. Sprawdź, czy lista budów i kursów jest pusta, a parametry mają wartości
   domyślne.
3. Otwórz diagnostykę i potwierdź, że logi nadal są dostępne.
4. Sprawdź, czy przycisk historii nadal pokazuje wcześniejsze zapisy.
5. Odśwież stronę i sprawdź, czy pusty stan pozostał pusty, a historia nadal
   jest dostępna.
6. Wczytaj jeden zapis historyczny i potwierdź, że plan można odzyskać również
   po wcześniejszym wyczyszczeniu bieżącego dnia.

## Oczekiwany wynik

Program automatycznie odtwarza poprawny zapis planu, nie wysyła danych do
internetu, nie ulega awarii przy niepełnym stanie i usuwa bieżące dane dnia
wyłącznie po potwierdzeniu operatora. Historia ma daty i godziny, a czyszczenie
planu nie usuwa historii ani logów diagnostycznych.

## Testy automatyczne dla programisty

Test wersjonowanego modułu pamięci:

    node testy/pamiec_planu.test.js

Test pełnego przepływu aplikacji:

    node testy/pamiec_aplikacji.test.js

Pełna regresja obejmuje Etapy 1–3B.1, import KDX, diagnostykę oraz oba testy
pamięci planu.
