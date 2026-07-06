import crypto from "node:crypto";
import process from "node:process";

const requiredServerEnv = [
  ["SMTP_HOST", "smtp.transip.email"],
  ["SMTP_PORT", "465"],
  ["SMTP_USERNAME", "info@duurzaamwoningkompas.nl"],
  ["SMTP_FROM_EMAIL", "info@duurzaamwoningkompas.nl"],
  ["SMTP_FROM_NAME", "DuurzaamWoningKompas"],
  ["SMTP_USE_SSL", "true"],
  ["CONTACT_NOTIFICATION_EMAIL", "info@duurzaamwoningkompas.nl"],
];

const requiredImapEnv = [
  ["IMAP_HOST", "imap.transip.email"],
  ["IMAP_PORT", "993"],
  ["IMAP_USERNAME", "info@duurzaamwoningkompas.nl"],
  ["IMAP_USE_SSL", "true"],
];

const apiBaseUrl = cleanUrl(process.env.DWK_PRODUCTION_API_URL);
const testRecipientEmail = clean(process.env.DWK_SMOKE_TEST_RECIPIENT_EMAIL);
const confirmation = process.env.DWK_PRODUCTION_SMOKE_TEST;
const skipServerEnvCheck = process.env.DWK_SKIP_SERVER_ENV_CHECK === "true";

async function main() {
  if (confirmation !== "send-real-email") {
    fail("Zet DWK_PRODUCTION_SMOKE_TEST=send-real-email om echte productie e-mails te versturen.");
  }

  if (!apiBaseUrl) {
    fail("DWK_PRODUCTION_API_URL ontbreekt, bijvoorbeeld https://www.duurzaamwoningkompas.nl.");
  }

  if (!testRecipientEmail) {
    fail("DWK_SMOKE_TEST_RECIPIENT_EMAIL ontbreekt. Gebruik een mailbox waarop u de klantbevestigingen kunt controleren.");
  }

  if (!skipServerEnvCheck) {
    validateExpectedEnv(requiredServerEnv);
    validateSecretPresent("SMTP_PASSWORD");
    validateExpectedEnv(requiredImapEnv);
    validateSecretPresent("IMAP_PASSWORD");
  } else {
    console.warn("Server-env controle overgeslagen met DWK_SKIP_SERVER_ENV_CHECK=true.");
  }

  await assertHealth();
  const leadId = await submitWoningcheckLead();
  await submitContactMessage();

  console.log("Productie e-mail smoke-test OK.");
  console.log(`Woningcheck testlead aangemaakt: ${leadId}`);
  console.log(`Controleer ${testRecipientEmail} op klantbevestigingen en info@duurzaamwoningkompas.nl op interne notificaties.`);
}

async function assertHealth() {
  const response = await fetch(`${apiBaseUrl}/api/health`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    fail(`/api/health gaf HTTP ${response.status}.`);
  }
}

async function submitWoningcheckLead() {
  const submissionId = `prod-email-smoke-${crypto.randomUUID()}`;
  const response = await postJson("/api/woningcheck/leads", {
    submissionId,
    productInterest: "General",
    woningtype: "Tussenwoning",
    bouwjaar: "1975 - 1991",
    zonnepanelen: "Nee",
    aantalZonnepanelen: null,
    stroomverbruik: 3000,
    terugleveringKwh: null,
    energiecontract: null,
    gasverbruik: 1200,
    interesses: ["Lagere energierekening"],
    hoofddoel: "Lagere maandlasten",
    starttermijn: "Ik orienteer me nog",
    postcode: "1234 AB",
    huisnummer: "12",
    naam: "Productie E-mailtest",
    email: testRecipientEmail,
    telefoon: "",
    consent: {
      adviceConsent: true,
      matchingConsent: false,
      consentText:
        "Productie smoke-test: toestemming voor het versturen van de Woningcheck testbevestiging naar de opgegeven testmailbox.",
      consentVersion: "production-email-smoke",
      sourceUrl: `${apiBaseUrl}/woningcheck?smoke=email`,
    },
    tracking: {
      utmSource: "production-smoke-test",
      utmMedium: "manual",
      utmCampaign: "email-transip",
      utmTerm: null,
      utmContent: null,
      gclid: null,
      referrer: null,
      landingPage: `${apiBaseUrl}/woningcheck?smoke=email`,
    },
  });

  return response.id;
}

async function submitContactMessage() {
  await postJson("/api/contact/messages", {
    name: "Productie E-mailtest",
    email: testRecipientEmail,
    phone: "",
    subject: "Productie test contactformulier",
    message:
      "Dit is een gecontroleerde productie smoke-test voor de TransIP e-mailconfiguratie van DuurzaamWoningKompas.",
    privacyConsent: true,
    sourceUrl: `${apiBaseUrl}/contact?smoke=email`,
    honeypot: "",
  }, false);
}

async function postJson(path, body, expectJson = true) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    fail(`${path} gaf HTTP ${response.status}: ${errorText}`);
  }

  return expectJson ? response.json() : undefined;
}

function validateExpectedEnv(entries) {
  for (const [name, expected] of entries) {
    const value = clean(process.env[name]);
    if (value !== expected) {
      fail(`${name} moet '${expected}' zijn, maar is '${value || "[leeg]"}'.`);
    }
  }
}

function validateSecretPresent(name) {
  const value = clean(process.env[name]);
  if (!value || value.includes("<") || value.includes("[") || value.length < 8) {
    fail(`${name} ontbreekt of lijkt een placeholder. Zet de echte waarde via de server secret manager.`);
  }
}

function clean(value) {
  return value?.trim() ?? "";
}

function cleanUrl(value) {
  return clean(value).replace(/\/$/, "");
}

function fail(message) {
  console.error(`Productie e-mail smoke-test gestopt: ${message}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
