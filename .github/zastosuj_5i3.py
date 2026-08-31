from pathlib import Path


def load(p):
    return Path(p).read_text(encoding="utf-8")


def save(p, s):
    Path(p).write_text(s, encoding="utf-8")


def rep(s, old, new, label):
    if old not in s:
        raise SystemExit("Brak fragmentu: " + label)
    return s.replace(old, new, 1)


# Interfejs: globalny limit przestoju jako parametr planu.
p = "js/interfejs/interfejs.js"
s = load(p)
s = rep(s,
    '      maksymalneOpoznienie: pobierzWymaganyElement("maksymalne-opoznienie"),\n',
    '      maksymalneOpoznienie: pobierzWymaganyElement("maksymalne-opoznienie"),\n      maksymalnyPrzestoj: document.getElementById("maksymalny-przestoj"),\n',
    "element maksymalnego przestoju")
s = rep(s,
    '    elementy.maksymalneOpoznienie.value = String(\n      parametryDomyslne.maksymalneOpoznienieStartuMinuty\n    );\n    elementy.trybGruszek.value = parametryDomyslne.trybGruszek;\n',
    '    elementy.maksymalneOpoznienie.value = String(\n      parametryDomyslne.maksymalneOpoznienieStartuMinuty\n    );\n    if (elementy.maksymalnyPrzestoj) {\n      elementy.maksymalnyPrzestoj.value = String(\n        parametryDomyslne.maksymalnyPrzestojMinuty\n      );\n    }\n    elementy.trybGruszek.value = parametryDomyslne.trybGruszek;\n',
    "domyślna wartość")
s = rep(s,
    '      maksymalneOpoznienieStartuMinuty: elementy.maksymalneOpoznienie.value,\n      trybGruszek: elementy.trybGruszek.value,\n',
    '      maksymalneOpoznienieStartuMinuty: elementy.maksymalneOpoznienie.value,\n      maksymalnyPrzestojMinuty: elementy.maksymalnyPrzestoj\n        ? elementy.maksymalnyPrzestoj.value\n        : parametryDomyslneInterfejsu.maksymalnyPrzestojMinuty,\n      trybGruszek: elementy.trybGruszek.value,\n',
    "zapis parametru")
s = rep(s,
    '    elementy.trybGruszek.value = formatujWartoscPola(\n      pobierzWartoscLubDomyslna(parametry, "trybGruszek")\n    );\n',
    '    if (elementy.maksymalnyPrzestoj) {\n      elementy.maksymalnyPrzestoj.value = formatujWartoscPola(\n        pobierzWartoscLubDomyslna(parametry, "maksymalnyPrzestojMinuty")\n      );\n    }\n    elementy.trybGruszek.value = formatujWartoscPola(\n      pobierzWartoscLubDomyslna(parametry, "trybGruszek")\n    );\n',
    "odtworzenie parametru")
s = rep(s,
    '      maksymalneOpoznienieStartuMinuty: pobierzLiczbe(\n        elementy.maksymalneOpoznienie,\n        "Maksymalne opóźnienie startu",\n        0\n      ),\n      trybGruszek: trybGruszek,\n',
    '      maksymalneOpoznienieStartuMinuty: pobierzLiczbe(\n        elementy.maksymalneOpoznienie,\n        "Maksymalne opóźnienie startu",\n        0\n      ),\n      maksymalnyPrzestojMinuty: elementy.maksymalnyPrzestoj\n        ? pobierzLiczbe(\n            elementy.maksymalnyPrzestoj,\n            "Maksymalny przestój między dostawami",\n            0\n          )\n        : Number(parametryDomyslneInterfejsu.maksymalnyPrzestojMinuty),\n      trybGruszek: trybGruszek,\n',
    "walidacja parametru")
s = rep(s,
    '      elementy.maksymalneOpoznienie,\n      elementy.liczbaDostepnychGruszek,\n',
    '      elementy.maksymalneOpoznienie,\n      elementy.maksymalnyPrzestoj,\n      elementy.liczbaDostepnychGruszek,\n',
    "nasłuchiwanie parametru")
s = rep(s,
    '    ].forEach(function (pole) {\n      pole.addEventListener("change", function () {\n',
    '    ].filter(Boolean).forEach(function (pole) {\n      pole.addEventListener("change", function () {\n',
    "zgodność starszych testów")
save(p, s)

# HTML.
p = "index.html"
s = load(p)
s = s.replace("5i2-konflikty-interfejs-20260831a", "5i3-pamiec-stan-20260831a")
s = s.replace("Etap 5I.2", "Etap 5I.3")
s = s.replace("5I.2 · konflikty i przestoje", "5I.3 · pamięć i stan nieaktualny")
old = '''            <label class="pole-formularza" for="maksymalne-opoznienie">
              <span>Maksymalne opóźnienie startu</span>
              <span class="pole-z-jednostka">
                <input id="maksymalne-opoznienie" name="maksymalneOpoznienieStartuMinuty" type="number" min="0" step="1" required>
                <span>min</span>
              </span>
            </label>
'''
new = old + '''
            <label class="pole-formularza" for="maksymalny-przestoj">
              <span>Maksymalny przestój między dostawami</span>
              <span class="pole-z-jednostka">
                <input id="maksymalny-przestoj" name="maksymalnyPrzestojMinuty" type="number" min="0" step="1" required>
                <span>min</span>
              </span>
            </label>
'''
s = rep(s, old, new, "pole HTML")
save(p, s)

# Konfiguracja.
p = "js/konfiguracja/konfiguracja.js"
s = load(p).replace('punktEtapu: "5I.2"', 'punktEtapu: "5I.3"')
save(p, s)

