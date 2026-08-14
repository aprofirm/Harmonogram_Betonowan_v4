# Test ręczny — Etap 3A: generowanie kursów

## Cel

Potwierdzić, że aplikacja dzieli pozostałą ilość betonu na kursy zgodnie z pojemnością gruszki, pomija zrealizowane pozycje `0,0 m³` i tworzy wynik od nowa po zmianie pojemności.

## Test na eksporcie KDX z 2026-08-14

1. Otwórz stronę aplikacji i wczytaj ten sam eksport KDX, który zawiera ilości:
   `1`, `3`, `30`, `19,5`, `0`, `14`, `3,5`, `0 m³`.
2. Pozostaw pojemność gruszki `8 m³`.
3. Wybierz **Przelicz harmonogram**.
4. Sprawdź, czy licznik pokazuje dokładnie **12 kursów**.
5. Sprawdź, czy pozycje `0,0 m³` nadal są oznaczone jako zrealizowane.
6. Zmień pojemność gruszki na `10 m³` i ponownie wybierz **Przelicz harmonogram**.
7. Sprawdź, czy licznik pokazuje dokładnie **10 kursów**.
8. Przywróć `8 m³` i przelicz ponownie — wynik powinien wrócić do **12 kursów**.

## Oczekiwany podział dla 8 m³

- `1 m³` → `1` kurs,
- `3 m³` → `1` kurs,
- `30 m³` → `8 + 8 + 8 + 6` (`4` kursy),
- `19,5 m³` → `8 + 8 + 3,5` (`3` kursy),
- `0 m³` → `0` kursów,
- `14 m³` → `8 + 6` (`2` kursy),
- `3,5 m³` → `1` kurs,
- `0 m³` → `0` kursów.

Łącznie: **12 kursów**.

## Zakres punktu 3A

Na tym etapie kurs posiada ID, numer, powiązanie z budową i ilość betonu. Nie ma jeszcze godziny przejazdu ani przypisanej konkretnej gruszki — te elementy należą do kolejnych punktów Etapu 3.

## Test automatyczny

    node testy/etap_3a.test.js
