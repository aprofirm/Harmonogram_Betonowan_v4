# Test ręczny — KP-3: ilość betonu i kompaktowy widok

## Status

Implementacja KP-3.1 i KP-3.2 oraz testy automatyczne są zakończone. Punkt KP-3
pozostaje otwarty do czasu potwierdzenia poniższego testu na GitHub Pages.

## Przygotowanie

1. Otwórz najnowszą wersję aplikacji na GitHub Pages.
2. Ustaw zoom Chrome na `100%` skrótem `Ctrl+0` i zmaksymalizuj okno.
3. Wykonaj `Ctrl+F5`, aby ominąć starszą wersję z pamięci podręcznej.
4. Ustaw pojemność gruszki na `8 m³`.

## Test 1 — wymagana ilość budowy ręcznej

1. Rozwiń **Dodaj budowę ręcznie**.
2. Wpisz firmę `VOLT`, budowę `Ciernie 52` i start `11:30`, ale pozostaw ilość
   pustą.
3. Wybierz **Dodaj do listy** — program powinien odmówić i wskazać brak ilości.
4. Wpisz ilość `17,5 m³` (jeżeli pole wymaga kropki, wpisz `17.5`) i ponownie
   dodaj budowę.
5. W tabeli powinna pojawić się wartość `17.5 m³`, a nie kreska.
6. Uzupełnij dojazd i powrót tej budowy, a następnie przelicz harmonogram.
7. Przy pojemności `8 m³` budowa powinna otrzymać trzy kursy: `8`, `8` i
   `1.5 m³`.

## Test 2 — wariant roboczy i przywrócenie

1. W kolumnie **Beton** zmień ilość budowy VOLT z `17.5` na `8 m³`.
2. Wynik powinien zostać oznaczony jako nieaktualny, a przycisk `↺` powinien
   stać się aktywny.
3. Przelicz harmonogram — VOLT powinna mieć jeden kurs `8 m³`.
4. Odśwież stronę i sprawdź, czy robocza wartość `8 m³` pozostała.
5. Wybierz `↺` przy VOLT. Powinna wrócić wartość bazowa `17.5 m³`; inne budowy
   nie mogą się zmienić.
6. Przelicz ponownie — powinny wrócić trzy kursy `8`, `8` i `1.5 m³`.

## Test 3 — szeroki widok przy zoomie 100%

1. Pozostaw Chrome na zoomie `100%` i zmaksymalizowane okno.
2. Sprawdź, czy aplikacja ma tylko małe marginesy przy krawędziach monitora.
3. Lewy panel powinien pozostać wąski i czytelny, a harmonogram wykorzystać
   całe pozostałe miejsce.
4. Na dużym monitorze tabela harmonogramu powinna wymagać mniej przewijania
   poziomego niż wcześniejszy widok, a tabela kursów powinna mieścić się w
   dostępnym obszarze.
5. Przyciski, pola i tekst muszą pozostać czytelne i wygodne do kliknięcia.

## Test 4 — zachowanie na węższym oknie

1. Zwężaj okno przeglądarki.
2. Przy bardzo wąskim oknie panel ustawień powinien znaleźć się nad
   harmonogramem zamiast ściskać obie kolumny obok siebie.
3. Tabele mogą otrzymać własne przewijanie poziome, ale cała strona nie może
   wyjechać poza ekran.

## Oczekiwany wynik

Budowa ręczna zawsze ma ilość i generuje kursy. Operator może zapisać wariant
roboczy, wrócić do ilości bazowej jednym przyciskiem i po odświeżeniu nie traci
danych. Przy zoomie 100% aplikacja wykorzystuje prawie całą szerokość dużego
monitora bez sztucznego skalowania strony.

## Test automatyczny dla programisty

    node testy/kp_3.test.js
