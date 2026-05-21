import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { App } from "./App.js";

// A smoke test to confirm the test infrastructure is wired up — the page
// renders, you can find an element by its accessible name, and you can see
// it pass in the Vitest UI. Replace or extend with real behaviour-driven
// tests as you work through the acceptance criteria.
test("the form renders with a card-number input", async () => {
  const screen = await render(<App />);

  await expect.element(screen.getByLabelText(/card number/i)).toBeVisible();
});
