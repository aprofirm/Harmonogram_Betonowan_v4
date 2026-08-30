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
- [x] Etap 3 — Podstawowy silnik gruszek
- [x] Etap 4 — Pompy — **zakończony 2026-08-30; 4A–4J wraz z testem operatora 4J.3.2 zakończone**
- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5B.1**
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

## Zakończony krok przekrojowy KP-4 — ręczna korekta godziny budowy

KP-4 pozwoli operatorowi poprawić godzinę rozpoczęcia wybranej budowy bez
ponownego wczytywania CSV. Krok wykonujemy przed Etapem 4, ponieważ silnik pomp
musi otrzymać jednoznaczną bieżącą godzinę zadaną przez operatora, a jednocześnie
nie może utracić godziny źródłowej z KDX.

- [x] **KP-4.1 — model trzech godzin:**
  - [x] `StartPlanowany` pozostaje niezmienną godziną źródłową z KDX/CSV albo
    formularza budowy ręcznej;
  - [x] `StartZadany` jest bieżącą godziną, którą operator chce uwzględnić przy
    następnym przeliczeniu; początkowo jest równy `StartPlanowany`;
  - [x] `StartRoboczy` pozostaje rzeczywistą godziną możliwą do wykonania po
    uwzględnieniu ograniczeń silnika; do czasu Etapu 5 jest równy
    `StartZadany`, jeżeli inne wdrożone reguły nie wymagają jawnej korekty.
- [x] **KP-4.2 — edycja w tabeli:** pole **Start do przeliczenia** przy każdej
  budowie, widoczna pierwotna godzina planowana i przycisk `↺` przywracający
  wartość źródłową bez ponownego importu.
- [x] **KP-4.3 — walidacja i wynik nieaktualny:** poprawny format `HH:MM`, brak
  cichej zmiany `StartPlanowany` oraz oznaczenie harmonogramu jako wymagającego
  ponownego przeliczenia po zmianie lub przywróceniu.
- [x] **KP-4.4 — pamięć i zgodność:** zapis korekty w bieżącym planie i historii,
  odtworzenie po odświeżeniu oraz bezpieczne otwieranie starszych zapisów bez
  `StartZadany`.
- [x] **KP-4.5 — testy, publikacja i test operatora:** osobny test automatyczny,
  pełna regresja, publikacja na `main` oraz ręczne potwierdzenie zmiany,
  przeliczenia, odświeżenia i przywrócenia godziny bazowej.

Kryteria zamknięcia KP-4:

- [x] korekta jednej budowy nie zmienia godzin źródłowych pozostałych budów;
- [x] operator zawsze widzi godzinę źródłową i bieżącą wartość zadaną;
- [x] przeliczenie korzysta z `StartZadany`, a wynik możliwy do wykonania jest
  nadal przechowywany osobno jako `StartRoboczy`;
- [x] kolejny import tworzy nowy plan na podstawie nowych danych;
- [x] aplikacja nadal działa offline i przechodzi całą regresję Etapu 3.

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
- [x] **3E — tryb „mam X gruszek” i ponowne przeliczenie zasobów.**
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
  - [x] **3E.6 — publikacja i test operatora:** końcowa kontrola wersji 3E.
    - [x] **3E.6.1 — publikacja:** commit na `main`, pełna regresja GitHub
      Actions i wdrożenie GitHub Pages.
    - [x] **3E.6.2 — test operatora:** porównanie tego samego planu w trybie
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

## Postęp podetapów Etapu 4

- [x] **4A — reguły, dane wejściowe i granice zakresu.**
  - [x] **4A.1 — kwalifikacja budów:** ustalić i przetestować, które budowy
    wymagają pompy na podstawie `rodzajRozladunku`, bez zmiany obsługi odbiorów
    własnych, leja, wywrotki, taczki i starszych danych bez tej kolumny.
  - [x] **4A.2 — czas obsługi pompy:** ustalić źródła czasu przygotowania,
    betonowania, zakończenia, mycia oraz przygotowania do przejazdu; wartości
    biznesowe mają być parametrami, a nie liczbami wpisanymi na stałe w kodzie.
  - [x] **4A.3 — wynik niezależnego silnika:** Etap 4 zwraca przydział pompy,
    okres zajętości, najwcześniejszy możliwy start i skutek niedoboru pomp, ale
    nie nadpisuje jeszcze `StartPlanowany`, nie przebudowuje kursów gruszek i nie
    rozstrzyga wspólnych konfliktów obu zasobów — ten zakres należy do Etapu 5.
  - [x] **4A.4 — zapis decyzji i test zasad:** zatwierdzone reguły trafiają do
    `PROJECT_DECISIONS.md`, a przypadki wymagające decyzji pozostają jawnie w
    `POMYSLY_I_BACKLOG.md`.
- [x] **4B — model danych i lista pomp.**
  - [x] **4B.1 — model pompy:** stabilne ID, czytelna nazwa, aktywność w danym
    dniu, dostępność godzinowa i parametry techniczne, przede wszystkim wysięg.
    Starszy typ własna/zewnętrzna pozostaje wyłącznie metadaną zgodności.
  - [x] **4B.2 — operacje na liście:** dodawanie, edycja, wyłączanie i usuwanie
    pompy bez mieszania tych operacji z silnikiem harmonogramu.
  - [x] **4B.3 — walidacja i testy modelu:** unikalne ID, poprawna aktywność,
    dostępność i wysięg, bezpieczne wartości puste oraz brak przydzielania
    pomp nieaktywnych.
- [x] **4C — interfejs listy pomp i pamięć planu.**
  - [x] **4C.1 — panel pomp:** czytelna lista z aktywnością, godzinami
    **Dostępna od/do** i wysięgiem, bez rozdzielania pomp własnych i
    zewnętrznych, działająca również na węższym ekranie.
  - [x] **4C.2 — pamięć:** lista pomp i ich bieżąca dostępność są zapisywane w
    planie dnia oraz zapisach historycznych bez psucia starszych rekordów.
  - [x] **4C.3 — odtworzenie i test operatora:** odświeżenie, historia, kolejny
    import i wyczyszczenie planu zachowują ustalone zasady pamięci.
- [x] **4D — okres zajętości pompy na budowie.**
  - [x] **4D.1 — planowane okno betonowania:** wyznaczenie początku i końca
    obsługi budowy na podstawie danych planu, a nie czasu pojedynczej gruszki.
  - [x] **4D.2 — pełny cykl pompy:** przygotowanie przed betonowaniem, praca,
    zakończenie i czynności po pracy tworzą jeden spójny przedział zajętości.
  - [x] **4D.3 — przypadki brzegowe i testy:** jedna dostawa, wiele dostaw,
    zerowa ilość, budowa niewymagająca pompy i brak wymaganych czasów.
- [x] **4E — przejazdy pomp.**
  - [x] **4E.1 — baza do pierwszej budowy:** baza pompy jest w betoniarni, a
    informacyjny wyjazd wykorzystuje istniejący czas dojazdu gruszki do budowy
    bez tworzenia drugiego pola i bez wpływu na dostępność pompy.
  - [x] **4E.2 — budowa do budowy:** osobny czas przejazdu pomiędzy każdą parą
    kolejnych miejsc pracy, bez założenia, że jest równy trasie z bazy.
  - [x] **4E.3 — niezależność od map:** silnik otrzymuje gotowy czas przejazdu
    i działa offline; automatyczne pozyskiwanie tras pozostaje zakresem Etapu 6.
  - [x] **4E.4 — testy:** brak trasy, trasa zerowa, różne czasy w obu kierunkach
    oraz przejazd wymuszający późniejszy start następnej budowy.
- [x] **4F — niezależny przydział pomp.**
  - [x] **4F.0 — okno dostępności pompy przed przydziałem:** model zasobu ma
    opcjonalne granice `Dostępna od/do`, a pochodzenie własna/zewnętrzna nie
    wpływa na algorytm.
    - [x] **4F.0.1 — model i zgodność:** oba pola czasu mogą być puste; nowe
      pompy nie dziedziczą początku dnia, starszy `typ` jest tylko neutralną
      metadaną, a wysięg pozostaje podstawowym parametrem technicznym.
    - [x] **4F.0.2 — panel i pamięć:** lista pomp pokazuje aktywność,
      `Dostępna od`, `Dostępna do` i wysięg; nie pokazuje wyboru
      własna/zewnętrzna, a oba czasy są zachowywane w zapisie planu.
    - [x] **4F.0.3 — granica zakończenia pracy:** pełny cykl rozpoczęty przed
      albo dokładnie o `Dostępna do` może zostać dokończony po tej godzinie,
      a wynik zachowuje liczbę minut przekroczenia do informacji operatora;
      nowy cykl po tej godzinie jest niedozwolony.
    - [x] **4F.0.4 — testy:** przypadki bez granic, tylko `od`, tylko `do`,
      obie granice, dokładna minuta końcowa, przekroczenie oraz podłączenie
      panelu są objęte `testy/etap_4f_0.test.js` i pełną regresją.
  - [x] **4F.1 — stabilna kolejność:** rzeczywiste prace budów wymagających
    pompy są rozpatrywane deterministycznie według planowanego początku
    betonowania, a przy remisie zachowują kolejność wejściową.
  - [x] **4F.2 — pierwsza pasująca pompa:** silnik wybiera pierwszą aktywną,
    dostępną już o wymaganej godzinie, wolną i zgodną z wymaganiami pompę,
    uwzględniając pełny cykl oraz przejazd.
  - [x] **4F.3 — brak nakładania:** jedna pompa nie może mieć dwóch kolidujących
    okresów pracy, a granica `gotowa == kolejny start przygotowania` jest
    dozwolona.
  - [x] **4F.4 — najwcześniejszy start:** gdy żadna pompa nie jest gotowa,
    wynik podaje najwcześniejszą możliwą godzinę i wielkość przesunięcia bez
    cichego zmieniania całego harmonogramu gruszek oraz zachowuje dokładną
    przyczynę do automatycznej notki dla operatora.
  - [x] **4F.5 — testy integracyjne:** wiele budów, równe starty, wyłączona
    pompa, niepasujący parametr, przejazd i powtarzalny wynik.
