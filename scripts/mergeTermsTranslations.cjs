#!/usr/bin/env node
/**
 * mergeTermsTranslations.cjs
 *
 * Merges Coachly Terms & Conditions keys into src/lib/translations.js
 * for all 12 languages: en, no, nl, fr, de, it, sv, da, fi, es, pl, pt.
 *
 * Handles the actual file shape:
 *   const strings = {
 *     "en": {
 *       "appName": "Coachly",
 *       ...
 *     },
 *     "no": { ... }
 *   };
 *
 * Idempotent: keys that already exist are NOT overwritten.
 * Creates a timestamped backup before writing.
 *
 * Usage:
 *   cd /Users/janegil-staff/Projects/coachly/coachly-mobile
 *   node scripts/mergeTermsTranslations.cjs
 */

const fs   = require("fs");
const path = require("path");

// ─── CONFIG ─────────────────────────────────────────────────────────
const CANDIDATES = [
  "src/lib/translations.js",
  "src/translations.js",
  "src/translations/strings.js",
  "src/translations/index.js",
  "translations.js",
];

// ─── DATA: all 12 languages ────────────────────────────────────────
const TRANSLATIONS = {
  "en": {
    "termsTitle": "Terms & Conditions",
    "termsLastUpdated": "Last updated: April 2026",
    "termsContact": "Contact",
    "termsIntro": "These Terms & Conditions govern your use of Coachly, an application operated by Qup DA. By accessing or using the app, you agree to be bound by these terms. If you do not agree, please do not use the app.",
    "termsSections": [
      {
        "title": "1. Acceptance of Terms",
        "body": "By creating an account or using Coachly, you confirm that you are at least 16 years old (or have parental consent) and that you accept these Terms & Conditions in full. Coachly is operated by Qup DA. We may update these terms from time to time, and continued use of the app after changes constitutes acceptance of the updated terms."
      },
      {
        "title": "2. Your Account",
        "body": "You are responsible for maintaining the confidentiality of your login credentials and PIN, and for all activity that occurs under your account. You agree to provide accurate information when registering and to keep it up to date. You may delete your account at any time from within the app."
      },
      {
        "title": "3. Acceptable Use",
        "body": "You agree not to misuse the app, including by attempting to access it through unauthorized means, interfering with its operation, reverse-engineering it, or using it for any unlawful purpose. We reserve the right to suspend or terminate accounts that violate these rules."
      },
      {
        "title": "4. Health Information Disclaimer",
        "body": "Coachly is a tracking and lifestyle support tool. It is not a medical device and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making decisions about your health, training, nutrition, or treatment. Do not rely on Coachly as a substitute for professional medical care."
      },
      {
        "title": "5. Your Data and Privacy",
        "body": "We process the data you enter into the app in order to provide its features, including training logs, ratings, and any health-related information you choose to record. Your data is stored securely and handled in line with applicable privacy laws including the GDPR. For details on what we collect, how we use it, and your rights, please see our Privacy Policy."
      },
      {
        "title": "6. Coaching Relationships",
        "body": "If you connect with a coach through Coachly, selected data from your account is shared with them so they can support your training. You control what is shared and you can revoke a coach's access at any time from within the app."
      },
      {
        "title": "7. Intellectual Property",
        "body": "All content in Coachly — including the app itself, its design, text, graphics, and code — is owned by Qup DA or its licensors and protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without prior written permission."
      },
      {
        "title": "8. Limitation of Liability",
        "body": "Coachly is provided \"as is\" and \"as available\", without warranties of any kind. To the fullest extent permitted by law, Qup DA shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app, including health outcomes, data loss, or service interruption. You use the app at your own risk."
      },
      {
        "title": "9. Changes to These Terms",
        "body": "We may revise these Terms at any time. When we do, we will update the date at the top of this page. Significant changes may also be communicated through the app. Your continued use after changes means you accept the revised Terms."
      },
      {
        "title": "10. Contact",
        "body": "If you have questions about these Terms or about Coachly, please contact us at jan.egi.staff@qupda.com."
      }
    ]
  },
  "no": {
    "termsTitle": "Vilkår og betingelser",
    "termsLastUpdated": "Sist oppdatert: april 2026",
    "termsContact": "Kontakt",
    "termsIntro": "Disse vilkårene regulerer din bruk av Coachly, en applikasjon som drives av Qup DA. Ved å bruke appen godtar du å være bundet av disse vilkårene. Hvis du ikke godtar dem, må du ikke bruke appen.",
    "termsSections": [
      {
        "title": "1. Aksept av vilkårene",
        "body": "Ved å opprette en konto eller bruke Coachly bekrefter du at du er minst 16 år (eller har samtykke fra foreldre) og at du godtar disse vilkårene i sin helhet. Coachly drives av Qup DA. Vi kan oppdatere vilkårene fra tid til annen, og fortsatt bruk etter endringer betyr at du godtar de oppdaterte vilkårene."
      },
      {
        "title": "2. Din konto",
        "body": "Du er ansvarlig for å holde innloggingsinformasjonen og PIN-koden din konfidensiell, og for all aktivitet som skjer på kontoen din. Du må oppgi riktige opplysninger ved registrering og holde dem oppdatert. Du kan slette kontoen din når som helst fra inne i appen."
      },
      {
        "title": "3. Akseptabel bruk",
        "body": "Du forplikter deg til ikke å misbruke appen, inkludert å forsøke å få tilgang til den på uautoriserte måter, forstyrre driften, omvendt utvikle den, eller bruke den til ulovlige formål. Vi forbeholder oss retten til å suspendere eller avslutte kontoer som bryter disse reglene."
      },
      {
        "title": "4. Ansvarsfraskrivelse for helseinformasjon",
        "body": "Coachly er et verktøy for sporing og livsstilsstøtte. Det er ikke et medisinsk utstyr og gir ikke medisinske råd, diagnoser eller behandling. Konsulter alltid kvalifisert helsepersonell før du tar avgjørelser om helse, trening, ernæring eller behandling. Ikke bruk Coachly som erstatning for profesjonell medisinsk omsorg."
      },
      {
        "title": "5. Dine data og personvern",
        "body": "Vi behandler dataene du legger inn i appen for å levere funksjonene, inkludert treningslogger, vurderinger og eventuell helserelatert informasjon du velger å registrere. Dataene dine lagres sikkert og håndteres i samsvar med gjeldende personvernlovgivning, inkludert GDPR. For detaljer om hva vi samler inn, hvordan vi bruker det og dine rettigheter, se personvernerklæringen vår."
      },
      {
        "title": "6. Trenerrelasjoner",
        "body": "Hvis du knytter deg til en trener gjennom Coachly, deles utvalgte data fra kontoen din med dem slik at de kan støtte treningen din. Du kontrollerer hva som deles og kan når som helst tilbakekalle en treners tilgang fra inne i appen."
      },
      {
        "title": "7. Immaterielle rettigheter",
        "body": "Alt innhold i Coachly — inkludert selve appen, dens design, tekst, grafikk og kode — eies av Qup DA eller dets lisensgivere og er beskyttet av opphavsrett og andre immaterielle rettigheter. Du kan ikke kopiere, endre, distribuere eller lage avledede verk uten skriftlig forhåndssamtykke."
      },
      {
        "title": "8. Ansvarsbegrensning",
        "body": "Coachly leveres «som den er» og «som tilgjengelig», uten garantier av noe slag. I den grad loven tillater det, skal Qup DA ikke holdes ansvarlig for noen indirekte, tilfeldige, spesielle eller følgemessige skader som oppstår som følge av din bruk av appen, inkludert helseutfall, tap av data eller tjenesteavbrudd. Du bruker appen på egen risiko."
      },
      {
        "title": "9. Endringer i vilkårene",
        "body": "Vi kan revidere disse vilkårene når som helst. Når vi gjør det, oppdaterer vi datoen øverst på denne siden. Vesentlige endringer kan også varsles gjennom appen. Fortsatt bruk etter endringer betyr at du godtar de reviderte vilkårene."
      },
      {
        "title": "10. Kontakt",
        "body": "Hvis du har spørsmål om disse vilkårene eller om Coachly, kontakt oss på jan.egi.staff@qupda.com."
      }
    ]
  },
  "nl": {
    "termsTitle": "Algemene voorwaarden",
    "termsLastUpdated": "Laatst bijgewerkt: april 2026",
    "termsContact": "Contact",
    "termsIntro": "Deze algemene voorwaarden zijn van toepassing op uw gebruik van Coachly, een applicatie die wordt beheerd door Qup DA. Door de app te gebruiken, gaat u akkoord met deze voorwaarden. Als u niet akkoord gaat, gebruik de app dan niet.",
    "termsSections": [
      {
        "title": "1. Aanvaarding van de voorwaarden",
        "body": "Door een account aan te maken of Coachly te gebruiken, bevestigt u dat u ten minste 16 jaar oud bent (of toestemming van uw ouders heeft) en dat u deze voorwaarden volledig accepteert. Coachly wordt beheerd door Qup DA. We kunnen deze voorwaarden van tijd tot tijd bijwerken, en voortgezet gebruik van de app na wijzigingen betekent dat u de bijgewerkte voorwaarden accepteert."
      },
      {
        "title": "2. Uw account",
        "body": "U bent verantwoordelijk voor het vertrouwelijk houden van uw inloggegevens en PIN-code, en voor alle activiteiten die plaatsvinden onder uw account. U gaat ermee akkoord nauwkeurige informatie te verstrekken bij registratie en deze actueel te houden. U kunt uw account op elk moment verwijderen vanuit de app."
      },
      {
        "title": "3. Aanvaardbaar gebruik",
        "body": "U gaat ermee akkoord de app niet te misbruiken, inclusief het proberen toegang te krijgen via onbevoegde middelen, het verstoren van de werking, reverse-engineering of gebruik voor onwettige doeleinden. Wij behouden ons het recht voor om accounts te schorsen of te beëindigen die deze regels overtreden."
      },
      {
        "title": "4. Disclaimer gezondheidsinformatie",
        "body": "Coachly is een tool voor tracking en levensstijlondersteuning. Het is geen medisch hulpmiddel en geeft geen medisch advies, diagnose of behandeling. Raadpleeg altijd een gekwalificeerde zorgprofessional voordat u beslissingen neemt over uw gezondheid, training, voeding of behandeling. Vertrouw niet op Coachly als vervanging voor professionele medische zorg."
      },
      {
        "title": "5. Uw gegevens en privacy",
        "body": "Wij verwerken de gegevens die u in de app invoert om de functies te leveren, inclusief trainingslogboeken, beoordelingen en eventuele gezondheidsgerelateerde informatie die u kiest vast te leggen. Uw gegevens worden veilig opgeslagen en behandeld in overeenstemming met de toepasselijke privacywetgeving, inclusief de AVG. Raadpleeg ons privacybeleid voor details over wat we verzamelen, hoe we het gebruiken en uw rechten."
      },
      {
        "title": "6. Coach-relaties",
        "body": "Als u via Coachly contact opneemt met een coach, worden geselecteerde gegevens uit uw account met hen gedeeld zodat zij uw training kunnen ondersteunen. U bepaalt wat er wordt gedeeld en u kunt de toegang van een coach op elk moment intrekken vanuit de app."
      },
      {
        "title": "7. Intellectueel eigendom",
        "body": "Alle inhoud in Coachly — inclusief de app zelf, het ontwerp, de tekst, de afbeeldingen en de code — is eigendom van Qup DA of haar licentiegevers en wordt beschermd door auteursrecht en andere intellectuele eigendomsrechten. U mag deze niet kopiëren, wijzigen, distribueren of afgeleide werken maken zonder voorafgaande schriftelijke toestemming."
      },
      {
        "title": "8. Beperking van aansprakelijkheid",
        "body": "Coachly wordt geleverd \"zoals het is\" en \"zoals beschikbaar\", zonder enige garantie. Voor zover wettelijk toegestaan is Qup DA niet aansprakelijk voor enige indirecte, incidentele, bijzondere of gevolgschade die voortvloeit uit uw gebruik van de app, inclusief gezondheidsuitkomsten, gegevensverlies of serviceonderbreking. U gebruikt de app op eigen risico."
      },
      {
        "title": "9. Wijzigingen van de voorwaarden",
        "body": "Wij kunnen deze voorwaarden op elk moment herzien. Wanneer we dat doen, werken we de datum bovenaan deze pagina bij. Belangrijke wijzigingen kunnen ook worden gecommuniceerd via de app. Uw voortgezet gebruik na wijzigingen betekent dat u de herziene voorwaarden accepteert."
      },
      {
        "title": "10. Contact",
        "body": "Als u vragen heeft over deze voorwaarden of over Coachly, neem dan contact met ons op via jan.egi.staff@qupda.com."
      }
    ]
  },
  "fr": {
    "termsTitle": "Conditions générales",
    "termsLastUpdated": "Dernière mise à jour : avril 2026",
    "termsContact": "Contact",
    "termsIntro": "Les présentes conditions régissent votre utilisation de Coachly, une application exploitée par Qup DA. En accédant à l'application ou en l'utilisant, vous acceptez d'être lié par ces conditions. Si vous n'êtes pas d'accord, n'utilisez pas l'application.",
    "termsSections": [
      {
        "title": "1. Acceptation des conditions",
        "body": "En créant un compte ou en utilisant Coachly, vous confirmez que vous avez au moins 16 ans (ou que vous avez le consentement parental) et que vous acceptez ces conditions dans leur intégralité. Coachly est exploitée par Qup DA. Nous pouvons mettre à jour ces conditions de temps à autre, et l'utilisation continue de l'application après modifications constitue une acceptation des conditions mises à jour."
      },
      {
        "title": "2. Votre compte",
        "body": "Vous êtes responsable de la confidentialité de vos identifiants de connexion et de votre code PIN, ainsi que de toute activité effectuée sous votre compte. Vous vous engagez à fournir des informations exactes lors de l'inscription et à les tenir à jour. Vous pouvez supprimer votre compte à tout moment depuis l'application."
      },
      {
        "title": "3. Utilisation acceptable",
        "body": "Vous vous engagez à ne pas utiliser l'application de manière abusive, notamment en tentant d'y accéder par des moyens non autorisés, en perturbant son fonctionnement, en procédant à une rétro-ingénierie ou en l'utilisant à des fins illégales. Nous nous réservons le droit de suspendre ou de résilier les comptes qui enfreignent ces règles."
      },
      {
        "title": "4. Avertissement concernant les informations de santé",
        "body": "Coachly est un outil de suivi et de soutien au mode de vie. Ce n'est pas un dispositif médical et il ne fournit pas de conseils médicaux, de diagnostic ou de traitement. Consultez toujours un professionnel de santé qualifié avant de prendre des décisions concernant votre santé, votre entraînement, votre nutrition ou votre traitement. Ne vous fiez pas à Coachly comme substitut à des soins médicaux professionnels."
      },
      {
        "title": "5. Vos données et votre vie privée",
        "body": "Nous traitons les données que vous saisissez dans l'application afin de fournir ses fonctionnalités, y compris les journaux d'entraînement, les évaluations et toute information liée à la santé que vous choisissez d'enregistrer. Vos données sont stockées en toute sécurité et traitées conformément aux lois applicables sur la protection de la vie privée, y compris le RGPD. Pour plus de détails sur ce que nous collectons, comment nous l'utilisons et vos droits, consultez notre politique de confidentialité."
      },
      {
        "title": "6. Relations avec le coach",
        "body": "Si vous vous connectez avec un coach via Coachly, certaines données de votre compte sont partagées avec lui afin qu'il puisse soutenir votre entraînement. Vous contrôlez ce qui est partagé et vous pouvez révoquer l'accès d'un coach à tout moment depuis l'application."
      },
      {
        "title": "7. Propriété intellectuelle",
        "body": "Tout le contenu de Coachly — y compris l'application elle-même, sa conception, ses textes, ses graphiques et son code — est la propriété de Qup DA ou de ses concédants de licence et est protégé par le droit d'auteur et d'autres lois sur la propriété intellectuelle. Vous ne pouvez pas copier, modifier, distribuer ou créer des œuvres dérivées sans autorisation écrite préalable."
      },
      {
        "title": "8. Limitation de responsabilité",
        "body": "Coachly est fournie « telle quelle » et « selon disponibilité », sans aucune garantie. Dans toute la mesure permise par la loi, Qup DA ne pourra être tenue responsable de tout dommage indirect, accessoire, spécial ou consécutif découlant de votre utilisation de l'application, y compris les résultats sur la santé, la perte de données ou l'interruption du service. Vous utilisez l'application à vos propres risques."
      },
      {
        "title": "9. Modifications des conditions",
        "body": "Nous pouvons réviser ces conditions à tout moment. Dans ce cas, nous mettrons à jour la date en haut de cette page. Les modifications importantes peuvent également être communiquées via l'application. Votre utilisation continue après modifications signifie que vous acceptez les conditions révisées."
      },
      {
        "title": "10. Contact",
        "body": "Si vous avez des questions concernant ces conditions ou Coachly, veuillez nous contacter à l'adresse jan.egi.staff@qupda.com."
      }
    ]
  },
  "de": {
    "termsTitle": "Allgemeine Geschäftsbedingungen",
    "termsLastUpdated": "Zuletzt aktualisiert: April 2026",
    "termsContact": "Kontakt",
    "termsIntro": "Diese Allgemeinen Geschäftsbedingungen regeln Ihre Nutzung von Coachly, einer Anwendung, die von Qup DA betrieben wird. Durch die Nutzung der App erklären Sie sich mit diesen Bedingungen einverstanden. Wenn Sie nicht zustimmen, nutzen Sie die App bitte nicht.",
    "termsSections": [
      {
        "title": "1. Annahme der Bedingungen",
        "body": "Indem Sie ein Konto erstellen oder Coachly nutzen, bestätigen Sie, dass Sie mindestens 16 Jahre alt sind (oder die Zustimmung Ihrer Eltern haben) und diese Bedingungen vollständig akzeptieren. Coachly wird von Qup DA betrieben. Wir können diese Bedingungen von Zeit zu Zeit aktualisieren; die fortgesetzte Nutzung nach Änderungen gilt als Annahme der aktualisierten Bedingungen."
      },
      {
        "title": "2. Ihr Konto",
        "body": "Sie sind verantwortlich für die Geheimhaltung Ihrer Anmeldedaten und Ihrer PIN sowie für alle Aktivitäten, die unter Ihrem Konto stattfinden. Sie verpflichten sich, bei der Registrierung korrekte Angaben zu machen und diese aktuell zu halten. Sie können Ihr Konto jederzeit über die App löschen."
      },
      {
        "title": "3. Zulässige Nutzung",
        "body": "Sie verpflichten sich, die App nicht zu missbrauchen, einschließlich des Versuchs, unbefugt darauf zuzugreifen, ihren Betrieb zu stören, sie zurückzuentwickeln oder sie für rechtswidrige Zwecke zu nutzen. Wir behalten uns das Recht vor, Konten, die gegen diese Regeln verstoßen, zu sperren oder zu kündigen."
      },
      {
        "title": "4. Haftungsausschluss für Gesundheitsinformationen",
        "body": "Coachly ist ein Werkzeug zur Aufzeichnung und Unterstützung des Lebensstils. Es ist kein Medizinprodukt und bietet keine medizinische Beratung, Diagnose oder Behandlung. Konsultieren Sie stets eine qualifizierte medizinische Fachkraft, bevor Sie Entscheidungen über Ihre Gesundheit, Ihr Training, Ihre Ernährung oder Ihre Behandlung treffen. Verlassen Sie sich nicht auf Coachly als Ersatz für professionelle medizinische Versorgung."
      },
      {
        "title": "5. Ihre Daten und Datenschutz",
        "body": "Wir verarbeiten die Daten, die Sie in die App eingeben, um deren Funktionen bereitzustellen, einschließlich Trainingsprotokollen, Bewertungen und gesundheitsbezogenen Informationen, die Sie aufzeichnen. Ihre Daten werden sicher gespeichert und gemäß den geltenden Datenschutzgesetzen, einschließlich der DSGVO, behandelt. Einzelheiten dazu, was wir erheben, wie wir es verwenden und welche Rechte Sie haben, finden Sie in unserer Datenschutzerklärung."
      },
      {
        "title": "6. Trainerbeziehungen",
        "body": "Wenn Sie sich über Coachly mit einem Trainer verbinden, werden ausgewählte Daten aus Ihrem Konto mit ihm geteilt, damit er Sie bei Ihrem Training unterstützen kann. Sie bestimmen, was geteilt wird, und können den Zugriff eines Trainers jederzeit über die App widerrufen."
      },
      {
        "title": "7. Geistiges Eigentum",
        "body": "Alle Inhalte in Coachly — einschließlich der App selbst, ihres Designs, Texts, ihrer Grafiken und ihres Codes — sind Eigentum von Qup DA oder seinen Lizenzgebern und durch Urheberrecht und andere Schutzrechte geschützt. Sie dürfen ohne vorherige schriftliche Genehmigung keine Kopien, Änderungen, Verteilungen oder abgeleitete Werke erstellen."
      },
      {
        "title": "8. Haftungsbeschränkung",
        "body": "Coachly wird \"wie besehen\" und \"wie verfügbar\" ohne jegliche Garantien bereitgestellt. Soweit gesetzlich zulässig, haftet Qup DA nicht für indirekte, beiläufige, besondere oder Folgeschäden, die aus Ihrer Nutzung der App entstehen, einschließlich Gesundheitsergebnissen, Datenverlust oder Dienstunterbrechungen. Sie nutzen die App auf eigenes Risiko."
      },
      {
        "title": "9. Änderungen dieser Bedingungen",
        "body": "Wir können diese Bedingungen jederzeit überarbeiten. In diesem Fall aktualisieren wir das Datum oben auf dieser Seite. Wesentliche Änderungen können auch in der App mitgeteilt werden. Ihre fortgesetzte Nutzung nach Änderungen bedeutet, dass Sie die überarbeiteten Bedingungen akzeptieren."
      },
      {
        "title": "10. Kontakt",
        "body": "Wenn Sie Fragen zu diesen Bedingungen oder zu Coachly haben, kontaktieren Sie uns bitte unter jan.egi.staff@qupda.com."
      }
    ]
  },
  "it": {
    "termsTitle": "Termini e condizioni",
    "termsLastUpdated": "Ultimo aggiornamento: aprile 2026",
    "termsContact": "Contatto",
    "termsIntro": "I presenti termini e condizioni regolano l'utilizzo di Coachly, un'applicazione gestita da Qup DA. Accedendo o utilizzando l'app, accetti di essere vincolato da questi termini. Se non sei d'accordo, non utilizzare l'app.",
    "termsSections": [
      {
        "title": "1. Accettazione dei termini",
        "body": "Creando un account o utilizzando Coachly, confermi di avere almeno 16 anni (o di avere il consenso dei genitori) e di accettare integralmente questi termini. Coachly è gestita da Qup DA. Potremmo aggiornare i termini di tanto in tanto, e l'uso continuato dell'app dopo le modifiche costituisce accettazione dei termini aggiornati."
      },
      {
        "title": "2. Il tuo account",
        "body": "Sei responsabile della riservatezza delle tue credenziali di accesso e del tuo PIN, nonché di tutte le attività che avvengono sul tuo account. Accetti di fornire informazioni accurate al momento della registrazione e di tenerle aggiornate. Puoi eliminare il tuo account in qualsiasi momento dall'interno dell'app."
      },
      {
        "title": "3. Uso accettabile",
        "body": "Accetti di non utilizzare l'app in modo improprio, inclusi i tentativi di accesso con mezzi non autorizzati, l'interferenza con il suo funzionamento, il reverse engineering o l'utilizzo per scopi illeciti. Ci riserviamo il diritto di sospendere o chiudere gli account che violano queste regole."
      },
      {
        "title": "4. Avvertenza sulle informazioni sanitarie",
        "body": "Coachly è uno strumento di monitoraggio e supporto allo stile di vita. Non è un dispositivo medico e non fornisce consulenza medica, diagnosi o trattamento. Consulta sempre un professionista sanitario qualificato prima di prendere decisioni sulla tua salute, allenamento, alimentazione o trattamento. Non utilizzare Coachly come sostituto delle cure mediche professionali."
      },
      {
        "title": "5. I tuoi dati e privacy",
        "body": "Trattiamo i dati che inserisci nell'app per fornire le sue funzionalità, inclusi i registri di allenamento, le valutazioni e qualsiasi informazione sanitaria che scegli di registrare. I tuoi dati vengono conservati in modo sicuro e gestiti in conformità con le leggi sulla privacy applicabili, incluso il GDPR. Per dettagli su ciò che raccogliamo, come lo utilizziamo e sui tuoi diritti, consulta la nostra informativa sulla privacy."
      },
      {
        "title": "6. Rapporti con il coach",
        "body": "Se ti connetti con un coach tramite Coachly, dati selezionati del tuo account vengono condivisi con lui affinché possa supportare il tuo allenamento. Tu controlli ciò che viene condiviso e puoi revocare l'accesso di un coach in qualsiasi momento dall'interno dell'app."
      },
      {
        "title": "7. Proprietà intellettuale",
        "body": "Tutti i contenuti di Coachly — inclusa l'app stessa, il suo design, i testi, la grafica e il codice — sono di proprietà di Qup DA o dei suoi licenziatari e sono protetti da copyright e altre leggi sulla proprietà intellettuale. Non puoi copiare, modificare, distribuire o creare opere derivate senza autorizzazione scritta preventiva."
      },
      {
        "title": "8. Limitazione di responsabilità",
        "body": "Coachly è fornita \"così com'è\" e \"come disponibile\", senza garanzie di alcun tipo. Nella misura massima consentita dalla legge, Qup DA non sarà responsabile per danni indiretti, incidentali, speciali o consequenziali derivanti dall'uso dell'app, inclusi gli esiti sulla salute, la perdita di dati o l'interruzione del servizio. Utilizzi l'app a tuo rischio."
      },
      {
        "title": "9. Modifiche ai termini",
        "body": "Possiamo rivedere questi termini in qualsiasi momento. Quando lo faremo, aggiorneremo la data in cima a questa pagina. Le modifiche significative potranno anche essere comunicate tramite l'app. Il tuo uso continuato dopo le modifiche significa che accetti i termini rivisti."
      },
      {
        "title": "10. Contatto",
        "body": "Per domande su questi termini o su Coachly, contattaci all'indirizzo jan.egi.staff@qupda.com."
      }
    ]
  },
  "sv": {
    "termsTitle": "Villkor",
    "termsLastUpdated": "Senast uppdaterad: april 2026",
    "termsContact": "Kontakt",
    "termsIntro": "Dessa villkor reglerar din användning av Coachly, en applikation som drivs av Qup DA. Genom att använda appen godkänner du att du är bunden av dessa villkor. Om du inte godkänner dem, använd inte appen.",
    "termsSections": [
      {
        "title": "1. Godkännande av villkoren",
        "body": "Genom att skapa ett konto eller använda Coachly bekräftar du att du är minst 16 år (eller har föräldrarnas medgivande) och att du godkänner dessa villkor i sin helhet. Coachly drivs av Qup DA. Vi kan uppdatera villkoren då och då, och fortsatt användning efter ändringar innebär att du godkänner de uppdaterade villkoren."
      },
      {
        "title": "2. Ditt konto",
        "body": "Du ansvarar för att hålla dina inloggningsuppgifter och din PIN-kod konfidentiella, och för all aktivitet som sker under ditt konto. Du samtycker till att lämna korrekt information vid registrering och hålla den uppdaterad. Du kan radera ditt konto när som helst inifrån appen."
      },
      {
        "title": "3. Godtagbar användning",
        "body": "Du samtycker till att inte missbruka appen, inklusive genom att försöka komma åt den på obehörigt sätt, störa dess drift, baklängesutveckla den eller använda den för olagliga ändamål. Vi förbehåller oss rätten att stänga av eller avsluta konton som bryter mot dessa regler."
      },
      {
        "title": "4. Friskrivning för hälsoinformation",
        "body": "Coachly är ett verktyg för spårning och livsstilsstöd. Det är inte en medicinsk utrustning och ger inte medicinska råd, diagnoser eller behandling. Rådgör alltid med kvalificerad vårdpersonal innan du fattar beslut om din hälsa, träning, kost eller behandling. Förlita dig inte på Coachly som ersättning för professionell vård."
      },
      {
        "title": "5. Dina data och integritet",
        "body": "Vi behandlar de data du anger i appen för att leverera dess funktioner, inklusive träningsloggar, betyg och eventuell hälsorelaterad information du väljer att registrera. Dina data lagras säkert och hanteras i enlighet med tillämplig integritetslagstiftning, inklusive GDPR. För detaljer om vad vi samlar in, hur vi använder det och dina rättigheter, se vår integritetspolicy."
      },
      {
        "title": "6. Coach-relationer",
        "body": "Om du ansluter till en coach via Coachly delas utvalda data från ditt konto med dem så att de kan stödja din träning. Du kontrollerar vad som delas och kan när som helst återkalla en coachs åtkomst inifrån appen."
      },
      {
        "title": "7. Immateriella rättigheter",
        "body": "Allt innehåll i Coachly — inklusive själva appen, dess design, text, grafik och kod — ägs av Qup DA eller dess licensgivare och skyddas av upphovsrätt och andra immaterialrättsliga lagar. Du får inte kopiera, modifiera, distribuera eller skapa härledda verk utan skriftligt förhandstillstånd."
      },
      {
        "title": "8. Ansvarsbegränsning",
        "body": "Coachly tillhandahålls \"i befintligt skick\" och \"som tillgängligt\", utan några garantier. I den utsträckning lagen tillåter ska Qup DA inte hållas ansvarig för indirekta, tillfälliga, särskilda eller följdmässiga skador som uppstår genom din användning av appen, inklusive hälsoresultat, dataförlust eller tjänsteavbrott. Du använder appen på egen risk."
      },
      {
        "title": "9. Ändringar av villkoren",
        "body": "Vi kan revidera dessa villkor när som helst. När vi gör det uppdaterar vi datumet högst upp på denna sida. Väsentliga ändringar kan också meddelas via appen. Fortsatt användning efter ändringar innebär att du godkänner de reviderade villkoren."
      },
      {
        "title": "10. Kontakt",
        "body": "Om du har frågor om dessa villkor eller om Coachly, kontakta oss på jan.egi.staff@qupda.com."
      }
    ]
  },
  "da": {
    "termsTitle": "Vilkår og betingelser",
    "termsLastUpdated": "Sidst opdateret: april 2026",
    "termsContact": "Kontakt",
    "termsIntro": "Disse vilkår regulerer din brug af Coachly, en applikation der drives af Qup DA. Ved at bruge appen accepterer du at være bundet af disse vilkår. Hvis du ikke accepterer dem, må du ikke bruge appen.",
    "termsSections": [
      {
        "title": "1. Accept af vilkårene",
        "body": "Ved at oprette en konto eller bruge Coachly bekræfter du, at du er mindst 16 år (eller har forældresamtykke), og at du accepterer disse vilkår i deres helhed. Coachly drives af Qup DA. Vi kan opdatere vilkårene fra tid til anden, og fortsat brug efter ændringer betyder, at du accepterer de opdaterede vilkår."
      },
      {
        "title": "2. Din konto",
        "body": "Du er ansvarlig for at holde dine loginoplysninger og PIN-kode fortrolige og for al aktivitet, der finder sted på din konto. Du accepterer at give korrekte oplysninger ved registrering og holde dem opdateret. Du kan slette din konto til enhver tid inde fra appen."
      },
      {
        "title": "3. Acceptabel brug",
        "body": "Du accepterer ikke at misbruge appen, herunder ved at forsøge at få adgang til den ad uautoriserede veje, forstyrre dens drift, foretage reverse-engineering eller bruge den til ulovlige formål. Vi forbeholder os retten til at suspendere eller lukke konti, der overtræder disse regler."
      },
      {
        "title": "4. Ansvarsfraskrivelse for helbredsinformation",
        "body": "Coachly er et redskab til registrering og livsstilsstøtte. Det er ikke medicinsk udstyr og giver ikke medicinsk rådgivning, diagnose eller behandling. Konsultér altid kvalificeret sundhedspersonale, før du træffer beslutninger om sundhed, træning, ernæring eller behandling. Stol ikke på Coachly som erstatning for professionel medicinsk pleje."
      },
      {
        "title": "5. Dine data og privatliv",
        "body": "Vi behandler de data, du indtaster i appen, for at levere dens funktioner, herunder træningslogs, vurderinger og eventuelle sundhedsrelaterede oplysninger, du vælger at registrere. Dine data opbevares sikkert og håndteres i overensstemmelse med gældende databeskyttelseslovgivning, herunder GDPR. For detaljer om, hvad vi indsamler, hvordan vi bruger det, og dine rettigheder, se vores privatlivspolitik."
      },
      {
        "title": "6. Træner-relationer",
        "body": "Hvis du forbinder dig med en træner via Coachly, deles udvalgte data fra din konto med dem, så de kan støtte din træning. Du styrer, hvad der deles, og kan til enhver tid trække en træners adgang tilbage inde fra appen."
      },
      {
        "title": "7. Immaterielle rettigheder",
        "body": "Alt indhold i Coachly — herunder selve appen, dens design, tekst, grafik og kode — ejes af Qup DA eller dets licensgivere og er beskyttet af ophavsret og andre immaterialrettigheder. Du må ikke kopiere, ændre, distribuere eller skabe afledte værker uden forudgående skriftlig tilladelse."
      },
      {
        "title": "8. Ansvarsbegrænsning",
        "body": "Coachly leveres \"som den er\" og \"som tilgængelig\" uden nogen form for garantier. I det omfang loven tillader det, kan Qup DA ikke holdes ansvarlig for indirekte, tilfældige, særlige eller følgeskader, der opstår ved din brug af appen, herunder helbredsresultater, datatab eller serviceafbrydelser. Du bruger appen på egen risiko."
      },
      {
        "title": "9. Ændringer af vilkårene",
        "body": "Vi kan til enhver tid revidere disse vilkår. Når vi gør det, opdaterer vi datoen øverst på denne side. Væsentlige ændringer kan også blive meddelt via appen. Fortsat brug efter ændringer betyder, at du accepterer de reviderede vilkår."
      },
      {
        "title": "10. Kontakt",
        "body": "Hvis du har spørgsmål om disse vilkår eller om Coachly, kan du kontakte os på jan.egi.staff@qupda.com."
      }
    ]
  },
  "fi": {
    "termsTitle": "Käyttöehdot",
    "termsLastUpdated": "Viimeksi päivitetty: huhtikuu 2026",
    "termsContact": "Yhteystiedot",
    "termsIntro": "Nämä käyttöehdot säätelevät Coachlyn käyttöäsi. Coachly on Qup DA:n ylläpitämä sovellus. Käyttämällä sovellusta hyväksyt nämä ehdot. Jos et hyväksy niitä, älä käytä sovellusta.",
    "termsSections": [
      {
        "title": "1. Ehtojen hyväksyminen",
        "body": "Luomalla tilin tai käyttämällä Coachlya vahvistat olevasi vähintään 16-vuotias (tai sinulla on vanhempien suostumus) ja että hyväksyt nämä ehdot kokonaisuudessaan. Coachlya ylläpitää Qup DA. Voimme päivittää ehtoja ajoittain, ja sovelluksen käytön jatkaminen muutosten jälkeen tarkoittaa, että hyväksyt päivitetyt ehdot."
      },
      {
        "title": "2. Tilisi",
        "body": "Olet vastuussa kirjautumistietojesi ja PIN-koodisi luottamuksellisuudesta sekä kaikesta tilisi alla tapahtuvasta toiminnasta. Sitoudut antamaan oikeat tiedot rekisteröitymisen yhteydessä ja pitämään ne ajan tasalla. Voit poistaa tilisi milloin tahansa sovelluksen sisällä."
      },
      {
        "title": "3. Hyväksyttävä käyttö",
        "body": "Sitoudut olemaan käyttämättä sovellusta väärin, mukaan lukien luvattomien pääsy-yritysten tekeminen, sen toiminnan häiritseminen, käänteismallinnus tai käyttö laittomiin tarkoituksiin. Pidätämme oikeuden sulkea tai irtisanoa tilejä, jotka rikkovat näitä sääntöjä."
      },
      {
        "title": "4. Terveystietoja koskeva vastuuvapauslauseke",
        "body": "Coachly on seuranta- ja elämäntapatuen työkalu. Se ei ole lääkinnällinen laite eikä se tarjoa lääketieteellistä neuvontaa, diagnoosia tai hoitoa. Konsultoi aina pätevää terveydenhuollon ammattilaista ennen kuin teet päätöksiä terveydestäsi, harjoittelustasi, ravitsemuksestasi tai hoidostasi. Älä luota Coachlyyn ammattimaisen lääketieteellisen hoidon korvikkeena."
      },
      {
        "title": "5. Tietosi ja yksityisyytesi",
        "body": "Käsittelemme sovellukseen syöttämiäsi tietoja sen toimintojen tarjoamiseksi, mukaan lukien harjoituslokit, arviot ja terveysliitännäiset tiedot, jotka valitset tallentaa. Tietosi tallennetaan turvallisesti ja käsitellään sovellettavien tietosuojalakien, mukaan lukien GDPR:n, mukaisesti. Lisätietoja siitä, mitä keräämme, miten käytämme sitä ja oikeuksistasi, on tietosuojakäytännössämme."
      },
      {
        "title": "6. Valmentajasuhteet",
        "body": "Jos otat yhteyttä valmentajaan Coachlyn kautta, valittuja tilisi tietoja jaetaan hänen kanssaan, jotta hän voi tukea harjoitteluasi. Sinä päätät, mitä jaetaan, ja voit peruuttaa valmentajan pääsyn milloin tahansa sovelluksen sisältä."
      },
      {
        "title": "7. Immateriaalioikeudet",
        "body": "Kaikki Coachlyn sisältö — mukaan lukien itse sovellus, sen suunnittelu, teksti, grafiikka ja koodi — on Qup DA:n tai sen lisenssinantajien omaisuutta ja sitä suojaavat tekijänoikeus- ja muut immateriaalioikeuslait. Et saa kopioida, muokata, jakaa tai luoda johdannaisteoksia ilman etukäteen annettua kirjallista lupaa."
      },
      {
        "title": "8. Vastuun rajoitus",
        "body": "Coachly toimitetaan \"sellaisena kuin se on\" ja \"saatavuuden mukaan\" ilman minkäänlaisia takuita. Lain sallimassa enimmäismäärin Qup DA ei ole vastuussa mistään välillisistä, satunnaisista, erityisistä tai välillisistä vahingoista, jotka aiheutuvat sovelluksen käytöstäsi, mukaan lukien terveysvaikutukset, tietojen menetys tai palvelukatkokset. Käytät sovellusta omalla vastuullasi."
      },
      {
        "title": "9. Ehtojen muutokset",
        "body": "Voimme tarkistaa näitä ehtoja milloin tahansa. Kun teemme niin, päivitämme päivämäärän tämän sivun yläosaan. Merkittävistä muutoksista voidaan myös tiedottaa sovelluksen kautta. Käytön jatkaminen muutosten jälkeen tarkoittaa, että hyväksyt tarkistetut ehdot."
      },
      {
        "title": "10. Yhteystiedot",
        "body": "Jos sinulla on kysyttävää näistä ehdoista tai Coachlysta, ota yhteyttä osoitteeseen jan.egi.staff@qupda.com."
      }
    ]
  },
  "es": {
    "termsTitle": "Términos y condiciones",
    "termsLastUpdated": "Última actualización: abril de 2026",
    "termsContact": "Contacto",
    "termsIntro": "Estos términos y condiciones rigen el uso de Coachly, una aplicación operada por Qup DA. Al acceder o usar la aplicación, usted acepta estar sujeto a estos términos. Si no está de acuerdo, por favor no use la aplicación.",
    "termsSections": [
      {
        "title": "1. Aceptación de los términos",
        "body": "Al crear una cuenta o usar Coachly, confirma que tiene al menos 16 años (o cuenta con el consentimiento de sus padres) y que acepta estos términos en su totalidad. Coachly es operada por Qup DA. Podemos actualizar estos términos de vez en cuando, y el uso continuado de la aplicación tras los cambios constituye la aceptación de los términos actualizados."
      },
      {
        "title": "2. Su cuenta",
        "body": "Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de su PIN, así como de toda actividad que ocurra en su cuenta. Se compromete a proporcionar información precisa al registrarse y a mantenerla actualizada. Puede eliminar su cuenta en cualquier momento desde la aplicación."
      },
      {
        "title": "3. Uso aceptable",
        "body": "Usted se compromete a no hacer un mal uso de la aplicación, incluido el intento de acceder a ella por medios no autorizados, interferir en su funcionamiento, realizar ingeniería inversa o utilizarla con fines ilícitos. Nos reservamos el derecho de suspender o cancelar las cuentas que infrinjan estas normas."
      },
      {
        "title": "4. Aviso sobre información de salud",
        "body": "Coachly es una herramienta de seguimiento y apoyo al estilo de vida. No es un dispositivo médico y no proporciona consejo, diagnóstico ni tratamiento médico. Consulte siempre a un profesional sanitario cualificado antes de tomar decisiones sobre su salud, entrenamiento, nutrición o tratamiento. No utilice Coachly como sustituto de la atención médica profesional."
      },
      {
        "title": "5. Sus datos y privacidad",
        "body": "Procesamos los datos que introduce en la aplicación para proporcionar sus funciones, incluidos los registros de entrenamiento, valoraciones y cualquier información relacionada con la salud que decida registrar. Sus datos se almacenan de forma segura y se gestionan conforme a las leyes de privacidad aplicables, incluido el RGPD. Para más detalles sobre lo que recopilamos, cómo lo usamos y sus derechos, consulte nuestra política de privacidad."
      },
      {
        "title": "6. Relaciones con el entrenador",
        "body": "Si se conecta con un entrenador a través de Coachly, se comparten con él datos seleccionados de su cuenta para que pueda apoyar su entrenamiento. Usted controla lo que se comparte y puede revocar el acceso de un entrenador en cualquier momento desde la aplicación."
      },
      {
        "title": "7. Propiedad intelectual",
        "body": "Todo el contenido de Coachly — incluida la propia aplicación, su diseño, texto, gráficos y código — es propiedad de Qup DA o de sus licenciantes y está protegido por derechos de autor y otras leyes de propiedad intelectual. No puede copiar, modificar, distribuir ni crear obras derivadas sin autorización previa por escrito."
      },
      {
        "title": "8. Limitación de responsabilidad",
        "body": "Coachly se proporciona «tal cual» y «según disponibilidad», sin garantías de ningún tipo. En la medida máxima permitida por la ley, Qup DA no será responsable de ningún daño indirecto, incidental, especial o consecuente derivado del uso de la aplicación, incluidos los resultados de salud, la pérdida de datos o la interrupción del servicio. Usted utiliza la aplicación bajo su propio riesgo."
      },
      {
        "title": "9. Cambios en los términos",
        "body": "Podemos revisar estos términos en cualquier momento. Cuando lo hagamos, actualizaremos la fecha en la parte superior de esta página. Los cambios importantes también pueden comunicarse a través de la aplicación. El uso continuado tras los cambios significa que acepta los términos revisados."
      },
      {
        "title": "10. Contacto",
        "body": "Si tiene preguntas sobre estos términos o sobre Coachly, contáctenos en jan.egi.staff@qupda.com."
      }
    ]
  },
  "pl": {
    "termsTitle": "Regulamin",
    "termsLastUpdated": "Ostatnia aktualizacja: kwiecień 2026",
    "termsContact": "Kontakt",
    "termsIntro": "Niniejszy regulamin reguluje korzystanie z Coachly, aplikacji obsługiwanej przez Qup DA. Korzystając z aplikacji, zgadzasz się przestrzegać tych warunków. Jeśli się nie zgadzasz, nie korzystaj z aplikacji.",
    "termsSections": [
      {
        "title": "1. Akceptacja warunków",
        "body": "Tworząc konto lub korzystając z Coachly, potwierdzasz, że masz co najmniej 16 lat (lub posiadasz zgodę rodziców) i akceptujesz niniejszy regulamin w całości. Coachly jest obsługiwana przez Qup DA. Możemy aktualizować regulamin od czasu do czasu, a dalsze korzystanie z aplikacji po zmianach oznacza akceptację zaktualizowanych warunków."
      },
      {
        "title": "2. Twoje konto",
        "body": "Jesteś odpowiedzialny za zachowanie poufności swoich danych logowania i kodu PIN oraz za wszelkie działania podejmowane na twoim koncie. Zobowiązujesz się podawać dokładne informacje podczas rejestracji i utrzymywać je aktualne. Możesz usunąć swoje konto w dowolnym momencie z poziomu aplikacji."
      },
      {
        "title": "3. Dopuszczalne użycie",
        "body": "Zobowiązujesz się nie nadużywać aplikacji, w tym nie próbować uzyskać do niej dostępu w nieautoryzowany sposób, nie zakłócać jej działania, nie dokonywać inżynierii wstecznej ani nie używać jej do celów niezgodnych z prawem. Zastrzegamy sobie prawo do zawieszenia lub zamknięcia kont naruszających te zasady."
      },
      {
        "title": "4. Zastrzeżenie dotyczące informacji zdrowotnych",
        "body": "Coachly to narzędzie do śledzenia i wspierania stylu życia. Nie jest to wyrób medyczny i nie zapewnia porad medycznych, diagnozy ani leczenia. Zawsze skonsultuj się z wykwalifikowanym pracownikiem służby zdrowia przed podjęciem decyzji dotyczących zdrowia, treningu, odżywiania lub leczenia. Nie polegaj na Coachly jako zamienniku profesjonalnej opieki medycznej."
      },
      {
        "title": "5. Twoje dane i prywatność",
        "body": "Przetwarzamy dane wprowadzane do aplikacji w celu świadczenia jej funkcji, w tym dzienniki treningowe, oceny oraz wszelkie informacje zdrowotne, które zdecydujesz się zapisać. Twoje dane są bezpiecznie przechowywane i przetwarzane zgodnie z obowiązującymi przepisami o ochronie prywatności, w tym RODO. Szczegóły dotyczące tego, co zbieramy, jak to wykorzystujemy i twoich praw, znajdziesz w naszej polityce prywatności."
      },
      {
        "title": "6. Relacje z trenerem",
        "body": "Jeśli połączysz się z trenerem przez Coachly, wybrane dane z twojego konta są z nim udostępniane, aby mógł wspierać twój trening. Kontrolujesz, co jest udostępniane, i możesz w dowolnym momencie odwołać dostęp trenera z poziomu aplikacji."
      },
      {
        "title": "7. Własność intelektualna",
        "body": "Cała zawartość Coachly — w tym sama aplikacja, jej projekt, tekst, grafika i kod — jest własnością Qup DA lub jego licencjodawców i jest chroniona prawem autorskim oraz innymi przepisami o własności intelektualnej. Nie możesz kopiować, modyfikować, rozpowszechniać ani tworzyć dzieł pochodnych bez uprzedniej pisemnej zgody."
      },
      {
        "title": "8. Ograniczenie odpowiedzialności",
        "body": "Coachly jest dostarczana „w stanie, w jakim jest” i „w miarę dostępności”, bez jakichkolwiek gwarancji. W maksymalnym zakresie dozwolonym przez prawo Qup DA nie ponosi odpowiedzialności za jakiekolwiek pośrednie, przypadkowe, szczególne lub wynikowe szkody wynikające z korzystania z aplikacji, w tym skutki zdrowotne, utratę danych lub przerwy w usłudze. Korzystasz z aplikacji na własne ryzyko."
      },
      {
        "title": "9. Zmiany regulaminu",
        "body": "Możemy zmieniać niniejszy regulamin w dowolnym momencie. W takim przypadku zaktualizujemy datę u góry tej strony. Istotne zmiany mogą być również komunikowane przez aplikację. Dalsze korzystanie po zmianach oznacza akceptację zmienionego regulaminu."
      },
      {
        "title": "10. Kontakt",
        "body": "W razie pytań dotyczących regulaminu lub Coachly prosimy o kontakt pod adresem jan.egi.staff@qupda.com."
      }
    ]
  },
  "pt": {
    "termsTitle": "Termos e condições",
    "termsLastUpdated": "Última atualização: abril de 2026",
    "termsContact": "Contacto",
    "termsIntro": "Estes termos e condições regem a sua utilização do Coachly, uma aplicação operada pela Qup DA. Ao aceder ou utilizar a aplicação, concorda em ficar vinculado a estes termos. Se não concordar, por favor não utilize a aplicação.",
    "termsSections": [
      {
        "title": "1. Aceitação dos termos",
        "body": "Ao criar uma conta ou utilizar o Coachly, confirma que tem pelo menos 16 anos (ou que possui o consentimento dos pais) e que aceita estes termos na sua totalidade. O Coachly é operado pela Qup DA. Podemos atualizar estes termos de tempos a tempos, e a utilização continuada da aplicação após alterações constitui a aceitação dos termos atualizados."
      },
      {
        "title": "2. A sua conta",
        "body": "É responsável por manter a confidencialidade das suas credenciais de início de sessão e do seu PIN, bem como por toda a atividade que ocorra na sua conta. Concorda em fornecer informações precisas no momento do registo e em mantê-las atualizadas. Pode eliminar a sua conta a qualquer momento a partir da aplicação."
      },
      {
        "title": "3. Utilização aceitável",
        "body": "Concorda em não utilizar indevidamente a aplicação, incluindo tentar aceder à mesma por meios não autorizados, interferir no seu funcionamento, realizar engenharia reversa ou utilizá-la para fins ilegais. Reservamo-nos o direito de suspender ou encerrar contas que violem estas regras."
      },
      {
        "title": "4. Aviso de informação de saúde",
        "body": "O Coachly é uma ferramenta de monitorização e apoio ao estilo de vida. Não é um dispositivo médico e não fornece aconselhamento, diagnóstico ou tratamento médico. Consulte sempre um profissional de saúde qualificado antes de tomar decisões sobre a sua saúde, treino, nutrição ou tratamento. Não confie no Coachly como substituto de cuidados médicos profissionais."
      },
      {
        "title": "5. Os seus dados e privacidade",
        "body": "Processamos os dados que introduz na aplicação para fornecer as suas funcionalidades, incluindo registos de treino, avaliações e qualquer informação relacionada com a saúde que escolha registar. Os seus dados são armazenados com segurança e tratados de acordo com as leis de privacidade aplicáveis, incluindo o RGPD. Para mais detalhes sobre o que recolhemos, como o utilizamos e os seus direitos, consulte a nossa política de privacidade."
      },
      {
        "title": "6. Relações com o treinador",
        "body": "Se se ligar a um treinador através do Coachly, dados selecionados da sua conta são partilhados com ele para que possa apoiar o seu treino. Controla o que é partilhado e pode revogar o acesso de um treinador a qualquer momento a partir da aplicação."
      },
      {
        "title": "7. Propriedade intelectual",
        "body": "Todo o conteúdo do Coachly — incluindo a própria aplicação, o seu design, texto, gráficos e código — é propriedade da Qup DA ou dos seus licenciantes e está protegido por direitos de autor e outras leis de propriedade intelectual. Não pode copiar, modificar, distribuir ou criar trabalhos derivados sem autorização prévia por escrito."
      },
      {
        "title": "8. Limitação de responsabilidade",
        "body": "O Coachly é fornecido \"tal como está\" e \"conforme disponível\", sem garantias de qualquer tipo. Na máxima medida permitida por lei, a Qup DA não será responsável por quaisquer danos indiretos, incidentais, especiais ou consequenciais decorrentes da sua utilização da aplicação, incluindo resultados de saúde, perda de dados ou interrupção do serviço. Utiliza a aplicação por sua conta e risco."
      },
      {
        "title": "9. Alterações aos termos",
        "body": "Podemos rever estes termos a qualquer momento. Quando o fizermos, atualizaremos a data no topo desta página. As alterações significativas também podem ser comunicadas através da aplicação. A utilização continuada após alterações significa que aceita os termos revistos."
      },
      {
        "title": "10. Contacto",
        "body": "Se tiver questões sobre estes termos ou sobre o Coachly, por favor contacte-nos em jan.egi.staff@qupda.com."
      }
    ]
  }
};

