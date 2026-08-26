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

## Ręczna korekta godziny budowy

W kolumnie **Start do przeliczenia** można poprawić godzinę wybranej budowy
bez ponownego wczytywania CSV. Pod polem program nadal pokazuje źródłową
godzinę lub pełne okno planowane, więc korekta robocza nie ukrywa danych z KDX.

Po zmianie wybierz ponownie **Przelicz harmonogram**. Przycisk `↺` przywraca
źródłowy `StartPlanowany` tylko dla danego wiersza. Edycja jest dostępna także
w osobnej tabeli odbiorów własnych, a zrealizowane pozycje pozostają
zablokowane.

Godzinę podajemy zawsze w pełnym formacie `HH:MM`, od `00:00` do `23:59`.
Pusta wartość, niepełny zapis, niepoprawne minuty albo godzina poza dobą dają
czytelny komunikat i nie zmieniają budowy. Taka błędna próba nie usuwa również
wcześniej poprawnie przeliczonego wyniku.

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
rozpoczęcia załadunku, dzięki czemu mogą się przeplatać. Następnie silnik 3C
przydziela do nich techniczne numery pierwszych wolnych gruszek i pilnuje, aby
pełne cykle jednego zasobu się nie nakładały. W trybie ograniczonej floty 3E
ten sam porządek służy do przeliczenia kursów dla liczby pojazdów podanej przez
operatora.

Zmiana pola **Odstęp dostaw** oznacza dotychczasowy wynik jako nieaktualny.
Wartość jest zapisywana w bieżącym planie i zapisach historycznych oraz
odtwarzana po odświeżeniu strony.

## Minimalna liczba gruszek

Po każdym przeliczeniu aplikacja pokazuje w podsumowaniu osobny licznik
**potrzebnych gruszek**. Jest to najmniejsza liczba technicznych zasobów, która
może wykonać ustalone kursy bez nakładania pełnych cykli od rozpoczęcia
załadunku do powrotu do betoniarni.

Wynik jest liczony od nowa po każdej zmianie wpływającej na harmonogram. Dla
pustego planu wynosi `0`. Pozostaje widoczny również w trybie ograniczonej floty
jako punkt odniesienia do liczby pojazdów podanej przez operatora.

## Tryb „mam X gruszek”

W ustawieniach **Tryb gruszek** dostępne są dwa warianty:

- **Oblicz, ile potrzeba** — zachowuje ustalone godziny i pokazuje minimalną
  flotę potrzebną bez nakładania cykli;
- **Mam określoną liczbę** — przyjmuje całkowitą liczbę dostępnych gruszek od
  `0` wzwyż i ponownie przydziela do niej wszystkie kursy.

Jeżeli w ograniczonym trybie żadna gruszka nie jest wolna o planowanej godzinie,
kurs otrzymuje pojazd wracający najwcześniej. Cały cykl — załadunek, dojazd,
rozładunek i powrót — zostaje przesunięty o tę samą liczbę minut. Kolumna
**Skutek floty** pokazuje opóźnienie oraz pierwotną godzinę rozładunku, a
podsumowanie zestawia liczbę potrzebną z dostępną.

Dla `0` dostępnych gruszek program nie tworzy fikcyjnego planu: pozostawia kursy
nieprzydzielone i pokazuje konflikt. Tryb oraz wpisana liczba są zachowywane w
pamięci bieżącego planu i w zapisach historycznych.

## Sterowanie zasobami pomp

W nagłówku harmonogramu panel **Sterowanie zasobami** pokazuje gruszki, a
bezpośrednio pod nimi pompy. Dla pomp można wybrać tryb pracy i podać liczbę
zasobów rzeczywiście pozostających do dyspozycji. Program tworzy wtedy
czytelną listę, na której każda pompa ma osobno:

- typ **Własna** albo **Zewnętrzna**,
- znacznik aktywności w bieżącym planie,
- godzinę **Dostępna od**,
- wysięg w metrach, domyślnie `32 m`.

