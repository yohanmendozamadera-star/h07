import { COUNTRIES, DEFAULT_COUNTRY, type CountryCode } from "@/lib/locale/countries";

// Un Intl.NumberFormat/DateTimeFormat por país, construido perezosamente la
// primera vez que se pide (máximo 17 entradas — una por país soportado — sin
// riesgo de fuga de memoria).
const currencyFormatters = new Map<CountryCode, Intl.NumberFormat>();
function currencyFormatterFor(countryCode: CountryCode) {
  let formatter = currencyFormatters.get(countryCode);
  if (!formatter) {
    const { locale, currency } = COUNTRIES[countryCode];
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    currencyFormatters.set(countryCode, formatter);
  }
  return formatter;
}

// Sin `timeZone`, Intl usa la zona horaria del servidor (en producción,
// UTC) — un timestamp guardado a las 8:34pm hora local se mostraba como la
// 1:34am del día siguiente. Forzamos la zona horaria del país de la empresa.
const dateFormatters = new Map<CountryCode, Intl.DateTimeFormat>();
function dateFormatterFor(countryCode: CountryCode) {
  let formatter = dateFormatters.get(countryCode);
  if (!formatter) {
    const { locale, timeZone } = COUNTRIES[countryCode];
    formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone,
    });
    dateFormatters.set(countryCode, formatter);
  }
  return formatter;
}

const dateTimeFormatters = new Map<CountryCode, Intl.DateTimeFormat>();
function dateTimeFormatterFor(countryCode: CountryCode) {
  let formatter = dateTimeFormatters.get(countryCode);
  if (!formatter) {
    const { locale, timeZone } = COUNTRIES[countryCode];
    formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });
    dateTimeFormatters.set(countryCode, formatter);
  }
  return formatter;
}

// Para columnas `date` puras (sin hora, ej. due_date, expense_date): no
// representan un instante real, solo un día de calendario, así que se
// muestran tal cual se guardaron — sin convertir a ningún huso horario (por
// eso siempre usa timeZone: "UTC" sobre una fecha construida en UTC).
const plainDateFormatters = new Map<CountryCode, Intl.DateTimeFormat>();
function plainDateFormatterFor(countryCode: CountryCode) {
  let formatter = plainDateFormatters.get(countryCode);
  if (!formatter) {
    const { locale } = COUNTRIES[countryCode];
    formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
    plainDateFormatters.set(countryCode, formatter);
  }
  return formatter;
}

export function formatCurrency(value: number | null | undefined, countryCode: CountryCode = DEFAULT_COUNTRY) {
  return currencyFormatterFor(countryCode).format(value ?? 0);
}

export function formatDate(value: string | null | undefined, countryCode: CountryCode = DEFAULT_COUNTRY) {
  if (!value) return "—";
  if (value.includes("T")) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return dateFormatterFor(countryCode).format(date);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return plainDateFormatterFor(countryCode).format(date);
}

export function formatDateTime(value: string | null | undefined, countryCode: CountryCode = DEFAULT_COUNTRY) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatterFor(countryCode).format(date);
}

const isoDatePartsFormatters = new Map<CountryCode, Intl.DateTimeFormat>();
function isoDatePartsFormatterFor(countryCode: CountryCode) {
  let formatter = isoDatePartsFormatters.get(countryCode);
  if (!formatter) {
    const { timeZone } = COUNTRIES[countryCode];
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    isoDatePartsFormatters.set(countryCode, formatter);
  }
  return formatter;
}

/** Fecha de hoy en la zona horaria del país de la empresa, en formato AAAA-MM-DD. */
export function getToday(countryCode: CountryCode = DEFAULT_COUNTRY): string {
  return isoDatePartsFormatterFor(countryCode).format(new Date());
}

/** Día 1 del mes actual (hora del país de la empresa), en formato AAAA-MM-DD. */
export function getMonthStart(countryCode: CountryCode = DEFAULT_COUNTRY): string {
  const [year, month] = getToday(countryCode).split("-");
  return `${year}-${month}-01`;
}

// created_at es un timestamptz en UTC — tomar sus primeros 10 caracteres
// directamente agrupa mal las órdenes creadas cerca de medianoche hora local
// (caen del lado siguiente del día en UTC). Esta función convierte primero a
// la fecha calendario real en la zona horaria del país de la empresa.
export function toDateString(date: Date, countryCode: CountryCode = DEFAULT_COUNTRY): string {
  return isoDatePartsFormatterFor(countryCode).format(date);
}

const monthLabelFormatters = new Map<CountryCode, Intl.DateTimeFormat>();
function monthLabelFormatterFor(countryCode: CountryCode) {
  let formatter = monthLabelFormatters.get(countryCode);
  if (!formatter) {
    const { locale, timeZone } = COUNTRIES[countryCode];
    formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      month: "short",
      year: "numeric",
    });
    monthLabelFormatters.set(countryCode, formatter);
  }
  return formatter;
}

/** "AAAA-MM" -> "may 2026", para ejes de gráficas mensuales. */
export function formatMonthLabel(yearMonth: string, countryCode: CountryCode = DEFAULT_COUNTRY): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return monthLabelFormatterFor(countryCode).format(new Date(Date.UTC(year, month - 1, 15)));
}
