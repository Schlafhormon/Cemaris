/* Sunrise CMS language catalogs: copyright (c) 2026 The Corporation of the City
 * of Sault Ste. Marie. MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { appUrl } from './paths'

export type Language = 'en' | 'de'
type Catalog = Record<string, string>
const namespaces = ['app', 'admin', 'login', 'errors'] as const
const catalogs: Record<Language, Record<string, Catalog>> = { en: {}, de: {} }

export function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'de'
}

function supported(value: string): Language | undefined {
  const base = value.toLowerCase().split('-')[0]
  return base && isLanguage(base) ? base : undefined
}

export function initialLanguage(): Language {
  const requested = new URLSearchParams(window.location.search).get('lng')
  if (requested && supported(requested)) return supported(requested)!
  const cookie = document.cookie.split('; ').find((value) => value.startsWith('i18next='))
  if (cookie) {
    try {
      const cached = supported(decodeURIComponent(cookie.slice('i18next='.length)))
      if (cached) return cached
    } catch { /* A malformed cookie is ignored, as in the source detector. */ }
  }
  for (const language of navigator.languages) {
    const matched = supported(language)
    if (matched) return matched
  }
  return 'de'
}

export async function loadCatalogs(signal: AbortSignal): Promise<void> {
  await Promise.all((['en', 'de'] as const).flatMap((language) => namespaces.map(async (namespace) => {
    const response = await fetch(appUrl(`/locales/${language}/${namespace}.json`), { signal })
    if (!response.ok) throw new Error('Language catalog unavailable')
    const catalog: unknown = await response.json()
    if (typeof catalog !== 'object' || catalog === null || Object.values(catalog).some((value) => typeof value !== 'string')) {
      throw new Error('Invalid language catalog')
    }
    catalogs[language][namespace] = catalog as Catalog
  })))
}

