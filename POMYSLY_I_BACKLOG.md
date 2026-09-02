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

### Stan testów na zakończenie pracy 2026-08-10

- automatyczne testy Etapu 1 i Etapu 2 przechodzą,
- test diagnostyki przechodzi,
- osobny test `kdx_zmienne_kolumny.test.js` zatrzymuje się na sztucznym technicznym wierszu, który ma więcej pól niż nagłówek,
- logika importu KDX nie była przy tym zmieniana.

Przed rozpoczęciem Etapu 3 trzeba porównać problematyczny wiersz testowy z prawdziwym eksportem KDX i na tej podstawie poprawić dane testowe albo obsługę takiego wariantu pliku. Nie należy osłabiać walidacji CSV bez potwierdzenia rzeczywistego formatu KDX.

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

W kroku 3B.1 przyjęto 10 minut jako czas podstawowy oraz osobną ręczną korektę
dla budowy. Pytanie o ewentualne automatyczne uzależnienie czasu od ilości betonu
pozostaje otwarte na późniejszy etap.

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

### Element już zatwierdzony

Logo aplikacji znajduje się u góry, na środku nad nazwą programu. Zatwierdzony znak przedstawia betonomieszarkę na tle zegara, a ten sam motyw jest używany jako favicon. Pozostałe elementy finalnego wyglądu nadal będą dopracowywane iteracyjnie.

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

**Data:** przeniesiono z wcześniejszych ustaleń; doprecyzowano 2026-08-26  
**Status:** DO DOPRECYZOWANIA  
**Powiązanie:** Etap 6 — Adresy, lokalizacje i trasy

OpenStreetMap pozostaje preferowanym źródłem danych mapowych, ale konkretny dostawca usług online nie jest jeszcze trwale wybrany. Warstwa usług ma być wymienna bez przebudowy silnika harmonogramu.

### Pomysł interfejsu do sprawdzenia w Etapie 6

- obok adresu budowy ma być mały przycisk otwierający szczegóły lokalizacji lub mapę;
- operator powinien móc poprawić adres ręcznie, wyszukać miejsce albo wskazać punkt na mapie, gdy sam adres jest niepełny lub niejednoznaczny;
- po zatwierdzeniu lokalizacji program może zapisać współrzędne oraz wyliczony czas i dystans w lokalnym cache;
- mapa ma być pomocą operatora, a nie warunkiem działania harmonogramu — brak internetu nadal musi pozwalać użyć danych zapamiętanych lub wpisanych ręcznie.

### Dostawca tras — pytania do rozstrzygnięcia

Przed integracją trzeba porównać rozwiązania pod kątem kosztów, limitów, licencji, stabilności i możliwości wykorzystania w wersji lokalnej oraz internetowej. Należy osobno sprawdzić, czy wystarczy standardowy routing samochodowy, czy warto użyć dostawcy potrafiącego uwzględniać ciężkie pojazdy, np. ograniczenia masy, wysokości, szerokości i zakazy ruchu ciężarówek. Google Maps jest jednym z kandydatów do porównania, ale nie jest obecnie zatwierdzonym dostawcą.

**Przypisanie do planu 2026-09-02:** porównanie i zatwierdzenie dostawcy należy
do **6E.1**, neutralny adapter do **6E.2**, a obsługa awarii do **6E.3**.

---

## P-009 — Domyślne czasy pełnego cyklu pompy

**Data:** 2026-08-23
**Status:** ZREALIZOWANY
**Powiązanie:** Etap 4A.2 i 4D — Pompy

Trzeba ustalić początkowe wartości i poziom konfiguracji dla:

- przygotowania pompy przed betonowaniem,
- zakończenia pracy i składania,
- mycia lub innych czynności końcowych,
- przygotowania do przejazdu na następną budowę.

Należy rozstrzygnąć, które wartości są globalne, które zależą od konkretnej
pompy, a które mogą być nadpisane dla pojedynczej budowy. Do czasu zatwierdzenia
nie wpisujemy przypadkowych wartości domyślnych do silnika.

**Rozstrzygnięcie 2026-08-25:** standard `32 m` ma `20 min` przygotowania i
`30 min` czynności po ostatnim rozładunku. Większy wymagany wysięg dodaje po
`5 min` do obu wartości za każde rozpoczęte dodatkowe `10 m`. Operator może
nadpisać oba czasy dla konkretnej budowy. Właściwe pompowanie trwa od początku
pierwszego do końca ostatniego rozładunku. Decyzję zapisano w punkcie 83
`PROJECT_DECISIONS.md`, a model i test wdrożono w 4A.2.

