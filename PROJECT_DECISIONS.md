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

Dokumentacja prowadząca projekt jest częścią produktu, a nie materiałem pomocniczym przeznaczonym do jednorazowego użycia.

Obowiązują następujące pliki:

- `AGENTS.md` — sposób pracy z repozytorium,
- `README.md` — skrót projektu i mapa dokumentacji,
- `ZASADY_KODU.md` — stałe zasady tworzenia i zmieniania kodu,
- `PROJECT_DECISIONS.md` — zatwierdzone decyzje,
- `POMYSLY_I_BACKLOG.md` — pomysły i tematy otwarte,
- `ETAPY_ROZWOJU.md` — kolejność prac i aktualny postęp.

Przed zmianą należy przeczytać `AGENTS.md`, wszystkie powyższe dokumenty, aktualny kod, testy, przykłady i zależności zmienianego mechanizmu. Dopiero potem należy wprowadzać zmiany.

---

## 64. Trwała pamięć projektu po rozmowie

Repozytorium jest trwałym źródłem pamięci projektu. Po każdej rozmowie projektowej należy sprawdzić, czy pojawiły się nowe informacje wymagające zapisu.

Obowiązują zasady:

- zatwierdzone decyzje trafiają do `PROJECT_DECISIONS.md`,
- pomysły, warianty i pytania do doprecyzowania trafiają do `POMYSLY_I_BACKLOG.md`,
- zmiana postępu lub następnego kroku trafia do `ETAPY_ROZWOJU.md`,
- nowa stała reguła pracy z kodem trafia do `ZASADY_KODU.md`,
- dokumentację aktualizujemy razem z powiązaną zmianą kodu albo najpóźniej przed końcowym podsumowaniem zadania,
- nie tworzymy pustego wpisu, jeżeli rozmowa nie wniosła nowego ustalenia,
- nie przedstawiamy luźnego pomysłu jako zatwierdzonej decyzji,
- nie powielamy wpisów już istniejących w dokumentacji.

Szczegółową procedurę pracy opisuje `AGENTS.md`.

---

## 65. Logo aplikacji i favicon

Oficjalny znak Harmonogramu Betonowań jest wyświetlany u góry strony, na środku nad nazwą aplikacji.

Zatwierdzony znak przedstawia pomarańczowo-granatową betonomieszarkę na tle zegara, bez dodatkowych napisów. Ten sam motyw jest używany jako favicon na karcie przeglądarki. Podstawowym źródłem grafiki jest lokalny plik `logo.png`, a `favicon.png` stanowi jego kwadratowy wariant przygotowany bez rozciągania obrazu.

Logo i favicon:

- nie mogą wymagać połączenia z internetem,
- nie mogą korzystać z zewnętrznego CDN,
- mają działać po bezpośrednim otwarciu lokalnego `index.html`,
- nie mogą wpływać na logikę importu KDX ani silnik harmonogramu.

---

## 66. Lokalne logi i raport diagnostyczny

Aplikacja automatycznie prowadzi diagnostykę działającą również po lokalnym otwarciu `index.html` i bez internetu.

Obowiązują zasady:

- logi są przechowywane lokalnie w przeglądarce i nie są automatycznie wysyłane,
- zachowywanych jest maksymalnie 10 ostatnich uruchomień,
- gdy trwała pamięć przeglądarki jest niedostępna, diagnostyka działa w pamięci bieżącej strony i jawnie informuje o tym operatora,
- rejestrowane są uruchomienie aplikacji, import CSV, przeliczanie, ostrzeżenia i błędy techniczne,
- raport zawiera nazwę i rozmiar pliku, nagłówki kolumn, wynik operacji, czas trwania oraz bezpieczny opis miejsca błędu,
- logi i raport nie zawierają treści wierszy CSV ani nazw firm i budów,
- pobranie raportu `.json` następuje wyłącznie po działaniu użytkownika,
- operator może wyczyścić zapisane logi,
- mechanizm diagnostyki pozostaje osobnym modułem i nie zmienia logiki importu KDX ani silnika harmonogramu.

---

## 67. Położenie głównego przycisku przeliczania

Główny przycisk **Przelicz harmonogram** znajduje się na początku lewego panelu,
nad nagłówkiem i polami ustawień. Dzięki temu operator nie musi przewijać panelu
do jego dolnej części, aby uruchomić ponowne przeliczenie.

