# PROJECT DECISIONS — Harmonogram Betonowań v4

Ten dokument jest źródłem obowiązujących ustaleń biznesowych i architektonicznych projektu `Harmonogram_Betonowan_v4`.

Jego zadaniem jest odpowiedzieć na pytanie:

> **Co program ma robić, jakie zasady ma stosować i jakie decyzje zostały już podjęte?**

Zasady dotyczące sposobu pisania kodu znajdują się osobno w pliku `ZASADY_KODU.md`.

Dokument należy aktualizować wtedy, gdy podejmujemy nową trwałą decyzję projektową albo świadomie zmieniamy wcześniejszą.

---

## 1. Cel projektu

`Harmonogram_Betonowan_v4` ma być webowym harmonogramem dostaw betonu dla betoniarni.

Program ma pomagać operatorowi w planowaniu i przeliczaniu:

- betonowań,
- gruszek,
- pomp,
- kursów,
- godzin załadunku,
- godzin dojazdu,
- dostępności zasobów,
- konfliktów,
- opóźnień,
- przestojów,
- rzeczywistych możliwości wykonania planu.

Program ma być narzędziem operacyjnym, a nie tylko kalkulatorem.

---

## 2. Wersja projektu

Aktualnie rozwijana wersja nosi oznaczenie:

`_v4`

Repozytorium:

`aprofirm/Harmonogram_Betonowan_v4`

Nowe decyzje i rozwój funkcjonalny dotyczą tej wersji, chyba że wyraźnie ustalimy inaczej.

---

## 3. Jeden wspólny silnik

Program ma posiadać jeden wspólny silnik obliczeniowy.

Nie tworzymy dwóch niezależnych logik dla:

- wersji internetowej,
- wersji lokalnej/offline.

Obie wersje mają korzystać z tej samej logiki biznesowej.

Zasada:

> Te same dane wejściowe i te same ustawienia powinny dawać ten sam harmonogram niezależnie od sposobu uruchomienia programu.

---

## 4. Dwa sposoby uruchamiania

Projekt ma docelowo obsługiwać dwa warianty pracy.

### 4.1. Wersja webowa

Program może być uruchamiany jako normalna strona/aplikacja webowa.

### 4.2. Wersja całkowicie lokalna

Program ma również posiadać wariant możliwy do uruchomienia na komputerze służbowym bez instalowania dodatkowego środowiska.

Podstawowe wymagania wariantu lokalnego:

- uruchamianie w przeglądarce,
- brak konieczności instalacji Pythona,
- brak konieczności instalacji Node.js,
- brak logowania,
- brak wymaganego backendu,
- brak wymaganej bazy serwerowej,
- brak CDN wymaganych do podstawowego działania,
- brak zewnętrznych skryptów wymaganych do podstawowego działania,
- brak konieczności połączenia z internetem do tworzenia harmonogramu,
- możliwość działania po otwarciu lokalnego pliku HTML lub równoważnego lokalnego pakietu aplikacji.

Firmowa sieć może blokować część stron internetowych, dlatego podstawowa funkcjonalność programu nie może być zależna od zewnętrznego serwisu.

---

## 5. Modułowa architektura

Projekt ma być rozwijany modułowo.

Nie tworzymy jednego dużego pliku zawierającego jednocześnie import, obliczenia, pompy, gruszki, interfejs i wizualizację.

Logika powinna być podzielona według odpowiedzialności.

Przykładowe obszary/moduły:

- import CSV,
- walidacja danych,
- budowy,
- parametry,
- lokalizacje i adresy,
- trasy i czasy dojazdu,
- pompy,
- gruszki,
- kursy,
- przydział zasobów,
- konflikty,
- korekty harmonogramu,
- wynik harmonogramu,
- pamięć lokalna/cache,
- interfejs,
- wizualizacja,
- diagnostyka.

Celem modułowości jest łatwe:

- przeglądanie kodu,
- testowanie,
- naprawianie błędów,
- dokładanie nowych funkcji,
- wymienianie pojedynczych mechanizmów bez przebudowy całej aplikacji.

---

## 6. Silnik oddzielony od interfejsu

Silnik obliczeniowy nie powinien być zależny od HTML, przycisków, kolorów, tabel ani sposobu wyświetlania wyniku.

Silnik ma:

1. otrzymać dane i parametry,
2. wykonać obliczenia,
3. zwrócić wynik i informacje o konfliktach.

