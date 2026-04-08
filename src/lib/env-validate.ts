export function validateEnv() {
  const missing: string[] = [];
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.VAULT_AES_KEY) missing.push('VAULT_AES_KEY');
    if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
    if (!process.env.CRON_SECRET) missing.push('CRON_SECRET');
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
