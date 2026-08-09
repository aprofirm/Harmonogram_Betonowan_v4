# Test ręczny — Etap 1

## Cel

Potwierdzić, że podstawowa aplikacja działa lokalnie bez instalacji i bez internetu.

## Kroki

1. Pobierz repozytorium na komputer.
2. Wyłącz połączenie z internetem.
3. Otwórz plik index.html dwukrotnym kliknięciem.
4. Sprawdź, czy w panelu są wartości domyślne: 07:00, 8 m³, 10 min i 30 min.
5. Wybierz przycisk Przelicz harmonogram.
6. Sprawdź, czy pojawia się zielony komunikat Przeliczenie zakończone.
7. Zmień jedną z wartości na niepoprawną, np. pojemność gruszki na 0, i ponownie wybierz Przelicz harmonogram.
8. Sprawdź, czy aplikacja pokazuje zrozumiały komunikat o błędzie.

## Oczekiwany wynik

Interfejs otwiera się bez serwera i internetu, przycisk uruchamia kontrolowany przepływ, a błędne parametry nie powodują awarii strony.

## Test automatyczny dla programisty

Jeżeli na komputerze jest Node.js, w katalogu projektu można dodatkowo uruchomić:

    node testy/etap_1.test.js

Node.js służy wyłącznie do uruchamiania testu. Nie jest potrzebny do używania aplikacji.