Osobna warstwa ma odpowiadać za pokazanie wyniku operatorowi.

Zmiana wyglądu strony nie powinna wymagać zmiany logiki harmonogramu.

---

## 7. Czytelność kodu

Obowiązuje plik `ZASADY_KODU.md`.

Najważniejsze założenia dla tego projektu:

- nazwy przede wszystkim po polsku,
- nazwy bez polskich znaków w identyfikatorach,
- nazwy proste i opisowe,
- unikanie skrótów typu `x`, `tmp`, `obj`, `res`,
- jedna funkcja powinna wykonywać jedno konkretne zadanie,
- wartości biznesowe powinny być parametrami lub opisowymi stałymi,
- przed większą zmianą najpierw sprawdzamy istniejący kod,
- preferujemy najmniejszą bezpieczną zmianę,
- nowa funkcja nie może psuć dotychczasowych funkcji.

Kod ma być możliwy do zrozumienia po kilku miesiącach również przez osobę, która nie jest zawodowym programistą.

---

## 8. Źródło danych — KDX i CSV

Podstawowym źródłem danych o betonowaniach jest system KDX i eksport CSV.

CSV traktujemy jako dane źródłowe.

Nie wymagamy ręcznego poprawiania pliku przed użyciem programu.

Logiczny przepływ danych:

`KDX → CSV → moduł importu → Budowy → silnik harmonogramu`

Warstwa importu ma być oddzielona od silnika, aby zmiana formatu CSV nie wymagała przebudowy obliczeń harmonogramu.

---

## 9. Dane źródłowe i dane robocze

Dane pochodzące z KDX powinny być zachowane jako źródłowe, a wartości zmieniane przez operatora lub silnik powinny mieć osobne pola robocze tam, gdzie ma to znaczenie.

Program nie powinien bez śladu nadpisywać ważnych danych wejściowych.

Ta zasada dotyczy m.in.:

- godzin startu,
- czasu dojazdu,
- odległości,
- lokalizacji,
- parametrów ręcznie skorygowanych przez operatora.

---

## 10. ID budowy

Jeżeli KDX/CSV dostarcza `ID_Budowy`, używamy go jako identyfikatora budowy.

Zasady:

- `ID_Budowy` traktujemy jako tekst,
- nie tworzymy własnego ID, jeżeli źródło ma już prawidłowe ID,
- brak kolumny ID albo puste ID w pojedynczym wierszu nie odrzuca całego pliku,
- dla budów z CSV bez źródłowego ID program nadaje identyfikatory `CSV-001`, `CSV-002` itd.,
- dla budów dodawanych ręcznie program używa osobnej serii `RECZNE-001`, `RECZNE-002` itd.,
- automatycznie nadane ID nie może kolidować z identyfikatorem już obecnym w pliku.

Jeżeli program nadaje ID automatycznie, import kończy się powodzeniem z czytelnym ostrzeżeniem dla operatora.

---

## 11. Firma i budowa to różne dane

Dane klienta i konkretnego miejsca betonowania muszą być rozdzielone.

Przykładowe pola:

- `Firma`,
- `Budowa`.

Jedna firma może mieć wiele budów.

Budowy nie wolno identyfikować wyłącznie nazwą firmy.

---

## 12. Budowy dodawane ręcznie

Program ma umożliwiać dodawanie budów ręcznie.

Budowy ręczne nie powinny modyfikować surowego importu KDX.

Silnik może łączyć:

- budowy z CSV,
- budowy wpisane ręcznie,

w jedną listę roboczą przeznaczoną do obliczeń.

---

## 13. Import CSV — prostota obsługi

Operator powinien mieć możliwie prosty sposób wczytania pliku CSV.

Program powinien obsługiwać co najmniej klasyczny wybór pliku oraz przeciąganie pliku na stronę.

### 13.1. Drag & drop

Na ekranie startowym ma być dostępne pole w rodzaju:

`Przeciągnij tutaj plik CSV`

### 13.2. Panel plików

Docelowo ekran startowy może pokazywać pliki CSV z wybranego przez użytkownika folderu.

Przykładowe informacje:

- nazwa pliku,
- data,
- godzina,
- oznaczenie najnowszego pliku,
- przycisk `Wczytaj`.

---

## 14. Dostęp do folderu z CSV

