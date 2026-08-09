# Test ręczny — Etap 2

## Cel

Potwierdzić, że aplikacja wczytuje dane budów z CSV, pozwala dodać budowę ręcznie i przy kolejnym imporcie nie miesza danych z dwóch plików.

## Przygotowanie

Do pierwszej próby można użyć pliku `przyklady/przykladowe_budowy.csv` dołączonego do repozytorium.

## Kroki

1. Wyłącz połączenie z internetem i otwórz `index.html` dwukrotnym kliknięciem.
2. Przeciągnij `przykladowe_budowy.csv` na pole importu.
3. Sprawdź, czy pojawia się informacja o dwóch wczytanych budowach.
4. Sprawdź w tabeli, czy ID `000127` zachowało zera na początku oraz czy Firma, Budowa i Start planowany znajdują się w osobnych kolumnach.
5. Rozwiń „Dodaj budowę ręcznie”, wpisz Firmę, Budowę i godzinę, a następnie wybierz „Dodaj do listy”.
6. Sprawdź, czy nowa pozycja otrzymała ID `RECZNE-001` i źródło „Ręczna”.
7. Wczytaj drugi plik CSV zawierający inną pojedynczą budowę.
8. Sprawdź, czy budowy z pierwszego CSV zniknęły, a budowa ręczna pozostała na osobnej liście.
9. Wczytaj CSV bez kolumny `ID_Budowy` i sprawdź, czy plik zostaje przyjęty, a pozycje otrzymują ID `CSV-001`, `CSV-002` itd.
10. Sprawdź, czy aplikacja pokazuje pomarańczowe ostrzeżenie o automatycznie nadanych identyfikatorach zamiast czerwonego błędu.
11. Spróbuj wczytać pusty plik albo CSV bez kolumny `Budowa`.
12. Sprawdź, czy aplikacja pokazuje zrozumiały komunikat po polsku i nie usuwa ostatniego poprawnego importu.
13. Wybierz „Przelicz harmonogram” i sprawdź, czy aplikacja nadal działa bez internetu.

## Oczekiwany wynik

CSV tworzy uporządkowaną listę Budów, brak ID nie blokuje importu, dane źródłowe nie są nadpisywane, kolejny poprawny CSV zastępuje poprzedni import, budowy ręczne pozostają oddzielone, a błędny plik nie powoduje awarii strony.

## Obsługiwane nagłówki

Wymagane informacje to:

- `Firma`,
- `Budowa`,
- `StartPlanowany`.

`ID_Budowy` jest opcjonalne. Importer zachowuje istniejące ID jako tekst, a brakujące uzupełnia serią `CSV-001`, `CSV-002` itd. Rozpoznaje też typowe warianty, np. `ID obiektu`, `Klient`, `Nazwa budowy` i `Godzina`. Dokładne mapowanie eksportu KDX będzie można rozszerzyć po sprawdzeniu prawdziwego pliku bez zmiany modelu Budowy.

## Test automatyczny dla programisty

Jeżeli na komputerze jest Node.js, można uruchomić:

    node testy/etap_1.test.js
    node testy/etap_2.test.js

Node.js nie jest potrzebny do zwykłego używania aplikacji.
