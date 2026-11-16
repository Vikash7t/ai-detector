export interface UserUsageDto {
  periodKey: string; // YYYY-MM
  charactersUsed: number;
  charactersReserved: number;
  monthlyAllowanceCharacters: number;
  charactersRemaining: number;
}

export interface GuestRateLimitStatusDto {
  date: string;
  scansPerformed: number;
  charactersUsed: number;
  dailyAllowanceCharacters: number;
}
