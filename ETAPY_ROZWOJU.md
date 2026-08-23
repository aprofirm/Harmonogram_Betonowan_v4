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
- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; 3D zakończone, wdrożono 3E.1–3E.5, następna jest publikacja 3E.6.1**
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

## Zakończony krok przekrojowy KP-1 — pamięć planu dnia

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
- [x] **KP-1.9 — test operatora i zamknięcie:** odświeżenie, odtworzenie,
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

Test operatora KP-1.9 potwierdził odtworzenie planu pełnego i niepełnego,
przywracanie historii, brak zmian po anulowaniu czyszczenia oraz zachowanie
pustego planu po potwierdzonym czyszczeniu i odświeżeniu. Historia, pamięć tras
i diagnostyka pozostały dostępne, a zapis historyczny można było ponownie
przywrócić. Cały punkt KP-1 jest zakończony.

## Zakończony krok przekrojowy KP-2 — pamięć znanych tras

KP-2 przygotowuje lokalną książkę tras przed pełną integracją mapową Etapu 6.
Został świadomie zlecony przed 3B.2. Nie uruchamia jeszcze zewnętrznej usługi
OpenStreetMap, lecz zapewnia wspólną pamięć dla wartości ręcznych i przyszłych
wyników mapowych.

- [x] **KP-2.1 — plan i decyzje:** zapisanie pełnego podziału, reguł
  rozpoznawania lokalizacji, kolejności źródeł i limitów pamięci.
- [x] **KP-2.2 — moduł pamięci tras:** wersjonowany lokalny zapis, normalizacja
  oznaczenia miejsca, osobne czasy dojazdu i powrotu, bezpieczny limit oraz tryb
  bieżącej sesji przy blokadzie pamięci.
- [x] **KP-2.3 — integracja z budowami:** zapis kompletnych ręcznych czasów,
  automatyczne uzupełnienie znanej trasy po ponownym imporcie lub dodaniu budowy
  ręcznej oraz brak nadpisywania wartości odtworzonych z planu dnia.
- [x] **KP-2.4 — pierwszeństwo cache przed mapą:** wspólny przepływ, który przy
  dokładnym trafieniu korzysta z pamięci bez wywoływania usługi mapowej, a wynik
  przyszłego wywołania mapy potrafi zapisać w tej samej bazie.
- [x] **KP-2.5 — widoczność źródła i stanu pamięci:** oznaczenia **Z pamięci**,
  **Ręcznie** i **OpenMap** przy czasach oraz licznik znanych tras.
- [x] **KP-2.6 — testy automatyczne i pełna regresja:** test modułu, integracji,
  pomijania zapytania sieciowego przy trafieniu oraz wcześniejszych funkcji.
- [x] **KP-2.7 — test operatora i zamknięcie:** poprawka oraz ponowne sprawdzenie
  pełnego przepływu ujawnionego podczas pierwszej próby operatorskiej:
  - [x] **KP-2.7.1 — automatyczna archiwizacja kompletnych tras:** zapisanie
    wszystkich budów z dojazdem i powrotem podczas przeliczenia oraz bezpieczne
    uzupełnienie brakujących wpisów ze starszego odtworzonego planu;
  - [x] **KP-2.7.2 — powtórny test operatora:** ponowny import tych samych budów,
    odtworzenie osobnych czasów oraz potwierdzenie, że czyszczenie planu nie
    usuwa książki tras.

Kryteria zamknięcia KP-2:

- [x] kompletne czasy ręczne są zapisywane pod dokładnym kluczem lokalizacji;
- [x] wszystkie kompletne trasy z bieżącego planu są archiwizowane podczas
  przeliczenia, bez konieczności ponownej edycji każdego pola;
- [x] ponowny import dokładnie tej samej lokalizacji uzupełnia dojazd i powrót;
- [x] trafienie w cache nie wywołuje funkcji usługi mapowej;
- [x] wynik przyszłej usługi mapowej może zostać zapisany w tym samym formacie;
- [x] ręcznie zmieniony czas nie jest automatycznie nadpisywany;
- [x] podobne, ale różne oznaczenie miejsca nie jest dopasowywane bezpiecznym
  „zgadywaniem”;
- [x] czyszczenie planu dnia nie usuwa pamięci tras;
- [x] brak lub uszkodzenie pamięci tras nie blokuje harmonogramu;
- [x] aplikacja pozostaje możliwa do uruchomienia całkowicie offline.

## Zakończony krok przekrojowy KP-3 — budowa ręczna i kompaktowy widok operatora

KP-3 uzupełnia brak ujawniony podczas ręcznego dodawania budowy oraz lepiej
wykorzystuje szerokość dużego monitora. Nie jest podpunktem 3B i nie zmienia
logiki rytmu dostaw. Po jego zakończeniu i domknięciu KP-1.9 wracamy do 3B.2.

- [x] **KP-3.1 — ilość betonu dla budowy ręcznej:** wymagane pole w m³,
  walidacja dodatniej wartości, zapis w modelu i pamięci planu, prezentacja w
  tabeli oraz generowanie kursów tak samo jak dla pozycji z CSV.
  - [x] **KP-3.1.1 — wartość bazowa:** ilość z CSV albo formularza ręcznego jest
    zapamiętywana jako niezmienny punkt odniesienia dla danej budowy.
  - [x] **KP-3.1.2 — wariant roboczy:** ilość można zmienić bezpośrednio w
    tabeli, zapisać w pamięci planu i uwzględnić przy następnym przeliczeniu.
  - [x] **KP-3.1.3 — przywrócenie:** przycisk przy ilości przywraca wartość
    bazową tylko dla wybranej budowy i oznacza wynik jako wymagający
    ponownego przeliczenia.
- [x] **KP-3.2 — szeroki, kompaktowy układ komputera:** prawie pełna szerokość
  ekranu przy zoomie przeglądarki 100%, małe marginesy boczne, stały rozsądny
  panel po lewej, rozszerzalny obszar tabel i mniejsza potrzeba przewijania
  poziomego bez używania CSS `zoom` ani `transform: scale()`.
- [x] **KP-3.3 — regresja i test operatora:** pełna regresja automatyczna oraz
  sprawdzenie na GitHub Pages dodania budowy z ilością, jej kursów, odświeżenia
  strony i układu przy zoomie 100% na dużym ekranie.
  - [x] **KP-3.3.1 — dokumentacja:** decyzje, instrukcja obsługi i osobny
    scenariusz testu operatora odpowiadają wdrożonej funkcji.
  - [x] **KP-3.3.2 — pełna regresja:** wszystkie zestawy testów, w tym nowy
    test KP-3, przechodzą po ostatecznych zmianach.
  - [x] **KP-3.3.3 — publikacja:** kompletny pakiet trafia do `main`, a
    wdrożona wersja GitHub Pages odpowiada najnowszemu commitowi.
  - [x] **KP-3.3.4 — test operatora i zamknięcie:** operator potwierdza ilość
    ręczną, zmianę i przywrócenie wartości, odtworzenie po odświeżeniu oraz
    szeroki układ przy zoomie Chrome 100%.

