import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import axe from "axe-core";
import { App } from "./App.js";

const submitCardNumber = async (cardNumber: string) => {
  const screen = await render(<App />);
  await screen.getByLabelText(/card number/i).fill(cardNumber);
  await screen.getByRole("button", { name: /validate/i }).click();
  return screen;
};

test("submitting a valid Visa shows a success message naming Visa", async () => {
  const screen = await submitCardNumber("4111111111111111");
  await expect.element(screen.getByRole("status")).toHaveTextContent(/visa/i);
});

test("submitting a valid Mastercard shows a success message naming Mastercard", async () => {
  const screen = await submitCardNumber("5111111111111118");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent(/mastercard/i);
});

test("submitting a valid Amex shows a success message naming Amex", async () => {
  const screen = await submitCardNumber("341111111111111");
  await expect.element(screen.getByRole("status")).toHaveTextContent(/amex/i);
});

test("submitting empty input shows the required-input error verbatim", async () => {
  const screen = await submitCardNumber("");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Card number is required");
});

test("submitting an unknown provider number shows the unknown-provider error verbatim", async () => {
  const screen = await submitCardNumber("1234567890123456");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Unknown card provider");
});

test("submitting a wrong-length number shows the length error verbatim", async () => {
  const screen = await submitCardNumber("411111111111111");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Visa cards must be 16 digits");
});

test("submitting a Luhn-invalid number shows the invalid-card error verbatim", async () => {
  const screen = await submitCardNumber("4111111111111112");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Invalid card number");
});

test("non-digit characters never make it into the card number field", async () => {
  const screen = await render(<App />);
  const cardField = screen.getByLabelText(/card number/i);

  await cardField.fill("4a1b2");

  await expect.element(cardField).toHaveValue("412");
});

test("non-digit characters cleaned from a paste do not appear in the field", async () => {
  const screen = await render(<App />);
  const cardField = screen.getByLabelText(/card number/i);

  await cardField.fill("4111-1111-1111-1111");

  await expect.element(cardField).toHaveValue("4111111111111111");
});

test("the card number field caps input at 19 characters", async () => {
  const screen = await render(<App />);
  const cardField = screen.getByLabelText(/card number/i);

  await cardField.fill("12345678901234567890123");

  await expect.element(cardField).toHaveValue("1234567890123456789");
});

test("the card number field is empty before any input", async () => {
  const screen = await render(<App />);

  await expect.element(screen.getByLabelText(/card number/i)).toHaveValue("");
});

test("the result region is present and empty before any submission", async () => {
  const screen = await render(<App />);

  await expect.element(screen.getByRole("status")).toHaveTextContent("");
});

test("the input is not marked invalid before any submission", async () => {
  const screen = await render(<App />);

  await expect
    .element(screen.getByLabelText(/card number/i))
    .toHaveAttribute("aria-invalid", "false");
});

test("an error makes the input findable by its accessible description", async () => {
  const screen = await submitCardNumber("411111111111111");

  await expect
    .element(
      screen.getByRole("textbox", { description: "Visa cards must be 16 digits" }),
    )
    .toBeVisible();
});

test("an error marks the input aria-invalid", async () => {
  const screen = await submitCardNumber("411111111111111");

  await expect
    .element(screen.getByLabelText(/card number/i))
    .toHaveAttribute("aria-invalid", "true");
});

test("a successful validation clears aria-invalid on the input", async () => {
  const screen = await submitCardNumber("4111111111111111");

  await expect
    .element(screen.getByLabelText(/card number/i))
    .toHaveAttribute("aria-invalid", "false");
});

test("no logo is highlighted before any submission", async () => {
  const screen = await render(<App />);

  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Mastercard" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Amex" }))
    .not.toHaveClass("is-active");
});

test("a valid Visa highlights only the Visa logo", async () => {
  const screen = await submitCardNumber("4111111111111111");

  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Mastercard" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Amex" }))
    .not.toHaveClass("is-active");
});

test("a valid Mastercard highlights only the Mastercard logo", async () => {
  const screen = await submitCardNumber("5111111111111118");

  await expect
    .element(screen.getByRole("img", { name: "Mastercard" }))
    .toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Amex" }))
    .not.toHaveClass("is-active");
});

test("a valid Amex highlights only the Amex logo", async () => {
  const screen = await submitCardNumber("341111111111111");

  await expect
    .element(screen.getByRole("img", { name: "Amex" }))
    .toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Mastercard" }))
    .not.toHaveClass("is-active");
});

test("an invalid card leaves every logo unhighlighted", async () => {
  const screen = await submitCardNumber("4111111111111112");

  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Mastercard" }))
    .not.toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Amex" }))
    .not.toHaveClass("is-active");
});

test("the card visual shows the placeholder before any input", async () => {
  const screen = await render(<App />);

  await expect
    .element(screen.getByTestId("card-preview"))
    .toHaveTextContent("0000 0000 0000 0000");
});

test("the card visual mirrors what the user has typed live", async () => {
  const screen = await render(<App />);

  await screen.getByLabelText(/card number/i).fill("4111");
  await expect
    .element(screen.getByTestId("card-preview"))
    .toHaveTextContent("4111");
});

test("the card visual returns to the placeholder when the field is cleared", async () => {
  const screen = await render(<App />);
  const cardField = screen.getByLabelText(/card number/i);

  await cardField.fill("4111111111111111");
  await cardField.clear();

  await expect
    .element(screen.getByTestId("card-preview"))
    .toHaveTextContent("0000 0000 0000 0000");
});

test("the rendered form has no axe-core violations", async () => {
  const screen = await render(<App />);

  const { violations } = await axe.run(screen.container);

  expect(violations).toEqual([]);
});

test("clicking Validate does not make any network request", async () => {
  const fetchSpy = vi.spyOn(window, "fetch");
  const screen = await render(<App />);

  await screen.getByLabelText(/card number/i).fill("4111111111111111");
  await screen.getByRole("button", { name: /validate/i }).click();
  await expect.element(screen.getByRole("status")).toHaveTextContent(/visa/i);

  expect(fetchSpy).not.toHaveBeenCalled();
});

test("highlight moves to the new provider on a fresh valid submission", async () => {
  const screen = await render(<App />);
  const cardField = screen.getByLabelText(/card number/i);
  const validateButton = screen.getByRole("button", { name: /validate/i });

  await cardField.fill("4111111111111111");
  await validateButton.click();
  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .toHaveClass("is-active");

  await cardField.clear();
  await cardField.fill("5111111111111118");
  await validateButton.click();

  await expect
    .element(screen.getByRole("img", { name: "Mastercard" }))
    .toHaveClass("is-active");
  await expect
    .element(screen.getByRole("img", { name: "Visa" }))
    .not.toHaveClass("is-active");
});

test("a new submission replaces the previous result", async () => {
  const screen = await render(<App />);
  const cardField = screen.getByLabelText(/card number/i);
  const validateButton = screen.getByRole("button", { name: /validate/i });

  await cardField.fill("4111111111111112");
  await validateButton.click();
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Invalid card number");

  await cardField.clear();
  await cardField.fill("4111111111111111");
  await validateButton.click();

  await expect.element(screen.getByRole("status")).toHaveTextContent(/visa/i);
  await expect
    .element(screen.getByRole("status"))
    .not.toHaveTextContent("Invalid card number");
});
