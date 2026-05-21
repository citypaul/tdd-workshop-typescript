import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateCard } from "./validate-card.js";

const cardWithPrefix = (
  prefix: number,
  totalLength: number,
): fc.Arbitrary<string> => {
  const prefixStr = String(prefix);
  const fillerLength = totalLength - prefixStr.length;
  return fc
    .array(fc.integer({ min: 0, max: 9 }), {
      minLength: fillerLength,
      maxLength: fillerLength,
    })
    .map((filler) => prefixStr + filler.join(""));
};

describe("Mastercard range detection (property tests)", () => {
  describe("cards within Mastercard ranges should be detected as Mastercard", () => {
    it("any prefix from 51 to 55 (classic range)", () => {
      fc.assert(
        fc.property(
          fc
            .integer({ min: 51, max: 55 })
            .chain((prefix) => cardWithPrefix(prefix, 16)),
          (cardNumber) => {
            const result = validateCard(cardNumber);
            if (result.valid) {
              expect(result.provider).toBe("mastercard");
            } else {
              expect(result.error).toBe("Invalid card number");
            }
          },
        ),
      );
    });

    it("any prefix from 2221 to 2720 (2-series range)", () => {
      fc.assert(
        fc.property(
          fc
            .integer({ min: 2221, max: 2720 })
            .chain((prefix) => cardWithPrefix(prefix, 16)),
          (cardNumber) => {
            const result = validateCard(cardNumber);
            if (result.valid) {
              expect(result.provider).toBe("mastercard");
            } else {
              expect(result.error).toBe("Invalid card number");
            }
          },
        ),
      );
    });
  });

  describe("cards outside Mastercard ranges should not be detected as Mastercard", () => {
    it("any 2-digit prefix outside 51-55 (excluding 22-27 which overlap with 4-digit range)", () => {
      fc.assert(
        fc.property(
          fc
            .oneof(
              fc.integer({ min: 10, max: 21 }),
              fc.integer({ min: 28, max: 50 }),
              fc.integer({ min: 56, max: 99 }),
            )
            .chain((prefix) => cardWithPrefix(prefix, 16)),
          (cardNumber) => {
            expect(validateCard(cardNumber)).not.toMatchObject({
              provider: "mastercard",
            });
          },
        ),
      );
    });

    it("any 4-digit prefix outside 2221-2720 (excluding 5100-5599 which overlap with 2-digit range)", () => {
      fc.assert(
        fc.property(
          fc
            .oneof(
              fc.integer({ min: 1000, max: 2220 }),
              fc.integer({ min: 2721, max: 5099 }),
              fc.integer({ min: 5600, max: 9999 }),
            )
            .chain((prefix) => cardWithPrefix(prefix, 16)),
          (cardNumber) => {
            expect(validateCard(cardNumber)).not.toMatchObject({
              provider: "mastercard",
            });
          },
        ),
      );
    });
  });
});