Kryteria zamknięcia KP-3:

- [x] budowy ręcznej bez dodatniej ilości betonu nie można dodać;
- [x] poprawna ilość jest widoczna w tabeli, zapisywana i odtwarzana;
- [x] przeliczenie tworzy z niej właściwą liczbę pełnych i niepełnych kursów;
- [x] robocza zmiana ilości zmienia kursy, a przywrócenie odtwarza wartość
  bazową z CSV albo formularza ręcznego;
- [x] na dużym ekranie aplikacja wykorzystuje niemal całą dostępną szerokość;
- [x] układ zachowuje techniczny breakpoint jednokolumnowy na węższych ekranach;
- [x] aplikacja nie próbuje zmieniać zoomu przeglądarki;
- [x] pełna regresja automatyczna i test operatora przechodzą poprawnie.

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
- [x] **3B — czasy cyklu i rytm dostaw:**
  - [x] **3B.1 — podstawowe czasy kursu:** załadunek, dojazd, dokładny czas
    rozładunku, powrót i ponowna gotowość są wdrożone oraz przetestowane.
    - [x] **3B.1.1 — model wartości efektywnej:** ustawienie globalne jest
      wartością domyślną, a budowa może przechowywać dokładne ręczne nadpisanie.
    - [x] **3B.1.2 — interfejs i przywracanie:** kolumna **Rozładunek** pokazuje
      wartość efektywną, pozwala ją zmienić i ma przycisk `↺` powrotu do
      aktualnej wartości z ustawień.
    - [x] **3B.1.3 — zgodność pamięci i regresja:** starsze dodatkowe minuty są
      bezpiecznie migrowane, pamięć planu zachowuje nadpisanie, a pełna
      regresja automatyczna przechodzi.
    - [x] **3B.1.4 — publikacja i test operatora:** wersja trafia na `main`,
      GitHub Pages buduje się poprawnie, a operator potwierdza wartość
      domyślną, ręczną zmianę i przywrócenie.
  - [x] **3B.2 — rytm dostaw:** oddzielenie odstępu pomiędzy kolejnymi
    dostawami od fizycznego czasu zajęcia gruszki.
    - [x] **3B.2.1 — reguła rytmu i granice zakresu:** potwierdzenie formuły
      `rytm = dokładny czas rozładunku + dodatkowy odstęp`, zachowanie
      `StartRoboczy` jako początku pierwszego rozładunku oraz zapisanie, że
      przydział gruszek, konflikty i automatyczne przesunięcia nie należą do
      3B.2.
    - [x] **3B.2.2 — model danych i walidacja:** osobny nieujemny odstęp dla
      każdej budowy, bezpieczna wartość domyślna `0 min`, zgodność starszych
      danych oraz czytelny błąd dla wartości nieprawidłowej.
    - [x] **3B.2.3 — obliczenia rytmu pojedynczej budowy:** wyznaczenie startów
      kolejnych rozładunków według rytmu bez dodawania odstępu do fizycznego
      cyklu kursu i bez zmiany liczby ani ilości kursów.
    - [x] **3B.2.4 — wspólna kolejność kursów:** stabilne ułożenie kursów
      wszystkich budów według planowanego rozpoczęcia załadunku, tak aby kursy
      różnych budów mogły się przeplatać bez przydziału konkretnych gruszek.
    - [x] **3B.2.5 — interfejs i pamięć:** edytowalne pole odstępu przy każdej
      budowie, zapis w bieżącym planie i historii, odtworzenie po odświeżeniu
      oraz oznaczenie wyniku jako wymagającego ponownego przeliczenia po zmianie.
    - [x] **3B.2.6 — testy, regresja i dokumentacja:** osobny test 3B.2 dla
      rytmu `0` i większego od zera, różnych czasów rozładunku, wydłużonego
      załadunku, przeplatania budów, pamięci i przypadków błędnych, a następnie
      pełna regresja wcześniejszych funkcji i aktualizacja dokumentacji.
    - [x] **3B.2.7 — publikacja i test operatora:** publikacja na `main`, kontrola
      GitHub Pages oraz ręczne potwierdzenie rytmu, pełnego cyklu, kolejności
      kursów i odtworzenia po odświeżeniu; dopiero wtedy zamknięcie 3B.2 i
      całego punktu 3B.
- [x] **3C — przydział gruszek:** brak nakładania kursów jednej gruszki.
  - [x] **3C.1 — model i zasady przydziału:** każdy kurs zajmuje gruszkę od
    rozpoczęcia załadunku do powrotu do betoniarni; pojazd może otrzymać kolejny
    kurs dokładnie od minuty swojej ponownej gotowości; numerowanie jest
    deterministyczne i rozpoczyna się od `GRUSZKA-001`.
  - [x] **3C.2 — niezależny silnik przydziału:** kursy są porządkowane według
    rozpoczęcia załadunku, otrzymują pierwszą wolną gruszkę, a gdy żadna nie
    jest dostępna, tworzony jest kolejny numer; moduł nie przesuwa godzin kursów.
  - [x] **3C.3 — integracja z harmonogramem:** podłączenie przydziału do
    `przeliczCalyHarmonogram()`, wyniku `gruszki` i wspólnego stanu kursów.
  - [x] **3C.4 — widok operatora:** pokazanie numeru gruszki przy każdym kursie
    bez przebudowy pozostałych tabel; numer jest technicznym oznaczeniem pierwszej
    wolnej gruszki, a nie stałą tożsamością konkretnego pojazdu.
  - [x] **3C.5 — testy integracyjne i przypadki brzegowe:** wiele budów,
    jednoczesne starty, kurs dokładnie po powrocie, brak kursów, stabilne
    numerowanie i kontrola braku nakładania przedziałów jednej gruszki.
  - [x] **3C.6 — pełna regresja, publikacja i test operatora:** kontrola
    GitHub Pages oraz ręczne potwierdzenie przydziału na rzeczywistym planie;
    dopiero wtedy zamknięcie całego 3C.