// ─── HELPERS ───────────────────────────────────────────────────────
function findTargetFile() {
  for (const rel of CANDIDATES) {
    const p = path.resolve(process.cwd(), rel);
    if (fs.existsSync(p)) return p;
  }
  console.error("✗ Could not find translations.js in any of:");
  CANDIDATES.forEach((c) => console.error("    " + c));
  process.exit(1);
}

function backup(file) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const bak = file + ".backup-" + ts;
  fs.copyFileSync(file, bak);
  return bak;
}

/**
 * Locate the language block.
 * Matches BOTH styles:
 *   en: {        (unquoted key)
 *   "en": {      (quoted key, what your file uses)
 *
 * Returns { start, end, keyEnd } where:
 *   start  = index of opening `{` of the language object
 *   end    = index of matching closing `}` of the language object
 *   keyEnd = index just after the colon (for context, unused)
 */
function findLangBlock(src, lang) {
  // Try quoted form first ("en":), then unquoted (en:)
  const patterns = [
    new RegExp("(^|\\n)(\\s*)\"" + lang + "\"\\s*:\\s*\\{"),
    new RegExp("(^|\\n)(\\s*)" + lang + "\\s*:\\s*\\{"),
  ];

  let m = null;
  for (const pat of patterns) {
    m = src.match(pat);
    if (m) break;
  }
  if (!m) return null;

  const openIdx = src.indexOf("{", m.index);

  // Walk forward to find matching closing brace, respecting nested {}
  // and ignoring braces inside strings.
  let depth = 0;
  let inStr = null; // null | "\"" | "\'" | "`"
  let escape = false;

  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];

    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }

    if (inStr) {
      if (ch === inStr) inStr = null;
      continue;
    }

    if (ch === "\"" || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { start: openIdx, end: i };
      }
    }
  }
  return null;
}

