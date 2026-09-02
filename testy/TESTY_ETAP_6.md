# Plan testów — Etap 6: adresy, lokalizacje i trasy

## Status

Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**
i cały punkt **6A** są zakończone. Następny podetap to **6B.1 — rozpoznawanie
kolumn adresowych**.

## Zasada nadrzędna

Brak internetu, błąd geokodowania albo awaria routingu nie mogą zatrzymać
aplikacji ani odebrać operatorowi możliwości ułożenia harmonogramu z pamięci
lub z ręcznie wpisanych czasów.

## Zakres testów automatycznych

- **6A:** wersjonowany kontrakt adresu, lokalizacji i trasy, zgodność starszych
  planów oraz używanie przez silnik wyłącznie wartości roboczych;
- **6B:** warianty kolumn KDX/CSV, zachowanie danych źródłowych, normalizacja i
  statusy pełnego, niepełnego, niewystarczającego i niejednoznacznego adresu;
- **6C:** walidacja i pamięć punktu węzła oraz klucze przygotowane na wiele
  węzłów;
- **6D:** migracja książki tras, jednoznaczne klucze, brak błędnego łączenia
  podobnych nazw, pierwszeństwo cache i lokalne podpowiedzi;
- **6E:** neutralny adapter usługi, timeout, limit, brak sieci, zły format
  odpowiedzi i brak przenikania dostawcy do silnika harmonogramu;
- **6F:** geokodowanie, wiele wyników bez cichego wyboru, ręczne zatwierdzenie
  adresu lub współrzędnych;
- **6G:** kierunkowy dystans i czas węzeł ↔ budowa, osobne dane automatyczne i
  robocze oraz ochrona ręcznej korekty;
- **6H:** niezależne `A → B` i `B → A`, zasilanie istniejącego kontraktu
  przejazdów pomp, cache oraz jawny brak trasy;
- **6I:** stan nieaktualny po zmianie, zapis i odtworzenie planu, tryb offline
  oraz brak awarii przy niedostępnej usłudze;
- **6J:** pełna regresja importu, pamięci, gruszek, pomp, harmonogramu i
  konfliktów.

Każdy adapter sieciowy ma być testowany funkcją zastępczą. Testy automatyczne
nie mogą zależeć od chwilowej dostępności publicznego serwera map.

### 6A.1 — granice modułów

Test `testy/etap_6a_1.test.js` sprawdza, że:

- `KONTRAKT_LOKALIZACJI_I_TRAS.md` obejmuje wszystkie obecne moduły przepływu;
- jedyną bramą domenową roboczego wyniku trasy jest
  `aplikacja.lokalizacje`;
- `pobierzLubUstalTrase` pozostaje istniejącym wejściem do wspólnego przepływu;
- harmonogram nie używa `fetch`, dostawcy map ani pamięci przeglądarki;
- przejazdy pomp nadal przyjmują kierunkowe `czasPrzejazduMinuty` i źródło;
- 6A oraz Etap 6 pozostają otwarte, a następnym podetapem jest 6A.2.

### 6A.2 — wersjonowany model

Test `testy/etap_6a_2.test.js` sprawdza:

- kontrakt wersji `1` dla lokalizacji i trasy;
- niezależne `daneZrodlowe`, `daneAutomatyczne` i `daneRobocze`;
- adres, współrzędne, dystans drogowy, czas, status jakości, źródło i znacznik
  ręcznej korekty;
- wyznaczanie relacji i kierunku z punktów trasy;
- odrzucenie ujemnych wartości, błędnych współrzędnych, nieznanych źródeł i
  sprzecznego kierunku;
- zachowanie istniejącego API bramy `aplikacja.lokalizacje`;
- brak nazwy konkretnego dostawcy w modelu.

### 6A.3 — migracja i niezmienniki

Test `testy/etap_6a_3.test.js` sprawdza:

- automatyczną migrację starszych płaskich czasów do modeli wersji `1`;
- podłączenie dotychczasowej książki tras do warstwy roboczej ze źródłem
  `pamiec`;
- pierwszeństwo istniejącej ręcznej korekty przed wartością automatyczną;
- zachowanie warstwy automatycznej po ręcznej zmianie i świadomym usunięciu
  wartości roboczej;
- przejście edycji z tabeli przez bramę `aplikacja.lokalizacje`;
- zapis modeli w planie aplikacji wersji `4` i migrację starszego zapisu;
- dalszą izolację silnika od modeli lokalizacji, pamięci, sieci i dostawcy map.

## Końcowy test operatora 6J.3

Przed zamknięciem Etapu 6 operator sprawdzi na opublikowanej stronie:

1. kompletny prawdziwy adres i poprawną trasę drogową;
2. adres niepełny albo niejednoznaczny i brak cichego wyboru lokalizacji;
3. świadomy wybór lub ręczne wskazanie poprawnej lokalizacji;
4. widoczny dystans, czas, źródło i ręczną korektę bez automatycznego nadpisania;
5. kierunkowy przejazd pompy pomiędzy dwiema budowami;
6. ponowne użycie zapamiętanej lokalizacji i trasy;
7. odłączenie internetu oraz dalsze działanie z cache albo ręcznymi czasami;
8. czytelny komunikat po wymuszonym błędzie usługi mapowej.

Do repozytorium wolno zapisać wyłącznie dane sztuczne lub zanonimizowane.
Rzeczywiste adresy użyte przez operatora nie trafiają do testów ani historii
projektu.

## Kryterium zamknięcia

Etap 6 można zamknąć dopiero po ukończeniu **6A–6J**, zielonej pełnej regresji,
publikacji `main` i GitHub Pages oraz potwierdzeniu całego scenariusza 6J.3 przez
operatora.
