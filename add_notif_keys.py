#!/usr/bin/env python3
"""
add_notif_keys.py

Adds 4 notification-related translation keys to every language block in
strings.patched.js:

  - notifTitle              (push notification title)
  - notifBody               (push notification body)
  - notifSubtitleOff        (settings row subtitle when reminder is off)
  - notifPermissionDenied   (alert text when iOS/Android denies permission)

The keys are inserted right after the existing `notifications` line in each
language so they sit next to the related notification keys.

Run from the project root:
    python3 add_notif_keys.py [path/to/strings.patched.js]

Defaults to ./strings.patched.js if no path given. Writes in place.
Idempotent — running it twice does nothing.
"""

import re
import sys
from pathlib import Path

# ── Translations per language ──────────────────────────────────────────────

TRANSLATIONS = {
    "en": {
        "notifTitle":             "Coachly",
        "notifBody":              "Time to check in with your training 💪",
        "notifSubtitleOff":       "Get a daily reminder to log your training",
        "notifPermissionDenied":  "Please enable notifications for Coachly in your device settings.",
    },
    "no": {
        "notifTitle":             "Coachly",
        "notifBody":              "På tide å sjekke inn med treningen din 💪",
        "notifSubtitleOff":       "Få en daglig påminnelse om å logge treningen",
        "notifPermissionDenied":  "Aktiver varsler for Coachly i enhetsinnstillingene.",
    },
    "nl": {
        "notifTitle":             "Coachly",
        "notifBody":              "Tijd om je training in te checken 💪",
        "notifSubtitleOff":       "Ontvang een dagelijkse herinnering om je training te loggen",
        "notifPermissionDenied":  "Schakel meldingen in voor Coachly in je apparaatinstellingen.",
    },
    "fr": {
        "notifTitle":             "Coachly",
        "notifBody":              "C'est l'heure d'enregistrer ton entraînement 💪",
        "notifSubtitleOff":       "Recevoir un rappel quotidien pour enregistrer ton entraînement",
        "notifPermissionDenied":  "Active les notifications pour Coachly dans les paramètres de ton appareil.",
    },
    "de": {
        "notifTitle":             "Coachly",
        "notifBody":              "Zeit, dein Training zu erfassen 💪",
        "notifSubtitleOff":       "Erhalte eine tägliche Erinnerung, dein Training zu protokollieren",
        "notifPermissionDenied":  "Bitte aktiviere Benachrichtigungen für Coachly in den Geräteeinstellungen.",
    },
    "it": {
        "notifTitle":             "Coachly",
        "notifBody":              "È il momento di registrare il tuo allenamento 💪",
        "notifSubtitleOff":       "Ricevi un promemoria giornaliero per registrare il tuo allenamento",
        "notifPermissionDenied":  "Attiva le notifiche per Coachly nelle impostazioni del dispositivo.",
    },
    "sv": {
        "notifTitle":             "Coachly",
        "notifBody":              "Dags att checka in med din träning 💪",
        "notifSubtitleOff":       "Få en daglig påminnelse om att logga din träning",
        "notifPermissionDenied":  "Aktivera aviseringar för Coachly i enhetens inställningar.",
    },
    "da": {
        "notifTitle":             "Coachly",
        "notifBody":              "Tid til at tjekke ind med din træning 💪",
        "notifSubtitleOff":       "Få en daglig påmindelse om at logge din træning",
        "notifPermissionDenied":  "Aktiver notifikationer for Coachly i enhedens indstillinger.",
    },
    "fi": {
        "notifTitle":             "Coachly",
        "notifBody":              "Aika kirjata harjoitus 💪",
        "notifSubtitleOff":       "Saa päivittäinen muistutus harjoituksen kirjaamisesta",
        "notifPermissionDenied":  "Ota ilmoitukset käyttöön Coachly-sovellukselle laitteen asetuksista.",
    },
    "es": {
        "notifTitle":             "Coachly",
        "notifBody":              "Es hora de registrar tu entrenamiento 💪",
        "notifSubtitleOff":       "Recibe un recordatorio diario para registrar tu entrenamiento",
        "notifPermissionDenied":  "Activa las notificaciones para Coachly en los ajustes del dispositivo.",
    },
    "pl": {
        "notifTitle":             "Coachly",
        "notifBody":              "Czas na zapis treningu 💪",
        "notifSubtitleOff":       "Otrzymuj codzienne przypomnienie o zapisaniu treningu",
        "notifPermissionDenied":  "Włącz powiadomienia dla Coachly w ustawieniach urządzenia.",
    },
    "pt": {
        "notifTitle":             "Coachly",
        "notifBody":              "Hora de registar o teu treino 💪",
        "notifSubtitleOff":       "Recebe um lembrete diário para registar o teu treino",
        "notifPermissionDenied":  "Ativa as notificações para o Coachly nas definições do dispositivo.",
    },
}

# Keys we add, in the order they should appear in each block
NEW_KEYS = ["notifTitle", "notifBody", "notifSubtitleOff", "notifPermissionDenied"]


def patch_block(text: str, lang: str, entries: dict) -> tuple[str, str]:
    """
    Patch a single language block. Returns (new_text, status).
    status is one of: "added", "skipped" (already present), "error".
    """
    # Locate the language block: matches `"<lang>": {  ...  },` at the top level
    block_pattern = re.compile(
        r'(?P<head>"' + re.escape(lang) + r'"\s*:\s*\{)'
        r'(?P<body>.*?)'
        r'(?P<tail>\n  \},?)',
        re.DOTALL,
    )
    m = block_pattern.search(text)
    if not m:
        return text, f"error: block for '{lang}' not found"

    body = m.group("body")

    # If notifPermissionDenied already present, assume the patch ran already
    if '"notifPermissionDenied"' in body:
        return text, "skipped (already patched)"

    # Find the line that contains  "notifications": "..."
    # We insert the new keys right after it.
    notif_pattern = re.compile(r'(\n    "notifications":\s*"[^"]*",)', re.DOTALL)
    nm = notif_pattern.search(body)
    if not nm:
        return text, f"error: '\"notifications\"' line not found in '{lang}'"

    # Build the new lines, matching the indentation/style of the existing file
    new_lines = "".join(
        f'\n    "{k}": "{escape_js_string(entries[k])}",'
        for k in NEW_KEYS
    )

    # Insert after the matched "notifications" line
    insert_at = nm.end()
    new_body = body[:insert_at] + new_lines + body[insert_at:]

    new_block = m.group("head") + new_body + m.group("tail")
    new_text = text[:m.start()] + new_block + text[m.end():]
    return new_text, "added"


def escape_js_string(s: str) -> str:
    """Escape backslash and double quotes for embedding inside a JS string."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main():
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "strings.patched.js")
    if not path.exists():
        sys.exit(f"File not found: {path}")

    text = path.read_text(encoding="utf-8")
    original = text

    print(f"Patching {path} ...")
    for lang, entries in TRANSLATIONS.items():
        text, status = patch_block(text, lang, entries)
        print(f"  [{lang}] {status}")

    if text == original:
        print("\nNo changes written.")
        return

    path.write_text(text, encoding="utf-8")
    print(f"\nWrote updated {path}.")


if __name__ == "__main__":
    main()