---

## P-010 — Sposób traktowania pomp zewnętrznych

**Data:** 2026-08-23; rozstrzygnięto 2026-08-27
**Status:** ZREALIZOWANY
**Powiązanie:** Etap 4F.0–4F — Pompy

Nie rozdzielamy pomp własnych i zewnętrznych w logice harmonogramu. Każda
aktywna pompa jest zwykłym zasobem wspólnej listy, a jej pochodzenie nie wpływa
na przydział, przejazdy ani możliwość obsługi kilku budów tego samego dnia.

O dopasowaniu decydują rzeczywiste parametry: przede wszystkim wysięg, okno
**Dostępna od/do**, wcześniejsza zajętość oraz przejazd do kolejnej budowy.
Starsze pole `typ` może pozostać neutralną metadaną zgodności, ale nie jest już
pokazywane operatorowi ani używane przez algorytm. Zasady zapisano w decyzji 91
i wdrożono w przygotowawczym kroku 4F.0.
---

## P-011 — Ręczne czasy przejazdów pomp przed integracją mapową

**Data:** 2026-08-23; doprecyzowano 2026-08-26  
**Status:** CZĘŚCIOWO ROZSTRZYGNIĘTY  
**Powiązanie:** Etap 4E, 4F, 4I i Etap 6 — Pompy oraz trasy

Część silnikowa została rozstrzygnięta w decyzjach 89–90 i podetapach
4E.1–4E.4. Pierwszy przejazd `betoniarnia → budowa` pozostaje wyłącznie
informacyjny. Każdy kolejny przejazd `budowa A → budowa B` ma osobny,
kierunkowy czas, realnie wpływa na gotowość pompy i może wyznaczyć
późniejszy możliwy start następnego betonowania.

Silnik przyjmuje gotowy `czasPrzejazduMinuty` niezależnie od źródła. Brak
wartości jest jawnym problemem, `0 min` jest dozwolone, a `A → B` i
`B → A` nie muszą być równe. Automatyczne pozyskiwanie czasu z map nadal
pozostaje zakresem Etapu 6 i nie może być wymagane do działania offline.

Otwarte pozostaje rozwiązanie operatorskie: gdzie i w jaki sposób przed
pełną integracją mapową wpisać, wybrać lub potwierdzić czas dla konkretnej
pary budów oraz jak zapisać taką parę w lokalnej pamięci tras. Klucz
pamięci powinien docelowo opierać się na jednoznacznej lokalizacji
(znormalizowany adres i/lub współrzędne), a nie wyłącznie na swobodnej
nazwie budowy. Rozwiązanie interfejsu nie może zmienić kontraktu silnika
zbudowanego w 4E.

**Przypisanie do planu 2026-09-02:** automatyczne relacje budowa → budowa są
zakresem **6H.1–6H.3**, a ich prezentacja i korekta pozostają częścią **6I.1**.
---

## P-012 — Podpowiedzi znanych budów w formularzu ręcznym

**Data:** 2026-08-26  
**Status:** POMYSŁ  
**Powiązanie:** Etap 6 i Etap 7 — lokalizacje oraz interfejs operatora

Podczas ręcznego dodawania budowy program powinien wykorzystywać lokalną pamięć znanych budów i tras. Po wpisaniu kilku znaków nazwy, ulicy, miejscowości albo innego fragmentu adresu ma wyświetlać pasujące propozycje z wcześniej zapisanych danych.

Wybranie propozycji powinno uzupełnić znane dane lokalizacji i pozwolić ponownie wykorzystać zapisany czas lub trasę, zamiast zmuszać operatora do ponownego wpisywania tych samych informacji. Podpowiedzi mają działać całkowicie lokalnie i offline.

Dopasowanie powinno być odporne na wielkość liter i typowe różnice zapisu. Program nie może jednak samodzielnie podmieniać wpisu — operator wybiera jedną z propozycji albo kontynuuje wpisywanie nowej budowy. W Etapie 6 trzeba ustalić, czy rekord pamięci reprezentuje przede wszystkim nazwę budowy, znormalizowany adres, współrzędne czy ich połączenie, aby uniknąć duplikatów i błędnego łączenia podobnych lokalizacji.

**Przypisanie do planu 2026-09-02:** model i klucz pamięci powstają w
**6D.1–6D.2**, lokalne podpowiedzi w **6D.3**, a ich docelowy widok w **6I.1**.
