import { describe, it, expect } from "vitest";
import { validateCard } from "./validate-card.js";

describe("Card Validator", () => {
  it("should reject empty card numbers", () => {
    expect(validateCard("")).toEqual({
      valid: false,
      error: "Card number is required",
    });
  });

  it.each([
    { name: "Visa", number: "4539578763621486" },
    { name: "Visa (all ones)", number: "4111111111111111" },
    { name: "Mastercard", number: "5111111111111118" },
    { name: "Amex", number: "341111111111111" },
  ])("should accept valid $name card number", ({ number }) => {
    expect(validateCard(number)).toEqual({
      valid: true,
      error: null,
    });
  });

  it("should reject card numbers with non-numeric characters", () => {
    expect(validateCard("4111abcd1111")).toEqual({
      valid: false,
      error: "Card number must contain only digits",
    });
  });

  it("should reject card numbers that fail Luhn checksum", () => {
    expect(validateCard("4111111111111112")).toEqual({
      valid: false,
      error: "Invalid card number",
    });
  });

  it("should reject card numbers where Luhn sum is off by 5", () => {
    expect(validateCard("4111111111111116")).toEqual({
      valid: false,
      error: "Invalid card number",
    });
  });

  it("should reject whitespace-only input as empty", () => {
    expect(validateCard("   ")).toEqual({
      valid: false,
      error: "Card number is required",
    });
  });

  it("should reject dash-only input as empty", () => {
    expect(validateCard("---")).toEqual({
      valid: false,
      error: "Card number is required",
    });
  });

  it("should accept card numbers with spaces", () => {
    expect(validateCard("4539 5787 6362 1486")).toEqual({
      valid: true,
      error: null,
    });
  });

  it("should accept card numbers with dashes", () => {
    expect(validateCard("4539-5787-6362-1486")).toEqual({
      valid: true,
      error: null,
    });
  });

  it("should strip leading and trailing whitespace", () => {
    expect(validateCard("  4539578763621486  ")).toEqual({
      valid: true,
      error: null,
    });
  });
});
