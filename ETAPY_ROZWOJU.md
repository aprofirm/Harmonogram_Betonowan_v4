# ETAPY ROZWOJU — Harmonogram Betonowań v4

Ten dokument opisuje kolejność rozwoju projektu `Harmonogram_Betonowan_v4`.

Jego celem jest rozwijanie programu małymi, bezpiecznymi etapami, tak aby po każdym etapie można było uruchomić program, sprawdzić działanie i dopiero wtedy przejść dalej.

Dokument należy czytać razem z:

- `AGENTS.md` — jak rozpoczynamy i kończymy pracę z repozytorium,
- `ZASADY_KODU.md` — jak piszemy kod,
- `PROJECT_DECISIONS.md` — co program ma robić i jakie decyzje są obowiązujące,
- `POMYSLY_I_BACKLOG.md` — jakie pomysły i pytania wymagają jeszcze rozstrzygnięcia.

---

## Zasada główna

Nie próbujemy wdrożyć całego programu jednocześnie.

Każdy etap powinien:

1. mieć jasno określony zakres,
2. pozostawić program w stanie możliwym do uruchomienia,
3. mieć własne testy,
4. nie psuć funkcji z wcześniejszych etapów,
5. być zakończony dopiero po sprawdzeniu działania.

Do następnego etapu przechodzimy dopiero wtedy, gdy testy bieżącego etapu przejdą poprawnie albo świadomie zapiszemy znany wyjątek, który nie blokuje dalszej pracy.

Po każdym etapie wykonujemy również krótki test regresji funkcji z wcześniejszych etapów.

## Obowiązkowa kontrola podetapów

- Przed rozpoczęciem większego punktu zapisujemy tutaj jego znane podetapy.
- Po implementacji i teście każdego podetapu ponownie przeglądamy cały bieżący
  punkt oraz kryteria zakończenia etapu.
- Punkt nadrzędny pozostaje otwarty, dopóki wszystkie jego podetapy nie są
  zakończone i sprawdzone.
- W podsumowaniu zawsze podajemy numer zamkniętego podetapu oraz numer
  następnego niezakończonego podetapu.
- Jeżeli lista podetapów nie jest jeszcze pełna, najpierw ją doprecyzowujemy.
  Nie przechodzimy do kolejnego punktu tylko dlatego, że zakończył się pierwszy
  zapisany krok.

---

# Status projektu

- [x] Etap 1 — Szkielet aplikacji
- [x] Etap 2 — Import CSV i model Budowy
- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; przed 3B.2 realizowany jest krok przekrojowy KP-1**
- [ ] Etap 4 — Pompy
- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty
- [ ] Etap 6 — Adresy, lokalizacje i trasy
- [ ] Etap 7 — Docelowy interfejs operatora
- [ ] Etap 8 — Utwardzenie, testy regresji i wersja użytkowa

## Funkcje przekrojowe wdrożone przed Etapem 3

- [x] Lokalne logi diagnostyczne z limitem 10 ostatnich uruchomień.
- [x] Ręczne pobieranie raportu `.json` bez treści danych KDX/CSV.
- [x] Obsługa awaryjnej pamięci bieżącej strony, gdy przeglądarka blokuje trwały zapis.

Wdrożenie diagnostyki nie zmienia statusu Etapu 2 ani nie rozpoczyna logiki Etapu 3.

## Aktywny krok przekrojowy KP-1 — pamięć planu dnia

KP-1 zabezpiecza bieżącą pracę operatora przed utratą po odświeżeniu strony.
Nie jest podpunktem 3B i nie zmienia kolejności Etapu 3. Po zamknięciu KP-1
wracamy do kroku 3B.2.

- [x] **KP-1.1 — plan i decyzje:** zapisanie pełnego podziału, zasad prywatności,
  zakresu danych oraz instrukcji testu operatorskiego.
- [x] **KP-1.2 — moduł pamięci planu:** wersjonowany zapis i odczyt z bezpieczną
  obsługą braku, blokady albo uszkodzenia pamięci przeglądarki.
- [x] **KP-1.3 — automatyczny zapis roboczy:** import, budowy ręczne, parametry,
  czasy robocze i informacja o wykonanym przeliczeniu są zapisywane w jednym
  bieżącym rekordzie bez surowych wierszy CSV.
