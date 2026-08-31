# Plan testów — Etap 5: pełny silnik harmonogramu

## Status

Etap 4 jest zamknięty. Punkty **5A–5I** są zakończone. Trwa końcowe domknięcie Etapu 5 w punkcie **5J**; bieżący podetap to **5J.1 — pełna regresja automatyczna**.

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
- [x] jedno centralne wywołanie prowadzi jawnie przez fazy budów, kursów, pomp, gruszek i wyniku końcowego;
- [x] moduł centralnego przebiegu nie zawiera logiki DOM ani obsługi zdarzeń interfejsu;
- [x] identyczne kolejne przeliczenia dają identyczny wynik;
- [x] plan bez ograniczeń zachowuje wynik zamkniętych Etapów 3–4.

## 5B — wpływ pomp na start

- [x] pompa dostępna na czas nie przesuwa budowy;
- [x] zajęta pompa przesuwa tylko `StartRoboczy`;
- [x] przejazd budowa → budowa wpływa na realny start;
- [x] brak możliwej pompy daje konflikt zamiast fikcyjnej godziny;
- [x] przyczyna i liczba minut są zachowane w wyniku.

## 5C — regenerowanie kursów gruszek

- [x] przesunięty `StartRoboczy` tworzy od nowa wszystkie kursy budowy;
- [x] rytm dostaw i fizyczny cykl gruszki pozostają rozdzielone;
- [x] tryb bez limitu i ograniczona flota korzystają z nowych kursów;
- [x] nie pozostają żadne kursy z poprzedniego przeliczenia.

## 5D — rzeczywiste dostawy i pompa

- [x] rzeczywisty okres pompowania korzysta z faktycznych rozładunków;
- [x] niedobór gruszek może wydłużyć okres pracy pompy;
- [x] wydłużenie może opóźnić następną budowę tej samej pompy;
- [x] kaskada co najmniej trzech budów nie tworzy kolizji zasobów.

Testy automatyczne:

- 5D.1: `testy/etap_5d_1.test.js`;
- 5D.2: `testy/etap_5d_2.test.js` — dwie budowy, jedna pompa oraz jedna/dwie gruszki; przy jednej gruszce wydłużenie pierwszej budowy przesuwa drugą z `09:20` na `09:30`, a przy dwóch gruszkach nie powstaje dodatkowa korekta.
- 5D.3: `testy/etap_5d_3.test.js` — trzy budowy A → B → C, jedna pompa i jedna gruszka; kaskada przesuwa B do `09:30` oraz C do `11:00` bez nakładania pracy zasobów.

## 5E — stabilizacja

- [x] silnik powtarza zależne obliczenia tylko po zmianie planu;
Test automatyczny 5E.1: `testy/etap_5e_1.test.js` — stabilny plan wykonuje jeden przydział gruszek, a scenariusz A → B → X → C z jedną pompą i jedną gruszką wymaga trzech przebiegów zależnych oraz kończy z C o `11:25`.

- [x] stabilny wynik kończy iterację;
- [x] identyczne dane mają deterministyczny wynik;
Test automatyczny 5E.2: `testy/etap_5e_2.test.js` — stabilność jest rozpoznawana przez brak zmiany całego zestawu `StartRoboczy`; wynik zwraca jawny stan `stabilny`, liczbę iteracji i przyczynę zakończenia, a dwa pełne przeliczenia identycznych danych są identyczne.
- [x] zabezpieczenie kończy niestabilny przypadek jawnym konfliktem.
Test automatyczny 5E.3: `testy/etap_5e_3.test.js` — normalna kaskada stabilizuje się przed domyślnym limitem `50`, a wymuszony w teście limit `2` zatrzymuje dalsze przesuwanie i tworzy dokładnie jeden konflikt `NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI`; ponowne przeliczenie pozostaje deterministyczne.

## 5F — limit opóźnienia startu

- [x] domyślny limit wynosi `30 min` i jest parametrem;
  Test automatyczny 5F.1: `testy/etap_5f_1.test.js` — domyślne `30 min` pochodzi z `parametryDomyslne`, globalne nadpisanie trafia do wyniku bieżącego przebiegu bez zmiany konfiguracji bazowej, a bezpośrednie wejście silnika odrzuca wartość ujemną i nieliczbową.
- [x] indywidualny limit budowy ma pierwszeństwo;
  Test automatyczny 5F.2: `testy/etap_5f_2.test.js` — puste pole dziedziczy limit globalny, wartość `45` nadpisuje globalne `30`, `0` jest dozwolone, wyczyszczenie/`↺` przywraca dziedziczenie, a błędne wartości są odrzucane.
- [x] przesunięcie w limicie jest zwykłą korektą;
- [x] przekroczenie limitu tworzy jawny konflikt;
- [x] wartości są zachowywane w pamięci planu i historii.
  5F.2 sprawdza round-trip bieżącego planu i zapisu historycznego oraz obecność pola na jawnej liście danych budowy zapisywanych przez aplikację.

