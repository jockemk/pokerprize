import { useMemo, useRef, useState } from "react";

import {
  calculatePayoutSchedule,
  PAYOUT_ERROR_MESSAGES,
  type PayoutCalculation,
  type PayoutInputs,
} from "./calculator";
import {
  planPayoutImageScale,
  renderPayoutScheduleImage,
  type PayoutImageContent,
} from "./payoutImage";

type FieldName = keyof PayoutInputs;
type InputValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;
type ImageAction = "copy" | "download";
type ImageActionState =
  | { phase: "idle" }
  | { phase: "rendering"; action: ImageAction }
  | { phase: "copied" | "downloaded" }
  | { phase: "error"; message: string };

const MAX_IMAGE_PAID_PLACES = 20;
const IMAGE_PLACE_LIMIT_MESSAGE =
  "Payout schedules with more than 20 paid places cannot be copied or downloaded as an image.";

const payoutImageFilename = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}`;
  return `pokerprize_${day}_${time}.png`;
};

const downloadPng = (blob: Blob, downloadedAt = new Date()) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = payoutImageFilename(downloadedAt);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

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

const formatNok = (value: number) =>
  `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(value)} kr`;

const payoutImageDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const payoutImageContent = (
  date: Date,
  totalPrizePool: number,
): PayoutImageContent => ({
  title: payoutImageDateFormatter.format(date),
  totalPrizePool: formatNok(totalPrizePool).replaceAll("\u00a0", " "),
});

const percentageFormatter = new Intl.NumberFormat("nb-NO", {
  style: "percent",
  maximumFractionDigits: 1,
});

const formatPayoutShare = (payout: number, totalPrizePool: number) => {
  const share = payout / totalPrizePool;
  if (share > 0 && share < 0.001) {
    return `<${percentageFormatter.format(0.001)}`;
  }
  return percentageFormatter.format(share);
};

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

const isCompleteValidEntry = (name: FieldName, raw: string) =>
  name === "payoutRatio"
    ? parsePayoutRatio(raw) !== null
    : parseWholeNok(raw) !== null;

const evaluatePayoutForm = (values: InputValues) => {
  const errors: FieldErrors = {};
  const totalPrizePool = parseWholeNok(values.totalPrizePool);
  const payoutRatio = parsePayoutRatio(values.payoutRatio);
  const minimumPayout = parseWholeNok(values.minimumPayout);
  const roundingIncrement = parseWholeNok(values.roundingIncrement);

  if (totalPrizePool === null) {
    errors.totalPrizePool = PAYOUT_ERROR_MESSAGES.positiveWholeNok;
  }
  if (payoutRatio === null) {
    errors.payoutRatio = PAYOUT_ERROR_MESSAGES.payoutRatio;
  }
  if (minimumPayout === null) {
    errors.minimumPayout = PAYOUT_ERROR_MESSAGES.positiveWholeNok;
  }
  if (roundingIncrement === null) {
    errors.roundingIncrement = PAYOUT_ERROR_MESSAGES.positiveWholeNok;
  }

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
  const [imageActionState, setImageActionState] = useState<ImageActionState>({
    phase: "idle",
  });
  const payoutImageRef = useRef<HTMLDivElement>(null);
  const imageActionAttemptRef = useRef(0);
  const evaluation = useMemo(() => evaluatePayoutForm(values), [values]);
  const imageActionsDisabled =
    imageActionState.phase === "rendering" ||
    (evaluation.result?.ok &&
      evaluation.result.paidPlaceCount > MAX_IMAGE_PAID_PLACES);

  const updateValue = (name: FieldName, value: string) => {
    imageActionAttemptRef.current += 1;
    setValues((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: false }));
    setImageActionState({ phase: "idle" });
  };

  const copyPayoutImage = () => {
    const element = payoutImageRef.current;
    if (!element || imageActionsDisabled) return;
    const imageActionAttempt = ++imageActionAttemptRef.current;
    const imageCreatedAt = new Date();
    const imageContent = payoutImageContent(
      imageCreatedAt,
      evaluation.result!.distributedTotal,
    );
    const isCurrentAttempt = () =>
      imageActionAttemptRef.current === imageActionAttempt;

    if (
      typeof ClipboardItem === "undefined" ||
      typeof navigator.clipboard?.write !== "function" ||
      (typeof ClipboardItem.supports === "function" &&
        !ClipboardItem.supports("image/png"))
    ) {
      setImageActionState({
        phase: "error",
        message: "The payout schedule image could not be copied.",
      });
      return;
    }

    const scale = planPayoutImageScale(element);
    if (scale === null) {
      setImageActionState({
        phase: "error",
        message: "This payout schedule is too long to copy as one image.",
      });
      return;
    }

    setImageActionState({ phase: "rendering", action: "copy" });
    const imageBlobPromise = renderPayoutScheduleImage(
      element,
      scale,
      imageContent,
    );

    const reportRenderFailure = () => {
      if (!isCurrentAttempt()) return;
      setImageActionState({
        phase: "error",
        message: "The payout schedule image could not be created.",
      });
    };

    try {
      const item = new ClipboardItem({ "image/png": imageBlobPromise });
      void navigator.clipboard.write([item]).then(
        () => {
          if (!isCurrentAttempt()) return;
          setImageActionState({ phase: "copied" });
          window.setTimeout(() => {
            if (isCurrentAttempt()) setImageActionState({ phase: "idle" });
          }, 1_600);
        },
        async () => {
          try {
            await imageBlobPromise;
          } catch {
            reportRenderFailure();
            return;
          }

          if (!isCurrentAttempt()) return;
          setImageActionState({
            phase: "error",
            message: "The payout schedule image could not be copied.",
          });
        },
      );
    } catch {
      void imageBlobPromise.catch(() => undefined);
      setImageActionState({
        phase: "error",
        message: "The payout schedule image could not be copied.",
      });
    }
  };

  const downloadPayoutImage = () => {
    const element = payoutImageRef.current;
    if (!element || imageActionsDisabled) return;
    const imageActionAttempt = ++imageActionAttemptRef.current;
    const imageCreatedAt = new Date();
    const imageContent = payoutImageContent(
      imageCreatedAt,
      evaluation.result!.distributedTotal,
    );
    const isCurrentAttempt = () =>
      imageActionAttemptRef.current === imageActionAttempt;

    const scale = planPayoutImageScale(element);
    if (scale === null) {
      setImageActionState({
        phase: "error",
        message: "This payout schedule is too long to download as one image.",
      });
      return;
    }

    setImageActionState({ phase: "rendering", action: "download" });
    void renderPayoutScheduleImage(element, scale, imageContent).then(
      (blob) => {
        if (!isCurrentAttempt()) return;
        try {
          downloadPng(blob, imageCreatedAt);
        } catch {
          setImageActionState({
            phase: "error",
            message: "The payout schedule image could not be downloaded.",
          });
          return;
        }
        setImageActionState({ phase: "downloaded" });
        window.setTimeout(() => {
          if (isCurrentAttempt()) setImageActionState({ phase: "idle" });
        }, 1_600);
      },
      () => {
        if (!isCurrentAttempt()) return;
        setImageActionState({
          phase: "error",
          message: "The payout schedule image could not be created.",
        });
      },
    );
  };

  return (
    <main>
      <header>
        <p className="eyebrow">Poker tournament</p>
        <h1>Payout calculator</h1>
        <p className="intro">
          Turn one total prize pool into a clean, exact payout schedule.
        </p>
      </header>

      <section aria-labelledby="inputs-title">
        <div className="section-heading">
          <h2 id="inputs-title">Payout settings</h2>
          <button
            type="button"
            onClick={() => {
              imageActionAttemptRef.current += 1;
              setValues(initialValues);
              setTouched({});
              setImageActionState({ phase: "idle" });
            }}
          >
            Reset
          </button>
        </div>
        {fields.map(({ name, label, inputMode }) => {
          const showError =
            Boolean(evaluation.errors[name]) &&
            (Boolean(touched[name]) ||
              isDefinitivelyInvalid(name, values[name]) ||
              isCompleteValidEntry(name, values[name]));
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
        <section className="results-card" aria-labelledby="results-title">
          <div className="payout-image" ref={payoutImageRef}>
            <div className="section-heading results-heading">
              <h2 id="results-title" data-payout-image-title>
                Payout schedule
              </h2>
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
                    <td className="payout-amount">{formatNok(payout)}</td>
                    <td className="payout-share">
                      {formatPayoutShare(
                        payout,
                        evaluation.result.distributedTotal,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="distribution-total" data-payout-image-footer>
              Distributed: {formatNok(evaluation.result.distributedTotal)} of{" "}
              {formatNok(Number(values.totalPrizePool))}
            </p>
            {evaluation.result.paidPlaceCountReducedByRounding && (
              <p className="result-note">
                Paid places were reduced to preserve the minimum payout and exact
                total.
              </p>
            )}
          </div>
          <div className="image-actions">
            <div className="image-action-buttons">
              <button
                type="button"
                disabled={imageActionsDisabled}
                onClick={copyPayoutImage}
              >
                {imageActionState.phase === "rendering" &&
                imageActionState.action === "copy"
                  ? "Copying…"
                  : imageActionState.phase === "copied"
                    ? "Copied!"
                    : "Copy image"}
              </button>
              <button
                type="button"
                disabled={imageActionsDisabled}
                onClick={downloadPayoutImage}
              >
                {imageActionState.phase === "rendering" &&
                imageActionState.action === "download"
                  ? "Downloading…"
                  : imageActionState.phase === "downloaded"
                    ? "Downloaded!"
                    : "Download image"}
              </button>
            </div>
            {evaluation.result.paidPlaceCount > MAX_IMAGE_PAID_PLACES && (
              <p className="image-action-message">
                {IMAGE_PLACE_LIMIT_MESSAGE}
              </p>
            )}
            {"message" in imageActionState && (
              <p className="image-action-message" role="status">
                {imageActionState.message}
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
