#!/usr/bin/env node
// Seeds a running LeasRecover stack with a demo tenant and realistic test data,
// through the public API only, so everything is created the way the app does it
// (tenant schema, password hashes, case history, AI valuation, alerts).
//
//   node scripts/seed-dev-data.mjs
//
// Environment (all optional):
//   BACKEND_URL           default http://localhost:8080
//   SUPER_ADMIN_EMAIL     default superadmin@example.com
//   SUPER_ADMIN_PASSWORD  default SuperAdmin2026!
//   SEED_NO_BACKDATE=1    skip the SQL step that backdates cases for the alert engine
//
// Re-running is safe: an existing demo tenant and its users are reused, and
// cases are only created for contract references that don't exist yet.

import { spawnSync } from "node:child_process";

const BASE = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");
const API = `${BASE}/api/v1`;
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL ?? "superadmin@example.com",
  password: process.env.SUPER_ADMIN_PASSWORD ?? "SuperAdmin2026!",
};

const TENANT = {
  name: "Demo Leasing SA",
  logoUrl: "https://placehold.co/200x60/1d4ed8/white?text=Demo+Leasing",
  dataRetentionMonths: 60,
  adminEmail: "admin@demo-leasing.tn",
  adminPassword: "Admin2026!",
};
const GESTIONNAIRES = [
  { email: "sami.trabelsi@demo-leasing.tn", password: "Gestion2026!", firstName: "Sami", lastName: "Trabelsi" },
  { email: "leila.bensalem@demo-leasing.tn", password: "Gestion2026!", firstName: "Leila", lastName: "Ben Salem" },
];