# Historyczne testy, które kontrolują bieżący numer wersji.
for p in Path("testy").glob("*.test.js"):
    s = load(p)
    if "5I.2" in s or "5i2-konflikty-interfejs-20260831a" in s:
        s = s.replace('"5I.2"', '"5I.3"')
        s = s.replace("Etap 5I.2", "Etap 5I.3")
        s = s.replace("5I.2 · konflikty i przestoje", "5I.3 · pamięć i stan nieaktualny")
        s = s.replace("5i2-konflikty-interfejs-20260831a", "5i3-pamiec-stan-20260831a")
        save(p, s)

# Etapy.
p = "ETAPY_ROZWOJU.md"
s = load(p)
s = s.replace("**rozpoczęty; następny podetap 5I.3**", "**rozpoczęty; następny podetap 5J.1**", 1)
s = s.replace("- [ ] **5I — interfejs, parametry i pamięć wyniku Etapu 5.**", "- [x] **5I — interfejs, parametry i pamięć wyniku Etapu 5.**", 1)
s = s.replace("  - [ ] **5I.3 — pamięć i stan nieaktualny:**", "  - [x] **5I.3 — pamięć i stan nieaktualny:**", 1)
marker = "Następny niezakończony podetap: **5I.3 — pamięć i stan nieaktualny**.\n"
block = marker + '''
## Zamknięcie 5I.3 — pamięć i stan nieaktualny — 2026-08-31

- [x] globalny parametr **Maksymalny przestój między dostawami** jest widoczny w ustawieniach i domyślnie ma `15 min`;
- [x] `maksymalnyPrzestojMinuty` jest walidowany, przekazywany do pełnego przeliczenia oraz zapisywany razem z pozostałymi parametrami planu;
- [x] parametr jest odtwarzany z bieżącego planu i historii, a starszy zapis bez pola korzysta z bieżącej wartości domyślnej `15 min`;
- [x] indywidualny `maksymalneOpoznienieStartuBudowyMinuty` pozostaje zachowywany w planie i historii zgodnie z 5F.2;
- [x] zmiana parametrów albo indywidualnego wyjątku budowy oznacza poprzedni wynik jako nieaktualny i wymaga pełnego przeliczenia;
- [x] odtworzenie wcześniej przeliczonego planu uruchamia obliczenie ponownie z zapisanych danych zamiast przywracać stary wynik jako źródło prawdy;
- [x] zachowano kompatybilność ze starszymi zapisami oraz minimalistycznymi środowiskami testowymi;
- [x] test `testy/etap_5i_3.test.js` oraz pełna regresja przechodzą przed publikacją.

Podetap **5I.3** oraz cały punkt **5I — interfejs, parametry i pamięć wyniku Etapu 5** są zakończone. Cały Etap 5 pozostaje otwarty do zakończenia 5J.
Następny niezakończony podetap: **5J.1 — pełna regresja automatyczna Etapu 5**.
'''
s = rep(s, marker, block, "zamknięcie 5I.3")
save(p, s)

# Decyzja projektowa.
p = "PROJECT_DECISIONS.md"
s = load(p)
if "## 119. Parametry Etapu 5 są częścią planu" not in s:
    s += '''

---

## 119. Parametry Etapu 5 są częścią planu, a ich zmiana unieważnia wynik

Od 5I.3 globalny `maksymalnyPrzestojMinuty` jest pełnoprawnym parametrem operatorskim obok globalnego limitu opóźnienia startu. Domyślna wartość pozostaje `15 min`. Parametr jest zapisywany w bieżącym planie i historii oraz odtwarzany po ponownym uruchomieniu; starszy zapis bez tego pola dziedziczy bieżącą wartość domyślną zamiast przyjmować `0`.

Indywidualny `maksymalneOpoznienieStartuBudowyMinuty` nadal należy do stanu konkretnej budowy. Każda istotna zmiana parametrów planu, zasobów albo wyjątku budowy oznacza poprzedni wynik jako nieaktualny i wymaga nowego pełnego przeliczenia.

Gotowy wynik harmonogramu nie jest źródłem prawdy w pamięci. Jeżeli odtworzony plan był wcześniej przeliczony, aplikacja odbudowuje wynik od nowa z zapisanych danych, parametrów, budów i zasobów.
'''
save(p, s)

# README.
p = "README.md"
s = load(p)
anchor = "Gdy konfliktów nie ma, panel pozostaje ukryty. Zmiana danych planu czyści poprzedni panel razem z nieaktualnym wynikiem.\n"
extra = anchor + '''

### Limit przestoju i aktualność wyniku

W ustawieniach planu znajduje się **Maksymalny przestój między dostawami**, domyślnie `15 min`. Jest to osobny parametr od **Maksymalnego opóźnienia startu**. Obie wartości są zachowywane w bieżącym planie i historii. Starszy zapis bez limitu przestoju korzysta z bieżącej wartości domyślnej `15 min`.

Każda istotna zmiana parametrów, zasobów albo indywidualnego limitu budowy unieważnia poprzedni wynik i wymaga ponownego użycia **Przelicz harmonogram**. Odtworzony wcześniej przeliczony plan jest liczony ponownie z zachowanych danych zamiast używać starego wyniku.
'''
s = rep(s, anchor, extra, "README parametr i stan")
s = s.replace("Podetap **5I.2 — konflikty i przestoje w interfejsie** jest zakończony. Następny krok to **5I.3 — pamięć i stan nieaktualny**.", "Cały punkt **5I — interfejs, parametry i pamięć wyniku Etapu 5** jest zakończony. Następny krok to **5J.1 — pełna regresja automatyczna Etapu 5**.")
save(p, s)