- [x] **4G — minimalna liczba pomp.**
  - [x] **4G.1 — wynik silnika:** obliczenie najmniejszej technicznej liczby
    pomp potrzebnych do planu bez nakładania ich pełnych cykli.
  - [x] **4G.2 — widok operatora:** osobny licznik potrzebnych pomp i czytelna
    informacja dla planu bez budów pompowanych.
  - [x] **4G.3 — testy:** wyniki `0`, `1` i wiele pomp oraz zgodność z
    przydziałami technicznymi.
- [x] **4H — tryb „mam X pomp”.**
  - [x] **4H.1 — dwa tryby pracy:** `Oblicz, ile potrzeba` oraz
    `Mam określoną liczbę`, z walidacją całkowitej liczby od `0` wzwyż.
  - [x] **4H.2 — ograniczony przydział:** silnik nie tworzy pompy ponad podaną
    liczbę albo ponad aktywną listę i wylicza rzeczywisty skutek niedoboru.
  - [x] **4H.3 — jawne konsekwencje:** wynik zawiera liczbę potrzebną,
    rzeczywiście dostępną do przydziału, przydział, przesunięcie, dokładną
    przyczynę i pierwotny plan; `0` pomp nie tworzy fikcyjnych przydziałów.
    Docelowe podłączenie tego kontraktu do głównego widoku należy do 4I.
  - [x] **4H.4 — pamięć i ponowne przeliczenie:** tryb oraz liczba są
    odtwarzane, a każda zmiana buduje wynik od początku bez starych zajętości.
    Test potwierdza także brak dziedziczenia przydziałów po zmianie limitu lub aktywnej listy pomp.
  - [x] **4H.5 — testy:** flota wystarczająca, zbyt mała, `0`, błędne dane,
    stabilność wyniku i brak nakładania pracy jednej pompy.
- [x] **4I — integracja wyniku i interfejs operatora.**
  - [x] **4I.1 — centralny wynik:** `przeliczCalyHarmonogram()` udostępnia
    osobny wynik pomp, nadal bez docelowego łączenia korekt pomp i gruszek.
  - [x] **4I.2 — wspólne sterowanie zasobami:** w nagłówku harmonogramu pod
    sterowaniem gruszkami pojawia się estetyczny, kompaktowy wiersz pomp z
    trybem pracy, liczbą potrzebną, liczbą dostępną i skrótem dostępności.
    Szczegółowe godziny **Dostępna od** i **Dostępna do** pozostają przypisane
    do konkretnej pompy.
  - [x] **4I.3 — tabela pomp:** budowa, przydzielona pompa, przygotowanie,
    betonowanie, zakończenie, przejazd i gotowość do kolejnej pracy.
  - [x] **4I.4 — komunikaty:** czytelny brak pompy, niedostępność, niezgodny
    parametr i przesunięcie wynikające z przejazdu lub zajętości; jeżeli pompa
    wymusza przesunięcie, przy budowie pojawia się automatyczna notka z liczbą
    minut, najwcześniejszym startem i dokładną przyczyną.
  - [x] **4I.5 — zgodność offline i dostępność interfejsu:** brak nowych
    bibliotek, CDN i obowiązkowego internetu.
- [x] **4J — pełna regresja, publikacja i test operatora.**
  - [x] **4J.1 — testy automatyczne:** wszystkie scenariusze Etapu 4 oraz pełna
    regresja importu, pamięci, rodzajów rozładunku i całego Etapu 3.
  - [x] **4J.2 — publikacja:** commit na `main`, GitHub Actions i GitHub Pages.
  - [x] **4J.3 — test operatora:** rzeczywisty plan z brakiem pomp, jedną pompą,
    kilkoma budowami, pompą nieaktywną, zbyt małą flotą i przejazdem między
    budowami; dopiero wtedy zamknięcie Etapu 4.
    - [x] **4J.3.1 — jawne czasy przejazdów pomp:** dodać w obszarze roboczym
      czytelny panel relacji `budowa → budowa`, pokazywać czas i źródło oraz
      umożliwić ręczną edycję i przywrócenie wartości bazowej z CSV; zmiana ma
      oznaczać wynik jako nieaktualny i być zachowywana w pamięci planu.
    - [x] **4J.3.2 — ponowny test operatora:** po publikacji sprawdzić pełną listę
      scenariuszy 4J.3, w tym jawne wartości przejazdów, ręczną korektę,
      przeliczenie i odtworzenie po odświeżeniu.

## Granica Etapu 4

Etap 4 buduje i testuje niezależny wynik pomp. Może wskazać najwcześniejszy
możliwy start oraz skutek ograniczenia floty pomp, ale nie łączy jeszcze tego
wyniku z ograniczoną flotą gruszek w jeden ostateczny plan. Zmiana
`StartRoboczy`, ponowne generowanie kursów po przesunięciu przez pompę, wybór
budowy przesuwanej przy wielu rozwiązaniach i wspólna optymalizacja obu zasobów
należą do Etapu 5.

## Kryteria zakończenia

- [x] jedna pompa nie może obsługiwać dwóch budów jednocześnie,
- [x] czas przejazdu pompy wpływa na możliwość rozpoczęcia następnej budowy,
- [x] program odróżnia przejazd z bazy od przejazdu między budowami,
- [x] można wyłączyć pompę z dostępności,
- [x] przydział nie rozróżnia pompy własnej i zewnętrznej; decydują parametry zasobu,
- [x] program potrafi wskazać minimalną potrzebną liczbę pomp,
- [x] zmniejszenie liczby pomp powoduje pełne ponowne przeliczenie.

## Test regresji

- [x] silnik gruszek daje te same wyniki przy danych bez pomp jak wcześniej,
- [x] import CSV nadal działa,
- [x] zmiana liczby gruszek nadal poprawnie przebudowuje kursy.

---

# ETAP 5 — Pełny silnik harmonogramu, konflikty i korekty

## Cel

Połączyć Budowy, Pompy i Gruszki w jeden kontrolowany proces tworzenia harmonogramu.

## Obowiązująca kolejność pełnego przeliczenia

`Budowy → dostępność i zajętość pomp → rzeczywiste starty budów → generowanie kursów → przydział gruszek → konflikty i korekty → wynik końcowy`

## Postęp podetapów Etapu 5

- [x] **5A — kontrakt pełnego przeliczenia i granice sprzężenia.**
  - [x] **5A.1 — trzy godziny i niezmienniki:** `StartPlanowany` pozostaje źródłem,
    `StartZadany` decyzją operatora, a `StartRoboczy` rzeczywistym wynikiem silnika;
    ustalić kontrakt bez mutowania danych źródłowych.
  - [x] **5A.2 — czysty centralny przebieg:** jedno `przeliczCalyHarmonogram()`
    buduje wynik od początku i wywołuje istniejące moduły Etapów 3–4 we właściwej
    kolejności, bez logiki biznesowej w interfejsie.
  - [x] **5A.3 — test bazowy:** plan bez ograniczeń pomp i gruszek daje wynik
    zgodny z zamkniętymi Etapami 3–4, a kolejne identyczne przeliczenia nie
    dziedziczą starych kursów ani zajętości.
- [ ] **5B — wpływ pomp na rzeczywisty start budowy.**
  - [ ] **5B.1 — zastosowanie możliwego startu:** wynik przydziału pompy może
    przesunąć `StartRoboczy`, ale nigdy `StartPlanowany` ani `StartZadany`.
  - [ ] **5B.2 — brak możliwej pompy:** brak aktywnego lub zgodnego zasobu, brak
    wymaganej trasy albo niemożliwe okno dostępności tworzą jawny konflikt bez
    wymyślania zastępczej godziny.
  - [ ] **5B.3 — testy propagacji:** wielkość przesunięcia i jego przyczyna są
    zachowane przy budowie i stabilne przy ponownym przeliczeniu.
- [ ] **5C — regenerowanie kursów gruszek po zmianie startu.**
  - [ ] **5C.1 — nowe kursy od `StartRoboczy`:** po przesunięciu budowy wszystkie
    jej kursy są generowane ponownie z zachowaniem rytmu dostaw i fizycznego cyklu.
  - [ ] **5C.2 — ponowny przydział gruszek:** tryb bez limitu i `mam X gruszek`
    korzystają wyłącznie z nowych kursów i wyliczają rzeczywiste godziny dostaw.
  - [ ] **5C.3 — testy:** brak przesunięcia daje wynik zgodny z Etapem 3, a
    przesunięcie nie pozostawia żadnego kursu z poprzedniej wersji planu.
- [ ] **5D — rzeczywiste dostawy a czas pracy pompy.**
  - [ ] **5D.1 — rzeczywiste okno betonowania:** okres pracy pompy wynika z
    faktycznych godzin rozładunków po przydziale gruszek, nie tylko z planu bazowego.
  - [ ] **5D.2 — wpływ na następną budowę:** wydłużenie betonowania przez gruszki
    przesuwa gotowość pompy i może wymusić dalszą korektę kolejnej budowy.
  - [ ] **5D.3 — test kaskady:** co najmniej trzy budowy potwierdzają propagację
    opóźnienia bez nakładania pracy jednej pompy i jednej gruszki.
- [ ] **5E — stabilizacja sprzężonego przeliczenia.**
  - [ ] **5E.1 — deterministyczna iteracja:** powtarzać zależne obliczenia pomp,
    startów i gruszek tylko wtedy, gdy wynik poprzedniego przebiegu zmienił plan.
  - [ ] **5E.2 — warunek zakończenia:** stabilny wynik kończy przeliczenie bez
    dodatkowych zmian, a identyczne dane zawsze dają identyczny rezultat.
  - [ ] **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem:** limit iteracji
    lub równoważna osłona kończy niestabilny przypadek jawnym konfliktem zamiast
    bezgranicznie przesuwać plan.