Przy budowie z rodzajem rozładunku **Pompa** program przyjmuje standardowy
wymagany wysięg `32 m` i pokazuje go w kompaktowym opisie. Pole do wpisania
innej wartości pozostaje ukryte, dopóki operator nie zaznaczy **Większa pompa**;
wtedy można podać wymaganie większe niż `32 m`. Odznaczenie przełącznika
przywraca standard `32 m`. Lista pomp i wymagania budów są zapisywane razem z
planem oraz historią i wracają po odświeżeniu. Starsze puste wymagania są
automatycznie uzupełniane standardem `32 m`.

Dla standardowego wysięgu program przyjmuje `20 min` na rozstawienie przed
pierwszym rozładunkiem oraz `30 min` po ostatnim rozładunku na składanie, mycie
i przygotowanie do wyjazdu. Każde rozpoczęte dodatkowe `10 m` wysięgu dodaje po
`5 min` do obu czasów. Kompaktowy opis pokazuje aktualne wartości, a przełącznik
**Inne czasy** odsłania dwa pola pozwalające zapisać wyjątek dla konkretnej
budowy. Wyłączenie wyjątku przywraca automatyczne wartości zależne od wysięgu.

Właściwe pompowanie jest liczone od początku pierwszego rozładunku do końca
ostatniego rozładunku. Pełny okres zajętości zaczyna się wcześniej o czas
przygotowania pompy i kończy później o czas czynności po pracy. Przydział
konkretnej pompy oraz przejazdy powstaną w kolejnych podetapach Etapu 4.

Niezależny wynik pomp ma już stały kontrakt. Dla każdej pompowanej budowy
przechowuje osobne miejsca na przydział, okres zajętości, najwcześniejszy start,
opóźnienie i skutek niedoboru. Okres zajętości jest już obliczany dla budowy z
planem dostaw, natomiast pola oczekujące na przydział nadal mają wartość `null`.
Dzięki temu program odróżnia brak wyniku od prawdziwego wyniku `0`. Utworzenie
wyniku nie zmienia godzin budów ani kursów gruszek.

Licznik **potrzebnych pomp** pokazuje na tym etapie `—`. Nie jest to błąd ani
wynik `0`: rzeczywista minimalna liczba będzie obliczana dopiero po dodaniu
pełnych czasów obsługi, zajętości i przydziału pomp w kolejnych podetapach.

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
- [testy/TESTY_ETAP_3C.md](testy/TESTY_ETAP_3C.md) — przydział konkretnych gruszek,
- [testy/TESTY_ETAP_3D.md](testy/TESTY_ETAP_3D.md) — minimalna liczba gruszek,
- [testy/TESTY_ETAP_3E.md](testy/TESTY_ETAP_3E.md) — tryb „mam X gruszek”,
- [testy/TESTY_KP_4.md](testy/TESTY_KP_4.md) — ręczna korekta godziny budowy,
- [testy/TESTY_ETAP_4.md](testy/TESTY_ETAP_4.md) — plan testów pomp,
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
    node testy/etap_3c.test.js
    node testy/etap_3c_integracja.test.js
    node testy/etap_3c_3.test.js
    node testy/etap_3c_4.test.js
    node testy/etap_3c_5.test.js
    node testy/etap_3d.test.js
    node testy/etap_3e.test.js
    node testy/etap_4a_1.test.js
    node testy/etap_4a_2.test.js
    node testy/etap_4a_3.test.js
    node testy/etap_4b_2.test.js
    node testy/etap_4b_3.test.js
    node testy/pamiec_planu.test.js
    node testy/pamiec_aplikacji.test.js
    node testy/pamiec_tras.test.js
    node testy/pamiec_tras_integracja.test.js
    node testy/pamiec_tras_podglad.test.js
    node testy/kp_3.test.js
    node testy/kp_4.test.js
    node testy/rodzaj_rozladunku.test.js
    node testy/odbior_wlasny_tabela.test.js
    node testy/panel_pomp.test.js

Node.js nie jest potrzebny do zwykłego uruchomienia aplikacji.

Repozytorium ma również workflow **Testy automatyczne** w GitHub Actions. Po
zmianach na `main` uruchamia on pełną regresję wszystkich plików
`testy/*.test.js` na Node.js 20, dzięki czemu wynik testów jest zapisany razem z
historią repozytorium.

## Aktualny stan

