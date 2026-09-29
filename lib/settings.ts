import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";

const DEFAULT_MARGIN_PERCENT = 3.5;
const DEFAULT_DAILY_TARGET = 2000;

/** Reads the global profit margin (%). Falls back to 3.5% if unset or Firebase
 *  isn't configured yet, so the site always has a working rate calculation. */
export async function getMarginPercent(): Promise<number> {
  if (!firebaseEnabled || !db) return DEFAULT_MARGIN_PERCENT;
  try {
    const snap = await getDoc(doc(db, "settings", "margin"));
    if (!snap.exists()) return DEFAULT_MARGIN_PERCENT;
    const v = snap.data().percent;
    return typeof v === "number" ? v : DEFAULT_MARGIN_PERCENT;
  } catch {
    return DEFAULT_MARGIN_PERCENT;
  }
}

export async function setMarginPercent(percent: number) {
  if (!firebaseEnabled || !db) throw new Error("Firebase is not configured — see .env.example.");
  await setDoc(doc(db, "settings", "margin"), { percent, updatedAt: serverTimestamp() });
}

/** Reads the daily USD sales target. Falls back to $2000 if unset. */
export async function getDailyTarget(): Promise<number> {
  if (!firebaseEnabled || !db) return DEFAULT_DAILY_TARGET;
  try {
    const snap = await getDoc(doc(db, "settings", "dailyTarget"));
    if (!snap.exists()) return DEFAULT_DAILY_TARGET;
    const v = snap.data().amount;
    return typeof v === "number" ? v : DEFAULT_DAILY_TARGET;
  } catch {
    return DEFAULT_DAILY_TARGET;
  }
}

export async function setDailyTarget(amount: number) {
  if (!firebaseEnabled || !db) throw new Error("Firebase is not configured — see .env.example.");
  await setDoc(doc(db, "settings", "dailyTarget"), { amount, updatedAt: serverTimestamp() });
}


export interface BankAccount {
  id: string;
  bankName: string;
  details: string; // free-text: account name, number, branch code, etc.
}

/** Reads the list of bank accounts renters can pay into. Public data —
 *  shown on the self-booking page before any auth. */
export async function getBankAccounts(): Promise<BankAccount[]> {
  if (!firebaseEnabled || !db) return [];
  try {
    const snap = await getDoc(doc(db, "settings", "bankAccounts"));
    if (!snap.exists()) return [];
    const accounts = snap.data().accounts;
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

export async function setBankAccounts(accounts: BankAccount[]) {
  if (!firebaseEnabled || !db) throw new Error("Firebase is not configured — see .env.example.");
  await setDoc(doc(db, "settings", "bankAccounts"), { accounts, updatedAt: serverTimestamp() });
}

export interface Student {
  id: string;
  name: string;
  phone: string;
}

/** Known students for name/phone autocomplete on the booking page. Public
 *  read (needed for the autocomplete to work without login) — so treat
 *  this as a convenience list, not a secured contact database. */
export async function getStudents(): Promise<Student[]> {
  if (!firebaseEnabled || !db) return [];
  try {
    const snap = await getDoc(doc(db, "settings", "students"));
    if (!snap.exists()) return [];
    const students = snap.data().students;
    return Array.isArray(students) ? students : [];
  } catch {
    return [];
  }
}

export async function setStudents(students: Student[]) {
  if (!firebaseEnabled || !db) throw new Error("Firebase is not configured — see .env.example.");
  await setDoc(doc(db, "settings", "students"), { students, updatedAt: serverTimestamp() });
}

/** Flow keys look like "SDG_MYR" (from_to) — one per DIRECTION, so a pair
 *  can be open one way and closed the other. Anything not listed is active.
 *  Public read so the calculator can mark closed directions. */
export function flowKey(from: string, to: string) {
  return `${from}_${to}`;
}

export async function getDisabledFlows(): Promise<string[]> {
  if (!firebaseEnabled || !db) return [];
  try {
    const snap = await getDoc(doc(db, "settings", "flows"));
    if (!snap.exists()) return [];
    const list = snap.data().disabled;
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setDisabledFlows(disabled: string[]) {
  if (!firebaseEnabled || !db) throw new Error("Firebase is not configured — see .env.example.");
  await setDoc(doc(db, "settings", "flows"), { disabled, updatedAt: serverTimestamp() });
}