// Vehicle valuation is simulated by the AI service from the PDF text:
//   base(brand) * max(0.25, 1 - 0.08 * (2026 - year)) - 350 EUR per 10 000 km
//   over (age + 1) * 15 000 km, rounded to 50 EUR.
// The residual values below are chosen against that formula so the three
// reliability indicators (< 10 %, 10–20 %, >= 20 % deviation) all appear.
const CASES = [
  // --- PRE_CONTENTIEUX ---
  { ref: "CTR-2024-0101", phase: "PRE_CONTENTIEUX", client: c("Société Tunisienne de Transport", "STT2019A", "contact@stt-transport.tn", "+216 71 100 200", "12 Avenue Habib Bourguiba, Tunis"),
    vehicle: v("VF3LCYHZPJS123456", "215TU1234", "Peugeot", "308", 2021), residual: 13_000_00, assignee: 0, notes: ["Premier impayé constaté le 3 du mois.", "Client injoignable par téléphone, courrier envoyé."] },
  { ref: "CTR-2024-0102", phase: "PRE_CONTENTIEUX", client: c("Mohamed Ben Ali", "", "m.benali@example.tn", "+216 98 111 222", "Rue de la Liberté, Sousse"),
    vehicle: v("VF1RJA00X65432109", "198TU4567", "Renault", "Clio", 2022), residual: 17_000_00, assignee: 1 },
  { ref: "CTR-2024-0103", phase: "PRE_CONTENTIEUX", client: c("Pharmacie El Amal", "PHA2021B", "gerant@pharmacie-elamal.tn", "+216 73 300 400", "Avenue de la République, Monastir"),
    vehicle: v("WVWZZZAUZKW987654", "220TU8901", "Volkswagen", "Golf", 2019), residual: 16_000_00, assignee: null, backdate: { lastActionDays: 45 } },
  // --- MISE_EN_DEMEURE ---
  { ref: "CTR-2023-0210", phase: "MISE_EN_DEMEURE", client: c("Ahmed Gharbi", "", "a.gharbi@example.tn", "+216 22 333 444", "Cité El Khadra, Tunis"),
    vehicle: v("WBA1A11000J112233", "201TU2345", "BMW", "X1", 2020), residual: 22_000_00, assignee: 0, notes: ["Mise en demeure envoyée par huissier le 12/08."] },
  { ref: "CTR-2023-0211", phase: "MISE_EN_DEMEURE", client: c("Bâtiment Moderne SARL", "BAT2018C", "admin@batiment-moderne.tn", "+216 74 500 600", "Zone industrielle, Sfax"),
    vehicle: v("WDD2050041F445566", "190TU6789", "Mercedes", "Classe C", 2018), residual: 19_500_00, assignee: 1, backdate: { phaseStartedDays: 29 } },
  { ref: "CTR-2023-0212", phase: "MISE_EN_DEMEURE", client: c("Fatma Jebali", "", "f.jebali@example.tn", "+216 55 777 888", "Rue Ibn Khaldoun, Bizerte"),
    vehicle: v("VF7NCBHY6HY778899", "210TU3456", "Citroen", "C3", 2020), residual: 14_000_00, assignee: null, backdate: { phaseStartedDays: 40, lastActionDays: 40 } },
  // --- SAISIE (expertise uploaded → AI valuation) ---
  { ref: "CTR-2023-0320", phase: "SAISIE", client: c("Transport Rapide SUARL", "TRA2020D", "contact@transport-rapide.tn", "+216 75 900 100", "Route de Gabès, Sfax"),
    vehicle: v("VF3LCYHZPJS223344", "205TU7890", "Peugeot", "308", 2021), residual: 13_000_00, mileage: 45_000, expertise: true, assignee: 0, notes: ["Véhicule récupéré au dépôt de Sfax.", "Rapport d'expertise reçu."] },
  { ref: "CTR-2023-0321", phase: "SAISIE", client: c("Nour Chaabane", "", "n.chaabane@example.tn", "+216 20 123 456", "Avenue Farhat Hached, Nabeul"),
    vehicle: v("VF1RJA00X65445566", "199TU1122", "Renault", "Clio", 2022), residual: 17_000_00, mileage: 60_000, expertise: true, assignee: 1 },
  { ref: "CTR-2023-0322", phase: "SAISIE", client: c("Agro Distribution SA", "AGR2017E", "dg@agro-distribution.tn", "+216 76 200 300", "Zone industrielle, Kairouan"),
    vehicle: v("WVWZZZAUZKW556677", "185TU9988", "Volkswagen", "Golf", 2019), residual: 16_000_00, mileage: 120_000, expertise: true, assignee: 0 },
  { ref: "CTR-2023-0323", phase: "SAISIE", client: c("Karim Mansour", "", "k.mansour@example.tn", "+216 29 654 321", "Rue du Lac, Tunis"),
    vehicle: v("WBA1A11000J445566", "202TU5566", "BMW", "X1", 2020), residual: 22_000_00, assignee: 1, backdate: { lastActionDays: 35 } },
  // --- VENTE (requires a valuation) ---
  { ref: "CTR-2022-0430", phase: "VENTE", client: c("Hôtel Les Palmiers", "HOT2016F", "direction@lespalmiers.tn", "+216 73 800 900", "Zone touristique, Hammamet"),
    vehicle: v("WDD2050041F998877", "180TU2233", "Mercedes", "Classe C", 2018), residual: 19_500_00, mileage: 150_000, expertise: true, assignee: 0 },
  { ref: "CTR-2022-0431", phase: "VENTE", client: c("Salah Hamdi", "", "s.hamdi@example.tn", "+216 97 456 789", "Cité Ennasr, Ariana"),
    vehicle: v("VF7NCBHY6HY112233", "195TU4455", "Citroen", "C3", 2020), residual: 12_500_00, mileage: 70_000, expertise: true, assignee: 1, backdate: { phaseStartedDays: 70 } },
  // --- CLOTURE ---
  { ref: "CTR-2022-0540", phase: "CLOTURE", client: c("Imprimerie du Sud", "IMP2015G", "contact@imprimerie-sud.tn", "+216 75 600 700", "Avenue de la Liberté, Gabès"),
    vehicle: v("VF3LCYHZPJS334455", "175TU6677", "Peugeot", "308", 2021), residual: 13_500_00, mileage: 50_000, expertise: true, assignee: 0, notes: ["Véhicule vendu aux enchères. Dossier clôturé."] },
];

// Standalone leasing records (no case yet), for the /dashboard/leasing screens.
const LEASING_ONLY = [
  { client: c("Clinique Essalema", "CLI2020H", "admin@clinique-essalema.tn", "+216 71 400 500", "El Menzah, Tunis"), ref: "CTR-2025-0001", vehicle: v("VF1RJA00X65778899", "230TU1010", "Renault", "Captur", 2024) },
  { client: c("Yasmine Khelifi", "", "y.khelifi@example.tn", "+216 21 987 654", "Rue de Marseille, Tunis"), ref: "CTR-2025-0002", vehicle: v("WVWZZZAUZKW101010", "231TU2020", "Volkswagen", "Polo", 2023) },
  { client: c("Menuiserie Bouzid", "MEN2019I", "contact@menuiserie-bouzid.tn", "+216 72 100 100", "Zaghouan"), ref: "CTR-2025-0003", vehicle: v("VF3LCYHZPJS909090", "232TU3030", "Peugeot", "Partner", 2023) },
];

const PHASES = ["PRE_CONTENTIEUX", "MISE_EN_DEMEURE", "SAISIE", "VENTE", "CLOTURE"];

