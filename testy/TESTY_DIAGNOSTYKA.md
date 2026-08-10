# Test ręczny — diagnostyka programu

## Cel

Potwierdzić, że aplikacja zapisuje techniczne zdarzenia lokalnie, pozwala pobrać raport i nie umieszcza w nim treści danych z KDX/CSV.

## Kroki

1. Otwórz lokalnie `index.html`.
2. Rozwiń sekcję **Diagnostyka programu** w panelu parametrów.
3. Sprawdź, czy podgląd zawiera zdarzenie uruchomienia aplikacji i gotowości interfejsu.
4. Wczytaj poprawny plik CSV, a następnie spróbuj wczytać błędny plik.
5. Wybierz **Przelicz harmonogram**.
6. Ponownie otwórz sekcję diagnostyki i sprawdź, czy widać zdarzenia importu oraz przeliczania.
7. Wybierz **Pobierz raport** i otwórz pobrany plik `.json` w Notatniku.
8. Sprawdź, czy raport zawiera czasy zdarzeń, nazwę i rozmiar pliku, nagłówki kolumn, wyniki operacji oraz opis błędu.
9. Sprawdź, czy raport nie zawiera treści wierszy CSV, nazw firm ani nazw budów.
10. Odśwież stronę i potwierdź, że wcześniejsze logi nadal są dostępne. Jeżeli przeglądarka blokuje pamięć lokalną dla plików, interfejs powinien jawnie pokazać tryb pamięci tylko do zamknięcia strony.
11. Wybierz **Wyczyść logi** i sprawdź, czy licznik oraz podgląd zostały wyzerowane.

## Oczekiwany wynik

Diagnostyka działa także po lokalnym otwarciu strony i bez internetu. Program zachowuje maksymalnie 10 ostatnich uruchomień, nie wysyła logów do żadnego serwera i tworzy raport wyłącznie po działaniu użytkownika.

## Test automatyczny dla programisty

Jeżeli na komputerze jest Node.js, można uruchomić:

    node testy/diagnostyka.test.js

Node.js nie jest potrzebny do zwykłego używania aplikacji.
