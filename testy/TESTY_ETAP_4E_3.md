# TESTY — ETAP 4E.3

## Zakres

Podetap **4E.3 — niezależność przejazdów pomp od map** formalizuje granicę pomiędzy silnikiem harmonogramu a źródłem czasu przejazdu.

Silnik przejazdów pomp:

- otrzymuje gotowy `czasPrzejazduMinuty`;
- przechowuje opis `zrodloCzasuPrzejazdu`, ale nie zmienia sposobu obliczeń zależnie od źródła;
- może przyjąć czas wpisany ręcznie, odczytany z pamięci tras, dostarczony przez zwykłą mapę albo przez przyszły routing dla ciężkich pojazdów;
- nie wywołuje geokodowania, routingu, `fetch`, `XMLHttpRequest` ani lokalizacji przeglądarki;
- działa całkowicie offline, jeżeli gotowy czas przejazdu jest dostępny;
- nie wiąże silnika z konkretnym dostawcą mapowym.

Automatyczne ustalanie trasy i czasu pozostaje zakresem **Etapu 6**. Etap 6 ma jedynie dostarczyć do tego samego kontraktu gotową liczbę minut.

## Test automatyczny

Plik: `testy/etap_4e_3.test.js`

Test potwierdza, że:

1. identyczny czas `35 min` daje identyczne obliczenia dla źródeł `reczny`, `pamiec`, `mapa` i `routing-ciezarowy`;
2. źródło pozostaje zapisane w wyniku wyłącznie jako informacja;
3. tekstowa liczba minut jest normalizowana do liczby;
4. brak jawnego źródła otrzymuje bezpieczne oznaczenie `reczny`;
5. moduł przejazdów nie zawiera bezpośrednich wywołań sieciowych ani geolokalizacji.

## Wynik regresji — 2026-08-26

GitHub Actions po wdrożeniu 4E.3 zakończył pełną regresję powodzeniem. Wszystkie **35/35** plików `testy/*.test.js` przeszły poprawnie.

Podetap **4E.3 jest zaimplementowany i przetestowany**.

Następny podetap: **4E.4 — przypadki brzegowe i zamknięcie przejazdów pomp**. Sprawdzimy brak trasy, `0 min`, różne czasy `A → B` i `B → A` oraz sytuację, w której przejazd powoduje, że pompa nie może rozpocząć przygotowania na kolejnej budowie zgodnie z planem.