- [x] **KP-1.4 — historia przeliczeń:** maksymalnie 100 różnych zapisów po
  skutecznym przeliczeniu, każdy z datą i godziną; najstarszy zapis jest
  nadpisywany po przekroczeniu limitu, a całość ma limit bezpieczeństwa 3 MB.
- [x] **KP-1.5 — odtworzenie po odświeżeniu:** przywrócenie bieżących danych i
  ponowne obliczenie harmonogramu tylko wtedy, gdy był wcześniej przeliczony.
- [x] **KP-1.6 — wczytywanie historii:** przycisk **Wczytaj zapis historyczny**
  na dole panelu, lista od najnowszego zapisu i potwierdzenie przywrócenia.
- [x] **KP-1.7 — bezpieczne czyszczenie:** czerwony przycisk **Wyczyść plan dnia**,
  potwierdzenie operacji i reset bieżącego planu bez usuwania historii ani
  diagnostyki.
- [x] **KP-1.8 — testy automatyczne i pełna regresja:** sprawdzenie całego KP-1
  oraz wcześniejszych funkcji przed publikacją wersji do testu operatorskiego.
- [ ] **KP-1.9 — test operatora i zamknięcie:** odświeżenie, odtworzenie,
  historia, anulowanie czyszczenia, potwierdzenie czyszczenia i ponowna kontrola
  planu.

Kryteria zamknięcia KP-1:

- [x] odświeżenie nie usuwa poprawnego planu w teście automatycznym;
- [x] nieprzeliczony, częściowo uzupełniony plan również jest odtwarzany;
- [x] wcześniej przeliczony harmonogram jest po odświeżeniu liczony ponownie;
- [x] uszkodzony albo niedostępny zapis nie powoduje awarii;
- [x] historia zachowuje maksymalnie 100 różnych przeliczeń z datą i godziną;
- [x] operator może przywrócić wybrany historyczny zapis;
- [x] anulowanie czyszczenia nie zmienia danych;
- [x] potwierdzone czyszczenie usuwa bieżący plan, ale pozostawia historię i
  logi diagnostyczne;
- [x] aplikacja nadal działa offline i przechodzi pełną regresję automatyczną.

## Stan testów po zakończeniu kroku 3B.1 — 2026-08-15

- [x] automatyczny test Etapu 1 przechodzi,
- [x] automatyczny test Etapu 2 przechodzi,
- [x] automatyczny test diagnostyki przechodzi,
- [x] osobny test zmiennych kolumn KDX przechodzi,
- [x] automatyczny test punktu 3A przechodzi,
- [x] ręczny test na GitHub Pages potwierdził poprawne działanie punktu 3A.
- [x] automatyczny test kroku 3B.1 przechodzi,
- [x] regresja Etapów 1–3A po zmianach 3B.1 przechodzi,
- [x] ręczny test kroku 3B.1 na GitHub Pages potwierdził poprawne działanie.

Statusy w tej sekcji powinny być aktualizowane w miarę postępu prac.

---

# ETAP 1 — Szkielet aplikacji

## Cel

Zbudować czystą, modułową podstawę programu bez wdrażania jeszcze skomplikowanej logiki biznesowej.

## Zakres

- utworzenie `index.html`,
- podstawowy lokalny CSS,
- podział kodu JavaScript na moduły zgodne z odpowiedzialnością,
- przygotowanie centralnej konfiguracji,
- przygotowanie miejsca na moduły:
  - importu,
  - budów,
  - gruszek,
  - pomp,
  - harmonogramu,
  - lokalizacji,
  - interfejsu,
- przygotowanie centralnego mechanizmu pełnego przeliczenia, docelowo np. `przeliczCalyHarmonogram()`,
- podstawowy ekran programu,
- podstawowy panel parametrów,
- przycisk `Przelicz`,
- brak zależności od CDN i zewnętrznych bibliotek wymaganych do uruchomienia,
- możliwość uruchomienia podstawowej aplikacji lokalnie w przeglądarce.

## Kryteria zakończenia

- [x] `index.html` otwiera się lokalnie bez instalacji,
- [x] strona nie wymaga internetu do uruchomienia podstawowego interfejsu,
- [x] brak błędów JavaScript po uruchomieniu,
- [x] moduły mają proste i opisowe nazwy,
- [x] interfejs i silnik są rozdzielone,
- [x] przycisk `Przelicz` uruchamia kontrolowany przepływ programu, nawet jeśli na tym etapie nie wykonuje jeszcze pełnych obliczeń,
- [x] kod jest zgodny z `ZASADY_KODU.md`.