Zmiana położenia przycisku dotyczy wyłącznie interfejsu. Przycisk nadal uruchamia
ten sam centralny mechanizm pełnego przeliczenia harmonogramu.

---

## 68. Tolerancja czasu i zrealizowane pozycje KDX

Prawdziwy eksport KDX został zweryfikowany na komputerze operatora 2026-08-14.

- rzeczywisty zapis KDX `13:00 (+60 min)` oznacza dopuszczalne okno rozpoczęcia od `13:00` do `14:00`; importer akceptuje również wariant ze znakiem minus, jeżeli pojawi się w innym eksporcie;
- wartość źródłowa pozostaje zachowana, a model roboczy przechowuje osobno początek, tolerancję i najpóźniejszy start;
- ilość `0,0 m³` oznacza pozycję już zrealizowaną;
- zrealizowana pozycja pozostaje widoczna w planie dnia, ale nie może generować nowych kursów ani zajmować gruszek.

---

## 69. Model podstawowych czasów kursu w kroku 3B.1

W kroku 3B.1 obowiązuje następujący model:

- podstawowy czas załadunku wynosi domyślnie `10 minut` i pozostaje parametrem;
- podstawowy czas rozładunku wynosi domyślnie `15 minut` dla każdego kursu,
  również dla ostatniego kursu niepełnego;
- każda budowa może mieć osobny dodatkowy czas załadunku, domyślnie `0 minut`;
- kolumna **Rozładunek** pokazuje dokładny czas używany w obliczeniach: bez
  wyjątku jest to bieżąca wartość z ustawień, a ręcznie wpisana liczba zastępuje
  ją dla wybranej budowy i nie jest do niej dodawana;
- zmiana globalnego czasu rozładunku aktualizuje budowy bez ręcznego wyjątku,
  ale nie zmienia wartości nadpisanych;
- przycisk `↺` przy czasie rozładunku usuwa ręczny wyjątek wybranej budowy i
  przywraca jej bieżącą wartość z ustawień;
- ręczny wyjątek jest zapisywany razem z planem, a starsze zapisy zawierające
  dodatkowe minuty rozładunku są migrowane do równoważnego czasu dokładnego;
- dokładny czas rozładunku wpływa na odstęp pomiędzy kolejnymi dostawami tej
  budowy;
- czas dojazdu i czas powrotu są osobnymi wartościami roboczymi dla budowy;
- jeżeli oba czasy są puste, pierwsze wpisanie dojazdu albo powrotu kopiuje tę
  samą wartość do drugiego pola, zgodnie z domyślnym założeniem równej trasy;
- po uzupełnieniu obu pól ich dalsza edycja jest niezależna: zmiana jednego
  czasu nie nadpisuje drugiego, dzięki czemu można uwzględnić inną trasę powrotną;
- w kroku 3B.1 operator podaje je ręcznie, a przyszły moduł mapowy będzie mógł
  dostarczyć te same wartości bez zmiany silnika kursów;
- brak czasu dojazdu lub powrotu dla budowy generującej kursy zatrzymuje
  przeliczenie i powoduje czytelny monit z ID budowy;
- ręcznie wpisane czasy pozostają zachowane podczas zwykłego ponownego
  przeliczenia tych samych danych.

Każdy kurs otrzymuje godziny:

1. rozpoczęcia i zakończenia załadunku,
2. wyjazdu z betoniarni i przyjazdu na budowę,
3. rozpoczęcia i zakończenia rozładunku,
4. powrotu do betoniarni,
5. ponownej gotowości do następnego kursu.

Krok 3B.1 nie przypisuje jeszcze konkretnego numeru gruszki. Przydział pojazdów
i kontrola nakładania ich kursów należą do punktu 3C.

---

## 70. Trwała pamięć planu dnia — krok przekrojowy KP-1

Program ma automatycznie zachowywać bieżący plan dnia w lokalnej pamięci
przeglądarki, aby zwykłe odświeżenie strony nie powodowało utraty pracy operatora.

Obowiązują następujące zasady:

- zapis odbywa się wyłącznie lokalnie w danej przeglądarce i nie jest wysyłany
  do internetu;
- zapis obejmuje przetworzone budowy z importu, budowy ręczne, parametry,
  ręczne czasy i korekty oraz informację, czy harmonogram został przeliczony;
- nie zapisujemy pełnej surowej treści wierszy CSV, jeżeli nie jest potrzebna
  do odtworzenia pracy;
