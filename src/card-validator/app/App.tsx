import {
  VisaIcon,
  MastercardIcon,
  AmexIcon,
} from "react-svg-credit-card-payment-icons";

export function App() {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="relative mx-auto w-full max-w-sm h-56 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-2xl z-20 mb-[-6rem]">
          <div className="flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div className="h-10 w-14 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 border border-yellow-500 opacity-90 relative overflow-hidden">
                <div className="absolute w-full h-px bg-yellow-600 top-3" />
                <div className="absolute w-full h-px bg-yellow-600 bottom-3" />
                <div className="absolute h-full w-px bg-yellow-600 left-4" />
                <div className="absolute h-full w-px bg-yellow-600 right-4" />
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <VisaIcon format="mono" width={40} />
                <MastercardIcon format="mono" width={40} />
                <AmexIcon format="mono" width={40} />
              </div>
            </div>

            <p className="font-mono text-2xl tracking-widest drop-shadow-md mt-4">
              0000 0000 0000 0000
            </p>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-70">
                  Card Validator
                </p>
                <p className="font-medium tracking-wide uppercase drop-shadow-sm">
                  TDD Workshop
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl pt-28 pb-8 px-8 border border-slate-100">
          <form>
            <div className="space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="card-number"
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  Card Number
                </label>
                <input
                  id="card-number"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  className="w-full h-12 px-4 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all font-mono placeholder-slate-300 text-lg tracking-wider"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                Validate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
