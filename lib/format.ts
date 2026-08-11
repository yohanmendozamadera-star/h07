const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Sin `timeZone`, Intl usa la zona horaria del servidor (en producción,
// UTC) — un timestamp guardado a las 8:34pm hora Colombia se mostraba como
// la 1:34am del día siguiente. Forzamos America/Bogota explícitamente.
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Bogota",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

// Para columnas `date` puras (sin hora, ej. due_date, expense_date): no
// representan un instante real, solo un día de calendario, así que se
// muestran tal cual se guardaron — sin convertir a ningún huso horario
// (por eso usa timeZone: "UTC" sobre una fecha construida en UTC, en vez
// del formatter de arriba que sí convierte a hora de Colombia).
const plainDateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  if (value.includes("T")) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return dateFormatter.format(date);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return plainDateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

const isoDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha de hoy en zona horaria de Colombia, en formato AAAA-MM-DD. */
export function getTodayBogota(): string {
  return isoDatePartsFormatter.format(new Date());
}

/** Día 1 del mes actual (hora de Colombia), en formato AAAA-MM-DD. */
export function getMonthStartBogota(): string {
  const [year, month] = getTodayBogota().split("-");
  return `${year}-${month}-01`;
}

// created_at es un timestamptz en UTC — tomar sus primeros 10 caracteres
// directamente agrupa mal las órdenes creadas entre las 7pm y medianoche
// hora Colombia (caen del lado siguiente del día en UTC). Esta función
// convierte primero a la fecha calendario real en Bogotá.
export function toBogotaDateString(date: Date): string {
  return isoDatePartsFormatter.format(date);
}

const monthLabelFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  month: "short",
  year: "numeric",
});

/** "AAAA-MM" -> "may 2026", para ejes de gráficas mensuales. */
export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return monthLabelFormatter.format(new Date(Date.UTC(year, month - 1, 15)));
}
