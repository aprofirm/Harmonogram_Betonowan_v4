# TESTY — ETAP 4F.0

## Zakres

Podetap **4F.0 — okno dostępności pomp** przygotowuje model zasobu przed
właściwym przydziałem 4F.1–4F.2.

Test `testy/etap_4f_0.test.js` potwierdza:

1. puste **Dostępna od** i **Dostępna do** oznaczają brak ograniczeń;
2. samo **Dostępna od** blokuje rozpoczęcie pełnego cyklu przed wskazaną godziną;
3. samo **Dostępna do** pozwala rozpocząć cykl dokładnie o tej godzinie;
4. rozpoczęty na czas cykl może zakończyć się po **Dostępna do**, a wynik
   zachowuje liczbę minut przekroczenia do późniejszego komunikatu operatora;
5. kolejny cykl rozpoczynający się po **Dostępna do** jest odrzucany;
6. starsze pole `typ` może zostać zachowane jako metadana, ale nie jest
   kryterium wyboru pompy;
7. wysięg pozostaje właściwością zasobu i jest zachowywany w pamięci;
8. nowe pompy nie dziedziczą już automatycznie początku dnia jako
   `dostepnaOd`;
9. panel pokazuje **Dostępna od**, **Dostępna do**, **Wysięg (m)** i
   aktywność, bez pola wyboru własna/zewnętrzna;
10. oba nowe moduły są ładowane lokalnie przed `js/aplikacja.js` i nie
    wprowadzają zależności sieciowej.

## Test operatora

Dla 4F.0 zapisano wyjątek od osobnego testu operatorskiego: ten krok nie
uruchamia jeszcze przydziału pomp ani nie zmienia godzin budów. Widoczność i
podłączenie pól są kontrolowane automatycznie, a pełny test operatorski
dostępności, przydziału i ostrzeżeń pozostaje częścią 4J.3.
