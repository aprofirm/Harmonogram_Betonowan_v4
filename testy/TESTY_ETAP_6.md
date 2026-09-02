# Plan testów — Etap 6: adresy, lokalizacje i trasy

## Status

Plan punktów **6A–6J** został przygotowany 2026-09-02. Implementacja Etapu 6
nie została jeszcze rozpoczęta. Pierwszy podetap to **6A.1 — inwentaryzacja i
granice modułów**.

## Zasada nadrzędna

Brak internetu, błąd geokodowania albo awaria routingu nie mogą zatrzymać
aplikacji ani odebrać operatorowi możliwości ułożenia harmonogramu z pamięci
lub z ręcznie wpisanych czasów.

## Zakres testów automatycznych

- **6A:** wersjonowany kontrakt adresu, lokalizacji i trasy, zgodność starszych
  planów oraz używanie przez silnik wyłącznie wartości roboczych;
- **6B:** warianty kolumn KDX/CSV, zachowanie danych źródłowych, normalizacja i
  statusy pełnego, niepełnego, niewystarczającego i niejednoznacznego adresu;
- **6C:** walidacja i pamięć punktu węzła oraz klucze przygotowane na wiele
  węzłów;
- **6D:** migracja książki tras, jednoznaczne klucze, brak błędnego łączenia
  podobnych nazw, pierwszeństwo cache i lokalne podpowiedzi;
- **6E:** neutralny adapter usługi, timeout, limit, brak sieci, zły format
  odpowiedzi i brak przenikania dostawcy do silnika harmonogramu;
- **6F:** geokodowanie, wiele wyników bez cichego wyboru, ręczne zatwierdzenie
  adresu lub współrzędnych;
- **6G:** kierunkowy dystans i czas węzeł ↔ budowa, osobne dane automatyczne i
  robocze oraz ochrona ręcznej korekty;
- **6H:** niezależne `A → B` i `B → A`, zasilanie istniejącego kontraktu
  przejazdów pomp, cache oraz jawny brak trasy;
- **6I:** stan nieaktualny po zmianie, zapis i odtworzenie planu, tryb offline
  oraz brak awarii przy niedostępnej usłudze;
- **6J:** pełna regresja importu, pamięci, gruszek, pomp, harmonogramu i
  konfliktów.

Każdy adapter sieciowy ma być testowany funkcją zastępczą. Testy automatyczne
nie mogą zależeć od chwilowej dostępności publicznego serwera map.

## Końcowy test operatora 6J.3

Przed zamknięciem Etapu 6 operator sprawdzi na opublikowanej stronie:

1. kompletny prawdziwy adres i poprawną trasę drogową;
2. adres niepełny albo niejednoznaczny i brak cichego wyboru lokalizacji;
3. świadomy wybór lub ręczne wskazanie poprawnej lokalizacji;
4. widoczny dystans, czas, źródło i ręczną korektę bez automatycznego nadpisania;
5. kierunkowy przejazd pompy pomiędzy dwiema budowami;
6. ponowne użycie zapamiętanej lokalizacji i trasy;
7. odłączenie internetu oraz dalsze działanie z cache albo ręcznymi czasami;
8. czytelny komunikat po wymuszonym błędzie usługi mapowej.

Do repozytorium wolno zapisać wyłącznie dane sztuczne lub zanonimizowane.
Rzeczywiste adresy użyte przez operatora nie trafiają do testów ani historii
projektu.

## Kryterium zamknięcia

Etap 6 można zamknąć dopiero po ukończeniu **6A–6J**, zielonej pełnej regresji,
publikacji `main` i GitHub Pages oraz potwierdzeniu całego scenariusza 6J.3 przez
operatora.
