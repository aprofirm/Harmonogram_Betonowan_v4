# Test ręczny — rodzaj rozładunku i odbiór własny

## Status

**Test operatora zakończony sukcesem 2026-08-17 na rzeczywistym eksporcie KDX i wersji opublikowanej przez GitHub Pages.**

Pełna regresja automatyczna pozostaje częścią kroku **3B.2.6**.

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
2. Pusta wartość w istniejącej kolumnie **Rodzaj rozładunku** powinna zostać
   rozpoznana jako **Odbiór własny**.
3. Odbiór własny nie powinien pozostać w głównej tabeli dostaw planowanych.
4. Pod główną tabelą powinna pojawić się osobna, domyślnie zwinięta sekcja
   **Odbiory własne** z licznikiem pozycji.
5. Po rozwinięciu odbiór własny powinien zachowywać dane potrzebne operatorowi,
   m.in. start, firmę, miejsce, beton i identyfikator.
6. Pozycje `Lej`, `Pompa`, `Wywrotka` i `Taczka` pozostają zwykłymi dostawami
   planowanymi i nadal wymagają czasów przejazdu.

## Test 2 — przeliczenie

1. Uzupełnij czasy dojazdu i powrotu wyłącznie dla dostaw planowanych.
2. Nie wpisuj czasów dla odbioru własnego — nie powinien mieć takich pól w
   głównej tabeli.
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
5. Dodaj ręcznie **Odbiór własny** i potwierdź, że trafia do osobnej sekcji,
   nie wymaga czasów i nie tworzy kursu.

## Test 4 — pamięć planu

1. Po dodaniu ręcznych pozycji odśwież stronę.
2. Sprawdź, czy rodzaj rozładunku został zachowany.
3. Jeżeli odbiór własny był w planie, po odtworzeniu nadal powinien pozostać
   w osobnej sekcji i poza harmonogramem kursów.

## Test 5 — zgodność starszego CSV

Jeżeli masz plik CSV, w którym w ogóle nie ma kolumny **Rodzaj rozładunku**,
program nie powinien zgadywać, że wszystkie pozycje są odbiorami własnymi.
Taki plik zachowuje wcześniejsze działanie i jego pozycje są planowane normalnie.

## Test 6 — pamięć znanych tras

Odbiór własny nie wymaga trasy, dlatego nie powinien tworzyć ani aktualizować
wpisu w książce znanych tras. Pozostałe dostawy zachowują dotychczasowe działanie
pamięci dojazdu i powrotu.

## Wynik testu operatora 2026-08-17

Na rzeczywistym pliku KDX potwierdzono, że pozycja z pustym polem **Rodzaj
rozładunku** została poprawnie oddzielona od dostaw planowanych jako odbiór
własny. Pozycja nie wymagała czasu dojazdu i nie uczestniczyła w układaniu
kursów. Osobna rozwijana sekcja odbiorów własnych działała zgodnie z ustaleniem.

Wersja testowana została poprawnie opublikowana przez GitHub Pages. Funkcję
uznajemy za potwierdzoną operatorsko; formalne uruchomienie i ujednolicenie całej
regresji automatycznej wykonujemy w 3B.2.6.

## Testy automatyczne

W repozytorium znajdują się:

    node testy/rodzaj_rozladunku.test.js
    node testy/odbior_wlasny_tabela.test.js

Przed zamknięciem 3B.2.6 oba testy trzeba ujednolicić z aktualną architekturą,
uruchomić razem z testami rytmu i pełną regresją wcześniejszych funkcji.