- [ ] **5F — limit opóźnienia rozpoczęcia budowy.**
  - [ ] **5F.1 — parametr globalny:** domyślny limit `30 min` jest konfiguracją,
    nie magiczną liczbą w algorytmie.
  - [ ] **5F.2 — limit indywidualny:** budowa może nadpisać limit, a wartość jest
    zachowywana w bieżącym planie i historii.
  - [ ] **5F.3 — klasyfikacja wyniku:** korekta w limicie pozostaje zwykłym
    przesunięciem, przekroczenie staje się konfliktem z godziną i liczbą minut.
- [ ] **5G — maksymalny przestój podczas betonowania.**
  - [ ] **5G.1 — osobna definicja:** przestój liczyć pomiędzy rzeczywistym końcem
    rozładunku poprzedniej dostawy a rzeczywistym początkiem następnej; nie mieszać
    go z opóźnieniem pierwszej dostawy.
  - [ ] **5G.2 — parametr `MaksPrzestojMin`:** ustalić wartość domyślną przed
    implementacją i przechowywać ją jako parametr programu.
  - [ ] **5G.3 — konflikt ciągłości:** przekroczenie limitu jest jawne przy
    konkretnej budowie i wskazuje problematyczną parę dostaw oraz wielkość przerwy.
- [ ] **5H — wspólny model konfliktów i przyczyn.**
  - [ ] **5H.1 — kontrakt konfliktu:** jeden format dla braku gruszki, braku pompy,
    niedostępności, niezgodnego parametru, kolizji, braku trasy, limitu startu i przestoju.
  - [ ] **5H.2 — agregacja:** wynik końcowy zbiera konflikty bez dublowania i
    zachowuje powiązanie z budową, kursem albo zasobem.
  - [ ] **5H.3 — czytelne przyczyny:** komunikaty dla operatora są po polsku i
    nie wymagają odczytywania danych diagnostycznych.
- [ ] **5I — interfejs, parametry i pamięć wyniku Etapu 5.**
  - [ ] **5I.1 — trzy godziny i przesunięcie:** tabela pokazuje plan źródłowy,
    godzinę zadaną oraz rzeczywisty `StartRoboczy` razem z przyczyną różnicy.
  - [ ] **5I.2 — konflikty i przestoje:** problemy są widoczne tekstowo, a kolor
    jest tylko sygnałem pomocniczym.
  - [ ] **5I.3 — pamięć i stan nieaktualny:** parametry oraz wyjątki budów są
    odtwarzane, a każda istotna zmiana wymaga nowego pełnego przeliczenia.
- [ ] **5J — pełna regresja, publikacja i test operatora.**
  - [ ] **5J.1 — testy automatyczne:** cały Etap 5 oraz pełna regresja importu,
    pamięci, gruszek i pomp.
  - [ ] **5J.2 — publikacja:** `main`, GitHub Actions i GitHub Pages.
  - [ ] **5J.3 — test operatora:** rzeczywisty plan obejmujący przesunięcie przez
    pompę, niedobór gruszek, kaskadę, limit startu, przestój i brak możliwego zasobu.

Po każdym podetapie ponownie przeglądamy tę listę. Nie zamykamy Etapu 5, dopóki
nie przejdą pełna regresja oraz test operatora 5J.3.

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

## Zamknięcie 4H.4 — pamięć i ponowne przeliczenie — 2026-08-29

- [x] tryb oraz liczba pomp są zachowywane w bieżącym planie i historii;
- [x] po odświeżeniu wracają tryb, liczba oraz stan aktywności pola liczby pomp;
- [x] wartość `0` jest odtwarzana jako prawidłowy limit;
- [x] przejście do `Oblicz, ile potrzeba` usuwa limit z zapisywanych parametrów;
- [x] kolejne obliczenia dla różnych limitów i aktywnych list nie dziedziczą poprzednich zajętości;
- [x] `testy/etap_4h_4.test.js` oraz pełna regresja przechodzą.

Zamknięty podetap: **4H.4**. Punkt nadrzędny **4H** pozostaje otwarty.
Następny niezakończony podetap: **4H.5 — testy**.

## Zamknięcie 4H.5 i całego 4H — 2026-08-29

- [x] flota wystarczająca nie powoduje przesunięć;
- [x] zbyt mała flota wylicza kaskadowe przesunięcia bez tworzenia dodatkowych pomp;
- [x] `0` pomp nie tworzy fikcyjnego zasobu ani przydziału;
- [x] błędne dane wejściowe są odrzucane czytelnym błędem;
- [x] ponowne przeliczenie jest stabilne i zawsze zaczyna od czystego stanu;
- [x] pełne rzeczywiste okresy jednej pompy nie nakładają się;
- [x] pełna regresja potwierdza brak zmian w imporcie CSV i silniku gruszek.

Zamknięty podetap: **4H.5**. Cały punkt **4H — tryb „mam X pomp”** jest zakończony.
Następny niezakończony podetap: **4I.1 — centralny wynik**.

## Zamknięcie 4I.1 — centralny wynik pomp — 2026-08-29

- [x] `przeliczCalyHarmonogram()` zwraca rzeczywisty obiekt `pompy` zamiast pustego stanu;
- [x] tryb `Oblicz, ile potrzeba` zwraca minimalną liczbę pomp i techniczny wynik minimalnej floty;
- [x] tryb `Mam określoną liczbę` wykorzystuje rzeczywistą listę pomp oraz pełny wynik 4H;
- [x] aplikacja przekazuje do centralnego silnika kopię bieżącej listy pomp;
- [x] wynik pomp jest liczony z bazowych kursów przed korektami ograniczonej floty gruszek;
- [x] wynik pomp nie zmienia `StartRoboczy` ani kursów gruszek; pełne sprzężenie pozostaje zakresem Etapu 5;
- [x] test 4I.1 potwierdza oba tryby, `0`, stabilność granicy i walidację.

Zamknięty podetap: **4I.1**. Punkt nadrzędny **4I** pozostaje otwarty.
Następny niezakończony podetap: **4I.2 — wspólne sterowanie zasobami**.

## Zamknięcie 4I.2 — wspólne sterowanie zasobami — 2026-08-29

- [x] wspólny panel **STEROWANIE ZASOBAMI** zachowuje gruszki oraz pompy w jednym nagłówku, z pompami bezpośrednio pod gruszkami;
- [x] widok pomp korzysta z centralnego `wynik.pompy` utworzonego w 4I.1 zamiast ponownie liczyć minimalną flotę w interfejsie;
- [x] tryb **Oblicz, ile potrzeba** pokazuje liczbę potrzebną, a liczba dostępna pozostaje nieokreślona jako `—`;
- [x] tryb **Mam określoną liczbę** pokazuje liczbę potrzebną oraz rzeczywistą liczbę pomp dopuszczonych do przydziału, a nie tylko wartość zadeklarowaną w polu;
- [x] skrót statusu rozróżnia brak pomp, niedobór, ograniczenia dostępności i wystarczającą flotę oraz zachowuje pomocniczy skrót aktywnych pomp i godzin `Dostępna od/do`;
- [x] szczegółowe pola **Dostępna od** i **Dostępna do** pozostają przypisane do kart konkretnych pomp;
- [x] zachowano kompatybilność starszego testu 4G.2 dla dawnego wyniku bez pola `pompy`, ale przy obecnym kontrakcie centralny `wynik.pompy` ma pierwszeństwo;
- [x] `testy/etap_4i_2.test.js` oraz pełna regresja GitHub Actions przechodzą poprawnie.

Zamknięty podetap: **4I.2**. Punkt nadrzędny **4I** pozostaje otwarty.
Następny niezakończony podetap: **4I.3 — tabela pomp**.

## Zamknięcie 4I.3 — tabela pomp — 2026-08-29

- [x] osobna tabela pracy pomp korzysta z centralnego `wynik.pompy` i jest prezentowana niezależnie od tabeli kursów gruszek;
- [x] tryb **Mam określoną liczbę** pokazuje rzeczywistą pompę, przygotowanie, betonowanie, zakończenie, przejazd i gotowość do kolejnej pracy;
- [x] tryb **Oblicz, ile potrzeba** pokazuje pompy minimalnej floty i nie wymyśla przejazdów między budowami, których ten kontrakt nie wyznacza;
- [x] brak przydziału pozostaje jawnie widoczny, a wynik jest czyszczony po zmianie danych, odtworzeniu albo wyczyszczeniu planu;
- [x] 4I.3 nie zmienia `StartRoboczy`, nie przebudowuje kursów gruszek i nie wykonuje jeszcze sprzężenia zasobów z Etapu 5;
- [x] `testy/etap_4i_3.test.js` oraz pełna regresja GitHub Actions przeszły poprawnie przed i po scaleniu do `main`.

Zamknięty podetap: **4I.3**. Punkt nadrzędny **4I** pozostaje otwarty.
Następny niezakończony podetap: **4I.4 — komunikaty pomp**.

## Zamknięcie 4I.4 — komunikaty pomp — 2026-08-29

- [x] interfejs korzysta z istniejącego `jawnySkutekPompy` z 4H.3 zamiast wprowadzać drugą logikę planistyczną;
- [x] operator widzi czytelny brak aktywnej pompy, niedostępność godzinową, niewystarczający wysięg oraz brak czasu przejazdu;
- [x] przesunięta budowa pokazuje liczbę minut, najwcześniejszy możliwy start i dokładną przyczynę, np. zajętość albo przejazd z poprzedniej budowy;
- [x] komunikat jest widoczny w tabeli pomp oraz jako kompaktowa automatyczna notka przy konkretnej budowie;
- [x] tryb **Oblicz, ile potrzeba** pozostaje techniczny i nie tworzy fikcyjnych ostrzeżeń o rzeczywistych pompach;
- [x] 4I.4 nadal nie zmienia `StartRoboczy` ani kursów gruszek; pełne sprzężenie pozostaje zakresem Etapu 5;
- [x] `testy/etap_4i_4.test.js`, pełna regresja PR oraz końcowy workflow na `main` przeszły poprawnie.