## Test regresji

Na tym etapie brak wcześniejszych funkcji do regresji.

---

# ETAP 2 — Import CSV i model Budowy

## Cel

Doprowadzić dane z KDX/CSV do uporządkowanego modelu `Budowy`, który będzie niezależny od interfejsu i dalszego silnika.

## Zakres

- wczytywanie CSV,
- przeciąganie pliku CSV do programu — drag & drop,
- walidacja danych wejściowych,
- jasne komunikaty po polsku,
- obsługa wymaganych kolumn,
- zachowanie `ID_Budowy` jako tekstu,
- automatyczne nadawanie `CSV-001`, `CSV-002` itd., gdy kolumny ID nie ma albo pojedyncze ID jest puste,
- ostrzeżenie zamiast odrzucenia pliku przy braku ID,
- rozdzielenie pól `Firma` i `Budowa`,
- utworzenie `StartPlanowany`,
- przygotowanie `StartRoboczy`,
- obsługa budów dodawanych ręcznie,
- logiczne oddzielenie danych surowych z CSV od danych roboczych,
- przygotowanie mechanizmu wczytania kolejnego pliku bez pozostawiania danych poprzedniego harmonogramu,
- przygotowanie awaryjnego ID dla pozycji ręcznych, jeśli będzie potrzebne.

## Kryteria zakończenia

- [x] poprawny CSV tworzy listę budów,
- [x] `ID_Budowy` nie traci zer ani innych cech tekstowych,
- [x] brak kolumny ID nie blokuje importu i powoduje nadanie automatycznych identyfikatorów,
- [x] puste ID w pojedynczym wierszu jest uzupełniane bez zmiany prawidłowych ID,
- [x] operator widzi ostrzeżenie o automatycznie nadanych identyfikatorach,
- [x] `Firma` i `Budowa` są oddzielnymi polami,
- [x] `StartPlanowany` zachowuje dokładną wartość źródłową,
- [x] błędny lub pusty plik daje czytelny komunikat,
- [x] brak wymaganej kolumny daje czytelny komunikat,
- [x] można przeciągnąć CSV na stronę,
- [x] można wczytać drugi CSV bez mieszania danych ze starego pliku,
- [x] można dodać budowę ręcznie,
- [x] import nie zawiera logiki przydziału gruszek ani pomp.

## Test regresji

- [x] aplikacja nadal uruchamia się lokalnie,
- [x] podstawowy interfejs z etapu 1 działa,
- [x] brak nowych zależności wymagających internetu.

---

# ETAP 3 — Podstawowy silnik gruszek

## Cel

Zbudować niezależną logikę kursów i dostępności gruszek.

## Postęp punktów Etapu 3

- [x] **3A — generowanie kursów:** podział ilości betonu na pełne i niepełne kursy, pomijanie zrealizowanych pozycji i pełne tworzenie wyniku od nowa.
- [ ] **3B — czasy cyklu i rytm dostaw:**
  - [x] **3B.1 — podstawowe czasy kursu:** załadunek, dojazd, rozładunek,
    powrót, ponowna gotowość oraz ręczne korekty czasów; test automatyczny,
    regresja i test operatora zakończone powodzeniem.
  - [ ] **3B.2 — rytm dostaw:** oddzielenie odstępu pomiędzy kolejnymi
    dostawami od fizycznego czasu zajęcia gruszki.
- [ ] **3C — przydział gruszek:** brak nakładania kursów jednej gruszki.
- [ ] **3D — minimalna liczba gruszek.**
- [ ] **3E — tryb „mam X gruszek” i ponowne przeliczenie zasobów.**

Po każdym podetapie wykonujemy jego osobny test oraz pełną regresję wcześniejszych
funkcji. Następnie ponownie przeglądamy tę listę i kryteria zakończenia całego
Etapu 3. Dopiero potem zapisujemy opis wykonanej pracy, bieżący punkt i następny krok.

## Zakres

- pojemność gruszki jako parametr, domyślnie 8 m³,
- czas załadunku jako parametr, domyślnie 10 minut,
- uwzględnianie dojazdu,
- uwzględnianie rozładunku,
- uwzględnianie powrotu,
- gruszka pozostaje zajęta do powrotu,
- generowanie kursów na podstawie ilości betonu,
- przydział gruszek do kursów,
- rozdzielenie cyklu gruszki od rytmu dostaw,
- obliczanie minimalnej liczby gruszek potrzebnych do płynnej realizacji,
- tryb `mam X gruszek — przelicz`,
- pełne ponowne przeliczenie po zmianie liczby gruszek,
- brak pozostawiania starych kursów.

