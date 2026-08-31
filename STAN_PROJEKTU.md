# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5I.1 — trzy godziny i przesunięcie**.
- Commit z implementacją 5I.1 na `main`: `aea718d1030d748b0d29c68342b37c304868d463`.
- Punkty **5A–5H** oraz podetap **5I.1** są zakończone; punkt 5I i cały Etap 5 pozostają otwarte.
- Pełna regresja po dodaniu testu 5I.1 obejmuje **89 zestawów testów — wszystkie poprawne**.
- Pełna regresja **89/89** została wykonana przez workflow wdrożeniowy przed utworzeniem commita implementacyjnego.
- Tymczasowe pliki użyte wyłącznie do bezpiecznego wdrożenia 5I.1 zostały usunięte w tym samym commicie implementacyjnym.

## Co działa po 5I.1

- główna tabela ma zwartą kolumnę **Start budowy** zamiast wcześniejszego nagłówka **Start do przeliczenia**;
- w jednej komórce są rozdzielone trzy różne znaczenia godziny: **Plan**, edytowalny **Zadany** i wynikowy **Roboczy**;
- **Plan** pozostaje źródłową godziną lub pełnym oknem z KDX i nie jest nadpisywany przez korektę operatora ani silnik;
- **Zadany** jest godziną używaną do bieżącego przeliczenia i zachowuje dotychczasową ręczną edycję oraz przycisk `↺`;
- **Roboczy** jest pokazywany jako `—`, dopóki nie istnieje aktualny wynik pełnego przeliczenia; dzięki temu wartość inicjalizacyjna modelu nie udaje wyniku silnika;
- po przeliczeniu **Roboczy** pokazuje końcowy `StartRoboczy` z pełnego sprzężonego harmonogramu;
- gdy `StartRoboczy` jest późniejszy od `StartZadany`, komórka pokazuje liczbę minut przesunięcia oraz krótką przyczynę, np. `pompa zajęta`, `pompa dostępna później` albo `poprzednia budowa zakończyła się później`;
- dla przyszłej, nierozpoznanej przyczyny przesunięcia używany jest bezpieczny tekst `korekta harmonogramu`;
- wielkość przesunięcia jest brana z końcowej `ocenaOpoznieniaStartu`, więc ręczna różnica między Planem a Zadanym nie jest mylona z opóźnieniem wygenerowanym przez silnik;
- zachowano dotychczasową strukturę komórki startu potrzebną przez pamięć planu i starsze testy, dzięki czemu migracja starszych zapisów nadal działa;
- układ pozostaje kompaktowy i nie dodaje trzech osobnych szerokich kolumn;
- test `testy/etap_5i_1.test.js` sprawdza stan przed przeliczeniem, trzy znaczenia godziny, brak przesunięcia, przyczyny przesunięcia, integrację z rzeczywistym silnikiem pomp i oznaczenie wersji webowej;
- `ETAPY_ROZWOJU.md`, `PROJECT_DECISIONS.md` i `README.md` są zsynchronizowane z zakończeniem 5I.1.

## Następny krok

**5I.2 — konflikty i przestoje w interfejsie.**

Zakres następnego podetapu:

1. pokazać operatorowi końcowe konflikty tekstowo w interfejsie, korzystając z `komunikatOperatora` przygotowanego w 5H.3;
2. wyraźnie pokazać problemy z ciągłością dostaw i przestojami, bez wymagania odczytywania danych diagnostycznych;
3. kolor ma pozostać wyłącznie sygnałem pomocniczym — sens problemu musi wynikać z tekstu;
4. zachować powiązanie konfliktu z właściwą budową, kursem albo zasobem;
5. nie zmieniać zasad planowania, klasyfikacji konfliktów ani agregacji 5H;
6. zachować działanie offline i kompaktowy układ operatora;
7. dodać test 5I.2 oraz uruchomić pełną regresję przed publikacją.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5I.2.
