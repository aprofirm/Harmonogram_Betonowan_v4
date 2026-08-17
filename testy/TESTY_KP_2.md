# Test ręczny — KP-2: pamięć znanych tras

## Status

Implementacja KP-2.1–KP-2.6, poprawka KP-2.7.1 i powtórny test operatora
KP-2.7.2 są zakończone. Cały punkt KP-2 został zamknięty 2026-08-15. Dnia
2026-08-17 dodano uzupełniający podgląd zapisanych tras, wyszukiwanie,
sortowanie po nazwie i możliwość usunięcia pojedynczego wpisu. Kontrolę tej
funkcji wykonujemy razem z najbliższą regresją w 3B.2.6. Pełne połączenie z
OpenStreetMap nie jest jeszcze aktywne — pozostaje zakresem Etapu 6.

## Cel

Potwierdzić, że ręcznie wpisane czasy zostają w lokalnej książce tras, wracają
po ponownym imporcie tej samej budowy i nie są usuwane razem z planem dnia.

## Przygotowanie

1. Otwórz najnowszą wersję aplikacji na GitHub Pages i wykonaj `Ctrl+F5`.
2. Jeżeli strona odtworzy starszy plan z kompletnymi czasami, sprawdź, czy
   licznik **Pamięć tras** od razu uwzględnił wszystkie takie budowy.
3. Wczytaj sprawdzony plik KDX.
4. Wybierz jedną aktywną budowę, dla której łatwo rozpoznasz nazwę firmy i
   miejsce budowy.
5. Zapamiętaj liczbę widoczną w sekcji **Pamięć tras** na dole lewego panelu.

## Test 0 — zbiorczy zapis przy przeliczeniu

1. Uzupełnij dojazd i powrót przy kilku budowach, pozostawiając co najmniej
   jedną budowę bez kompletu czasów.
2. Wybierz **Przelicz harmonogram**.
3. Licznik **Pamięć tras** powinien uwzględnić wszystkie budowy mające komplet
   dojazd + powrót. Pusta albo niekompletna budowa nie powinna być zapisana.
4. Nie trzeba zmieniać ponownie każdego wcześniej wpisanego pola.

## Test 1 — zapis ręcznych czasów

1. Przy wybranej budowie wpisz dojazd `25 min`.
2. Sprawdź, czy powrót uzupełnił się wartością `25 min`.
3. Zmień tylko powrót na `30 min`.
4. Sprawdź, czy dojazd pozostał równy `25 min`.
5. Pod oboma polami powinna być widoczna etykieta **Ręcznie**.
6. Licznik **Pamięć tras** powinien wzrosnąć o jeden. Jeżeli ta budowa była już
   wcześniej zapamiętana, licznik może pozostać bez zmian, ponieważ wpis został
   zaktualizowany zamiast utworzenia duplikatu.

## Test 2 — książka tras pozostaje po wyczyszczeniu planu

1. Wybierz **Wyczyść plan dnia** i potwierdź operację.
2. Sprawdź, czy budowy i kursy zniknęły.
3. Sprawdź, czy licznik **Pamięć tras** nie zmniejszył się.
4. Historia planów i diagnostyka również powinny pozostać dostępne.

## Test 3 — ponowny import bez ręcznego wpisywania

1. Ponownie wczytaj dokładnie ten sam plik KDX.
2. Odszukaj tę samą firmę i budowę.
3. Sprawdź, czy program automatycznie wpisał:
   - dojazd `25 min`,
   - powrót `30 min`.
4. Pod oboma polami powinna być widoczna etykieta **Z pamięci**.
5. Przelicz harmonogram i potwierdź, że nie pojawia się komunikat o braku czasu
   dla tej budowy.

## Test 4 — niezależna korekta wartości z pamięci

1. Zmień tylko dojazd z `25` na `27 min`.
2. Sprawdź, czy powrót pozostał równy `30 min`.
3. Przy dojeździe powinna pojawić się etykieta **Ręcznie**; wartość powrotu
   pozostaje niezależna.
4. Wyczyść plan i ponownie wczytaj ten sam plik — powinny wrócić wartości
   `27 min` oraz `30 min`.

## Test 5 — podgląd, wyszukiwanie, sortowanie i usunięcie trasy

1. Przy co najmniej jednej zapamiętanej trasie wybierz **Pokaż zapisane trasy**.
2. Sprawdź, czy otwiera się okno w aplikacji i pokazuje dla każdej pozycji:
   - dokładny opis lokalizacji,
   - czas dojazdu,
   - czas powrotu,
   - źródło wartości,
   - datę aktualizacji,
   - datę ostatniego użycia.
3. Lista powinna domyślnie być ułożona alfabetycznie **Nazwa A–Z**. Wybierz
   **Nazwa Z–A** i potwierdź odwrócenie kolejności, a następnie wróć do A–Z.
4. W polu **Szukaj lokalizacji** wpisz fragment nazwy firmy, budowy, ulicy lub
   miejscowości. Lista powinna filtrować się od razu podczas pisania.
5. Wyszukiwanie powinno ignorować wielkość liter i polskie znaki, np.
   `swiebodzice` powinno znaleźć wpis zawierający `Świebodzice`.
6. Wyczyść pole wyszukiwania i sprawdź, czy wracają wszystkie zapisane trasy.
7. Porównaj jedną pozycję z budową widoczną w planie. Opis powinien pokazywać
   dokładnie, pod jaką nazwą program przechowuje i wyszukuje tę trasę.
8. Zamknij okno przyciskiem `×`, klawiszem `Esc` i kliknięciem poza oknem —
   każda z tych metod powinna działać bez zmiany danych.
9. Otwórz podgląd ponownie, wybierz **Usuń** przy jednej trasie i anuluj
   potwierdzenie. Wpis oraz licznik nie mogą się zmienić.
10. Wybierz **Usuń** ponownie i potwierdź. Wpis powinien zniknąć, a licznik
    **Pamięć tras** powinien zmniejszyć się o jeden. Jeżeli aktywne jest
    wyszukiwanie, lista powinna po usunięciu zachować bieżący filtr.
11. Pamiętaj, że usunięcie wpisu nie usuwa budowy ani jej bieżących czasów z
    planu. Jeżeli budowa nadal ma komplet czasów, kolejne przeliczenie może
    ponownie zapisać tę trasę do pamięci.

## Oczekiwany wynik

Książka tras jest niezależna od bieżącego planu i historii. Dokładnie ta sama
firma oraz budowa otrzymują zapisane czasy bez kolejnego wpisywania, dojazd i
powrót pozostają osobne, a program działa także bez internetu. Operator może
również szybko znaleźć wpis po fragmencie nazwy, sortować listę A–Z lub Z–A,
sprawdzić dokładne dane w pamięci i usunąć pojedynczy błędny wpis bez czyszczenia
całej książki.

## Testy automatyczne dla programisty

    node testy/pamiec_tras.test.js
    node testy/pamiec_tras_integracja.test.js
    node testy/pamiec_tras_podglad.test.js
    node testy/pamiec_aplikacji.test.js

Test integracji używa zastępczej funkcji mapowej. Sprawdza, że przy trafieniu w
cache funkcja mapowa nie jest wywoływana, a nowy wynik mapowy jest zapisywany na
przyszłość. Test podglądu sprawdza odczyt listy bez zmiany daty ostatniego użycia,
usunięcie pojedynczej trasy, tryb pamięci sesji oraz filtrowanie bez rozróżniania
wielkości liter i polskich znaków i sortowanie nazw A–Z/Z–A.