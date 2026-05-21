import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import {
  VisaIcon,
  MastercardIcon,
  AmexIcon,
} from "react-svg-credit-card-payment-icons";
import { validateCard } from "../validate-card.js";

const providerLabel: Record<"visa" | "mastercard" | "amex", string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
};

type Provider = "visa" | "mastercard" | "amex";

const MAX_CARD_LENGTH = 19;

export function App() {
  const resultRegionId = useId();
  const [cardNumber, setCardNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);

  const handleCardNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setCardNumber(digitsOnly.slice(0, MAX_CARD_LENGTH));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateCard(cardNumber);
    if (result.valid) {
      setMessage(`${providerLabel[result.provider]} card accepted`);
      setActiveProvider(result.provider);
      setHasError(false);
      return;
    }
    setMessage(result.error);
    setActiveProvider(null);
    setHasError(true);
  };

  const logoClass = (provider: Provider) =>
    activeProvider === provider ? "is-active" : undefined;

  return (
    <main className="bg-stone-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="relative mx-auto w-full max-w-sm h-56 rounded-xl bg-stone-900 p-6 text-stone-50 shadow-md z-20 mb-[-6rem]">
          <div className="flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div
                aria-hidden="true"
                className="h-10 w-14 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 border border-yellow-500 opacity-90 relative overflow-hidden"
              >
                <div className="absolute w-full h-px bg-yellow-600 top-3" />
                <div className="absolute w-full h-px bg-yellow-600 bottom-3" />
                <div className="absolute h-full w-px bg-yellow-600 left-4" />
                <div className="absolute h-full w-px bg-yellow-600 right-4" />
              </div>
              <div className="flex items-center gap-3">
                <span
                  role="img"
                  aria-label="Visa"
                  className={logoClass("visa")}
                >
                  <VisaIcon format="flat" width={36} aria-hidden="true" />
                </span>
                <span
                  role="img"
                  aria-label="Mastercard"
                  className={logoClass("mastercard")}
                >
                  <MastercardIcon format="flat" width={36} aria-hidden="true" />
                </span>
                <span
                  role="img"
                  aria-label="Amex"
                  className={logoClass("amex")}
                >
                  <AmexIcon format="flat" width={36} aria-hidden="true" />
                </span>
              </div>
            </div>

            <p
              data-testid="card-preview"
              aria-hidden="true"
              className="font-mono text-2xl tracking-widest text-stone-100"
            >
              {cardNumber === "" ? "0000 0000 0000 0000" : cardNumber}
            </p>

            <div aria-hidden="true" className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Card Validator
                </p>
                <p className="text-sm font-medium tracking-wide uppercase">
                  TDD Workshop
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm pt-28 pb-8 px-8 border border-stone-200">
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="card-number"
                  className="text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-[0.2em]"
                >
                  Card Number
                </label>
                <input
                  id="card-number"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  aria-invalid={hasError}
                  aria-describedby={resultRegionId}
                  className="w-full h-12 px-4 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/40 transition-colors font-mono placeholder-stone-300 text-lg tracking-wider"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-stone-900 text-stone-50 font-medium tracking-wide rounded-lg hover:bg-stone-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all duration-200"
              >
                Validate
              </button>

              <p
                id={resultRegionId}
                role="status"
                aria-live="polite"
                className="text-sm min-h-5"
              >
                {message}
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