## Kryteria zakończenia

- [x] liczba kursów odpowiada ilości betonu i pojemności gruszki,
- [ ] jedna gruszka nie może być jednocześnie w dwóch kursach,
- [ ] dostępność gruszki następuje dopiero po zakończeniu pełnego cyklu,
- [ ] program potrafi podać minimalną potrzebną liczbę gruszek,
- [ ] zmniejszenie dostępnej liczby gruszek powoduje nowe realne wyliczenie,
- [x] ponowne przeliczenie liczby kursów nie pozostawia starych kursów,
- [x] zmiana pojemności gruszki jest wykonywana przez konfigurację, a nie zmianę kodu.

## Test regresji

- [x] import CSV nadal działa,
- [x] budowy ręczne nadal działają,
- [x] `StartPlanowany` pozostaje nienaruszony,
- [x] drugi import CSV czyści poprzedni plan roboczy poprawnie.

---

# ETAP 4 — Pompy

## Cel

Dodać pompy jako pełnoprawny, niezależny zasób harmonogramu.

## Zakres

- lista pomp,
- pompy własne i zewnętrzne,
- aktywność i dostępność pompy,
- możliwość przechowywania parametrów pompy, np. wysięgu,
- zajętość pompy przez całe betonowanie,
- przygotowanie pompy przed rozpoczęciem,
- czynności końcowe po betonowaniu,
- przejazd `baza → budowa`,
- przejazd `budowa → budowa`,
- fizyczna niemożliwość użycia jednej pompy jednocześnie na dwóch budowach,
- wyliczanie najwcześniejszego możliwego startu wynikającego z dostępności pompy,
- wyliczanie minimalnej liczby pomp,
- tryb `mam X pomp — przelicz`.

## Kryteria zakończenia

- [ ] jedna pompa nie może obsługiwać dwóch budów jednocześnie,
- [ ] czas przejazdu pompy wpływa na możliwość rozpoczęcia następnej budowy,
- [ ] program odróżnia przejazd z bazy od przejazdu między budowami,
- [ ] można wyłączyć pompę z dostępności,
- [ ] można odróżnić pompę własną od zewnętrznej,
- [ ] program potrafi wskazać minimalną potrzebną liczbę pomp,
- [ ] zmniejszenie liczby pomp powoduje pełne ponowne przeliczenie.

## Test regresji

- [ ] silnik gruszek daje te same wyniki przy danych bez pomp jak wcześniej,
- [ ] import CSV nadal działa,
- [ ] zmiana liczby gruszek nadal poprawnie przebudowuje kursy.

---

# ETAP 5 — Pełny silnik harmonogramu, konflikty i korekty

## Cel

Połączyć Budowy, Pompy i Gruszki w jeden kontrolowany proces tworzenia harmonogramu.

## Obowiązująca kolejność pełnego przeliczenia

`Budowy → dostępność i zajętość pomp → rzeczywiste starty budów → generowanie kursów → przydział gruszek → konflikty i korekty → wynik końcowy`

## Zakres

- zachowanie `StartPlanowany`,
- wyliczanie `StartRoboczy`,
- domyślny limit opóźnienia startu 30 minut jako parametr,
- możliwość indywidualnego limitu dla budowy,
- wykrywanie przekroczenia dopuszczalnego opóźnienia,
- brak cichego przesuwania betonowań,
- osobne wykrywanie przestojów podczas trwającego betonowania,
- parametr `MaksPrzestojMin`,
- wykrywanie:
  - braku gruszki,
  - braku pompy,
  - niedostępnej pompy,
  - kolizji zasobów,
  - zbyt dużego opóźnienia,
  - zbyt dużej przerwy między dostawami,
- jawne komunikowanie przyczyny problemu,
- pełne przeliczenie po każdej istotnej zmianie zasobów lub parametrów,
- jeden centralny punkt uruchamiania pełnego przeliczenia.

## Kryteria zakończenia