function hasKey(blockText, key) {
  // Look for "key": or key: at start of a line (any indent).
  // Need word boundary so e.g. "termsTitle" doesn't match "termsTitleSomething".
  const re = new RegExp(
    "(^|\\n)\\s*\"?" + key + "\"?\\s*:",
    ""
  );
  return re.test(blockText);
}

function jsValueLiteral(value, indent) {
  // JSON.stringify produces valid JS (with quoted keys, which matches
  // your existing file style).  Re-indent so nested lines are aligned.
  const text = JSON.stringify(value, null, 2);
  return text.split("\n")
    .map((line, i) => (i === 0 ? line : indent + line))
    .join("\n");
}

function insertKeys(src, lang, keys) {
  const block = findLangBlock(src, lang);
  if (!block) {
    return { src, added: 0, skipped: 0, missing: true };
  }

  const blockText = src.slice(block.start, block.end + 1);

  // Detect inner indentation by looking at the first key inside the block.
  // Default to 4 spaces if we can\'t tell.
  let innerIndent = "    ";
  const indentMatch = blockText.match(/\n(\s+)\"?\w+\"?\s*:/);
  if (indentMatch) innerIndent = indentMatch[1];

  let added = 0;
  let skipped = 0;
  const lines = [];

  for (const [key, value] of Object.entries(keys)) {
    if (hasKey(blockText, key)) {
      skipped++;
      continue;
    }
    const literal = jsValueLiteral(value, innerIndent);
    lines.push(innerIndent + "\"" + key + "\": " + literal + ",");
    added++;
  }

  if (added === 0) return { src, added: 0, skipped, missing: false };

  // Insert just before the closing `}` of the language block.
  // Make sure the preceding line ends with a comma.
  const before = src.slice(0, block.end);
  const after  = src.slice(block.end);

  // Trim trailing whitespace before the `}`.
  const trimmed = before.replace(/\s*$/, "");
  const lastChar = trimmed[trimmed.length - 1];
  const needsComma = lastChar !== "," && lastChar !== "{";
  const sep = needsComma ? "," : "";

  // Find the indent of the closing brace itself, for visual alignment.
  const closingIndentMatch = before.match(/\n(\s*)$/);
  const closingIndent = closingIndentMatch ? closingIndentMatch[1] : "  ";

  const newSrc =
    trimmed +
    sep +
    "\n" +
    lines.join("\n") +
    "\n" +
    closingIndent +
    after;

  return { src: newSrc, added, skipped, missing: false };
}

// ─── MAIN ──────────────────────────────────────────────────────────
function main() {
  const target = findTargetFile();
  console.log("Target: " + target);

  const original = fs.readFileSync(target, "utf8");
  const bak = backup(target);
  console.log("Backup: " + bak);
  console.log("");

  let src = original;
  let totalAdded = 0;
  let anyMissing = false;

  for (const [lang, keys] of Object.entries(TRANSLATIONS)) {
    const { src: newSrc, added, skipped, missing } = insertKeys(src, lang, keys);
    if (missing) {
      console.log("  " + lang + ": ⚠ language block not found");
      anyMissing = true;
      continue;
    }
    src = newSrc;
    totalAdded += added;
    console.log("  " + lang + ": +" + added + " added, " + skipped + " already present");
  }

  console.log("");

  if (totalAdded === 0) {
    console.log("✓ Nothing to do — all keys already present.");
    fs.unlinkSync(bak);
    return;
  }

  fs.writeFileSync(target, src, "utf8");
  console.log("✓ translations.js updated. Total keys added: " + totalAdded);
  console.log("  Restore with: mv \"" + bak + "\" \"" + target + "\"");

  if (anyMissing) {
    console.log("");
    console.log("⚠ Some language blocks were not found. Check your file structure.");
  }
}

main();