Zamknięty podetap: **4I.4**. Punkt nadrzędny **4I** pozostaje otwarty.
Następny niezakończony podetap: **4I.5 — zgodność offline i dostępność interfejsu**.

## Zamknięcie 4I.5 i całego 4I — 2026-08-29

- [x] `index.html` ładuje skrypty, style i grafiki wyłącznie z lokalnych plików repozytorium; 4I nie dodaje CDN ani biblioteki wymagającej internetu;
- [x] tabela pomp jest opisana przez `aria-labelledby` i `aria-describedby`, a jej nagłówki mają jawne `scope="col"`;
- [x] przewijany poziomo obszar tabeli pomp jest dostępny z klawiatury, ma widoczny fokus i pozostaje użyteczny na ekranie do 620 px;
- [x] brak przydziału i przesunięcie mają jawny tekst oraz role `alert/status`, więc kolor pozostaje wyłącznie sygnałem pomocniczym;
- [x] długie komunikaty pomp mogą się zawijać i nie wymuszają zwiększania wysokości podstawowych wierszy budów bez potrzeby;
- [x] `testy/etap_4i_5.test.js` sprawdza lokalność wszystkich zasobów z `index.html`, semantykę tabeli, obsługę klawiatury, tekstowe komunikaty i granicę Etapu 4;
- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi po zmianach 4I.5.

Zamknięty podetap: **4I.5**. Cały punkt **4I — integracja wyniku i interfejs operatora** jest zakończony.
Następny niezakończony podetap: **4J.1 — testy automatyczne**.

## Zamknięcie 4J.1 — pełna regresja automatyczna — 2026-08-29

- [x] przeprowadzono audyt wszystkich plików `testy/*.test.js` i wymaganych grup regresji;
- [x] potwierdzono pokrycie importu CSV/KDX, rodzajów rozładunku, odbiorów własnych, pamięci oraz całego Etapu 3;
- [x] potwierdzono pokrycie wszystkich podpunktów pomp 4A–4I;
- [x] zsynchronizowano historycznie niezaznaczone przypadki 4E z istniejącymi testami 4E.2–4E.4;
- [x] usunięto z testów 4I zależność od dokładnego bieżącego numeru podetapu, aby nie blokowały poprawnego rozwoju 4J i kolejnych etapów;
- [x] dodano `testy/etap_4j_1.test.js`, który pilnuje kompletności zestawu regresji, pełnego runnera GitHub Actions i granicy Etapu 4;
- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi poprawnie.

Zamknięty podetap: **4J.1**. Punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte.
Następny niezakończony podetap: **4J.2 — publikacja**.

## Zamknięcie 4J.2 — publikacja — 2026-08-29

- [x] stan po końcowej regresji 4J.1 znajduje się na `main` w commicie `0a26a72`;
- [x] GitHub Actions `Testy automatyczne` dla tego commita zakończył się statusem `success` (run `33270058614`);
- [x] GitHub Pages opublikował ten sam commit `0a26a72` z wynikiem `success` (run `33270057938`);
- [x] publikacja korzysta z gałęzi `main` i nie wprowadza dodatkowej zależności potrzebnej do pracy offline;
- [x] adres wersji webowej pozostaje `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`;
- [x] 4J.2 nie zmienia logiki harmonogramu ani granicy Etapu 4.

Zamknięty podetap: **4J.2**. Punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte do testu operatora.
Następny niezakończony podetap: **4J.3 — test operatora**.

## Zamknięcie 4J.3.1 — jawne czasy przejazdów pomp — 2026-08-29

- [x] pod główną tabelą budów dodano osobny, kompaktowy panel **Przejazdy między budowami**;
- [x] panel pokazuje kierunkowe relacje do późniejszych budów wymagających pompy;
- [x] każda relacja pokazuje czas, źródło oraz pole ręcznej edycji;
- [x] wpis ręczny ma źródło `reczny`, jest używany przez centralny silnik i oznacza wynik jako nieaktualny;
- [x] import zachowuje bazową wartość z `PrzejazdyPompy`, a `↺` przywraca ją po ręcznej zmianie;
- [x] wartości bieżące, bazowe i źródła są objęte pamięcią planu oraz historią;
- [x] brak wartości pozostaje jawnym brakiem trasy, bez przyjmowania fikcyjnego zera;
- [x] nowy test `testy/etap_4j_3_1.test.js` oraz pełna regresja chronią zmianę;
- [x] nie zmieniono `StartRoboczy`, kursów gruszek ani granicy odpowiedzialności Etapu 4.

Zamknięty podetap: **4J.3.1**. Punkt **4J.3**, punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte.
Następny niezakończony podetap: **4J.3.2 — ponowny test operatora**.

## Zamknięcie 4J.3.2, 4J i całego Etapu 4 — 2026-08-30

- [x] operator sprawdził jawne relacje przejazdów dla planu z co najmniej trzema budowami pompowanymi;
- [x] ręczna zmiana czasu została użyta po przeliczeniu, a `↺` przywrócił wartość bazową z CSV;
- [x] ręczna korekta pozostała po odświeżeniu strony;
- [x] scenariusze braku pomp, jednej pompy, kilku pomp, pompy nieaktywnej, zbyt małej floty i rzeczywistego przejazdu zakończyły się poprawnie;
- [x] dodatkowa poprawka szerokości okna **Zapisane trasy** została potwierdzona przez operatora;
- [x] automatyczna regresja po poprawce UI i po zapisie zamknięcia Etapu 4 zakończyła się powodzeniem.

Podetap **4J.3.2**, punkt **4J.3**, cały **4J** oraz cały **Etap 4 — Pompy** są zakończone.

## Plan rozpoczęcia Etapu 5 — 2026-08-30

Przed kodowaniem rozpisano podetapy **5A–5J**. Etap 5 świadomie obejmuje sprzężenie zwrotne: opóźnione dostawy gruszek mogą wydłużyć rzeczywisty okres pracy pompy, a to może przesunąć kolejną budowę. Silnik musi więc dojść do stabilnego wyniku albo zwrócić jawny konflikt, zamiast wykonać tylko jedno przejście obliczeń.

# Kolejny krok

Rozpocząć **5B.1 — zastosowanie możliwego startu pompy**. Wynik przydziału pompy może przesunąć wyłącznie `StartRoboczy`; `StartPlanowany` i `StartZadany` muszą pozostać bez zmian.

## Zamknięcie 5A.1 — trzy godziny i niezmienniki — 2026-08-30

- [x] `StartPlanowany` pozostaje niezmiennym źródłem planu;
- [x] `StartZadany` pozostaje decyzją operatora i początkiem każdego nowego przebiegu;
- [x] `StartRoboczy` jest tworzony od nowa jako wynik bieżącego silnika i nie jest dziedziczony z poprzedniego przeliczenia;
- [x] budowy, w tym ich zagnieżdżone dane źródłowe, są kopiowane przed rozpoczęciem obliczeń;
- [x] test `etap_5a_1.test.js` potwierdza kontrakt trzech godzin, brak mutacji źródła i czysty ponowny start;
- [x] pełna regresja wcześniejszych etapów przechodzi poprawnie.

Zamknięty podetap: **5A.1**. Punkt nadrzędny **5A** i cały **Etap 5** pozostają otwarte.
Następny niezakończony podetap: **5A.2 — czysty centralny przebieg**.

## Zamknięcie 5A.2 — czysty centralny przebieg — 2026-08-30

- [x] publicznym punktem wejścia pozostaje jedno `przeliczCalyHarmonogram()`;
- [x] centralny przebieg jawnie przygotowuje budowy, buduje bazowe kursy, oblicza niezależny wynik pomp, przydziela gruszki i składa wynik końcowy;
- [x] logika przebiegu pozostaje w module harmonogramu i nie korzysta z DOM ani zdarzeń interfejsu;
- [x] granica Etapu 4 jest zachowana — wpływ pompy nie zmienia jeszcze `StartRoboczy`, ponieważ rozpocznie się dopiero w 5B;
- [x] test `etap_5a_2.test.js` potwierdza kolejność faz oraz kompletny wynik obu zasobów;
- [x] pełna regresja wcześniejszych etapów przechodzi poprawnie.

Zamknięty podetap: **5A.2**. Punkt nadrzędny **5A** i cały **Etap 5** pozostają otwarte.
Następny niezakończony podetap: **5A.3 — test bazowy**.

## Zamknięcie 5A.3 i całego 5A — test bazowy — 2026-08-30

- [x] centralny wynik kursów jest zgodny z bezpośrednim wynikiem zamkniętego Etapu 3;
- [x] centralny wynik minimalnej liczby pomp jest zgodny z bezpośrednim wynikiem zamkniętego Etapu 4;
- [x] identyczne kolejne przeliczenia zwracają identyczny wynik;
- [x] zmiana poprzedniego wyniku nie przenika do następnego przeliczenia;
- [x] przekazane stare kursy i stary wynik pomp są ignorowane;
- [x] dane wejściowe pozostają niezmienione;
- [x] test `etap_5a_3.test.js` oraz pełna regresja przechodzą poprawnie.

Podetap **5A.3** oraz cały punkt **5A** są zakończone. Etap 5 pozostaje otwarty.
Następny niezakończony podetap: **5B.1 — zastosowanie możliwego startu**.


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


## Zamknięcie 3E.6 i całego Etapu 3 — 2026-08-23

