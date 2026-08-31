# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5H.1 — wspólny kontrakt konfliktu**.
- Commit z implementacją 5H.1 na `main`: `38d9f9be5e25de6f74f96d2741cb87e6911db7d1`.
- Cały punkt **5G — maksymalny przestój podczas betonowania** jest zakończony.
- Punkty **5A–5G** oraz podetap **5H.1** są zakończone; punkt 5H i cały Etap 5 pozostają otwarte.
- Pełna regresja po 5H.1: **86 zestawów testów — wszystkie poprawne**.
- Jednorazowy workflow wdrożeniowy zastosował pakiet 5H.1 dopiero po poprawnym przejściu pełnej regresji.
- Wersja webowa zawiera moduł wspólnego kontraktu przed uruchomieniem interfejsu.

## Co działa po 5H.1

- końcowa lista `wynik.konflikty` ma jeden wersjonowany rdzeń kontraktu;
- każdy konflikt otrzymuje pola `wersjaKontraktu`, `poziom`, `kod`, `rodzaj`, `kategoriaKonfliktu`, `opis` oraz `powiazania`;
- wersja kontraktu wynosi obecnie `1`, a `poziom` ma wartość `konflikt`;
- dotychczasowe pola szczegółowe konfliktów pozostają zachowane, więc wcześniejsze reguły nie tracą danych;
- `powiazania` mają wspólny format `{ typ, id, rola }`;
- powiązanie może wskazywać `harmonogram`, `budowa`, `kurs`, `zasob` albo `parametr`;
- konflikt może wskazywać wiele obiektów jednocześnie, np. budowę oraz poprzedni i następny kurs przy przekroczeniu limitu przestoju;
- brak gruszek i brak pomp zachowują jawne powiązanie z typem zasobu;
- brak konkretnego obiektu dostaje powiązanie z całym harmonogramem zamiast pustej listy;
- wspólna klasyfikacja obejmuje co najmniej `brak-gruszki`, `brak-pompy`, `niedostepnosc`, `niezgodny-parametr`, `kolizja`, `brak-trasy`, `limit-startu` i `limit-przestoju`;
- istniejące przyczyny braku pompy są mapowane do wspólnych kategorii bez zmiany logiki przydziału;
- moduł `js/harmonogram/kontrakt_konfliktow.js` normalizuje końcową listę po dołączeniu konfliktów przestoju 5G.3;
- moduł pozostaje częścią silnika i nie przenosi logiki biznesowej do interfejsu;
- 5H.1 nie usuwa jeszcze duplikatów konfliktów i nie zmienia docelowych komunikatów dla operatora — to zakres 5H.2 i 5H.3;
- test `testy/etap_5h_1.test.js` sprawdza wymagane kategorie, powiązania, kompatybilność, brak mutowania źródła i kolejność modułów wersji webowej;
- `ETAPY_ROZWOJU.md`, `PROJECT_DECISIONS.md` i `README.md` są zsynchronizowane z zakończeniem 5G.3 oraz 5H.1.

## Następny krok

**5H.2 — agregacja konfliktów bez dublowania.**

Zakres następnego podetapu:

1. zebrać końcowe konflikty w jednym miejscu bez wielokrotnego raportowania tego samego problemu;
2. zdefiniować stabilny klucz tożsamości konfliktu na podstawie wspólnego kontraktu 5H.1 i jego powiązań;
3. zachować osobne konflikty, gdy dotyczą różnych budów, kursów, zasobów albo różnych par dostaw;
4. nie usuwać szczegółów potrzebnych operatorowi podczas agregacji;
5. zachować deterministyczną kolejność wyniku i brak mutowania danych źródłowych;
6. nie przebudowywać jeszcze finalnych polskich komunikatów operatorskich — to zakres 5H.3;
7. dodać test 5H.2 i uruchomić pełną regresję przed publikacją.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5H.2.