- [x] **3D — minimalna liczba gruszek:** osobny wynik wymaganej floty dla
  ustalonych godzin kursów.
  - [x] **3D.1 — reguła i granice zakresu:** wynik 3D jest liczbą technicznych
    zasobów potrzebnych do obsłużenia kursów bez nakładania pełnych cykli;
    godziny pozostają bez zmian, a ograniczenie dostępnej floty należy do 3E.
  - [x] **3D.2 — wynik silnika:** przydział zwraca
    `minimalnaLiczbaGruszek`, a centralny harmonogram udostępnia ją jako osobne
    pole wyniku oraz w stanie gruszek.
  - [x] **3D.3 — widok operatora:** liczba jest widoczna w podsumowaniu jako
    **potrzebnych gruszek** i w komunikacie zakończonego przeliczenia.
  - [x] **3D.4 — testy, regresja i dokumentacja:** przypadki `0`, `1` i wielu
    jednocześnie potrzebnych gruszek, integracja interfejsu i pamięci oraz pełna
    regresja wcześniejszych funkcji.
  - [x] **3D.5 — publikacja i test operatora:** końcowa kontrola wersji 3D.
    - [x] **3D.5.1 — publikacja:** commit trafił na `main`, pełna regresja
      GitHub Actions i wdrożenie GitHub Pages zakończyły się powodzeniem.
    - [x] **3D.5.2 — test operatora:** ręczne potwierdzenie, że rzeczywisty
      plan pokazuje oczekiwaną minimalną liczbę; dopiero wtedy zamknięcie 3D.
- [ ] **3E — tryb „mam X gruszek” i ponowne przeliczenie zasobów.**
  - [x] **3E.1 — reguła i granice zakresu:** tryb domyślny nadal oblicza flotę
    potrzebną bez zmiany godzin, a tryb ograniczony zachowuje tę liczbę jako
    punkt odniesienia i przelicza kursy wyłącznie dla podanej floty.
  - [x] **3E.2 — parametr, walidacja i pamięć:** operator wybiera jeden z dwóch
    trybów, a w trybie „mam określoną liczbę” podaje całkowitą liczbę gruszek
    nie mniejszą niż `0`; ustawienie jest zachowywane w bieżącym planie i historii.
  - [x] **3E.3 — ograniczony przydział:** kursy zachowują stabilną kolejność
    planowanego załadunku; jeżeli żadna gruszka nie jest wolna, kurs otrzymuje
    pojazd wracający najwcześniej i cały jego cykl zostaje przesunięty.
  - [x] **3E.4 — jawne konsekwencje:** wynik pokazuje liczbę dostępną, liczbę
    potrzebną, opóźnienie każdego przesuniętego kursu i pierwotną godzinę
    rozładunku; dla `0` gruszek kursy pozostają nieprzydzielone i powstaje konflikt.
  - [x] **3E.5 — testy, regresja i dokumentacja:** tryb bez limitu, flota
    wystarczająca, flota zbyt mała, `0`, błędne dane, stabilność przydziału,
    pamięć oraz brak nakładania cykli zostały objęte testami automatycznymi.
  - [ ] **3E.6 — publikacja i test operatora:** końcowa kontrola wersji 3E.
    - [ ] **3E.6.1 — publikacja:** commit na `main`, pełna regresja GitHub
      Actions i wdrożenie GitHub Pages.
    - [ ] **3E.6.2 — test operatora:** porównanie tego samego planu w trybie
      bez limitu oraz dla mniejszej, równej i zerowej liczby dostępnych gruszek;
      dopiero wtedy zamknięcie 3E i całego Etapu 3.

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
- [x] jedna gruszka nie może być jednocześnie w dwóch kursach,
- [x] dostępność gruszki następuje dopiero po zakończeniu pełnego cyklu,
- [x] program potrafi podać minimalną potrzebną liczbę gruszek,
- [x] zmniejszenie dostępnej liczby gruszek powoduje nowe realne wyliczenie,
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

Wykonać **3E.6.1 — publikację** wdrożonego trybu „mam X gruszek”: commit na
`main`, pełną regresję GitHub Actions i kontrolę GitHub Pages. Następnie wykonać
**3E.6.2 — test operatora** na tym samym rzeczywistym planie: porównać tryb
bez limitu z flotą `5`, flotą mniejszą od wymaganej oraz `0` gruszek. Po
potwierdzeniu jawnych przesunięć i braku nakładania cykli można zamknąć 3E i
cały Etap 3.


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

## KP-2.1 — plan pamięci znanych tras — 2026-08-15

- [x] zapisano wszystkie znane podetapy KP-2 przed rozpoczęciem implementacji;
- [x] rozdzielono książkę tras od bieżącego planu i historii przeliczeń;
- [x] ustalono pierwszeństwo: wartości bieżącego planu, dokładne trafienie w
  pamięci, przyszła usługa mapowa, a następnie decyzja ręczna operatora;
- [x] ustalono, że dokładne trafienie nie wykonuje ponownego zapytania do sieci;
- [x] dojazd i powrót pozostają osobnymi wartościami;
- [x] podobne lub niepełne oznaczenia nie będą dopasowywane „na oko” bez
  potwierdzenia operatora;
- [x] zapisano limity i zasady działania awaryjnego bez trwałej pamięci.

KP-2.1 jest zakończony. KP-2 pozostaje otwarty, a następnym podetapem jest
KP-2.2 — wersjonowany moduł pamięci tras. KP-1 nadal czeka na dokończenie testu
operatora; po obu krokach wracamy do 3B.2, a punkt 3C pozostaje zablokowany.

## KP-2.2 — wersjonowany moduł pamięci tras — 2026-08-15

- [x] dodano niezależny moduł `js/pamiec/pamiec_tras.js`;
- [x] książka tras używa osobnego klucza i wersji formatu;
- [x] dokładny klucz uwzględnia węzeł oraz znormalizowany opis lokalizacji;
- [x] normalizacja obsługuje wielkość liter, polskie znaki, interpunkcję i
  nadmiarowe odstępy bez zgadywania podobnych nazw;
- [x] dojazd i powrót są przechowywane osobno razem ze źródłem i czasem zapisu;
- [x] kolejny zapis tego samego klucza aktualizuje wpis zamiast tworzyć duplikat;
- [x] limit wynosi 1000 tras i 1 MB, a najstarsze wpisy są zastępowane;
- [x] uszkodzony zapis jest pomijany, a blokada trwałej pamięci uruchamia tryb
  bieżącej sesji;
- [x] osobny test modułu i kontrola składni przechodzą.

KP-2.2 jest zakończony. KP-2 pozostaje otwarty, a następnym podetapem jest
KP-2.3 — zapis ręcznych czasów i ich automatyczne odtworzenie dla tej samej
budowy. KP-1.9 pozostaje częściowo otwarty; 3C nadal jest zablokowany.

## KP-2.3 — integracja pamięci tras z budowami — 2026-08-15

- [x] kompletne czasy dojazdu i powrotu wpisane ręcznie są automatycznie
  zapisywane w książce tras;
- [x] pierwszy wpisany czas nadal może uzupełnić drugi, a późniejsze zmiany
  pozostają niezależne;
- [x] ponowny import tej samej firmy i budowy uzupełnia oba czasy z pamięci;
- [x] budowa dodana ręcznie korzysta z tego samego mechanizmu odczytu;
- [x] wartości już obecne w bieżącym lub historycznym planie mają pierwszeństwo
  i nie są nadpisywane przez książkę tras;