- po odświeżeniu program odtwarza dane, a wcześniej przeliczony harmonogram
  oblicza ponownie na podstawie przywróconego stanu zamiast ufać staremu
  zapisanemu wynikowi;
- zapis ma numer wersji, aby przyszłe zmiany formatu można było obsłużyć
  świadomie;
- pamięć składa się z jednego bieżącego zapisu roboczego oraz osobnej historii
  skutecznie przeliczonych harmonogramów;
- bieżący zapis roboczy jest nadpisywany po imporcie, dodaniu budowy ręcznej,
  zmianie parametrów albo czasów i po przeliczeniu;
- historia zachowuje maksymalnie 100 różnych zapisów; identyczne ponowne
  przeliczenie nie tworzy duplikatu;
- każdy zapis historyczny zawiera dokładną datę i godzinę, nazwę źródłowego
  pliku, liczbę budów oraz informację, czy plan był przeliczony;
- po przekroczeniu 100 pozycji najstarszy zapis zostaje nadpisany;
- historia ma dodatkowy limit bezpieczeństwa 3 MB; jeżeli jest on osiągnięty,
  w pierwszej kolejności zwalniane jest miejsce zajmowane przez najstarsze
  zapisy;
- brak, uszkodzenie albo niezgodna wersja zapisu nie mogą zablokować
  uruchomienia aplikacji;
- jeżeli przeglądarka blokuje trwałą pamięć, program nadal działa w bieżącej
  sesji i pokazuje operatorowi czytelną informację;
- bezpośrednio pod przyciskiem **Przelicz harmonogram** ma znajdować się czerwony
  przycisk **Wyczyść plan dnia**;
- na dole panelu ma znajdować się przycisk **Wczytaj zapis historyczny** z
  liczbą dostępnych zapisów; lista jest pokazywana od najnowszego do najstarszego;
- wczytanie historycznego planu wymaga potwierdzenia, a różniący się bieżący
  plan jest wcześniej zabezpieczany w historii;
- wyczyszczenie wymaga potwierdzenia i usuwa budowy, ustawienia robocze oraz
  wynik harmonogramu, przywracając wartości domyślne;
- przycisk **Wyczyść plan dnia** nie usuwa historii zapisów;
- przycisk **Wyczyść plan dnia** nie usuwa logów diagnostycznych, ponieważ służy
  do tego osobna funkcja **Wyczyść logi**.

Trwały zapis dotyczy konkretnego urządzenia i profilu przeglądarki. Usunięcie
danych witryny w przeglądarce usuwa również zapisany plan.

KP-1 jest krokiem przekrojowym wykonywanym przed 3B.2. Nie zamyka ani nie
zastępuje punktu 3B; po pozytywnym teście KP-1 następnym podetapem pozostaje 3B.2.

---

## 71. Lokalna pamięć znanych tras — krok przekrojowy KP-2

Program ma prowadzić osobną lokalną książkę znanych tras. Jej celem jest
ponowne wykorzystanie czasu dojazdu i powrotu dla miejsca, które pojawiło się
już wcześniej, również wtedy, gdy niepełne dane uniemożliwiają automatyczne
wyszukanie lokalizacji.

Obowiązują następujące zasady:

- pamięć tras jest oddzielona od bieżącego planu dnia, historii przeliczeń i
  diagnostyki;
- jeden wpis opisuje najnowsze zatwierdzone czasy dla pary `węzeł + dokładnie
  znormalizowane oznaczenie lokalizacji`;
- do czasu wydzielenia osobnego pola adresu w Etapie 6 bieżące dopasowanie
  wykorzystuje bezpieczne połączenie nazwy firmy i pola `Budowa`;
- normalizacja może usuwać różnice wielkości liter, polskich znaków,
  interpunkcji i wielokrotnych odstępów, ale nie może stosować podobieństwa
  tekstowego ani zgadywać, że dwa różne opisy oznaczają to samo miejsce;
- dojazd i powrót są przechowywane osobno, ponieważ trasa powrotna może zostać
  ręcznie zmieniona niezależnie;
- zapis przechowuje źródło wartości: ręczne, mapowe albo odczytane z pamięci,
  oraz datę utworzenia, aktualizacji i ostatniego użycia;
- kompletna ręczna korekta czasów jest zapisywana w książce tras i może zostać
  użyta przy kolejnym imporcie tej samej lokalizacji;
