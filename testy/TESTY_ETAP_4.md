# Plan testów — Etap 4: pompy

## Status

Etap 4 jest rozpoczęty. Podetap **4A.1 — kwalifikacja budów wymagających pompy**
jest zaimplementowany i ma osobny test `testy/etap_4a_1.test.js`. Następny
podetap to **4A.2 — czas obsługi pompy**. Pełna regresja obejmuje obecnie `24`
zestawy testów.

## Cel

Potwierdzić, że pompa jest niezależnym, pełnoprawnym zasobem, który pozostaje
zajęty przez cały okres obsługi betonowania oraz potrzebne przejazdy. Jedna
pompa nie może obsługiwać dwóch budów jednocześnie.

Etap 4 ma wyliczać osobny wynik pomp. Docelowe przesuwanie `StartRoboczy`,
ponowne generowanie kursów gruszek i wspólne rozwiązywanie niedoboru obu zasobów
należą do Etapu 5.

## Dane testowe

Testy automatyczne korzystają wyłącznie z danych sztucznych. Zestaw powinien
obejmować:

- budowę z rodzajem rozładunku `Pompa`,
- budowy `Lej`, `Wywrotka`, `Taczka` i `Odbiór własny`,
- starszą budowę bez informacji o rodzaju rozładunku,
- pompę własną i zewnętrzną,
- pompę aktywną i nieaktywną,
- pompy dostępne od początku dnia i od późniejszej godziny,
- jedną budowę oraz kilka nakładających się budów,
- przejazd z bazy i przejazdy pomiędzy budowami,
- parametry techniczne pasujące i niepasujące do budowy.

## Testy podetapów

### 4A — reguły i granice

- [x] tylko właściwie zakwalifikowana budowa trafia do silnika pomp;
- [x] pozostałe rodzaje rozładunku nie otrzymują pompy;
- [x] starsze dane bez kolumny nie są bez ostrzeżenia uznawane za pompowane;
- [x] kwalifikacja nie nadpisuje `StartPlanowany` ani kursów gruszek;
- brakujące decyzje pozostają opisane w backlogu zamiast trafiać do kodu jako
  ukryte wartości domyślne.

### 4B–4C — model, lista i pamięć

- każda pompa ma stabilne, unikalne ID;
- typ pompy jest ograniczony do wartości obsługiwanych przez model;
- pompa nieaktywna nie może zostać przydzielona;
- dodanie, edycja, wyłączenie i usunięcie pompy daje przewidywalny wynik;
- lista jest odtwarzana po odświeżeniu i z historii planu;
- starszy zapis bez listy pomp nadal daje się bezpiecznie otworzyć.

### 4D — pełny okres zajętości

- zajętość obejmuje przygotowanie, całe betonowanie i czynności końcowe;
- koniec pojedynczego rozładunku gruszki nie zwalnia pompy;
- jedna i wiele dostaw dają poprawny początek oraz koniec pracy;
- budowa bez betonu albo niewymagająca pompy nie tworzy zajętości;
- nieprawidłowe czasy kończą się czytelnym błędem.

### 4E — przejazdy

- pierwszy przydział uwzględnia `baza → budowa`;
- kolejny przydział uwzględnia `budowa A → budowa B`;
- czasy w przeciwnych kierunkach mogą być różne;
- brak potrzebnej trasy jest jawny i nie tworzy fikcyjnego przejazdu;
- silnik działa dla gotowych minut bez internetu i bez usługi mapowej.

### 4F — przydział pomp

- nakładające się budowy nie otrzymują tej samej pompy;
- pompa może rozpocząć przygotowanie dokładnie od chwili ponownej gotowości;
- przejazd może przesunąć najwcześniejszy możliwy start;
- pompa nieaktywna lub niezgodna z wymaganiami jest pomijana;
- pompa nie może rozpocząć pracy przed własną godziną **Dostępna od**;
- równe godziny zachowują stabilną kolejność wejściową;
- te same dane zawsze dają ten sam przydział.

### 4G — minimalna liczba pomp

- pusty plan i plan bez pompowania wymagają `0` pomp;
- pojedyncza budowa wymagająca pompy daje wynik `1`;
- kilka nakładających się zajętości daje oczekiwaną większą liczbę;
- wynik jest zgodny z najwyższym technicznym numerem przydzielonej pompy.

### 4H — tryb „mam X pomp”

- tryb bez limitu zachowuje planowane godziny i wynik minimalnej floty;
- wystarczająca liczba pomp nie powoduje przesunięć;
- zbyt mała liczba nie tworzy dodatkowej fikcyjnej pompy;
- wynik pokazuje najwcześniejszy start, wielkość przesunięcia i pierwotny plan;
- `0` pomp pozostawia budowy bez przydziału i pokazuje problem;
- liczba ujemna, ułamkowa i nieznany tryb są odrzucane;
- zmiana trybu lub liczby tworzy wynik od początku;
- tryb i liczba są odtwarzane z pamięci.

### 4I — integracja i widok operatora

- centralne przeliczenie zwraca osobny wynik pomp;
- wynik gruszek dla danych bez wpływu pomp pozostaje identyczny jak w Etapie 3;
- operator widzi liczbę potrzebną, dostępną, przydziały i pełne okresy pracy;
- sterowanie pompami znajduje się pod sterowaniem gruszkami w jednym czytelnym
  panelu zasobów, a szczegółowa dostępność jest widoczna na liście pomp;
- komunikat wyjaśnia brak pompy, nieaktywność, niezgodny parametr albo przejazd;
- aplikacja nadal działa lokalnie i bez zewnętrznych bibliotek.

## Pełna regresja 4J.1

Przed publikacją należy uruchomić wszystkie pliki `testy/*.test.js` i potwierdzić:

- import CSV i zmienne kolumny KDX;
- rodzaje rozładunku oraz odbiory własne;
- pamięć planu, historię i pamięć tras;
- cały silnik gruszek z Etapu 3;
- brak starych przydziałów po kolejnym imporcie albo zmianie parametrów;
- działanie offline bez CDN i obowiązkowego połączenia z internetem.

## Test operatora 4J.3

Po publikacji na GitHub Pages operator sprawdza ten sam rzeczywisty plan w
wariantach:

1. brak aktywnych pomp;
2. jedna aktywna pompa i kilka budów wymagających pompowania;
3. kilka pomp bez kolizji;
4. pompa nieaktywna;
5. flota mniejsza od potrzebnej;
6. przejazd pomiędzy dwiema budowami;
7. odświeżenie strony i odtworzenie ustawień.

Dopiero po automatycznej regresji, publikacji i tym teście można zamknąć Etap 4.
