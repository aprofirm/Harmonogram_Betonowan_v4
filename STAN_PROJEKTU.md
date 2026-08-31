# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5H.2 — agregacja konfliktów bez dublowania**.
- Commit z implementacją 5H.2 na `main`: `200429edbae553f1d15216db04a2fd9aa5a9ebf0`.
- Punkty **5A–5G** oraz podetapy **5H.1–5H.2** są zakończone; punkt 5H i cały Etap 5 pozostają otwarte.
- Pełna regresja po dodaniu testu 5H.2 obejmuje **87 zestawów testów**.
- Pełna regresja **87/87** została wykonana przez workflow wdrożeniowy przed utworzeniem commita implementacyjnego.

## Co działa po 5H.2

- każdy końcowy konflikt ma wspólny kontrakt wersji `1` z kategorią i listą `powiazania`;
- końcowa lista konfliktów przechodzi przez jeden mechanizm agregacji w `js/harmonogram/kontrakt_konfliktow.js`;
- stabilny klucz tożsamości używa wersji kontraktu, poziomu, kodu, rodzaju, kategorii, szczegółowej przyczyny i uporządkowanych powiązań;
- `opis` nie wpływa na tożsamość konfliktu;
- kolejność elementów `powiazania` nie wpływa na tożsamość;
- identyczne zgłoszenia tego samego problemu są redukowane do pierwszego pełnego zgłoszenia;
- różne budowy, kursy, zasoby, przyczyny i pary dostaw pozostają osobnymi konfliktami;
- agregacja zachowuje deterministyczną kolejność pierwszych wystąpień i nie mutuje źródła;
- publiczne funkcje `pobierzKluczTozsamosciKonfliktu` i `agregujListeKonfliktow` są dostępne w `aplikacja.konflikty` do testowania i dalszego rozwoju;
- 5H.2 nie zmienia jeszcze finalnych treści komunikatów operatorskich.

## Następny krok

**5H.3 — czytelne przyczyny dla operatora.**

Zakres następnego podetapu:

1. przygotować spójne, zrozumiałe polskie komunikaty na podstawie wspólnego kontraktu i kategorii konfliktów;
2. komunikat ma mówić operatorowi co jest problemem i jakiego obiektu dotyczy bez odczytywania pól diagnostycznych;
3. zachować szczegółowe dane techniczne w konflikcie, ale nie wymagać ich do zrozumienia podstawowej przyczyny;
4. nie zmieniać zasad planowania ani agregacji z 5H.2;
5. dodać test 5H.3 i uruchomić pełną regresję przed publikacją.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5H.3.