- zwykłe przeliczenie archiwizuje wszystkie budowy mające kompletny dojazd i
  powrót, dlatego nie trzeba ponownie edytować tras zapisanych w starszym planie;
- przy odtwarzaniu bieżącego lub historycznego planu program dopisuje wyłącznie
  brakujące trasy i nie cofa istniejącej, nowszej wartości ze starego zapisu;
- przyszły wynik usługi mapowej będzie zapisywany w tym samym formacie;
- kolejność wyboru czasu to: wartość już obecna w bieżącym lub odtworzonym
  planie, dokładne trafienie w pamięci tras, przyszłe zapytanie do usługi
  mapowej, a przy braku wyniku ręczna decyzja operatora;
- dokładne trafienie w pamięci nie może wykonywać ponownego zapytania do usługi
  mapowej; świadome odświeżenie trasy będzie osobną operacją w Etapie 6;
- zwykłe przeliczenie i ponowny import nie mogą automatycznie nadpisywać
  ręcznej korekty wynikiem mapowym;
- przycisk **Wyczyść plan dnia** nie usuwa książki tras;
- pamięć jest wersjonowana i działa wyłącznie lokalnie w profilu przeglądarki;
- limit wynosi maksymalnie 1000 różnych lokalizacji i około 1 MB; po osiągnięciu
  limitu najdawniej używany wpis jest zastępowany nowym;
- uszkodzenie, brak miejsca albo blokada `localStorage` nie mogą zatrzymać
  harmonogramu; aplikacja przechodzi wtedy na pamięć bieżącej sesji i informuje
  o tym operatora.

KP-2 przygotowuje pamięć i wspólny przepływ źródeł czasu. Nie oznacza jeszcze
uruchomienia OpenStreetMap — wybór i podłączenie konkretnej usługi geokodowania
oraz routingu pozostają zakresem Etapu 6.

---

## 72. Budowa ręczna, robocza ilość betonu i kompaktowy widok — KP-3

Budowa dodawana ręcznie musi zawierać dodatnią ilość betonu w m³. Bez niej
pozycja nie może zostać dodana, ponieważ nie dałoby się utworzyć jej kursów.

Dla każdej budowy obowiązują dwie wartości ilości:

- **bazowa ilość betonu** pochodzi z CSV albo z formularza budowy ręcznej i
  pozostaje punktem odniesienia;
- **robocza ilość betonu** jest używana przez bieżące przeliczenie i może być
  zmieniana przez operatora bezpośrednio w tabeli.

Robocza ilość może wynosić `0 m³`, aby świadomie sprawdzić wariant bez dalszych
kursów dla danej budowy. Taka pozycja jest traktowana jako zrealizowana.
Zmiana robocza nie nadpisuje wartości bazowej. Przycisk `↺` przy polu ilości
przywraca bazową wartość tylko wybranej budowy. Zmiana i przywrócenie oznaczają
wynik jako nieaktualny, są zapisywane w pamięci planu i wymagają ponownego
wybrania **Przelicz harmonogram**.

Na komputerach aplikacja ma domyślnie wykorzystywać niemal całą szerokość
okna przy zwykłym zoomie przeglądarki `100%`:

- boczne marginesy wynoszą około 16–24 px;
- lewy panel zachowuje szerokość 280–304 px;
- obszar harmonogramu wypełnia pozostałą szerokość;
- formularze, statusy i tabele mają zwarty układ odpowiedni do pracy operatora;
- na węższych ekranach pozostaje układ responsywny, w tym jedna kolumna do
  szerokości 920 px.

Aplikacja nie wymusza zoomu Chrome i nie używa CSS `zoom` ani skalowania całej
strony przez `transform: scale()`. Zagęszczenie i szerokość są realizowane
zwykłym, responsywnym CSS.

KP-3 jest krokiem przekrojowym wykonanym przed 3B.2 i nie zmienia logiki rytmu
dostaw.

---

## 73. Reguła rytmu dostaw i granice kroku 3B.2

W kroku 3B.2 rytm określa planowany odstęp pomiędzy rozpoczęciem rozładunku
kolejnych kursów tej samej budowy.

Obowiązuje zależność:

`rytm dostaw = dokładny czas rozładunku + dodatkowy odstęp`

Przykład: dokładny czas rozładunku `15 min` i dodatkowy odstęp `5 min` dają
rytm `20 min`.