Przeglądarka nie może samodzielnie uzyskać dostępu do dowolnego folderu na komputerze.

Dlatego użytkownik świadomie wskazuje folder z plikami CSV.

Jeżeli przeglądarka pozwala zapamiętać nadany dostęp, program może próbować go używać przy kolejnych uruchomieniach.

Brak takiej możliwości nie może blokować pracy — zawsze pozostaje zwykły wybór pliku lub drag & drop.

---

## 15. `StartPlanowany` i `StartRoboczy`

To jedna z podstawowych decyzji projektu.

### `StartPlanowany`

Oryginalna godzina rozpoczęcia betonowania pochodząca z KDX/CSV lub wpisana przez operatora.

### `StartRoboczy`

Rzeczywista godzina wynikająca z aktualnych możliwości harmonogramu.

Program nie może bez śladu zmieniać `StartPlanowany`.

Przykład:

- `StartPlanowany = 08:00`,
- `StartRoboczy = 08:20`.

Operator ma zawsze widzieć różnicę pomiędzy planem źródłowym a planem możliwym do wykonania.

---

## 16. Brak cichego przesuwania betonowań

Program nie może przesuwać betonowania i ukrywać tego przed użytkownikiem.

Jeżeli zasoby powodują przesunięcie, operator powinien widzieć:

- pierwotną godzinę,
- nową godzinę,
- wielkość przesunięcia,
- przyczynę.

Przykład:

`Opóźnienie 40 min — brak dostępnej pompy.`

---

## 17. Dopuszczalne opóźnienie startu

Domyślna wartość maksymalnego dopuszczalnego opóźnienia startu:

`30 minut`

Powinna być parametrem programu, np.:

`MAKSYMALNE_OPOZNIENIE_STARTU_MINUTY`

Budowa może docelowo posiadać również własny indywidualny limit.

---

## 18. Korekty w granicy limitu

Jeżeli przesunięcie mieści się w dopuszczalnym limicie, program może potraktować je jako normalną korektę roboczą.

Jeżeli przesunięcie przekracza limit, program powinien oznaczyć konflikt wymagający uwagi operatora.

---

## 19. Konflikty są jawne

Program ma być również detektorem konfliktów.

Powinien jawnie zgłaszać m.in.:

- brak dostępnej gruszki,
- brak dostępnej pompy,
- kolizję pomp,
- kolizję gruszek,
- przekroczenie dopuszczalnego opóźnienia,
- zbyt duży przestój pomiędzy dostawami,
- niepełne lub błędne dane wejściowe,
- brak możliwej lokalizacji budowy,
- inne sytuacje powodujące nierealny plan.

Program nie powinien rozwiązywać problemów poprzez bezgraniczne przesuwanie wszystkiego w czasie bez informacji dla operatora.

---

## 20. Dwa tryby pracy dla gruszek

Program ma wspierać dwa podstawowe tryby.

### Tryb A — ile gruszek potrzeba?

Silnik oblicza liczbę gruszek potrzebną do możliwie płynnego wykonania planu.

Przykład:

`Potrzeba 6 gruszek.`

### Tryb B — tyle gruszek mam

Operator podaje rzeczywistą liczbę dostępnych gruszek.

Przykład:

`Dostępne gruszki: 5`

Po wybraniu `Przelicz` program tworzy nowy realny harmonogram dla 5 gruszek i pokazuje konsekwencje ograniczenia zasobu.

Program nie może ograniczyć się do komunikatu `za mało gruszek`.

---

## 21. Dwa tryby pracy dla pomp

Analogicznie program ma obsługiwać dwa tryby dla pomp.

### Tryb A — ile pomp potrzeba?

Program oblicza liczbę pomp potrzebną do wykonania planu bez niepotrzebnych konfliktów.

### Tryb B — tyle pomp mam

Operator podaje rzeczywistą liczbę dostępnych pomp, a program przelicza cały plan dla tej liczby.

Przykład:

- optymalnie potrzebne 3 pompy,
- dostępne 2 pompy,
- program pokazuje rzeczywisty harmonogram dla 2 pomp.

---

## 22. Pompa jest pełnoprawnym zasobem

Pompa nie jest tylko informacją tekstową przy budowie.

Każda pompa ma własną dostępność i zajętość.

Ta sama pompa nie może znajdować się jednocześnie na dwóch budowach.

---