- [ ] `StartPlanowany` nigdy nie jest nadpisywany przez silnik,
- [ ] `StartRoboczy` pokazuje realny możliwy start,
- [ ] operator widzi wielkość i przyczynę przesunięcia,
- [ ] przekroczenie limitu jest jawnie oznaczone jako konflikt,
- [ ] przestój po rozpoczęciu betonowania nie jest mylony z opóźnieniem startu,
- [ ] zmiana liczby gruszek lub pomp przebudowuje cały plan,
- [ ] po przeliczeniu nie pozostają kursy ani zajętości z poprzedniego wyniku,
- [ ] konflikty nie są ukrywane przez automatyczne przesuwanie w nieskończoność.

## Test regresji

- [ ] wcześniejsze testy importu przechodzą,
- [ ] wcześniejsze testy gruszek przechodzą,
- [ ] wcześniejsze testy pomp przechodzą.

---

# ETAP 6 — Adresy, lokalizacje i trasy

## Cel

Automatycznie pozyskiwać możliwie wiarygodny czas i dystans przejazdu od węzła do budowy na podstawie adresu, bez uzależniania działania harmonogramu od internetu.

## Zakres

- pobieranie adresu budowy z danych KDX/CSV,
- sprawdzanie kompletności adresu lokalnie,
- statusy jakości adresu, np.:
  - pełny,
  - niepełny, ale możliwy do wyszukania,
  - niewystarczający,
  - niejednoznaczny,
- geokodowanie adresu przy dostępnym internecie,
- przeliczenie współrzędnych na trasę drogową,
- obliczanie odległości w kilometrach,
- obliczanie przewidywanego czasu jazdy,
- zapis stałych współrzędnych węzła,
- przygotowanie na wiele węzłów w przyszłości,
- ręczna edycja lokalizacji, dystansu i czasu,
- rozdzielenie wartości automatycznych od roboczych, np.:
  - `CzasDojazduAutomatyczny`,
  - `CzasDojazduRoboczy`,
- oznaczenie wartości zmienionych ręcznie,
- zapamiętywanie znanych lokalizacji i tras w lokalnym cache,
- ponowne wykorzystanie zapamiętanych danych bez internetu,
- brak blokady harmonogramu, jeśli usługa mapowa nie działa,
- możliwość ręcznego wpisania czasu i odległości,
- wydzielenie usług mapowych do osobnego modułu,
- przygotowanie architektury na ewentualny routing dla ciężkich pojazdów.

## Ważna zasada

Brak internetu, błąd geokodowania albo awaria usługi mapowej nie może uniemożliwić utworzenia harmonogramu.

## Kryteria zakończenia

- [ ] program rozpoznaje podstawowe braki w adresie,
- [ ] niejednoznaczny adres nie jest bez ostrzeżenia uznawany za pewny,
- [ ] przy internecie można uzyskać lokalizację i trasę,
- [ ] przy braku internetu można użyć cache albo wartości ręcznych,
- [ ] ręcznie skorygowana wartość nie jest bez wiedzy operatora nadpisywana,
- [ ] silnik harmonogramu korzysta z `CzasDojazduRoboczy`, a nie bezpośrednio z konkretnej usługi mapowej,
- [ ] zmiana dostawcy map w przyszłości nie wymaga przebudowy silnika harmonogramu.

## Test regresji

- [ ] harmonogram działa przy całkowicie wyłączonym internecie,
- [ ] ręcznie wpisany czas dojazdu daje poprawny wynik,
- [ ] wcześniejsze testy gruszek, pomp i konfliktów przechodzą.

---

# ETAP 7 — Docelowy interfejs operatora

## Cel

Uprościć codzienną pracę operatora bez przenoszenia logiki biznesowej do interfejsu.

## Zakres

- czytelny ekran główny,
- prosty przepływ `wczytaj CSV → sprawdź → przelicz`,
- panel plików CSV,
- próba wykorzystania wybranego przez użytkownika folderu, jeśli pozwala na to przeglądarka,
- lista najnowszych/dzisiejszych plików, jeśli dostęp do folderu jest dostępny,
- drag & drop jako podstawowa lub awaryjna metoda importu,
- czytelna tabela harmonogramu,
- statusy budów,
- widoczne konflikty,
- kolory używane pomocniczo, ale nie jako jedyne źródło informacji,
- możliwość ręcznej edycji wybranych wartości,
- panel gruszek,
- panel pomp,
- panel parametrów,
- szczegóły lokalizacji i trasy,
- widoczna informacja o wartościach automatycznych i ręcznie zmienionych,
- oddzielenie widoku operatora od szczegółowej diagnostyki technicznej.

