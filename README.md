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
7. Dla co najmniej dwóch budów z rozładunkiem **Pompa** sprawdź panel **Przejazdy między budowami** i uzupełnij brakujące czasy.
8. Ustaw parametry i wybierz przycisk **Przelicz harmonogram**.

Podstawowy interfejs działa lokalnie, bez instalacji, logowania, serwera i połączenia z internetem.

## Import CSV — etap 2

Importer wymaga informacji odpowiadających kolumnom:

- `Firma`,
- `Budowa`,
- `StartPlanowany`.

`ID_Budowy` jest opcjonalne. Jeżeli znajduje się w pliku, program zachowuje je dokładnie, również z zerami na początku. Gdy kolumny ID nie ma albo pojedynczy wiersz ma puste ID, program nadaje bezpieczne identyfikatory `CSV-001`, `CSV-002` itd. i pokazuje ostrzeżenie zamiast odrzucać plik.

Opcjonalne kolumny `CzasDojazdu` i `CzasPowrotu` podają czasy w minutach i są wczytywane bezpośrednio do roboczych czasów budowy. Jeśli tych kolumn nie ma, importer zachowuje dotychczasowe działanie.

Opcjonalna kolumna `PrzejazdyPompy` może dostarczyć początkowe czasy przejazdów. Wartość ma format `ID=MINUTY|ID=MINUTY`, np. `B-002=30|B-003=20`. Nie jest jednak wymagana do normalnej obsługi: po wczytaniu planu operator widzi osobny panel **Przejazdy między budowami**, w którym każda potrzebna relacja ma jawne pole czasu. Wartość z CSV można ręcznie nadpisać i później przywrócić przyciskiem `↺`. Jeżeli silnik dostanie w przyszłości jawny provider przejazdów, np. routing na podstawie adresów, ma on pierwszeństwo przed danymi zapisanymi przy budowie.

> GitHub Pages: skrypty zmieniane dla przejazdów pomp mają parametr wersji w `index.html`, aby po publikacji przeglądarka nie uruchamiała starszej kopii JavaScript z cache. Nie zmienia to działania wersji offline `file://`.

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

## Przejazdy pomp między budowami

Czas przejazdu pompy jest relacją kierunkową pomiędzy dwiema budowami, dlatego
nie jest ukrywany w pojedynczym wierszu budowy. Pod główną listą znajduje się
osobny panel **Przejazdy między budowami**. Dla budów wymagających pompy panel
pokazuje wszystkie możliwe przejazdy do późniejszych pozycji w kolejności
planowanego startu.

Każdy wiersz pokazuje budowę źródłową, budowę docelową, czas w minutach i źródło
wartości. Puste pole oznacza brak znanej trasy i może spowodować brak przydziału
pompy. Wpisanie liczby zapisuje ręczną korektę, oznacza poprzedni wynik jako
nieaktualny i wykorzystuje nową wartość przy następnym przeliczeniu. Jeżeli
wartość pochodziła z CSV, przycisk `↺` przywraca jej wartość bazową.

Ręczne czasy oraz wartości bazowe są częścią bieżącego planu i historii, więc
pozostają dostępne po odświeżeniu. Docelowy moduł mapowy będzie mógł uzupełniać
te same relacje bez zmiany kontraktu silnika; operator nadal będzie widział
czas i jego źródło.

## Rodzaj rozładunku i odbiory własne

Jeżeli rzeczywisty eksport KDX zawiera kolumnę **Rodzaj rozładunku**, program rozpoznaje wartości **Lej**, **Pompa**, **Wywrotka** i **Taczka**. Pusta wartość w istniejącej kolumnie oznacza **Odbiór własny**. Jeżeli starszy plik w ogóle nie ma tej kolumny, aplikacja nie zgaduje rodzaju i zachowuje wcześniejsze działanie.

Odbiór własny jest zamówieniem dnia, ale nie jest automatycznie układany jako dostawa gruszką. Nie wymaga czasu dojazdu ani powrotu, nie tworzy kursów i nie jest zapisywany do książki tras. Operator wydaje taki beton w wolnym oknie załadunkowym.

Dla czytelności odbiory własne są oddzielone od głównej tabeli dostaw planowanych i trafiają do osobnej, domyślnie zwiniętej sekcji **Odbiory własne** poniżej harmonogramu. Przy budowie dodawanej ręcznie wybór rodzaju rozładunku jest wymagany.

Wartość **Pompa** kwalifikuje budowę do niezależnego silnika pomp. Pełny przydział zasobów jest rozwijany w Etapie 4.

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

