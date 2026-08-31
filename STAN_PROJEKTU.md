# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5I.2 — konflikty i przestoje w interfejsie**.
- Commit z implementacją 5I.2 na `main`: `abfd8c3b4355269589ffe980473c34cbedcc4fd9`.
- Punkty **5A–5H** oraz podetapy **5I.1–5I.2** są zakończone; punkt 5I i cały Etap 5 pozostają otwarte.
- Pełna regresja po dodaniu testu 5I.2 obejmuje **90 zestawów testów — wszystkie poprawne**.
- Pełna regresja **90/90** została wykonana na gałęzi roboczej przed scaleniem oraz ponownie przez CI pull requestu.
- Tymczasowe pliki użyte wyłącznie do bezpiecznego wdrożenia nie weszły do `main`.

## Co działa po 5I.2

- główna tabela nadal ma zwartą kolumnę **Start budowy** z wartościami **Plan**, **Zadany** i **Roboczy** z 5I.1;
- jeżeli końcowy `wynik.konflikty` nie jest pusty, przy harmonogramie pojawia się zwarty panel **Konflikty wymagające uwagi**;
- każdy wpis korzysta przede wszystkim z czytelnego `komunikatOperatora` przygotowanego w 5H.3, a nie z kodu diagnostycznego;
- rodzaj problemu jest zapisany tekstowo, np. **Przestój**, **Brak pompy**, **Brak trasy**, **Brak gruszki**, **Niedostępność**, **Parametr**, **Kolizja**, **Start** albo **Niestabilny plan**;
- kolor jest wyłącznie sygnałem pomocniczym — sens problemu wynika z tekstu;
- panel wykorzystuje `powiazania` wspólnego kontraktu 5H.1 i pokazuje kontekst problemu jako budowę, kurs albo zasób;
- konflikt przestoju wskazuje konkretną budowę oraz oba kolejne kursy problematycznej pary, np. **Kurs poprzedni: 1** i **Kurs następny: 2**;
- identyfikatory `typ`, `id` i `rola` powiązań pozostają dostępne w atrybutach widoku, bez zmiany obiektu konfliktu;
- brak konfliktów ukrywa panel;
- zmiana danych wymagająca ponownego przeliczenia czyści poprzedni panel razem z nieaktualnym wynikiem;
- warstwa 5I.2 nie zmienia sposobu planowania, klasyfikacji ani agregacji konfliktów;
- nowe elementy panelu są bezpiecznie opcjonalne dla starszych minimalistycznych środowisk testowych, natomiast produkcyjny `index.html` zawiera kompletny panel;
- test `testy/etap_5i_2.test.js` obejmuje rzeczywisty konflikt przestoju 16 min, tekst operatorski, powiązanie z budową i dwoma kursami, zasoby, fallback oraz warstwę HTML/CSS;
- `ETAPY_ROZWOJU.md`, `PROJECT_DECISIONS.md` i `README.md` są zsynchronizowane z zakończeniem 5I.2.

## Następny krok

**5I.3 — pamięć i stan nieaktualny.**

Zakres następnego podetapu:

1. domknąć operatorskie parametry Etapu 5, w szczególności trwałe ustawienie `maksymalnyPrzestojMinuty`, którego interfejs i pamięć były odłożone z 5G.2 do 5I;
2. upewnić się, że parametry Etapu 5 i indywidualne wyjątki budów są zapisywane oraz odtwarzane w bieżącym planie i historii;
3. każda istotna zmiana danych lub parametrów ma jawnie oznaczać poprzedni wynik jako nieaktualny i wymagać nowego pełnego przeliczenia;
4. nie przechowywać starego wyniku jako źródła prawdy — po odtworzeniu przeliczonego planu wynik ma powstać ponownie z zapisanych danych;
5. zachować zgodność starszych zapisów, działanie offline i dotychczasowy kompaktowy interfejs;
6. dodać test 5I.3 oraz wykonać pełną regresję przed publikacją.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5I.3.