Pierwszy kurs rozpoczyna rozładunek o `StartRoboczy`. Dla kolejnych kursów:

`start rozładunku = StartRoboczy + (numer kursu - 1) × rytm dostaw`

Dodatkowy odstęp oznacza planowaną przerwę od zakończenia rozładunku
poprzedniego kursu do rozpoczęcia rozładunku następnego kursu. Wartość `0 min`
oznacza, że następny rozładunek zaczyna się bezpośrednio po poprzednim i
zachowuje dotychczasowy wynik 3B.1.

Rytm nie zmienia fizycznego cyklu pojedynczej gruszki. Do czasu jej zajęcia
nadal należą wyłącznie:

`załadunek + dojazd + rozładunek + powrót`

Dodatkowego odstępu nie wolno dodawać do czasu powrotu ani ponownej gotowości
pojazdu. Wydłużony czas załadunku wpływa na godzinę rozpoczęcia załadunku
konkretnego kursu, ale nie zmienia założonego rytmu przyjazdów na budowę.

`StartPlanowany` pozostaje niezmienioną wartością źródłową. Krok 3B.2 oblicza
planowane godziny względem `StartRoboczy`, ale nie przydziela numerów gruszek,
nie sprawdza dostępności konkretnego pojazdu i nie przesuwa kursów z powodu
ograniczonej liczby gruszek. Te obowiązki należą do punktów 3C–3E oraz
późniejszej logiki konfliktów i korekt.

Dodatkowy odstęp rytmu nie jest tym samym parametrem co maksymalny dopuszczalny
przestój. Maksymalny przestój służy późniejszej ocenie ciągłości betonowania i
pozostaje osobną regułą.

---

## 74. Rodzaj rozładunku i odbiory własne

Rzeczywisty eksport KDX może zawierać kolumnę **Rodzaj rozładunku**. Program
rozpoznaje obecnie wartości:

- `Odbiór własny`,
- `Lej`,
- `Pompa`,
- `Wywrotka`,
- `Taczka`.

Jeżeli kolumna **Rodzaj rozładunku** istnieje, ale komórka danej pozycji jest
pusta, oznacza to **Odbiór własny**. Jeżeli starszy plik w ogóle nie zawiera tej
kolumny, program nie może automatycznie uznać wszystkich pozycji za odbiory
własne — zachowuje wcześniejsze działanie i planuje je normalnie.

Odbiór własny jest zamówieniem dnia, ale nie jest dostawą wykonywaną gruszką z
betoniarni do budowy. Dlatego:

- nie wymaga czasu dojazdu ani czasu powrotu,
- nie tworzy kursów gruszek,
- nie jest zapisywany do książki znanych tras,
- nie rezerwuje gruszki w automatycznym harmonogramie,
- operator realizuje go w wolnym oknie załadunkowym.

Dla czytelności odbiory własne nie są pokazywane w głównej tabeli dostaw
planowanych. Trafiają do osobnej, domyślnie zwiniętej sekcji **Odbiory własne**
poniżej głównego harmonogramu.

Budowa dodawana ręcznie musi posiadać jawnie wybrany rodzaj rozładunku. Pozostałe
rodzaje (`Lej`, `Pompa`, `Wywrotka`, `Taczka`) pozostają zwykłymi dostawami
planowanymi. Wartość `Pompa` jest już zachowywana w modelu, ale pełny przydział,
dostępność i zajętość pomp należą dopiero do Etapu 4.

Zasada została potwierdzona przez operatora 2026-08-17 na rzeczywistym eksporcie
KDX i wersji opublikowanej przez GitHub Pages. Pełna regresja automatyczna tej
funkcji jest wykonywana razem z krokiem 3B.2.6 i nie zamyka jeszcze 3B.2 ani 3B.

---

## 75. Przydział konkretnych gruszek — zasady 3C

W punkcie 3C przydział jest wykonywany dla godzin kursów obliczonych wcześniej
przez 3B.2. Sam przydział nie może na tym etapie przesuwać godzin kursów.

Obowiązują zasady:

- jeden kurs zajmuje konkretną gruszkę od rozpoczęcia załadunku do powrotu do
  betoniarni;
- jedna gruszka nie może mieć dwóch nakładających się cykli;
- gruszka jest ponownie dostępna od dokładnej minuty zakończenia powrotu, więc
  kolejny załadunek może zacząć się dokładnie w tej samej minucie;
