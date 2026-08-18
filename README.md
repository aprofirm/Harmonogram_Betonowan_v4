# Harmonogram_Betonowan_v4

„Webowy harmonogram dostaw betonu – planowanie gruszek, pomp i wizualizacja pracy betoniarni.”

Najpierw przejrzyj aktualny stan repozytorium, wszystkie pliki z zasadami i ustaleniami oraz aktualny etap prac. Następnie kontynuuj pracę zgodnie z dokumentacją projektu.

## Dokumentacja projektu

- [AGENTS.md](AGENTS.md) — obowiązkowy sposób rozpoczynania pracy i zapisywania pamięci projektu.
- [ZASADY_KODU.md](ZASADY_KODU.md) — jak piszemy i modyfikujemy kod.
- [PROJECT_DECISIONS.md](PROJECT_DECISIONS.md) — obowiązujące decyzje biznesowe i architektoniczne.
- [POMYSLY_I_BACKLOG.md](POMYSLY_I_BACKLOG.md) — pomysły, propozycje i tematy wymagające doprecyzowania.
- [ETAPY_ROZWOJU.md](ETAPY_ROZWOJU.md) — kolejność wdrażania funkcji, kryteria zakończenia i testy po każdym etapie.

## Trwała pamięć projektu

Repozytorium jest głównym źródłem pamięci projektu. Historia rozmów pomaga zachować ciągłość, ale zatwierdzone ustalenia, pomysły i aktualny stan prac muszą znajdować się w dokumentacji.

Na końcu każdej rozmowy projektowej należy sprawdzić, czy pojawiły się:

- nowe zatwierdzone decyzje — dopisać je do `PROJECT_DECISIONS.md`,
- nowe pomysły albo pytania — dopisać je do `POMYSLY_I_BACKLOG.md`,
- zmiany statusu etapu lub następnego kroku — zaktualizować `ETAPY_ROZWOJU.md`,
- nowe stałe zasady tworzenia kodu — zaktualizować `ZASADY_KODU.md`.

Nie dodajemy pustych wpisów, jeżeli rozmowa nie wniosła nic nowego. Luźnego pomysłu nie wolno przedstawiać jako zatwierdzonej decyzji. Dokładna procedura znajduje się w `AGENTS.md`.

Przed przejściem do kolejnego punktu należy ponownie sprawdzić listę podetapów
w `ETAPY_ROZWOJU.md`. Zakończenie pierwszego kroku, np. `3B.1`, nie zamyka
automatycznie całego punktu `3B`.

## Uruchomienie

1. Pobierz całe repozytorium na komputer.
2. Otwórz plik [index.html](index.html) dwukrotnym kliknięciem.
3. Wczytaj plik CSV, przeciągając go na pole importu albo wybierając z komputera.
4. W razie potrzeby dodaj budowę ręcznie, podając ilość betonu i wybierając **Rodzaj rozładunku**.
5. Uzupełnij czas dojazdu i powrotu przy dostawach planowanych. Odbiory własne nie wymagają tych czasów.
6. W razie potrzeby ustaw przy budowie dodatkowy **Odstęp dostaw**.
7. Ustaw parametry i wybierz przycisk **Przelicz harmonogram**.

Podstawowy interfejs działa lokalnie, bez instalacji, logowania, serwera i połączenia z internetem.

## Import CSV — etap 2

Importer wymaga informacji odpowiadających kolumnom:

- `Firma`,
- `Budowa`,
- `StartPlanowany`.

`ID_Budowy` jest opcjonalne. Jeżeli znajduje się w pliku, program zachowuje je dokładnie, również z zerami na początku. Gdy kolumny ID nie ma albo pojedynczy wiersz ma puste ID, program nadaje bezpieczne identyfikatory `CSV-001`, `CSV-002` itd. i pokazuje ostrzeżenie zamiast odrzucać plik.

Rozpoznawane są również typowe warianty nazw, np. `ID obiektu`, `Klient`, `Nazwa budowy` i `Godzina`. Przykładowy plik znajduje się w [przyklady/przykladowe_budowy.csv](przyklady/przykladowe_budowy.csv).

### Zmienne kolumny eksportu KDX

Eksport KDX nie ma jednego stałego układu kolumn. Użytkownik może zmieniać zarówno zestaw, jak i kolejność kolumn. Importer **nie może więc opierać się na numerach kolumn** — wyszukuje potrzebne dane po nazwach nagłówków.

Aktualnie rozpoznawane są m.in. rzeczywiste nagłówki KDX:

