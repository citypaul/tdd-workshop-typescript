const isValidLuhn = (digits: string): boolean => {
  const sum = [...digits]
    .reverse()
    .map((d, i) => {
      const digit = Number(d);
      if (i % 2 === 0) return digit;
      const doubled = digit * 2;
      return doubled > 9 ? doubled - 9 : doubled;
    })
    .reduce((a, b) => a + b, 0);

  return sum % 10 === 0;
};

export const validateCard = (cardNumber: string): string | null => {
  const sanitised = cardNumber.replace(/[\s-]/g, "");

  if (sanitised === "") {
    return "Card number is required";
  }

  if (!/^\d+$/.test(sanitised)) {
    return "Card number must contain only digits";
  }

  if (!isValidLuhn(sanitised)) {
    return "Invalid card number";
  }

  return null;
};
