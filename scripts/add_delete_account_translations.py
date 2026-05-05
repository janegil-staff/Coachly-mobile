#!/usr/bin/env python3
"""
Add Delete Account translation keys to Coachly's translations.

Idempotent — safe to run multiple times. Existing keys are left untouched.

Run from coachly-mobile root:
    python3 scripts/add_delete_account_translations.py

Detects whether translations live in:
    - src/lib/translations.js (single file with all langs as one default export)
    - src/translations/{lang}.js (per-language files)
"""

import re
import sys
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────
# Translations for all 12 supported languages
# ─────────────────────────────────────────────────────────────────────

TRANSLATIONS = {
    "en": {
        "account": "Account",
        "deleteAccount": "Delete Account",
        "deleteAccountSubtitle": "Permanently delete your account and all data",
        "deleteAccountTitle": "Delete Account",
        "deleteAccountWarning": "Deleting your account will permanently remove the following data:",
        "deleteAccountWarningSessions": "All training sessions and logs",
        "deleteAccountWarningQuestionnaires": "All questionnaire responses (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "All share codes with your coach",
        "deleteAccountWarningProfile": "Your profile, goals, and personal settings",
        "deleteAccountWarningIrreversible": "This action cannot be undone.",
        "deleteAccountUnderstand": "I understand that this will permanently delete my account and all associated data.",
        "deleteAccountEnterPinPrompt": "Enter your PIN to confirm",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Please enter your PIN",
        "deleteAccountConfirmButton": "Delete My Account",
        "deleteAccountFinalConfirmTitle": "Are you absolutely sure?",
        "deleteAccountFinalConfirmMessage": "Your account and all data will be permanently deleted. This cannot be undone.",
        "deleteAccountSuccessTitle": "Account Deleted",
        "deleteAccountSuccessMessage": "Your account and all associated data have been permanently deleted.",
        "deleteAccountErrorTitle": "Deletion Failed",
        "deleteAccountErrorMessage": "Could not delete account. Please try again.",
        "cancel": "Cancel",
    },
    "no": {
        "account": "Konto",
        "deleteAccount": "Slett konto",
        "deleteAccountSubtitle": "Slett kontoen din og alle data permanent",
        "deleteAccountTitle": "Slett konto",
        "deleteAccountWarning": "Sletting av kontoen vil permanent fjerne følgende data:",
        "deleteAccountWarningSessions": "Alle treningsøkter og logger",
        "deleteAccountWarningQuestionnaires": "Alle spørreskjemasvar (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Alle delingskoder med treneren din",
        "deleteAccountWarningProfile": "Profilen din, mål og personlige innstillinger",
        "deleteAccountWarningIrreversible": "Denne handlingen kan ikke angres.",
        "deleteAccountUnderstand": "Jeg forstår at dette vil slette kontoen min og alle tilknyttede data permanent.",
        "deleteAccountEnterPinPrompt": "Skriv inn PIN-koden for å bekrefte",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Vennligst skriv inn PIN-koden",
        "deleteAccountConfirmButton": "Slett kontoen min",
        "deleteAccountFinalConfirmTitle": "Er du helt sikker?",
        "deleteAccountFinalConfirmMessage": "Kontoen din og alle data vil bli slettet permanent. Dette kan ikke angres.",
        "deleteAccountSuccessTitle": "Konto slettet",
        "deleteAccountSuccessMessage": "Kontoen din og alle tilknyttede data er slettet permanent.",
        "deleteAccountErrorTitle": "Sletting mislyktes",
        "deleteAccountErrorMessage": "Kunne ikke slette kontoen. Vennligst prøv igjen.",
        "cancel": "Avbryt",
    },
    "sv": {
        "account": "Konto",
        "deleteAccount": "Radera konto",
        "deleteAccountSubtitle": "Radera ditt konto och all data permanent",
        "deleteAccountTitle": "Radera konto",
        "deleteAccountWarning": "Att radera ditt konto tar permanent bort följande data:",
        "deleteAccountWarningSessions": "Alla träningspass och loggar",
        "deleteAccountWarningQuestionnaires": "Alla enkätsvar (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Alla delningskoder med din tränare",
        "deleteAccountWarningProfile": "Din profil, mål och personliga inställningar",
        "deleteAccountWarningIrreversible": "Denna åtgärd kan inte ångras.",
        "deleteAccountUnderstand": "Jag förstår att detta permanent kommer att radera mitt konto och all tillhörande data.",
        "deleteAccountEnterPinPrompt": "Ange din PIN-kod för att bekräfta",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Vänligen ange din PIN-kod",
        "deleteAccountConfirmButton": "Radera mitt konto",
        "deleteAccountFinalConfirmTitle": "Är du helt säker?",
        "deleteAccountFinalConfirmMessage": "Ditt konto och all data kommer att raderas permanent. Detta kan inte ångras.",
        "deleteAccountSuccessTitle": "Konto raderat",
        "deleteAccountSuccessMessage": "Ditt konto och all tillhörande data har raderats permanent.",
        "deleteAccountErrorTitle": "Radering misslyckades",
        "deleteAccountErrorMessage": "Kunde inte radera kontot. Försök igen.",
        "cancel": "Avbryt",
    },
    "da": {
        "account": "Konto",
        "deleteAccount": "Slet konto",
        "deleteAccountSubtitle": "Slet din konto og alle data permanent",
        "deleteAccountTitle": "Slet konto",
        "deleteAccountWarning": "Sletning af din konto vil permanent fjerne følgende data:",
        "deleteAccountWarningSessions": "Alle træningssessioner og logs",
        "deleteAccountWarningQuestionnaires": "Alle spørgeskemabesvarelser (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Alle delingskoder med din træner",
        "deleteAccountWarningProfile": "Din profil, mål og personlige indstillinger",
        "deleteAccountWarningIrreversible": "Denne handling kan ikke fortrydes.",
        "deleteAccountUnderstand": "Jeg forstår, at dette permanent vil slette min konto og alle tilknyttede data.",
        "deleteAccountEnterPinPrompt": "Indtast din PIN-kode for at bekræfte",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Indtast venligst din PIN-kode",
        "deleteAccountConfirmButton": "Slet min konto",
        "deleteAccountFinalConfirmTitle": "Er du helt sikker?",
        "deleteAccountFinalConfirmMessage": "Din konto og alle data vil blive slettet permanent. Dette kan ikke fortrydes.",
        "deleteAccountSuccessTitle": "Konto slettet",
        "deleteAccountSuccessMessage": "Din konto og alle tilknyttede data er blevet slettet permanent.",
        "deleteAccountErrorTitle": "Sletning mislykkedes",
        "deleteAccountErrorMessage": "Kunne ikke slette kontoen. Prøv venligst igen.",
        "cancel": "Annuller",
    },
    "fi": {
        "account": "Tili",
        "deleteAccount": "Poista tili",
        "deleteAccountSubtitle": "Poista tilisi ja kaikki tiedot pysyvästi",
        "deleteAccountTitle": "Poista tili",
        "deleteAccountWarning": "Tilin poistaminen poistaa pysyvästi seuraavat tiedot:",
        "deleteAccountWarningSessions": "Kaikki harjoitukset ja lokit",
        "deleteAccountWarningQuestionnaires": "Kaikki kyselyvastaukset (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Kaikki valmentajan kanssa jaetut koodit",
        "deleteAccountWarningProfile": "Profiilisi, tavoitteesi ja henkilökohtaiset asetuksesi",
        "deleteAccountWarningIrreversible": "Tätä toimintoa ei voi peruuttaa.",
        "deleteAccountUnderstand": "Ymmärrän, että tämä poistaa pysyvästi tilini ja kaikki siihen liittyvät tiedot.",
        "deleteAccountEnterPinPrompt": "Syötä PIN-koodi vahvistaaksesi",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Syötä PIN-koodi",
        "deleteAccountConfirmButton": "Poista tilini",
        "deleteAccountFinalConfirmTitle": "Oletko aivan varma?",
        "deleteAccountFinalConfirmMessage": "Tilisi ja kaikki tiedot poistetaan pysyvästi. Tätä ei voi peruuttaa.",
        "deleteAccountSuccessTitle": "Tili poistettu",
        "deleteAccountSuccessMessage": "Tilisi ja kaikki siihen liittyvät tiedot on poistettu pysyvästi.",
        "deleteAccountErrorTitle": "Poisto epäonnistui",
        "deleteAccountErrorMessage": "Tilin poistaminen epäonnistui. Yritä uudelleen.",
        "cancel": "Peruuta",
    },
    "de": {
        "account": "Konto",
        "deleteAccount": "Konto löschen",
        "deleteAccountSubtitle": "Konto und alle Daten dauerhaft löschen",
        "deleteAccountTitle": "Konto löschen",
        "deleteAccountWarning": "Beim Löschen Ihres Kontos werden die folgenden Daten dauerhaft entfernt:",
        "deleteAccountWarningSessions": "Alle Trainingseinheiten und Protokolle",
        "deleteAccountWarningQuestionnaires": "Alle Fragebogenantworten (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Alle Freigabecodes mit Ihrem Coach",
        "deleteAccountWarningProfile": "Ihr Profil, Ihre Ziele und persönlichen Einstellungen",
        "deleteAccountWarningIrreversible": "Diese Aktion kann nicht rückgängig gemacht werden.",
        "deleteAccountUnderstand": "Ich verstehe, dass dadurch mein Konto und alle zugehörigen Daten dauerhaft gelöscht werden.",
        "deleteAccountEnterPinPrompt": "PIN zur Bestätigung eingeben",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Bitte PIN eingeben",
        "deleteAccountConfirmButton": "Mein Konto löschen",
        "deleteAccountFinalConfirmTitle": "Sind Sie absolut sicher?",
        "deleteAccountFinalConfirmMessage": "Ihr Konto und alle Daten werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
        "deleteAccountSuccessTitle": "Konto gelöscht",
        "deleteAccountSuccessMessage": "Ihr Konto und alle zugehörigen Daten wurden dauerhaft gelöscht.",
        "deleteAccountErrorTitle": "Löschen fehlgeschlagen",
        "deleteAccountErrorMessage": "Konto konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        "cancel": "Abbrechen",
    },
    "nl": {
        "account": "Account",
        "deleteAccount": "Account verwijderen",
        "deleteAccountSubtitle": "Verwijder je account en alle gegevens permanent",
        "deleteAccountTitle": "Account verwijderen",
        "deleteAccountWarning": "Het verwijderen van je account zal de volgende gegevens permanent verwijderen:",
        "deleteAccountWarningSessions": "Alle trainingssessies en logs",
        "deleteAccountWarningQuestionnaires": "Alle vragenlijstantwoorden (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Alle deelcodes met je coach",
        "deleteAccountWarningProfile": "Je profiel, doelen en persoonlijke instellingen",
        "deleteAccountWarningIrreversible": "Deze actie kan niet ongedaan worden gemaakt.",
        "deleteAccountUnderstand": "Ik begrijp dat dit mijn account en alle bijbehorende gegevens permanent zal verwijderen.",
        "deleteAccountEnterPinPrompt": "Voer je pincode in om te bevestigen",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Voer je pincode in",
        "deleteAccountConfirmButton": "Mijn account verwijderen",
        "deleteAccountFinalConfirmTitle": "Weet je het absoluut zeker?",
        "deleteAccountFinalConfirmMessage": "Je account en alle gegevens worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.",
        "deleteAccountSuccessTitle": "Account verwijderd",
        "deleteAccountSuccessMessage": "Je account en alle bijbehorende gegevens zijn permanent verwijderd.",
        "deleteAccountErrorTitle": "Verwijderen mislukt",
        "deleteAccountErrorMessage": "Kon account niet verwijderen. Probeer het opnieuw.",
        "cancel": "Annuleren",
    },
    "fr": {
        "account": "Compte",
        "deleteAccount": "Supprimer le compte",
        "deleteAccountSubtitle": "Supprimez définitivement votre compte et toutes vos données",
        "deleteAccountTitle": "Supprimer le compte",
        "deleteAccountWarning": "La suppression de votre compte effacera définitivement les données suivantes :",
        "deleteAccountWarningSessions": "Toutes les séances d'entraînement et journaux",
        "deleteAccountWarningQuestionnaires": "Toutes les réponses aux questionnaires (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Tous les codes de partage avec votre coach",
        "deleteAccountWarningProfile": "Votre profil, vos objectifs et paramètres personnels",
        "deleteAccountWarningIrreversible": "Cette action est irréversible.",
        "deleteAccountUnderstand": "Je comprends que cela supprimera définitivement mon compte et toutes les données associées.",
        "deleteAccountEnterPinPrompt": "Entrez votre code PIN pour confirmer",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Veuillez entrer votre code PIN",
        "deleteAccountConfirmButton": "Supprimer mon compte",
        "deleteAccountFinalConfirmTitle": "Êtes-vous absolument sûr ?",
        "deleteAccountFinalConfirmMessage": "Votre compte et toutes les données seront supprimés définitivement. Cette action est irréversible.",
        "deleteAccountSuccessTitle": "Compte supprimé",
        "deleteAccountSuccessMessage": "Votre compte et toutes les données associées ont été supprimés définitivement.",
        "deleteAccountErrorTitle": "Échec de la suppression",
        "deleteAccountErrorMessage": "Impossible de supprimer le compte. Veuillez réessayer.",
        "cancel": "Annuler",
    },
    "es": {
        "account": "Cuenta",
        "deleteAccount": "Eliminar cuenta",
        "deleteAccountSubtitle": "Elimina permanentemente tu cuenta y todos los datos",
        "deleteAccountTitle": "Eliminar cuenta",
        "deleteAccountWarning": "Eliminar tu cuenta borrará permanentemente los siguientes datos:",
        "deleteAccountWarningSessions": "Todas las sesiones de entrenamiento y registros",
        "deleteAccountWarningQuestionnaires": "Todas las respuestas de cuestionarios (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Todos los códigos compartidos con tu entrenador",
        "deleteAccountWarningProfile": "Tu perfil, objetivos y configuración personal",
        "deleteAccountWarningIrreversible": "Esta acción no se puede deshacer.",
        "deleteAccountUnderstand": "Entiendo que esto eliminará permanentemente mi cuenta y todos los datos asociados.",
        "deleteAccountEnterPinPrompt": "Ingresa tu PIN para confirmar",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Por favor ingresa tu PIN",
        "deleteAccountConfirmButton": "Eliminar mi cuenta",
        "deleteAccountFinalConfirmTitle": "¿Estás absolutamente seguro?",
        "deleteAccountFinalConfirmMessage": "Tu cuenta y todos los datos serán eliminados permanentemente. Esto no se puede deshacer.",
        "deleteAccountSuccessTitle": "Cuenta eliminada",
        "deleteAccountSuccessMessage": "Tu cuenta y todos los datos asociados han sido eliminados permanentemente.",
        "deleteAccountErrorTitle": "Error al eliminar",
        "deleteAccountErrorMessage": "No se pudo eliminar la cuenta. Inténtalo de nuevo.",
        "cancel": "Cancelar",
    },
    "it": {
        "account": "Account",
        "deleteAccount": "Elimina account",
        "deleteAccountSubtitle": "Elimina definitivamente il tuo account e tutti i dati",
        "deleteAccountTitle": "Elimina account",
        "deleteAccountWarning": "L'eliminazione dell'account rimuoverà definitivamente i seguenti dati:",
        "deleteAccountWarningSessions": "Tutte le sessioni di allenamento e i registri",
        "deleteAccountWarningQuestionnaires": "Tutte le risposte ai questionari (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Tutti i codici di condivisione con il tuo coach",
        "deleteAccountWarningProfile": "Il tuo profilo, obiettivi e impostazioni personali",
        "deleteAccountWarningIrreversible": "Questa azione non può essere annullata.",
        "deleteAccountUnderstand": "Comprendo che questo eliminerà definitivamente il mio account e tutti i dati associati.",
        "deleteAccountEnterPinPrompt": "Inserisci il PIN per confermare",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Inserisci il tuo PIN",
        "deleteAccountConfirmButton": "Elimina il mio account",
        "deleteAccountFinalConfirmTitle": "Sei assolutamente sicuro?",
        "deleteAccountFinalConfirmMessage": "Il tuo account e tutti i dati saranno eliminati definitivamente. Questa azione non può essere annullata.",
        "deleteAccountSuccessTitle": "Account eliminato",
        "deleteAccountSuccessMessage": "Il tuo account e tutti i dati associati sono stati eliminati definitivamente.",
        "deleteAccountErrorTitle": "Eliminazione fallita",
        "deleteAccountErrorMessage": "Impossibile eliminare l'account. Riprova.",
        "cancel": "Annulla",
    },
    "pl": {
        "account": "Konto",
        "deleteAccount": "Usuń konto",
        "deleteAccountSubtitle": "Trwale usuń konto i wszystkie dane",
        "deleteAccountTitle": "Usuń konto",
        "deleteAccountWarning": "Usunięcie konta trwale usunie następujące dane:",
        "deleteAccountWarningSessions": "Wszystkie sesje treningowe i logi",
        "deleteAccountWarningQuestionnaires": "Wszystkie odpowiedzi na kwestionariusze (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Wszystkie kody udostępniania z trenerem",
        "deleteAccountWarningProfile": "Twój profil, cele i ustawienia osobiste",
        "deleteAccountWarningIrreversible": "Tej operacji nie można cofnąć.",
        "deleteAccountUnderstand": "Rozumiem, że spowoduje to trwałe usunięcie mojego konta i wszystkich powiązanych danych.",
        "deleteAccountEnterPinPrompt": "Wprowadź PIN, aby potwierdzić",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Proszę wprowadzić PIN",
        "deleteAccountConfirmButton": "Usuń moje konto",
        "deleteAccountFinalConfirmTitle": "Czy jesteś absolutnie pewien?",
        "deleteAccountFinalConfirmMessage": "Twoje konto i wszystkie dane zostaną trwale usunięte. Tej operacji nie można cofnąć.",
        "deleteAccountSuccessTitle": "Konto usunięte",
        "deleteAccountSuccessMessage": "Twoje konto i wszystkie powiązane dane zostały trwale usunięte.",
        "deleteAccountErrorTitle": "Usuwanie nie powiodło się",
        "deleteAccountErrorMessage": "Nie można usunąć konta. Spróbuj ponownie.",
        "cancel": "Anuluj",
    },
    "pt": {
        "account": "Conta",
        "deleteAccount": "Excluir conta",
        "deleteAccountSubtitle": "Exclua permanentemente sua conta e todos os dados",
        "deleteAccountTitle": "Excluir conta",
        "deleteAccountWarning": "Excluir sua conta removerá permanentemente os seguintes dados:",
        "deleteAccountWarningSessions": "Todas as sessões de treino e registros",
        "deleteAccountWarningQuestionnaires": "Todas as respostas de questionários (PSS-10, PSQI, IPAQ-SF)",
        "deleteAccountWarningShares": "Todos os códigos de compartilhamento com seu treinador",
        "deleteAccountWarningProfile": "Seu perfil, metas e configurações pessoais",
        "deleteAccountWarningIrreversible": "Esta ação não pode ser desfeita.",
        "deleteAccountUnderstand": "Entendo que isso excluirá permanentemente minha conta e todos os dados associados.",
        "deleteAccountEnterPinPrompt": "Digite seu PIN para confirmar",
        "deleteAccountPinPlaceholder": "PIN",
        "deleteAccountPinRequired": "Por favor, digite seu PIN",
        "deleteAccountConfirmButton": "Excluir minha conta",
        "deleteAccountFinalConfirmTitle": "Tem certeza absoluta?",
        "deleteAccountFinalConfirmMessage": "Sua conta e todos os dados serão excluídos permanentemente. Esta ação não pode ser desfeita.",
        "deleteAccountSuccessTitle": "Conta excluída",
        "deleteAccountSuccessMessage": "Sua conta e todos os dados associados foram excluídos permanentemente.",
        "deleteAccountErrorTitle": "Falha na exclusão",
        "deleteAccountErrorMessage": "Não foi possível excluir a conta. Tente novamente.",
        "cancel": "Cancelar",
    },
}