- [x] podobna, ale różna nazwa nie otrzymuje automatycznie cudzych czasów;
- [x] źródła dojazdu i powrotu są zachowywane niezależnie podczas ręcznej edycji;
- [x] test integracji modułów, test całej aplikacji i regresja 3B.1 przechodzą.

KP-2.3 jest zakończony. KP-2 pozostaje otwarty, a następnym podetapem jest
KP-2.4 — wspólny przepływ cache → przyszła usługa mapowa. KP-1.9 nadal czeka na
dokończenie testu operatora; 3C pozostaje zablokowany.

## KP-2.4 — pierwszeństwo cache przed mapą — 2026-08-15

- [x] dodano jeden przepływ wyboru czasu: bieżąca wartość → pamięć tras →
  funkcja przyszłej usługi mapowej;
- [x] kompletne czasy bieżącego planu kończą przepływ bez wywołania mapy;
- [x] dokładne trafienie w książce tras kończy przepływ bez wywołania mapy;
- [x] brak wpisu pozwala wywołać wymienną funkcję mapową;
- [x] poprawny wynik mapowy uzupełnia dojazd i powrót oraz trafia do tej samej
  książki tras ze źródłem `mapa`;
- [x] błąd lub pusty wynik mapy zwraca kontrolowany status zamiast powodować
  awarię harmonogramu;
- [x] test licznikiem wywołań potwierdza, że znana trasa nie odpytuje mapy.

KP-2.4 jest zakończony. KP-2 pozostaje otwarty, a następnym podetapem jest
KP-2.5 — pokazanie operatorowi źródła czasu i liczby znanych tras. KP-1.9 nadal
pozostaje częściowo otwarty; 3C jest zablokowany.

## KP-2.5 — widoczność źródła i stanu pamięci — 2026-08-15

- [x] przy dojeździe i powrocie wyświetlane są etykiety **Ręcznie**,
  **Z pamięci** albo **OpenMap**;
- [x] ręczna zmiana jednego czasu aktualizuje jego źródło bez zmiany drugiego;
- [x] na dole lewego panelu znajduje się osobna sekcja **Pamięć tras**;
- [x] licznik pokazuje liczbę zapisanych lokalizacji, a opis wskazuje limit 1000;
- [x] blokada trwałego zapisu powoduje czytelny komunikat o pamięci tylko do
  zamknięcia strony;
- [x] dodano instrukcję operatorską `testy/TESTY_KP_2.md`;
- [x] test aplikacji potwierdza etykietę **Z pamięci**, licznik oraz zachowanie
  książki tras po wyczyszczeniu planu.

KP-2.5 jest zakończony. KP-2 pozostaje otwarty, a następnym podetapem jest
KP-2.6 — pełna regresja i końcowa kontrola dokumentacji przed publikacją.
KP-1.9 nadal pozostaje częściowo otwarty; 3C jest zablokowany.

## KP-2.6 — testy automatyczne i pełna regresja — 2026-08-15

- [x] kontrola składni wszystkich plików JavaScript przechodzi;
- [x] test szkieletu i działania offline Etapu 1 przechodzi;
- [x] test importu i modelu budów Etapu 2 przechodzi;
- [x] test zmiennych kolumn KDX przechodzi;
- [x] test diagnostyki przechodzi;
- [x] test generowania kursów 3A przechodzi;
- [x] test podstawowych czasów 3B.1 przechodzi;
- [x] oba testy pamięci planu KP-1 przechodzą;
- [x] test wersjonowanej książki 1000 tras i limitu 1 MB przechodzi;
- [x] test integracji ręcznych czasów, cache przed mapą i zapisu wyniku mapy
  przechodzi;
- [x] test najdawniej używanego wpisu potwierdza, że często używana trasa nie
  jest zastępowana tylko dlatego, że została utworzona wcześniej;
- [x] test aplikacji potwierdza, że czyszczenie planu nie usuwa pamięci tras;
- [x] dokumentacja i instrukcja operatorska odpowiadają wdrożonemu zakresowi.

KP-2.6 jest zakończony. KP-2 pozostaje otwarty. Następny i ostatni podetap to
KP-2.7 — test operatora na GitHub Pages. KP-1.9 nadal wymaga prób historii i
czyszczenia; po zamknięciu obu punktów wracamy do 3B.2. Punkt 3C pozostaje
zablokowany.

## KP-2.7.1 — automatyczna archiwizacja kompletnych tras — 2026-08-15

- [x] pierwsza próba operatorska ujawniła, że starszy odtworzony plan zachowuje
  czasy, ale nie przenosi ich automatycznie do nowej książki tras;
- [x] wszystkie budowy z kompletnym dojazdem i powrotem są archiwizowane przed
  zwykłym przeliczeniem, bez konieczności ponownej edycji każdego pola;
- [x] odtworzenie bieżącego albo historycznego planu uzupełnia brakujące wpisy
  w książce tras;
- [x] migracja starszego planu nie nadpisuje trasy, która już istnieje w
  książce, dzięki czemu stary zapis historyczny nie cofa nowszej korekty;
- [x] budowy bez kompletu dojazd + powrót są bezpiecznie pomijane;
- [x] test integracyjny listy budów oraz test odtworzenia starszego planu
  przechodzą;
- [x] kontrola składni i pełna regresja dziesięciu zestawów testów przechodzą;
- [x] dokumentacja decyzji, plan etapów i instrukcja operatora odpowiadają
  poprawionemu zachowaniu.

KP-2.7.1 jest zakończony. KP-2 oraz KP-2.7 pozostają otwarte. Następny i ostatni
podetap to KP-2.7.2 — powtórny test operatora na GitHub Pages. KP-1.9 nadal
wymaga prób historii i czyszczenia; po obu testach wracamy do 3B.2, a punkt 3C
pozostaje zablokowany.

## KP-2.7.2 — powtórny test operatora i zamknięcie KP-2 — 2026-08-15

- [x] odtworzony starszy plan uzupełnił licznik wszystkimi kompletnymi trasami;
- [x] czyszczenie planu dnia nie usunęło książki tras;
- [x] ponowny import tych samych budów odtworzył zapisane dojazdy i powroty;
- [x] operator potwierdził poprawny wynik na GitHub Pages po publikacji
  poprawki KP-2.7.1.

KP-2.7.2 oraz cały punkt KP-2 są zakończone. Następny niezakończony punkt to
KP-1.9 — dokończenie testu operatora pamięci planu dnia. Po jego zamknięciu
wracamy do 3B.2 — rytm dostaw; punkt 3C nadal pozostaje zablokowany.

## KP-3.1 — ilość betonu i wariant roboczy — 2026-08-15