W kolumnie **Start budowy** program rozdziela trzy różne znaczenia godziny:
**Plan** pokazuje źródłową godzinę lub pełne okno z KDX, **Zadany** jest
edytowalną godziną używaną do bieżącego przeliczenia, a **Roboczy** pokazuje
rzeczywisty start wyliczony przez pełny silnik. Przed przeliczeniem wynik
roboczy ma wartość `—`.

Jeżeli `StartRoboczy` jest późniejszy od `StartZadany`, pod godzinami pojawia się
wielkość przesunięcia i krótka przyczyna, np. `+20 min · pompa zajęta`.

Po zmianie wybierz ponownie **Przelicz harmonogram**. Przycisk `↺` przywraca
źródłowy `StartPlanowany` tylko dla danego wiersza. Edycja jest dostępna także
w osobnej tabeli odbiorów własnych, a zrealizowane pozycje pozostają
zablokowane.

Godzinę podajemy zawsze w pełnym formacie `HH:MM`, od `00:00` do `23:59`.
Pusta wartość, niepełny zapis, niepoprawne minuty albo godzina poza dobą dają
czytelny komunikat i nie zmieniają budowy. Taka błędna próba nie usuwa również
wcześniej poprawnie przeliczonego wyniku.

## Konflikty i przestoje w wyniku

Po pełnym przeliczeniu, jeżeli wynik zawiera problemy wymagające uwagi, pod nagłówkiem harmonogramu pojawia się zwarty panel **Konflikty wymagające uwagi**. Każdy wpis używa prostego `komunikatOperatora`, więc nie trzeba odczytywać kodów diagnostycznych.

Wpis pokazuje również kontekst problemu: nazwę budowy, właściwe kursy albo zasób. Konflikt przestoju wskazuje konkretną parę kolejnych dostaw. Kolor jest tylko dodatkowym sygnałem; rodzaj i sens problemu są zawsze zapisane tekstem. Gdy konfliktów nie ma, panel pozostaje ukryty. Zmiana danych planu czyści poprzedni panel razem z nieaktualnym wynikiem.

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

- znacznik aktywności w bieżącym planie,
- opcjonalną godzinę **Dostępna od**,
- opcjonalną godzinę **Dostępna do**,
- wysięg w metrach, domyślnie `32 m`.

Puste oba pola godzin oznaczają dostępność bez ograniczeń. Pompa, która
rozpocznie pełny cykl obsługi budowy przed albo dokładnie o **Dostępna do**,
kończy tę budowę nawet wtedy, gdy składanie i mycie wyjdą poza tę godzinę;
wynik zachowuje wielkość przekroczenia do późniejszego komunikatu. Nowej
budowy rozpoczynającej się po tej granicy pompa już nie dostaje. Program nie
rozdziela przydziału na pompy własne i zewnętrzne — najważniejsze są wysięg,
aktywność, dostępność, zajętość i przejazd.

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

Licznik **potrzebnych pomp** pokazuje po przeliczeniu najmniejszą techniczną
liczbę pomp potrzebnych do obsługi planu bez nakładania pełnych okresów pracy.
Dla planu bez budów pompowanych pokazuje `0` i komunikat **Plan nie wymaga
pompy.** Wyniki `0`, `1` i wielu pomp oraz zgodność z technicznymi przydziałami
są objęte testami 4G.1–4G.3. Ograniczenie przydziału do rzeczywistej liczby
pomp operatora pozostaje zakresem 4H.

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
- [testy/TESTY_ETAP_4F_1.md](testy/TESTY_ETAP_4F_1.md) — stabilna kolejność przed przydziałem pomp,
- [testy/TESTY_ETAP_4F_2.md](testy/TESTY_ETAP_4F_2.md) — wybór pierwszej pasującej pompy,
- [testy/TESTY_ETAP_4F_3.md](testy/TESTY_ETAP_4F_3.md) — brak nakładania pełnych okresów pracy pompy,
- [testy/TESTY_ETAP_4F_4.md](testy/TESTY_ETAP_4F_4.md) — najwcześniejszy możliwy start bez cichego przesuwania planu,
- [testy/TESTY_ETAP_4F_5.md](testy/TESTY_ETAP_4F_5.md) — integracja wszystkich reguł niezależnego przydziału pomp,
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
    node testy/panel_pomp.test.js
    node testy/etap_4d_1.test.js
    node testy/etap_4d_2.test.js
    node testy/etap_4d_3.test.js
    node testy/etap_4e_1.test.js
    node testy/etap_4e_2.test.js
    node testy/etap_4e_3.test.js
    node testy/etap_4e_4.test.js
    node testy/etap_4f_0.test.js
    node testy/etap_4f_1.test.js
    node testy/etap_4f_2.test.js
    node testy/etap_4f_3.test.js
    node testy/etap_4f_4.test.js
    node testy/etap_4f_5.test.js
    node testy/etap_4g_1.test.js
    node testy/etap_4g_2.test.js
    node testy/etap_4g_3.test.js
    node testy/etap_4h_1.test.js
    node testy/etap_4h_2.test.js
    node testy/etap_4h_3.test.js
    node testy/etap_4h_4.test.js
    node testy/etap_4h_5.test.js
    node testy/etap_4i_1.test.js
    node testy/etap_4i_2.test.js
    node testy/etap_4i_3.test.js
    node testy/etap_4i_4.test.js
    node testy/etap_4i_5.test.js
    node testy/etap_4j_1.test.js
    node testy/etap_5f_3.test.js
    node testy/etap_5g_1.test.js
    node testy/etap_5g_2.test.js
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
aktywności i usuwania, waliduje ID, aktywność, dostępność oraz wysięg, a do
przydziału przekazuje wyłącznie aktywne pompy. Starszy typ własna/zewnętrzna
pozostaje neutralną metadaną zgodności i nie jest pokazywany operatorowi.
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

