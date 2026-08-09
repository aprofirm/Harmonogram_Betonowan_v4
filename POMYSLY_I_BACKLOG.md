# POMYSŁY I BACKLOG — Harmonogram Betonowań v4

Ten dokument przechowuje pomysły, propozycje, pytania i zadania wymagające doprecyzowania. Wpis w tym pliku nie staje się automatycznie obowiązującą decyzją projektu.

Zatwierdzone decyzje należy przenieść do `PROJECT_DECISIONS.md`. Postęp realizacji etapów należy aktualizować w `ETAPY_ROZWOJU.md`.

## Statusy

- **POMYSŁ** — propozycja do omówienia.
- **DO DOPRECYZOWANIA** — kierunek jest wartościowy, ale brakuje ważnej decyzji.
- **DO WERYFIKACJI** — potrzebne są rzeczywiste dane albo test.
- **ZATWIERDZONY** — użytkownik zaakceptował pomysł; trzeba przenieść go do `PROJECT_DECISIONS.md` i powiązać z etapem.
- **ODRZUCONY** — pomysł świadomie odrzucono; pozostaje w historii z krótkim powodem.
- **ZREALIZOWANY** — funkcja została wdrożona i sprawdzona.

## Zasady prowadzenia backlogu

1. Nie zapisujemy drugi raz pomysłu, który już znajduje się w tym pliku albo w `PROJECT_DECISIONS.md`.
2. Wpis powinien opisywać potrzebę użytkownika, a nie tylko techniczne rozwiązanie.
3. Po podjęciu decyzji aktualizujemy status i wskazujemy dokument lub etap, do którego trafiło ustalenie.
4. Nie przechowujemy tutaj haseł, danych osobowych ani niezanonimizowanych danych produkcyjnych.
5. Po każdej rozmowie projektowej dopisujemy tylko rzeczywiście nowe pomysły i pytania.

---

## P-001 — Elastyczne mapowanie kolumn z KDX

**Data:** 2026-08-09  
**Status:** DO WERYFIKACJI  
**Powiązanie:** Etap 2 — Import CSV i model Budowy

### Potrzeba

Eksport KDX może mieć różną kolejność i zestaw kolumn zależnie od ustawień użytkownika. Program nie może polegać na stałej pozycji kolumn.

### Obecny kierunek

- rozpoznawanie danych po nazwach nagłówków niezależnie od kolejności,
- wskazywanie brakujących i nierozpoznanych informacji,
- możliwość ręcznego przypisania kolumn, gdy automatyczne rozpoznanie nie wystarczy,
- układanie wyniku zawsze w stałym modelu programu,
- zachowanie łatwego do rozszerzenia mapowania nazw kolumn.

### Następny krok

Sprawdzić niezmieniony eksport CSV z KDX używany w pracy i potwierdzić nazwy pól potrzebnych do harmonogramu. Obecne aliasy testowe są rozwiązaniem wstępnym.

---

## P-002 — Udostępnianie harmonogramu kierownikowi przez adres WWW

**Data:** 2026-08-09  
**Status:** DO DOPRECYZOWANIA  
**Powiązanie:** Wersja webowa projektu

### Potrzeba

Kierownik powinien móc otworzyć program lub przygotowany harmonogram na swoim komputerze przez zwykły adres strony WWW. Wersja lokalna offline ma nadal pozostać dostępna.

### Do ustalenia

- czy kierownik sam wczytuje dane i przelicza plan,
- czy ogląda harmonogram przygotowany wcześniej przez operatora,
- czy potrzebny jest wspólny zapis planów w chmurze,
- jaki prosty sposób zabezpieczenia dostępu zastosować,
- na którym etapie wdrożyć publikowanie i udostępnianie planu.

Wspólny silnik obliczeniowy dla wersji lokalnej i internetowej jest już zatwierdzoną decyzją w `PROJECT_DECISIONS.md`.

---

## P-003 — Docelowy sposób liczenia czasu załadunku

**Data:** przeniesiono z wcześniejszych ustaleń  
**Status:** DO DOPRECYZOWANIA  
**Powiązanie:** Etap 3 — Podstawowy silnik gruszek

Obecna wartość domyślna to 10 minut. Trzeba ustalić, czy czas załadunku będzie zawsze stały, czy zależny od ilości ładowanego betonu.

---

## P-004 — Finalny zestaw kolumn harmonogramu

**Data:** przeniesiono z wcześniejszych ustaleń  
**Status:** DO DOPRECYZOWANIA  
**Powiązanie:** Etap 7 — Docelowy interfejs operatora

Trzeba ostatecznie ustalić zestaw informacji widocznych na głównym ekranie operatora. Kolumny mają wspierać codzienną pracę i nie przeciążać widoku diagnostyką techniczną.

---

## P-005 — Finalny wygląd interfejsu

**Data:** przeniesiono z wcześniejszych ustaleń  
**Status:** POMYSŁ  
**Powiązanie:** Etap 7 — Docelowy interfejs operatora

Wygląd będzie dopracowywany iteracyjnie. Priorytetem pozostają poprawny silnik i czytelny przepływ pracy, a dopiero później końcowe szczegóły wizualne.

---

## P-006 — Priorytety przy kolizji budów

**Data:** przeniesiono z wcześniejszych ustaleń  
**Status:** DO DOPRECYZOWANIA  
**Powiązanie:** Etap 5 — Konflikty i korekty

Trzeba ustalić regułę wyboru budowy przesuwanej w czasie, gdy kilka rozwiązań konfliktu zasobów jest możliwych.

---

## P-007 — Jednoczesny niedobór pomp i gruszek

**Data:** przeniesiono z wcześniejszych ustaleń  
**Status:** DO WERYFIKACJI  
**Powiązanie:** Etap 5 — Konflikty i korekty

Silnik ma przeliczać realny plan przy ograniczonej liczbie obu zasobów. Dokładna funkcja celu i kolejność optymalizacji wymagają implementacji oraz prób na rzeczywistych scenariuszach.

---

## P-008 — Wybór usługi geokodowania i routingu

**Data:** przeniesiono z wcześniejszych ustaleń  
**Status:** DO DOPRECYZOWANIA  
**Powiązanie:** Etap 6 — Adresy, lokalizacje i trasy

OpenStreetMap pozostaje preferowanym źródłem danych mapowych, ale konkretny dostawca usług online nie jest jeszcze trwale wybrany. Warstwa usług ma być wymienna bez przebudowy silnika harmonogramu.

