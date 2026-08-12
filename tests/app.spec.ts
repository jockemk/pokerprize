import {
  expect,
  test,
  type Download,
  type Locator,
  type Page,
} from "@playwright/test";

type ClipboardBehavior =
  | "success"
  | "slow-success"
  | "unavailable"
  | "denied"
  | "failed"
  | "sync-failed";

async function installImageClipboard(
  page: Page,
  behavior: ClipboardBehavior = "success",
) {
  await page.addInitScript((clipboardBehavior) => {
    class TestClipboardItem {
      readonly types: string[];
      private readonly items: Record<string, Blob | Promise<Blob>>;

      constructor(items: Record<string, Blob | Promise<Blob>>) {
        this.items = items;
        this.types = Object.keys(items);
      }

      async getType(type: string) {
        return this.items[type];
      }
    }

    Object.defineProperty(window, "ClipboardItem", {
      configurable: true,
      value: TestClipboardItem,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value:
        clipboardBehavior === "unavailable"
          ? undefined
          : {
              write: ([item]: ClipboardItem[]) => {
                if (clipboardBehavior === "sync-failed") {
                  throw new DOMException("Clipboard write failed.", "DataError");
                }
                return (async () => {
                  const blob = await item.getType("image/png");
                  Object.defineProperty(window, "__intendedPayoutImage", {
                    configurable: true,
                    value: blob,
                  });
                  if (clipboardBehavior === "denied") {
                    throw new DOMException(
                      "Clipboard permission was denied.",
                      "NotAllowedError",
                    );
                  }
                  if (clipboardBehavior === "failed") {
                    throw new DOMException(
                      "Clipboard write failed.",
                      "DataError",
                    );
                  }
                  await new Promise((resolve) =>
                    setTimeout(
                      resolve,
                      clipboardBehavior === "slow-success" ? 1_000 : 100,
                    ),
                  );
                  Object.defineProperty(window, "__copiedPayoutImage", {
                    configurable: true,
                    value: blob,
                  });
                })();
              },
            },
    });
  }, behavior);
}

type ContentBounds = { x: number; y: number; width: number; height: number };

async function inspectCopiedImage(
  page: Page,
  content?: { result: ContentBounds; bounds: ContentBounds[] },
) {
  return page.evaluate(async (contentInspection) => {
    const blob = (window as Window & { __copiedPayoutImage?: Blob })
      .__copiedPayoutImage;
    if (!blob) return null;

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const alpha = context.getImageData(0, 0, 1, 1).data[3];
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const countLightPixels = (startY: number, endY: number) => {
      let count = 0;
      for (let y = startY; y < endY; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const offset = (y * canvas.width + x) * 4;
          if (
            pixels[offset] > 140 &&
            pixels[offset + 1] > 140 &&
            pixels[offset + 2] > 110 &&
            pixels[offset + 3] === 255
          ) {
            count += 1;
          }
        }
      }
      return count;
    };
    const bandHeight = Math.min(180, Math.floor(canvas.height / 3));
    const contentPixelCounts = contentInspection
      ? (() => {
          const scale = Math.round(canvas.width / contentInspection.result.width);
          const sourceInset =
            (contentInspection.result.width - canvas.width / scale) / 2;
          const sourceX = contentInspection.result.x + sourceInset;
          const sourceY = contentInspection.result.y + sourceInset;

          return contentInspection.bounds.map((bounds) => {
            const startX = Math.max(
              0,
              Math.floor((bounds.x - sourceX) * scale),
            );
            const endX = Math.min(
              canvas.width,
              Math.ceil((bounds.x + bounds.width - sourceX) * scale),
            );
            const startY = Math.max(
              0,
              Math.floor((bounds.y - sourceY) * scale),
            );
            const endY = Math.min(
              canvas.height,
              Math.ceil((bounds.y + bounds.height - sourceY) * scale),
            );
            let lightPixels = 0;

            for (let y = startY; y < endY; y += 1) {
              for (let x = startX; x < endX; x += 1) {
                const offset = (y * canvas.width + x) * 4;
                if (
                  pixels[offset] > 140 &&
                  pixels[offset + 1] > 140 &&
                  pixels[offset + 2] > 80 &&
                  pixels[offset + 3] === 255
                ) {
                  lightPixels += 1;
                }
              }
            }
            return lightPixels;
          });
        })()
      : null;
    bitmap.close();

    return {
      type: blob.type,
      width: canvas.width,
      height: canvas.height,
      alpha,
      lightPixels: {
        top: countLightPixels(0, bandHeight),
        middle: countLightPixels(
          Math.floor(canvas.height / 2 - bandHeight / 2),
          Math.floor(canvas.height / 2 + bandHeight / 2),
        ),
        bottom: countLightPixels(canvas.height - bandHeight, canvas.height),
        footer: countLightPixels(Math.max(0, canvas.height - 80), canvas.height),
      },
      contentPixelCounts,
    };
  }, content ?? null);
}