Całe punkty **4E — przejazdy pomp** i **4F — niezależny przydział pomp** są
zakończone. Reguły 4F.0–4F.5 są objęte testami jednostkowymi i integracyjnym. Puste `Od/Do`
oznacza brak ograniczeń, rozpoczęta na czas budowa jest dokańczana, a
pochodzenie własna/zewnętrzna nie wpływa na algorytm. Rzeczywiste prace pompowe
są porządkowane według planowanego początku betonowania, a następnie dostają
pierwszy aktywny zasób spełniający wymagany wysięg, dostępność, wolny pełny
cykl i warunek przejazdu. Kontrola obejmuje przygotowanie, betonowanie oraz
czynności po pracy; dokładne zetknięcie końca jednego cyklu z początkiem
następnego jest dozwolone. Gdy żadna pompa nie pasuje do planowanej godziny,
silnik podaje najwcześniejszy możliwy start, przesunięcie i dokładne ograniczenie
bez zmiany kursów gruszek. Test integracyjny 4F.5 potwierdził wspólne
działanie tych reguł, w tym pompy 42 m, przejazdów i powtarzalności wyniku.
Cały punkt **4G — minimalna liczba pomp** jest zakończony. Silnik wyznacza
najmniejszą liczbę pomp potrzebną bez nakładania pełnych cykli, a istniejący
licznik wyniku pokazuje tę wartość operatorowi. Plan bez pompowania pokazuje
`0` i czytelny komunikat. Test 4G.3 potwierdza wyniki `0`, `1` i wielu pomp
oraz zgodność z technicznymi przydziałami bez nakładania pracy jednego zasobu.
Cały punkt **4H — tryb „mam X pomp”** jest zakończony. Operator może wybrać **Oblicz, ile
potrzeba** albo **Mam określoną liczbę**. W trybie ograniczonym silnik korzysta
wyłącznie z zadanej liczby rzeczywistych aktywnych pomp, nie tworzy brakujących
zasobów i wylicza kaskadowe przesunięcia pełnych cykli pomp. Wynik 4H.3 jawnie
rozróżnia liczbę potrzebną, zadeklarowaną i rzeczywiście dostępną do przydziału,
a przy każdej budowie zachowuje pierwotny plan, przydzieloną pompę, możliwy start,
przesunięcie oraz przyczynę. `0` pomp pozostawia budowę bez fikcyjnego przydziału.
Wynik nadal nie zmienia `StartRoboczy`; docelowe renderowanie i centralne
podłączenie pozostają zakresem 4I. 4H.4 potwierdza zapis i odtwarzanie trybu
oraz liczby pomp, w tym `0`, a także czysty stan każdego ponownego przeliczenia
bez odziedziczonych zajętości. Końcowy test 4H.5 potwierdza flotę wystarczającą,
niedobór, `0`, błędne dane, stabilność wyniku, limit aktywnej listy i brak
nakładania pracy jednej pompy. Cały punkt 4H pozostaje zakończony.
Pełne połączenie ograniczeń pomp i gruszek należy do Etapu 5.

Cały punkt **4I — integracja wyniku i interfejs operatora** jest zakończony.
Centralny `wynik.pompy` zasila wspólne sterowanie zasobami, osobną tabelę pełnego
cyklu pomp oraz komunikaty przypisane do konkretnych budów. W trybie ograniczonej
floty operator widzi rzeczywistą pompę, przygotowanie, betonowanie, zakończenie,
przejazd, gotowość i dokładny skutek ograniczenia. Tryb minimalnej floty nadal
pokazuje jawne pompy minimalnego układu bez udawania nieobliczonych przejazdów.

