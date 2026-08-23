# Testy Etapu 3E — tryb „mam X gruszek”

## Status

- [x] 3E.1 — reguła i granice zakresu.
- [x] 3E.2 — parametr, walidacja i pamięć.
- [x] 3E.3 — ograniczony przydział gruszek.
- [x] 3E.4 — jawne konsekwencje w wyniku operatora.
- [x] 3E.5 — testy automatyczne, regresja i dokumentacja.
- [x] 3E.6 — publikacja i test operatora.
  - [x] 3E.6.1 — publikacja, GitHub Actions i GitHub Pages.
  - [x] 3E.6.2 — test operatora.

## Zasada

Tryb **Oblicz, ile potrzeba** zachowuje planowane godziny i pokazuje minimalną
flotę. Tryb **Mam określoną liczbę** przydziela wyłącznie podaną liczbę gruszek.
Jeżeli wszystkie są zajęte, kurs czeka na pojazd wracający najwcześniej, a cały
cykl zostaje przesunięty bez nakładania pracy jednej gruszki.

Minimalna liczba z 3D nie znika: pozostaje widoczna obok liczby dostępnej.

## Test automatyczny

Uruchom:

```text
node testy/etap_3e.test.js
```

Test sprawdza:

1. brak ograniczenia i zachowanie wyniku 3D;
2. wystarczającą flotę bez zmiany godzin;
3. jedną gruszkę dla trzech nakładających się kursów;
4. przesunięcie pełnych cykli o `65` i `130` minut;
5. brak nakładania kolejnych kursów jednej gruszki;
6. zachowanie planowanej godziny rozładunku obok nowego wyniku;
7. `0` dostępnych gruszek, nieprzydzielone kursy i jawny konflikt;
8. odrzucenie liczby ujemnej, ułamkowej i nieznanego trybu;
9. pola trybu, liczby dostępnej, podsumowania i skutku floty w interfejsie;
10. zapis i odtworzenie trybu oraz liczby w pamięci planu.

## Test operatora 3E.6.2

Po zakończeniu publikacji 3E.6.1:

1. Otwórz opublikowaną aplikację i wczytaj ten sam rzeczywisty plan użyty w 3D.
2. Pozostaw **Oblicz, ile potrzeba** i przelicz — wynik powinien nadal pokazać
   `5` potrzebnych gruszek, `11` kursów i brak zmian godzin.
3. Wybierz **Mam określoną liczbę**, wpisz `5` i przelicz — liczba dostępna i
   potrzebna powinny być równe, a kolumna **Skutek floty** nie powinna pokazać
   opóźnień.
4. Zmień liczbę na `4` i przelicz — program nie może utworzyć `Gruszki 5`;
   opóźnione kursy mają otrzymać nowe godziny, wartość `+N min` i pierwotną
   planowaną godzinę rozładunku.
5. Sprawdź, czy każdy kolejny kurs tej samej gruszki zaczyna się dopiero po jej
   wcześniejszym powrocie.
6. Zmień liczbę na `0` — kursy powinny mieć oznaczenie **Brak gruszki**, a
   podsumowanie powinno pokazać konflikt.
7. Odśwież stronę po zapisaniu wariantu — tryb i liczba mają zostać odtworzone,
   a harmonogram ponownie przeliczony.

Test został zaliczony na rzeczywistym planie. Przy `4` dostępnych gruszkach
program nie utworzył `Gruszki 5`, pokazał dwa opóźnione kursy (`+30 min` i
`+5 min`) oraz zachował pierwotne godziny rozładunku. Operator potwierdził
również pozostałe warianty instrukcji, brak nakładania cykli i odtworzenie
ustawienia.

Po teście sterowanie flotą przeniesiono z bocznych ustawień do nagłówka wyniku,
obok liczników. Jest to poprawka czytelności bez zmiany obliczeń; została objęta
testem struktury interfejsu i pełną regresją automatyczną.

3E i cały Etap 3 są zakończone. Następny etap to Etap 4 — pompy.
