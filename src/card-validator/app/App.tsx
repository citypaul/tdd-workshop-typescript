import {
  VisaIcon,
  MastercardIcon,
  AmexIcon,
} from "react-svg-credit-card-payment-icons";

export function App() {
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
                <VisaIcon format="flat" width={36} aria-hidden="true" />
                <MastercardIcon format="flat" width={36} aria-hidden="true" />
                <AmexIcon format="flat" width={36} aria-hidden="true" />
              </div>
            </div>

            <p
              aria-hidden="true"
              className="font-mono text-2xl tracking-widest text-stone-100"
            >
              0000 0000 0000 0000
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
          <form>
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
                  className="w-full h-12 px-4 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/40 transition-colors font-mono placeholder-stone-300 text-lg tracking-wider"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-stone-900 text-stone-50 font-medium tracking-wide rounded-lg hover:bg-stone-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all duration-200"
              >
                Validate
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