## 23. Okres zajętości pompy

Pompa jest zajęta przez cały rzeczywisty okres obsługi betonowania.

Model powinien uwzględniać:

- przygotowanie przed rozpoczęciem,
- pracę podczas betonowania,
- zakończenie pracy,
- czynności końcowe/mycie, jeżeli mają znaczenie dla dostępności,
- przygotowanie do przejazdu na kolejną budowę.

Pompa nie staje się wolna tylko dlatego, że pojedyncza gruszka zakończyła rozładunek.

---

## 24. Przejazd pompy pomiędzy budowami

Pompa musi fizycznie przemieścić się pomiędzy miejscami pracy.

Jeżeli pompa kończy pracę na budowie A i ma rozpocząć budowę B, trzeba uwzględnić:

1. zakończenie pracy na A,
2. przygotowanie do wyjazdu,
3. przejazd A → B,
4. przygotowanie do pracy na B.

Dopiero potem może rozpocząć się betonowanie B.

---

## 25. Baza → budowa i budowa → budowa

Czas przejazdu pierwszej pompy z bazy do budowy oraz czas przejazdu pomiędzy budowami są osobnymi elementami logiki.

Model powinien pozwalać liczyć:

- `BAZA → BUDOWA`,
- `BUDOWA A → BUDOWA B`.

Nie zakładamy, że wszystkie czasy przejazdu są identyczne.

---

## 26. Pompy własne i zewnętrzne

Model danych pomp powinien umożliwiać rozróżnienie co najmniej:

- pompy własnej,
- pompy zewnętrznej.

Pompa powinna również mieć informację, czy jest aktywna/dostępna w danym dniu.

---

## 27. Parametry pomp

Model pomp powinien być przygotowany na cechy ograniczające możliwość przydziału pompy do budowy.

Przykład:

- wysięg pompy.

Nie każda dostępna pompa musi pasować do każdej budowy.

Nie rozbudowujemy jednak parametrów na zapas bez konkretnej potrzeby biznesowej.

---

## 28. Gruszka jest zasobem zajętym do powrotu

Cykl gruszki obejmuje co najmniej:

1. załadunek,
2. przejazd na budowę,
3. rozładunek,
4. powrót,
5. ponowną gotowość do kolejnego kursu.

Gruszka nie jest dostępna do kolejnego kursu w momencie zakończenia samego rozładunku.

---

## 29. Znaczenie godziny startu betonowania

Godzina startu budowy oznacza rozpoczęcie betonowania / przyjazd pierwszej gruszki na budowę.

Nie oznacza rozpoczęcia załadunku w betoniarni.

Pierwszy załadunek musi rozpocząć się odpowiednio wcześniej.

Ogólna zależność:

`pierwszy załadunek = start betonowania - czas dojazdu - czas załadunku`

---

## 30. Standardowa pojemność gruszki

Dotychczasowa wartość robocza:

`8 m³`

Ma być parametrem konfiguracyjnym, a nie wartością wpisaną na stałe w wielu miejscach kodu.

---

## 31. Czas załadunku

Dotychczasowa przyjęta wartość robocza:

`10 minut`

Ma być parametrem konfiguracyjnym.

Nie została jeszcze ostatecznie zamknięta decyzja, czy w przyszłości czas załadunku będzie zawsze stały, czy będzie zależał od ilości betonu.

Do czasu podjęcia innej decyzji traktujemy 10 minut jako wartość domyślną.

---

## 32. Jednostki czasu

W poprzednich wersjach logiki podstawowym krokiem roboczym było 10 minut.

W wersji webowej nie należy ograniczać dokładności obliczeń technicznie tylko do wielokrotności 10 minut.

Jeżeli krok planowania 10 minut ma znaczenie biznesowe, powinien być parametrem.

---

## 33. Początek dnia

Dotychczasowa wartość robocza początku dnia:

`07:00`

Ma być parametrem programu.

---

## 34. Cykl gruszki a rytm dostaw

To dwa różne pojęcia.

### Cykl gruszki

Obejmuje fizyczne zajęcie samochodu:

`załadunek + dojazd + rozładunek + powrót`

Przy symetrycznym czasie dojazdu można to zapisać jako:

`załadunek + 2 × dojazd + rozładunek`

### Rytm dostaw

Określa, jak często kolejne gruszki powinny pojawiać się na budowie.

