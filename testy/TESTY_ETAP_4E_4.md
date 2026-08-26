# TESTY — ETAP 4E.4

## Zakres

Podetap **4E.4 — przypadki brzegowe i zamknięcie przejazdów pomp**
sprawdza zachowanie kontraktu `budowa A → budowa B` przed rozpoczęciem
właściwego przydziału pomp w 4F.

Test `testy/etap_4e_4.test.js` potwierdza:

1. brak czasu trasy daje jawny komunikat zawierający parę budów;
2. ujemny lub nieliczbowy czas jest odrzucany;
3. `0 min` jest poprawnym czasem przejazdu;
4. `A → B` i `B → A` mogą mieć różne wartości;
5. przejazd rozpoczyna się dopiero po pełnym zakończeniu zajętości na A;
6. spóźniony przyjazd na B wylicza najwcześniejszy start betonowania,
   opóźnienie i przyczynę `przejazd-miedzy-budowami`;
7. obliczenie nie przesuwa jeszcze godzin budowy;
8. `js/pompy/przejazdy_pomp.js` jest wczytywany przez `index.html` po
   `pompy.js`, więc mechanizm działa również w aplikacji przeglądarkowej.

## Wynik regresji — 2026-08-26

GitHub Actions po ostatecznych poprawkach zakończył pełną regresję
powodzeniem. Wszystkie **36/36** plików `testy/*.test.js` przeszły.

Cały punkt **4E — przejazdy pomp** jest zakończony. Następny krok:
**4F.1 — stabilna kolejność budów wymagających pompy**.