async function visibleBounds(locators: Locator[]) {
  return Promise.all(
    locators.map(async (locator) => {
      const bounds = await locator.boundingBox();
      if (!bounds) throw new Error("Expected visible payout schedule content.");
      return bounds;
    }),
  );
}

async function downloadBytes(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function enterEqualPayoutSchedule(page: Page, totalPrizePool: string) {
  await page.getByLabel("Payout ratio").fill("1");
  await page.getByLabel("Minimum payout").fill("25");
  await page.getByLabel("Rounding increment").fill("25");
  await page.getByLabel("Total prize pool").fill(totalPrizePool);
}

test("organizer can copy the complete payout schedule as a PNG", async ({
  page,
}) => {
  await installImageClipboard(page);
  await page.goto("/");
  await enterEqualPayoutSchedule(page, "1250");

  const result = page.getByRole("region", { name: "Payout schedule" });
  const copy = result.getByRole("button");
  const rows = page.getByRole("row");
  await expect(rows).toHaveCount(50);
  await expect(copy).toHaveText("Copy image");
  await expect(rows.last()).not.toBeInViewport();

  const resultBounds = await result.boundingBox();
  const copyBounds = await copy.boundingBox();
  const distribution = page.getByText(
    "Distributed: 1 250 kr of 1 250 kr",
    { exact: true },
  );
  const contentBounds = await visibleBounds([
    page.getByRole("heading", { name: "Payout schedule" }),
    page.getByText("50 paid places", { exact: true }),
    ...(await page.getByRole("rowheader").all()),
    ...(await page.getByRole("cell").all()),
  ]);
  const distributionBounds = await distribution.boundingBox();
  await copy.click();

  await expect(copy).toBeDisabled();
  await expect(copy).toHaveText("Copying…");
  await expect(copy).toHaveText("Copied!");

  const image = await inspectCopiedImage(page, {
    result: resultBounds!,
    bounds: contentBounds,
  });
  expect(image).not.toBeNull();
  expect(image!.type).toBe("image/png");
  expect(image!.width).toBeGreaterThanOrEqual(
    Math.round(resultBounds!.width * 2) - 4,
  );
  expect(image!.height).toBeLessThan(Math.round(resultBounds!.height * 2));
  expect(image!.height).toBeGreaterThan(4_000);
  expect(image!.alpha).toBe(255);
  expect(image!.lightPixels.top).toBeGreaterThan(50);
  expect(image!.lightPixels.middle).toBeGreaterThan(50);
  expect(image!.lightPixels.bottom).toBeGreaterThan(50);
  expect(image!.lightPixels.footer).toBeGreaterThan(50);
  expect(image!.height / 2).toBeGreaterThan(
    distributionBounds!.y + distributionBounds!.height - resultBounds!.y,
  );
  expect(image!.height / 2).toBeLessThan(copyBounds!.y - resultBounds!.y);

  const contentPixelCounts = image!.contentPixelCounts!;
  expect(contentPixelCounts).toHaveLength(152);
  expect(
    contentPixelCounts
      .map((count, index) => ({ count, index }))
      .filter(({ count }) => count <= 5),
  ).toEqual([]);

  await expect(page.getByLabel("Total prize pool")).toHaveValue("1250");
  await expect(rows).toHaveCount(50);
  await expect(copy).toHaveText("Copy image", { timeout: 3_000 });
});

test("late copy completion does not show feedback for a newer payout schedule", async ({
  page,
}) => {
  await installImageClipboard(page, "slow-success");
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");

  const copy = page
    .getByRole("region", { name: "Payout schedule" })
    .getByRole("button");
  await copy.click();
  await expect(copy).toHaveText("Copying…");
  await page.getByLabel("Total prize pool").fill("225");

  await expect(copy).toHaveText("Copy image");
  await page.waitForFunction(() => "__copiedPayoutImage" in window);
  await page.waitForTimeout(50);
  await expect(copy).toHaveText("Copy image");
  await expect(page.getByText("Copied!", { exact: true })).toBeHidden();
});

test("organizer receives a PNG download when image clipboard access is unavailable", async ({
  page,
}) => {
  await installImageClipboard(page, "unavailable");
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Copy image" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("payout-schedule.png");
  const downloadedPng = await downloadBytes(download);
  expect(downloadedPng.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  await expect(
    page.getByText(
      "Clipboard access is unavailable, so the PNG was downloaded instead.",
    ),
  ).toBeVisible();

  await page.getByLabel("Total prize pool").fill("225");
  await expect(
    page.getByText(
      "Clipboard access is unavailable, so the PNG was downloaded instead.",
    ),
  ).toBeHidden();
  const retryDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Copy image" }).click();
  await retryDownloadPromise;
});

test("organizer receives a PNG download when clipboard permission is denied", async ({
  page,
}) => {
  await installImageClipboard(page, "denied");
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Copy image" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("payout-schedule.png");
  const downloadedPng = await downloadBytes(download);
  const intendedPng = await page.evaluate(async () =>
    Array.from(
      new Uint8Array(
        await (
          window as Window & { __intendedPayoutImage: Blob }
        ).__intendedPayoutImage.arrayBuffer(),
      ),
    ),
  );
  expect(downloadedPng).toEqual(Buffer.from(intendedPng));
  await expect(
    page.getByText(
      "Clipboard access is unavailable, so the PNG was downloaded instead.",
    ),
  ).toBeVisible();
});

test("organizer sees a retryable error after an unexpected clipboard failure", async ({
  page,
}) => {
  await installImageClipboard(page, "failed");
  let downloadCount = 0;
  page.on("download", () => downloadCount++);
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");

  const copy = page.getByRole("button", { name: "Copy image" });
  await copy.click();

  await expect(
    page.getByText("The payout schedule image could not be copied."),
  ).toBeVisible();
  await expect(copy).toBeEnabled();
  expect(downloadCount).toBe(0);

  await page.getByLabel("Total prize pool").fill("225");
  await expect(
    page.getByText("The payout schedule image could not be copied."),
  ).toBeHidden();
});

test("a synchronous clipboard failure is not misreported as a download fallback", async ({
  page,
}) => {
  await installImageClipboard(page, "sync-failed");
  let downloadCount = 0;
  page.on("download", () => downloadCount++);
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");

  await page.getByRole("button", { name: "Copy image" }).click();

  await expect(
    page.getByText("The payout schedule image could not be copied."),
  ).toBeVisible();
  expect(downloadCount).toBe(0);
});

test("organizer sees a rendering error without a download", async ({ page }) => {
  await installImageClipboard(page);
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(window, "__restoreCanvas", {
      configurable: true,
      value: () => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
      },
    });
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  let downloadCount = 0;
  page.on("download", () => downloadCount++);
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");

  await page.getByRole("button", { name: "Copy image" }).click();

  await expect(
    page.getByText("The payout schedule image could not be created."),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  expect(downloadCount).toBe(0);

  await page.evaluate(() =>
    (window as Window & { __restoreCanvas: () => void }).__restoreCanvas(),
  );
  await page.getByRole("button", { name: "Copy image" }).click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
});

test("a moderately long payout schedule is copied at 1x density", async ({
  page,
}) => {
  await installImageClipboard(page);
  await page.goto("/");
  await enterEqualPayoutSchedule(page, "2500");

  const result = page.getByRole("region", { name: "Payout schedule" });
  const resultBounds = await result.boundingBox();
  await result.getByRole("button", { name: "Copy image" }).click();
  await expect(result.getByRole("button")).toHaveText("Copied!");

  const image = await inspectCopiedImage(page);
  expect(image).not.toBeNull();
  expect(image!.width).toBeGreaterThanOrEqual(Math.round(resultBounds!.width) - 2);
  expect(image!.width).toBeLessThanOrEqual(Math.round(resultBounds!.width));
  expect(image!.height).toBeGreaterThan(4_000);
  expect(image!.height).toBeLessThanOrEqual(8_192);
});

test("a payout schedule unsafe at 1x is refused without creating an image", async ({
  page,
}) => {
  await installImageClipboard(page);
  let downloadCount = 0;
  page.on("download", () => downloadCount++);
  await page.goto("/");
  await enterEqualPayoutSchedule(page, "5000");

  const rows = page.getByRole("row");
  await expect(rows).toHaveCount(200);
  await page.getByRole("button", { name: "Copy image" }).click();

  await expect(
    page.getByText("This payout schedule is too long to copy as one image."),
  ).toBeVisible();
  await expect(rows).toHaveCount(200);
  expect(await inspectCopiedImage(page)).toBeNull();
  expect(downloadCount).toBe(0);

  await page.getByLabel("Total prize pool").fill("200");
  await expect(
    page.getByText("This payout schedule is too long to copy as one image."),
  ).toBeHidden();
  await page.getByRole("button", { name: "Copy image" }).click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
});

test("organizer can calculate a one-place payout schedule", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Payout ratio")).toHaveValue("1.87");
  await expect(page.getByLabel("Minimum payout")).toHaveValue("200");
  await expect(page.getByLabel("Rounding increment")).toHaveValue("25");

  await page.getByLabel("Total prize pool").fill("200");

  await expect(page.getByText("#1", { exact: true })).toBeVisible();
  await expect(page.getByText("200 kr", { exact: true })).toBeVisible();
  await expect(page.getByText("1 paid place", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Distributed: 200 kr of 200 kr", { exact: true }),
  ).toBeVisible();
});

test("organizer can calculate a clean multi-place payout schedule", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Payout ratio").fill("2");
  await page.getByLabel("Minimum payout").fill("100");
  await page.getByLabel("Rounding increment").fill("100");
  await page.getByLabel("Total prize pool").fill("700");

  const rows = page.getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("#1");
  await expect(rows.nth(0)).toContainText("400 kr");
  await expect(rows.nth(0)).toContainText("57,1 %");
  await expect(rows.nth(1)).toContainText("28,6 %");
  await expect(rows.nth(2)).toContainText("#3");
  await expect(rows.nth(2)).toContainText("100 kr");
  await expect(rows.nth(2)).toContainText("14,3 %");
  await expect(page.getByText("3 paid places", { exact: true })).toBeVisible();
});

test("one-place and tiny payout shares remain truthful", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("200");
  await expect(page.getByRole("row")).toContainText("100 %");

  await page.getByLabel("Payout ratio").fill("10");
  await page.getByLabel("Minimum payout").fill("25");
  await page.getByLabel("Total prize pool").fill("1000000");

  const rows = page.getByRole("row");
  await expect(rows.last()).toContainText("<0,1 %");
});

