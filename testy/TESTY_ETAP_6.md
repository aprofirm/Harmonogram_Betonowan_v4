# Plan testów — Etap 6: adresy, lokalizacje i trasy

## Status

Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**
i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Następny podetap to
**6F.1 — wyszukiwanie lokalizacji**.

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
- test zachowuje historyczne kryteria zamknięcia 6A.1 niezależnie od dalszego
  postępu Etapu 6.

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

### 6B.1 — rozpoznawanie kolumn adresowych

Test `testy/etap_6b_1.test.js` sprawdza:

- pełny adres w pojedynczej kolumnie;
- adres rozbity na ulicę, numer budynku, kod pocztowy, miejscowość, gminę,
  powiat, województwo i kraj;
- polskie i angielskie warianty nazw, polskie znaki oraz dowolną kolejność
  kolumn;
- jednoczesne zachowanie pełnego tekstu i osobnych części adresu;
- rozdzielenie nazwy budowy od danych adresowych;
- przekazanie rozpoznanych wartości do modelu lokalizacji bez przedwczesnej
  normalizacji lub oceny jakości;
- zgodność pliku bez kolumn adresowych z dotychczasowym importem.


### 6B.2 — normalizacja bez utraty źródła

Test `testy/etap_6b_2.test.js` sprawdza:

- zachowanie pełnego źródłowego tekstu i części adresu bez wpisywania
  normalizacji do `daneZrodlowe`;
- utworzenie `daneRobocze.adres.tekstZnormalizowany` z pełnego adresu;
- deterministyczne złożenie tekstu roboczego z ulicy, numeru, kodu,
  miejscowości i dostępnych danych administracyjnych, gdy brak pełnego tekstu;
- usuwanie wyłącznie technicznych różnic zapisu: wielkości liter, polskich
  znaków, interpunkcji i nadmiarowych odstępów;
- brak podobieństwa tekstowego: rzeczywiście różne adresy pozostają różne;
- zachowanie osobnych `idLokalizacji` dla dwóch budów o identycznym lub podobnym
  swobodnym opisie;
- uzupełnienie starszego modelu wersji `1` bez utraty ręcznej warstwy roboczej;
- brak przedwczesnej oceny jakości i brak zależności od usługi mapowej.

### 6B.3 — statusy i komunikaty

Test `testy/etap_6b_3.test.js` sprawdza:

- lokalny status `pelna` dla adresu strukturalnego z ulicą, numerem i
  miejscowością oraz dla jednoznacznie złożonego pełnego tekstu;
- status `niepelna` dla danych nadających się do ostrożnej próby wyszukania,
  ale wymagających sprawdzenia wyniku;
- status `niewystarczajaca` dla zbyt ubogich danych i zgodnościowego opisu
  opartego tylko na nazwie budowy;
- status `brak` dla rzeczywistego braku danych adresowych;
- gotowe komunikaty dla `niejednoznaczna`, `nieznaleziona` i `potwierdzona`
  bez lokalnego zgadywania wyniku geokodowania;
- zachowanie `daneZrodlowe.statusJakosci = nieoceniona` przy lokalnej ocenie
  wyłącznie warstwy roboczej;
- dalsze użycie ręcznych czasów bez wywołania mapy przy adresie
  niewystarczającym;
- aktualizację dokumentacji, zamknięcie całego punktu 6B i przejście do 6C.1.

### 6C.1 — model węzła

Test `testy/etap_6c_1.test.js` sprawdza:

- wymagane, stabilne `idWezla` i nazwę węzła;
- użycie wspólnego modelu lokalizacji typu `wezel` zamiast osobnego formatu;
- przechowywanie adresu i pełnej pary współrzędnych w warstwie roboczej;
- odrzucenie sprzecznego ID lub typu lokalizacji;
- zwracanie tego samego aktywnego modelu węzła w bieżącej sesji;
- używanie ID aktywnego węzła w modelach tras węzeł ↔ budowa;
- przekazanie całego modelu węzła do przyszłego zapytania mapowego;
- zachowanie granicy zakresu: brak formularza i trwałego zapisu przed 6C.2.