- `K.-Nazwa` lub `Nazwa` → Firma,
- `Budowa` lub `Tytuł` → Budowa,
- `Czas rozładunku` → StartPlanowany,
- `Zam-o (mój zakład)` → ilość betonu,
- `Nazwa materiału` → rodzaj betonu,
- `Rodzaj rozładunku` → sposób rozładunku.

Dodatkowe, puste kolumny oraz zmiana kolejności kolumn nie powinny wpływać na import. Techniczny wiersz KDX bez danych budowy, np. `Normal`, jest pomijany. Nowe warianty nazw nagłówków należy dopisywać jako aliasy w module importu zamiast tworzyć osobne importery dla każdego układu.

Program obsługuje wybór pliku i przeciąganie CSV. Kolejny poprawny import zastępuje dane z poprzedniego pliku, natomiast budowy dodane ręcznie pozostają osobną listą.

## Rodzaj rozładunku i odbiory własne

Jeżeli rzeczywisty eksport KDX zawiera kolumnę **Rodzaj rozładunku**, program rozpoznaje wartości **Lej**, **Pompa**, **Wywrotka** i **Taczka**. Pusta wartość w istniejącej kolumnie oznacza **Odbiór własny**. Jeżeli starszy plik w ogóle nie ma tej kolumny, aplikacja nie zgaduje rodzaju i zachowuje wcześniejsze działanie.

Odbiór własny jest zamówieniem dnia, ale nie jest automatycznie układany jako dostawa gruszką. Nie wymaga czasu dojazdu ani powrotu, nie tworzy kursów i nie jest zapisywany do książki tras. Operator wydaje taki beton w wolnym oknie załadunkowym.

Dla czytelności odbiory własne są oddzielone od głównej tabeli dostaw planowanych i trafiają do osobnej, domyślnie zwiniętej sekcji **Odbiory własne** poniżej harmonogramu. Przy budowie dodawanej ręcznie wybór rodzaju rozładunku jest wymagany.

Wartość **Pompa** jest na razie informacją o sposobie rozładunku. Pełna logika przydziału i dostępności pomp pozostaje zakresem Etapu 4.

## Ilość betonu i wariant roboczy

Formularz budowy ręcznej wymaga dodatniej ilości betonu. Po dodaniu budowy
ilość jest widoczna w kolumnie **Beton** i generuje kursy na tych samych zasadach
co ilość wczytana z CSV.

Ilość każdej budowy można tymczasowo zmienić bezpośrednio w tabeli, aby
porównać inny wariant planu. Po zmianie wybierz ponownie **Przelicz
harmonogram**. Przycisk `↺` obok pola przywraca ilość bazową z CSV albo z
formularza ręcznego. Wariant roboczy i wartość bazowa są zachowywane po
odświeżeniu strony.

## Szeroki, kompaktowy widok

Na komputerze aplikacja jest przygotowana do pracy przy zwykłym zoomie
przeglądarki `100%`. Wykorzystuje niemal całą szerokość okna z małymi marginesami,
utrzymuje zwarty panel operatora po lewej i rozszerza obszar harmonogramu.
Nie ustawia i nie symuluje zoomu Chrome. Na węższych ekranach układ pozostaje
responsywny i przechodzi do jednej kolumny.

## Czas rozładunku dla budowy

Ustawienie **Czas rozładunku** jest wartością domyślną dla wszystkich budów,
dlatego przy standardowych ustawieniach w kolumnie **Rozładunek** od razu widać
`15 min`. Wpisanie innej liczby w wierszu, np. `20`, oznacza dokładnie `20 min`
dla każdego kursu tej budowy — program nie dodaje tej liczby do ustawienia.

Budowy bez wyjątku reagują na późniejszą zmianę wartości globalnej. Wartości
oznaczone jako **Ręcznie** pozostają bez zmian. Przycisk `↺` przy polu usuwa
wyjątek tylko dla wybranej budowy i przywraca bieżący czas z ustawień. Ręczne
czasy są zachowywane po odświeżeniu strony i w zapisach historycznych.

## Rytm i odstęp pomiędzy dostawami

Każda budowa ma osobny **Odstęp dostaw**. Jego bezpieczna wartość domyślna
wynosi `0 min`, dzięki czemu dotychczasowe plany i starsze zapisy zachowują
wcześniejsze działanie. Wartość musi być liczbą nieujemną; błędne dane są
odrzucane z czytelnym komunikatem.

Rytm kolejnych dostaw jest liczony jako:

