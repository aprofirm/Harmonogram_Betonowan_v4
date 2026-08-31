# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5H.3 — czytelne przyczyny dla operatora**.
- Commit z implementacją 5H.3 na `main`: `0e89dc93e385b41e0e3f7c7eef97b21ecadd4d44`.
- Punkty **5A–5H** są zakończone; cały Etap 5 pozostaje otwarty.
- Pełna regresja po dodaniu testu 5H.3 obejmuje **88 zestawów testów — wszystkie poprawne**.
- Pełna regresja **88/88** została wykonana przez workflow wdrożeniowy przed utworzeniem commita implementacyjnego.
- Tymczasowe pliki użyte wyłącznie do bezpiecznego wdrożenia 5H.3 zostały usunięte w tym samym commicie implementacyjnym.

## Co działa po 5H.3

- każdy końcowy konflikt zachowuje wspólny kontrakt wersji `1` z kategorią i listą `powiazania`;
- agregacja 5H.2 nadal usuwa wyłącznie rzeczywiste duplikaty i zachowuje osobne konflikty dla różnych budów, kursów, zasobów, przyczyn i par dostaw;
- każdy znormalizowany konflikt otrzymuje osobne pole `komunikatOperatora`;
- `komunikatOperatora` jest przygotowany do prostego przedstawienia problemu operatorowi i nie wymaga odczytywania kodów ani pól diagnostycznych;
- dotychczasowe pole `opis` i wszystkie pola techniczne pozostają zachowane bez zmian dla kompatybilności, diagnostyki i dalszego rozwoju;
- komunikaty rozróżniają brak gruszek, brak pompy, niedostępność pompy, niewystarczający wysięg, brak trasy, przekroczenie limitu startu, przekroczenie limitu przestoju, niestabilność harmonogramu i kolizję zasobu;
- tam, gdzie dane są dostępne, komunikat podaje nazwę budowy, godziny, liczbę minut, wykorzystany limit oraz problematyczne kursy;
- brak trasy zawiera prostą wskazówkę operatorską: uzupełnić czas przejazdu pompy między budowami;
- nieznana przyszła kategoria bez osobnego szablonu wykorzystuje dotychczasowy `opis` jako bezpieczny fallback;
- tekst `komunikatOperatora` nie uczestniczy w kluczu tożsamości konfliktu, więc zmiana jego sformułowania nie wpływa na agregację 5H.2;
- generowanie komunikatu nie mutuje konfliktu źródłowego;
- publiczna funkcja `utworzKomunikatOperatora` jest dostępna w `aplikacja.konflikty`;
- test `testy/etap_5h_3.test.js` sprawdza główne kategorie, konkretne dane liczbowe, fallback, brak mutowania, współpracę z deduplikacją i oznaczenie wersji webowej;
- `ETAPY_ROZWOJU.md`, `PROJECT_DECISIONS.md` i `README.md` są zsynchronizowane z zakończeniem całego punktu 5H.

## Następny krok

**5I.1 — trzy godziny i przesunięcie.**

Zakres następnego podetapu:

1. tabela operatora ma pokazywać źródłowy plan rozpoczęcia budowy;
2. osobno ma być widoczna godzina zadana do bieżącego przeliczenia;
3. osobno ma być widoczny rzeczywisty `StartRoboczy` wyliczony przez pełny silnik;
4. przy różnicy między godziną zadaną a `StartRoboczy` operator ma widzieć wielkość przesunięcia oraz jego czytelną przyczynę;
5. nie mieszać tych trzech znaczeń w jednym polu i nie nadpisywać danych źródłowych;
6. zachować działanie offline, pamięć planu i dotychczasowy kompaktowy układ tabeli;
7. dodać test 5I.1 oraz uruchomić pełną regresję przed publikacją.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5I.1.
