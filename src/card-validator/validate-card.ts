type Provider = "visa" | "amex" | "mastercard";

type ValidationResult =
  | { valid: true; error: null; provider: Provider }
  | { valid: false; error: string };

const isValidLuhn = (digits: string): boolean => {
  const sum = [...digits]
    .reverse()
    .map((d, i) => {
      const digit = Number(d);
      if (i % 2 === 0) return digit;
      const doubled = digit * 2;
      return doubled >= 10 ? doubled - 9 : doubled;
    })
    .reduce((a, b) => a + b, 0);

  return sum % 10 === 0;
};

const providerLength: Record<Provider, number> = {
  visa: 16,
  amex: 15,
  mastercard: 16,
};

const providerName: Record<Provider, string> = {
  visa: "Visa",
  amex: "Amex",
  mastercard: "Mastercard",
};

const prefixInRange = (
  digits: string,
  { length, min, max }: { length: number; min: number; max: number },
): boolean => {
  const prefix = Number(digits.substring(0, length));
  return prefix >= min && prefix <= max;
};

const detectProvider = (digits: string): Provider | undefined => {
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";

  if (prefixInRange(digits, { length: 2, min: 51, max: 55 }))
    return "mastercard";
  if (prefixInRange(digits, { length: 4, min: 2221, max: 2720 }))
    return "mastercard";

  return undefined;
};

export const validateCard = (cardNumber: string): ValidationResult => {
  const sanitised = cardNumber.replace(/[\s-]/g, "");

  if (sanitised === "") {
    return { valid: false, error: "Card number is required" };
  }

  if (!/^\d+$/.test(sanitised)) {
    return { valid: false, error: "Card number must contain only digits" };
  }

  const provider = detectProvider(sanitised);

  if (provider === undefined) {
    return { valid: false, error: "Unknown card provider" };
  }

  const expectedLength = providerLength[provider];
  if (sanitised.length !== expectedLength) {
    return {
      valid: false,
      error: `${providerName[provider]} cards must be ${expectedLength} digits`,
    };
  }

  if (!isValidLuhn(sanitised)) {
    return { valid: false, error: "Invalid card number" };
  }

  return { valid: true, error: null, provider };
};
