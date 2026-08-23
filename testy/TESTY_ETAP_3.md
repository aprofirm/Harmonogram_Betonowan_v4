# Plan testów — Etap 3: podstawowy silnik gruszek

## Status

Etap 3 jest zakończony. Punkty **3A — generowanie kursów**, cały **3B — czasy
cyklu i rytm dostaw** oraz cały **3C — przydział konkretnych gruszek** są
zakończone i sprawdzone. Zakończone pozostają również kroki przekrojowe
**KP-1–KP-3**.

Punkt **3D — minimalna liczba gruszek** jest zakończony wraz z publikacją i
testem operatora. Punkt **3E — tryb „mam X gruszek”** również jest zakończony:
ograniczony przydział, przesuwanie pełnego cyklu, widoczne skutki, pamięć,
publikacja i test operatora zostały zaliczone. Następny duży krok to rozpisanie
podetapów **Etapu 4 — pompy**.

## Cel

Potwierdzić, że silnik gruszek odwzorowuje fizyczny cykl pojazdu i potrafi tworzyć kursy bez nakładania zajętości jednej gruszki.

Silnik ma pozostać niezależny od interfejsu HTML oraz od sposobu pozyskania czasu dojazdu. W testach czas dojazdu przekazujemy jako gotową wartość roboczą.

## Założenia robocze zgodne z decyzjami projektu

- domyślna pojemność gruszki: `8 m³`,
- domyślny czas załadunku: `10 min`,
- domyślny czas rozładunku każdego kursu: `15 min`,
- czas dojazdu i powrotu jest w 3B.1 podawany ręcznie dla budowy,
- budowa może posiadać dodatkowy czas załadunku oraz dokładny ręczny czas
  rozładunku zastępujący wartość z ustawień,
- budowa przechowuje osobny nieujemny dodatkowy odstęp dostaw, domyślnie
  `0 min`; starsze dane bez tej wartości są traktowane jak `0 min`,
- rytm dostaw jest równy dokładnemu czasowi rozładunku powiększonemu o osobny
  dodatkowy odstęp,
- pierwszy rozładunek zaczyna się o `StartRoboczy`, a kolejne według rytmu,
- dodatkowy odstęp nie jest częścią fizycznego cyklu kursu ani maksymalnym
  dopuszczalnym przestojem,
- pusta wartość w istniejącej kolumnie KDX **Rodzaj rozładunku** oznacza
  **Odbiór własny**; brak całej kolumny nie uruchamia takiego założenia,
- odbiór własny nie wymaga dojazdu ani powrotu, nie tworzy kursów i pozostaje
  poza automatycznym harmonogramem,
- `Lej`, `Pompa`, `Wywrotka` i `Taczka` pozostają dostawami planowanymi,
- gruszka jest zajęta przez cały cykl: załadunek → dojazd → rozładunek → powrót,
- godzina startu budowy oznacza przyjazd pierwszej gruszki / rozpoczęcie betonowania,
- `StartPlanowany` nie może być nadpisywany,
- pełne przeliczenie ma tworzyć kursy od nowa,
- zmiana liczby dostępnych gruszek ma powodować nowe rzeczywiste wyliczenie.

## Wynik 3B.2.6 — testy i regresja

- [x] test rytmu dla dodatkowego odstępu `0`;
- [x] test rytmu dla odstępu większego od zera;
- [x] różne dokładne czasy rozładunku;
- [x] wydłużony czas załadunku bez zmiany godziny dostawy;
- [x] stabilne przeplatanie kursów różnych budów według początku załadunku;
- [x] walidacja błędnych wartości odstępu i zgodność starszych danych;
- [x] zapis pola odstępu w warstwie pamięci aplikacji;
- [x] testy rodzaju rozładunku i odbiorów własnych dopasowane do aktualnej architektury;
- [x] interfejs odstępu i interfejs rodzaju rozładunku rozdzielone na osobne moduły;
- [x] pełna regresja wszystkich `testy/*.test.js` uruchomiona przez GitHub Actions i zakończona statusem `success` 2026-08-17.