`dokładny czas rozładunku + dodatkowy odstęp dostaw`.

Pierwszy kurs rozpoczyna rozładunek o `StartRoboczy`. Kolejne rozładunki są
planowane zgodnie z rytmem danej budowy. Dodatkowy odstęp nie wydłuża fizycznego
cyklu pojedynczej gruszki — jej cykl nadal obejmuje tylko załadunek, dojazd,
rozładunek i powrót. Wydłużony załadunek przesuwa początek załadunku danego
kursu wstecz, ale nie zmienia planowanej godziny jego dostawy.

Po przeliczeniu kursy wszystkich budów są układane wspólnie według planowanego
rozpoczęcia załadunku, dzięki czemu mogą się przeplatać. Na tym etapie program
nie przydziela jeszcze numerów konkretnych gruszek i nie przesuwa dostaw z
powodu ograniczonej liczby pojazdów — to pozostaje zakresem 3C i dalszych
punktów.

Zmiana pola **Odstęp dostaw** oznacza dotychczasowy wynik jako nieaktualny.
Wartość jest zapisywana w bieżącym planie i zapisach historycznych oraz
odtwarzana po odświeżeniu strony.

## Diagnostyka i raport błędów

Aplikacja automatycznie zapisuje techniczne zdarzenia z maksymalnie 10 ostatnich uruchomień. Rejestrowane są m.in. uruchomienie programu, rozpoczęcie i wynik importu CSV, przeliczenie harmonogramu, ostrzeżenia oraz błędy z bezpiecznym wskazaniem miejsca w kodzie.

Sekcja **Diagnostyka programu** pozwala:

- podejrzeć ostatnie zdarzenia,
- pobrać raport `.json`, który można przesłać do analizy,
- wyczyścić zapisane logi.

Logi są przechowywane wyłącznie lokalnie w pamięci przeglądarki i nie są nigdzie wysyłane. Raport nie zawiera treści wierszy CSV ani nazw firm i budów. Jeżeli przeglądarka blokuje trwałą pamięć dla lokalnego `index.html`, aplikacja przechowuje logi do czasu zamknięcia strony i pokazuje tę informację w sekcji diagnostyki.

## Pamięć planu dnia

Aplikacja automatycznie zachowuje bieżący plan w pamięci danej przeglądarki.
Po odświeżeniu przywraca budowy, parametry i ręczne czasy, a wcześniej
przeliczony harmonogram oblicza ponownie.

Historia przechowuje maksymalnie 100 różnych przeliczeń z datą i godziną.
Identyczne kolejne przeliczenie nie tworzy duplikatu, a po osiągnięciu limitu
najstarszy wpis jest nadpisywany. Dodatkowy limit bezpieczeństwa historii wynosi
3 MB. Na dole lewego panelu znajduje się przycisk **Wczytaj zapis historyczny**.

Czerwony przycisk **Wyczyść plan dnia** usuwa wyłącznie bieżący plan po
potwierdzeniu. Nie usuwa zapisów historycznych ani diagnostyki. Dane pozostają
lokalne — aplikacja nie zapisuje w pamięci surowych wierszy CSV i nie wysyła
planu do internetu.

## Pamięć znanych tras

Wszystkie budowy z kompletnym czasem dojazdu i powrotu są zapisywane w osobnej,
lokalnej książce tras. Zapis następuje po ręcznej zmianie i zbiorczo podczas
przeliczenia. Po aktualizacji programu brakujące trasy są również bezpiecznie
przenoszone z odtworzonego starszego planu, bez nadpisywania nowszego wpisu.
Po ponownym imporcie dokładnie tej samej firmy i budowy program uzupełnia oba
czasy bez ponownego wpisywania. Przy polach pokazuje źródło: **Ręcznie**,
**Z pamięci** albo — po przyszłym podłączeniu map — **OpenMap**.

Przycisk **Pokaż zapisane trasy** otwiera lokalny podgląd książki tras bez
wychodzenia z aplikacji. Tabela pokazuje dokładny opis lokalizacji używany przy
dopasowaniu, czas dojazdu, czas powrotu, źródło wartości oraz datę aktualizacji
i ostatniego użycia. Pojedynczy wpis można usunąć po potwierdzeniu. Usunięcie
nie zmienia bieżącego planu; jeżeli ta sama budowa nadal ma komplet czasów,
kolejne przeliczenie może ponownie zapisać trasę do pamięci.

