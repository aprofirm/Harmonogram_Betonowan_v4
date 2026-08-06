# ZASADY KODU

Ten plik zawiera stale zasady tworzenia i modyfikowania kodu w repozytorium. Przed rozpoczeciem pracy nad kodem nalezy go przeczytac i stosowac sie do ponizszych zasad.

## 1. Najwazniejsza zasada: kod ma byc czytelny

Kod ma byc zrozumialy takze dla osoby, ktora nie jest programista. Czytelnosc i prostota sa wazniejsze niz skrocenie kodu o kilka linii albo zastosowanie bardziej "sprytnego" rozwiazania.

Jesli dwa rozwiazania dzialaja tak samo, wybieramy to, ktore latwiej przeczytac, wyjasnic i pozniej zmodyfikowac.

## 2. Nazwy po polsku, proste i opisowe

Nazwy klas, obiektow, zmiennych, funkcji, metod, stalych, plikow i innych elementow kodu powinny byc przede wszystkim po polsku oraz jasno opisywac swoje przeznaczenie.

Dobre przyklady:

- `czasPowrotuGruszki`
- `listaBetonowan`
- `dostepnePompy`
- `godzinaRozpoczecia`
- `obliczCzasPrzejazdu()`
- `przydzielGruszkeDoKursu()`
- `sprawdzDostepnoscPompy()`

Zle przyklady:

- `x`
- `q`
- `tmp`
- `obj`
- `data1`
- `res`
- `val`
- `foo`
- `bar`

Nie uzywamy jednoliterowych nazw pomocniczych typu `i`, `j`, `x`, `q`, jezeli mozna zastosowac nazwe opisowa, np. `indeksBetonowania`, `numerKursu`, `indeksGruszki`.

## 3. Polskie nazwy bez polskich znakow w identyfikatorach

Nazwy w kodzie maja byc po polsku, ale bez znakow diakrytycznych, aby unikac problemow z kompatybilnoscia narzedzi i systemow.

Przyklad:

- `iloscBetonu` zamiast `ilośćBetonu`
- `czasOpoznienia` zamiast `czasOpóźnienia`

Teksty widoczne dla uzytkownika powinny natomiast byc zapisane poprawna polszczyzna z polskimi znakami.

## 4. Jedna funkcja powinna wykonywac jedno konkretne zadanie

Unikamy bardzo duzych funkcji wykonujacych wiele niezaleznych czynnosci.

Zamiast jednej funkcji, ktora jednoczesnie:

- odczytuje dane,
- przelicza harmonogram,
- przydziela pojazdy,
- rysuje wykres,
- pokazuje komunikaty,

nalezy podzielic logike na mniejsze, jasno nazwane funkcje.

## 5. Logika programu ma byc oddzielona od interfejsu

Silnik obliczeniowy nie powinien byc wymieszany z wygladem strony, przyciskami, HTML-em ani rysowaniem wykresow.

W projekcie powinno byc mozliwe niezalezne zrozumienie:

- danych wejsciowych,
- logiki biznesowej,
- obliczen,
- interfejsu,
- wizualizacji wynikow.

Dzieki temu zmiana wygladu strony nie powinna psuc silnika, a poprawka silnika nie powinna wymagac przebudowy interfejsu.

## 6. Najpierw sprawdzamy istniejacy kod, potem go zmieniamy

Przed kazda wieksza modyfikacja nalezy:

1. sprawdzic aktualny stan repozytorium,
2. znalezc miejsca zalezne od zmienianego kodu,
3. zrozumiec, co juz dziala,
4. dopiero wtedy wprowadzic zmiane.

Nie wolno zakladac, ze dany mechanizm nie istnieje, bez sprawdzenia kodu.

## 7. Nie przebudowujemy dzialajacych rzeczy bez potrzeby

Preferujemy najmniejsza bezpieczna zmiane, ktora rozwiazuje problem.

Nie przepisujemy calego modulu tylko dlatego, ze mozna go napisac inaczej. Refaktoryzacja ma miec konkretny powod i nie moze niepotrzebnie zwiekszac ryzyka nowych bledow.

## 8. Nowa funkcja nie moze psuc dotychczasowych funkcji

Po zmianach trzeba sprawdzic nie tylko nowa funkcje, ale rowniez dotychczasowe zachowanie programu.

Szczegolna uwage nalezy zwracac na:

- przypadki brzegowe,
- puste dane,
- niepelne dane,
- zle formaty danych,
- konflikt zasobow,
- ponowne przeliczanie,
- wielokrotne klikniecia,
- odswiezanie strony,
- wczytywanie kolejnych plikow.

## 9. Komentarze maja wyjasniac sens, a nie przepisywac kod

Komentarz powinien odpowiadac przede wszystkim na pytanie "dlaczego to jest zrobione w ten sposob?".

Nie dodajemy komentarzy do oczywistych instrukcji.

Komentarze sa szczegolnie wskazane przy:

