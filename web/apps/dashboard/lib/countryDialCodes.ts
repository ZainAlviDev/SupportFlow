export type CountryDialCode = {
  code: string;
  label: string;
  /** National number length limits (digits, without country code). */
  minLen: number;
  maxLen: number;
  example: string;
};

export const COUNTRY_DIAL_CODES: readonly CountryDialCode[] = [
  { code: "+92", label: "Pakistan (+92)", minLen: 10, maxLen: 10, example: "3001234567" },
  { code: "+1", label: "United States (+1)", minLen: 10, maxLen: 10, example: "2025550123" },
  { code: "+44", label: "United Kingdom (+44)", minLen: 10, maxLen: 10, example: "7911123456" },
  { code: "+91", label: "India (+91)", minLen: 10, maxLen: 10, example: "9876543210" },
  { code: "+971", label: "UAE (+971)", minLen: 9, maxLen: 9, example: "501234567" },
  { code: "+966", label: "Saudi Arabia (+966)", minLen: 9, maxLen: 9, example: "512345678" },
  { code: "+61", label: "Australia (+61)", minLen: 9, maxLen: 9, example: "412345678" },
  { code: "+49", label: "Germany (+49)", minLen: 10, maxLen: 11, example: "15123456789" },
] as const;

const FALLBACK_RULE: Pick<CountryDialCode, "minLen" | "maxLen" | "example"> = {
  minLen: 6,
  maxLen: 14,
  example: "3001234567",
};

export function getPhoneRule(countryCode: string) {
  return (
    COUNTRY_DIAL_CODES.find((item) => item.code === countryCode) ?? {
      code: countryCode,
      label: countryCode,
      ...FALLBACK_RULE,
    }
  );
}
