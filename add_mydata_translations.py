#!/usr/bin/env python3
"""
add_mydata_translations.py

Adds the missing translation keys used by MyDataScreen.js to
strings.patched.js across all 12 languages.

Keys added:
    totalHours, restDays, balance, last14days, trends, last90days,
    heatmap, last26weeks, weeklyVolume, last12weeks, categoryMix,
    last6months

Usage:
    python3 add_mydata_translations.py path/to/strings.patched.js
"""

import json
import re
import sys
from pathlib import Path


TRANSLATIONS = {
    "totalHours": {
        "en": "Hours", "no": "Timer",
        "nl": "Uren", "fr": "Heures", "de": "Stunden",
        "it": "Ore", "sv": "Timmar", "da": "Timer",
        "fi": "Tunnit", "es": "Horas", "pl": "Godziny",
        "pt": "Horas",
    },
    "restDays": {
        "en": "Rest days", "no": "Hviledager",
        "nl": "Rustdagen", "fr": "Jours de repos", "de": "Ruhetage",
        "it": "Giorni di riposo", "sv": "Vilodagar", "da": "Hviledage",
        "fi": "Lepopäivät", "es": "Días de descanso", "pl": "Dni odpoczynku",
        "pt": "Dias de descanso",
    },
    "balance": {
        "en": "Balance", "no": "Balanse",
        "nl": "Balans", "fr": "Équilibre", "de": "Balance",
        "it": "Equilibrio", "sv": "Balans", "da": "Balance",
        "fi": "Tasapaino", "es": "Equilibrio", "pl": "Równowaga",
        "pt": "Equilíbrio",
    },
    "last14days": {
        "en": "Average across the last 14 days",
        "no": "Gjennomsnitt for de siste 14 dagene",
        "nl": "Gemiddelde over de laatste 14 dagen",
        "fr": "Moyenne sur les 14 derniers jours",
        "de": "Durchschnitt der letzten 14 Tage",
        "it": "Media degli ultimi 14 giorni",
        "sv": "Genomsnitt över de senaste 14 dagarna",
        "da": "Gennemsnit for de sidste 14 dage",
        "fi": "Viimeisen 14 päivän keskiarvo",
        "es": "Promedio de los últimos 14 días",
        "pl": "Średnia z ostatnich 14 dni",
        "pt": "Média dos últimos 14 dias",
    },
    "trends": {
        "en": "Trends", "no": "Trender",
        "nl": "Trends", "fr": "Tendances", "de": "Trends",
        "it": "Tendenze", "sv": "Trender", "da": "Tendenser",
        "fi": "Trendit", "es": "Tendencias", "pl": "Trendy",
        "pt": "Tendências",
    },
    "last90days": {
        "en": "Effort, mood, energy, sleep over time",
        "no": "Innsats, humør, energi og søvn over tid",
        "nl": "Inspanning, stemming, energie, slaap over tijd",
        "fr": "Effort, humeur, énergie, sommeil au fil du temps",
        "de": "Anstrengung, Stimmung, Energie, Schlaf im Zeitverlauf",
        "it": "Sforzo, umore, energia, sonno nel tempo",
        "sv": "Ansträngning, humör, energi, sömn över tid",
        "da": "Indsats, humør, energi, søvn over tid",
        "fi": "Rasitus, mieliala, energia, uni ajan myötä",
        "es": "Esfuerzo, ánimo, energía, sueño con el tiempo",
        "pl": "Wysiłek, nastrój, energia, sen w czasie",
        "pt": "Esforço, humor, energia, sono ao longo do tempo",
    },
    "heatmap": {
        "en": "Heatmap", "no": "Varmekart",
        "nl": "Heatmap", "fr": "Carte thermique", "de": "Heatmap",
        "it": "Mappa di calore", "sv": "Värmekarta", "da": "Varmekort",
        "fi": "Lämpökartta", "es": "Mapa de calor", "pl": "Mapa cieplna",
        "pt": "Mapa de calor",
    },
    "last26weeks": {
        "en": "Daily intensity, last 6 months",
        "no": "Daglig intensitet, siste 6 måneder",
        "nl": "Dagelijkse intensiteit, laatste 6 maanden",
        "fr": "Intensité quotidienne, 6 derniers mois",
        "de": "Tägliche Intensität, letzte 6 Monate",
        "it": "Intensità giornaliera, ultimi 6 mesi",
        "sv": "Daglig intensitet, senaste 6 månaderna",
        "da": "Daglig intensitet, sidste 6 måneder",
        "fi": "Päivittäinen rasitus, viimeiset 6 kuukautta",
        "es": "Intensidad diaria, últimos 6 meses",
        "pl": "Dzienna intensywność, ostatnie 6 miesięcy",
        "pt": "Intensidade diária, últimos 6 meses",
    },
    "weeklyVolume": {
        "en": "Weekly volume", "no": "Ukentlig volum",
        "nl": "Wekelijks volume", "fr": "Volume hebdomadaire",
        "de": "Wöchentliches Volumen", "it": "Volume settimanale",
        "sv": "Veckovolym", "da": "Ugentlig volumen",
        "fi": "Viikoittainen määrä", "es": "Volumen semanal",
        "pl": "Tygodniowy wolumen", "pt": "Volume semanal",
    },
    "last12weeks": {
        "en": "Total minutes per week",
        "no": "Totalt antall minutter per uke",
        "nl": "Totaal minuten per week",
        "fr": "Minutes totales par semaine",
        "de": "Gesamtminuten pro Woche",
        "it": "Minuti totali a settimana",
        "sv": "Totala minuter per vecka",
        "da": "Samlede minutter per uge",
        "fi": "Minuutit yhteensä viikossa",
        "es": "Minutos totales por semana",
        "pl": "Łączne minuty na tydzień",
        "pt": "Minutos totais por semana",
    },
    "categoryMix": {
        "en": "Category mix", "no": "Kategorifordeling",
        "nl": "Categoriemix", "fr": "Répartition par catégorie",
        "de": "Kategorienverteilung", "it": "Mix per categoria",
        "sv": "Kategorimix", "da": "Kategorifordeling",
        "fi": "Kategoriajakauma", "es": "Mezcla por categoría",
        "pl": "Podział na kategorie", "pt": "Distribuição por categoria",
    },
}