function c(fullName, registrationNumber, contactEmail, contactPhone, address) {
  return { fullName, registrationNumber, contactEmail, contactPhone, address };
}
function v(vin, licensePlate, brand, model, year) {
  return { vin, licensePlate, brand, model, year };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function api(method, path, { token, body, form, query } = {}) {
  const url = new URL(`${API}${path}`);
  if (query) for (const [k, val] of Object.entries(query)) url.searchParams.set(k, String(val));
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!res.ok) {
    const msg = json?.message ?? json?.data ?? text ?? res.statusText;
    throw new Error(`${method} ${path} -> ${res.status}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return json?.data ?? json;
}

async function login(email, password, tenantId = null) {
  const data = await api("POST", "/auth/login", { body: { email, password, tenantId } });
  return data.token;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Minimal PDF writer. The AI service reads `(text) Tj` operators out of the
// content stream, so an uncompressed single-page PDF is all that is needed.
// ---------------------------------------------------------------------------

function pdfEscape(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makePdf(lines) {
  const content = ["BT", "/F1 11 Tf", "50 780 Td", "14 TL"]
    .concat(lines.map((l) => `(${pdfEscape(l)}) Tj T*`))
    .concat(["ET"])
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

function expertisePdf(spec) {
  const { vehicle, mileage, client, ref } = spec;
  return makePdf([
    "RAPPORT D'EXPERTISE AUTOMOBILE",
    "Cabinet Expertise Auto Tunisie - Expert agree",
    "",
    `Dossier : ${ref}`,
    `Client : ${client.fullName}`,
    `Date de l'expertise : ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    "IDENTIFICATION DU VEHICULE",
    `Marque : ${vehicle.brand}`,
    `Modele : ${vehicle.model}`,
    `Annee de mise en circulation : ${vehicle.year}`,
    `Immatriculation : ${vehicle.licensePlate}`,
    `Numero de serie : ${vehicle.vin}`,
    `Kilometrage au compteur : ${mileage.toLocaleString("fr-FR").replace(/ /g, " ")} km`,
    "",
    "ETAT GENERAL",
    "Carrosserie : bon etat, rayures legeres sur le pare-chocs arriere.",
    "Interieur : bon etat, usure normale.",
    "Mecanique : moteur et boite de vitesses en bon etat de fonctionnement.",
    "Pneumatiques : usure a 40 %.",
    "",
    "CONCLUSION",
    "Vehicule en bon etat general, apte a la revente.",
  ]);
}

function contractPdf(spec) {
  return makePdf([
    "CONTRAT DE LEASING",
    `Reference : ${spec.ref}`,
    `Preneur : ${spec.client.fullName}`,
    `Vehicule : ${spec.vehicle.brand} ${spec.vehicle.model} ${spec.vehicle.year} - ${spec.vehicle.licensePlate}`,
    `Valeur residuelle initiale : ${(spec.residual / 100).toLocaleString("fr-FR").replace(/ /g, " ")} EUR`,
    "Duree : 48 mois",
  ]);
}

// ---------------------------------------------------------------------------
// Seeding steps
// ---------------------------------------------------------------------------

const log = (msg) => console.log(msg);
const step = (msg) => console.log(`\n== ${msg}`);

async function ensureTenant(superToken) {
  const tenants = await api("GET", "/super-admin/tenants", { token: superToken });
  const list = Array.isArray(tenants) ? tenants : tenants?.content ?? [];
  const existing = list.find((t) => t.name === TENANT.name);
  if (existing) {
    log(`tenant "${TENANT.name}" already exists (${existing.id}) — reusing`);
    return existing.id;
  }
  const created = await api("POST", "/super-admin/tenants", { token: superToken, body: TENANT });
  log(`created tenant "${TENANT.name}" (${created.id})`);
  return created.id;
}

async function ensureUsers(adminToken) {
  const users = await api("GET", "/admin/users", { token: adminToken });
  const list = Array.isArray(users) ? users : users?.content ?? [];
  const byEmail = new Map(list.map((u) => [u.email, u]));
  const ids = [];
  for (const g of GESTIONNAIRES) {
    let u = byEmail.get(g.email);
    if (u) {
      log(`user ${g.email} exists — reusing`);
    } else {
      u = await api("POST", "/admin/users", { token: adminToken, body: { ...g, role: "GESTIONNAIRE" } });
      log(`created gestionnaire ${g.email}`);
    }
    ids.push(u.id);
  }
  return ids;
}

