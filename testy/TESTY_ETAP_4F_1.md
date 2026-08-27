# Test 4F.1 — stabilna kolejność budów dla pomp

## Cel

Potwierdzić, że przed właściwym wyborem pompy silnik tworzy jedną,
deterministyczną kolejność rzeczywistych prac pompowych.

## Reguły sprawdzane automatycznie

- wcześniejszy planowany początek betonowania jest rozpatrywany wcześniej;
- przy tej samej minucie zachowana jest kolejność wejściowa budów;
- różny czas przygotowania pompy nie zmienia kolejności remisu;
- budowa niewymagająca pompy, z `0 m³`, zrealizowana albo bez okna pracy
  nie trafia do kolejki przydziału;
- wejściowa lista budów i kursów nie jest modyfikowana;
- ponowne uruchomienie dla tych samych danych daje tę samą kolejność;
- moduł jest ładowany po dostępności i przejazdach pomp.

Automatyczny test:

    node testy/etap_4f_1.test.js

4F.1 nie wybiera jeszcze konkretnej pompy i nie wymaga osobnego testu
operatora. Pierwszy rzeczywisty wybór zasobu należy do 4F.2, a pełny test
operatorski Etapu 4 pozostaje w 4J.3.