test("organizer can enter the payout ratio with a comma", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Payout ratio").fill("1,5");
  await page.getByLabel("Minimum payout").fill("100");
  await page.getByLabel("Total prize pool").fill("500");

  await expect(page.getByText("3 paid places", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").nth(0)).toContainText("250 kr");
});

test("validation waits for a partial ratio edit and hides a stale result", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Total prize pool").fill("1000");
  await expect(page.getByRole("table")).toBeVisible();

  const ratio = page.getByLabel("Payout ratio");
  await ratio.fill("1,");
  await expect(
    page.getByText("Enter a payout ratio of 1.00 or more with up to two decimals."),
  ).toBeHidden();
  await expect(page.getByRole("table")).toBeHidden();

  await ratio.blur();
  await expect(
    page.getByText("Enter a payout ratio of 1.00 or more with up to two decimals."),
  ).toBeVisible();

  await ratio.fill("1.87");
  await page.getByLabel("Total prize pool").fill("1010");
  await expect(
    page.getByText("The total prize pool must be divisible by the rounding increment."),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});

test("partial ratio validation is deferred again after returning to the field", async ({
  page,
}) => {
  await page.goto("/");
  const ratio = page.getByLabel("Payout ratio");
  await ratio.focus();
  await ratio.blur();
  await ratio.fill("1,");

  await expect(
    page.getByText("Enter a payout ratio of 1.00 or more with up to two decimals."),
  ).toBeHidden();
  await ratio.blur();
  await expect(
    page.getByText("Enter a payout ratio of 1.00 or more with up to two decimals."),
  ).toBeVisible();
});

test("organizer receives actionable guidance above the schedule limit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Payout ratio").fill("1");
  await page.getByLabel("Minimum payout").fill("1");
  await page.getByLabel("Rounding increment").fill("1");
  await page.getByLabel("Total prize pool").fill("1001");

  await expect(
    page.getByText(
      "This schedule exceeds the 1,000-place limit. Increase the minimum payout or payout ratio.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});

test("initial guidance and reset return the calculator to its defaults", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Enter the total prize pool to build a payout schedule."),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Copy image" }),
  ).toBeHidden();

  await page.getByLabel("Payout ratio").fill("2");
  await page.getByLabel("Minimum payout").fill("100");
  await page.getByLabel("Rounding increment").fill("100");
  await page.getByLabel("Total prize pool").fill("700");
  await expect(page.getByRole("table")).toBeVisible();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Total prize pool")).toHaveValue("");
  await expect(page.getByLabel("Payout ratio")).toHaveValue("1.87");
  await expect(page.getByLabel("Minimum payout")).toHaveValue("200");
  await expect(page.getByLabel("Rounding increment")).toHaveValue("25");
  await expect(
    page.getByText("Enter the total prize pool to build a payout schedule."),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});

