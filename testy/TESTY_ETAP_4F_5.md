# TESTY — ETAP 4F.5 — integracja niezależnego przydziału pomp

## Zakres

4F.5 sprawdza razem reguły przygotowane w 4F.1–4F.4. Nie dodaje nowego
mechanizmu biznesowego; jego zadaniem jest potwierdzenie, że kolejność budów,
wybór pierwszej pasującej pompy, brak nakładania pełnych cykli oraz wyliczenie
najwcześniejszego możliwego startu współdziałają w jednym scenariuszu.

## Test automatyczny

Uruchom:

```bash
node testy/etap_4f_5.test.js
```

Test obejmuje jednocześnie:

- wiele budów wymagających pomp,
- dwie budowy z równym planowanym początkiem i zachowanie kolejności wejściowej,
- pompę wyłączoną,
- pompę o niewystarczającym wysięgu,
- pompę 42 m z jej wydłużonym pełnym cyklem,
- brak możliwości wykonania jednej budowy zgodnie z planem,
- wyliczenie najwcześniejszego startu po zakończeniu poprzedniej pracy i przejeździe,
- ponowne użycie pompy na późniejszej budowie z uwzględnieniem czasu przejazdu,
- identyczny wynik dwóch kolejnych przeliczeń tych samych danych,
- brak modyfikacji wejściowych budów, kursów i listy pomp.

Po teście 4F.5 należy uruchomić pełną regresję wszystkich `testy/*.test.js`.
Zaliczenie 4F.5 zamyka cały punkt 4F.

## Test operatora

Osobny test operatora nie jest wymagany w 4F.5. Niezależny przydział pomp nie
jest jeszcze podłączony do centralnego wyniku harmonogramu ani do docelowego
widoku operatora. Test operatorski pozostaje zakresem 4J.3.