Pamięć tras ma osobny klucz, limit 1000 lokalizacji i około 1 MB. Kolejny zapis
tej samej lokalizacji aktualizuje wcześniejszy wpis. **Wyczyść plan dnia** nie
usuwa książki tras. Dane pozostają w konkretnym profilu przeglądarki; jeśli
trwały zapis jest zablokowany, aplikacja przechodzi na pamięć bieżącej sesji.

Obecny krok przygotowuje pamięć oraz zasadę „najpierw cache, potem mapa”. Nie
uruchamia jeszcze zewnętrznej usługi OpenStreetMap — jej wybór i podłączenie
pozostają zakresem Etapu 6.

## Logo aplikacji

Plik `logo.png` jest oficjalnym źródłem znaku aplikacji: pomarańczowo-granatowej betonomieszarki na tle zegara. Logo jest wyświetlane u góry strony, na środku nad nazwą programu, i działa również po lokalnym otwarciu `index.html`.

Ten sam znak jest używany jako favicon na karcie przeglądarki. Plik `favicon.png` jest kwadratowym wariantem przygotowanym z `logo.png` bez rozciągania grafiki. Oba pliki są przechowywane lokalnie i nie wymagają internetu.

## Testy etapów i funkcji przekrojowych

Instrukcje testów ręcznych znajdują się w plikach:

- [testy/TESTY_ETAP_1.md](testy/TESTY_ETAP_1.md),
- [testy/TESTY_ETAP_2.md](testy/TESTY_ETAP_2.md),
- [testy/TESTY_ETAP_3A.md](testy/TESTY_ETAP_3A.md),
- [testy/TESTY_ETAP_3B_1.md](testy/TESTY_ETAP_3B_1.md),
- [testy/TESTY_KP_1.md](testy/TESTY_KP_1.md) — plan testu pamięci dnia,
- [testy/TESTY_KP_2.md](testy/TESTY_KP_2.md) — plan testu pamięci tras,
- [testy/TESTY_KP_3.md](testy/TESTY_KP_3.md) — ilość ręczna, wariant i szeroki widok,
- [testy/TESTY_RODZAJ_ROZLADUNKU.md](testy/TESTY_RODZAJ_ROZLADUNKU.md) — rodzaje rozładunku i odbiory własne,
- [testy/TESTY_DIAGNOSTYKA.md](testy/TESTY_DIAGNOSTYKA.md).

Jeżeli na komputerze jest Node.js, można dodatkowo uruchomić test automatyczny:

    node testy/etap_1.test.js
    node testy/etap_2.test.js
    node testy/kdx_zmienne_kolumny.test.js
    node testy/diagnostyka.test.js
    node testy/etap_3a.test.js
    node testy/etap_3b_1.test.js
    node testy/etap_3b_2.test.js
    node testy/pamiec_planu.test.js
    node testy/pamiec_aplikacji.test.js
    node testy/pamiec_tras.test.js
    node testy/pamiec_tras_integracja.test.js
    node testy/pamiec_tras_podglad.test.js
    node testy/kp_3.test.js
    node testy/rodzaj_rozladunku.test.js
    node testy/odbior_wlasny_tabela.test.js

Node.js nie jest potrzebny do zwykłego uruchomienia aplikacji.

Repozytorium ma również workflow **Testy automatyczne** w GitHub Actions. Po
zmianach na `main` uruchamia on pełną regresję wszystkich plików
`testy/*.test.js` na Node.js 20, dzięki czemu wynik testów jest zapisany razem z
historią repozytorium.

## Aktualny stan

**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały
**3B** oraz **3C.1–3C.3**. Centralne `przeliczCalyHarmonogram()` generuje kursy,
liczy ich pełne czasy i następnie przypisuje konkretne gruszki tak, aby fizyczne
cykle jednego pojazdu się nie nakładały. Wynik przechowuje zarówno kursy z
`idGruszki`/`numerGruszki`, jak i wspólny stan użytych gruszek.

Przed integracją osobny test 3B → 3C.2 potwierdził zgodność modułów, w tym
przeplatanie kilku budów i ponowne użycie pojazdu dokładnie w minucie powrotu.
Pełna regresja jest wykonywana przy każdej zmianie na `main`.

**Następny podetap: 3C.4 — widok operatora.** Dodamy numer gruszki do tabeli
kursów bez zmiany działającego algorytmu przydziału. Następnie 3C.5 rozszerzy
przypadki brzegowe, a 3C.6 obejmie publikację i test operatorski. Punkt 3D
pozostaje odpowiedzialny za formalną minimalną liczbę gruszek, a 3E za tryb
„mam X gruszek”.
