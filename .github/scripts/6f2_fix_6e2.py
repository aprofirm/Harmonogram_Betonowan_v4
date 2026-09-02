from pathlib import Path

path = Path("testy/etap_6e_2.test.js")
text = path.read_text(encoding="utf-8")
old = '''        statusJakosci: "nieoceniona",\n        zrodlo: "mapa"\n'''
new = '''        statusJakosci: "nieoceniona",\n        zrodlo: "mapa",\n        pewnosc: null,\n        poziomPewnosci: "brak-oceny",\n        typWyniku: null\n'''
if old not in text:
    raise SystemExit("Nie znaleziono oczekiwanego kontraktu kandydata w 6E.2")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