async function configureTenant(adminToken) {
  await api("PUT", "/admin/tenant/config", {
    token: adminToken,
    body: {
      dormancyThresholdDays: 30,
      phaseLegalDelays: { PRE_CONTENTIEUX: 15, MISE_EN_DEMEURE: 30, SAISIE: 45, VENTE: 60 },
    },
  });
  await api("PUT", "/admin/tenant/config/thresholds", {
    token: adminToken,
    body: { aiDeviationModerate: 10, aiDeviationCritical: 20 },
  });
  log("tenant config: dormancy 30 d, legal delays 15/30/45/60 d, AI thresholds 10 % / 20 %");
}

async function seedLeasingOnly(token) {
  const clients = await api("GET", "/clients", { token });
  const clientList = Array.isArray(clients) ? clients : clients?.content ?? [];
  const contracts = await api("GET", "/contracts", { token });
  const contractList = Array.isArray(contracts) ? contracts : contracts?.content ?? [];
  for (const spec of LEASING_ONLY) {
    if (contractList.some((k) => k.referenceNumber === spec.ref)) {
      log(`contract ${spec.ref} exists — skipping`);
      continue;
    }
    let client = clientList.find((k) => k.contactEmail === spec.client.contactEmail);
    if (!client) {
      client = await api("POST", "/clients", {
        token,
        body: {
          fullNameOrCompany: spec.client.fullName,
          registrationNumber: spec.client.registrationNumber || null,
          contactEmail: spec.client.contactEmail,
          contactPhone: spec.client.contactPhone,
          address: spec.client.address,
        },
      });
    }
    const start = new Date(); start.setMonth(start.getMonth() - 6);
    const end = new Date(start); end.setMonth(end.getMonth() + 48);
    const contract = await api("POST", "/contracts", {
      token,
      body: { clientId: client.id, referenceNumber: spec.ref, startDate: start.toISOString(), endDate: end.toISOString(), status: "ACTIVE" },
    });
    await api("POST", `/contracts/${contract.id}/vehicle`, { token, body: spec.vehicle });
    log(`leasing: ${spec.client.fullName} / ${spec.ref} / ${spec.vehicle.brand} ${spec.vehicle.model}`);
  }
}

async function existingCaseRefs(token) {
  const refs = new Map();
  for (let page = 0; page < 20; page++) {
    const data = await api("GET", "/cases", { token, query: { page, size: 100 } });
    for (const k of data?.content ?? []) refs.set(k.contractReference, k.id);
    if (data?.last !== false) break;
  }
  return refs;
}

async function uploadPdf(token, caseId, phase, tag, filename, bytes) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "application/pdf" }), filename);
  form.append("phase", phase);
  if (tag) form.append("tag", tag);
  return api("POST", `/cases/${caseId}/documents`, { token, form });
}

// GET /cases/{id}/valuation answers 404 until the AI webhook has stored a
// SUCCESS row, 422 if extraction failed, and 200 with the figures otherwise.
async function waitForValuation(token, caseId) {
  for (let i = 0; i < 40; i++) {
    await sleep(1500);
    try {
      return await api("GET", `/cases/${caseId}/valuation`, { token });
    } catch (e) {
      if (!/-> 404/.test(e.message)) throw e;
    }
  }
  throw new Error("timed out waiting for the AI valuation");
}

async function seedCase(spec, tokens, gestionnaireIds) {
  const token = tokens.gestionnaires[spec.assignee ?? 0];
  const start = new Date(); start.setFullYear(start.getFullYear() - 2);
  const end = new Date(start); end.setMonth(end.getMonth() + 48);
  const created = await api("POST", "/cases", {
    token,
    body: {
      clientFullName: spec.client.fullName,
      clientRegistrationNumber: spec.client.registrationNumber || null,
      clientContactEmail: spec.client.contactEmail,
      clientContactPhone: spec.client.contactPhone,
      clientAddress: spec.client.address,
      contractReferenceNumber: spec.ref,
      contractStartDate: start.toISOString(),
      contractEndDate: end.toISOString(),
      contractStatus: "DEFAULTED",
      vehicleVin: spec.vehicle.vin,
      vehicleLicensePlate: spec.vehicle.licensePlate,
      vehicleBrand: spec.vehicle.brand,
      vehicleModel: spec.vehicle.model,
      vehicleYear: spec.vehicle.year,
      initialResidualValueCents: spec.residual,
    },
  });
  const id = created.id;
  let line = `case ${spec.ref} (${spec.client.fullName}) created`;

  if (spec.assignee !== null && spec.assignee !== undefined) {
    await api("PUT", `/cases/${id}/assign`, { token: tokens.admin, body: { assigneeId: gestionnaireIds[spec.assignee] } });
    line += `, assigned to ${GESTIONNAIRES[spec.assignee].firstName}`;
  }

  await uploadPdf(token, id, "PRE_CONTENTIEUX", "CONTRACT", `contrat-${spec.ref}.pdf`, contractPdf(spec));

  const target = PHASES.indexOf(spec.phase);
  for (let i = 1; i <= target; i++) {
    const phase = PHASES[i];
    await api("POST", `/cases/${id}/next-phase`, { token });
    // Entering VENTE requires a validated AI valuation, which the backend
    // triggers from an expertise report uploaded while the case is in SAISIE.
    if (phase === "SAISIE" && spec.expertise) {
      await uploadPdf(token, id, "SAISIE", "EXPERTISE_REPORT", `expertise-${spec.ref}.pdf`, expertisePdf(spec));
      const val = await waitForValuation(token, id);
      line += `, AI valuation ${(val.marketValueCents / 100).toFixed(0)} EUR vs residual ${(spec.residual / 100).toFixed(0)} EUR (${val.deviationPercentage} %) → ${val.reliabilityIndicator}`;
    }
  }
  line += ` → ${spec.phase}`;

  for (const note of spec.notes ?? []) {
    await api("POST", `/cases/${id}/notes`, { token, body: { content: note } });
  }
  if (spec.notes?.length) line += `, ${spec.notes.length} note(s)`;

  log(line);
  return id;
}

