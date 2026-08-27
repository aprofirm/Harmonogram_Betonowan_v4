# TESTY — ETAP 4F.4 — najwcześniejszy możliwy start

## Zakres

4F.4 nie przesuwa automatycznie budowy ani kursów gruszek. Jeżeli żadna pompa
nie może obsłużyć planowanej godziny, silnik wylicza informację pomocniczą:
najwcześniejszy możliwy start betonowania, liczbę minut przesunięcia, pompę,
która może być gotowa najwcześniej, oraz dokładną przyczynę ograniczenia.

## Test automatyczny

Uruchom:

```bash
node testy/etap_4f_4.test.js
```

Test sprawdza:

- zajętą pompę oraz czas przejazdu między budowami,
- ograniczenie `Dostępna od`,
- wybór pompy dającej najwcześniejszy start spośród kilku kandydatów,
- brak wymyślania godziny, gdy nie ma aktywnej pompy o wymaganym wysięgu,
- zachowanie dokładnej przyczyny i listy ograniczeń,
- brak modyfikacji wejściowych budów, kursów i listy pomp.

Po teście 4F.4 należy uruchomić pełną regresję wszystkich `testy/*.test.js` oraz
kontrolę składni śledzonych plików JavaScript.

## Test operatora

Osobny test operatora nie jest wymagany w 4F.4, ponieważ wynik przydziału pomp
nie jest jeszcze podłączony do centralnego wyniku harmonogramu ani interfejsu.
Pełny test operatorski przydziału i informacji dla operatora pozostaje częścią
4J.3.
