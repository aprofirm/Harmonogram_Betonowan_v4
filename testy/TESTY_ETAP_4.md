# Plan testów — Etap 4: pompy

## Status

**Etap 4 jest zakończony.** Zakończono całe punkty **4A–4I**, pełną regresję
**4J.1**, publikację **4J.2**, korektę operatorską **4J.3.1** oraz ponowny test
operatora **4J.3.2**. Operator potwierdził działanie jawnych przejazdów pomp,
ręcznej korekty, przywracania wartości bazowej, pamięci po odświeżeniu oraz
scenariuszy ograniczonej i nieaktywnej floty.

Wszystkie pliki `testy/*.test.js` są uruchamiane przez jeden workflow GitHub
Actions, a 4J.1 dodatkowo pilnuje kompletności zestawu regresji i granicy między
Etapem 4 a Etapem 5. Następny etap rozwoju to **Etap 5 — pełny silnik
harmonogramu, konflikty i korekty**.

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
- [x] standard `32 m` daje `20 min` przygotowania i `30 min` po pracy;
- [x] większy wysięg dodaje po `5 min` za każde rozpoczęte dodatkowe `10 m`;
- [x] oba czasy można nadpisać dla konkretnej budowy i przywrócić do wartości
  automatycznej;
- [x] właściwe pompowanie trwa od początku pierwszego do końca ostatniego
  rozładunku;
- [x] wynik każdej pompowanej budowy ma osobne pola na przydział, zajętość,
  najwcześniejszy start, opóźnienie i skutek niedoboru;
- [x] brak obliczenia jest odróżniany przez `null` od prawdziwego wyniku `0`;
- [x] utworzenie wyniku nie zmienia godzin budów, kursów ani listy pomp;
- [x] brakujące decyzje pozostają opisane w backlogu zamiast trafiać do kodu jako
  ukryte wartości domyślne.

Test operatora czasów 4A.2 — zaliczony:

1. [x] standardowa budowa pokazuje `20/30 min`;
2. [x] przy budowie jest dostępny przełącznik **Inne czasy**;
3. [x] układ wierszy pozostał czytelny i kompaktowy.

### 4B–4C — model, lista i pamięć

- [x] każda pompa ma stabilne, unikalne ID;
- [x] typ pompy jest ograniczony do wartości obsługiwanych przez model;
- [x] lista kandydatów do przydziału nie zawiera pomp nieaktywnych;
- [x] puste pola starszego zapisu dostają bezpieczne wartości domyślne, a
  niepuste błędne wartości są odrzucane;
- [x] dodanie, edycja, wyłączenie i usunięcie pojedynczej pompy jest osobną,
  niemutującą operacją modelu;
- [x] pole liczby pomp korzysta ze wspólnych operacji listy, zachowuje dane
  pozostawionych pomp i nie uruchamia silnika harmonogramu;
- [x] lista jest zapisywana w bieżącym planie i historii oraz odtwarzana po
  odświeżeniu;
- [x] starszy zapis bez listy pomp nadal daje się bezpiecznie otworzyć;
- [x] nowa pompa i pompowana budowa otrzymują standardowy wysięg `32 m`, a
  starsze puste wartości są bezpiecznie uzupełniane;
- [x] standardowa budowa ma kompaktowy opis bez stale widocznego pola, pole
  pojawia się po zaznaczeniu **Większa pompa**, przyjmuje wartość powyżej
  `32 m`, a odznaczenie przywraca standard.

Test operatora po publikacji — zaliczony:

1. [x] odświeżono opublikowaną stronę i wczytano plan z budowami pompowanymi;
2. [x] potwierdzono standard `32 m` i kompaktowy wygląd wierszy;
3. [x] potwierdzono działanie wyboru większej pompy.

Test operatora 4C.3 — zaliczony:

1. [x] ustawiono dwie pompy z różnymi danymi i przeliczono plan;
2. [x] odświeżono stronę i potwierdzono odtworzenie obu pomp;
3. [x] ponownie wczytano CSV i potwierdzono, że lista pomp pozostała;
4. [x] wyczyszczono plan i potwierdzono pustą listę pomp;
5. [x] przywrócono zapis historyczny i potwierdzono powrót obu pomp ze szczegółami.

### 4D — pełny okres zajętości

- [x] planowane okno betonowania obejmuje czas od początku pierwszego do końca
  ostatniego rozładunku wszystkich kursów danej budowy;
- [x] kolejność kursów i kursy innych budów nie zmieniają granic okna;
- [x] zajętość obejmuje przygotowanie, całe betonowanie i czynności końcowe;
- [x] jedna i wiele dostaw dają poprawny początek oraz koniec pracy;
- [x] budowa bez betonu albo niewymagająca pompy nie tworzy zajętości;
- [x] nieprawidłowe czasy kończą się czytelnym błędem.

### 4E — przejazdy

