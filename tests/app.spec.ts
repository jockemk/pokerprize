import { expect, test } from "@playwright/test";

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
  await expect(rows.nth(2)).toContainText("#3");
  await expect(rows.nth(2)).toContainText("100 kr");
  await expect(page.getByText("3 paid places", { exact: true })).toBeVisible();
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
  await page.goto("/");
  await page.getByLabel("Payout ratio").fill("1");
  await page.getByLabel("Minimum payout").fill("151");
  await page.getByLabel("Total prize pool").fill("500");

  await expect(page.getByText("2 paid places", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Paid places were reduced to preserve the minimum payout and exact total.",
    ),
  ).toBeVisible();
});

test("the calculator remains contained on iPhone portrait and landscape", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Total prize pool")).toHaveAttribute(
    "inputmode",
    "numeric",
  );
  await expect(page.getByLabel("Payout ratio")).toHaveAttribute(
    "inputmode",
    "decimal",
  );

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
});
