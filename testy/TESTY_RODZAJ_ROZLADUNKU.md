# Test ręczny — rodzaj rozładunku i odbiór własny

## Cel

Potwierdzić, że aplikacja rozpoznaje rodzaj rozładunku z KDX, pozwala wybrać go
przy budowie ręcznej i nie układa odbioru własnego w automatycznym harmonogramie.

## Przygotowanie

1. Otwórz najnowszą wersję aplikacji na GitHub Pages.
2. Wykonaj `Ctrl+F5`.
3. Użyj rzeczywistego pliku KDX zawierającego kolumnę **Rodzaj rozładunku** i
   przynajmniej jedną pozycję z pustą wartością w tej kolumnie.

## Test 1 — import KDX

1. Wczytaj plik CSV.
2. Pozycja z pustym polem **Rodzaj rozładunku** powinna być opisana jako
   **Odbiór własny**.
3. Przy odbiorze własnym pola dojazdu, powrotu, dodatkowego załadunku,
   rozładunku i odstępu powinny być zastąpione znakiem `—`.
4. Status powinien brzmieć **Odbiór własny — poza harmonogramem**.
5. Pozycje `Lej`, `Pompa`, `Wywrotka` i `Taczka` pozostają zwykłymi dostawami
   planowanymi i nadal wymagają czasów przejazdu.

## Test 2 — przeliczenie

1. Uzupełnij czasy dojazdu i powrotu wyłącznie dla dostaw planowanych.
2. Nie wpisuj czasów dla odbioru własnego.
3. Wybierz **Przelicz harmonogram**.
4. Przeliczenie powinno zakończyć się bez błędu o brakujących czasach odbioru
   własnego.
5. W tabeli **Godziny kursów** nie może pojawić się żaden kurs odbioru własnego.
6. Pozostałe dostawy powinny tworzyć kursy jak wcześniej.

## Test 3 — budowa ręczna

1. Rozwiń **Dodaj budowę ręcznie**.
2. Sprawdź, czy jest pole **Rodzaj rozładunku** z opcjami:
   - Odbiór własny,
   - Lej,
   - Pompa,
   - Wywrotka,
   - Taczka.
3. Spróbuj dodać budowę bez wyboru rodzaju — program powinien odmówić z
   czytelnym komunikatem.
4. Dodaj ręcznie zwykłą dostawę, np. `Taczka`, i potwierdź, że po uzupełnieniu
   czasów generuje kurs.
5. Dodaj ręcznie **Odbiór własny** i potwierdź, że jest widoczny na liście, ale
   nie wymaga czasów i nie tworzy kursu.

## Test 4 — pamięć planu

1. Po dodaniu ręcznych pozycji odśwież stronę.
2. Sprawdź, czy rodzaj rozładunku został zachowany.
3. Jeżeli odbiór własny był w planie, po odtworzeniu nadal powinien pozostać
   poza harmonogramem kursów.

## Test 5 — zgodność starszego CSV

Jeżeli masz plik CSV, w którym w ogóle nie ma kolumny **Rodzaj rozładunku**,
program nie powinien zgadywać, że wszystkie pozycje są odbiorami własnymi.
Taki plik zachowuje wcześniejsze działanie i jego pozycje są planowane normalnie.

## Oczekiwany wynik

Pusta wartość w istniejącej kolumnie KDX **Rodzaj rozładunku** oznacza odbiór
własny. Odbiór własny pozostaje widoczny operatorowi jako zamówienie dnia, ale
nie rezerwuje gruszki, nie wymaga trasy i nie jest automatycznie układany w
kursach. Operator realizuje go w wolnej chwili. Pozostałe rodzaje rozładunku są
planowane normalnie.

## Test automatyczny

Jeżeli na komputerze jest Node.js:

    node testy/rodzaj_rozladunku.test.js