- [x] pierwszy informacyjny przejazd uwzględnia `betoniarnia → budowa`, korzysta
  z czasu dojazdu gruszki i wylicza wcześniejszy wyjazd, ale nie zajmuje pompy
  ani nie wpływa na jej przydział;
- [x] czas dojazdu `0 min` jest poprawny, a brak lub błędna wartość nie prowadzi
  do cichego przyjęcia zera;
- [x] kolejny przydział uwzględnia `budowa A → budowa B`;
- [x] czasy w przeciwnych kierunkach mogą być różne;
- [x] brak potrzebnej trasy jest jawny i nie tworzy fikcyjnego przejazdu;
- [x] silnik działa dla gotowych minut bez internetu i bez usługi mapowej.

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
- wynik jest zgodny z najwyższym technicznym numerem przydzielonej pompy;
- `testy/etap_4g_3.test.js` formalnie sprawdza przypadki `0`, `1` i wielu pomp,
  ciągłość numeracji zasobów, zgodność liczby przydziałów oraz brak nakładania
  okresów jednej pompy.


### 4H.1 — dwa tryby pracy pomp

- domyślnie działa `Oblicz, ile potrzeba` bez wymaganego limitu pomp;
- `Mam określoną liczbę` uaktywnia i wymaga pola liczby pomp;
- poprawne są `0` oraz dodatnie liczby całkowite;
- liczba ujemna, ułamkowa i pusta w trybie ograniczonym są odrzucane;
- zmiana trybu lub liczby oznacza poprzedni wynik jako nieaktualny;
- `testy/etap_4h_1.test.js` sprawdza kontrakt interfejsu i dopasowanie listy zasobów.

### 4H.2 — ograniczony przydział pomp

- silnik używa najwyżej liczby pomp podanej przez operatora i nigdy nie tworzy brakującej pompy;
- liczba zasobów jest dodatkowo ograniczona do rzeczywiście aktywnych pomp z listy;
- jedna pompa przy nakładających się budowach wylicza kolejne przesunięcia i rezerwuje przesunięte pełne cykle;
- `0` pomp nie tworzy przydziału ani stanu fikcyjnego zasobu;
- wynik zachowuje planowane i rzeczywiste okresy pracy pomp oraz wielkość i przyczynę przesunięcia;
- ponowne obliczenie tych samych danych jest stabilne, nie nakłada pracy jednej pompy i nie modyfikuje danych wejściowych;
- 4H.2 nie zmienia kursów gruszek ani `StartRoboczy` budów.

### 4H.3 — jawne konsekwencje ograniczenia pomp

- wynik rozróżnia liczbę potrzebną, zadeklarowaną, aktywną i rzeczywiście dostępną do przydziału;
- liczba brakujących pomp jest liczona względem technicznej floty potrzebnej bez przesunięć;
- każda budowa zachowuje pierwotny plan oraz jawny skutek pracy pomp;
- przydział podaje ID i nazwę pompy, możliwy start, wielkość przesunięcia i dokładną przyczynę;
- brak przydziału zachowuje listę powodów odrzucenia kandydatów;
- `0` pomp daje status `brak-pomp`, pusty przydział i nie tworzy fikcyjnego zasobu;
- `testy/etap_4h_3.test.js` sprawdza niedobór, wystarczającą flotę, ograniczenie aktywnej listy i plan bez pompowania.

### 4H.4 — pamięć i ponowne przeliczenie

- bieżący plan i historia zachowują `trybPomp` oraz `liczbaDostepnychPomp`;
- po odtworzeniu tryb ograniczony ponownie aktywuje i wymaga pola liczby pomp;
- limit `0` jest zachowywany i odtwarzany bez zamiany na wartość pustą;
- przejście do `Oblicz, ile potrzeba` zapisuje brak limitu jako `null`;
- sekwencja przeliczeń `1 → 3 → 1` pomp daje ponownie identyczny wynik dla jednej pompy;
- zmiana aktywnej listy pomp nie dziedziczy przydziału ani zajętości poprzedniej listy;
- `testy/etap_4h_4.test.js` chroni te zachowania.

### 4H.5 — końcowe testy trybu „mam X pomp”

- flota wystarczająca realizuje plan bez przesunięć i bez brakujących pomp;
- zbyt mała flota nie tworzy fikcyjnych zasobów i wylicza kaskadowe przesunięcia;
- `0` pomp pozostawia budowę bez przydziału i bez fikcyjnego stanu pompy;
- błędny limit oraz błędny format danych przejazdu kończą się czytelnym błędem;
- ponowne przeliczenie tych samych danych jest identyczne także po obliczeniu innego limitu;
- rzeczywiste okresy pracy tej samej pompy nie nakładają się;
- nieaktywna pompa nie trafia do rzeczywistej puli przydziału;
- `testy/etap_4h_5.test.js` jest końcowym testem kontraktu całego 4H.

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
- przesunięcie spowodowane pompą ma automatyczną notkę z liczbą minut,
  najwcześniejszym startem i dokładną przyczyną;
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