- [x] wersja 3E została opublikowana na `main`;
- [x] GitHub Actions i GitHub Pages zakończyły publikację powodzeniem;
- [x] operator porównał ten sam rzeczywisty plan w trybie obliczania potrzebnej
  floty i w trybie ograniczonej liczby gruszek;
- [x] dla `5` gruszek plan nie wymagał przesunięć;
- [x] dla `4` gruszek program nie utworzył `Gruszki 5`, pokazał dwa opóźnione
  kursy (`+30 min` i `+5 min`) oraz ich pierwotne godziny rozładunku;
- [x] potwierdzono brak nakładania pełnych cykli jednej gruszki;
- [x] wariant `0` gruszek i odtworzenie ustawienia z pamięci zostały sprawdzone
  zgodnie z instrukcją testu 3E.6.2;
- [x] po teście zaakceptowano przeniesienie sterowania flotą do nagłówka wyniku
  jako osobną poprawkę czytelności bez zmiany logiki silnika.
- [x] po publikacji operator potwierdził poprawne działanie i czytelność
  kontrolek **Tryb pracy** oraz **Liczba gruszek** w nowym miejscu.

Podetapy **3E.6.1–3E.6.2**, cały punkt **3E** oraz cały **Etap 3 — podstawowy
silnik gruszek** są zakończone. Pełny podział **Etapu 4 — pompy** został
przygotowany; następnym podetapem jest **4A.1 — kwalifikacja budów**.


## KP-4.1 — model trzech godzin budowy — 2026-08-23

- [x] budowy z importu i budowy ręczne otrzymują `StartZadany` równy
  `StartPlanowany`;
- [x] `StartPlanowanyZrodlowy`, `StartPlanowany`, `StartZadany` i
  `StartRoboczy` pozostają osobnymi polami modelu;
- [x] lista robocza bezpiecznie uzupełnia `StartZadany` w obiektach utworzonych
  przed KP-4.1 bez modyfikowania ich źródła;
- [x] `StartZadany` jest uwzględniony w polach zapisywanych razem z planem;
- [x] osobny test `testy/kp_4.test.js` oraz pełna regresja potwierdzają model.

Podetap **KP-4.1** jest zakończony. Następny podetap to **KP-4.2 — edycja
godziny w tabeli budów i przywracanie wartości źródłowej**.


## KP-4.2 — edycja godziny w tabeli — 2026-08-23

- [x] pierwsza kolumna tabeli budów pokazuje pole **Start do przeliczenia**;
- [x] pod polem pozostaje widoczna źródłowa godzina lub pełne okno planowane;
- [x] operator może zmienić godzinę bez ponownego importu CSV;
- [x] przycisk `↺` przywraca `StartPlanowany` tylko dla wybranej budowy;
- [x] korekta ustawia `StartZadany` i `StartRoboczy`, ale nie zmienia
  `StartPlanowany` ani `StartPlanowanyZrodlowy`;
- [x] ten sam mechanizm działa dla dostaw planowanych i odbiorów własnych;
- [x] zmiana jest zapisywana w bieżącym planie i oznacza poprzedni wynik jako
  wymagający ponownego przeliczenia;
- [x] test modelu i test pełnego przepływu aplikacji obejmują zmianę,
  przywrócenie, zachowanie źródła i stan nieaktualnego wyniku.
- [x] implementacja została opublikowana bezpośrednio na `main` w commicie
  `03d8fe8`;
- [x] pełna regresja wszystkich `23` zestawów testów przeszła lokalnie oraz w
  GitHub Actions;
- [x] GitHub Pages zakończył wdrożenie powodzeniem i udostępnia pole **Start do
  przeliczenia**, godzinę źródłową oraz przycisk przywrócenia `↺`.

Podetap **KP-4.2** jest zakończony. KP-4 pozostaje otwarty. Następny podetap to
**KP-4.3 — pełna walidacja formatu godziny i czytelne błędy korekty**.


## KP-4.3 — walidacja korekty godziny — 2026-08-24

- [x] korekta przyjmuje wyłącznie pełny zapis `HH:MM` od `00:00` do `23:59`;
- [x] pusta wartość daje osobny, czytelny komunikat po polsku;
- [x] niepełny format, godzina poza dobą, niepoprawne minuty i tekst są
  odrzucane przed zmianą modelu;
- [x] błędna próba zachowuje poprzednie `StartZadany`, `StartRoboczy`,
  `StartPlanowany` i `StartPlanowanyZrodlowy`;
- [x] błędna próba nie unieważnia wcześniej poprawnie przeliczonego wyniku;
- [x] poprawna zmiana oraz przywrócenie nadal oznaczają harmonogram jako
  wymagający ponownego przeliczenia;
- [x] pole czasu korzysta również z natywnych ograniczeń przeglądarki i kroku
  jednej minuty;
- [x] test modelu obejmuje format, granice doby i brak budowy, a test pełnego
  przepływu sprawdza komunikat oraz zachowanie wcześniejszego wyniku.
- [x] kontrola składni i pełna regresja wszystkich `23` zestawów testów
  przechodzą po zmianie.

Podetap **KP-4.3** jest zakończony. KP-4 pozostaje otwarty. Następny podetap to
**KP-4.4 — pamięć korekty i zgodność ze starszymi zapisami**.


## KP-4.4 — pamięć korekty i zgodność — 2026-08-24

- [x] `StartZadany` jest zapisywany w bieżącym planie razem z
  `StartPlanowany`, `StartPlanowanyZrodlowy` i `StartRoboczy`;
- [x] poprawna korekta pozostaje w bieżącym planie po odświeżeniu również
  przed ponownym przeliczeniem;
- [x] po przeliczeniu skorygowany plan otrzymuje osobny zapis historyczny, a
  wcześniejszy wpis zachowuje swoją poprzednią godzinę;
- [x] przeliczony plan z korektą odtwarza po odświeżeniu zarówno pole godziny,
  jak i wynik harmonogramu;
- [x] przywrócenie godziny bazowej zapisuje się trwale, a kolejny import tworzy
  budowę z nowym `StartZadany` równym jej `StartPlanowany`;
- [x] bieżący plan ze starszego formatu bez `StartZadany` otrzymuje tę wartość
  z `StartPlanowany` i zostaje zapisany już w uzupełnionym formacie;
- [x] migracja nie zmienia godziny źródłowej ani istniejącego
  `StartRoboczy` i nie przepisuje wcześniejszych wpisów historii;
- [x] test pełnego przepływu pamięci i osobny test KP-4 potwierdzają zmianę,
  odświeżenie, historię, przywrócenie, nowy import i zgodność starszego planu.

Podetap **KP-4.4** jest zakończony. KP-4 pozostaje otwarty. Następny podetap to
**KP-4.5 — końcowa regresja, publikacja i test operatora**.


## KP-4.5 — publikacja i test operatora — 2026-08-24

- [x] pełna regresja wszystkich `23` wcześniejszych zestawów testów przeszła
  lokalnie i w GitHub Actions;
- [x] KP-4.4 opublikowano na `main` w commicie `6d4e42c`;
- [x] wdrożenie GitHub Pages zakończyło się powodzeniem;
- [x] operator potwierdził na rzeczywistym planie zmianę godziny, ponowne
  przeliczenie, odtworzenie po odświeżeniu, przywrócenie godziny bazowej i
  poprawne zakończenie testu.

Podetap **KP-4.5** oraz cały **KP-4 — ręczna korekta godziny budowy** są
zakończone. Rozpoczęto **Etap 4 — pompy** od podetapu 4A.1.


## 4A.1 — kwalifikacja budów wymagających pompy — 2026-08-24

- [x] moduł pomp rozpoznaje budowę jako wymagającą pompy wyłącznie wtedy, gdy
  jej znormalizowany `rodzajRozladunku` ma wartość `pompa`;
- [x] odbiór własny, lej, wywrotka, taczka, nieznana wartość oraz starsza
  budowa bez pola rodzaju rozładunku nie są uznawane za pompowane;
- [x] kwalifikacja zwraca osobno budowy wymagające i niewymagające pompy oraz
  jawne liczniki obu grup, zachowując stabilną kolejność wejściową;
- [x] kwalifikacja nie zmienia budów, godzin, ilości, statusu ani kursów
  gruszek i nie rozstrzyga jeszcze okresu zajętości pompy;
- [x] osobny test `testy/etap_4a_1.test.js` obejmuje wszystkie obsługiwane
  rodzaje rozładunku, brak pola, puste dane, stabilny podział i brak mutacji;
- [x] kontrola składni i pełna regresja wszystkich `24` zestawów testów
  przechodzą po rozpoczęciu Etapu 4.

Podetap **4A.1** jest zakończony. Punkt 4A oraz cały Etap 4 pozostają otwarte.
Następny podetap to **4A.2 — czas obsługi pompy**.


## Wcześniejszy fundament listy i panelu pomp — 2026-08-24

Na wyraźne zlecenie operatora wykonano przed 4A.2 niezależne elementy modelu i
interfejsu, które nie wymagają jeszcze ustalenia czasów pełnego cyklu pompy:

- [x] **4B.1:** pompa ma stabilne ID, nazwę, typ własna/zewnętrzna, aktywność,
  własną godzinę **Dostępna od** i wysięg w metrach, domyślnie `32 m`;
- [x] **4C.1:** panel **Sterowanie zasobami** pokazuje pompy bezpośrednio pod
  gruszkami, pozwala podać rzeczywistą liczbę i edytować szczegóły każdej
  pompy, a podsumowanie pokazuje liczbę aktywnych pomp;
- [x] **4C.2:** tryb, liczba i lista pomp są zapisywane w bieżącym planie oraz
  historii i odtwarzane po odświeżeniu; starszy zapis bez listy pozostaje
  poprawny;
