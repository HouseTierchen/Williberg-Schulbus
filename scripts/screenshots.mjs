// Screenshots der laufenden Schulbus-App erzeugen.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";

const PW = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/screenshots";

async function login(page, email, password) {
  await page.goto(BASE + "/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800);
}

async function register(page, name, email, password) {
  await page.goto(BASE + "/register");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800);
}

async function shot(page, name) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    fullPage: true,
  });
  console.log("✓ " + name);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: PW,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    // Mobile-Viewport für realistische Vorschau
    const desktop = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: "de-CH",
    });

    // 1. Startseite (anonym)
    const p1 = await desktop.newPage();
    await p1.goto(BASE);
    await shot(p1, "01-landing");

    // 2. Login
    const p2 = await desktop.newPage();
    await p2.goto(BASE + "/login");
    await shot(p2, "02-login");

    // 3. Registrieren
    const p3 = await desktop.newPage();
    await p3.goto(BASE + "/register");
    await shot(p3, "03-register");

    // === Eltern-Flow: Familie anlegen + Kind + Bedarf ===
    const parent = await desktop.newPage();
    await register(parent, "Familie Muster", "muster@beispiel.ch", "geheim1234");

    // Kind anlegen via API-Form
    await parent.goto(BASE + "/dashboard/children/new");
    await parent.fill('input[name="firstName"]', "Lina");
    await parent.fill('input[name="lastName"]', "Muster");
    await parent.fill('input[name="school"]', "Primarschule Zofingen");
    await parent.fill('input[name="grade"]', "3. Klasse");
    await parent.fill('input[name="stopName"]', "Wiliberg Dorf");
    await parent.click('button[type="submit"]');
    await parent.waitForLoadState("domcontentloaded");
    await parent.waitForTimeout(800);
    await parent.goto(BASE + "/dashboard");
    await shot(parent, "04-eltern-dashboard");

    // Wochen-Bedarf-Seite
    const childLink = await parent.locator('a:has-text("Wochen-Bedarf")').first();
    await childLink.click();
    await parent.waitForLoadState("networkidle").catch(() => {});
    await shot(parent, "05-eltern-wochenbedarf");

    // Krankmeldung-Seite
    await parent.goto(BASE + "/dashboard");
    const sickFormBtn = await parent.locator('a:has-text("Abmeldung (Zeitraum)")').first();
    if (await sickFormBtn.count()) {
      await sickFormBtn.click();
      await shot(parent, "06-eltern-abmeldung");
    }

    // === Admin-Flow ===
    const admin = await desktop.newPage();
    await login(admin, "admin@wiliberg.ch", "wiliberg-admin");
    await shot(admin, "07-admin-dashboard");

    // Schulpläne
    await admin.goto(BASE + "/admin/plans");
    await shot(admin, "08-admin-plaene");

    // Plan neu (Upload-Form)
    await admin.goto(BASE + "/admin/plans/new");
    await shot(admin, "09-admin-plan-upload");

    // Fahrplan
    await admin.goto(BASE + "/admin/schedule");
    await shot(admin, "10-admin-fahrplan");

    // Spezialwochen
    await admin.goto(BASE + "/admin/specialweeks");
    await shot(admin, "11-admin-specialweeks");

    // Ferien
    await admin.goto(BASE + "/admin/holidays");
    await shot(admin, "12-admin-ferien");

    // Tagesplan
    await admin.goto(BASE + "/admin/dayplan");
    await shot(admin, "13-admin-tagesplan");

    // Wochenliste
    await admin.goto(BASE + "/admin/weekplan");
    await shot(admin, "14-admin-wochenliste");

    // Mitteilungen
    await admin.goto(BASE + "/admin/announcements");
    await shot(admin, "15-admin-mitteilungen");
    await admin.goto(BASE + "/admin/announcements/new");
    await shot(admin, "16-admin-mitteilung-neu");

    // === Mobile-Ansicht der Startseite + Eltern-Dashboard ===
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14
      locale: "de-CH",
      isMobile: true,
      hasTouch: true,
    });
    const mp1 = await mobile.newPage();
    await mp1.goto(BASE);
    await shot(mp1, "17-mobile-landing");

    // Mobile mit Eltern-Login (Familie Muster)
    const mp2 = await mobile.newPage();
    await login(mp2, "muster@beispiel.ch", "geheim1234");
    await shot(mp2, "18-mobile-dashboard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
