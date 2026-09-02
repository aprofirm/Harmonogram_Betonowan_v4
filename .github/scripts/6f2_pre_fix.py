from pathlib import Path

path = Path("testy/TESTY_ETAP_6.md")
text = path.read_text(encoding="utf-8")
old = "i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Podetap **6F.1**\njest zakończony. Następny podetap to **6F.2 — wiele wyników**.\n"
new = "i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Następny podetap to\n**6F.1 — wyszukiwanie lokalizacji**.\n"
if old not in text:
    raise SystemExit("Nie znaleziono aktualnego naglowka TESTY_ETAP_6.md")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