- [x] budowa z rodzajem rozładunku `pompa` ma standardowe wymaganie `32 m`
  pokazane w jednym zwartym wierszu; zaznaczenie **Większa pompa** odsłania pole
  dla wartości większej niż `32 m`, a odznaczenie przywraca standard;
- [x] starsze puste wysięgi pomp i wymagania budów są przy odtworzeniu planu
  migrowane do `32 m`, a wynik jest zapisywany w pamięci planu;
- [x] licznik potrzebnych pomp świadomie pokazuje `—`, dopóki 4A.2–4G nie
  dostarczą rzeczywistego okresu zajętości, przydziału i minimalnej liczby;
- [x] model, pamięć i struktura panelu są objęte testami automatycznymi.

Nie zamyka to 4B.2, 4B.3, 4C.3 ani 4I.2: potrzebne są jeszcze pełne operacje
listy, reguła pomijania nieaktywnych pomp w przydziale, test operatora oraz
rzeczywisty wynik liczby potrzebnych pomp. Następny krok pozostaje bez zmian:
**4A.2 — czas obsługi pompy**.


## Punkt kontrolny — standardowy wysięg pomp i plan na kolejny dzień — 2026-08-24

- [x] zatwierdzono biznesową zasadę, że podstawowy wysięg pompy oraz standardowe
  wymaganie budowy wynoszą `32 m`;
- [x] standardowa budowa pokazuje zwarty opis **Pompa · 32 m**, a pole długości
  pojawia się dopiero po zaznaczeniu **Większa pompa**;
- [x] odznaczenie przełącznika przywraca `32 m`, a starsze puste wartości są
  bezpiecznie migrowane do standardu;
- [x] pełna lokalna regresja wszystkich `25` zestawów testów przeszła;
- [x] zmiana została opublikowana na `main` w commicie `c94969a`;
- [x] operator po aktualizacji GitHub Pages wykonał `Ctrl + F5`, wczytał plan
  testowy i potwierdził niski, czytelny wiersz **Pompa · 32 m**;
- [x] operator potwierdził poprawne działanie opublikowanej zmiany, w tym
  kompaktowy układ i obsługę większego wysięgu pompy.

Test operatora standardowego wysięgu został zaliczony. Nie zamyka on jeszcze
4C.3 ani 4I.2, ponieważ te punkty obejmują również dalsze działanie pełnej
listy i rzeczywistych wyników silnika pomp. Następnym podetapem implementacyjnym
jest **4A.2 — ustalenie parametrów czasu pełnej obsługi pompy**.


## 4A.2 — parametry czasu obsługi pompy — 2026-08-25

- [x] standardowa pompa `32 m` otrzymuje `20 min` na rozstawienie przed
  rozpoczęciem pierwszego rozładunku;
- [x] po zakończeniu ostatniego rozładunku pompa pozostaje zajęta przez `30 min`
  na składanie, mycie i przygotowanie do wyjazdu; w tej wartości mieści się
  założone około `20 min` samego mycia;
- [x] dla większego wymaganego wysięgu oba czasy rosną o `5 min` za każde
  rozpoczęte dodatkowe `10 m` ponad standard `32 m`;
- [x] wartości wyliczone automatycznie można nadpisać osobno dla konkretnej
  budowy, a wyłączenie wyjątku przywraca wynik zależny od wysięgu;
- [x] właściwy czas pompowania jest wyznaczany od początku pierwszego
  rozładunku do końca ostatniego rozładunku tej budowy;
- [x] model zachowuje osobno wartości automatyczne i robocze, a pola robocze są
  objęte istniejącą pamięcią planu oraz historią;
- [x] nowy test `testy/etap_4a_2.test.js` sprawdza standard `32 m`, większe
  wysięgi, rozpoczęte przedziały `10 m`, ręczne wyjątki, walidację i okno
  właściwego pompowania;
- [x] pełna lokalna regresja wszystkich `26` zestawów testów przechodzi.

Podetap **4A.2** jest zakończony. Punkt 4A i cały Etap 4 pozostają otwarte.
Następny podetap to **4A.3 — wynik niezależnego silnika pomp**.


## 4A.3–4A.4 — kontrakt wyniku i zamknięcie reguł 4A — 2026-08-25

- [x] niezależny moduł pomp udostępnia stabilny wynik z osobnymi polami na
  przydział, okres zajętości, najwcześniejszy możliwy start, opóźnienie i skutek
  niedoboru dla każdej zakwalifikowanej budowy;
- [x] do czasu wykonania właściwych obliczeń pola wynikowe mają wartość `null`,
  a nie mylące `0`; status wprost mówi `oczekuje-na-obliczenie`;
- [x] wynik przechowuje osobno `StartPlanowany`, `StartZadany` i roboczy start
  sprzed wpływu pompy, ale nie nadpisuje żadnej z tych wartości w budowie;
- [x] lista pomp jest kopiowana do wyniku, więc późniejsze operacje na wyniku
  nie zmieniają danych wejściowych;
- [x] puste dane zachowują ten sam kontrakt, dzięki czemu centralny harmonogram
  pozostaje zgodny ze starszymi etapami;
- [x] test `testy/etap_4a_3.test.js` sprawdza kształt wyniku, kwalifikację,
  wartości nieobliczone, kopie danych i brak mutowania godzin źródłowych;
- [x] pełna lokalna regresja wszystkich `27` zestawów testów przechodzi;
- [x] zatwierdzone granice zapisano w decyzji 84, a nierozstrzygnięte zasady
  pomp zewnętrznych i tras pozostają jawne w P-010 oraz P-011 backlogu;
- [x] test operatora 4A.2 potwierdził na opublikowanej stronie czasy `20/30 min`,
  obecność wyboru innych czasów i czytelny, kompaktowy układ budów.

Cały punkt **4A** jest zakończony. Etap 4 pozostaje otwarty. Następny
niezakończony podetap to **4B.2 — operacje na liście pomp**.


## 4B.2 — niezależne operacje na liście pomp — 2026-08-25

- [x] moduł pomp udostępnia osobne operacje dodania, pełnej edycji, zmiany
  aktywności i usunięcia pojedynczej pompy;
- [x] żadna z operacji nie zmienia wejściowej listy ani obiektów pomp;
- [x] edycja nie pozwala zmienić stabilnego `idPompy`, a usunięcie jednej pompy
  nie przenumerowuje pozostałych zasobów;
- [x] zmiana wielu pól jest atomowa z punktu widzenia stanu wejściowego — błąd
  walidacji nie pozostawia częściowo zapisanej zmiany;
- [x] dotychczasowe pole liczby pomp nadal działa, ale korzysta ze wspólnych
  operacji dodawania i usuwania zamiast utrzymywać osobną logikę listy;
- [x] operacje pozostają niezależne od obliczania zajętości, przydziału i
  minimalnej liczby pomp;
- [x] test `testy/etap_4b_2.test.js` obejmuje dodawanie, edycję, wyłączanie,
  usuwanie, stabilność ID, brak mutacji i zgodność pola liczby pomp;
- [x] pełna lokalna regresja wszystkich `28` zestawów testów przechodzi.

Podetap **4B.2** jest zakończony. Punkt 4B i cały Etap 4 pozostają otwarte.
Następny niezakończony podetap to **4B.3 — walidacja i testy modelu pomp**.


## 4B.3 — walidacja modelu i zamknięcie 4B — 2026-08-25

- [x] jawnie powtórzone `idPompy` są odrzucane z czytelnym komunikatem;
- [x] brakujące i puste ID są uzupełniane bez kolizji z identyfikatorami już
  obecnymi na liście;
- [x] typ jest normalizowany wyłącznie do `wlasna` albo `zewnetrzna`, a wartość
  nierozpoznana nie jest po cichu przyjmowana;
- [x] puste ID, nazwa, typ, aktywność, dostępność i wysięg otrzymują bezpieczne
  wartości domyślne, również gdy zapis zawiera same spacje;
- [x] aktywność musi być prawdziwą wartością logiczną, więc tekst `"false"` nie
  może zostać błędnie potraktowany jako aktywna pompa;
- [x] moduł udostępnia listę kandydatów do przyszłego przydziału zawierającą
  wyłącznie pompy aktywne i będącą kopią danych wejściowych;
- [x] test `testy/etap_4b_3.test.js` obejmuje kolizje ID, typy, puste pola,
  błędne wartości oraz wykluczanie nieaktywnych pomp;
- [x] pełna lokalna regresja wszystkich `29` zestawów testów przechodzi.

Cały punkt **4B — model danych i lista pomp** jest zakończony. Etap 4 pozostaje
otwarty. Następny niezakończony podetap to **4C.3 — odtworzenie i test operatora
listy pomp**.


## 4C.3 — automatyczny test odtwarzania listy pomp — 2026-08-25

- [x] odświeżenie strony odtwarza tryb, liczbę, typ, aktywność, godzinę
  dostępności i wysięg każdej pompy;
- [x] kolejny import CSV zastępuje budowy z pliku, ale zachowuje bieżącą listę
  zasobów pomp;
- [x] wyczyszczenie planu usuwa bieżącą listę pomp i zapis planu, pozostawiając
  historię zgodnie z zasadami pamięci;
- [x] odtworzenie zapisu historycznego przywraca pełną listę pomp wraz ze
  szczegółami;
- [x] scenariusz został dodany do `testy/pamiec_aplikacji.test.js` bez
  dublowania istniejącego środowiska testowego pamięci;
- [x] pełna lokalna regresja wszystkich `29` zestawów testów przechodzi;
- [x] test operatora na opublikowanej stronie potwierdza te same cztery
  zachowania.

Test operatora potwierdził odtworzenie obu pomp po odświeżeniu, zachowanie listy
po kolejnym imporcie, jej usunięcie po wyczyszczeniu planu oraz pełny powrót pomp
z zapisu historycznego. Podetap **4C.3** i cały punkt **4C** są zakończone.
Następny podetap to **4D.1 — planowane okno betonowania**.


