# Plan testów — Etap 5: pełny silnik harmonogramu

## Status

Etap 4 jest zamknięty. Etap 5 jest rozpisany przed rozpoczęciem implementacji.
Podetap **5A.1** jest zakończony. Następny podetap: **5A.2 — czysty centralny przebieg**.

## Najważniejsza zasada testowa

Etap 5 łączy wynik pomp i gruszek. Testy muszą sprawdzać również sprzężenie zwrotne:
przesunięcie budowy przez pompę zmienia kursy, a opóźnione kursy mogą wydłużyć pracę
pompy i wpłynąć na następną budowę. Wynik ma być stabilny albo zakończony jawnym
konfliktem — nigdy bezgranicznym przesuwaniem.

## 5A — kontrakt i centralny przebieg

- [x] `StartPlanowany` pozostaje niezmienny;
- [x] `StartZadany` pozostaje decyzją operatora;
- [x] `StartRoboczy` jest wynikiem ograniczeń silnika;
- [x] pełne przeliczenie nie mutuje danych wejściowych;
- [ ] identyczne kolejne przeliczenia dają identyczny wynik;
- [ ] plan bez ograniczeń zachowuje wynik zamkniętych Etapów 3–4.

## 5B — wpływ pomp na start

- [ ] pompa dostępna na czas nie przesuwa budowy;
- [ ] zajęta pompa przesuwa tylko `StartRoboczy`;
- [ ] przejazd budowa → budowa wpływa na realny start;
- [ ] brak możliwej pompy daje konflikt zamiast fikcyjnej godziny;
- [ ] przyczyna i liczba minut są zachowane w wyniku.

## 5C — regenerowanie kursów gruszek

- [ ] przesunięty `StartRoboczy` tworzy od nowa wszystkie kursy budowy;
- [ ] rytm dostaw i fizyczny cykl gruszki pozostają rozdzielone;
- [ ] tryb bez limitu i ograniczona flota korzystają z nowych kursów;
- [ ] nie pozostają żadne kursy z poprzedniego przeliczenia.

## 5D — rzeczywiste dostawy i pompa

- [ ] rzeczywisty okres pompowania korzysta z faktycznych rozładunków;
- [ ] niedobór gruszek może wydłużyć okres pracy pompy;
- [ ] wydłużenie może opóźnić następną budowę tej samej pompy;
- [ ] kaskada co najmniej trzech budów nie tworzy kolizji zasobów.

## 5E — stabilizacja

- [ ] silnik powtarza zależne obliczenia tylko po zmianie planu;
- [ ] stabilny wynik kończy iterację;
- [ ] identyczne dane mają deterministyczny wynik;
- [ ] zabezpieczenie kończy niestabilny przypadek jawnym konfliktem.

## 5F — limit opóźnienia startu

- [ ] domyślny limit wynosi `30 min` i jest parametrem;
- [ ] indywidualny limit budowy ma pierwszeństwo;
- [ ] przesunięcie w limicie jest zwykłą korektą;
- [ ] przekroczenie limitu tworzy jawny konflikt;
- [ ] wartości są zachowywane w pamięci planu i historii.

## 5G — przestój w trakcie betonowania

- [ ] opóźnienie pierwszej dostawy nie jest przestojem;
- [ ] przestój jest liczony pomiędzy końcem jednego rzeczywistego rozładunku a początkiem następnego;
- [ ] `MaksPrzestojMin` jest osobnym parametrem;
- [ ] przekroczenie wskazuje konkretną parę dostaw i liczbę minut.

## 5H — wspólny model konfliktów

- [ ] brak gruszki;
- [ ] brak pompy;
- [ ] niedostępna lub niezgodna pompa;
- [ ] brak trasy pompy;
- [ ] kolizja zasobów;
- [ ] przekroczenie limitu startu;
- [ ] przekroczenie maksymalnego przestoju;
- [ ] konflikty nie są dublowane i mają czytelne przyczyny po polsku.

## 5I — interfejs i pamięć

- [ ] operator widzi plan źródłowy, zadany i roboczy;
- [ ] wielkość oraz przyczyna przesunięcia są jawne;
- [ ] konflikty mają tekst, nie tylko kolor;
- [ ] zmiana parametrów unieważnia stary wynik;
- [ ] odświeżenie zachowuje parametry i wyjątki, a wynik jest liczony ponownie.

## 5J — regresja, publikacja i test operatora

- [ ] pełna regresja importu i pamięci;
- [ ] pełna regresja Etapu 3 — gruszki;
- [ ] pełna regresja Etapu 4 — pompy;
- [ ] publikacja `main` i GitHub Pages;
- [ ] test operatora: przesunięcie pompą, niedobór gruszek, kaskada, limit startu, przestój i brak możliwego zasobu.

Etap 5 można zamknąć dopiero po wykonaniu całego 5J.
