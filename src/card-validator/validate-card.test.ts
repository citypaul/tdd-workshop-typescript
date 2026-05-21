import { describe, it, expect } from "vitest";
import { validateCard } from "./validate-card.js";

describe("Card Validator", () => {
  it("should reject empty card numbers", () => {
    expect(validateCard("")).toBe("Card number is required");
  });

  it.each([
    { example: "number that exercises subtract 9", number: "4539578763621486" },
    { example: "all-ones Visa-shaped number", number: "4111111111111111" },
    { example: "Mastercard-shaped number", number: "5111111111111118" },
    { example: "15-digit Amex-shaped number", number: "341111111111111" },
  ])("should accept known-valid card number: $example", ({ number }) => {
    expect(validateCard(number)).toBeNull();
  });

  it("should reject card numbers with non-numeric characters", () => {
    expect(validateCard("4111abcd1111")).toBe(
      "Card number must contain only digits",
    );
  });

  it("should reject card numbers that fail Luhn checksum", () => {
    expect(validateCard("4111111111111112")).toBe("Invalid card number");
  });

  it("should reject card numbers where Luhn sum is off by 5", () => {
    expect(validateCard("4111111111111116")).toBe("Invalid card number");
  });

  it("should reject whitespace-only input as empty", () => {
    expect(validateCard("   ")).toBe("Card number is required");
  });

  it("should reject dash-only input as empty", () => {
    expect(validateCard("---")).toBe("Card number is required");
  });

  it("should accept card numbers with spaces", () => {
    expect(validateCard("4539 5787 6362 1486")).toBeNull();
  });

  it("should accept card numbers with dashes", () => {
    expect(validateCard("4539-5787-6362-1486")).toBeNull();
  });

  it("should strip leading and trailing whitespace", () => {
    expect(validateCard("  4539578763621486  ")).toBeNull();
  });
});
