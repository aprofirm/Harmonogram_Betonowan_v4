# Plan testów — Etap 3: podstawowy silnik gruszek

## Status

Etap 3 jest w toku. **Punkt 3A — generowanie kursów** oraz krok **3B.1 — podstawowe czasy kursów** są zakończone i sprawdzone. Przed 3B.2 kończone są kroki przekrojowe **KP-1 — pamięć planu dnia** i **KP-2 — pamięć znanych tras**. Implementacje automatyczne obu pamięci oraz poprawka zbiorczej archiwizacji **KP-2.7.1** są gotowe, lecz ich punkty nadrzędne pozostają otwarte do zakończenia testów operatora **KP-1.9** i **KP-2.7.2**. Następnie wracamy do **3B.2 — rytm dostaw**, który ma oddzielić odstęp pomiędzy kolejnymi dostawami od fizycznego czasu zajęcia gruszki. Przydział i dostępność konkretnych gruszek pozostają zakresem punktów 3C–3E i nie mogą rozpocząć się przed zamknięciem całego punktu 3B.

## Cel

Potwierdzić, że silnik gruszek odwzorowuje fizyczny cykl pojazdu i potrafi tworzyć kursy bez nakładania zajętości jednej gruszki.

Silnik ma pozostać niezależny od interfejsu HTML oraz od sposobu pozyskania czasu dojazdu. W testach czas dojazdu przekazujemy jako gotową wartość roboczą.

## Założenia robocze zgodne z decyzjami projektu

- domyślna pojemność gruszki: `8 m³`,
- domyślny czas załadunku: `10 min`,
- domyślny czas rozładunku każdego kursu: `15 min`,
- czas dojazdu i powrotu jest w 3B.1 podawany ręcznie dla budowy,
- budowa może posiadać dodatkowy czas załadunku i rozładunku,
- gruszka jest zajęta przez cały cykl: załadunek → dojazd → rozładunek → powrót,
- godzina startu budowy oznacza przyjazd pierwszej gruszki / rozpoczęcie betonowania,
- `StartPlanowany` nie może być nadpisywany,
- pełne przeliczenie ma tworzyć kursy od nowa,
- zmiana liczby dostępnych gruszek ma powodować nowe rzeczywiste wyliczenie.

## Test 1 — liczba kursów dla pełnych ładunków

Dane:

- ilość betonu: `24 m³`,
- pojemność gruszki: `8 m³`.

Oczekiwany wynik:

- dokładnie `3` kursy,
- każdy kurs ma maksymalnie `8 m³`,
- suma ilości betonu w kursach wynosi `24 m³`.

## Test 2 — ostatni niepełny kurs

Dane:

- ilość betonu: `18 m³`,
- pojemność gruszki: `8 m³`.

Oczekiwany wynik:

- dokładnie `3` kursy,
- ilości: `8 m³`, `8 m³`, `2 m³`,
- suma ilości betonu w kursach wynosi `18 m³`.

## Test 3 — jedna mała dostawa

Dane:

- ilość betonu: `5 m³`,
- pojemność gruszki: `8 m³`.

Oczekiwany wynik:

- dokładnie `1` kurs,
- kurs przewozi `5 m³`.

## Test 4 — czas pierwszego załadunku

Dane:

- `StartPlanowany = 08:00`,
- czas dojazdu: `20 min`,
- czas załadunku: `10 min`.

Oczekiwany wynik:

- pierwsza gruszka ma rozpocząć załadunek o `07:30`,
- przyjazd na budowę przypada na `08:00`,
- `StartPlanowany` pozostaje równy `08:00`.

## Test 5 — gruszka jest zajęta do powrotu

Dane przykładowe:

- załadunek: `10 min`,
- dojazd: `20 min`,
- rozładunek: `15 min`,
- powrót: `20 min`.

Oczekiwany wynik:

- pełny cykl zajmuje `65 min`,
- ta sama gruszka nie może otrzymać kolejnego kursu przed zakończeniem powrotu,
- zakończenie rozładunku nie oznacza jeszcze dostępności gruszki.

## Test 6 — brak nakładania kursów jednej gruszki

Dane:

- kilka kursów wymagających obsługi w nakładających się przedziałach czasu,
- dostępna tylko `1` gruszka.

Oczekiwany wynik:

- żadne dwa kursy przypisane tej samej gruszce nie nakładają się czasowo,
- kolejny kurs zaczyna się dopiero wtedy, gdy gruszka jest ponownie dostępna.

## Test 7 — kilka gruszek

Dane:

- kilka kursów,
- dostępne `3` gruszki.

Oczekiwany wynik:

- kursy mogą być wykonywane równolegle przez różne gruszki,
- każda gruszka zachowuje własny czas dostępności,
- jedna gruszka nigdy nie występuje jednocześnie w dwóch kursach.

## Test 8 — minimalna liczba gruszek

Dane:

- scenariusz z ustalonym rytmem dostaw i pełnym czasem cyklu.

Oczekiwany wynik:

- program potrafi wskazać minimalną liczbę gruszek potrzebnych do wykonania założonego rytmu bez konfliktu dostępności,
- wynik wynika z czasów cyklu, a nie z wartości wpisanej na stałe.

## Test 9 — tryb „mam X gruszek”

Dane:

- plan, dla którego płynna realizacja wymaga większej liczby gruszek,
- operator ogranicza liczbę dostępnych gruszek.

Oczekiwany wynik:

- program przelicza kursy ponownie dla rzeczywiście dostępnej liczby gruszek,
- nie zwraca wyłącznie komunikatu „za mało gruszek”,
- konsekwencje ograniczenia są widoczne w nowym wyniku lub konfliktach.

## Test 10 — pełne ponowne przeliczenie

Przebieg:

1. przelicz plan dla `6` gruszek,
2. zmień liczbę gruszek na `4`,
3. przelicz ponownie.

Oczekiwany wynik:

- wynik dla `4` gruszek powstaje od nowa,
- nie pozostają kursy ani przydziały z wyniku dla `6` gruszek,
- identyczne dane wejściowe i ustawienia dają powtarzalny wynik.

## Test 11 — przypadki brzegowe

Należy sprawdzić co najmniej:

- `0 m³` betonu,
- ilość mniejszą od pojemności gruszki,
- ilość równą dokładnie wielokrotności pojemności,
- niepełny ostatni kurs,
- `0` dostępnych gruszek,
- `1` dostępną gruszkę,
- bardzo krótki i długi czas dojazdu,
- ponowne przeliczenie tych samych danych,
- zmianę pojemności gruszki,
- zmianę czasu załadunku.

Błędne wartości wejściowe powinny powodować jasny komunikat po polsku, a nie niekontrolowany błąd aplikacji.

## Regresja Etapu 1 i 2

Po wdrożeniu Etapu 3 nadal muszą działać:

- lokalne uruchomienie `index.html` bez internetu,
- import CSV,
- zmienne kolejności kolumn,
- automatyczne ID `CSV-...`,
- budowy ręczne `RECZNE-...`,
- ponowny import bez mieszania danych,
- diagnostyka i pobieranie raportu,
- zachowanie `StartPlanowany`.

## Testy automatyczne

Zaimplementowane części Etapu 3 sprawdzają osobne pliki:

- `testy/etap_3a.test.js` — liczby i ilości kursów,
- `testy/etap_3b_1.test.js` — godziny pełnego cyklu i wydłużenia.

Testy sprawdzają czystą logikę modułu gruszek bez zależności od DOM i bez połączenia z internetem.
