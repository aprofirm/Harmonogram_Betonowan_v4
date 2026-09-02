# 5J.3 — scenariusz testu operatora Etapu 5

Status: **ZALICZONY PRZEZ OPERATORA**

Data przygotowania: 2026-08-31

Data wykonania: 2026-09-02

## Wynik testu

- **A — OK:** poprawne przesunięcia A `08:00`, B `09:30`, C `11:25`,
  widoczny skutek jednej gruszki, konflikt limitu startu i konflikt przestoju;
- **B1 — OK:** przy `0` gruszek widoczny jawny konflikt **Brak gruszki**;
- **B2 — OK:** przy `1` gruszce i `0` pomp widoczne trzy konflikty
  **Brak pompy** dla budów A, B i C.

Celem tego testu jest ostatnia kontrola Etapu 5 w prawdziwej przeglądarce. Test nie ma zastępować automatycznych testów 5A–5I; ma potwierdzić, że operator rzeczywiście widzi i rozumie skutki działania silnika.

Do testu używamy wyłącznie sztucznych danych z pliku:

`przyklady/5j3_test_operatora.csv`

Nie używamy danych produkcyjnych.

## Co test ma potwierdzić

1. przesunięcie budowy przez zajętość pompy;
2. niedobór gruszek i opóźnienie kursów;
3. kaskadę A → B → X → C;
4. przekroczenie limitu startu;
5. przestój pomiędzy kolejnymi dostawami;
6. brak możliwego zasobu — osobno brak gruszki i brak pompy.

---

# Przygotowanie

1. Na komputerze wykonaj `Pull` aktualnego `main` w GitHub Desktop.
2. Otwórz wersję GitHub Pages:
   `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`
3. Kliknij **Wyczyść plan dnia** i potwierdź, aby wcześniejsza pamięć planu nie wpływała na test.
4. Wczytaj plik `przyklady/5j3_test_operatora.csv`.
5. Nie zmieniaj godzin źródłowych budów.

Plik powinien utworzyć cztery pozycje:

| ID | Budowa | Start planowany | Beton | Rozładunek |
|---|---|---:|---:|---|
| A | Budowa A | 08:00 | 16 m³ | Pompa |
| B | Budowa B | 09:20 | 16 m³ | Pompa |
| X | Budowa X | 09:40 | 8 m³ | Lej |
| C | Budowa C | 10:50 | 16 m³ | Pompa |

---

# Scenariusz A — kaskada, gruszka, pompa, limit i przestój

## A1. Ustaw parametry

W panelu ustawień ustaw dokładnie:

- Początek dnia: `07:00`;
- Pojemność gruszki: `8 m³`;
- Czas załadunku: `10 min`;
- Czas rozładunku: `15 min`;
- Maksymalne opóźnienie startu: `30 min`;
- Maksymalny przestój między dostawami: `5 min`.

Wartość `5 min` dla przestoju jest celowym ustawieniem testowym. Domyślna wartość programu nadal wynosi `15 min`.

## A2. Ustaw zasoby

### Gruszki

- Tryb pracy: **Mam określoną liczbę**;
- Liczba gruszek: `1`.

### Pompy

- Tryb pracy: **Mam określoną liczbę**;
- Liczba pomp: `1`;
- Pompa 1: aktywna;
- dostępna od: `07:00`;
- wysięg: `32 m`.

## A3. Ustaw przejazdy pompy

W tabeli przejazdów pomp wpisz:

- `A → B = 0 min`;
- `A → C = 0 min`;
- `B → C = 0 min`.

Wartość `0` jest tutaj świadomym uproszczeniem danych testowych, aby wynik godzin był jednoznaczny i nie zależał od map.

## A4. Przelicz

Kliknij **Przelicz harmonogram**.

### Oczekiwany wynik godzin budów

| Budowa | Start zadany | Start roboczy | Oczekiwany skutek |
|---|---:|---:|---|
| A | 08:00 | **08:00** | bez przesunięcia |
| B | 09:20 | **09:30** | **+10 min** |
| C | 10:50 | **11:25** | **+35 min** |

