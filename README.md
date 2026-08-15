# Harmonogram_Betonowan_v4

„Webowy harmonogram dostaw betonu – planowanie gruszek, pomp i wizualizacja pracy betoniarni.”

Najpierw przejrzyj aktualny stan repozytorium, wszystkie pliki z zasadami i ustaleniami oraz aktualny etap prac. Następnie kontynuuj pracę zgodnie z dokumentacją projektu.

## Dokumentacja projektu

- [AGENTS.md](AGENTS.md) — obowiązkowy sposób rozpoczynania pracy i zapisywania pamięci projektu.
- [ZASADY_KODU.md](ZASADY_KODU.md) — jak piszemy i modyfikujemy kod.
- [PROJECT_DECISIONS.md](PROJECT_DECISIONS.md) — obowiązujące decyzje biznesowe i architektoniczne.
- [POMYSLY_I_BACKLOG.md](POMYSLY_I_BACKLOG.md) — pomysły, propozycje i tematy wymagające doprecyzowania.
- [ETAPY_ROZWOJU.md](ETAPY_ROZWOJU.md) — kolejność wdrażania funkcji, kryteria zakończenia i testy po każdym etapie.

## Trwała pamięć projektu

Repozytorium jest głównym źródłem pamięci projektu. Historia rozmów pomaga zachować ciągłość, ale zatwierdzone ustalenia, pomysły i aktualny stan prac muszą znajdować się w dokumentacji.

Na końcu każdej rozmowy projektowej należy sprawdzić, czy pojawiły się:

- nowe zatwierdzone decyzje — dopisać je do `PROJECT_DECISIONS.md`,
- nowe pomysły albo pytania — dopisać je do `POMYSLY_I_BACKLOG.md`,
- zmiany statusu etapu lub następnego kroku — zaktualizować `ETAPY_ROZWOJU.md`,
- nowe stałe zasady tworzenia kodu — zaktualizować `ZASADY_KODU.md`.

Nie dodajemy pustych wpisów, jeżeli rozmowa nie wniosła nic nowego. Luźnego pomysłu nie wolno przedstawiać jako zatwierdzonej decyzji. Dokładna procedura znajduje się w `AGENTS.md`.

Przed przejściem do kolejnego punktu należy ponownie sprawdzić listę podetapów
w `ETAPY_ROZWOJU.md`. Zakończenie pierwszego kroku, np. `3B.1`, nie zamyka
automatycznie całego punktu `3B`.

## Uruchomienie

1. Pobierz całe repozytorium na komputer.
2. Otwórz plik [index.html](index.html) dwukrotnym kliknięciem.
3. Wczytaj plik CSV, przeciągając go na pole importu albo wybierając z komputera.
4. W razie potrzeby dodaj budowę ręcznie.
5. Uzupełnij czas dojazdu i powrotu przy aktywnych budowach.
6. Ustaw parametry i wybierz przycisk **Przelicz harmonogram**.

Podstawowy interfejs działa lokalnie, bez instalacji, logowania, serwera i połączenia z internetem.

## Import CSV — etap 2

Importer wymaga informacji odpowiadających kolumnom:

- `Firma`,
- `Budowa`,
- `StartPlanowany`.

`ID_Budowy` jest opcjonalne. Jeżeli znajduje się w pliku, program zachowuje je dokładnie, również z zerami na początku. Gdy kolumny ID nie ma albo pojedynczy wiersz ma puste ID, program nadaje bezpieczne identyfikatory `CSV-001`, `CSV-002` itd. i pokazuje ostrzeżenie zamiast odrzucać plik.

Rozpoznawane są również typowe warianty nazw, np. `ID obiektu`, `Klient`, `Nazwa budowy` i `Godzina`. Przykładowy plik znajduje się w [przyklady/przykladowe_budowy.csv](przyklady/przykladowe_budowy.csv).

### Zmienne kolumny eksportu KDX

Eksport KDX nie ma jednego stałego układu kolumn. Użytkownik może zmieniać zarówno zestaw, jak i kolejność kolumn. Importer **nie może więc opierać się na numerach kolumn** — wyszukuje potrzebne dane po nazwach nagłówków.

Aktualnie rozpoznawane są m.in. rzeczywiste nagłówki KDX:

- `K.-Nazwa` lub `Nazwa` → Firma,
- `Budowa` lub `Tytuł` → Budowa,
- `Czas rozładunku` → StartPlanowany,
- `Zam-o (mój zakład)` → ilość betonu,
- `Nazwa materiału` → rodzaj betonu,
- `Rodzaj rozładunku` → sposób rozładunku.

Dodatkowe, puste kolumny oraz zmiana kolejności kolumn nie powinny wpływać na import. Techniczny wiersz KDX bez danych budowy, np. `Normal`, jest pomijany. Nowe warianty nazw nagłówków należy dopisywać jako aliasy w module importu zamiast tworzyć osobne importery dla każdego układu.

Program obsługuje wybór pliku i przeciąganie CSV. Kolejny poprawny import zastępuje dane z poprzedniego pliku, natomiast budowy dodane ręcznie pozostają osobną listą.

## Diagnostyka i raport błędów

Aplikacja automatycznie zapisuje techniczne zdarzenia z maksymalnie 10 ostatnich uruchomień. Rejestrowane są m.in. uruchomienie programu, rozpoczęcie i wynik importu CSV, przeliczenie harmonogramu, ostrzeżenia oraz błędy z bezpiecznym wskazaniem miejsca w kodzie.

Sekcja **Diagnostyka programu** pozwala:

- podejrzeć ostatnie zdarzenia,
- pobrać raport `.json`, który można przesłać do analizy,
- wyczyścić zapisane logi.

Logi są przechowywane wyłącznie lokalnie w pamięci przeglądarki i nie są nigdzie wysyłane. Raport nie zawiera treści wierszy CSV ani nazw firm i budów. Jeżeli przeglądarka blokuje trwałą pamięć dla lokalnego `index.html`, aplikacja przechowuje logi do czasu zamknięcia strony i pokazuje tę informację w sekcji diagnostyki.

## Logo aplikacji

Plik `logo.png` jest oficjalnym źródłem znaku aplikacji: pomarańczowo-granatowej betonomieszarki na tle zegara. Logo jest wyświetlane u góry strony, na środku nad nazwą programu, i działa również po lokalnym otwarciu `index.html`.

Ten sam znak jest używany jako favicon na karcie przeglądarki. Plik `favicon.png` jest kwadratowym wariantem przygotowanym z `logo.png` bez rozciągania grafiki. Oba pliki są przechowywane lokalnie i nie wymagają internetu.

## Testy etapów i funkcji przekrojowych

Instrukcje testów ręcznych znajdują się w plikach:

- [testy/TESTY_ETAP_1.md](testy/TESTY_ETAP_1.md),
- [testy/TESTY_ETAP_2.md](testy/TESTY_ETAP_2.md),
- [testy/TESTY_ETAP_3A.md](testy/TESTY_ETAP_3A.md),
- [testy/TESTY_ETAP_3B_1.md](testy/TESTY_ETAP_3B_1.md),
- [testy/TESTY_KP_1.md](testy/TESTY_KP_1.md) — plan testu pamięci dnia,
- [testy/TESTY_DIAGNOSTYKA.md](testy/TESTY_DIAGNOSTYKA.md).

Jeżeli na komputerze jest Node.js, można dodatkowo uruchomić test automatyczny:

    node testy/etap_1.test.js
    node testy/etap_2.test.js
    node testy/kdx_zmienne_kolumny.test.js
    node testy/diagnostyka.test.js
    node testy/etap_3a.test.js
    node testy/etap_3b_1.test.js
    node testy/pamiec_planu.test.js

Node.js nie jest potrzebny do zwykłego uruchomienia aplikacji.

## Aktualny stan

**Etap 3 — podstawowy silnik gruszek** jest w toku. Punkt **3A — generowanie kursów** oraz krok **3B.1 — podstawowe czasy kursów** są zakończone i sprawdzone automatycznie oraz przez operatora. Przed 3B.2 realizujemy zatwierdzony krok przekrojowy **KP-1 — pamięć planu dnia**. Podetapy **KP-1.1 — plan i decyzje** oraz **KP-1.2 — wersjonowany moduł pamięci planu** są zakończone. Następny jest **KP-1.3 — automatyczny zapis zmian**. Po zamknięciu całego KP-1 wracamy do **3B.2 — rytm dostaw**; punkt 3C nadal pozostaje zablokowany.
