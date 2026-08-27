# Testy Etapu 4F.2 — pierwsza pasująca pompa

## Cel

Potwierdzić, że silnik przydziału pomp wybiera pierwszy zasób z listy, który
może rozpocząć daną budowę zgodnie z planem i spełnia wszystkie obowiązujące
ograniczenia techniczne oraz czasowe.

## Zakres automatyczny

Plik `testy/etap_4f_2.test.js` sprawdza:

- pominięcie pompy nieaktywnej,
- odrzucenie pompy o zbyt małym wysięgu,
- wybór pierwszej kolejnej pasującej pompy bez sortowania po nazwie lub typie,
- neutralność starszego pola `typ` własna/zewnętrzna,
- respektowanie `Dostępna od` i `Dostępna do`,
- możliwość dokończenia cyklu rozpoczętego dokładnie o `Dostępna do` wraz z
  zachowaniem liczby minut przekroczenia,
- ponowne użycie tej samej pompy na kolejnej budowie, gdy pełny cykl i przejazd
  pozwalają rozpocząć przygotowanie zgodnie z planem,
- odrzucenie wcześniej użytej pompy, gdy przejazd uniemożliwia planowy start,
- jawny brak trasy bez wymyślania wartości zastępczej,
- pozostawienie budowy jako `brak-pasujacej-pompy`, gdy żaden zasób nie spełnia
  warunków,
- brak modyfikowania danych wejściowych budów i kursów.

## Granica kroku

4F.2 nie przesuwa jeszcze godzin budów i nie oblicza najwcześniejszego
alternatywnego startu. Szczegółowe domknięcie granic nakładania pełnych okresów
należy do 4F.3, a wyliczenie najwcześniejszego możliwego startu do 4F.4.

## Regresja

Po wdrożeniu uruchamiamy wszystkie pliki `testy/*.test.js`. Dopiero poprawny
wynik całej regresji pozwala oznaczyć 4F.2 jako zakończony.