Budowa X nie wymaga pompy i uczestniczy w obciążeniu jedynej gruszki.

### Co ma być widoczne w kursach

- wszystkie przydzielone kursy korzystają z **Gruszki 1**;
- co najmniej jeden kurs ma widoczny dodatni **Skutek floty** (`+... min`);
- jedna gruszka powoduje rzeczywiste opóźnienia dostaw, a te wpływają na dalszą pracę pompy;
- plan nie może tworzyć dwóch jednoczesnych kursów tej samej gruszki.

### Co ma być widoczne przy pompie

- B jest przesunięta względem 09:20;
- C jest przesunięta względem 10:50;
- wynik pokazuje przyczynę przesunięcia tekstem, nie samym kolorem;
- jedna pompa nie może jednocześnie obsługiwać dwóch budów.

### Konflikt limitu startu

Dla C oczekujemy konfliktu:

- Start zadany: `10:50`;
- Start roboczy: `11:25`;
- opóźnienie: `35 min`;
- limit: `30 min`;
- przekroczenie: `5 min`.

Panel konfliktów powinien opisać problem po polsku i wskazać budowę C.

### Konflikt przestoju

Przy limicie testowym `5 min` ma wystąpić co najmniej jeden konflikt **Przestój** między rzeczywistymi dostawami tej samej budowy.

Wpis konfliktu powinien:

- podać długość rzeczywistej przerwy;
- podać limit `5 min`;
- wskazać budowę;
- wskazać kurs poprzedni i następny;
- być czytelny tekstowo bez konieczności interpretowania koloru.

Jeżeli powyższe punkty są spełnione, Scenariusz A zaliczamy.

---

# Scenariusz B — jawny brak zasobu

Nie wczytuj CSV ponownie. Korzystamy z tego samego planu.

## B1. Brak gruszki

1. Zmień liczbę gruszek z `1` na `0`.
2. Pozostaw jedną aktywną pompę.
3. Kliknij **Przelicz harmonogram**.

Oczekujemy:

- jawnego konfliktu **Brak gruszki**;
- kursów bez przydzielonego pojazdu zamiast wymyślenia dodatkowej gruszki;
- komunikatu wskazującego zasób **gruszki**.

Po sprawdzeniu ustaw ponownie `1` gruszkę.

## B2. Brak pompy

1. Ustaw liczbę pomp na `0`.
2. Liczbę gruszek pozostaw `1`.
3. Kliknij **Przelicz harmonogram**.

Oczekujemy:

- jawnego konfliktu **Brak pompy** / braku możliwej pompy dla budów pompowanych;
- silnik nie może wymyślić dodatkowej pompy;
- dla braku pompy nie może zostać wymyślona fikcyjna „możliwa godzina” zasobu;
- konflikt powinien wskazywać budowę i zasób pompy tekstem.

Jeżeli B1 i B2 są spełnione, Scenariusz B zaliczamy.

---

# Sposób zgłoszenia wyniku

Po wykonaniu testu wystarczy przekazać wynik w formie:

- `A — OK / NIE`;
- `B1 — OK / NIE`;
- `B2 — OK / NIE`.

Jeżeli coś się nie zgadza, najlepiej dołączyć zrzut ekranu części z budowami, kursami lub panelem konfliktów. Nie trzeba przepisywać logów ręcznie.

## Kryterium zamknięcia 5J.3

5J.3 zostało zakończone po rzeczywistym wykonaniu powyższego scenariusza
w przeglądarce i potwierdzeniu wyniku przez operatora 2026-09-02.

Po zaliczeniu wykonano:

1. zapisujemy wynik testu w repo;
2. oznaczamy 5J.3 jako zakończone;
3. zamykamy cały punkt 5J;
4. zamykamy cały **Etap 5**;
5. wskazujemy następny etap projektu.

**5J.3, 5J i cały Etap 5 są zakończone.**