**Etap 3 — podstawowy silnik gruszek** jest zakończony. Zakończone i sprawdzone
są **3A**, cały **3B**, cały **3C**, cały **3D** oraz cały **3E**. Centralne
`przeliczCalyHarmonogram()` generuje kursy, liczy ich pełne czasy, przypisuje
pierwsze wolne gruszki i zwraca osobną `minimalnaLiczbaGruszek`. Tabela kursów
pokazuje `Gruszka 1`, `Gruszka 2` itd., a podsumowanie wyświetla wprost liczbę
pojazdów potrzebnych do realizacji bez nakładania cykli.

Tryb 3E pozwala podać rzeczywistą liczbę gruszek. Przy zbyt małej flocie
przelicza wszystkie czasy kursów, nie nakłada cykli jednej gruszki i jawnie
pokazuje opóźnienia. Test automatyczny obejmuje flotę wystarczającą, zbyt małą,
`0`, błędne dane, pamięć oraz stabilność wyniku. Tryb pracy i liczba gruszek są
umieszczone bezpośrednio w nagłówku wyniku, obok podsumowania harmonogramu.

Test operatora **3E.6.2** został zaliczony na rzeczywistym planie: plan bazowy
wymagał `5` gruszek, a przy `4` dostępnych program nie utworzył piątego pojazdu
i jawnie pokazał przesunięcia `+30 min` oraz `+5 min`. Mechanizm KP-4
przechowuje osobno źródłowy `StartPlanowany`, bieżący `StartZadany` i wynikowy
`StartRoboczy`, a godzinę można już zmienić i przywrócić bezpośrednio w tabeli.
Korekta przyjmuje wyłącznie poprawny format `HH:MM`, a błędna próba nie zmienia
modelu ani wcześniejszego wyniku. Zmieniona godzina jest zapisywana w bieżącym
planie i po przeliczeniu również w historii, zostaje odtworzona po odświeżeniu,
a starsze plany bez `StartZadany` są bezpiecznie uzupełniane godziną planowaną.
Test operatora KP-4.5 został zaliczony i cały KP-4 jest zakończony.

Etap 4 ma ukończone całe punkty **4A — reguły, czasy i niezależny kontrakt
wyniku pomp**, **4B — model danych i lista pomp** oraz **4C — interfejs i
pamięć listy pomp**:
model pompy, wspólny panel zasobów, lista z dostępnością i wysięgiem oraz
pamięć planu. Lista ma osobne, niemutujące operacje dodawania, edycji, zmiany
aktywności i usuwania, waliduje ID, typy i puste pola, a do przyszłego
przydziału przekazuje wyłącznie aktywne pompy. Pole liczby pomp korzysta z tego
samego kontraktu.
Standardowy wysięg wynosi `32 m`; przy budowie dodatkowe pole jest
ukryte i pojawia się dopiero po zaznaczeniu **Większa pompa**. Zmiana czasów
jest na `main` i została potwierdzona przez operatora na opublikowanej stronie.
Zakres **4C.3** potwierdził automatycznie i w teście operatora zachowanie listy
pomp po odświeżeniu, kolejnym imporcie, wyczyszczeniu planu i przywróceniu
historii. Cały punkt 4C jest zakończony.

Cały punkt **4D** jest zakończony. Planowane okno betonowania i pełny okres
zajętości obejmują jedną albo wiele dostaw, uwzględniają wysięg oraz ręczne
wyjątki czasów i nie zależą od kolejności kursów. Pozycja z `0 m³`, bez ilości,
zrealizowana albo niewymagająca pompy nie zajmuje zasobu. Brakujące lub
sprzeczne godziny kursu kończą się czytelnym błędem bez zmiany danych
wejściowych.

Podetap **4E.1** przyjmuje informacyjnie, że baza pompy znajduje się w
betoniarni. Wyjazd do pierwszej budowy wykorzystuje ten sam zapisany czas
dojazdu co gruszka — bez osobnego pola dla pompy. Pierwszy dojazd nie jest
liczony jako zajętość i nie wpływa na przydział ani liczbę pomp; pompa ma po
prostu wyjechać odpowiednio wcześniej. Dopiero przejazd po budowie A do budowy B
będzie wpływał na możliwość dołożenia kolejnego betonowania. Następny krok to
**4E.2 — przejazd pompy pomiędzy budowami**.
Pełne połączenie ograniczeń pomp i gruszek pozostaje świadomie zakresem Etapu 5.
