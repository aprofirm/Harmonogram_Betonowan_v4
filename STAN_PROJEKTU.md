# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5I.3 — pamięć i stan nieaktualny**.
- Commit scalający implementację 5I.3 do `main`: `b60d0fa8a84bf967ce03106787faa7eac0ceaf44`.
- Punkty **5A–5I** są zakończone; cały Etap 5 pozostaje otwarty do wykonania 5J.
- Pełna regresja obejmuje **91 zestawów testów — wszystkie poprawne**.
- Pełna regresja **91/91** została wykonana na gałęzi roboczej oraz ponownie przez niezależne CI pull requestu przed scaleniem.
- Tymczasowe pliki użyte wyłącznie do bezpiecznego wdrożenia nie weszły do `main`.

## Co działa po 5I.3

- ustawienia planu zawierają osobne pole **Maksymalny przestój między dostawami**;
- domyślna wartość `maksymalnyPrzestojMinuty` pozostaje `15 min`, niezależnie od limitu opóźnienia startu;
- parametr jest walidowany w interfejsie, przekazywany do centralnego przeliczenia i zapisywany razem z pozostałymi parametrami planu;
- bieżący plan i zapis historyczny zachowują `maksymalnyPrzestojMinuty`;
- starszy zapis bez tego pola korzysta z bieżącej wartości domyślnej `15 min`, a nie z `0`;
- indywidualny `maksymalneOpoznienieStartuBudowyMinuty` nadal jest przechowywany przy konkretnej budowie i zachowywany w planie oraz historii zgodnie z 5F.2;
- każda istotna zmiana parametrów planu albo indywidualnego wyjątku budowy ustawia plan jako nieprzeliczony i czyści poprzedni wynik w interfejsie;
- operator musi wtedy świadomie uruchomić ponownie **Przelicz harmonogram**;
- jeżeli zapisany plan był wcześniej przeliczony, po odtworzeniu program liczy wynik ponownie z zapisanych danych zamiast traktować stary wynik, kursy lub konflikty jako źródło prawdy;
- zachowano kompatybilność ze starszymi zapisami, działanie offline oraz wcześniejsze minimalistyczne środowiska testowe;
- test `testy/etap_5i_3.test.js` sprawdza pole operatorskie, pamięć bieżącą i historyczną, wyjątek budowy, fallback starszego zapisu oraz unieważnianie wyniku;
- `ETAPY_ROZWOJU.md`, `PROJECT_DECISIONS.md` i `README.md` są zsynchronizowane z zakończeniem całego punktu 5I.

## Następny krok

**5J.1 — pełna regresja automatyczna Etapu 5.**

Zakres następnego podetapu zgodnie z `ETAPY_ROZWOJU.md`:

1. uruchomić pełną regresję całego Etapu 5 oraz wcześniejszych etapów;
2. objąć kontrolą scenariusze braku zasobów, korekt startów, limitów, przestojów, stabilizacji, konfliktów, pamięci i ponownego odtwarzania;
3. sprawdzić brak regresji importu KDX, gruszek, pomp, tras lokalnych i interfejsu;
4. nie dodawać nowych funkcji biznesowych — 5J.1 jest etapem weryfikacyjnym przed publikacją 5J.2 i testem operatora 5J.3;
5. po zielonej regresji zaktualizować status i przejść do 5J.2.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5J.1.
