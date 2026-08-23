# Testy Etapu 3D — minimalna liczba gruszek

## Status

- [x] 3D.1 — reguła i granice zakresu.
- [x] 3D.2 — osobny wynik silnika.
- [x] 3D.3 — licznik w widoku operatora.
- [x] 3D.4 — testy automatyczne, regresja i dokumentacja.
- [x] 3D.5 — publikacja i test operatora.
  - [x] 3D.5.1 — publikacja, GitHub Actions i GitHub Pages.
  - [x] 3D.5.2 — test operatora.

## Zasada

Minimalna liczba gruszek jest wyznaczana dla godzin już obliczonych przez 3B i
przydziału z 3C. Jest równa liczbie pojazdów potrzebnych do wykonania wszystkich
pełnych cykli bez ich nakładania. Punkt 3D nie ogranicza jeszcze planu do floty
rzeczywiście dostępnej u operatora — to należy do 3E.

## Test automatyczny

Uruchom:

```text
node testy/etap_3d.test.js
```

Test sprawdza:

1. pusty plan wymagający `0` gruszek;
2. kolejne cykle stykające się na granicy powrotu, które wymagają `1` gruszki;
3. wiele nakładających się cykli wymagających `5` gruszek;
4. zgodność osobnego pola wyniku ze stanem i liczbą przydzielonych zasobów;
5. komunikat z minimalną liczbą;
6. obecność i zerowanie licznika **potrzebnych gruszek** w interfejsie;
7. aktualne oznaczenie punktu 3D.

## Test operatora 3D.5.2

1. Otwórz opublikowaną aplikację i wczytaj ten sam rzeczywisty plan, na którym
   został zaliczony test 3C.6.
2. Uzupełnij czasy tras i wybierz **Przelicz harmonogram**.
3. Sprawdź nowy licznik **potrzebnych gruszek** w podsumowaniu.
4. Porównaj go z najwyższym numerem `Gruszka N` użytym w tabeli kursów — obie
   wartości muszą być równe.
5. Przelicz drugi raz bez zmian — wynik musi pozostać identyczny.
6. Zmień czas albo rytm jednej budowy i przelicz ponownie — liczba ma zostać
   policzona od nowa.
7. Wyczyść plan i sprawdź, czy licznik wraca do `0`.

## Wynik testu operatora — 2026-08-23

- [x] rzeczywisty plan pokazał `7` budów i `11` kursów;
- [x] licznik pokazał `5` potrzebnych gruszek;
- [x] najwyższy numer w tabeli kursów również wynosił `Gruszka 5`;
- [x] wynik nie zawierał konfliktów;
- [x] ponowne przeliczenie i zmiany wpływające na plan odświeżały licznik;
- [x] wyczyszczenie planu zerowało wynik;
- [x] operator potwierdził poprawne działanie.

Punkt 3D jest zakończony. Dalszy rozwój odbywa się w 3E — trybie „mam X
gruszek”.
