from pathlib import Path

path = Path("js/interfejs/kandydaci_lokalizacji.js")
text = path.read_text(encoding="utf-8")
old = '''    const wartosc = Number(kandydat && kandydat.pewnosc);\n\n    if (!Number.isFinite(wartosc) || wartosc < 0 || wartosc > 1) {\n      return etykiety[poziom];\n    }\n'''
new = '''    const surowaPewnosc = kandydat && kandydat.pewnosc;\n\n    if (surowaPewnosc === null || surowaPewnosc === undefined || surowaPewnosc === "") {\n      return etykiety[poziom];\n    }\n\n    const wartosc = Number(surowaPewnosc);\n\n    if (!Number.isFinite(wartosc) || wartosc < 0 || wartosc > 1) {\n      return etykiety[poziom];\n    }\n'''
if old not in text:
    raise SystemExit("Nie znaleziono formatowania pewnosci w interfejsie 6F.2")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
