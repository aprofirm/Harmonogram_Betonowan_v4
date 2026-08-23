# Plan testów — KP-4: ręczna korekta godziny budowy

## Status

KP-4 jest zaplanowany i nie został jeszcze zaimplementowany. Następny podetap
to **KP-4.1 — model `StartPlanowany`, `StartZadany` i `StartRoboczy`**.

## Zasada

- `StartPlanowany` zachowuje godzinę źródłową;
- `StartZadany` jest bieżącą godziną oczekiwaną przez operatora;
- `StartRoboczy` pokazuje godzinę możliwą do wykonania po uwzględnieniu silnika.

Operator może zmienić tylko wartość zadaną. Program nie nadpisuje godziny
źródłowej, a przycisk `↺` przywraca ją bez ponownego importu CSV.

## Test automatyczny

Test powinien potwierdzić:

1. nowa budowa otrzymuje `StartZadany` równy `StartPlanowany`;
2. ręczna korekta jednej budowy nie zmienia `StartPlanowany`;
3. poprawiona godzina jest używana przy następnym przeliczeniu;
4. przycisk przywrócenia odtwarza godzinę źródłową tylko wybranej budowy;
5. błędny format, pusta wartość i nieistniejąca budowa dają czytelny błąd;
6. zmiana i przywrócenie oznaczają wcześniejszy wynik jako nieaktualny;
7. korekta jest zapisywana w bieżącym planie i historii;
8. korekta zostaje odtworzona po odświeżeniu;
9. starszy zapis bez `StartZadany` przyjmuje bezpiecznie `StartPlanowany`;
10. kolejny import nie pozostawia korekt należących do poprzedniego planu;
11. `StartRoboczy` pozostaje osobnym polem wyniku i nie nadpisuje źródła;
12. wszystkie wcześniejsze testy Etapu 3 nadal przechodzą.

## Test operatora KP-4.5

1. Wczytaj plan i zapamiętaj źródłową godzinę wybranej budowy.
2. Zmień **Start do przeliczenia** na inną poprawną godzinę.
3. Sprawdź oznaczenie wyniku jako nieaktualnego i przelicz harmonogram.
4. Potwierdź zmianę godzin kursów wyłącznie dla właściwej budowy.
5. Odśwież stronę i sprawdź odtworzenie korekty.
6. Użyj `↺`, przelicz i potwierdź powrót do godziny źródłowej.
7. Wczytaj kolejny CSV i potwierdź brak korekty ze starego planu.

Dopiero po automatycznej regresji, publikacji i tym teście można zamknąć KP-4
oraz rozpocząć 4A.1.
