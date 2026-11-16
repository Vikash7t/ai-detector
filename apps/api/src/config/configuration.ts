import { EXACT_TRUSTED_PROXY_CIDRS } from './trusted-proxies.config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  saplingApiKey: string;
  saplingApiUrl: string;
  serverPepperKey: string;
  hmacKeyCurrentVersion: string;
  trustedProxyCidrs: string[];
  dailyGuestGlobalCharLimit: number;
  monthlyUserCharAllowance: number;
  guestSingleScanCharLimit: number;
  guestDailyCharLimit: number;
  registeredSingleScanCharLimit: number;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || 'development_secret_key_at_least_32_characters_long',
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  saplingApiKey: process.env.SAPLING_API_KEY || '',
  saplingApiUrl: process.env.SAPLING_API_URL || 'https://api.sapling.ai/api/v1/aidetect',
  serverPepperKey: process.env.SERVER_PEPPER_KEY || 'development_server_pepper_key_for_hmac_guest_tracking',
  hmacKeyCurrentVersion: process.env.HMAC_KEY_CURRENT_VERSION || 'v1',
  trustedProxyCidrs: process.env.TRUSTED_PROXY_CIDRS
    ? process.env.TRUSTED_PROXY_CIDRS.split(',').map((c) => c.trim())
    : EXACT_TRUSTED_PROXY_CIDRS,
  dailyGuestGlobalCharLimit: parseInt(process.env.DAILY_GUEST_GLOBAL_CHAR_LIMIT || '25000', 10),
  monthlyUserCharAllowance: parseInt(process.env.MONTHLY_USER_CHAR_ALLOWANCE || '15000', 10),
  guestSingleScanCharLimit: parseInt(process.env.GUEST_SINGLE_SCAN_CHAR_LIMIT || '3000', 10),
  guestDailyCharLimit: parseInt(process.env.GUEST_DAILY_CHAR_LIMIT || '6000', 10),
  registeredSingleScanCharLimit: parseInt(process.env.REGISTERED_SINGLE_SCAN_CHAR_LIMIT || '6000', 10),
});