## Kryteria zakończenia

- [ ] podstawowa praca nie wymaga przechodzenia przez wiele ekranów,
- [ ] najważniejsze problemy są widoczne bez otwierania narzędzi deweloperskich,
- [ ] operator może rozpoznać, co program wyliczył automatycznie, a co zostało zmienione ręcznie,
- [ ] interfejs nie zawiera logiki obliczeniowej,
- [ ] aplikacja nadal może działać lokalnie.

## Test regresji

- [ ] wyniki silnika przed i po zmianach wyglądu są identyczne dla tych samych danych,
- [ ] wszystkie wcześniejsze testy funkcjonalne przechodzą.

---

# ETAP 8 — Utwardzenie, testy regresji i wersja użytkowa

## Cel

Przygotować program do regularnej pracy i wychwycić przypadki, które mogą pojawić się w rzeczywistych danych.

## Zakres testów

- pusty CSV,
- błędny CSV,
- brak wymaganej kolumny,
- niepełne dane pojedynczej budowy,
- zero budów,
- jedna budowa,
- wiele budów,
- budowa ręczna,
- usunięcie budowy,
- zmiana ilości betonu,
- kolejny CSV,
- ponowne wczytanie tego samego CSV,
- jedna gruszka,
- za mało gruszek,
- zmiana liczby gruszek,
- brak pomp,
- jedna pompa,
- za mało pomp,
- zmiana liczby pomp,
- pompa niedostępna,
- konflikt dwóch budów,
- przekroczenie limitu startu,
- przekroczenie maksymalnego przestoju,
- brak internetu,
- awaria usługi mapowej,
- adres niepełny,
- adres niejednoznaczny,
- ręczna korekta czasu dojazdu,
- wielokrotne szybkie kliknięcie `Przelicz`,
- ponowne przeliczenie tych samych danych,
- brak pozostawiania starych kursów i zajętości.

## Kryteria zakończenia

- [ ] wszystkie krytyczne scenariusze mają test,
- [ ] brak znanych błędów powodujących błędny przydział zasobów bez ostrzeżenia,
- [ ] brak znanych błędów pozostawiających dane starego harmonogramu,
- [ ] komunikaty o błędach są zrozumiałe dla operatora,
- [ ] program uruchamia się w wymaganym trybie lokalnym,
- [ ] podstawowe działanie nie wymaga internetu,
- [ ] wyniki przykładowych scenariuszy zostały ręcznie zweryfikowane,
- [ ] dokumentacja odpowiada rzeczywistemu zachowaniu programu.

---

# Zasady pracy pomiędzy etapami

## 1. Najpierw test, potem kolejny etap

Nie dokładamy następnej dużej funkcji do niedziałającego fundamentu.

## 2. Małe commity

Zmiany powinny być dzielone według logicznego celu. Nie łączymy w jednym commicie kilku niezależnych dużych przebudów.

## 3. Aktualizacja statusu

Po zakończeniu etapu aktualizujemy checkbox na początku tego dokumentu.

## 4. Test regresji

Każdy etap sprawdza nie tylko nową funkcję, ale też kluczowe funkcje z wcześniejszych etapów.

## 5. Nowe decyzje

Jeżeli podczas implementacji podejmiemy trwałą decyzję biznesową lub architektoniczną, aktualizujemy `PROJECT_DECISIONS.md`.

Jeżeli zmienia się wyłącznie sposób implementacji bez zmiany zachowania programu, stosujemy `ZASADY_KODU.md`, ale nie dopisujemy zbędnej decyzji biznesowej.

## 6. Nie omijamy modułowości dla szybkości

Jeżeli szybkie rozwiązanie wymaga wymieszania importu, interfejsu, pomp i gruszek w jednym miejscu, wybieramy wolniejsze do napisania, ale prostsze do utrzymania rozwiązanie modułowe.

## 7. Działająca wersja po każdym etapie

Repozytorium powinno po każdym zakończonym etapie zawierać możliwą do uruchomienia wersję programu.

## 8. Aktualizacja pamięci projektu

Na końcu każdej rozmowy projektowej sprawdzamy, czy zmieniły się decyzje, backlog, status etapu albo następny krok. Aktualizujemy odpowiedni dokument przed końcowym podsumowaniem zadania.

