export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface EnvironmentProfile {
  name: AppEnvironment;
  requireHttpsPublicOrigin: boolean;
  requireSecureCookies: boolean;
  allowLocalhostOriginsAlone: boolean;
  requireAdminToken: boolean;
  allowRetentionCleanupDefault: boolean;
  allowLiveAiDefault: boolean;
  allowDevDataDirOverride: boolean;
  serveStaticBundle: boolean;
}

const PROFILES: Record<AppEnvironment, EnvironmentProfile> = {
  development: {
    name: 'development',
    requireHttpsPublicOrigin: false,
    requireSecureCookies: false,
    allowLocalhostOriginsAlone: true,
    requireAdminToken: false,
    allowRetentionCleanupDefault: false,
    allowLiveAiDefault: false,
    allowDevDataDirOverride: true,
    serveStaticBundle: false,
  },
  test: {
    name: 'test',
    requireHttpsPublicOrigin: false,
    requireSecureCookies: false,
    allowLocalhostOriginsAlone: true,
    requireAdminToken: false,
    allowRetentionCleanupDefault: false,
    allowLiveAiDefault: false,
    allowDevDataDirOverride: true,
    serveStaticBundle: false,
  },
  staging: {
    name: 'staging',
    requireHttpsPublicOrigin: true,
    requireSecureCookies: true,
    allowLocalhostOriginsAlone: false,
    requireAdminToken: true,
    allowRetentionCleanupDefault: false,
    allowLiveAiDefault: false,
    allowDevDataDirOverride: false,
    serveStaticBundle: true,
  },
  production: {
    name: 'production',
    requireHttpsPublicOrigin: true,
    requireSecureCookies: true,
    allowLocalhostOriginsAlone: false,
    requireAdminToken: true,
    allowRetentionCleanupDefault: false,
    allowLiveAiDefault: false,
    allowDevDataDirOverride: false,
    serveStaticBundle: true,
  },
};

export function resolveAppEnvironment(env: NodeJS.ProcessEnv = process.env): AppEnvironment {
  const raw = (env.APP_ENV ?? env.MYSTYLE_ENV ?? '').trim().toLowerCase();
  if (raw === 'production' || raw === 'staging' || raw === 'test' || raw === 'development') return raw;
  if (env.RENDER === 'true') return 'production';
  if (env.NODE_ENV === 'test') return 'test';
  return 'development';
}

export function profileFor(envName: AppEnvironment): EnvironmentProfile {
  return PROFILES[envName];
}

export function assertProductionSafeConfig(input: {
  envName: AppEnvironment;
  publicOrigin: string | null;
  secureCookie: boolean;
  adminToken: string | null;
  retentionCleanupEnabled: boolean;
  retentionCleanupAck?: string | null;
  allowedOrigins: string[];
  liveAiEnabled: boolean;
  liveTryOnEnabled?: boolean;
  /** Must equal i-approve-paid-fashn-tryon when live try-on is enabled in staging/production. */
  liveTryOnApprovalAck?: string | null;
  paymentsEnabled?: boolean;
}): void {
  const profile = profileFor(input.envName);
  if (profile.requireHttpsPublicOrigin) {
    if (!input.publicOrigin || !/^https:\/\//i.test(input.publicOrigin)) {
      throw new Error('Staging/production require RENDER_EXTERNAL_URL (or public origin) to be an https:// URL.');
    }
  }
  if (profile.requireSecureCookies && !input.secureCookie) {
    throw new Error('Staging/production require Secure session cookies.');
  }
  if (profile.requireAdminToken && (!input.adminToken || input.adminToken.length < 20)) {
    throw new Error('Staging/production require API_ADMIN_TOKEN of at least 20 characters.');
  }
  if (input.retentionCleanupEnabled) {
    if (input.envName === 'production' && input.retentionCleanupAck !== 'i-understand-destructive-cleanup') {
      throw new Error('Production refuses API_RETENTION_CLEANUP_ENABLED without API_RETENTION_CLEANUP_ACK.');
    }
  }
  if (!profile.allowLiveAiDefault && input.liveAiEnabled) {
    throw new Error('Staging/production refuse AI_ALLOW_LIVE=true until a separate live-provider approval sets an override.');
  }
  if (!profile.allowLiveAiDefault && input.liveTryOnEnabled) {
    if (input.liveTryOnApprovalAck !== 'i-approve-paid-fashn-tryon') {
      throw new Error(
        'Staging/production refuse TRYON_ALLOW_LIVE=true until TRYON_LIVE_APPROVAL_ACK=i-approve-paid-fashn-tryon is set.',
      );
    }
  }
  if (input.paymentsEnabled) {
    throw new Error('Payments are not enabled in this revision.');
  }
  if (!profile.allowLocalhostOriginsAlone) {
    const hasLocal = input.allowedOrigins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin));
    if (hasLocal || input.allowedOrigins.length === 0) {
      throw new Error('Staging/production require non-localhost API_ALLOWED_ORIGINS.');
    }
  }
}

export function summarizeEnvironment(envName: AppEnvironment): Record<string, string | boolean> {
  const profile = profileFor(envName);
  return {
    appEnv: profile.name,
    requireHttpsPublicOrigin: profile.requireHttpsPublicOrigin,
    requireSecureCookies: profile.requireSecureCookies,
    requireAdminToken: profile.requireAdminToken,
    serveStaticBundle: profile.serveStaticBundle,
    retentionCleanupDefault: profile.allowRetentionCleanupDefault,
    liveAiDefault: profile.allowLiveAiDefault,
  };
}