- [x] formularz budowy ręcznej wymaga dodatniej ilości betonu w m³;
- [x] ilość źródłowa jest zachowywana jako wartość bazowa;
- [x] ilość roboczą można zmienić w tabeli i zapisać wraz z planem;
- [x] przycisk `↺` przywraca bazową ilość tylko wybranej budowy;
- [x] zmiana ilości oznacza wynik jako nieaktualny, a kolejne przeliczenie
  generuje odpowiednią liczbę kursów;
- [x] kontrola składni oraz testy Etapu 1, Etapu 2 i pamięci aplikacji
  przechodzą poprawnie.

KP-3.1 wraz z podpunktami KP-3.1.1–KP-3.1.3 jest zakończony. Punkt KP-3
pozostaje otwarty. Następny podetap to KP-3.2 — szeroki, kompaktowy układ
komputera. KP-1.9 nadal wymaga dokończenia testu operatora; 3B.2 czeka na
zamknięcie obu punktów, a 3C pozostaje zablokowany.

## KP-3.2 — szeroki, kompaktowy układ komputera — 2026-08-15

- [x] usunięto ograniczenie szerokości 1480 px i pozostawiono marginesy
  16–24 px zależne od szerokości ekranu;
- [x] panel operatora ma szerokość 280–304 px, a obszar harmonogramu wypełnia
  pozostałe miejsce;
- [x] zagęszczono nagłówek, formularze, status, panele i wiersze tabel;
- [x] zmniejszono minimalną szerokość obu tabel, ograniczając przewijanie
  poziome na dużych monitorach;
- [x] przy szerokości do 920 px nadal działa układ jednokolumnowy;
- [x] kod nie używa CSS `zoom` ani `transform: scale()`;
- [x] test KP-3 i regresja Etapu 1, Etapu 2 oraz pamięci aplikacji przechodzą.

KP-3.2 jest zakończony. Punkt KP-3 pozostaje otwarty. Następny podetap to
KP-3.3 — pełna regresja, publikacja i test operatora na Chrome przy zoomie
100%. KP-1.9 pozostaje częściowo otwarty; 3B.2 czeka, a 3C jest zablokowany.

## KP-3.3.1–KP-3.3.2 — dokumentacja i pełna regresja — 2026-08-15

- [x] zatwierdzone zachowanie zapisano w `PROJECT_DECISIONS.md`;
- [x] instrukcję obsługi i aktualny stan uzupełniono w `README.md`;
- [x] utworzono osobny scenariusz operatorski `testy/TESTY_KP_3.md`;
- [x] kontrola składni wszystkich plików JavaScript przechodzi;
- [x] pełna regresja jedenastu zestawów testów przechodzi poprawnie.

KP-3.3.1 i KP-3.3.2 są zakończone. KP-3.3 oraz KP-3 pozostają otwarte.
Następny podetap to KP-3.3.3 — publikacja na `main`; po niej pozostanie
KP-3.3.4 — test operatora i zamknięcie. KP-1.9 nadal jest częściowo otwarty,
3B.2 czeka, a 3C pozostaje zablokowany.

## KP-3.3.3 — publikacja — 2026-08-15

- [x] pełny pakiet kodu, CSS, testów i dokumentacji opublikowano na `main` w
  commicie `5953cff3d7d88a508349a374afd4499fda00119a`;
- [x] odczyt plików z `main` potwierdził nowe pole ilości, przywracanie
  wartości bazowej i szeroki układ bez sztucznego zoomu;
- [x] GitHub Pages zakończył budowę ze statusem `built`, bez błędu i dokładnie
  z commitu `5953cff3d7d88a508349a374afd4499fda00119a`.

KP-3.3.3 jest zakończony. KP-3.3 oraz KP-3 pozostają otwarte. Następny i
ostatni podetap to KP-3.3.4 — test operatora na GitHub Pages przy zoomie 100%.
KP-1.9 nadal jest częściowo otwarty; 3B.2 czeka, a 3C pozostaje zablokowany.

## Ponowne otwarcie 3B.1 — dokładny czas rozładunku — 2026-08-15

Dotychczasowa kolumna **+ rozładunek** przechowywała dodatkowe minuty ponad
wartość z ustawień. Operator zatwierdził czytelniejszy model: tabela ma od razu
pokazywać dokładny domyślny czas, np. `15 min`, a wpisanie `20` ma oznaczać
łącznie `20 min`, nie `15 + 20 min`.

Przed zmianą kodu zapisano podetapy 3B.1.1–3B.1.4 obejmujące model, interfejs,
migrację starszych planów, regresję, publikację i test operatora. 3B.1 jest
ponownie otwarty. Następny podetap to 3B.1.1; 3B.2 czeka, a 3C jest zablokowany.

## Kontrola po 3B.1.1 — 2026-08-15

Model budowy przechowuje teraz opcjonalny dokładny czas rozładunku. Brak
nadpisania oznacza bieżącą wartość z ustawień, a ręczna liczba jest pełnym
czasem rozładunku i nie jest dodawana do wartości globalnej. Zachowano odczyt
starego pola dodatkowych minut na potrzeby migracji wcześniejszych zapisów.

Test `node testy/etap_3b_1.test.js` zakończył się poprawnie, w tym dla zmiany
wartości globalnej, dokładnego wyjątku, resetu i starego modelu danych.
Podetap 3B.1.1 jest zakończony. Punkt 3B.1 pozostaje otwarty. Następny podetap
to 3B.1.2; 3B.2 czeka, a 3C pozostaje zablokowany.

## Kontrola po 3B.1.2 — 2026-08-15

Nagłówek tabeli brzmi teraz **Rozładunek**. Każda budowa pokazuje od razu
efektywną wartość z ustawień, a ręczne wpisanie liczby tworzy dokładny wyjątek.
Znacznik rozróżnia „Z ustawień” i „Ręcznie”, a przycisk `↺` usuwa wyjątek i
przywraca bieżącą wartość globalną. Zmiana ustawienia odświeża tylko wartości
dziedziczone; wyjątki ręczne pozostają bez zmian.

Test `node testy/pamiec_aplikacji.test.js` zakończył się poprawnie i sprawdził
wartość domyślną, zmianę globalną, ręczne nadpisanie oraz reset. Podetap 3B.1.2
jest zakończony. Punkt 3B.1 pozostaje otwarty. Następny podetap to 3B.1.3;
3B.2 czeka, a 3C pozostaje zablokowany.

## Kontrola po 3B.1.3 — 2026-08-15

Pamięć planu zapisuje dokładne ręczne nadpisanie czasu rozładunku. Po
odświeżeniu wartość i jej źródło pozostają widoczne. Starszy zapis zawierający
dodatkowe minuty jest automatycznie przeliczany na równoważny czas dokładny,
np. ustawienie `15` i stary dodatek `10` stają się ręcznym czasem `25`.

