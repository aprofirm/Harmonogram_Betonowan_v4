# Testy Etapu 4F.3 — brak nakładania pracy pompy

## Cel

Potwierdzić, że jedna pompa nie otrzymuje dwóch budów, których pełne okresy
zajętości kolidują. Kontrola obejmuje przygotowanie, całe betonowanie oraz
czynności po ostatnim rozładunku, a nie tylko same godziny pompowania.

## Zakres automatyczny

Plik `testy/etap_4f_3.test.js` sprawdza:

- rozpoznanie częściowego i pełnego nakładania okresów;
- odrzucenie niepoprawnych granic okresu;
- wykrycie kolizji wynikającej z przygotowania i czynności po pracy także
  wtedy, gdy same rozładunki się nie nakładają;
- wybór innej pompy dla kolidującej budowy;
- jawny powód `pompa-zajeta` wraz z budową i okresem powodującym konflikt;
- możliwość użycia tej samej pompy, gdy poprzedni okres kończy się dokładnie
  w minucie rozpoczęcia następnego przygotowania i przejazd trwa `0 min`;
- zapis pełnej listy przydziałów każdej pompy do dalszej kontroli;
- brak modyfikowania wejściowych budów i kursów.

## Granica kroku

4F.3 nie przesuwa godzin budów. Gdy żadna pompa nie może rozpocząć pracy
zgodnie z planem, najwcześniejszą możliwą godzinę i wielkość przesunięcia
wyliczy 4F.4.

Osobny test operatora nie jest wymagany, ponieważ 4F.3 rozszerza niezależny
silnik, który nie jest jeszcze podłączony do centralnego wyniku ani widoku.
Pełny test operatorski przydziału pomp pozostaje częścią 4J.3.
