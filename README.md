# Harmonogram_Betonowan_v4

„Webowy harmonogram dostaw betonu – planowanie gruszek, pomp i wizualizacja pracy betoniarni.”

Najpierw przejrzyj aktualny stan repozytorium, wszystkie pliki z zasadami i ustaleniami oraz aktualny etap prac. Następnie kontynuuj pracę zgodnie z dokumentacją projektu.

## Dokumentacja projektu

- [ZASADY_KODU.md](ZASADY_KODU.md) — jak piszemy i modyfikujemy kod.
- [PROJECT_DECISIONS.md](PROJECT_DECISIONS.md) — obowiązujące decyzje biznesowe i architektoniczne.
- [ETAPY_ROZWOJU.md](ETAPY_ROZWOJU.md) — kolejność wdrażania funkcji, kryteria zakończenia i testy po każdym etapie.

## Uruchomienie

1. Pobierz całe repozytorium na komputer.
2. Otwórz plik [index.html](index.html) dwukrotnym kliknięciem.
3. Ustaw parametry i wybierz przycisk **Przelicz harmonogram**.

Podstawowy interfejs działa lokalnie, bez instalacji, logowania, serwera i połączenia z internetem.

## Test etapu 1

Instrukcja testu ręcznego znajduje się w pliku [testy/TESTY_ETAP_1.md](testy/TESTY_ETAP_1.md).

Jeżeli na komputerze jest Node.js, można dodatkowo uruchomić test automatyczny:

    node testy/etap_1.test.js

Node.js nie jest potrzebny do zwykłego uruchomienia aplikacji.

## Aktualny stan

**Etap 1 — Szkielet aplikacji** jest zaimplementowany i przeszedł testy automatyczne. Przed rozpoczęciem etapu 2 należy potwierdzić test ręczny na komputerze operatora.