Zaktualizowano `README.md`, `PROJECT_DECISIONS.md` i instrukcję testu ręcznego.
Pełna regresja 11 zestawów testów zakończyła się poprawnie. Podetap 3B.1.3 jest
zakończony. Punkt 3B.1 pozostaje otwarty. Następny podetap to 3B.1.4 —
publikacja i test operatora; 3B.2 czeka, a 3C pozostaje zablokowany.

## 3B.1.4 — publikacja i test operatora — 2026-08-15

- [x] zmiany opublikowano na `main` w commicie
  `c83cbdc102b20dbe2b5d49b1db6c930a205d60c0`;
- [x] odczyt plików z `main` potwierdził kolumnę **Rozładunek**, model dokładnej
  wartości, przycisk `↺`, pamięć i migrację;
- [x] GitHub Pages zakończył budowę ze statusem `built`, bez błędu i dokładnie
  z tego commitu;
- [x] operator potwierdził na stronie wartość z ustawień, ręczną zmianę,
  zachowanie po odświeżeniu oraz przywrócenie przyciskiem `↺`.

Podetap 3B.1.4 i cały punkt 3B.1 są zakończone. Punkt 3B pozostaje otwarty.
Następny punkt to 3B.2 — rytm dostaw; 3C pozostaje zablokowany.

## Zamknięcie 3B.1, KP-1 i KP-3 — 2026-08-15

- [x] operator potwierdził domyślny, ręczny i przywrócony czas rozładunku oraz
  zachowanie wartości po odświeżeniu;
- [x] operator potwierdził ilość budowy ręcznej, wariant roboczy, przywrócenie
  wartości bazowej i prawidłowe przeliczenie kursów;
- [x] szeroki, kompaktowy układ został potwierdzony przy zoomie Chrome 100%;
- [x] niepełny plan odtworzył się po odświeżeniu bez awarii i z ostrzeżeniem o
  brakujących czasach;
- [x] anulowanie czyszczenia nie zmieniło danych;
- [x] potwierdzone czyszczenie zachowało pusty plan po odświeżeniu, nie usunęło
  historii, pamięci tras ani diagnostyki, a plan historyczny można było
  ponownie przywrócić;
- [x] pełna regresja jedenastu zestawów testów przechodzi poprawnie.

Zakończone podetapy: 3B.1.4, KP-1.9 i KP-3.3.4. Zakończone punkty nadrzędne:
3B.1, KP-1 i KP-3. Punkt 3B nadal pozostaje otwarty. Następny niezakończony
punkt to 3B.2 — rytm dostaw; przed jego rozpoczęciem trzeba rozpisać wszystkie
znane podetapy. Punkt 3C pozostaje zablokowany do zamknięcia całego 3B.

## Plan punktu 3B.2 — rytm dostaw — 2026-08-15

- [x] przejrzano istniejące decyzje o cyklu gruszki, rytmie dostaw,
  `StartPlanowany`, `StartRoboczy` i pełnym przeliczeniu;
- [x] sprawdzono bieżące obliczenia 3B.1 oraz zależności modelu budowy,
  harmonogramu, interfejsu i pamięci planu;
- [x] rozpisano podetapy 3B.2.1–3B.2.7 obejmujące regułę biznesową, model,
  obliczenia, wspólną kolejność, interfejs, pamięć, testy, publikację i próbę
  operatora;
- [x] zapisano granicę zakresu: 3B.2 tworzy planowane godziny i rytm, ale nie
  przydziela numerów gruszek, nie rozwiązuje konfliktów i nie przesuwa jeszcze
  kursów z powodu ograniczonej liczby pojazdów;
- [x] punkt 3C pozostaje zablokowany do zakończenia całego 3B.

Planowanie 3B.2 jest zakończone, ale żaden podetap wykonawczy 3B.2 nie jest
jeszcze zamknięty. Punkt 3B pozostaje otwarty. Następny podetap to 3B.2.1 —
reguła rytmu i granice zakresu.

## Kontrola po 3B.2.1 — reguła rytmu i granice zakresu — 2026-08-15

- [x] zapisano formułę `rytm = dokładny czas rozładunku + dodatkowy odstęp`;
- [x] potwierdzono, że pierwszy rozładunek zaczyna się o `StartRoboczy`, a
  `StartPlanowany` nie jest nadpisywany;
- [x] dodatkowy odstęp został oddzielony od fizycznego czasu zajęcia gruszki i
  nie wydłuża powrotu ani ponownej gotowości pojazdu;
- [x] wydłużony załadunek przesuwa początek załadunku danego kursu, ale nie
  zmienia rytmu planowanych przyjazdów;
- [x] oddzielono dodatkowy odstęp rytmu od maksymalnego dopuszczalnego przestoju;
- [x] zapisano granicę zakresu: bez numerów gruszek, kontroli ich dostępności,
  automatycznych przesunięć i rozwiązywania konfliktów w 3B.2;
- [x] spójność dokumentacji i pełna regresja jedenastu zestawów testów
  przechodzą poprawnie.

Podetap 3B.2.1 jest zakończony. Punkt 3B.2 i punkt nadrzędny 3B pozostają
otwarte. Następny podetap to 3B.2.2 — model danych i walidacja. Punkt 3C nadal
pozostaje zablokowany.

## Kontrola po 3B.2.2 — model danych i walidacja — 2026-08-17

- [x] każda nowa budowa z importu i dodana ręcznie otrzymuje osobny dodatkowy
  odstęp dostaw z wartością domyślną `0 min`;
- [x] starsza budowa bez nowego pola jest normalizowana do `0 min` bez zmiany
  źródłowych danych;
- [x] odstęp można zmienić w modelu, a zmiana pozostałych czasów budowy nie
  zeruje zapisanej wartości;
- [x] wartość pusta oznacza `0 min`, natomiast liczba ujemna i tekst powodują
  czytelny błąd po polsku;
- [x] osobny test `testy/etap_3b_2.test.js`, kontrola składni i pełna regresja
  dwunastu zestawów testów przechodzą poprawnie;
- [x] osobny test operatora nie jest wymagany w tym podetapie, ponieważ model
  nie ma jeszcze pola w interfejsie i nie wpływa na godziny kursów; pełna próba
  operatora pozostaje zaplanowana w 3B.2.7.

Podetap 3B.2.2 jest zakończony. Punkt 3B.2 i punkt nadrzędny 3B pozostają
otwarte. Następny podetap to 3B.2.3 — obliczenia rytmu pojedynczej budowy.
Punkt 3C nadal pozostaje zablokowany.

## Kontrola po 3B.2.3–3B.2.5 — wdrożenie rytmu, kolejności, interfejsu i pamięci — 2026-08-17

- [x] kolejne rozładunki jednej budowy są wyznaczane według formuły
  `czas rozładunku + dodatkowy odstęp dostaw`;