Test automatyczny 5F.3: `testy/etap_5f_3.test.js` — końcowy scenariusz
A → B → X → C rozróżnia brak opóźnienia, korektę `10 min` w limicie oraz
konflikt `35 min` przy globalnym limicie `30 min`. Test potwierdza konflikt z
obiema godzinami i przekroczeniem o `5 min`, pierwszeństwo limitu indywidualnego,
brak konfliktu dokładnie na granicy oraz deterministyczny wynik bez mutowania
danych źródłowych.

## 5G — przestój w trakcie betonowania

- [x] opóźnienie pierwszej dostawy nie jest przestojem;
- [x] przestój jest liczony pomiędzy końcem jednego rzeczywistego rozładunku a początkiem następnego;
- [x] wyłącznie faktycznie przydzielone kursy tworzą kolejne pary dostaw;
- [x] każda para zachowuje ID i numery obu kursów, rzeczywiste godziny oraz długość przerwy, także `0 min` przy ciągłości;
- [x] `MaksPrzestojMin` jest osobnym parametrem, domyślnie `15 min`;
- [x] przekroczenie wskazuje konkretną parę dostaw i liczbę minut.

Test automatyczny 5G.1: `testy/etap_5g_1.test.js` — trzy dostawy jednej budowy
przy jednej gruszce tworzą dwie rzeczywiste przerwy po `10 min`, a przy dwóch
gruszkach te same pary mają `0 min`. Osobny scenariusz opóźnia pierwszą dostawę
o `15 min`, lecz zapisuje wyłącznie późniejszą przerwę `10 min` między pierwszym
i drugim rozładunkiem. Test potwierdza też puste analizy dla pojedynczej dostawy
i kursów bez przydzielonej gruszki, dokładny kontrakt par, brak konfliktu w 5G.1,
niemutowanie danych źródłowych oraz deterministyczny wynik.

Test automatyczny 5G.2: `testy/etap_5g_2.test.js` — domyślny parametr
`maksymalnyPrzestojMinuty` wynosi `15`, jest jawny w wyniku i pozostaje
niezależny od limitu opóźnienia startu. Test potwierdza nadpisanie wartością
`20`, poprawny limit `0`, brak zmiany domyślnej konfiguracji i wejścia,
odrzucenie wartości ujemnej, nieliczbowej i nieskończonej oraz brak konfliktu,
który należy dopiero do 5G.3.

Test automatyczny 5G.3: `testy/etap_5g_3.test.js` — każda para rzeczywistych
dostaw przekraczająca limit tworzy osobny konflikt z budową, oboma kursami,
czasem przestoju, limitem i wielkością przekroczenia; granica równa limitowi
pozostaje dozwolona.

## 5H — wspólny model konfliktów

- [x] brak gruszki;
- [x] brak pompy;
- [x] niedostępna lub niezgodna pompa;
- [x] brak trasy pompy;
- [x] kolizja zasobów;
- [x] przekroczenie limitu startu;
- [x] przekroczenie maksymalnego przestoju;
- [x] konflikty nie są dublowane i mają czytelne przyczyny po polsku.

Testy automatyczne 5H.1–5H.3 potwierdzają wspólny wersjonowany kontrakt,
stabilną agregację bez duplikatów oraz osobny, czytelny `komunikatOperatora`
bez utraty technicznych danych konfliktu.

## 5I — interfejs i pamięć

- [x] operator widzi plan źródłowy, zadany i roboczy;
- [x] wielkość oraz przyczyna przesunięcia są jawne;
- [x] konflikty mają tekst, nie tylko kolor;
- [x] zmiana parametrów unieważnia stary wynik;
- [x] odświeżenie zachowuje parametry i wyjątki, a wynik jest liczony ponownie.

Testy automatyczne 5I.1–5I.3 potwierdzają trzy znaczenia godziny startu,
tekstową prezentację konfliktów i przestojów, pamięć limitów oraz jawne
unieważnianie wyniku po istotnej zmianie.

## 5J — regresja, publikacja i test operatora

- [x] pełna regresja importu i pamięci;
- [x] pełna regresja Etapu 3 — gruszki;
- [x] pełna regresja Etapu 4 — pompy;
- [ ] publikacja `main` i GitHub Pages;
- [ ] test operatora: przesunięcie pompą, niedobór gruszek, kaskada, limit startu, przestój i brak możliwego zasobu.

Test automatyczny 5J.1: `testy/etap_5j_1.test.js` — pilnuje obecności wszystkich
27 testów podetapów 5A–5I, kluczowych testów wcześniejszych etapów oraz tego,
że GitHub Actions uruchamia pełny zestaw `testy/*.test.js`. Właściwe CI wykonuje
pełną regresję każdego zestawu; po dodaniu 5J.1 obejmuje ona 92 testy.

Etap 5 można zamknąć dopiero po wykonaniu całego 5J.