- kursy są rozpatrywane według rozpoczęcia załadunku, a przy równych godzinach
  zachowują stabilną kolejność wejściową;
- silnik najpierw ponownie wykorzystuje pierwszą wolną gruszkę o najniższym
  numerze, a gdy żadna nie jest dostępna, tworzy kolejny numer;
- numer gruszki jest technicznym oznaczeniem zasobu w harmonogramie, a nie
  stałym przypisaniem konkretnego samochodu, kierowcy ani numeru rejestracyjnego;
- identyfikatory techniczne mają format `GRUSZKA-001`, `GRUSZKA-002` itd.;
- 3C nie realizuje jeszcze trybu ograniczonej floty i nie przesuwa kursów z
  powodu liczby dostępnych pojazdów; należy to do 3E;
- formalne obliczenie i prezentacja minimalnej liczby potrzebnych gruszek
  pozostają osobnym punktem 3D, nawet jeżeli wynik przydziału 3C dostarcza dane
  potrzebne do tego obliczenia.

Moduł przydziału pozostaje częścią silnika i nie może zależeć od HTML ani
sposobu prezentacji tabeli operatora.

---

## 76. Minimalna liczba gruszek — zasady 3D

Dla ustalonych godzin kursów minimalna liczba gruszek jest równa liczbie
technicznych zasobów utworzonych przez przydział 3C. Kursy są rozpatrywane
według początku załadunku, a nowa gruszka powstaje wyłącznie wtedy, gdy żadna
wcześniejsza nie wróciła jeszcze do betoniarni. Taki wynik odpowiada największej
liczbie nakładających się pełnych cykli i jest najmniejszą flotą zdolną wykonać
plan bez zmiany godzin.

Obowiązują zasady:

- wynik jest udostępniany jawnie jako `minimalnaLiczbaGruszek`, a nie tylko
  pośrednio przez najwyższy numer w tabeli;
- pusty plan i plan bez kursów wymagają `0` gruszek;
- ponowne przeliczenie identycznego planu daje identyczny wynik;
- zmiana godzin, czasów cyklu, rytmu, ilości betonu albo pojemności gruszki
  przelicza wynik od nowa razem z całym harmonogramem;
- liczba jest widoczna w podsumowaniu operatora i komunikacie po przeliczeniu;
- 3D nie pyta jeszcze, ile gruszek operator rzeczywiście posiada, nie ogranicza
  przydziału i nie przesuwa kursów; ten zakres pozostaje w 3E.

---

## 77. Ograniczona flota gruszek — zasady 3E

Operator może pracować w jednym z dwóch jawnych trybów:

- **Oblicz, ile potrzeba** — dotychczasowy tryb bez ograniczenia floty;
- **Mam określoną liczbę** — tryb ograniczający przydział do podanej liczby
  technicznych gruszek.

W trybie ograniczonym obowiązują zasady:

- liczba dostępnych gruszek musi być liczbą całkowitą nie mniejszą niż `0`;
- minimalna liczba obliczona według 3D pozostaje osobnym wynikiem i punktem
  odniesienia; podanie mniejszej floty nie może jej nadpisywać;
- kursy są nadal rozpatrywane według planowanego rozpoczęcia załadunku, a przy
  równych godzinach zachowują stabilną kolejność wejściową;
- jeżeli o planowanej godzinie istnieje wolna gruszka, kurs nie jest przesuwany;
- jeżeli wszystkie podane gruszki są zajęte, kurs otrzymuje pojazd wracający
  najwcześniej, a rozpoczęcie załadunku zostaje przesunięte do chwili jego
  dostępności;
- przesunięcie obejmuje spójnie cały cykl: załadunek, dojazd, rozładunek,
  powrót i ponowną gotowość; żaden kurs nie może rozpocząć się wcześniej niż
  wynikało z planu;
- operator widzi nową godzinę, liczbę minut opóźnienia i pierwotną planowaną
  godzinę rozładunku; program nie może ukrywać skutku niedoboru floty;
- dla `0` dostępnych gruszek kursy pozostają nieprzydzielone i powstaje jawny
  konflikt zamiast fikcyjnego harmonogramu;
- tryb i liczba dostępnych gruszek są częścią pamięci planu i zapisów
  historycznych;
- `StartPlanowany` pozostaje nienaruszony.

