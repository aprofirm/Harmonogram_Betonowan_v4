# Testy Etapu 3C — przydział konkretnych gruszek

## Status

- [x] 3C.1 — model i zasady przydziału.
- [x] 3C.2 — niezależny silnik przydziału.
- [ ] 3C.3 — integracja z pełnym harmonogramem.
- [ ] 3C.4 — widok operatora.
- [ ] 3C.5 — testy integracyjne i przypadki brzegowe.
- [ ] 3C.6 — pełna regresja, publikacja i test operatora.

## Zakres testu 3C.2

Moduł `js/gruszki/przydzial_gruszek.js` otrzymuje kursy z policzonymi czasami
3B.2. Nie zmienia godzin kursów. Przypisuje wyłącznie konkretną gruszkę i
aktualizuje minutę jej ponownej dostępności.

Obowiązuje fizyczny przedział zajęcia pojazdu:

`rozpoczęcie załadunku → dojazd → rozładunek → powrót do betoniarni`.

Gruszka może rozpocząć kolejny kurs dokładnie w minucie zakończenia poprzedniego
powrotu.

## Test automatyczny

Uruchom:

```text
node testy/etap_3c.test.js
```

Test sprawdza:

1. pustą listę kursów;
2. dwa nakładające się kursy — muszą otrzymać różne gruszki;
3. kurs rozpoczynający się dokładnie po powrocie — może użyć tej samej gruszki;
4. ponowne wykorzystanie pierwszego wolnego pojazdu;
5. stabilne uporządkowanie kursów według rozpoczęcia załadunku;
6. deterministyczne identyfikatory `GRUSZKA-001`, `GRUSZKA-002` itd.;
7. odrzucenie kursu z błędną minutą rozpoczęcia albo niepoprawnym czasem cyklu.

## Kryterium zaliczenia 3C.2

- [x] żadne dwa nakładające się cykle nie mają tego samego `idGruszki`;
- [x] granica `powrót == następny start załadunku` jest dozwolona;
- [x] moduł nie przesuwa żadnej godziny kursu;
- [x] działanie nie wymaga HTML, internetu ani dodatkowej biblioteki;
- [x] pełna regresja projektu jest uruchamiana przed zapisaniem statusu 3C.1–3C.2.

Test operatora nie jest jeszcze wymagany, ponieważ 3C.2 nie jest podłączony do
głównego przeliczenia ani interfejsu. Ręczny test będzie częścią 3C.6 po
integracji 3C.3–3C.5.