- [x] dodatkowy odstęp nie jest doliczany do fizycznego czasu zajęcia gruszki;
- [x] liczba i ilości kursów pozostają bez zmian względem 3A;
- [x] kursy wszystkich budów są stabilnie układane według planowanego
  rozpoczęcia załadunku, dzięki czemu mogą się przeplatać;
- [x] w tabeli budów dodano edytowalną kolumnę **Odstęp dostaw** z domyślną
  wartością `0 min`;
- [x] zmiana odstępu korzysta z istniejącej walidacji modelu i oznacza wynik
  jako wymagający ponownego przeliczenia;
- [x] pole `dodatkowyOdstepDostawMinuty` jest zapisywane w bieżącym planie i
  historii oraz odtwarzane po odświeżeniu;
- [x] logika obliczeniowa pozostaje w module gruszek, zapis w warstwie aplikacji,
  a obsługa kolumny w osobnym module interfejsu;
- [x] prowizoryjny moduł łączący kilka odpowiedzialności został usunięty.

Podetapy 3B.2.3, 3B.2.4 i 3B.2.5 są wdrożone i oznaczone jako zakończone na
poziomie implementacji. Testy pełnego zakresu zostały świadomie odłożone do
3B.2.6. Punkt 3B.2 i cały 3B pozostają otwarte. Następny podetap to 3B.2.6 —
testy, pełna regresja i kontrola dokumentacji; 3C pozostaje zablokowany.


## Kontrola po 3B.2.6 — testy, regresja i dokumentacja — 2026-08-17

- [x] `js/interfejs/odstep_dostaw.js` ponownie odpowiada wyłącznie za pole
  **Odstęp dostaw**, bez logiki rodzaju rozładunku i odbiorów własnych;
- [x] `js/interfejs/rodzaj_rozladunku.js` jest osobnym modułem interfejsu dla
  wyboru rodzaju rozładunku, etykiet i rozwijanej tabeli odbiorów własnych;
- [x] logika biznesowa rodzaju rozładunku pozostaje w
  `js/budowy/rodzaj_rozladunku.js`, dzięki czemu silnik i interfejs są
  rozdzielone zgodnie z zasadami projektu;
- [x] `testy/etap_3b_2.test.js` sprawdza rytm dla odstępu `0` i większego od
  zera, różne czasy rozładunku, wydłużony załadunek, przeplatanie budów,
  walidację oraz zapis pola w pamięci;
- [x] testy `rodzaj_rozladunku.test.js` i `odbior_wlasny_tabela.test.js`
  odpowiadają aktualnemu podziałowi modułów i rzeczywistemu wariantowi KDX;
- [x] dodano workflow `.github/workflows/testy.yml`, który na `main` i w pull
  requestach uruchamia wszystkie pliki `testy/*.test.js` na Node.js 20;
- [x] pełna regresja automatyczna w GitHub Actions zakończyła się statusem
  `success` 2026-08-17; przeszły wszystkie aktualne zestawy testów;
- [x] dokumentacja testów i aktualny stan projektu zostały ujednolicone.

Podetap 3B.2.6 jest zakończony. Punkt 3B.2 i punkt nadrzędny 3B pozostają
otwarte. Następny i ostatni podetap to **3B.2.7 — publikacja i test operatora**:
kontrola GitHub Pages oraz ręczne potwierdzenie rytmu, pełnego cyklu,
przeplatania kursów i odtworzenia po odświeżeniu. Punkt 3C pozostaje
zablokowany do zamknięcia całego 3B.


## Zamknięcie 3B.2.7, 3B.2 i 3B — 2026-08-17

- [x] najnowsza wersja została opublikowana przez GitHub Pages bez błędu;
- [x] operator potwierdził na rzeczywistym planie poprawne przeliczenie kursów
  oraz oddzielenie odbioru własnego od dostaw planowanych;
- [x] dla budowy 30 m³ z dokładnym rozładunkiem `15 min` i dodatkowym odstępem
  `5 min` początki rozładunku wyniosły `09:00`, `09:20`, `09:40`, `10:00`,
  czyli rytm dokładnie `20 min`;
- [x] początki załadunków tej samej budowy wyniosły odpowiednio `08:00`,
  `08:20`, `08:40`, `09:00`, a gotowość po pełnym cyklu pozostała liczona z
  załadunku, dojazdu, rozładunku i powrotu bez doliczania dodatkowego odstępu;
- [x] kursy różnych budów pozostają wspólnie ułożone według planowanego
  rozpoczęcia załadunku i mogą się przeplatać;
- [x] zapis i odtworzenie pola odstępu są objęte testami automatycznymi 3B.2.6
  oraz istniejącą pamięcią planu; operator zaakceptował zamknięcie 3B.2.7;
- [x] pełna regresja automatyczna przed testem operatora zakończyła się
  statusem `success`.

Podetap **3B.2.7**, cały punkt **3B.2** oraz cały punkt **3B** są zakończone.
Następny niezakończony punkt to **3C — przydział gruszek**. Implementacja 3C
nie została jeszcze rozpoczęta; na początku następnego spotkania należy najpierw
rozpisać jego kompletne podetapy i granice zakresu. Punkty 3D i 3E pozostają
otwarte.


## 3C.1–3C.2 — plan i niezależny silnik przydziału — 2026-08-18

- [x] przed zmianą kodu rozpisano pełne podetapy 3C i granice odpowiedzialności;
- [x] dodano osobny moduł `js/gruszki/przydzial_gruszek.js` bez zależności od
  HTML i bez przebudowy istniejącej logiki 3B.2;
- [x] każdy kurs jest traktowany jako zajęcie gruszki od rozpoczęcia załadunku
  do zakończenia powrotu do betoniarni;
- [x] gruszka może otrzymać kolejny kurs, gdy jego załadunek zaczyna się w tej
  samej minucie, w której poprzedni kurs kończy powrót;
- [x] nakładające się kursy otrzymują różne numery `GRUSZKA-001`,
  `GRUSZKA-002` itd.;
- [x] moduł nie zmienia godzin kursów i nie realizuje jeszcze ograniczenia
  „mam X gruszek”; ten zakres pozostaje w 3E;
- [x] test `testy/etap_3c.test.js` obejmuje pusty plan, nakładanie, dokładną
  granicę powrotu, ponowne użycie pojazdu, stabilne sortowanie i błędne dane;
- [x] przed zapisem dokumentacji jednorazowy workflow uruchamia pełną regresję
  wszystkich plików `testy/*.test.js`.

**3C.1 i 3C.2 są zakończone.** Punkt 3C pozostaje otwarty. Następny podetap to
**3C.3 — integracja z pełnym harmonogramem**.


## Zamknięcie 3C.3 — 2026-08-18