Zakres 4I.5 potwierdza, że podstawowy interfejs nadal korzysta wyłącznie z
lokalnych skryptów, stylów i grafik. Tabela pomp ma semantyczne opisy i nagłówki,
poziome przewijanie można obsłużyć klawiaturą, a braki i przesunięcia są opisane
tekstem — kolor jest tylko sygnałem pomocniczym. Wynik pomp nadal nie zmienia
`StartRoboczy` ani kursów gruszek. Cały Etap 4, wraz z testem operatora, jest zakończony. Cały punkt **5B** jest zakończony: możliwy start pompy zmienia `StartRoboczy`, brak zasobu tworzy jawny konflikt, a przy budowie pozostają przydzielona pompa, liczba minut przesunięcia, przyczyna i lista ograniczeń. Cały punkt **5C** jest zakończony: wszystkie kursy powstają od aktualnego `StartRoboczy`, oba tryby gruszek korzystają wyłącznie z tej nowej listy, a kolejne przeliczenie nie dziedziczy starych godzin ani kursów. Opóźnienie gruszki jest liczone dopiero względem nowego planu po pompie. Cały punkt **5D — rzeczywiste dostawy a czas pracy pompy** jest zakończony: po przydziale gruszek rzeczywiste okno betonowania i okres zajętości pompy są liczone z faktycznych rozładunków, a wydłużenie pracy poprzedniej budowy może przesunąć gotowość tej samej pompy i `StartRoboczy` następnej budowy. Po takiej korekcie kursy gruszek powstają ponownie od nowej godziny. Test kaskady A→B→C potwierdza przesunięcia B z `09:20` do `09:30` i C z `10:50` do `11:00` przy jednej gruszce, bez nakładania pracy jednej pompy ani jednej gruszki. Wersja webowa jest publikowana z `main` pod adresem `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`. Cały punkt **5E — stabilizacja sprzężonego przeliczenia** jest zakończony. Zależne fazy są ponawiane tylko po rzeczywistej zmianie `StartRoboczy`, stabilność jest rozpoznawana przez porównanie całego zestawu roboczych startów, a domyślny techniczny limit `50` iteracji zatrzymuje przypadek, który nie osiągnął stabilności. Taki wynik otrzymuje status `niestabilny` i jawny konflikt `NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI` zamiast dalszego automatycznego przesuwania. Normalna kaskada A → B → X → C nadal stabilizuje się po trzech przebiegach z C o `11:25`. Cały punkt **5F — limit opóźnienia rozpoczęcia budowy** jest zakończony: globalny limit domyślnie wynosi `30 min`, indywidualny wyjątek budowy ma pierwszeństwo, a końcowy `StartRoboczy` jest klasyfikowany dopiero po stabilizacji. Opóźnienie równe limitowi pozostaje zwykłą korektą; ścisłe przekroczenie tworzy konflikt `PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU` z obiema godzinami, pełnym opóźnieniem, użytym limitem i liczbą minut ponad limit. Podetap **5G.1** jest zakończony: każda robocza budowa otrzymuje `analizaPrzestojowBetonowania` opartą wyłącznie na faktycznie przydzielonych kursach końcowego sprzężonego przeliczenia. Każda kolejna para podaje oba kursy, rzeczywisty koniec i początek rozładunku oraz przerwę w minutach; opóźnienie pierwszej dostawy nie jest do niej doliczane. Podetap **5G.2** jest zakończony: osobny parametr `maksymalnyPrzestojMinuty` ma zatwierdzoną wartość domyślną `15 min`, jest walidowany również przy bezpośrednim wywołaniu silnika i wraca w `wynik.parametry`. Nadpisanie dotyczy tylko bieżącego przeliczenia, a wartość `0` jest dozwolona. Cały punkt **5G** jest zakończony: 5G.3 tworzy osobny konflikt `PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA` dla każdej rzeczywistej pary dostaw przekraczającej limit; `15 min` pozostaje dozwolone, a przy domyślnym limicie pierwszy konflikt powstaje od `16 min`. Cały punkt **5H — wspólny model konfliktów i przyczyn** jest zakończony: konflikty mają wspólny wersjonowany rdzeń, stabilną agregację bez dublowania oraz osobne `komunikatOperatora` z prostą polską przyczyną i konkretnymi danymi tam, gdzie są dostępne. Dotychczasowe pola techniczne pozostają zachowane, a tekst komunikatu nie wpływa na tożsamość konfliktu. Podetap **5I.1 — trzy godziny i przesunięcie** jest zakończony: tabela rozdziela Plan, Zadany i Roboczy, a przy przesunięciu pokazuje jego wielkość i prostą przyczynę. Podetap **5I.2 — konflikty i przestoje w interfejsie** jest zakończony: końcowe konflikty są pokazane tekstowo razem z powiązaną budową, kursem albo zasobem. Następny krok to **5I.3 — pamięć i stan nieaktualny**.