Jeżeli rozmowa nie wniosła nowego ustalenia, nie tworzymy pustego wpisu. Pomysł pozostaje w `POMYSLY_I_BACKLOG.md`, dopóki nie zostanie wyraźnie zatwierdzony i przeniesiony do `PROJECT_DECISIONS.md`.

---

# Kolejny krok

Wykonać **KP-1.9 — test operatora i zamknięcie** według
`testy/TESTY_KP_1.md`. Po pozytywnym teście zamknąć KP-1 i wrócić do
**3B.2 — rytm dostaw**. Punkt 3C pozostaje zablokowany do czasu zakończenia i
przetestowania całego punktu 3B.


## Weryfikacja produkcyjnego KDX — 2026-08-14

- [x] prawdziwy eksport KDX został wczytany przez GitHub Pages;
- [x] rozpoznano 8 pozycji, firmy, budowy, beton, ilości i godziny;
- [x] brak ID został bezpiecznie obsłużony przez serię `CSV-...`;
- [x] potwierdzono rzeczywisty zapis tolerancji `13:00 (+60 min)` jako okno 13:00–14:00;
- [x] potwierdzono, że `0,0 m³` oznacza pozycję zrealizowaną.

Etap 2 jest zweryfikowany na rzeczywistych danych KDX i pozostaje zamknięty.

## Punkt 3A — generowanie kursów — 2026-08-14

- [x] kursy są generowane w module `gruszki`, bez zależności od interfejsu;
- [x] pełny kurs nie przekracza ustawionej pojemności gruszki;
- [x] ostatni kurs może być niepełny;
- [x] pozycje z `0,0 m³` nie generują kursów;
- [x] każdy kurs ma własne ID, numer, ilość i powiązanie z budową;
- [x] zmiana pojemności powoduje utworzenie nowej listy kursów od początku;
- [x] testy Etapów 1–2, KDX, diagnostyki i punktu 3A przechodzą.
- [x] test ręczny operatora na GitHub Pages zakończył się powodzeniem.

Etap 3 pozostaje w toku. Punkt 3A odpowiada wyłącznie za liczbę i ilości kursów;
godziny cyklu są dokładane w kroku 3B.1, nadal bez przydziału konkretnych gruszek.

## Krok 3B.1 — podstawowe czasy kursów — 2026-08-15

- [x] domyślny czas załadunku wynosi `10 min` i pozostaje parametrem;
- [x] domyślny czas rozładunku wynosi `15 min` dla każdego kursu;
- [x] czas dojazdu i powrotu jest przechowywany osobno dla każdej budowy;
- [x] pierwsze wpisanie jednego czasu przejazdu uzupełnia drugi taką samą
  wartością, a późniejsze zmiany obu pól pozostają niezależne;
- [x] brak wymaganego czasu przejazdu daje czytelny komunikat z ID budowy;
- [x] operator może dodać osobny dodatkowy czas załadunku i rozładunku dla budowy;
- [x] każdy kurs ma godzinę rozpoczęcia i zakończenia załadunku, dojazdu, rozładunku oraz powrotu;
- [x] każdy kurs ma godzinę ponownej gotowości gruszki;
- [x] liczba kursów nie zmienia się przez dodanie czasów;
- [x] test automatyczny 3B.1 i pełna regresja przechodzą;
- [x] test ręczny na GitHub Pages potwierdził poprawne działanie.

Krok 3B.1 jest zakończony. Punkt 3B pozostaje otwarty, ponieważ następny jest
krok 3B.2 — oddzielenie rytmu dostaw od fizycznego czasu cyklu. Dopiero po jego
zakończeniu można rozpocząć punkt 3C dotyczący przydziału gruszek.

## KP-1.1 — plan trwałej pamięci dnia — 2026-08-15

- [x] potwierdzono, że obowiązkowa kontrola podetapów jest już zapisana w
  `AGENTS.md`, `ZASADY_KODU.md` i `ETAPY_ROZWOJU.md`;
- [x] zapisano wszystkie znane podetapy KP-1 przed rozpoczęciem kodowania;
- [x] zapisano zatwierdzone zasady lokalnego przechowywania i prywatności danych;
- [x] ustalono, że wynik po odświeżeniu będzie obliczany ponownie z odtworzonych
  danych zamiast przechowywania starego wyniku jako źródła prawdy;