- nietypowej logice biznesowej,
- ograniczeniach wynikajacych z przegladarki lub systemu,
- wyjatkach od standardowego zachowania,
- trudniejszych obliczeniach,
- mechanizmach zabezpieczajacych przed bledami.

## 10. Komunikaty o bledach maja byc zrozumiale

Uzytkownik powinien dostawac jasny komunikat po polsku, np.:

`Nie znaleziono kolumny z godzina rozpoczecia betonowania.`

zamiast enigmatycznego bledu technicznego.

Jesli to mozliwe, komunikat powinien rowniez wskazac, co uzytkownik moze zrobic dalej.

## 11. Bez magicznych liczb i ukrytych zalozen

Wartosci majace znaczenie biznesowe lub konfiguracyjne nie powinny byc porozrzucane bez opisu po kodzie.

Zamiast:

`if (czas > 20)`

lepiej zastosowac opisowa stala, np.:

`MAKSYMALNY_CZAS_OCZEKIWANIA_MINUTY`

Kazda taka wartosc powinna miec jasne znaczenie i jedno miejsce, w ktorym mozna ja zmienic.

## 12. Nie dodajemy zbednych bibliotek i technologii

Kazda dodatkowa biblioteka zwieksza zlozonosc projektu.

Najpierw sprawdzamy, czy dana funkcje mozna wykonac prosto przy uzyciu technologii, ktore projekt juz posiada.

Nie dodajemy frameworka, serwera, bazy danych ani zewnetrznej uslugi tylko dlatego, ze jest popularna.

## 13. Projekty WWW maja miec jak najmniej zewnetrznych zaleznosci

Jesli aplikacja ma dzialac offline albo w sieci z ograniczonym dostepem do internetu, jej podstawowe funkcje nie moga wymagac:

- CDN,
- zewnetrznych skryptow,
- zewnetrznych API,
- logowania do obcej uslugi,
- polaczenia z serwerem, jezeli nie jest ono rzeczywiscie potrzebne.

W takim projekcie potrzebne pliki i biblioteki powinny znajdowac sie razem z aplikacja.

## 14. Dane uzytkownika traktujemy ostroznie

Nie zapisujemy w repozytorium:

- hasel,
- tokenow,
- kluczy API,
- danych logowania,
- sekretow,
- prywatnych danych produkcyjnych, jezeli nie jest to swiadomie uzgodnione.

Do testow preferujemy dane sztuczne lub zanonimizowane.

## 15. Zmiany powinny byc latwe do przejrzenia

Duza zmiane nalezy, jesli to mozliwe, dzielic na logiczne etapy.

Kazdy etap powinien miec jasny cel, tak aby po czasie bylo wiadomo:

- co zostalo zmienione,
- po co zostalo zmienione,
- jaki problem rozwiazuje.

Komunikaty commitow powinny byc krotkie, ale konkretne.

## 16. Struktura plikow ma wynikac z odpowiedzialnosci

Pliki powinny miec proste, opisowe nazwy i grupowac powiazana logike.

Przyklad dla projektu WWW:

- `import_csv.js`
- `budowy.js`
- `gruszki.js`
- `pompy.js`
- `harmonogram.js`
- `rysowanie_harmonogramu.js`

Unikamy plikow typu `utils2.js`, `misc.js`, `temp.js`, jezeli ich przeznaczenie da sie nazwac konkretnie.

## 17. Kod ma byc przygotowany do dalszego rozwoju

Nie oznacza to budowania skomplikowanej architektury na zapas.

Chodzi o to, aby nowe funkcje mozna bylo dodawac bez niszczenia obecnej logiki. Najpierw prostota, potem rozszerzalnosc tam, gdzie rzeczywiscie jest potrzebna.

## 18. Kazda zmiana ma miec jasny powod biznesowy

Nie zmieniamy kodu tylko dlatego, ze "tak jest nowoczesniej" albo "tak robi framework".

Zmiana powinna poprawiac przynajmniej jeden z obszarow:

- poprawne dzialanie,
- niezawodnosc,
- czytelnosc,
- wygode uzytkownika,
- wydajnosc,
- bezpieczenstwo,
- mozliwosc dalszego rozwoju.

## 19. Priorytet: prostota obslugi

Interfejs powinien ograniczac liczbe czynnosci wykonywanych przez uzytkownika.

Jesli cos mozna bezpiecznie wykryc, obliczyc albo podpowiedziec automatycznie, program powinien to zrobic zamiast wymagac dodatkowych klikniec.

Nie oznacza to jednak wykonywania nieodwracalnych lub ryzykownych czynnosci bez wiedzy uzytkownika.

## 20. Zasada koncowa

Kod ma byc przede wszystkim:

**prosty, opisowy, bezpieczny, czytelny i mozliwy do zrozumienia po kilku miesiacach bez ponownego uczenia sie calego projektu.**

Jesli rozwiazanie jest technicznie efektowne, ale utrudnia zrozumienie projektu, nalezy wybrac prostsze rozwiazanie.