### 6C.2 — ustawienie i pamięć

Test `testy/etap_6c_2.test.js` sprawdza:

- wymaganie nazwy oraz adresu albo pełnej pary współrzędnych;
- odrzucenie pojedynczej współrzędnej i pozostawienie walidacji zakresów
  wspólnemu modelowi lokalizacji;
- zachowanie źródłowego tekstu adresu oraz osobnej normalizacji roboczej;
- ręczne źródło i jawny znacznik korekty operatora;
- zachowanie stabilnego ID węzła przy korekcie nazwy, adresu lub współrzędnych;
- wersjonowany zapis `localStorage` i odtworzenie po ponownym uruchomieniu;
- bezpieczny tryb bieżącej sesji przy zablokowanym `localStorage`;
- pominięcie uszkodzonego zapisu bez blokowania harmonogramu;
- obecność kompaktowego formularza ustawień betoniarni w interfejsie;
- aktualizację dokumentacji i przejście do 6C.3 bez podłączania dostawcy map.

### 6C.3 — gotowość na wiele węzłów

Test `testy/etap_6c_3.test.js` sprawdza:

- jawne `idWezla` i zakresowany klucz lokalizacji dla budowy;
- różne klucze tej samej budowy dla dwóch różnych węzłów;
- zakresowane klucze tras węzeł ↔ budowa oraz budowa → budowa;
- odrzucenie sprzecznego ID węzła i punktu węzła;
- brak cichego fallbacku do `wezel-domyslny` w pamięci tras;
- dwa niezależne wpisy cache dla identycznego opisu przy różnych węzłach;
- automatyczne przypięcie modeli bieżącej budowy do aktywnego węzła;
- zachowanie formatu pamięci `v1` przed migracją 6D.1;
- aktualizację dokumentacji, zamknięcie całego 6C i przejście do 6D.1.

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


## Wynik 6D.1

- format pamięci tras podniesiono do `v2`;
- zapis v2 zachowuje adres, współrzędne, dystanse, oba kierunki czasu, źródło, dostawcę i daty;
- migracja `v1 → v2` zachowuje wcześniejsze czasy i pozostawia oryginalny `v1` jako kopię bezpieczeństwa;
- brak nowych metadanych w starym wpisie nie blokuje ręcznych ani zapamiętanych czasów;
- 6D.1 nie zmienia jeszcze reguły identyfikacji duplikatów — to zakres 6D.2;
- test `testy/etap_6d_1.test.js` wraz z pełną regresją przechodzi **105/105 zestawów testów**.

### 6D.2 — stabilny klucz i duplikaty

Test `testy/etap_6d_2.test.js` sprawdza:

- jeden wpis dla tego samego węzła i tego samego znormalizowanego adresu mimo
  zmiany etykiety firmy lub budowy;
- osobne wpisy dla identycznej nazwy przy różnych adresach;
- pierwszeństwo dokładnych współrzędnych przed tekstem adresu;
- osobny zakres tej samej lokalizacji dla różnych `idWezla`;
- pozostawienie `Firma | Budowa` jako zgodności dla danych bez rzeczywistego
  adresu i brak dopasowania podobnych opisów;
- jawny stan niejednoznaczny, gdy stare wywołanie tylko po opisie pasuje do
  kilku stabilnych lokalizacji;
- migrację istniejącego `v2` sprzed 6D.2 i scalenie duplikatów tego samego
  stabilnego klucza bez utraty najnowszych czasów;
- integrację bramy `aplikacja.lokalizacje`: inna nazwa pod tym samym adresem
  korzysta z cache, a ta sama nazwa pod innym adresem nie;
- aktualizację dokumentacji, **106/106 zestawów testów** i przejście do 6D.3.


### 6D.3 — cache i lokalne podpowiedzi

Test `testy/etap_6d_3.test.js` sprawdza:

- lokalne wyszukiwanie pamięci po nazwie i rzeczywistym adresie bez wywołania sieci;
- ograniczenie wyników do aktywnego `idWezla`;
- brak fuzzy matchingu i brak zmiany `ostatnioUzyto` przez samo wyszukiwanie;
- wiele kandydatów dla wspólnej nazwy przy różnych adresach bez automatycznego wyboru;
- pierwszeństwo dokładnego cache przed podpowiedziami i internetem;
- zatrzymanie przed internetem przy niejednoznacznej lokalnej podpowiedzi;
- jawne zastosowanie wyłącznie konkretnego `kluczTrasy`;
- zachowanie źródłowego adresu oraz istniejących ręcznych czasów;
- wyszukiwanie adresu w istniejącym oknie **Zapisane trasy**;
- zamknięcie całego punktu 6D, aktualizację dokumentacji i przejście do 6E.1.

Pełna regresja po 6D.3 obejmuje **107/107 zestawów testów**.


### 6E.1 — porównanie i decyzja

Test `testy/etap_6e_1.test.js` sprawdza, że:

- dokument `DOSTAWCA_MAP_6E1.md` jawnie wybiera openrouteservice / HeiGIT do pierwszej integracji i używa aktualnego hosta `api.heigit.org`;
- zapisane są sprawdzone limity planu Standard oraz wymagane parametry ciężkiego pojazdu;
- TomTom pozostaje jawnym kandydatem rezerwowym, a ograniczenie geograficzne Google dla Large Vehicle Routing jest odnotowane;
- klucz API nie może być zapisany w repozytorium;
- 6E.1 nie dodaje zależności dostawcy do plików silnika harmonogramu;
- punkt 6E pozostaje otwarty, 6E.1 jest zakończony, a następnym krokiem jest 6E.2;
- pełna regresja obejmuje **108/108 zestawów testów**.


### 6E.2 — neutralny adapter

Test `testy/etap_6e_2.test.js` sprawdza:

- wersjonowany kontrakt `geokoduj` i `wyznaczTrase` niezależny od dostawcy;
- usuwanie surowych pól odpowiedzi dostawcy przed zwróceniem wyniku do aplikacji;
- mapowanie kandydata geokodowania na adres, współrzędne, status i źródło projektu;
- mapowanie dystansu oraz czasu routingu na jednostki używane przez modele Etapu 6;
- implementację openrouteservice na aktualnym hoście `api.heigit.org` i profilu `driving-hgv`;
- przekazywanie klucza wyłącznie w nagłówku runtime, bez umieszczania go w URL;
- mapowanie długości, szerokości, wysokości, nacisku osi i masy ciężarówki na parametry implementacji dostawcy;
- dwa niezależne kierunki węzeł → budowa i budowa → węzeł w moście do bieżącej bramy;
- zgodność `pobierzLubUstalTrase` zarówno ze starszą funkcją mapową, jak i obiektem adaptera;
- brak nazwy konkretnego dostawcy w kodzie silnika harmonogramu;
- użycie wyłącznie atrap HTTP w testach automatycznych;
- aktualizację dokumentacji, 109/109 zestawów regresji i przejście do 6E.3.

### 6E.3 — bezpieczne błędy

Test `testy/etap_6e_3.test.js` sprawdza:

- neutralne statusy dla braku konfiguracji, braku sieci, timeoutu, HTTP 429, HTTP 4xx/5xx i wadliwej odpowiedzi;
- prosty komunikat operatora i znacznik `czyPonowicPozniej`;
- brak odrzucenia obietnicy do silnika dla błędów zewnętrznej usługi;
- brak drugiego zapytania o powrót, gdy pierwszy kierunek zakończył się błędem;
- diagnostykę bez adresu, endpointu, odpowiedzi dostawcy i klucza API;
- propagowanie neutralnego statusu przez `pobierzLubUstalTrase`;
- zachowanie pierwszeństwa bieżących/ręcznych czasów, cache i lokalnych podpowiedzi przed internetem.

Po 6E.3 cały punkt **6E** jest zakończony, a następny podetap to **6F.1**.