Odstęp pomiędzy dostawami nie powinien automatycznie zwiększać fizycznego czasu zajęcia gruszki, jeżeli gruszka w tym czasie nie stoi zajęta.

---

## 35. Opóźnienie startu a przestój betonowania

Program musi rozróżniać dwa problemy.

### Opóźnienie startu

Pierwsza gruszka przyjeżdża później niż `StartPlanowany`.

### Przestój podczas betonowania

Betonowanie już się rozpoczęło, ale kolejna dostawa pojawia się zbyt późno.

Są to dwa niezależne rodzaje konfliktów.

---

## 36. Maksymalny przestój

Program powinien posiadać osobny parametr dla maksymalnego dopuszczalnego przestoju pomiędzy dostawami.

Przykładowa nazwa:

`MAKSYMALNY_PRZESTOJ_MINUTY`

Nie należy łączyć go z limitem opóźnienia startu.

---

## 37. Ciągłość pracy pompy

Jeżeli pompowanie na budowie już się rozpoczęło, harmonogram dostaw powinien w miarę możliwości zapewniać ciągłość pracy pompy.

Nie wystarczy jedynie rozmieścić wszystkie kursy w ciągu dnia.

Rytm dostaw ma znaczenie dla jakości planu.

---

## 38. Pełne przeliczenie harmonogramu

Przy pełnym przeliczeniu program powinien tworzyć harmonogram od nowa na podstawie aktualnych danych i ustawień.

Nie poprawiamy przypadkowych fragmentów starego wyniku.

Preferowana kolejność logiczna:

`Budowy`

→ `dostępność i zajętość pomp`

→ `rzeczywiste starty budów`

→ `generowanie kursów`

→ `przydział gruszek`

→ `wykrywanie konfliktów i korekty`

→ `harmonogram końcowy`

Dokładny podział funkcji może się zmieniać wraz z rozwojem kodu, ale zależności biznesowe muszą pozostać czytelne.

---

## 39. Zmiana liczby zasobów powoduje nowe przeliczenie

Jeżeli operator zmieni np.:

- 6 gruszek na 5,
- 3 pompy na 2,
- dostępność konkretnej pompy,
- dane budowy,

program powinien ponownie przeliczyć harmonogram na aktualnych danych.

Nie wolno pozostawiać kursów lub zajętości zasobów należących do poprzedniego wyniku.

---

## 40. Brak starych danych po zmianach

Po:

- usunięciu budowy,
- zmianie ilości betonu,
- zmianie godziny,
- zmianie liczby zasobów,
- wczytaniu kolejnego CSV,
- zmianie parametrów,

wynik ma odpowiadać aktualnemu stanowi danych.

Nie mogą pozostawać stare kursy ani stare przydziały.

---

## 41. Jeden centralny mechanizm przeliczania

Dla zwykłego operatora powinien istnieć jeden główny mechanizm pełnego przeliczenia harmonogramu.

Przykładowa funkcja na poziomie logiki aplikacji:

`przeliczCalyHarmonogram()`

Funkcja ta może uruchamiać kolejne moduły we właściwej kolejności.

Operator nie powinien być zmuszony ręcznie uruchamiać wielu technicznych etapów obliczeń.

---

## 42. Widok operatora i diagnostyka

Program może przechowywać więcej informacji technicznych niż pokazuje na głównym ekranie.

Główny widok operatora ma być prosty i przedstawiać przede wszystkim dane potrzebne do pracy.

Szczegółowe dane diagnostyczne mogą znajdować się w osobnym widoku lub sekcji szczegółów.

---

## 43. Prostota obsługi

Interfejs ma ograniczać liczbę czynności wykonywanych przez operatora.

Jeżeli program może bezpiecznie:

- wykryć dane,
- obliczyć wartość,
- podpowiedzieć wynik,
- użyć zapamiętanej informacji,

powinien to zrobić zamiast wymagać dodatkowych kliknięć.

Jednocześnie ważne decyzje i korekty mają pozostawać jawne dla użytkownika.

---

## 44. Parametry zamiast magicznych liczb

Wartości mające znaczenie biznesowe powinny znajdować się w jednym czytelnym miejscu jako konfiguracja lub opisowe stałe.

Dotyczy to m.in.:

- pojemności gruszki,
- czasu załadunku,
- maksymalnego opóźnienia,
- maksymalnego przestoju,
- początku dnia,
- czasów przygotowania pomp,
- innych wartości używanych przez silnik.

