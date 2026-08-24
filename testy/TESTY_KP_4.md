# Plan testów — KP-4: ręczna korekta godziny budowy

## Status

Wszystkie podetapy **KP-4.1–KP-4.5** są zakończone. Test
`testy/kp_4.test.js` obejmuje model i wpływ korekty na godziny kursu, a
`testy/pamiec_aplikacji.test.js` sprawdza pole w tabeli, zmianę, zapis bieżącego
planu i historii, odświeżenie, błędną próbę, przywrócenie, kolejny import oraz
migrację starszego planu. Pełna regresja, publikacja oraz test operatora zostały
zaliczone 2026-08-24. Cały KP-4 jest zamknięty.

## Zasada

- `StartPlanowany` zachowuje godzinę źródłową;
- `StartZadany` jest bieżącą godziną oczekiwaną przez operatora;
- `StartRoboczy` pokazuje godzinę możliwą do wykonania po uwzględnieniu silnika.

Operator może zmienić tylko wartość zadaną. Program nie nadpisuje godziny
źródłowej, a przycisk `↺` przywraca ją bez ponownego importu CSV.

## Test automatyczny

Test całego KP-4 powinien potwierdzić:

1. [x] nowa budowa otrzymuje `StartZadany` równy `StartPlanowany`;
2. [x] ręczna korekta jednej budowy nie zmienia `StartPlanowany`;
3. [x] poprawiona godzina jest używana przy następnym przeliczeniu;
4. [x] przycisk przywrócenia odtwarza godzinę źródłową tylko wybranej budowy;
5. [x] błędny format, pusta wartość i nieistniejąca budowa dają czytelny błąd;
6. [x] zmiana i przywrócenie oznaczają wcześniejszy wynik jako nieaktualny;
7. [x] korekta jest zapisywana w bieżącym planie i historii;
8. [x] korekta zostaje odtworzona po odświeżeniu;
9. [x] starszy obiekt bez `StartZadany` przyjmuje bezpiecznie `StartPlanowany`;
10. [x] kolejny import nie pozostawia korekt należących do poprzedniego planu;
11. [x] `StartRoboczy` pozostaje osobnym polem wyniku i nie nadpisuje źródła;
12. [x] wszystkie wcześniejsze testy Etapu 3 nadal przechodzą.

## Test operatora KP-4.5

1. [x] Wczytaj plan i zapamiętaj źródłową godzinę wybranej budowy.
2. [x] Zmień **Start do przeliczenia** na inną poprawną godzinę.
3. [x] Sprawdź oznaczenie wyniku jako nieaktualnego i przelicz harmonogram.
4. [x] Potwierdź zmianę godzin kursów wyłącznie dla właściwej budowy.
5. [x] Odśwież stronę i sprawdź odtworzenie korekty.
6. [x] Użyj `↺`, przelicz i potwierdź powrót do godziny źródłowej.
7. [x] Wczytaj kolejny CSV i potwierdź brak korekty ze starego planu.

Automatyczna regresja, publikacja i test operatora zostały zakończone. KP-4 jest
zamknięty, a rozwój przeszedł do Etapu 4.