3E tworzy deterministyczny harmonogram kursów ograniczony wyłącznie liczbą
gruszek. Docelowe priorytety pomiędzy budowami, formalne konflikty przekroczenia
limitu opóźnienia, połączenie ograniczeń gruszek i pomp oraz korekty
`StartRoboczy` całych budów pozostają zakresem Etapu 5.

## 78. Sterowanie flotą znajduje się przy wyniku harmonogramu

Tryb pracy gruszek i liczba rzeczywiście dostępnych pojazdów są podstawowymi
danymi używanymi podczas oceny gotowego harmonogramu. Dlatego kontrolki
**Tryb pracy** i **Liczba gruszek** znajdują się w nagłówku sekcji
**Dzisiejszy harmonogram**, obok liczników wyniku, a nie w bocznym panelu
ogólnych parametrów.

Zmiana położenia nie zmienia zasad obliczeń, walidacji ani pamięci planu.
Po zmianie wartości operator nadal świadomie uruchamia pełne przeliczenie
przyciskiem **Przelicz harmonogram**.

## 79. Gruszki i pompy mają wspólne sterowanie zasobami przy wyniku

Po wdrożeniu Etapu 4 obecny panel sterowania flotą zostanie rozszerzony do
kompaktowego panelu **Sterowanie zasobami**. Gruszki pozostają w pierwszym
wierszu, a pompy pojawiają się bezpośrednio pod nimi, jeżeli układ zachowuje
czytelność i estetykę na ekranie operatora.

Wiersz pomp ma pokazywać co najmniej:

- tryb `Oblicz, ile potrzeba` albo `Mam określoną liczbę`,
- liczbę pomp potrzebnych,
- liczbę pomp, którymi operator dysponuje,
- skróconą informację o dostępności.

Godzina **Dostępna od** jest cechą konkretnej pompy, a nie jedną wspólną
godziną całej floty. Panel może pokazać zwięzłe podsumowanie, np. ile pomp jest
dostępnych teraz i ile dołączy później, natomiast szczegóły pozostają na liście
pomp. Układ ma pozostać responsywny i nie może przenosić logiki obliczeniowej do
HTML ani CSS.

## 80. Ręczna korekta godziny budowy bez ponownego importu

Operator może zmienić godzinę rozpoczęcia wybranej budowy bez ponownego
wczytywania CSV. Program rozdziela trzy znaczenia:

- `StartPlanowany` — niezmienna godzina źródłowa z KDX/CSV albo godzina bazowa
  budowy dodanej ręcznie;
- `StartZadany` — bieżąca godzina oczekiwana przez operatora i używana jako
  punkt wejścia do następnego przeliczenia;
- `StartRoboczy` — rzeczywista godzina możliwa do wykonania po uwzględnieniu
  ograniczeń harmonogramu.

Interfejs pokazuje wartość zadaną w edytowalnym polu, a obok zachowuje widoczną
godzinę planowaną oraz przycisk `↺` przywracający wartość źródłową. Zmiana albo
przywrócenie oznacza wynik jako nieaktualny, wymaga świadomego przeliczenia i
jest zapisywane w pamięci planu oraz historii. Program nie może bez śladu
nadpisać `StartPlanowany`.

## 81. Kwalifikacja budów wymagających pompy

Do niezależnego silnika pomp kwalifikują się wyłącznie budowy, których
znormalizowane pole `rodzajRozladunku` ma wartość `pompa`.

Budowy oznaczone jako odbiór własny, lej, wywrotka albo taczka nie wymagają
przydziału pompy. Starsze dane bez pola rodzaju rozładunku, pusta wartość oraz
wartość nierozpoznana również nie mogą być po cichu uznane za pompowanie.

Kwalifikacja opiera się wyłącznie na rodzaju rozładunku. Nie zmienia godzin,
ilości betonu, statusu realizacji ani kursów gruszek. Zasady tworzenia okresu
zajętości dla budów zakończonych lub bez dodatniej ilości betonu należą do 4D.
Podetap 4A.1 nie przydziela jeszcze konkretnej pompy i nie zmienia
`StartRoboczy`.

## 82. Wysięg jest cechą pompy i wymaganiem konkretnej budowy

Podstawowy wysięg pompy i standardowe wymaganie budowy wynoszą `32 m`, ponieważ
takie pompy są podstawowym zasobem operatora. Nowa pompa otrzymuje wysięg
`32 m`, a nowa budowa zakwalifikowana jako `pompa` otrzymuje wymaganie `32 m`.
Starsze puste wartości są przy odtworzeniu planu automatycznie uzupełniane tym
standardem.