---

## 45. Komunikaty błędów

Błędy widoczne dla operatora mają być zrozumiałe i po polsku.

Przykład:

`Nie znaleziono kolumny z godziną rozpoczęcia betonowania. Sprawdź, czy wczytano właściwy plik CSV.`

Błędy techniczne mogą być dodatkowo zapisywane w diagnostyce, ale nie powinny być jedyną informacją dla użytkownika.

---

## 46. Przypadki brzegowe i bezpieczeństwo zmian

Nowe funkcje powinny być sprawdzane również na przypadkach brzegowych.

W szczególności:

- pusty CSV,
- brak wymaganej kolumny,
- niepełne dane,
- błędny format danych,
- zero budów,
- jedna budowa,
- wiele budów,
- brak dostępnych pomp,
- brak dostępnych gruszek,
- konflikt zasobów,
- wielokrotne kliknięcie `Przelicz`,
- ponowne przeliczenie,
- usunięcie budowy,
- dodanie budowy,
- wczytanie kolejnego pliku,
- odświeżenie strony,
- brak internetu,
- błąd zewnętrznej usługi mapowej.

---

## 47. Minimalna liczba zależności

Nie dodajemy frameworka, serwera, bazy danych ani zewnętrznej biblioteki bez konkretnego uzasadnienia.

Najpierw wybieramy najprostsze rozwiązanie zgodne z wymaganiami.

Podstawowe funkcje wersji offline nie mogą wymagać połączenia z zewnętrzną usługą.

---

# 48. Automatyczne ustalanie lokalizacji, odległości i czasu dojazdu

Program ma docelowo automatycznie ustalać odległość budowy od węzła oraz przewidywany czas dojazdu na podstawie adresu budowy pochodzącego z KDX/CSV, jeżeli dane i dostęp do internetu na to pozwalają.

Funkcja ta ma być osobnym modułem i nie może być bezpośrednio wymieszana z silnikiem harmonogramu.

Logiczny przepływ:

`adres z KDX`

→ `sprawdzenie jakości adresu`

→ `geokodowanie adresu`

→ `współrzędne budowy`

→ `wyznaczenie trasy drogowej od węzła`

→ `odległość i czas dojazdu`

→ `wartości robocze używane przez harmonogram`

---

## 49. OpenStreetMap i usługi mapowe

Dane OpenStreetMap mogą być wykorzystane jako baza danych mapowych.

Dopuszczalne jest użycie usług geokodowania i routingu opartych o OpenStreetMap, np. Nominatim oraz odpowiedniego silnika trasowania.

Konkretnego dostawcy nie należy jednak na stałe wiązać z silnikiem harmonogramu.

Warstwa mapowa powinna być wymienna.

Jeżeli w przyszłości zmienimy usługę geokodowania lub routingu, nie powinno to wymagać przebudowy logiki pomp, gruszek ani kursów.

---

## 50. Trasa drogowa, nie linia prosta

Do harmonogramu interesuje nas rzeczywista trasa możliwa do przejechania drogami, a nie odległość w linii prostej.

Program powinien pozyskiwać co najmniej:

- długość trasy w kilometrach,
- przewidywany czas przejazdu.

Czas przejazdu jest dla harmonogramu ważniejszy niż sama odległość.

---

## 51. Punkt węzła

Każdy węzeł/betoniarnia powinien posiadać zapisany dokładny punkt lokalizacji.

Preferowane dane:

- nazwa węzła,
- adres,
- szerokość geograficzna,
- długość geograficzna.

Po jednorazowym ustaleniu współrzędnych węzła nie trzeba geokodować go przy każdym obliczeniu.

Architektura powinna być przygotowana na obsługę więcej niż jednego węzła w przyszłości.

---

## 52. Ocena kompletności adresu

Przed wysłaniem adresu do usługi mapowej program powinien lokalnie ocenić jego kompletność.

Przykładowe elementy:

- miejscowość,
- ulica,
- numer budynku,
- kod pocztowy,
- inne dane lokalizacyjne dostępne w KDX.

Brak pojedynczego elementu, np. kodu pocztowego, nie oznacza automatycznie błędnego adresu.

Program powinien używać statusów w rodzaju:

- `adres pełny`,
- `adres niepełny, ale możliwy do wyszukania`,
- `za mało danych do pewnego wyszukania`,
- `adres niejednoznaczny`,
- `nie znaleziono lokalizacji`.

---

## 53. Niepełny lub niejednoznaczny adres ma być widoczny

Program nie może udawać pewności, jeżeli dane adresowe są słabe.

Jeżeli geokoder zwraca kilka możliwych lokalizacji albo adres jest niepełny, operator powinien dostać czytelne ostrzeżenie.

Przykład:

`Adres niepełny — brak numeru budynku. Sprawdź lokalizację przed użyciem automatycznego czasu dojazdu.`

lub:

`Adres niejednoznaczny — znaleziono kilka możliwych lokalizacji.`

---

## 54. Ręczna edycja odległości i czasu dojazdu

Automatycznie obliczona trasa ma być podpowiedzią, a nie wartością niemożliwą do zmiany.

Operator musi mieć możliwość ręcznej korekty co najmniej:

- odległości,
- czasu dojazdu,
- lokalizacji budowy, jeżeli automatyczne wyszukanie jest błędne.

Ręczna korekta powinna być wyraźnie oznaczona.

Przykład:

`Wartość ręcznie zmieniona.`

---

## 55. Dane automatyczne i dane robocze dla trasy

Preferowany model rozdziela wartość obliczoną automatycznie od wartości używanej przez silnik.

Przykładowe pola:

- `OdlegloscAutomatycznaKm`,
- `CzasDojazduAutomatycznyMin`,
- `OdlegloscRoboczaKm`,
- `CzasDojazduRoboczyMin`,
- `LokalizacjaAutomatyczna`,
- `LokalizacjaRobocza`,
- `StatusAdresu`,
- `ZrodloTrasy`,
- `CzyTrasaSkorygowanaRecznie`.

Dzięki temu operator zawsze może sprawdzić, co zaproponował system mapowy, a co zostało świadomie zmienione.

---

## 56. Ręczna korekta nie może być bez potrzeby nadpisywana

Jeżeli operator poprawił czas dojazdu lub lokalizację, zwykłe przeliczenie harmonogramu nie powinno nadpisywać tej wartości automatycznym wynikiem.

Ponowne pobranie wartości automatycznej powinno być świadomą operacją albo następować według jasno ustalonej reguły.

---

## 57. Pamięć znanych lokalizacji i tras

Program powinien zapamiętywać poprawnie ustalone lokalizacje i wyniki tras, gdy jest to możliwe.

Jeżeli ta sama budowa lub ten sam adres pojawi się ponownie, można użyć zapamiętanych danych zamiast wykonywać kolejne zapytanie do zewnętrznej usługi.

Korzyści:

- szybsze działanie,
- mniejsza liczba zapytań,
- stabilniejsze wyniki,
- możliwość wykorzystania znanej lokalizacji bez internetu.

Pamięć lokalizacji powinna być oddzielnym modułem.

---

## 58. Brak internetu nie może blokować harmonogramu

Automatyczne mapy są funkcją pomocniczą, a nie warunkiem działania programu.

Jeżeli internet jest niedostępny albo usługa mapowa nie działa, program powinien:

1. spróbować użyć wcześniej zapamiętanych danych,
2. jeżeli ich nie ma — umożliwić ręczne podanie odległości i czasu dojazdu,
3. nadal pozwolić utworzyć harmonogram.

Wersja offline musi zachować podstawową funkcjonalność bez dostępu do usług mapowych.

---

## 59. Błąd mapy nie może stać się błędem całego programu

Błąd geokodowania, limit usługi, brak sieci lub błąd routingu powinny być obsłużone lokalnie przez moduł mapowy.

Nie mogą powodować awarii całego silnika harmonogramu.

Silnik powinien otrzymać prawidłową wartość roboczą albo informację, że wymagana jest ręczna decyzja operatora.

---

## 60. Moduł lokalizacji i tras

Logika adresów oraz tras powinna być oddzielona od pozostałej części projektu.

Przykładowy podział odpowiedzialności:

- `sprawdz_adres.js` — ocena kompletności danych,
- `geokodowanie.js` — zamiana adresu na współrzędne,
- `obliczanie_trasy.js` — długość i czas trasy,
- `pamiec_lokalizacji.js` — zapis i odczyt znanych miejsc,
- `lokalizacje.js` — wspólny interfejs modułu lokalizacji.