3B.2.6 jest zakończony.

## Wynik 3B.2.7 — publikacja i test operatora

- [x] GitHub Pages opublikował aktualną wersję bez błędu;
- [x] rzeczywisty plan KDX przeliczył się poprawnie;
- [x] dla rozładunku `15 min` i odstępu `5 min` uzyskano rytm `20 min`:
  `09:00`, `09:20`, `09:40`, `10:00`;
- [x] dodatkowy odstęp nie wydłużył fizycznego cyklu gruszki;
- [x] wspólna kolejność kursów różnych budów pozostała poprawna;
- [x] operator zaakceptował wynik i zamknięcie punktu 3B.2.7.

3B.2.7, cały 3B.2 oraz cały 3B są zakończone. Następny punkt to 3C — przydział konkretnych gruszek do kursów. Testy dotyczące braku nakładania kursów jednej gruszki pozostają do wykonania w 3C; minimalna liczba gruszek należy do 3D, a tryb „mam X gruszek” do 3E.

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

Status: zakończone w 3D wraz z testem operatora 3D.5.2.

## Test 9 — tryb „mam X gruszek”

Dane:

- plan, dla którego płynna realizacja wymaga większej liczby gruszek,
- operator ogranicza liczbę dostępnych gruszek.

Oczekiwany wynik:

- program przelicza kursy ponownie dla rzeczywiście dostępnej liczby gruszek,
- nie zwraca wyłącznie komunikatu „za mało gruszek”,
- konsekwencje ograniczenia są widoczne w nowym wyniku lub konfliktach.

Status: zaimplementowane, sprawdzone przez `testy/etap_3e.test.js`, opublikowane
i potwierdzone przez operatora w 3E.6.

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
- `testy/etap_3b_1.test.js` — godziny pełnego cyklu i wydłużenia,
- `testy/etap_3b_2.test.js` — model odstępu, rytm `0` i większy od zera,
  różne czasy rozładunku, wydłużony załadunek, przeplatanie budów, walidacja i
  kontrola pamięci,
- `testy/rodzaj_rozladunku.test.js` — logika rodzaju rozładunku i kontrola
  podziału odpowiedzialności modułów,
- `testy/odbior_wlasny_tabela.test.js` — rzeczywisty wariant KDX i osobna tabela
  odbiorów własnych,
- `testy/etap_3d.test.js` — minimalna liczba gruszek dla pustego planu,
  jednego zasobu i nakładających się kursów oraz jej prezentacja w interfejsie.

Workflow `.github/workflows/testy.yml` uruchamia wszystkie testy `testy/*.test.js`
na GitHub Actions. Regresja 3B.2.6 przeszła poprawnie. Zwykłe działanie aplikacji
nie wymaga Node.js ani połączenia z internetem.

## Wynik 3C.1–3C.2

- [x] pełny podział 3C zapisano przed integracją z aplikacją;
- [x] niezależny moduł przydziału nie zależy od interfejsu;
- [x] nakładające się cykle nie dostają tej samej gruszki;
- [x] kurs dokładnie od minuty powrotu może użyć tej samej gruszki;
- [x] numerowanie jest stabilne i deterministyczne;
- [x] puste dane dają pusty wynik, a błędne czasy kończą się czytelnym błędem;
- [x] szczegółowy scenariusz znajduje się w `TESTY_ETAP_3C.md`;
- [x] test automatyczny znajduje się w `etap_3c.test.js`.

3C.1 i 3C.2 są zakończone. Pełny wynik testów i zamknięcie całego 3C opisuje
`TESTY_ETAP_3C.md`. Cały Etap 3 jest zakończony; następny duży krok to
rozpisanie podetapów Etapu 4.
