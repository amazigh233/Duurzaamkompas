import { expect, test, type Page } from "@playwright/test";

const consentState = (analytics: boolean, marketing: boolean) => ({
  version: "2026-07-06",
  necessary: true,
  analytics,
  marketing,
  updatedAt: new Date().toISOString(),
});

async function installConsent(page: Page, analytics: boolean, marketing: boolean) {
  await page.addInitScript(
    (state) => localStorage.setItem("dwk_cookie_consent", JSON.stringify(state)),
    consentState(analytics, marketing)
  );
}

async function dataLayerEvents(page: Page, eventName: string) {
  return page.evaluate(
    (name) =>
      ((window as Window & { dataLayer?: Array<Record<string, unknown> | unknown[]> }).dataLayer ?? []).filter(
        (item) => !Array.isArray(item) && item.event === name
      ),
    eventName
  );
}

async function completeWoningcheck(page: Page) {
  await page.getByRole("button", { name: "Tussenwoning", exact: true }).click();
  await page.getByRole("button", { name: "1992 - 2005", exact: true }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Terug" }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Ja", exact: true }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Lagere energierekening", exact: true }).click();
  await page.getByRole("button", { name: "Lagere maandlasten", exact: true }).click();
  await page.getByRole("button", { name: "Binnen 3 maanden", exact: true }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel("Postcode").fill("1234 AB");
  await page.getByLabel("Huisnummer").fill("12");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel("Naam").fill("Tracking Testpersoon");
  await page.getByLabel("E-mailadres").fill("tracking@example.test");
  await page.getByLabel("Telefoon optioneel").fill("0612345678");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel(/persoonlijke woningadvies ontvangen/).check();
}

test("GTM validates its ID, tolerates absence, and initializes only once", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.goto("/");

  const result = await page.evaluate(async () => {
    document.getElementById("dwk-google-tag-manager")?.remove();
    const module = await import("/src/lib/googleTagManager.ts");
    const absent = module.initializeGoogleTagManager("");
    const invalid = module.initializeGoogleTagManager("G-INVALID");
    const present = module.initializeGoogleTagManager("GTM-TEST123");
    const duplicate = module.initializeGoogleTagManager("GTM-TEST123");
    return {
      absent,
      invalid,
      present,
      duplicate,
      scripts: document.querySelectorAll("#dwk-google-tag-manager").length,
      source: document.querySelector<HTMLScriptElement>("#dwk-google-tag-manager")?.src,
    };
  });

  expect(result).toEqual({
    absent: false,
    invalid: false,
    present: true,
    duplicate: true,
    scripts: 1,
    source: "https://www.googletagmanager.com/gtm.js?id=GTM-TEST123",
  });
});

test("Consent Mode defaults to denied and restores versioned consent", async ({ page }) => {
  await page.goto("/");
  const defaultCommand = await page.evaluate(() =>
    (window as Window & { dataLayer: ArrayLike<unknown>[] }).dataLayer
      .map((item) => Array.from(item))
      .find((item) => item[0] === "consent" && item[1] === "default")
  );
  expect(defaultCommand).toEqual([
    "consent",
    "default",
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500,
    },
  ]);

  await page.evaluate((state) => localStorage.setItem("dwk_cookie_consent", JSON.stringify(state)), consentState(true, true));
  await page.reload();
  const updateCommand = await page.evaluate(() =>
    (window as Window & { dataLayer: ArrayLike<unknown>[] }).dataLayer
      .map((item) => Array.from(item))
      .find((item) => item[0] === "consent" && item[1] === "update")
  );
  expect(updateCommand).toEqual([
    "consent",
    "update",
    {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    },
  ]);
});

test("cookie preferences separately update analytics and marketing consent", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voorkeuren instellen" }).click();
  await page.getByLabel(/Analytisch:/).check();
  await page.getByRole("button", { name: "Voorkeuren opslaan" }).click();

  const analyticsOnly = await page.evaluate(() => JSON.parse(localStorage.getItem("dwk_cookie_consent") ?? "null"));
  expect(analyticsOnly).toMatchObject({ analytics: true, marketing: false });

  await page.getByRole("button", { name: "Cookievoorkeuren", exact: true }).click();
  await page.getByLabel(/Marketing:/).check();
  await page.getByRole("button", { name: "Voorkeuren opslaan" }).click();
  const allConsent = await page.evaluate(() => JSON.parse(localStorage.getItem("dwk_cookie_consent") ?? "null"));
  expect(allConsent).toMatchObject({ analytics: true, marketing: true });
  await expect.poll(() => dataLayerEvents(page, "cookie_consent_updated").then((events) => events.length)).toBe(2);
});