test("organizer is told when rounding reduces the paid-place count", async ({
  page,
}) => {
  await installImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("Payout ratio").fill("1");
  await page.getByLabel("Minimum payout").fill("151");
  await page.getByLabel("Total prize pool").fill("500");

  await expect(page.getByText("2 paid places", { exact: true })).toBeVisible();
  const reductionNote = page.getByText(
    "Paid places were reduced to preserve the minimum payout and exact total.",
  );
  await expect(reductionNote).toBeVisible();

  const result = page.getByRole("region", { name: "Payout schedule" });
  const resultBounds = await result.boundingBox();
  const noteBounds = await reductionNote.boundingBox();
  await result.getByRole("button", { name: "Copy image" }).click();
  await expect(result.getByRole("button")).toHaveText("Copied!");

  const image = await inspectCopiedImage(page, {
    result: resultBounds!,
    bounds: [noteBounds!],
  });
  expect(image!.height).toBeGreaterThan(
    Math.floor((noteBounds!.y + noteBounds!.height - resultBounds!.y) * 2),
  );
  const [noteLightPixels] = image!.contentPixelCounts!;
  expect(noteLightPixels).toBeGreaterThan(5);
});

test("the calculator remains contained on iPhone portrait and landscape", async ({
  page,
}) => {
  await installImageClipboard(page, "failed");
  await page.goto("/");
  await expect(page.getByLabel("Total prize pool")).toHaveAttribute(
    "inputmode",
    "numeric",
  );
  await expect(page.getByLabel("Payout ratio")).toHaveAttribute(
    "inputmode",
    "decimal",
  );
  await page.getByLabel("Total prize pool").fill("1000000");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(0);
  await page.getByRole("button", { name: "Copy image" }).click();
  await expect(
    page.getByText("The payout schedule image could not be copied."),
  ).toBeVisible();

  const portraitMetrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
    mainWidth: document.querySelector("main")?.getBoundingClientRect().width,
  }));
  expect(portraitMetrics.contentWidth).toBeLessThanOrEqual(
    portraitMetrics.viewportWidth,
  );
  expect(portraitMetrics.mainWidth).toBeLessThanOrEqual(430);

  await page.setViewportSize({ width: 844, height: 390 });
  const landscapeMetrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
    mainWidth: document.querySelector("main")?.getBoundingClientRect().width,
  }));
  expect(landscapeMetrics.contentWidth).toBeLessThanOrEqual(
    landscapeMetrics.viewportWidth,
  );
  expect(landscapeMetrics.mainWidth).toBeLessThanOrEqual(430);
  await expect(
    page.getByRole("heading", { name: "Payout calculator" }),
  ).toBeVisible();
  await expect(
    page.getByText("The payout schedule image could not be copied."),
  ).toBeVisible();
});