const additions: Record<Language, Catalog> = {
  en: {
    passwordSet: 'Set password', passwordChange: 'Change password', passwordForgot: 'Forgot password?', backToLogin: 'Back to login',
    passwordFirstLogin: 'You must choose your own password before you can use Cemaris. Your initial password is your username. This also applies after an administrator resets your password.',
    passwordInitialHelp: 'The initial password is the username. The user must change it at the first login.',
    passwordRules: 'Choose 12–128 characters. The new password must differ from your username and current password.',
    passwordCurrent: 'Current password', passwordNew: 'New password', passwordConfirm: 'Repeat new password', passwordSaved: 'Your password has been changed. Other sessions have been signed out.',
    passwordForgotHelp: 'Please contact your Cemaris administrator. After verifying your identity, they can reset your password in User management. Then log in with your username as the password and choose a new password. For a directory account, contact your IT service.',
    passwordReset: 'Reset password', passwordResetConfirm: 'Reset the password for {{username}} to their username? All their sessions will end and they must choose a new password at the next login.',
    passwordResetDone: 'Password reset. The initial password is the username; the next login requires a new password. Existing sessions have been invalidated.',
    passwordMismatch: 'The new passwords do not match.', passwordLength: 'Please choose a password with 12–128 characters.', passwordDifferent: 'The new password must differ from your username and current password.',
    passwordCurrentInvalid: 'The current password is incorrect.', passwordChangedConcurrently: 'The password was changed in the meantime. Please log in again.', passwordExternal: 'Your password is managed by your directory service. Please change it there.', passwordChangeRequired: 'Please set your own password first.',
    authenticationRequired: 'Please log in.', recordNotFound: 'Record not found.', contractNotFound: 'Contract not found.', funeralHomeNotFound: 'Funeral home not found.', cemeteryNotFound: 'Cemetery not found.', burialSiteNotFound: 'Burial site not found.', attachmentNotFound: 'Attachment not found.', noFileUploaded: 'Please select a file to upload.', auditDisabled: 'The audit log is disabled.', validationFailed: 'Please check your input.', serverError: 'An internal error occurred. Please try again.',
    language: 'Language', breadcrumb: 'Breadcrumb', invalidSearch: 'Please enter a valid search value.', printConfigNotFound: 'Print configuration not found.', state: 'Federal state', navigation: 'Main navigation', skip: 'Skip to content', notices: 'Third-party notices',
    unavailable: 'The application could not be reached. Please try again.', timeout: 'The application did not respond within five seconds. Please try again.',
    retry: 'Try again', expired: 'Your session has expired. Please log in again.', checking: 'Connecting to Cemaris…', invalid: 'The application returned an unexpected response. Please try again.',
    saved: 'The setting has been successfully updated.', setting: 'Setting', value: 'Value', default: 'Default',
    noDescription: 'No description available', noUsers: 'No users found.', permissions: 'Permissions',
    resetConfirm: 'Are you sure you want to reset your API key?', resetSuccess: 'API key reset successfully. Remember to update any applications using your API key.',
    contractNumber: 'Contract Number', deceasedName: 'Deceased Name', quickSearch: 'Quick Search',
    geoSelectCoordinate: 'Select Coordinate', geoClickCoordinate: 'Click on the map to select a coordinate.', geoUpdateCoordinate: 'Update Coordinate',
    geoImageUnavailable: 'The image could not be loaded.', geoNoCemeteryImage: 'There are no images associated with this cemetery.', geoNoSiteImage: 'There are no images associated with this burial site.',
    geoCemeteryCoordinates: 'Coordinates not available for this burial site. Coordinates for the cemetery are shown instead.',
    geoActiveFuture: 'Active/Future Contracts:', geoNoActiveContracts: 'No active contracts', geoDeceasedFilter: 'Deceased Name Filter', geoSitesCoordinates: 'Sites with coordinates:', geoPreneedFuture: 'Preneed or future contracts', geoActiveContracts: 'Active contracts',
    geoDefineRanges: 'Define Ranges', geoPreview: 'Preview Burial Sites', geoRangeDescription: 'Create a range of burial sites based on the selected cemetery and the configured name segments.',
    geoFromName: 'From Burial Site Name', geoToName: 'To Burial Site Name', geoFrom: 'from', geoTo: 'to', geoTypeRequired: 'Please select a burial site type.', geoStatusRequired: 'Please select a burial site status.',
    geoRangeEmpty: 'No burial site names generated. Ranges may not generate more than', geoExistingSites: 'Existing Burial Sites', geoNewSites: 'New Burial Sites',
    geoGpsDescription: "Capture latitude and longitude coordinates using your device's GPS", geoGpsRequesting: 'Requesting GPS permission...', geoGpsReady: 'GPS active and ready', geoGpsUnsupported: 'GPS not supported by this device/browser',
    geoGpsDenied: 'GPS permission denied. Please enable location access.', geoGpsUnavailable: 'GPS position unavailable.', geoGpsTimeout: 'GPS request timed out.', geoGpsError: 'Unknown GPS error occurred.', geoGpsNotReady: 'GPS coordinates are not available. Please wait for GPS to initialize.',
    geoAccuracy: 'Accuracy', geoCoordinateStatus: 'Coordinate Status', geoMissingCoordinates: 'Missing Coordinates', geoHasCoordinates: 'Has Coordinates', geoSearchSites: 'Search Burial Sites', geoSelectCemetery: 'Select a cemetery to view burial sites.', geoNoMatches: 'No burial sites match the current filters.',
    geoJustCaptured: 'Just captured', geoCaptured: 'Captured!', geoCaptureGps: 'Capture GPS', geoUpdateGps: 'Update GPS', geoSelect: 'Select', geoAllSites: 'All Sites',
    geoSiteName: 'Burial Site Name', geoSiteType: 'Burial Site Type', geoNoType: 'No Type', geoNoSiteCoordinates: 'There are no geographic coordinates associated with this burial site.',
  },
  de: {
    passwordSet: 'Passwort festlegen', passwordChange: 'Passwort ändern', passwordForgot: 'Passwort vergessen?', backToLogin: 'Zurück zur Anmeldung',
    passwordFirstLogin: 'Bevor Sie Cemaris nutzen können, müssen Sie ein eigenes Passwort festlegen. Das Startpasswort ist Ihr Benutzername. Das gilt auch nach einer Rücksetzung durch einen Administrator.',
    passwordInitialHelp: 'Das Startpasswort entspricht dem Benutzernamen. Beim ersten Login muss der Benutzer es ändern.',
    passwordRules: 'Wählen Sie 12–128 Zeichen. Das neue Passwort muss sich vom Benutzernamen und bisherigen Passwort unterscheiden.',
    passwordCurrent: 'Bisheriges Passwort', passwordNew: 'Neues Passwort', passwordConfirm: 'Neues Passwort wiederholen', passwordSaved: 'Ihr Passwort wurde geändert. Andere Sitzungen wurden abgemeldet.',
    passwordForgotHelp: 'Wenden Sie sich an Ihren Cemaris-Administrator. Nach Prüfung Ihrer Identität kann er Ihr Passwort unter Benutzerverwaltung zurücksetzen. Melden Sie sich danach mit Ihrem Benutzernamen als Passwort an und legen Sie ein neues Passwort fest. Bei einem Domänenkonto wenden Sie sich an Ihre IT.',
    passwordReset: 'Passwort zurücksetzen', passwordResetConfirm: 'Passwort für {{username}} auf den Benutzernamen zurücksetzen? Alle Sitzungen dieses Benutzers werden ungültig. Bei der nächsten Anmeldung muss er ein neues Passwort festlegen.',
    passwordResetDone: 'Passwort zurückgesetzt. Das Startpasswort ist der Benutzername; beim nächsten Login muss ein neues Passwort vergeben werden. Bestehende Sitzungen wurden ungültig gemacht.',
    passwordMismatch: 'Die neuen Passwörter stimmen nicht überein.', passwordLength: 'Bitte wählen Sie ein Passwort mit 12–128 Zeichen.', passwordDifferent: 'Das neue Passwort muss sich vom Benutzernamen und bisherigen Passwort unterscheiden.',
    passwordCurrentInvalid: 'Das bisherige Passwort ist falsch.', passwordChangedConcurrently: 'Das Passwort wurde zwischenzeitlich geändert. Bitte melden Sie sich erneut an.', passwordExternal: 'Ihr Passwort wird im zentralen Verzeichnis verwaltet. Bitte ändern Sie es dort.', passwordChangeRequired: 'Bitte legen Sie zuerst ein eigenes Passwort fest.',
    authenticationRequired: 'Bitte melden Sie sich an.', recordNotFound: 'Datensatz nicht gefunden.', contractNotFound: 'Vertrag nicht gefunden.', funeralHomeNotFound: 'Bestattungsunternehmen nicht gefunden.', cemeteryNotFound: 'Friedhof nicht gefunden.', burialSiteNotFound: 'Grabstätte nicht gefunden.', attachmentNotFound: 'Anhang nicht gefunden.', noFileUploaded: 'Bitte wählen Sie eine Datei zum Hochladen aus.', auditDisabled: 'Das Änderungsprotokoll ist deaktiviert.', validationFailed: 'Bitte prüfen Sie Ihre Eingaben.', serverError: 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    language: 'Sprache', breadcrumb: 'Brotkrumennavigation', invalidSearch: 'Bitte geben Sie einen gültigen Suchwert ein.', printConfigNotFound: 'Druckkonfiguration nicht gefunden.', state: 'Bundesland', navigation: 'Hauptnavigation', skip: 'Zum Inhalt springen', notices: 'Hinweise zu Drittbestandteilen',
    unavailable: 'Die Anwendung ist nicht erreichbar. Bitte versuchen Sie es erneut.', timeout: 'Die Anwendung hat innerhalb von fünf Sekunden nicht geantwortet. Bitte versuchen Sie es erneut.',
    retry: 'Erneut versuchen', expired: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', checking: 'Verbindung mit Cemaris wird hergestellt…', invalid: 'Die Anwendung hat eine unerwartete Antwort geliefert. Bitte versuchen Sie es erneut.',
    saved: 'Die Einstellung wurde erfolgreich aktualisiert.', setting: 'Einstellung', value: 'Wert', default: 'Standard',
    noDescription: 'Keine Beschreibung verfügbar', noUsers: 'Keine Benutzer gefunden.', permissions: 'Berechtigungen',
    resetConfirm: 'Möchten Sie Ihren API-Schlüssel zurücksetzen?', resetSuccess: 'API-Schlüssel erfolgreich zurückgesetzt. Aktualisieren Sie alle Anwendungen, die Ihren API-Schlüssel verwenden.',
    contractNumber: 'Vertragsnummer', deceasedName: 'Name des Verstorbenen', quickSearch: 'Schnellsuche',
    geoSelectCoordinate: 'Koordinate auswählen', geoClickCoordinate: 'Klicken Sie auf die Karte, um eine Koordinate auszuwählen.', geoUpdateCoordinate: 'Koordinate übernehmen',
    geoImageUnavailable: 'Das Bild konnte nicht geladen werden.', geoNoCemeteryImage: 'Diesem Friedhof sind keine Bilder zugeordnet.', geoNoSiteImage: 'Dieser Grabstätte sind keine Bilder zugeordnet.',
    geoCemeteryCoordinates: 'Für diese Grabstätte sind keine Koordinaten vorhanden. Stattdessen werden die Koordinaten des Friedhofs angezeigt.',
    geoActiveFuture: 'Laufende/zukünftige Verträge:', geoNoActiveContracts: 'Keine laufenden Verträge', geoDeceasedFilter: 'Nach verstorbener Person filtern', geoSitesCoordinates: 'Grabstätten mit Koordinaten:', geoPreneedFuture: 'Vorsorge oder zukünftige Verträge', geoActiveContracts: 'Laufende Verträge',
    geoDefineRanges: 'Bereich festlegen', geoPreview: 'Grabstätten vorschauen', geoRangeDescription: 'Erstellen Sie einen Grabstättenbereich anhand des ausgewählten Friedhofs und der konfigurierten Namenssegmente.',
    geoFromName: 'Von Grabstättenname', geoToName: 'Bis Grabstättenname', geoFrom: 'von', geoTo: 'bis', geoTypeRequired: 'Bitte wählen Sie eine Grabstättenart.', geoStatusRequired: 'Bitte wählen Sie einen Grabstättenstatus.',
    geoRangeEmpty: 'Keine Grabstättennamen erzeugt. Ein Bereich darf höchstens folgende Anzahl enthalten:', geoExistingSites: 'Vorhandene Grabstätten', geoNewSites: 'Neue Grabstätten',
    geoGpsDescription: 'Erfassen Sie Breiten- und Längengrade mit dem GPS Ihres Geräts.', geoGpsRequesting: 'GPS-Berechtigung wird angefragt…', geoGpsReady: 'GPS aktiv und bereit', geoGpsUnsupported: 'Dieses Gerät oder dieser Browser unterstützt kein GPS.',
    geoGpsDenied: 'GPS-Berechtigung verweigert. Bitte aktivieren Sie den Standortzugriff.', geoGpsUnavailable: 'GPS-Position nicht verfügbar.', geoGpsTimeout: 'Zeitüberschreitung der GPS-Anfrage.', geoGpsError: 'Ein unbekannter GPS-Fehler ist aufgetreten.', geoGpsNotReady: 'GPS-Koordinaten sind noch nicht verfügbar. Bitte warten Sie auf die GPS-Initialisierung.',
    geoAccuracy: 'Genauigkeit', geoCoordinateStatus: 'Koordinatenstatus', geoMissingCoordinates: 'Fehlende Koordinaten', geoHasCoordinates: 'Koordinaten vorhanden', geoSearchSites: 'Grabstätten suchen', geoSelectCemetery: 'Wählen Sie einen Friedhof, um Grabstätten anzuzeigen.', geoNoMatches: 'Keine Grabstätten entsprechen den aktuellen Filtern.',
    geoJustCaptured: 'Gerade erfasst', geoCaptured: 'Erfasst!', geoCaptureGps: 'GPS erfassen', geoUpdateGps: 'GPS aktualisieren', geoSelect: 'Auswählen', geoAllSites: 'Alle Grabstätten',
    geoSiteName: 'Grabstättenname', geoSiteType: 'Grabstättenart', geoNoType: 'Keine Art', geoNoSiteCoordinates: 'Dieser Grabstätte sind keine geografischen Koordinaten zugeordnet.',
  },
}

export type Translate = (key: string, values?: Record<string, string | number>) => string
export function translator(language: Language): Translate {
  return (key, values = {}) => {
    const [namespace, catalogKey] = key.includes(':') ? key.split(':', 2) : ['app', key]
    const text = namespace === 'cemaris'
      ? additions[language][catalogKey]
      : catalogs[language][namespace]?.[catalogKey] || catalogs.en[namespace]?.[catalogKey]
    return (text || key).replace(/{{\s*([^}]+?)\s*}}/g, (_match, name: string) => String(values[name] ?? `{{${name}}}`))
  }
}
