import React, { useEffect, useRef, useState } from 'react';
import App from '../App';
import { AccountApiError, accountApi } from '../services/accountApi';
import type { UserProfile } from '../types';
import {
  type ImportPreview,
  type ImportSelection,
  NEVER_IMPORT_KEYS,
  buildImportProfile,
  emptyAccountProfile,
  fromApiProfile,
  inspectBrowserStore,
  profileForAccount,
  toApiProfile,
} from '../services/profileContract';
import { profileService } from '../services/profileService';
import { loginError, registrationError } from '../services/registrationRules';
import { Button } from '../components/common/Button';

type Phase = 'loading' | 'unavailable' | 'signed-out' | 'import-review' | 'ready';

export interface ReadyAccount {
  mode: 'account' | 'demo';
  profile: UserProfile;
  email: string | null;
  saveProfile: (profile: UserProfile) => Promise<UserProfile>;
  deferOnboarding: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  leaveDemo: () => void;
}

function messageFrom(error: unknown): string {
  if (error instanceof AccountApiError) {
    if (error.code === 'forbidden_origin') return 'Open this app at http://127.0.0.1:3000 so the local account service can accept the browser.';
    if (error.status === 0) return 'The account service could not be reached.';
    return error.message;
  }
  return 'The account service could not be reached.';
}

function dismissKey(userId: string): string {
  return `mystyle_import_reviewed_${userId}`;
}