HEADER = "// strings.patched.js\n\nconst strings = "
FOOTER = ";\n\nexport default strings;\n"


def load_strings(js_path: Path) -> dict:
    text = js_path.read_text(encoding="utf-8")
    m = re.search(r"const\s+strings\s*=\s*", text)
    if not m:
        raise SystemExit("Could not find `const strings = ...` in the file.")
    start = text.index("{", m.end())
    depth = 0
    in_str = False
    str_char = ""
    escape = False
    end = None
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == str_char:
                in_str = False
        else:
            if c in ('"', "'"):
                in_str = True
                str_char = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
    if end is None:
        raise SystemExit("Could not find end of strings object.")
    return json.loads(text[start:end])


def write_strings(js_path: Path, strings: dict) -> None:
    body = json.dumps(strings, ensure_ascii=False, indent=2)
    js_path.write_text(HEADER + body + FOOTER, encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python3 add_mydata_translations.py path/to/strings.patched.js")
        sys.exit(1)

    path = Path(sys.argv[1])
    strings = load_strings(path)

    added = 0
    skipped = 0
    for key, lang_map in TRANSLATIONS.items():
        for lang, value in lang_map.items():
            block = strings.get(lang)
            if block is None:
                continue
            if key in block:
                skipped += 1
            else:
                block[key] = value
                added += 1

    write_strings(path, strings)
    print(f"Added   {added} new key/lang entries.")
    print(f"Skipped {skipped} (already existed).")
    print(f"Wrote   {path}")


if __name__ == "__main__":
    main()