### 4J.1 — pełna regresja automatyczna

- [x] workflow uruchamia automatycznie wszystkie pliki `testy/*.test.js` i zatrzymuje się przy pierwszym błędzie;
- [x] zestaw obejmuje import CSV i zmienne kolumny KDX;
- [x] zestaw obejmuje rodzaje rozładunku i odbiory własne;
- [x] zestaw obejmuje pamięć planu, historię, pamięć tras i ponowne przeliczenia;
- [x] zestaw obejmuje pełny Etap 3: generowanie kursów, czasy, przydział i ograniczoną flotę gruszek;
- [x] zestaw obejmuje wszystkie podpunkty pomp 4A–4I, w tym dostępność, przejazdy, minimalną flotę, limit pomp i interfejs;
- [x] stare testy 4I chronią swoje funkcje, ale nie wymagają już, aby bieżący numer projektu pozostawał w 4I;
- [x] osobny `testy/etap_4j_1.test.js` pilnuje obecności krytycznych grup testów, pełnego runnera i granicy Etapu 4;
- [x] pełna regresja przechodzi przed publikacją 4J.2.

### 4J.2 — publikacja

- [x] stan po 4J.1 jest na `main`;
- [x] `Testy automatyczne` dla commita `0a26a72` zakończyły się `success` (run `33270058614`);
- [x] `pages build and deployment` dla tego samego commita zakończył się `success` (run `33270057938`);
- [x] wersja webowa korzysta z publikacji GitHub Pages z `main`;
- [x] publikacja nie zmienia logiki harmonogramu ani wymaga internetu do działania wariantu lokalnego.

## Test operatora 4J.3 — zaliczony

Po publikacji na GitHub Pages operator sprawdził plan w wariantach:

1. [x] brak aktywnych pomp;
2. [x] jedna aktywna pompa i kilka budów wymagających pompowania;
3. [x] kilka pomp bez kolizji;
4. [x] pompa nieaktywna;
5. [x] flota mniejsza od potrzebnej;
6. [x] przejazd pomiędzy dwiema budowami;
7. [x] odświeżenie strony i odtworzenie ustawień.

Automatyczna regresja, publikacja i test operatora zostały zakończone. Etap 4
może zostać zamknięty.


### 4I.1 — centralny wynik pomp

- `przeliczCalyHarmonogram()` zwraca wynik pomp w polu `pompy`, a nie pusty placeholder;
- tryb `Oblicz, ile potrzeba` zwraca minimalną flotę techniczną bez tworzenia rzeczywistych pomp;
- tryb `Mam określoną liczbę` wykorzystuje przekazaną listę rzeczywistych pomp i kontrakt 4H;
- `0` pomp pozostaje jawnym brakiem zasobu;
- wynik pomp korzysta z bazowych kursów sprzed ewentualnych przesunięć gruszek;
- `StartRoboczy` budów i kursy gruszek pozostają niezmienione przez obliczenie pomp;
- `testy/etap_4i_1.test.js` sprawdza oba tryby, walidację i granicę Etapu 4.

### 4J.3.1 — jawne czasy przejazdów pomp

- [x] panel pokazuje relacje `budowa → budowa` dla kolejnych budów wymagających pompy;
- [x] każda relacja ma jawne pole czasu w minutach i oznaczenie źródła;
- [x] brak wartości pozostaje widoczny jako brak trasy zamiast cichego zera;
- [x] ręczna zmiana zastępuje bieżącą wartość i jest używana przez silnik;
- [x] wartość bazową z CSV można przywrócić przyciskiem `↺`;
- [x] bieżąca, bazowa wartość i źródło są zachowywane w pamięci planu;
- [x] `testy/etap_4j_3_1.test.js` sprawdza model, integrację z harmonogramem,
  kontrakt interfejsu, pamięć i granicę Etapu 4;
- [x] pełna regresja automatyczna przechodzi przed publikacją do ponownego testu operatora.

### 4J.3.2 — ponowny test operatora — zaliczony 2026-08-30

- [x] wczytano plan z co najmniej trzema budowami pompowanymi i potwierdzono widoczne relacje;
- [x] zmieniono ręcznie czas przejazdu, przeliczono plan i potwierdzono użycie nowej wartości;
- [x] przywrócono wartość z CSV i potwierdzono powrót wartości bazowej;
- [x] odświeżono stronę i potwierdzono zachowanie ręcznej korekty;
- [x] dokończono scenariusze 4J.3: brak pomp, jedna pompa, kilka pomp, pompa nieaktywna,
  zbyt mała flota i rzeczywisty przejazd pompy między budowami;
- [x] dodatkowa poprawka szerokości okna **Zapisane trasy** została sprawdzona
  przez operatora i nie wpłynęła na działanie testów harmonogramu.

**Wynik końcowy:** 4J.3.2, 4J.3, 4J oraz cały **Etap 4 — Pompy** są zakończone.
