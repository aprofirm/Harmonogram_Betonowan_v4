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

---

# Status projektu

- [x] Etap 1 — Szkielet aplikacji
- [x] Etap 2 — Import CSV i model Budowy
- [ ] Etap 3 — Podstawowy silnik gruszek
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

## Stan testów na zakończenie pracy 2026-08-10

- [x] automatyczny test Etapu 1 przechodzi,
- [x] automatyczny test Etapu 2 przechodzi,
- [x] automatyczny test diagnostyki przechodzi,
- [ ] osobny test zmiennych kolumn KDX wymaga weryfikacji na prawdziwym eksporcie; obecnie zatrzymuje się na sztucznym wierszu technicznym z większą liczbą pól niż nagłówek.

Jest to jawnie zapisany wyjątek testowy. Importer nie został zmieniony podczas wdrażania logo ani diagnostyki.

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

- [ ] liczba kursów odpowiada ilości betonu i pojemności gruszki,
- [ ] jedna gruszka nie może być jednocześnie w dwóch kursach,
- [ ] dostępność gruszki następuje dopiero po zakończeniu pełnego cyklu,
- [ ] program potrafi podać minimalną potrzebną liczbę gruszek,
- [ ] zmniejszenie dostępnej liczby gruszek powoduje nowe realne wyliczenie,
- [ ] ponowne przeliczenie nie pozostawia starych kursów,
- [ ] zmiana parametrów jest wykonywana przez konfigurację, a nie zmianę kodu.

## Test regresji

- [ ] import CSV nadal działa,
- [ ] budowy ręczne nadal działają,
- [ ] `StartPlanowany` pozostaje nienaruszony,
- [ ] drugi import CSV czyści poprzedni plan roboczy poprawnie.

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

Wczytać na komputerze operatora prawdziwy, niezmieniony eksport CSV z KDX. Na jego podstawie zweryfikować problematyczny wiersz techniczny w osobnym teście zmiennych kolumn i doprowadzić ten test do poprawnego wyniku bez osłabiania walidacji importera. Następnie wykonać pełny test ręczny Etapu 2 i po jego potwierdzeniu rozpocząć **Etap 3 — Podstawowy silnik gruszek**.


## Weryfikacja produkcyjnego KDX — 2026-08-14

- [x] prawdziwy eksport KDX został wczytany przez GitHub Pages;
- [x] rozpoznano 8 pozycji, firmy, budowy, beton, ilości i godziny;
- [x] brak ID został bezpiecznie obsłużony przez serię `CSV-...`;
- [x] potwierdzono tolerancję `13:00 (-60 min)` jako okno 13:00–14:00;
- [x] potwierdzono, że `0,0 m³` oznacza pozycję zrealizowaną.

Etap 2 jest zweryfikowany na rzeczywistych danych KDX. Następny krok to implementacja Etapu 3.