test("SPA page views include initial, navigation and back without duplicates", async ({ page }) => {
  await installConsent(page, true, false);
  await page.goto("/");
  await expect.poll(() => dataLayerEvents(page, "page_view").then((events) => events.length)).toBe(1);
  await page.getByRole("link", { name: "Oplossingen", exact: true }).first().click();
  await expect.poll(() => dataLayerEvents(page, "page_view").then((events) => events.length)).toBe(2);
  await page.goBack();
  await expect.poll(() => dataLayerEvents(page, "page_view").then((events) => events.length)).toBe(3);

  await page.evaluate(async () => (await import("/src/lib/tracking.ts")).trackPageView());
  await expect.poll(() => dataLayerEvents(page, "page_view").then((events) => events.length)).toBe(3);
});

test("generate_lead follows API success, never errors, and deduplicates by submission", async ({ page }) => {
  await installConsent(page, true, true);
  let attempts = 0;
  await page.route("**/api/woningcheck/leads", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "TEST", message: "Testfout" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000001", status: "New", createdAt: new Date().toISOString() }),
    });
  });

  await page.goto("/woningcheck?utm_source=google&utm_campaign=tracking-test&email=pii@example.test");
  await completeWoningcheck(page);
  await page.getByRole("button", { name: "Verstuur mijn aanvraag" }).click();
  await expect(page.getByRole("alert")).toContainText("Testfout");
  expect(await dataLayerEvents(page, "generate_lead")).toHaveLength(0);

  await page.getByRole("button", { name: "Verstuur mijn aanvraag" }).click();
  await expect(page.getByText(/Uw Woningcheck is opgeslagen met referentie/)).toBeVisible();
  const events = await dataLayerEvents(page, "generate_lead");
  expect(events).toHaveLength(1);
  expect(await dataLayerEvents(page, "woningcheck_started")).toHaveLength(1);
  expect(await dataLayerEvents(page, "woningcheck_step_completed")).toHaveLength(5);
  expect(events[0]).toMatchObject({
    event: "generate_lead",
    lead_type: "woningcheck",
    submission_id: expect.any(String),
    source: "google",
    campaign: "tracking-test",
  });

  const duplicateResult = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem("dwk_woningcheck_draft_submission") ?? "null") as { submissionId: string };
    return (await import("/src/lib/tracking.ts")).trackLeadSubmittedOnce(
      state.submissionId,
      "woningcheck",
      "General",
      { landingPage: window.location.href }
    );
  });
  expect(duplicateResult).toBe(false);
  expect(await dataLayerEvents(page, "generate_lead")).toHaveLength(1);

  const serialized = JSON.stringify(await page.evaluate(() => (window as Window & { dataLayer: unknown[] }).dataLayer));
  expect(serialized).not.toContain("Tracking Testpersoon");
  expect(serialized).not.toContain("tracking@example.test");
  expect(serialized).not.toContain("0612345678");
  expect(serialized).not.toContain("1234 AB");
  expect(serialized).not.toContain("pii@example.test");
});

test("contact_form_submitted is emitted only after API success and contains no PII", async ({ page }) => {
  await installConsent(page, true, false);
  let attempts = 0;
  await page.route("**/api/contact/messages", async (route) => {
    attempts += 1;
    await route.fulfill({
      status: attempts === 1 ? 500 : 204,
      contentType: attempts === 1 ? "application/json" : undefined,
      body: attempts === 1 ? JSON.stringify({ code: "TEST", message: "Contactfout" }) : undefined,
    });
  });
  await page.goto("/contact");
  await page.getByLabel("Naam").fill("Contact Testpersoon");
  await page.getByLabel("E-mailadres").fill("contact@example.test");
  await page.getByLabel("Onderwerp").fill("Trackingtest");
  await page.getByRole("textbox", { name: "Bericht" }).fill("Vrije tekst die niet gemeten mag worden.");
  await page.getByLabel(/bericht verwerkt/).check();

  await page.getByRole("button", { name: "Bericht verzenden" }).click();
  await expect(page.getByRole("alert")).toContainText("Contactfout");
  expect(await dataLayerEvents(page, "contact_form_submitted")).toHaveLength(0);
  await page.getByRole("button", { name: "Bericht verzenden" }).click();
  await expect(page.getByRole("status")).toContainText("Uw bericht is ontvangen");
  expect(await dataLayerEvents(page, "contact_form_submitted")).toHaveLength(1);

  const serialized = JSON.stringify(await dataLayerEvents(page, "contact_form_submitted"));
  expect(serialized).not.toContain("Contact Testpersoon");
  expect(serialized).not.toContain("contact@example.test");
  expect(serialized).not.toContain("Vrije tekst");
});