## 4D.1 — planowane okno betonowania — 2026-08-25

- [x] osobna funkcja wyznacza początek betonowania z najwcześniejszego początku
  rozładunku wszystkich kursów należących do danej budowy;
- [x] koniec betonowania pochodzi z najpóźniejszego końca rozładunku, więc pompy
  nie zwalnia zakończenie pojedynczej dostawy;
- [x] kolejność kursów na liście oraz kursy innych budów nie zmieniają wyniku;
- [x] wynik budowy silnika pomp przechowuje `planowaneOknoBetonowania`, natomiast
  `okresZajetosci` pozostaje `null` do połączenia pełnego cyklu w 4D.2;
- [x] obliczenie nie zmienia budowy ani listy kursów i zachowuje wcześniejszy
  kontrakt `wyznaczOknoPompowaniaBudowy()` z 4A.2;
- [x] nowy test `testy/etap_4d_1.test.js` sprawdza trzy dostawy rozłożone w czasie
  oraz osadzenie okna w niezależnym wyniku silnika pomp;
- [x] pełna lokalna regresja wszystkich `30` zestawów testów przechodzi.

Podetap **4D.1** jest zakończony. Punkt 4D pozostaje otwarty, a następnym
podetapem jest **4D.2 — pełny cykl pompy**. Ten krok nie zmienia interfejsu,
dlatego nie wymaga osobnego testu operatora.


## 4D.2 — pełny cykl pompy — 2026-08-26

- [x] pełny okres zajętości rozpoczyna się o czas przygotowania przed początkiem
  pierwszego rozładunku i kończy po czynnościach następujących po ostatnim
  rozładunku;
- [x] wynik przechowuje osobno początek i koniec zajętości, granice
  betonowania, trzy składowe czasu oraz całkowity czas zajęcia pompy;
- [x] standard `32 m` korzysta z czasów `20/30 min`, większy wysięg zwiększa
  obie wartości zgodnie z regułą 4A.2, a ręczne wyjątki budowy mają
  pierwszeństwo;
- [x] pole `okresZajetosci` w niezależnym wyniku budowy jest wypełniane bez
  przydzielania konkretnej pompy i bez zmiany godzin, budowy ani kursów;
- [x] test `testy/etap_4d_2.test.js` sprawdza standardowy pełny cykl, większy
  wysięg, ręczne czasy, brak mutacji i osadzenie okresu w wyniku silnika;
- [x] pełna lokalna regresja wszystkich `31` zestawów testów przechodzi.

Podetap **4D.2** jest zakończony. Punkt 4D pozostaje otwarty, a następnym
podetapem jest **4D.3 — przypadki brzegowe i testy**. Zmiana nie dodaje jeszcze
przydziału pomp ani nowego widoku, dlatego nie wymaga osobnego testu operatora.


## 4D.3 — przypadki brzegowe i testy — 2026-08-26

- [x] jedna dostawa tworzy pełny okres od przygotowania przed rozładunkiem do
  zakończenia czynności po nim, a wiele dostaw obejmuje całe wspólne okno;
- [x] budowa z `0 m³`, oznaczona jako zrealizowana albo bez ilości nie tworzy
  okna ani zajętości, nawet jeżeli do obliczenia trafi stary kurs;
- [x] budowa z innym rodzajem rozładunku niż pompa nie zajmuje pompy;
- [x] brak początku lub końca rozładunku, wartość nieliczbowa i koniec
  niepóźniejszy od początku kończą się czytelnym błędem wskazującym kurs;
- [x] ujemna ilość i nieprawidłowe ręczne czasy obsługi pompy są odrzucane,
  natomiast brak ręcznych czasów nadal bezpiecznie korzysta z wartości
  domyślnych;
- [x] test `testy/etap_4d_3.test.js` obejmuje wszystkie powyższe granice, a
  pełna lokalna regresja wszystkich `32` zestawów testów przechodzi.

Cały punkt **4D — okres zajętości pompy na budowie** jest zakończony. Następny
podetap to **4E.1 — baza do pierwszej budowy**. Zmiana dotyczy wyłącznie modelu
i walidacji, dlatego nie wymaga osobnego testu operatora.


## 4E.1 — betoniarnia do pierwszej budowy — 2026-08-26

- [x] bazą pompy jest miejsce załadunku gruszek, czyli betoniarnia;
- [x] przejazd pompy korzysta z istniejącego
  `czasDojazduRoboczyMinuty` budowy oraz zachowuje jego źródło: wpis ręczny,
  pamięć tras albo mapę;
- [x] nie powstało drugie pole czasu ani dodatkowy obowiązek dla operatora;
- [x] informacyjny wyjazd jest liczony od początku przygotowania pompy: dla startu
  betonowania `08:00`, przygotowania `20 min` i dojazdu `25 min` pompa wyjeżdża
  o `07:15` i przyjeżdża o `07:40`;
- [x] wynik `informacyjnyPrzejazdZBazy` ma jawne
  `czyWplywaNaDostepnoscPompy: false`; pierwszy dojazd nie przydziela i nie
  zajmuje pompy, nie zwiększa ich minimalnej liczby oraz nie przesuwa
  `StartPlanowany`, `StartZadany`, `StartRoboczy` ani kursów gruszek;
- [x] brak wspólnego czasu dojazdu kończy się komunikatem kierującym operatora
  do istniejącego pola, a czas `0 min` pozostaje poprawny;
- [x] test `testy/etap_4e_1.test.js` potwierdza obliczenia, granice, brak mutacji
  i osadzenie przejazdu w niezależnym wyniku pomp;
- [x] pełna lokalna regresja wszystkich `33` zestawów testów przechodzi.

Podetap **4E.1** jest zakończony. Następnym krokiem jest **4E.2 — budowa do
budowy**. Zmiana nie dodaje nowego elementu interfejsu, dlatego nie wymaga
osobnego testu operatora.

## Zamknięcie 4E.2–4E.4 i całego 4E — 2026-08-26

- [x] **4E.2:** przejazd `budowa A → budowa B` ma własny, kierunkowy czas
  i rozpoczyna się dopiero po pełnym zakończeniu zajętości pompy na A;
- [x] **4E.3:** silnik otrzymuje gotowe minuty oraz informacyjne źródło
  wartości i działa identycznie dla wpisu ręcznego, pamięci tras, mapy i
  przyszłego routingu ciężarowego, bez zależności od internetu;
- [x] **4E.4:** brak trasy daje jawny błąd z parą budów, `0 min` jest
  poprawną wartością, `A → B` i `B → A` mogą się różnić, a przejazd
  uniemożliwiający przygotowanie na czas wylicza najwcześniejszy start,
  wielkość opóźnienia i przyczynę `przejazd-miedzy-budowami`;
- [x] moduł `js/pompy/przejazdy_pomp.js` jest ładowany przez `index.html`
  po module pomp, więc ten sam mechanizm jest dostępny również w wersji
  przeglądarkowej, a nie tylko w testach Node.js;
- [x] 4E nie zmienia `StartPlanowany`, `StartZadany` ani `StartRoboczy` i
  nie przydziela jeszcze konkretnej pompy; wykorzystanie wyliczonej
  dostępności należy do 4F, a wspólna korekta pomp i gruszek do Etapu 5;
- [x] pełna regresja po implementacji 4E.4 zakończyła się powodzeniem —
  wszystkie **36/36** plików `testy/*.test.js` przeszły poprawnie.

Cały punkt **4E — przejazdy pomp** jest zakończony. Nie jest wymagany
osobny test operatora, ponieważ 4E.2–4E.4 nie dodają nowego pola ani nowej
operacji w interfejsie; dołączenie modułu do strony jest objęte testem
automatycznym. Następny podetap to **4F.1 — stabilna kolejność**.

## Zamknięcie 4F.0 — okno dostępności pomp — 2026-08-27

- [x] puste `Dostępna od` i `Dostępna do` oznaczają brak ograniczeń;
- [x] nowe pompy nie otrzymują już automatycznie początku dnia jako
  `dostepnaOd`, natomiast jawna godzina ze starszego zapisu jest zachowywana;
- [x] `Dostępna do` ogranicza wyłącznie rozpoczęcie nowego pełnego cyklu;
  rozpoczęta na czas budowa jest kończona, a przekroczenie zostaje zapisane
  w wyniku dostępności do późniejszego komunikatu operatora;
- [x] typ własna/zewnętrzna nie jest kryterium przydziału; starsza wartość
  może pozostać neutralną metadaną, a w bieżącym panelu pole typu znika;
- [x] wysięg pozostaje kluczowym parametrem zgodności pompy z budową;
- [x] model i panel działają jako osobne lokalne moduły bez CDN i internetu;
- [x] pełna regresja jest warunkiem utworzenia commita przez jednorazowy
  workflow; po dodaniu `etap_4f_0.test.js` zestaw obejmuje **37** plików
  `testy/*.test.js`.

Dla tego przygotowawczego kroku zapisano jawny wyjątek od osobnego testu
operatora: 4F.0 nie przydziela jeszcze pomp i nie zmienia godzin budów, a
obecność oraz podłączenie nowych pól są sprawdzane automatycznie. Pełny test
operatorski dostępności i przydziału pozostaje w 4J.3.

Zamknięty podetap: **4F.0**. Punkt nadrzędny **4F** pozostaje otwarty.
Następny nieukończony podetap: **4F.1 — stabilna kolejność**.

## Zamknięcie 4F.3 — brak nakładania pracy pompy — 2026-08-27

- [x] kolizja jest sprawdzana dla całego okresu od rozpoczęcia przygotowania
  do końca czynności po ostatnim rozładunku, a nie tylko dla pompowania;
- [x] każda pompa zachowuje pełną listę przydziałów, dzięki czemu nowy okres
  jest kontrolowany względem wszystkich wcześniejszych okresów tego zasobu;