Każda pompa na liście zasobów nadal może mieć własny wysięg podany w metrach.
W wierszu budowy standard jest pokazany jako zwarty opis **Pompa · 32 m**.
Operator zaznacza **Większa pompa** tylko dla budowy wymagającej dłuższego
wysięgu; dopiero wtedy pojawia się pole przyjmujące wartość większą niż `32 m`.
Odznaczenie przywraca standard `32 m`. W przyszłym przydziale pompa będzie
pasowała do budowy tylko wtedy, gdy jej wysięg nie jest mniejszy od wymagania.

Godzina **Dostępna od**, typ, aktywność i wysięg należą do konkretnej pompy i są
zapisywane w planie dnia. Wymagany wysięg należy do konkretnej budowy. Licznik
potrzebnych pomp nie może być wyprowadzany z samej liczby wpisanych zasobów — ma
pozostać nieustalony do czasu wdrożenia okresów zajętości i minimalnej floty.

## 83. Czasy obsługi pompy zależą od wysięgu i mogą mieć wyjątek budowy

Dla standardowej pompy i standardowego wymagania `32 m` przyjmujemy:

- `20 min` na rozstawienie pompy przed rozpoczęciem pierwszego rozładunku;
- `30 min` po zakończeniu ostatniego rozładunku na składanie, mycie i
  przygotowanie do wyjazdu. W tym łącznym czasie mieści się około `20 min`
  przeznaczone na samo mycie.

Dla pompy o większym wymaganym wysięgu program dodaje `5 min` zarówno do czasu
przygotowania, jak i do czasu po pracy za każde rozpoczęte dodatkowe `10 m`
ponad `32 m`. Przykładowo wymaganie `36 m` daje czasy `25/35 min`, a wymaganie
większe niż `42 m` rozpoczyna kolejny przedział i daje `30/40 min`.

Oba wyliczone czasy są wartościami domyślnymi dla konkretnej budowy. Operator
może je ręcznie nadpisać, ponieważ rzeczywisty czas zależy również od operatora
pompy i warunków na miejscu. Usunięcie wyjątku przywraca automatyczne czasy
wynikające z wymaganego wysięgu.

Właściwy czas pompowania nie jest wpisywany jako stała liczba. Zaczyna się wraz
z rozpoczęciem pierwszego rozładunku i kończy wraz z zakończeniem ostatniego
rozładunku tej samej budowy. Utworzenie z tych składników pełnego przedziału
zajętości pompy pozostaje zakresem 4D.

## 84. Wynik pomp jest niezależny i nie nadpisuje planu wejściowego

Silnik pomp ma własny, stabilny wynik oddzielony od wyniku gruszek. Dla każdej
budowy zakwalifikowanej do pompowania przechowuje osobno:

- identyfikator budowy i status przydziału;
- źródłowy `StartPlanowany`, bieżący `StartZadany` oraz roboczy start istniejący
  przed uwzględnieniem pompy;
- przydzieloną pompę;
- pełny okres zajętości;
- najwcześniejszy możliwy start;
- opóźnienie oraz skutek ewentualnego niedoboru pomp.

Brak wykonanego jeszcze obliczenia jest oznaczany wartością `null` i statusem
`oczekuje-na-obliczenie`. Nie wolno używać w tym miejscu `0`, ponieważ zero ma
oznaczać rzeczywiście obliczony brak potrzebnych pomp albo brak opóźnienia.

Tworzenie wyniku nie zmienia budów, kursów ani listy pomp. Dane zasobów są
kopiowane, a wynik pomp nie nadpisuje `StartPlanowany`, `StartZadany` ani
`StartRoboczy`. Podetapy 4D–4H będą stopniowo wypełniały przygotowane pola.
Podłączenie rzeczywistego wyniku do `przeliczCalyHarmonogram()` pozostaje
zakresem 4I.1, a wspólne korygowanie pomp i gruszek — Etapu 5.

---

# Powiązane tematy otwarte

Pomysły, warianty i pytania, które nie są jeszcze obowiązującymi decyzjami, są prowadzone w `POMYSLY_I_BACKLOG.md`. Dzięki temu ten dokument pozostaje jednoznacznym źródłem zatwierdzonych ustaleń.

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
