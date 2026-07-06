import { expect, test, type Page } from "@playwright/test";

const apiUrl = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:5299";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "dwk_cookie_consent",
      JSON.stringify({
        version: "2026-07-06",
        necessary: true,
        analytics: false,
        marketing: false,
        updatedAt: new Date().toISOString(),
      })
    );
  });
});

async function setRange(page: Page, value: number) {
  await page.locator('input[type="range"]').evaluate((input, nextValue) => {
    const range = input as HTMLInputElement;
    range.value = String(nextValue);
    range.dispatchEvent(new Event("input", { bubbles: true }));
    range.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function choose(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

async function fillBatteryFlowToConsent(page: Page) {
  await expect(page.getByRole("heading", { name: "Heeft u zonnepanelen?" })).toBeVisible();
  await page.getByRole("button", { name: "Volgende" }).click();
  await expect(page.getByRole("alert")).toContainText("Geef aan of u zonnepanelen heeft.");

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await choose(page, "Ja");
  await page.getByRole("button", { name: "Volgende" }).click();

  await page.getByLabel("Aantal").fill("12");
  await page.getByRole("button", { name: "Volgende" }).click();

  await setRange(page, 4200);
  await page.getByRole("button", { name: "Volgende" }).click();

  await page.getByLabel("Aantal").fill("1800");
  await page.getByRole("button", { name: "Volgende" }).click();

  await choose(page, "Dynamisch");
  await page.getByRole("button", { name: "Volgende" }).click();

  await choose(page, "Meer eigen zonnestroom gebruiken");
  await page.getByRole("button", { name: "Volgende" }).click();

  await choose(page, "Binnen 3 maanden");
  await page.getByRole("button", { name: "Volgende" }).click();

  await page.getByLabel("Postcode").fill("1234 AB");
  await page.getByLabel("Huisnummer").fill("12");
  await page.getByRole("button", { name: "Volgende" }).click();

  await page.getByLabel("Naam").fill("Browser QA");
  await page.getByLabel("Telefoon").fill("0612345678");
  await page.getByLabel("E-mailadres").fill("browser-qa@example.test");
  await page.getByRole("button", { name: "Volgende" }).click();

  await expect(page.getByRole("heading", { name: "Uw toestemming" })).toBeVisible();
  await expect(page.getByLabel(/thuisbatterijadvies ontvangen/)).not.toBeChecked();
  await expect(page.getByLabel(/Optioneel:/)).not.toBeChecked();
}

test("public pages use clean URL routes and legacy public hashes redirect", async ({ page }) => {
  const routes = [
    { path: "/oplossingen", heading: "Welke maatregel past bij uw woning?" },
    { path: "/oplossingen/thuisbatterij", heading: "Thuisbatterij" },
    { path: "/kennisbank", heading: "Praktische uitleg over woningverduurzaming" },
    { path: "/kennisbank/thuisbatterij-kosten", heading: "Thuisbatterij: kijk naar uw verbruiksprofiel" },
    { path: "/over-ons", heading: "Betere informatie, betere keuze, passende match" },
    { path: "/woningcheck", heading: "Wat voor woning heeft u?" },
    { path: "/thuisbatterij-check", heading: "Heeft u zonnepanelen?" },
    { path: "/contact", heading: "Heeft u een vraag?" },
    { path: "/partner-worden", heading: "Samenwerken rond zorgvuldige verduurzamingsvragen" },
    { path: "/privacy", heading: "Privacyverklaring" },
    { path: "/algemene-voorwaarden", heading: "Algemene voorwaarden" },
    { path: "/cookiebeleid", heading: "Cookiebeleid" },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${route.path.replace(/\//g, "\\/")}$`));
  }

  await page.goto("/?utm_source=route-test#/oplossingen/thuisbatterij");
  await expect(page).toHaveURL(/\/oplossingen\/thuisbatterij\?utm_source=route-test$/);
  await expect(page.getByRole("heading", { name: "Thuisbatterij", level: 1 })).toBeVisible();

  await page.goto("/#/kennisbank/thuisbatterij-kosten?utm_campaign=legacy-route");
  await expect(page).toHaveURL(/\/kennisbank\/thuisbatterij-kosten\?utm_campaign=legacy-route$/);
  await expect(page.getByRole("heading", { name: "Thuisbatterij: kijk naar uw verbruiksprofiel", level: 1 })).toBeVisible();

  await page.goto("/#/admin");
  await expect(page).toHaveURL(/\/#\/admin$/);
  await expect(page.getByRole("heading", { name: "Leadbeheer", level: 1 })).toBeVisible();
});

test("contact form validates consent and sends a contact notification", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Naam").fill("Contact QA");
  await page.getByLabel("E-mailadres").fill("contact-qa@example.test");
  await page.getByLabel("Onderwerp").fill("Vraag over de woningcheck");
  await page.getByRole("textbox", { name: "Bericht" }).fill("Dit is een testbericht voor de lokale launch-check.");

  await page.getByRole("button", { name: "Bericht verzenden" }).click();
  await expect(page.getByRole("alert")).toContainText("Controleer de ingevulde gegevens.");

  await page.getByLabel(/bericht verwerkt/).check();
  await page.getByRole("button", { name: "Bericht verzenden" }).click();
  await expect(page.getByRole("status")).toContainText("Uw bericht is ontvangen.");
});

test("desktop thuisbatterij funnel validates, stores attribution, and admin can manage result", async ({ page }) => {
  const campaign = `browser-qa-${Date.now()}`;
  const landingUrl =
    `/thuisbatterij-check?utm_source=google&utm_medium=cpc&utm_campaign=${campaign}` +
    "&utm_term=thuisbatterij&utm_content=ad-a&gclid=browser-gclid-123";

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(landingUrl);
  await fillBatteryFlowToConsent(page);

  await page.getByRole("button", { name: "Verstuur mijn aanvraag" }).click();
  await expect(page.getByRole("alert")).toContainText("Geef toestemming om uw thuisbatterijadvies te ontvangen.");

  await page.getByLabel(/thuisbatterijadvies ontvangen/).check();

  let failedOnce = false;
  let successfulPosts = 0;
  let releaseSuccessfulRequest: (() => void) | null = null;
  const successfulRequestPaused = new Promise<void>((resolve) => {
    releaseSuccessfulRequest = resolve;
  });
  await page.route("**/api/woningcheck/leads", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    if (!failedOnce) {
      failedOnce = true;
      await route.abort("failed");
      return;
    }

    successfulPosts += 1;
    await successfulRequestPaused;
    await route.continue();
  });

  await page.getByRole("button", { name: "Verstuur mijn aanvraag" }).click();
  await expect(page.getByRole("alert")).toContainText("De aanvraag kon niet worden verzonden omdat de aanvraagservice niet bereikbaar is.");

  const submit = page.getByRole("button", { name: "Verstuur mijn aanvraag" });
  const clicks = await Promise.allSettled([submit.click(), submit.click({ timeout: 500 })]);
  expect(clicks.some((result) => result.status === "fulfilled")).toBe(true);
  await expect(page.getByRole("button", { name: /Aanvraag verzenden/ })).toBeDisabled();
  expect(successfulPosts).toBe(1);
  releaseSuccessfulRequest?.();
  await expect(page.getByRole("heading", { name: "Uw thuisbatterijcheck is ontvangen" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Uw thuisbatterijcheck is ontvangen" })).toBeVisible();
  await page.goBack();
  await page.goto(landingUrl);
  await expect(page.getByRole("heading", { name: "Uw thuisbatterijcheck is ontvangen" })).toBeVisible();

  const unauthorizedList = await page.request.get(`${apiUrl}/api/admin/leads`);
  expect(unauthorizedList.status()).toBe(401);

  const login = await page.request.post(`${apiUrl}/api/admin/session`, {
    data: { username: "admin", password: "browser-qa-password" },
  });
  expect(login.status()).toBe(200);

  const leadsResponse = await page.request.get(`${apiUrl}/api/admin/leads?source=${campaign}`);
  expect(leadsResponse.status()).toBe(200);
  const leads = (await leadsResponse.json()) as Array<{ id: string }>;
  expect(leads).toHaveLength(1);

  const detailResponse = await page.request.get(`${apiUrl}/api/admin/leads/${leads[0].id}`);
  expect(detailResponse.status()).toBe(200);
  const detail = await detailResponse.json();
  expect(detail.source.utmSource).toBe("google");
  expect(detail.source.utmMedium).toBe("cpc");
  expect(detail.source.utmCampaign).toBe(campaign);
  expect(detail.source.gclid).toBe("browser-gclid-123");
  expect(detail.consentRecords[0].adviceConsent).toBe(true);
  expect(detail.consentRecords[0].matchingConsent).toBe(false);
  expect(detail.consentRecords[0].consentText).toContain("persoonlijke woningadvies");
  expect(detail.consentRecords[0].consentVersion).toBe("2026-07-05");
  expect(detail.consentRecords[0].createdAt).toBeTruthy();

  const wonResponse = await page.request.patch(`${apiUrl}/api/admin/leads/${leads[0].id}/status`, {
    data: { status: "Won", note: "Browser QA gewonnen resultaat." },
  });
  expect(wonResponse.status()).toBe(200);
  expect((await wonResponse.json()).status).toBe("Won");

  const lostResponse = await page.request.patch(`${apiUrl}/api/admin/leads/${leads[0].id}/status`, {
    data: { status: "Lost", note: "Browser QA verliesreden." },
  });
  expect(lostResponse.status()).toBe(200);
  expect((await lostResponse.json()).status).toBe("Lost");

  const noteResponse = await page.request.post(`${apiUrl}/api/admin/leads/${leads[0].id}/notes`, {
    data: { text: "Browser QA notitie." },
  });
  expect(noteResponse.status()).toBe(201);
  expect((await noteResponse.json()).notes).toHaveLength(1);
});

test("mobile thuisbatterij landing and early steps fit without horizontal overflow", async ({ page }) => {
  const overflowIsAbsent = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/thuisbatterij-check?utm_source=google&utm_medium=cpc&utm_campaign=mobile-qa&gclid=mobile-gclid");
  await expect(page.locator("body")).toHaveJSProperty("clientWidth", 390);
  await expect.poll(overflowIsAbsent).toBe(true);

  await fillBatteryFlowToConsent(page);
  await expect.poll(overflowIsAbsent).toBe(true);
});