- [x] kolidująca budowa nie otrzymuje zajętej pompy i zachowuje jawny powód
  `pompa-zajeta` wraz z budową oraz okresem powodującym konflikt;
- [x] dokładna granica `koniec poprzedniego okresu == początek następnego`
  nie jest kolizją; przy przejeździe `0 min` ta sama pompa może zostać użyta;
- [x] wejściowe budowy, kursy i lista pomp nie są modyfikowane;
- [x] 4F.3 nie przesuwa godzin budów ani kursów gruszek — najwcześniejszy
  alternatywny start pozostaje zakresem 4F.4;
- [x] test `testy/etap_4f_3.test.js` oraz pełna regresja wszystkich **40/40**
  plików `testy/*.test.js` przechodzą poprawnie;
- [x] wszystkie śledzone pliki JavaScript przechodzą kontrolę składni.

Osobny test operatora nie jest wymagany, ponieważ wynik przydziału 4F nie jest
jeszcze podłączony do centralnego wyniku ani interfejsu. Pełny test operatorski
pozostaje częścią 4J.3.

Zamknięty podetap: **4F.3**. Punkt nadrzędny **4F** pozostaje otwarty.
Następny nieukończony podetap: **4F.4 — najwcześniejszy start**.


## Zamknięcie 4F.4 — najwcześniejszy możliwy start — 2026-08-27

- [x] gdy żadna pompa nie pasuje do planowanej godziny, wynik zachowuje plan i
  osobno podaje najwcześniejszą możliwą minutę rozpoczęcia betonowania;
- [x] przesunięcie jest liczone od pełnego cyklu pompy, więc obejmuje wymagane
  przygotowanie przed pierwszym rozładunkiem;
- [x] ograniczenia uwzględniają `Dostępna od`, wcześniejszy przydział pompy i
  znany kierunkowy czas przejazdu między budowami;
- [x] wynik zachowuje główną przyczynę ograniczenia i pełną listę przyczyn do
  późniejszego utworzenia automatycznej notki dla operatora;
- [x] przy kilku możliwych pompach wybierany jest najwcześniejszy start, a przy
  remisie zachowywana jest stabilna kolejność pomp;
- [x] brak trasy, pompa nieaktywna, zbyt mały wysięg albo brak możliwości startu
  w oknie dostępności nie powodują wymyślenia zastępczego czasu;
- [x] budowy, kursy i lista pomp nie są modyfikowane, a harmonogram gruszek nie
  jest cicho przesuwany;
- [x] test `testy/etap_4f_4.test.js` oraz pełna regresja wszystkich **41/41**
  plików `testy/*.test.js` przechodzą poprawnie;
- [x] wszystkie śledzone pliki JavaScript przechodzą kontrolę składni.

Osobny test operatora nie jest wymagany, ponieważ wynik przydziału 4F nie jest
jeszcze podłączony do centralnego wyniku ani interfejsu. Pełny test operatorski
pozostaje częścią 4J.3.

Zamknięty podetap: **4F.4**. Punkt nadrzędny **4F** pozostaje otwarty.
Następny nieukończony podetap: **4F.5 — testy integracyjne**.


## Zamknięcie 4F.5 — testy integracyjne niezależnego przydziału pomp — 2026-08-27

- [x] jeden scenariusz łączy wiele budów oraz pełne reguły 4F.1–4F.4;
- [x] równe planowane starty zachowują kolejność wejściową;
- [x] pompa wyłączona jest pomijana, a zbyt mały wysięg daje jawne odrzucenie;
- [x] pompa 42 m zachowuje wydłużony pełny cykl wynikający z większego wysięgu;
- [x] brak możliwości wykonania budowy zgodnie z planem daje najwcześniejszy
  możliwy start z uwzględnieniem zakończenia poprzedniej pracy i przejazdu;
- [x] późniejsza budowa może ponownie użyć tej samej pompy po poprawnym
  przejeździe między budowami;
- [x] dwa kolejne przeliczenia tych samych danych dają identyczny wynik;
- [x] budowy, kursy i lista pomp pozostają niemodyfikowane;
- [x] test `testy/etap_4f_5.test.js` oraz pełna regresja wszystkich **42/42**
  plików `testy/*.test.js` przechodzą poprawnie.

Pierwsze uruchomienie testu ujawniło błędne oczekiwanie testowe dla pompy 42 m:
pełny cykl tej pompy jest dłuższy niż dla 32 m, dlatego poprawny najwcześniejszy
start wynosi `585` minut (09:45), czyli `+45 min`. Silnik zachował się zgodnie z
wcześniej ustalonymi regułami; kod produkcyjny nie wymagał poprawki.

Osobny test operatora nie jest wymagany, ponieważ niezależny przydział pomp nie
jest jeszcze podłączony do centralnego wyniku ani docelowego widoku. Test
operatorski pozostaje częścią 4J.3.

Zamknięty podetap: **4F.5**. Cały punkt **4F — niezależny przydział pomp** jest
zakończony. Następny nieukończony podetap: **4G.1 — wynik silnika**.


## Zamknięcie 4G.1 — minimalna techniczna liczba pomp — 2026-08-28

- [x] silnik tworzy pompy minimalnego układu niezależnie od rzeczywistej listy zasobów;
- [x] bierze pod uwagę pełne okresy zajętości tylko budów wymagających pompy;
- [x] ponownie używa pompy minimalnego układu, gdy poprzedni cykl już się zakończył;
- [x] wynik zawiera `minimalnaLiczbaPomp` i techniczne przydziały bez mutowania wejścia;
- [x] moduł jest ładowany lokalnie przez `index.html`, bez zależności internetowych;
- [x] test `testy/etap_4g_1.test.js` i pełna regresja **43/43** przechodzą poprawnie;
- [x] wszystkie śledzone pliki JavaScript przechodzą kontrolę składni.

Osobny test operatora nie jest wymagany w 4G.1, ponieważ ten podetap tworzy wynik silnika.
Wyświetlenie licznika należy do 4G.2, a pełny test operatorski pozostaje częścią 4J.3.

Zamknięty podetap: **4G.1**. Punkt nadrzędny **4G** pozostaje otwarty.
Następny nieukończony podetap: **4G.2 — widok operatora**.


## Zamknięcie 4G.2 — widok minimalnej liczby pomp — 2026-08-28

- [x] istniejący licznik `minimalna-liczba-pomp` pokazuje wynik silnika 4G.1 po przeliczeniu;
- [x] przed przeliczeniem i po zmianie danych licznik pozostaje nieaktualny jako `—`;
- [x] plan bez budów wymagających pompy pokazuje `0` oraz komunikat `Plan nie wymaga pompy.`;
- [x] tryb z określoną liczbą pomp zachowuje osobny opis rzeczywistej dostępności floty;
- [x] logika prezentacji jest osobnym modułem i nie zmienia jeszcze centralnego wyniku `przeliczCalyHarmonogram()`;
- [x] test `testy/etap_4g_2.test.js` i pełna regresja **44/44** przechodzą poprawnie;
- [x] wszystkie śledzone pliki JavaScript przechodzą kontrolę składni.

Zamknięty podetap: **4G.2**. Punkt nadrzędny **4G** pozostaje otwarty.
Następny nieukończony podetap: **4G.3 — testy minimalnej liczby pomp**.

## Zamknięcie 4H.1 — dwa tryby pracy pomp — 2026-08-29

- [x] panel pomp udostępnia tryb **Oblicz, ile potrzeba** oraz **Mam określoną liczbę**;
- [x] pole liczby pomp jest aktywne i wymagane wyłącznie w trybie ograniczonym;
- [x] tryb ograniczony przyjmuje wyłącznie całkowitą liczbę pomp od `0` wzwyż;
- [x] tryb obliczania potrzebnej liczby zapisuje brak limitu jako `null`;
- [x] zmiana trybu lub liczby unieważnia poprzedni wynik i przebudowuje listę zasobów wejściowych;
- [x] `testy/etap_4h_1.test.js` formalnie chroni oba tryby, walidację `0`, liczb dodatnich, ujemnych i ułamkowych oraz dopasowanie listy pomp;
- [x] pełna regresja wszystkich testów przechodzi przed publikacją podetapu.

Zamknięty podetap: **4H.1**. Punkt nadrzędny **4H** pozostaje otwarty.
Następny niezakończony podetap: **4H.2 — ograniczony przydział pomp**.

## Zamknięcie 4H.2 — ograniczony przydział pomp — 2026-08-29

- [x] ograniczony przydział korzysta wyłącznie z rzeczywistych, aktywnych pomp z listy;
- [x] liczba zasobów użytych przez silnik nie przekracza ani wartości operatora, ani liczby aktywnych pomp;
- [x] silnik nie tworzy dodatkowych pomp w celu ukrycia niedoboru;
- [x] zajęta pompa może otrzymać kolejną budowę z wyliczonym przesunięciem, a przesunięty pełny cykl jest rezerwowany przed rozpatrzeniem następnej budowy;
- [x] kolejne przesunięcia mogą narastać kaskadowo i pozostają częścią niezależnego wyniku pomp;
- [x] `0` pomp pozostawia budowy bez przydziału i nie tworzy fikcyjnego zasobu;
- [x] ograniczony wynik zachowuje planowany okres, rzeczywisty okres pompowy, wielkość przesunięcia i jego przyczynę;
- [x] 4H.2 nie zmienia jeszcze `StartRoboczy` ani kursów gruszek; połączenie obu zasobów pozostaje zakresem Etapu 5;
- [x] `testy/etap_4h_2.test.js` sprawdza niedobór, kaskadowe przesunięcia, `0`, limit operatora, aktywną listę, walidację, stabilność i brak mutacji danych wejściowych.

Zamknięty podetap: **4H.2**. Punkt nadrzędny **4H** pozostaje otwarty.
Następny niezakończony podetap: **4H.3 — jawne konsekwencje**.
