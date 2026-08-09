# AGENTS.md — instrukcja pracy z repozytorium

Ten plik opisuje obowiązkowy sposób pracy z projektem `Harmonogram_Betonowan_v4`. Ma pomóc każdej osobie i każdemu agentowi szybko odtworzyć pełny kontekst projektu bez polegania wyłącznie na historii rozmów.

## 1. Zanim rozpoczniesz zmianę

1. Przeczytaj ten plik w całości.
2. Przejrzyj wszystkie aktualne pliki repozytorium: dokumentację, kod źródłowy, testy i przykłady.
3. Szczególnie sprawdź:
   - `README.md`,
   - `ZASADY_KODU.md`,
   - `PROJECT_DECISIONS.md`,
   - `POMYSLY_I_BACKLOG.md`,
   - `ETAPY_ROZWOJU.md`.
4. Ustal aktualny etap rozwoju i zakres zadania.
5. Znajdź zależności zmienianego mechanizmu oraz testy wcześniejszych funkcji.
6. Dopiero po tym wprowadzaj zmiany.

Nie zakładaj, że danej funkcji albo decyzji nie ma, dopóki nie sprawdzisz aktualnego repozytorium.

## 2. Gdzie zapisywać pamięć projektu

| Rodzaj informacji | Plik |
|---|---|
| Zatwierdzona decyzja biznesowa lub architektoniczna | `PROJECT_DECISIONS.md` |
| Pomysł, propozycja, pytanie albo temat do doprecyzowania | `POMYSLY_I_BACKLOG.md` |
| Aktualny etap, wykonane kryteria i następny krok | `ETAPY_ROZWOJU.md` |
| Stała zasada tworzenia, zmieniania lub testowania kodu | `ZASADY_KODU.md` |
| Skrót projektu, uruchomienie i mapa dokumentacji | `README.md` |
| Obowiązkowy sposób pracy z repozytorium | `AGENTS.md` |

Historia rozmowy pomaga w pracy, ale repozytorium jest trwałym źródłem pamięci projektu.

## 3. Rozróżniaj pomysł od decyzji

- Do `PROJECT_DECISIONS.md` wpisuj tylko ustalenia wyraźnie zatwierdzone przez użytkownika albo jednoznacznie wynikające z zaakceptowanego zakresu.
- Luźne propozycje, warianty i rzeczy wymagające sprawdzenia zapisuj w `POMYSLY_I_BACKLOG.md`.
- Otwartego pytania nie przedstawiaj jako obowiązującej decyzji.
- Jeżeli nowa decyzja zastępuje wcześniejszą, oznacz poprzednią jako zmienioną lub zastąpioną zamiast pozostawiać sprzeczne wymagania.
- Nie twórz duplikatów istniejących wpisów.

## 4. Aktualizacja po każdej rozmowie projektowej

Przed zakończeniem rozmowy dotyczącej projektu albo przed przekazaniem gotowego pakietu zmian:

1. sprawdź, czy pojawiły się nowe decyzje, pomysły, pytania otwarte albo zmiana stanu etapu;
2. zaktualizuj właściwe pliki dokumentacji;
3. zapisz dokumentację w tym samym logicznym pakiecie zmian co kod, którego dotyczy;
4. w podsumowaniu wskaż, które dokumenty zostały zaktualizowane.

Jeżeli rozmowa nie wniosła żadnego nowego ustalenia, nie dodawaj pustego wpisu.

Nie należy czekać wyłącznie na zdanie „kończymy rozmowę”. Zatwierdzoną decyzję najlepiej zapisać od razu wraz z powiązaną zmianą albo najpóźniej przed końcowym podsumowaniem zadania.

## 5. Zasady wykonywania zmian

- Wprowadzaj najmniejszą bezpieczną zmianę zgodną z aktualnym etapem.
- Nie wyprzedzaj kolejnych etapów bez wyraźnego ustalenia.
- Nie przebudowuj działających elementów bez konkretnej potrzeby.
- Uruchom testy nowej funkcji oraz właściwe testy regresji.
- Zachowaj działanie offline podstawowej wersji programu.
- Po publikacji sprawdź docelową gałąź. Jeżeli zadanie miało trafić do `main`, nie kończ pracy z wynikiem pozostawionym wyłącznie na gałęzi roboczej.

## 6. Bezpieczeństwo dokumentacji

Nie zapisuj w repozytorium:

- haseł, tokenów, kluczy i danych logowania,
- prywatnych danych produkcyjnych,
- danych osobowych, które nie są potrzebne do działania projektu,
- niezanonimizowanych plików z pracy bez wyraźnej zgody.

Do przykładów i testów używaj danych sztucznych albo zanonimizowanych.
