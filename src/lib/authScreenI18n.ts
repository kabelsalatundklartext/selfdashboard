import type { Locale } from '@/lib/i18n'

export const authScreenTexts = {
  de: {
    setupTitle: 'Erst-Setup',
    setupDesc:
      'Admin-Konto anlegen. Bestehendes dashboard.json wird diesem Benutzer zugeordnet.',
    adminUsername: 'Admin-Benutzername',
    password: 'Passwort',
    passwordRepeat: 'Passwort wiederholen',
    setupSubmit: 'Setup abschließen',
    setupBusy: 'Wird eingerichtet…',
    setupStatusError: 'Setup-Status konnte nicht geladen werden.',
    passwordsMismatch: 'Passwörter stimmen nicht überein.',
    setupFailed: 'Setup fehlgeschlagen.',
    networkError: 'Netzwerkfehler.',
    usernameInvalid: 'Benutzername: 2–32 Zeichen, Buchstaben/Zahlen/._-',
    passwordTooShort: 'Passwort mindestens 8 Zeichen.',
    passwordTooLong: 'Passwort zu lang.',
    loginTitle: 'Anmelden',
    loginSubmit: 'Anmelden',
    loginBusy: 'Wird angemeldet…',
    loginFailed: 'Anmeldung fehlgeschlagen.',
    invalidCredentials: 'Benutzername oder Passwort falsch.',
    username: 'Benutzername',
    rememberMe: 'Angemeldet bleiben',
    langDe: 'Deutsch',
    langEn: 'English',
  },
  en: {
    setupTitle: 'Initial setup',
    setupDesc:
      'Create the admin account. An existing dashboard.json will be assigned to this user.',
    adminUsername: 'Admin username',
    password: 'Password',
    passwordRepeat: 'Repeat password',
    setupSubmit: 'Complete setup',
    setupBusy: 'Setting up…',
    setupStatusError: 'Could not load setup status.',
    passwordsMismatch: 'Passwords do not match.',
    setupFailed: 'Setup failed.',
    networkError: 'Network error.',
    usernameInvalid: 'Username: 2–32 characters, letters/numbers/._-',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordTooLong: 'Password is too long.',
    loginTitle: 'Sign in',
    loginSubmit: 'Sign in',
    loginBusy: 'Signing in…',
    loginFailed: 'Sign-in failed.',
    invalidCredentials: 'Incorrect username or password.',
    username: 'Username',
    rememberMe: 'Stay signed in',
    langDe: 'Deutsch',
    langEn: 'English',
  },
} as const satisfies Record<Locale, Record<string, string>>

export function authT(locale: Locale, key: keyof (typeof authScreenTexts)['de']): string {
  return authScreenTexts[locale][key] ?? authScreenTexts.en[key] ?? key
}