# ─────────────────────────────────────────────────────────────────────
# Patcher
# ─────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC = PROJECT_ROOT / "src"


def js_string(value: str) -> str:
    """Encode a string as a JS double-quoted literal."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def find_layout():
    """
    Detect translation file layout.
    Returns ('single_file', Path) or ('per_file', Path) or (None, None).
    """
    single_candidates = [
        SRC / "translations" / "strings.js",
        SRC / "strings.js",
        SRC / "i18n.js",
    ]
    for f in single_candidates:
        if f.is_file():
            return ("single_file", f)

    per_file_dirs = [
        SRC / "translations",
        SRC / "translations" / "strings",
        SRC / "translations/strings.js",
    ]
    for d in per_file_dirs:
        if d.is_dir():
            return ("per_file", d)

    return (None, None)


def has_key(content: str, key: str, lang_block_start: int = 0, lang_block_end: int = None) -> bool:
    """
    Check if `key` is already defined in the given content slice.
    Matches: key:, "key":, 'key':
    """
    haystack = content[lang_block_start:lang_block_end] if lang_block_end else content[lang_block_start:]
    pattern = re.compile(
        rf'(^|[\s,{{]){re.escape(key)}\s*:|'
        rf'["\']{re.escape(key)}["\']\s*:',
        re.MULTILINE,
    )
    return bool(pattern.search(haystack))


def patch_single_file(path: Path):
    """
    Single-file layout: src/translations/strings.js.
    Assumes shape:
        const translations = {
          en: { ... },
          no: { ... },
          ...
        };
    or similar.
    """
    print(f"Patching single-file translations at {path.relative_to(PROJECT_ROOT)}")
    content = path.read_text(encoding="utf-8")
    original = content
    total_added = 0

    for lang, keys in TRANSLATIONS.items():
        # Find the language block: `  en: {` or `  "en": {`
        lang_block_re = re.compile(
            rf'(^|\n)(\s*)(?:{lang}|["\']{lang}["\'])\s*:\s*\{{',
            re.MULTILINE,
        )
        m = lang_block_re.search(content)
        if not m:
            print(f"  ⚠ Language block '{lang}' not found — skipping")
            continue

        # Find the matching closing brace for this language block
        block_start = m.end()  # position right after `{`
        depth = 1
        i = block_start
        while i < len(content) and depth > 0:
            ch = content[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    break
            elif ch == '"' or ch == "'":
                # skip string contents
                quote = ch
                i += 1
                while i < len(content) and content[i] != quote:
                    if content[i] == "\\":
                        i += 2
                        continue
                    i += 1
            i += 1
        block_end = i  # position of closing `}`

        # Determine indent for inserted lines (2 levels deeper than `lang:`)
        outer_indent = m.group(2)
        inner_indent = outer_indent + "  "

        added_for_lang = 0
        insertions = []
        for key, value in keys.items():
            if has_key(content, key, block_start, block_end):
                continue
            insertions.append(f"{inner_indent}{key}: {js_string(value)},")
            added_for_lang += 1

        if not insertions:
            print(f"  ✓ {lang}: nothing to add")
            continue

        insertion_text = "\n".join(insertions) + "\n"

        # Insert before the closing brace; ensure preceding line ends in comma if needed
        before = content[:block_end]
        after = content[block_end:]
        # Ensure a newline before our inserted block
        if not before.endswith("\n"):
            insertion_text = "\n" + insertion_text
        content = before + insertion_text + after
        total_added += added_for_lang
        print(f"  ✓ {lang}: added {added_for_lang} key(s)")

    if content != original:
        # Write a backup once
        backup = path.with_suffix(
            path.suffix + ".backup-deleteaccount"
        )
        if not backup.exists():
            backup.write_text(original, encoding="utf-8")
            print(f"  Backup written to {backup.relative_to(PROJECT_ROOT)}")
        path.write_text(content, encoding="utf-8")
        print(f"\n✅ Total keys added: {total_added}")
    else:
        print("\n✓ No changes needed — all keys already present.")


def patch_per_file(directory: Path):
    """
    Per-file layout: src/translations/strings.js.
    Assumes each file ends with `export default { ... };`.
    """
    print(f"Patching per-file translations in {directory.relative_to(PROJECT_ROOT)}")
    total_added = 0

    for lang, keys in TRANSLATIONS.items():
        target = directory / f"{lang}.js"
        if not target.exists():
            print(f"  ⚠ {lang}.js not found — skipping")
            continue

        content = target.read_text(encoding="utf-8")
        original = content
        added = 0
        insertions = []
        for key, value in keys.items():
            if has_key(content, key):
                continue
            insertions.append(f"  {key}: {js_string(value)},")
            added += 1

        if not insertions:
            print(f"  ✓ {lang}: nothing to add")
            continue

        insertion_text = "\n".join(insertions) + "\n"

        # Insert before the final `}` of the export
        new_content, n = re.subn(
            r"(\n)(\}\s*;?\s*\n?\s*)$",
            rf"\1{insertion_text}\2",
            content,
            count=1,
        )

        if n == 0:
            # Fallback: insert before the very last `}`
            idx = content.rfind("}")
            if idx == -1:
                print(f"  ✗ {lang}: could not find closing brace")
                continue
            new_content = content[:idx] + insertion_text + content[idx:]

        backup = target.with_suffix(target.suffix + ".backup-deleteaccount")
        if not backup.exists():
            backup.write_text(original, encoding="utf-8")
        target.write_text(new_content, encoding="utf-8")
        total_added += added
        print(f"  ✓ {lang}: added {added} key(s)")

    print(f"\n✅ Total keys added: {total_added}")


def main():
    layout, location = find_layout()
    if layout is None:
        print("❌ Could not find translations file or directory.")
        print("   Tried: src/translations/strings.js, src/translations.js,")
        print("          src/translations/, src/lib/translations/")
        sys.exit(1)

    if layout == "single_file":
        patch_single_file(location)
    else:
        patch_per_file(location)


if __name__ == "__main__":
    main()