function backdateForAlerts(tenantId) {
  const schema = `tenant_${tenantId.replace(/-/g, "")}`;
  const statements = CASES.filter((s) => s.backdate).map((s) => {
    const sets = [];
    if (s.backdate.phaseStartedDays) sets.push(`phase_started_at = now() - interval '${s.backdate.phaseStartedDays} days'`);
    if (s.backdate.lastActionDays) sets.push(`last_action_at = now() - interval '${s.backdate.lastActionDays} days'`);
    return `UPDATE ${schema}.recovery_case SET ${sets.join(", ")} WHERE contract_id IN (SELECT id FROM ${schema}.contract WHERE reference_number = '${s.ref}');`;
  });
  const sql = statements.join("\n");
  const res = spawnSync("docker", ["exec", "-i", "leasrecover-postgres", "psql", "-U", "postgres", "-d", "leasrecover", "-v", "ON_ERROR_STOP=1"], {
    input: sql,
    encoding: "utf8",
  });
  if (res.error || res.status !== 0) {
    log(`backdating skipped (${res.error?.message ?? res.stderr.trim()}). Run this SQL against the database yourself:\n${sql}`);
    return false;
  }
  log(`backdated ${statements.length} cases (dormancy / legal-deadline alerts will appear on the next alert-engine sweep)`);
  return true;
}

// ---------------------------------------------------------------------------

async function main() {
  step(`super admin login at ${BASE}`);
  const superToken = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
  log(`logged in as ${SUPER_ADMIN.email}`);

  step("tenant");
  const tenantId = await ensureTenant(superToken);

  step("tenant admin + users");
  const adminToken = await login(TENANT.adminEmail, TENANT.adminPassword, tenantId);
  const gestionnaireIds = await ensureUsers(adminToken);
  const gestionnaireTokens = [];
  for (const g of GESTIONNAIRES) gestionnaireTokens.push(await login(g.email, g.password, tenantId));
  const tokens = { admin: adminToken, gestionnaires: gestionnaireTokens };

  step("tenant configuration");
  await configureTenant(adminToken);

  step("leasing records without a case");
  await seedLeasingOnly(adminToken);

  step("recovery cases");
  const existing = await existingCaseRefs(adminToken);
  let created = 0;
  for (const spec of CASES) {
    if (existing.has(spec.ref)) {
      log(`case ${spec.ref} exists — skipping`);
      continue;
    }
    await seedCase(spec, tokens, gestionnaireIds);
    created++;
  }

  if (created && !process.env.SEED_NO_BACKDATE) {
    step("backdating cases for the alert engine");
    backdateForAlerts(tenantId);
  }

  step("done");
  console.log(`
Tenant UUID (needed on the login screen): ${tenantId}

  Super admin      ${SUPER_ADMIN.email} / ${SUPER_ADMIN.password}   (toggle "Super Admin")
  Tenant admin     ${TENANT.adminEmail} / ${TENANT.adminPassword}
  Gestionnaire     ${GESTIONNAIRES[0].email} / ${GESTIONNAIRES[0].password}
  Gestionnaire     ${GESTIONNAIRES[1].email} / ${GESTIONNAIRES[1].password}
`);
}

main().catch((e) => {
  console.error(`\nSEED FAILED: ${e.message}`);
  process.exit(1);
});