Nazwy plików mogą ulec zmianie podczas implementacji, ale odpowiedzialności powinny pozostać rozdzielone.

---

## 61. Źródło czasu dojazdu dla silnika

Silnik harmonogramu nie powinien samodzielnie kontaktować się z usługą mapową.

Powinien otrzymać gotową wartość roboczą, np.:

`CzasDojazduRoboczyMin = 32`

Silnik nie musi wiedzieć, czy 32 minuty pochodziły z:

- automatycznej trasy,
- zapamiętanej lokalizacji,
- ręcznej korekty operatora.

Źródło powinno być przechowywane w danych dla diagnostyki i interfejsu.

---

## 62. Przyszła możliwość tras dla pojazdów ciężkich

Architektura modułu tras powinna pozwolić w przyszłości użyć routingu uwzględniającego specyfikę ciężkich pojazdów, jeżeli będzie to potrzebne i dostępne.

Nie jest to jednak wymóg pierwszej wersji modułu.

Najpierw tworzymy prostą i stabilną wersję, a dopiero później dokładamy dodatkowe ograniczenia tras.

---

## 63. Dokumentacja jako część projektu

`PROJECT_DECISIONS.md` i `ZASADY_KODU.md` są częścią projektu, a nie dokumentami pomocniczymi przeznaczonymi do jednorazowego użycia.

Przed większą zmianą należy sprawdzić:

1. `ZASADY_KODU.md`,
2. `PROJECT_DECISIONS.md`,
3. aktualny kod repozytorium,
4. zależności zmienianego mechanizmu.

Dopiero potem należy wprowadzać zmiany.

---

# Otwarte tematy

Poniższe kwestie były omawiane, ale nie zostały jeszcze zamknięte ostateczną decyzją.

Nie należy ich traktować jako obowiązujących wymagań, dopóki nie zostaną uzgodnione.

## O1. Dokładny format CSV z KDX

Trzeba sprawdzić rzeczywisty plik używany w pracy i ustalić dokładne mapowanie kolumn.

## O2. Czas załadunku

Obecna wartość domyślna to 10 minut.

Do ustalenia pozostaje, czy czas będzie zawsze stały, czy będzie zależał od ilości ładowanego betonu.

## O3. Finalny zestaw kolumn harmonogramu

Nie został jeszcze ostatecznie zamknięty zestaw wszystkich informacji widocznych na głównym ekranie operatora.

## O4. Finalny wygląd interfejsu

Najpierw priorytetem jest poprawny silnik i czytelny przepływ pracy.

Wygląd będzie dopracowywany iteracyjnie.

## O5. Priorytety kolidujących budów

Do ustalenia pozostaje dokładna reguła wyboru, którą budowę przesuwać w sytuacji konfliktu zasobów, jeżeli kilka rozwiązań jest możliwych.

## O6. Jednoczesny niedobór pomp i gruszek

Silnik ma umieć przeliczyć rzeczywistość przy ograniczonych zasobach, ale dokładna funkcja celu i kolejność optymalizacji będą dopracowane podczas implementacji oraz testów na realnych danych.

## O7. Dokładna usługa geokodowania i routingu

OpenStreetMap jest preferowanym źródłem danych mapowych, ale konkretny dostawca usług online nie jest jeszcze trwale wybrany.

Moduł ma być przygotowany tak, aby można było zmienić usługę bez przebudowy silnika harmonogramu.

---

# Zasada nadrzędna projektu

Program ma odzwierciedlać rzeczywistą pracę betoniarni.

Nie chodzi o stworzenie matematycznie ładnego planu, który ignoruje fizyczne ograniczenia.

Harmonogram ma uwzględniać rzeczywiste:

- czasy,
- przejazdy,
- dostępność gruszek,
- dostępność pomp,
- zajętość zasobów,
- ograniczenia budów,
- konflikty,
- decyzje operatora.

Jeżeli planu nie da się wykonać bez naruszenia założeń, program powinien to jasno pokazać zamiast ukrywać problem.

---

# Zasada rozwoju

Najpierw budujemy prosty, czytelny i poprawny silnik.

Następnie dokładamy kolejne funkcje jako osobne, zrozumiałe moduły.

Każda nowa funkcja powinna mieć jasny powód biznesowy i nie powinna niepotrzebnie zwiększać złożoności całego projektu.
