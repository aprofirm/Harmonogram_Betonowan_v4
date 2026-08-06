# ZASADY KODU

Ten plik zawiera stałe zasady tworzenia i modyfikowania kodu w repozytorium. Przed rozpoczęciem pracy nad kodem należy go przeczytać i stosować się do poniższych zasad.

## 1. Najważniejsza zasada: kod ma być czytelny

Kod ma być zrozumiały także dla osoby, która nie jest programistą. Czytelność i prostota są ważniejsze niż skrócenie kodu o kilka linii albo zastosowanie bardziej „sprytnego” rozwiązania.

Jeśli dwa rozwiązania działają tak samo, wybieramy to, które łatwiej przeczytać, wyjaśnić i później zmodyfikować.

## 2. Nazwy po polsku, proste i opisowe

Nazwy klas, obiektów, zmiennych, funkcji, metod, stałych, plików i innych elementów kodu powinny być przede wszystkim po polsku oraz jasno opisywać swoje przeznaczenie.

Dobre przykłady:

- `czasPowrotuGruszki`
- `listaBetonowan`
- `dostepnePompy`
- `godzinaRozpoczecia`
- `obliczCzasPrzejazdu()`
- `przydzielGruszkeDoKursu()`
- `sprawdzDostepnoscPompy()`

Złe przykłady:

- `x`
- `q`
- `tmp`
- `obj`
- `data1`
- `res`
- `val`
- `foo`
- `bar`

Nie używamy jednoliterowych nazw pomocniczych typu `i`, `j`, `x`, `q`, jeżeli można zastosować nazwę opisową, np. `indeksBetonowania`, `numerKursu`, `indeksGruszki`.

## 3. Polskie nazwy bez polskich znaków w identyfikatorach

Nazwy w kodzie mają być po polsku, ale bez znaków diakrytycznych, aby unikać problemów z kompatybilnością narzędzi i systemów.

Przykład:

- `iloscBetonu` zamiast `ilośćBetonu`
- `czasOpoznienia` zamiast `czasOpóźnienia`

Teksty widoczne dla użytkownika powinny natomiast być zapisane poprawną polszczyzną z polskimi znakami.

## 4. Jedna funkcja powinna wykonywać jedno konkretne zadanie

Unikamy bardzo dużych funkcji wykonujących wiele niezależnych czynności.

Zamiast jednej funkcji, która jednocześnie:

- odczytuje dane,
- przelicza harmonogram,
- przydziela pojazdy,
- rysuje wykres,
- pokazuje komunikaty,

należy podzielić logikę na mniejsze, jasno nazwane funkcje.

## 5. Logika programu ma być oddzielona od interfejsu

Silnik obliczeniowy nie powinien być wymieszany z wyglądem strony, przyciskami, HTML-em ani rysowaniem wykresów.

W projekcie powinno być możliwe niezależne zrozumienie:

- danych wejściowych,
- logiki biznesowej,
- obliczeń,
- interfejsu,
- wizualizacji wyników.

Dzięki temu zmiana wyglądu strony nie powinna psuć silnika, a poprawka silnika nie powinna wymagać przebudowy interfejsu.

## 6. Najpierw sprawdzamy istniejący kod, potem go zmieniamy

Przed każdą większą modyfikacją należy:

1. sprawdzić aktualny stan repozytorium,
2. znaleźć miejsca zależne od zmienianego kodu,
3. zrozumieć, co już działa,
4. dopiero wtedy wprowadzić zmianę.

Nie wolno zakładać, że dany mechanizm nie istnieje, bez sprawdzenia kodu.

## 7. Nie przebudowujemy działających rzeczy bez potrzeby

Preferujemy najmniejszą bezpieczną zmianę, która rozwiązuje problem.

Nie przepisujemy całego modułu tylko dlatego, że można go napisać inaczej. Refaktoryzacja ma mieć konkretny powód i nie może niepotrzebnie zwiększać ryzyka nowych błędów.

## 8. Nowa funkcja nie może psuć dotychczasowych funkcji

Po zmianach trzeba sprawdzić nie tylko nową funkcję, ale również dotychczasowe zachowanie programu.

Szczególną uwagę należy zwracać na:

- przypadki brzegowe,
- puste dane,
- niepełne dane,
- złe formaty danych,
- konflikt zasobów,
- ponowne przeliczanie,
- wielokrotne kliknięcia,
- odświeżanie strony,
- wczytywanie kolejnych plików.

## 9. Komentarze mają wyjaśniać sens, a nie przepisywać kod

Komentarz powinien odpowiadać przede wszystkim na pytanie „dlaczego to jest zrobione w ten sposób?”.

Nie dodajemy komentarzy do oczywistych instrukcji.

Komentarze są szczególnie wskazane przy:

- nietypowej logice biznesowej,
- ograniczeniach wynikających z przeglądarki lub systemu,
- wyjątkach od standardowego zachowania,
- trudniejszych obliczeniach,
- mechanizmach zabezpieczających przed błędami.

## 10. Komunikaty o błędach mają być zrozumiałe

Użytkownik powinien dostawać jasny komunikat po polsku, np.:

`Nie znaleziono kolumny z godziną rozpoczęcia betonowania.`

zamiast enigmatycznego błędu technicznego.

Jeśli to możliwe, komunikat powinien również wskazać, co użytkownik może zrobić dalej.

## 11. Bez magicznych liczb i ukrytych założeń

Wartości mające znaczenie biznesowe lub konfiguracyjne nie powinny być porozrzucane bez opisu po kodzie.

Zamiast:

`if (czas > 20)`

lepiej zastosować opisową stałą, np.:

`MAKSYMALNY_CZAS_OCZEKIWANIA_MINUTY`

Każda taka wartość powinna mieć jasne znaczenie i jedno miejsce, w którym można ją zmienić.

## 12. Nie dodajemy zbędnych bibliotek i technologii

Każda dodatkowa biblioteka zwiększa złożoność projektu.

Najpierw sprawdzamy, czy daną funkcję można wykonać prosto przy użyciu technologii, które projekt już posiada.

Nie dodajemy frameworka, serwera, bazy danych ani zewnętrznej usługi tylko dlatego, że jest popularna.

## 13. Projekty WWW mają mieć jak najmniej zewnętrznych zależności

Jeśli aplikacja ma działać offline albo w sieci z ograniczonym dostępem do internetu, jej podstawowe funkcje nie mogą wymagać:

- CDN,
- zewnętrznych skryptów,
- zewnętrznych API,
- logowania do obcej usługi,
- połączenia z serwerem, jeżeli nie jest ono rzeczywiście potrzebne.

W takim projekcie potrzebne pliki i biblioteki powinny znajdować się razem z aplikacją.

## 14. Dane użytkownika traktujemy ostrożnie

Nie zapisujemy w repozytorium:

- haseł,
- tokenów,
- kluczy API,
- danych logowania,
- sekretów,
- prywatnych danych produkcyjnych, jeżeli nie jest to świadomie uzgodnione.

Do testów preferujemy dane sztuczne lub zanonimizowane.

## 15. Zmiany powinny być łatwe do przejrzenia

Dużą zmianę należy, jeśli to możliwe, dzielić na logiczne etapy.

Każdy etap powinien mieć jasny cel, tak aby po czasie było wiadomo:

- co zostało zmienione,
- po co zostało zmienione,
- jaki problem rozwiązuje.

Komunikaty commitów powinny być krótkie, ale konkretne.

## 16. Struktura plików ma wynikać z odpowiedzialności

Pliki powinny mieć proste, opisowe nazwy i grupować powiązaną logikę.

Przykład dla projektu WWW:

- `import_csv.js`
- `budowy.js`
- `gruszki.js`
- `pompy.js`
- `harmonogram.js`
- `rysowanie_harmonogramu.js`

Unikamy plików typu `utils2.js`, `misc.js`, `temp.js`, jeżeli ich przeznaczenie da się nazwać konkretnie.

## 17. Kod ma być przygotowany do dalszego rozwoju

Nie oznacza to budowania skomplikowanej architektury na zapas.

Chodzi o to, aby nowe funkcje można było dodawać bez niszczenia obecnej logiki. Najpierw prostota, potem rozszerzalność tam, gdzie rzeczywiście jest potrzebna.

## 18. Każda zmiana ma mieć jasny powód biznesowy

Nie zmieniamy kodu tylko dlatego, że „tak jest nowocześniej” albo „tak robi framework”.

Zmiana powinna poprawiać przynajmniej jeden z obszarów:

- poprawne działanie,
- niezawodność,
- czytelność,
- wygodę użytkownika,
- wydajność,
- bezpieczeństwo,
- możliwość dalszego rozwoju.

## 19. Priorytet: prostota obsługi

Interfejs powinien ograniczać liczbę czynności wykonywanych przez użytkownika.

Jeśli coś można bezpiecznie wykryć, obliczyć albo podpowiedzieć automatycznie, program powinien to zrobić zamiast wymagać dodatkowych kliknięć.

Nie oznacza to jednak wykonywania nieodwracalnych lub ryzykownych czynności bez wiedzy użytkownika.

## 20. Zasada końcowa

Kod ma być przede wszystkim:

**prosty, opisowy, bezpieczny, czytelny i możliwy do zrozumienia po kilku miesiącach bez ponownego uczenia się całego projektu.**

Jeśli rozwiązanie jest technicznie efektowne, ale utrudnia zrozumienie projektu, należy wybrać prostsze rozwiązanie.
