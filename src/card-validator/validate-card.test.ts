import { describe, it, expect } from "vitest";
import { validateCard } from "./validate-card.js";

describe("Card Validator", () => {
  it("should reject empty card numbers", () => {
    expect(validateCard("")).toEqual({
      valid: false,
      error: "Card number is required",
    });
  });

  it("should identify a valid Visa card", () => {
    expect(validateCard("4111111111111111")).toMatchObject({
      valid: true,
      provider: "visa",
    });
  });

  it("should identify a valid Amex card starting with 34", () => {
    expect(validateCard("341111111111111")).toMatchObject({
      valid: true,
      provider: "amex",
    });
  });

  it("should identify a valid Amex card starting with 37", () => {
    expect(validateCard("378282246310005")).toMatchObject({
      valid: true,
      provider: "amex",
    });
  });

  it("should identify a valid Mastercard", () => {
    expect(validateCard("5111111111111118")).toMatchObject({
      valid: true,
      provider: "mastercard",
    });
  });

  it("should identify a valid Mastercard in the 2221-2720 range", () => {
    expect(validateCard("2223003122003222")).toMatchObject({
      valid: true,
      provider: "mastercard",
    });
  });

  it.each([
    { example: "number that exercises subtract 9", number: "4539578763621486" },
    { example: "all-ones Visa-shaped number", number: "4111111111111111" },
    { example: "Mastercard-shaped number", number: "5111111111111118" },
    { example: "15-digit Amex-shaped number", number: "341111111111111" },
  ])("should accept known-valid card number: $example", ({ number }) => {
    expect(validateCard(number)).toMatchObject({
      valid: true,
      error: null,
    });
  });

  it("should reject Visa cards that are not 16 digits", () => {
    expect(validateCard("41111111111111")).toEqual({
      valid: false,
      error: "Visa cards must be 16 digits",
    });
  });

  it("should reject Amex cards that are not 15 digits", () => {
    expect(validateCard("3411111111111111")).toEqual({
      valid: false,
      error: "Amex cards must be 15 digits",
    });
  });

  it("should reject Mastercard cards that are not 16 digits", () => {
    expect(validateCard("511111111111111")).toEqual({
      valid: false,
      error: "Mastercard cards must be 16 digits",
    });
  });

  it.each([
    { prefix: "2220", number: "2220000000000000" },
    { prefix: "2721", number: "2721000000000000" },
    { prefix: "50", number: "5000000000000000" },
    { prefix: "56", number: "5600000000000000" },
  ])("should not detect prefix $prefix as Mastercard", ({ number }) => {
    expect(validateCard(number)).toEqual({
      valid: false,
      error: "Unknown card provider",
    });
  });

  it.each([
    { prefix: "2221", number: "2221000000000009" },
    { prefix: "2720", number: "2720000000000005" },
    { prefix: "51", number: "5111111111111118" },
    { prefix: "55", number: "5500000000000004" },
  ])("should detect prefix $prefix as Mastercard", ({ number }) => {
    expect(validateCard(number)).toMatchObject({
      valid: true,
      provider: "mastercard",
    });
  });

  it("should reject cards from unknown providers", () => {
    expect(validateCard("6011111111111117")).toEqual({
      valid: false,
      error: "Unknown card provider",
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
    expect(validateCard("4539 5787 6362 1486")).toMatchObject({
      valid: true,
      error: null,
    });
  });

  it("should accept card numbers with dashes", () => {
    expect(validateCard("4539-5787-6362-1486")).toMatchObject({
      valid: true,
      error: null,
    });
  });

  it("should strip leading and trailing whitespace", () => {
    expect(validateCard("  4539578763621486  ")).toMatchObject({
      valid: true,
      error: null,
    });
  });
});