- [x] przygotowano osobną instrukcję testu operatorskiego KP-1;
- [x] nie zmieniono jeszcze logiki aplikacji ani interfejsu;
- [x] pełna regresja sześciu dotychczasowych zestawów testów przechodzi.

KP-1.1 jest zakończony. KP-1 pozostaje otwarty, a następnym podetapem jest
KP-1.2 — wersjonowany moduł pamięci planu. Po całkowitym zamknięciu KP-1 wracamy
do 3B.2; punkt 3C nadal pozostaje zablokowany.

## KP-1.2 — wersjonowany moduł pamięci planu — 2026-08-15

- [x] dodano niezależny moduł `js/pamiec/pamiec_planu.js`;
- [x] zapis otrzymuje numer wersji, czas zapisu i osobny klucz pamięci;
- [x] poprawny plan można odczytać po utworzeniu nowej instancji strony;
- [x] brak zapisu jest odróżniany od uszkodzonego zapisu;
- [x] uszkodzony zapis jest bezpiecznie pomijany i usuwany;
- [x] zapis z nieobsługiwanej wersji jest pomijany bez automatycznego usuwania;
- [x] blokada lub błąd `localStorage` przełącza moduł na pamięć bieżącej sesji;
- [x] moduł jest ładowany lokalnie przez `index.html` i nie wymaga internetu;
- [x] osobny test KP-1.2 oraz pełna regresja siedmiu zestawów testów przechodzą;
- [x] automatyczne zapisywanie danych aplikacji nie zostało jeszcze uruchomione.

KP-1.2 jest zakończony. KP-1 pozostaje otwarty, a następnym podetapem jest
KP-1.3 — podłączenie automatycznego zapisu importu, budów ręcznych, parametrów,
czasów roboczych i informacji o wykonanym przeliczeniu. Po całkowitym zamknięciu
KP-1 wracamy do 3B.2; punkt 3C nadal pozostaje zablokowany.

## KP-1.3–KP-1.7 — zapis, historia, odtwarzanie i czyszczenie — 2026-08-15

- [x] bieżący plan jest nadpisywany po imporcie, dodaniu budowy ręcznej,
  zmianie parametrów i zmianie czasów roboczych;
- [x] zapis nie zawiera `wierszeZrodlowe` ani pól `daneZrodlowe` z surowego CSV;
- [x] skuteczne przeliczenie tworzy zapis historyczny z datą i godziną;
- [x] identyczne kolejne przeliczenie nie tworzy duplikatu;
- [x] historia przechowuje maksymalnie 100 zapisów i ma limit bezpieczeństwa
  3 MB;
- [x] po odświeżeniu odtwarzany jest plan roboczy, a przeliczony wynik powstaje
  ponownie z zapisanych danych;
- [x] przycisk na dole panelu otwiera historię od najnowszego zapisu;
- [x] wczytanie historycznego planu wymaga potwierdzenia;
- [x] anulowanie czyszczenia nie zmienia danych;
- [x] potwierdzone czyszczenie usuwa tylko bieżący plan, pozostawiając historię
  i diagnostykę;
- [x] test modułu pamięci oraz test pełnego przepływu aplikacji przechodzą.

Podetapy KP-1.3–KP-1.7 są zakończone. KP-1 pozostaje otwarty. Następny jest
KP-1.8 — pełna regresja wszystkich zestawów testów i kontrola dokumentacji.

## KP-1.8 — testy automatyczne i pełna regresja — 2026-08-15

- [x] test szkieletu i działania offline Etapu 1 przechodzi;
- [x] test importu i modelu budów Etapu 2 przechodzi;
- [x] test zmiennych kolumn KDX przechodzi;
- [x] test diagnostyki przechodzi;
- [x] test generowania kursów 3A przechodzi;
- [x] test podstawowych czasów 3B.1 przechodzi;
- [x] test modułu pamięci, limitu 100 wpisów i ochrony historii przechodzi;
- [x] test integracyjny automatycznego zapisu, odświeżenia, historii i
  czyszczenia przechodzi;
- [x] dokumentacja decyzji, instrukcja operatorska i lista etapów odpowiadają
  wdrożonemu zachowaniu.

KP-1.8 jest zakończony. KP-1 nadal pozostaje otwarty. Następny i ostatni
podetap to KP-1.9 — test operatora na GitHub Pages. Dopiero po jego pozytywnym
wyniku wracamy do 3B.2; punkt 3C pozostaje zablokowany.