- [x] test integracyjny 3B → 3C.2 potwierdził zgodność rzeczywistych kursów z modułem przydziału;
- [x] centralne `przeliczCalyHarmonogram()` zwraca teraz kursy z `idGruszki` i `numerGruszki`;
- [x] wynik `gruszki` przechowuje użyte pojazdy i te same przydzielone kursy;
- [x] moduł przydziału jest ładowany lokalnie z repozytorium bez CDN i internetu;
- [x] pełna regresja `testy/*.test.js` została wykonana przed zapisaniem tego statusu.

Podetap **3C.3** jest zakończony. Następny niezakończony podetap to **3C.4 — widok operatora**, czyli pokazanie numeru gruszki przy kursie bez zmiany zasad przydziału.


## Zamknięcie 3C.5 — testy integracyjne i przypadki brzegowe — 2026-08-20

- [x] dodano `testy/etap_3c_5.test.js` korzystający z centralnego
  `przeliczCalyHarmonogram()`;
- [x] sprawdzono wiele budów i przeplatanie sześciu kursów;
- [x] dwa kursy rozpoczynające załadunek w tej samej minucie zachowują stabilną
  kolejność i otrzymują różne gruszki;
- [x] gruszka może zostać użyta ponownie dokładnie w minucie zakończenia
  poprzedniego pełnego cyklu;
- [x] pusty plan oraz pozycje bez kursów nie tworzą sztucznych zasobów;
- [x] ponowne przeliczenie identycznych danych daje identyczne numery gruszek;
- [x] test automatycznie kontroluje brak nakładania przedziałów każdej gruszki;
- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi przed zapisaniem
  statusu 3C.5.

Podetap **3C.5** jest zakończony. Punkt **3C** pozostaje otwarty. Następny i
ostatni podetap to **3C.6 — pełna regresja, publikacja i test operatora**.
Dopiero po 3C.6 można zamknąć 3C i przejść do 3D.


## Zamknięcie 3C.6 i całego 3C — 2026-08-23

- [x] pełna regresja automatyczna przechodziła na `main`;
- [x] GitHub Pages udostępnił wersję z przydziałem gruszek;
- [x] operator sprawdził przydział na rzeczywistym planie KDX;
- [x] każda gruszka rozpoczynała następny kurs dopiero po wcześniejszym
  powrocie, a nakładające się pełne cykle miały różne numery;
- [x] ponowne użycie gruszki i rytm dostaw były zgodne z godzinami kursów;
- [x] operator zaakceptował wynik oraz zamknięcie 3C.

Podetap **3C.6** i cały punkt **3C** są zakończone. Następnym punktem jest 3D.


## 3D.1–3D.4 — minimalna liczba gruszek — 2026-08-23

- [x] zapisano pełny podział 3D i oddzielono go od ograniczonej floty 3E;
- [x] wynik przydziału 3C został formalnie udostępniony jako
  `minimalnaLiczbaGruszek` bez ponownego liczenia i bez przesuwania godzin;
- [x] centralny harmonogram zwraca liczbę na najwyższym poziomie oraz w stanie
  gruszek;
- [x] podsumowanie operatora pokazuje wyróżniony licznik **potrzebnych
  gruszek**, zerowany po zmianie albo wyczyszczeniu planu;
- [x] komunikat po przeliczeniu podaje minimalną liczbę wprost;
- [x] test `testy/etap_3d.test.js` sprawdza pusty plan, jeden zasób, wiele
  nakładających się kursów, wynik centralny i widok operatora;
- [x] regresja pamięci potwierdza ponowne pokazanie wyniku po odświeżeniu i
  wczytaniu historii;
- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi.

Podetapy **3D.1–3D.4** są zakończone. Punkt 3D pozostaje otwarty. Następny i
ostatni podetap to **3D.5 — publikacja i test operatora**.


## 3D.5.1 — publikacja — 2026-08-23

- [x] zawartość punktu 3D trafiła bezpośrednio na `main` w commicie
  `fce3a02`;
- [x] pełna regresja GitHub Actions zakończyła się statusem `success`;
- [x] wdrożenie GitHub Pages zakończyło się statusem `success`;
- [x] opublikowana strona zawiera licznik **potrzebnych gruszek** i oznaczenie
  Etapu 3D.4;
- [x] wersja lokalna nadal nie wymaga internetu ani zewnętrznych bibliotek.

Podetap **3D.5.1** jest zakończony. Punkt 3D pozostaje otwarty wyłącznie do
testu operatora **3D.5.2**. Po jego zaliczeniu następnym punktem będzie 3E —
tryb „mam X gruszek”.


## Zamknięcie 3D.5.2 i całego 3D — 2026-08-23

- [x] operator przeliczył rzeczywisty plan na opublikowanej wersji;
- [x] wynik obejmował `7` budów, `11` kursów, `5` potrzebnych gruszek i
  `0` konfliktów;
- [x] licznik był zgodny z najwyższym technicznym numerem gruszki w tabeli;
- [x] ponowne przeliczenie, zmiana danych wpływających na plan i wyczyszczenie
  licznika działały prawidłowo;
- [x] operator potwierdził wynik i przejście do 3E.

Podetap **3D.5.2**, cały punkt **3D** i jego test operatorski są zakończone.


## 3E.1–3E.5 — tryb „mam X gruszek” — 2026-08-23

- [x] przed zmianą kodu zapisano pełny podział 3E i oddzielono techniczne
  przesunięcia kursów od docelowych priorytetów i korekt całego Etapu 5;
- [x] dodano tryb domyślny **Oblicz, ile potrzeba** oraz tryb **Mam określoną
  liczbę** z całkowitą wartością od `0` wzwyż;
- [x] minimalna liczba z 3D pozostaje widoczna jako punkt odniesienia niezależnie
  od liczby pojazdów wpisanej przez operatora;
- [x] ograniczony przydział nigdy nie tworzy gruszki ponad podaną liczbę;
- [x] gdy wszystkie pojazdy są zajęte, kurs otrzymuje gruszkę wracającą
  najwcześniej, a załadunek, dojazd, rozładunek, powrót i ponowna gotowość są
  przesuwane razem;
- [x] tabela pokazuje skutek floty, wielkość opóźnienia i planowaną godzinę
  rozładunku, a podsumowanie zestawia liczbę potrzebną z dostępną;
- [x] `0` dostępnych gruszek pozostawia kursy nieprzydzielone i tworzy jawny
  konflikt zamiast fikcyjnego harmonogramu;
- [x] tryb i liczba dostępnych gruszek są zapisywane oraz odtwarzane z pamięci;
- [x] test `testy/etap_3e.test.js` oraz pełna regresja wcześniejszych funkcji
  przechodzą lokalnie.

Podetapy **3E.1–3E.5** są zakończone. Punkt 3E i cały Etap 3 pozostają otwarte
do publikacji **3E.6.1** oraz testu operatora **3E.6.2**.