export function AccountRoot() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [mode, setMode] = useState<'account' | 'demo'>('account');
  const [profile, setProfile] = useState<UserProfile>(emptyAccountProfile());
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);

  async function loadSignedIn(nextUserId: string, gen: number): Promise<void> {
    const [session, rawProfile] = await Promise.all([accountApi.session(), accountApi.getProfile()]);
    await accountApi.getPreferences();
    if (gen !== generation.current) return;
    const nextProfile = profileForAccount(fromApiProfile(rawProfile));
    setUserId(nextUserId || session.userId);
    setEmail(session.email);
    setProfile(nextProfile);
    setMode('account');
    const stored = inspectBrowserStore(window.localStorage);
    const reviewed = window.sessionStorage.getItem(dismissKey(session.userId)) === '1';
    if (stored && !reviewed) {
      setPreview(stored);
      setPhase('import-review');
      return;
    }
    setPreview(null);
    setPhase('ready');
  }

  async function restore(): Promise<void> {
    const gen = ++generation.current;
    setPhase('loading');
    setFormError(null);
    try {
      const health = await accountApi.health();
      if (!health.ok || health.database !== 'up') throw new AccountApiError('unavailable', 'The account service is unavailable.', 503);
      const session = await accountApi.session();
      await loadSignedIn(session.userId, gen);
    } catch (error) {
      if (gen !== generation.current) return;
      if (error instanceof AccountApiError && error.status === 401) {
        setUserId(null);
        setEmail(null);
        setProfile(emptyAccountProfile());
        setPhase('signed-out');
        return;
      }
      setPhase('unavailable');
      setFormError(messageFrom(error));
    }
  }

  useEffect(() => {
    void restore();
  }, []);

  async function register(input: { email: string; password: string; confirmation: string }): Promise<void> {
    const validation = registrationError(input);
    if (validation) {
      setFormError(validation);
      return;
    }
    setBusy(true);
    setFormError(null);
    const gen = ++generation.current;
    try {
      const created = await accountApi.register(input.email.trim(), input.password);
      await loadSignedIn(created.userId, gen);
    } catch (error) {
      if (gen !== generation.current) return;
      setFormError(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function login(input: { email: string; password: string }): Promise<void> {
    const validation = loginError(input.email, input.password);
    if (validation) {
      setFormError(validation);
      return;
    }
    setBusy(true);
    setFormError(null);
    const gen = ++generation.current;
    try {
      const created = await accountApi.login(input.email.trim(), input.password);
      await loadSignedIn(created.userId, gen);
    } catch (error) {
      if (gen !== generation.current) return;
      setFormError(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  function endSessionIfExpired(error: unknown): void {
    if (error instanceof AccountApiError && error.status === 401) {
      generation.current += 1;
      setUserId(null);
      setEmail(null);
      setProfile(emptyAccountProfile());
      setMode('account');
      setFormError('Your session has ended. Sign in again.');
      setPhase('signed-out');
    }
  }

  const ready: ReadyAccount = {
    mode,
    profile,
    email,
    saveProfile: async (next) => {
      if (mode === 'demo') {
        const saved = { ...next, lastUpdated: new Date().toISOString() };
        profileService.saveProfile(saved);
        setProfile(saved);
        return saved;
      }
      try {
        const raw = await accountApi.saveProfile(toApiProfile(next));
        const saved = profileForAccount(fromApiProfile(raw));
        setProfile(saved);
        return saved;
      } catch (error) {
        endSessionIfExpired(error);
        throw error;
      }
    },
    deferOnboarding: async () => {
      try {
        const raw = await accountApi.saveProfile({ onboardingStatus: 'deferred' });
        const saved = profileForAccount(fromApiProfile(raw));
        setProfile(saved);
        return saved;
      } catch (error) {
        endSessionIfExpired(error);
        throw error;
      }
    },
    logout: async () => {
      await accountApi.logout();
      generation.current += 1;
      setUserId(null);
      setEmail(null);
      setProfile(emptyAccountProfile());
      setMode('account');
      setPhase('signed-out');
    },
    leaveDemo: () => {
      setMode('account');
      void restore();
    },
  };

  if (phase === 'loading') return <Status title="Checking your account" body="Looking for a saved session on this computer." />;
  if (phase === 'unavailable') {
    return (
      <Status title="Account service unavailable" body={formError ?? 'The local account service is not running. Demonstration browsing is separate from a saved account.'}>
        <Button variant="primary" onClick={() => {
          setMode('demo');
          setProfile(profileService.getProfile());
          setEmail(null);
          setUserId(null);
          setPhase('ready');
        }}>Browse the demonstration</Button>
        <Button variant="secondary" onClick={() => void restore()}>Try again</Button>
      </Status>
    );
  }
  if (phase === 'signed-out') {
    return <AuthScreen busy={busy} error={formError} onRegister={register} onLogin={login} onDemo={() => {
      setMode('demo');
      setProfile(profileService.getProfile());
      setPhase('ready');
    }} />;
  }
  if (phase === 'import-review' && preview && userId) {
    return (
      <ImportReview
        preview={preview}
        busy={busy}
        error={formError}
        onSkip={() => {
          window.sessionStorage.setItem(dismissKey(userId), '1');
          setPhase('ready');
        }}
        onImport={async (selection) => {
          setBusy(true);
          setFormError(null);
          try {
            const next = buildImportProfile(profile, window.localStorage, selection);
            const raw = await accountApi.saveProfile(toApiProfile(next));
            setProfile(profileForAccount(fromApiProfile(raw)));
            window.sessionStorage.setItem(dismissKey(userId), '1');
            setPhase('ready');
          } catch (error) {
            setFormError(messageFrom(error));
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }
  return <App key={mode === 'demo' ? 'demo' : userId ?? 'account'} account={ready} />;
}

function Status({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#242326] flex items-center justify-center px-4">
      <section className="max-w-md w-full rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-8">
        <p className="font-serif text-2xl">MyStyle <span className="text-[10px] uppercase tracking-widest text-[#B49361] font-sans">AI</span></p>
        <h1 className="mt-6 font-serif text-3xl">{title}</h1>
        <p className="mt-3 text-sm text-[#5C585E] leading-relaxed">{body}</p>
        {children ? <div className="mt-6 flex flex-col gap-3">{children}</div> : null}
      </section>
    </main>
  );
}

function AuthScreen({
  busy,
  error,
  onRegister,
  onLogin,
  onDemo,
}: {
  busy: boolean;
  error: string | null;
  onRegister: (input: { email: string; password: string; confirmation: string }) => Promise<void>;
  onLogin: (input: { email: string; password: string }) => Promise<void>;
  onDemo: () => void;
}) {
  const [panel, setPanel] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#242326] px-4 py-10">
      <section className="max-w-md mx-auto rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-8">
        <p className="font-serif text-2xl">MyStyle <span className="text-[10px] uppercase tracking-widest text-[#B49361] font-sans">AI</span></p>
        <h1 className="mt-6 font-serif text-3xl">{panel === 'register' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-3 text-sm text-[#5C585E] leading-relaxed">
          An adult account saves your style profile on this computer&apos;s local service. Email verification and password recovery are not available yet.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (panel === 'register') void onRegister({ email, password, confirmation });
            else void onLogin({ email, password });
          }}
        >
          <label className="block text-xs font-semibold uppercase tracking-wider">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-sm" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider">
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={panel === 'register' ? 'new-password' : 'current-password'} className="mt-1.5 w-full px-4 py-3 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-sm" />
          </label>
          {panel === 'register' ? (
            <label className="block text-xs font-semibold uppercase tracking-wider">
              Confirm password
              <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type="password" autoComplete="new-password" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-sm" />
            </label>
          ) : null}
          {error ? <p className="text-sm text-[#9C6A61]" role="alert">{error}</p> : null}
          <Button type="submit" variant="primary" fullWidth disabled={busy}>{busy ? 'Please wait…' : panel === 'register' ? 'Create account' : 'Sign in'}</Button>
        </form>
        <button type="button" className="mt-4 text-sm text-[#5C585E] underline" onClick={() => setPanel(panel === 'register' ? 'login' : 'register')}>
          {panel === 'register' ? 'I already have an account' : 'Create a new account'}
        </button>
        <button type="button" className="mt-3 block text-sm text-[#5C585E] underline" onClick={onDemo}>Browse the labelled demonstration instead</button>
      </section>
    </main>
  );
}

function ImportReview({
  preview,
  busy,
  error,
  onSkip,
  onImport,
}: {
  preview: ImportPreview;
  busy: boolean;
  error: string | null;
  onSkip: () => void;
  onImport: (selection: ImportSelection) => Promise<void>;
}) {
  const [selection, setSelection] = useState<ImportSelection>({ details: true, sizes: true, colours: true, shopping: true, measurements: false });
  const toggle = (key: keyof ImportSelection) => setSelection((current) => ({ ...current, [key]: !current[key] }));
  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#242326] px-4 py-10">
      <section className="max-w-lg mx-auto rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-8">
        <h1 className="font-serif text-3xl">Review saved browser preferences</h1>
        <p className="mt-3 text-sm text-[#5C585E] leading-relaxed">
          This browser has a style profile{preview.displayName ? ` for ${preview.displayName}` : ''}. It is not uploaded unless you choose the parts below. Family, wardrobe, beauty, membership, and credit records stay in the browser.
        </p>
        {preview.blockedKeysPresent.length > 0 ? (
          <p className="mt-3 text-xs text-[#5C585E]">Ignored browser records: {preview.blockedKeysPresent.length}. Those keys are never sent.</p>
        ) : null}
        <div className="mt-5 space-y-2 text-sm">
          <Choice checked={selection.details} onChange={() => toggle('details')} label={`Name, age range, and styles${preview.styles.length ? ` (${preview.styles.length})` : ''}`} />
          <Choice checked={selection.sizes} onChange={() => toggle('sizes')} label="Clothing sizes, without measurements" />
          <Choice checked={selection.colours} onChange={() => toggle('colours')} label="Colours, fit, and experimentation" />
          <Choice checked={selection.shopping} onChange={() => toggle('shopping')} label="Budget, priorities, and retailers" />
          <Choice checked={selection.measurements} onChange={() => toggle('measurements')} label="Optional measurements, including height" />
        </div>
        {error ? <p className="mt-4 text-sm text-[#9C6A61]" role="alert">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="primary" disabled={busy} onClick={() => void onImport(selection)}>{busy ? 'Saving…' : 'Import selected preferences'}</Button>
          <Button variant="secondary" disabled={busy} onClick={onSkip}>Continue without importing</Button>
        </div>
        <p className="mt-4 text-[11px] text-[#5C585E]">Blocked from import: {NEVER_IMPORT_KEYS.join(', ')}.</p>
      </section>
    </main>
  );
}

function Choice({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-start gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1" />
      <span>{label}</span>
    </label>
  );
}
