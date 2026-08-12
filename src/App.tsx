import { useMemo, useState } from "react";

import {
  calculatePayoutSchedule,
  type PayoutCalculation,
  type PayoutInputs,
} from "./calculator";

type FieldName = keyof PayoutInputs;
type InputValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialValues: InputValues = {
  totalPrizePool: "",
  payoutRatio: "1.87",
  minimumPayout: "200",
  roundingIncrement: "25",
};

const fields: Array<{
  name: FieldName;
  label: string;
  inputMode: "numeric" | "decimal";
}> = [
  { name: "totalPrizePool", label: "Total prize pool", inputMode: "numeric" },
  { name: "payoutRatio", label: "Payout ratio", inputMode: "decimal" },
  { name: "minimumPayout", label: "Minimum payout", inputMode: "numeric" },
  {
    name: "roundingIncrement",
    label: "Rounding increment",
    inputMode: "numeric",
  },
];

const wholeNokError = "Enter a positive whole NOK amount.";
const payoutRatioError =
  "Enter a payout ratio of 1.00 or more with up to two decimals.";

const formatNok = (value: number) =>
  `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(value)} kr`;

const parseWholeNok = (raw: string) => {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

const parsePayoutRatio = (raw: string) => {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw)) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value >= 1 ? value : null;
};

const isDefinitivelyInvalid = (name: FieldName, raw: string) => {
  if (raw === "") return false;
  if (name === "payoutRatio") {
    if (/^\d+[.,]$/.test(raw)) return false;
    return parsePayoutRatio(raw) === null;
  }
  return parseWholeNok(raw) === null;
};

const evaluate = (values: InputValues) => {
  const errors: FieldErrors = {};
  const totalPrizePool = parseWholeNok(values.totalPrizePool);
  const payoutRatio = parsePayoutRatio(values.payoutRatio);
  const minimumPayout = parseWholeNok(values.minimumPayout);
  const roundingIncrement = parseWholeNok(values.roundingIncrement);

  if (totalPrizePool === null) errors.totalPrizePool = wholeNokError;
  if (payoutRatio === null) errors.payoutRatio = payoutRatioError;
  if (minimumPayout === null) errors.minimumPayout = wholeNokError;
  if (roundingIncrement === null) errors.roundingIncrement = wholeNokError;

  if (Object.keys(errors).length > 0) {
    return { result: null, errors, formError: null };
  }

  const result: PayoutCalculation = calculatePayoutSchedule({
    totalPrizePool: totalPrizePool!,
    payoutRatio: payoutRatio!,
    minimumPayout: minimumPayout!,
    roundingIncrement: roundingIncrement!,
  });
  if (result.ok) return { result, errors, formError: null };
  if (result.field) errors[result.field] = result.message;
  return {
    result: null,
    errors,
    formError: result.field ? null : result.message,
  };
};

export function App() {
  const [values, setValues] = useState<InputValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const evaluation = useMemo(() => evaluate(values), [values]);

  const updateValue = (name: FieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  return (
    <main>
      <header>
        <p className="eyebrow">Poker tournament</p>
        <h1>Prize calculator</h1>
        <p className="intro">
          Turn one prize pool into a clean, exact payout schedule.
        </p>
      </header>

      <section aria-labelledby="inputs-title">
        <div className="section-heading">
          <h2 id="inputs-title">Payout settings</h2>
          <button
            type="button"
            onClick={() => {
              setValues(initialValues);
              setTouched({});
            }}
          >
            Reset
          </button>
        </div>
        {fields.map(({ name, label, inputMode }) => {
          const showError =
            Boolean(evaluation.errors[name]) &&
            (Boolean(touched[name]) || isDefinitivelyInvalid(name, values[name]));
          const errorId = `${name}-error`;
          return (
            <label key={name}>
              {label}
              <input
                aria-describedby={showError ? errorId : undefined}
                aria-invalid={showError || undefined}
                inputMode={inputMode}
                value={values[name]}
                onBlur={() =>
                  setTouched((current) => ({ ...current, [name]: true }))
                }
                onChange={(event) => updateValue(name, event.target.value)}
              />
              {showError && (
                <span className="field-error" id={errorId} role="alert">
                  {evaluation.errors[name]}
                </span>
              )}
            </label>
          );
        })}
        {evaluation.formError && (
          <p className="form-error" role="alert">
            {evaluation.formError}
          </p>
        )}
      </section>

      {values.totalPrizePool === "" && (
        <p className="guidance">
          Enter the total prize pool to build a payout schedule.
        </p>
      )}

      {evaluation.result?.ok && (
        <section aria-labelledby="results-title">
          <div className="section-heading results-heading">
            <h2 id="results-title">Payout schedule</h2>
            <p className="place-count">
              {evaluation.result.paidPlaceCount} paid{" "}
              {evaluation.result.paidPlaceCount === 1 ? "place" : "places"}
            </p>
          </div>
          <table>
            <tbody>
              {evaluation.result.payouts.map((payout, index) => (
                <tr key={index}>
                  <th scope="row">#{index + 1}</th>
                  <td>{formatNok(payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="distribution-total">
            Distributed: {formatNok(evaluation.result.distributedTotal)} of{" "}
            {formatNok(Number(values.totalPrizePool))}
          </p>
          {evaluation.result.paidPlaceCountReducedByRounding && (
            <p className="result-note">
              Paid places were reduced to preserve the minimum payout and exact
              total.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
