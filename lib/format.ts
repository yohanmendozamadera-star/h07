const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(value ?? 0);
}

// Para columnas `date` (sin hora, ej. due_date): "AAAA-MM-DD" sin sufijo se
// interpreta como medianoche UTC, y en un huso horario negativo se muestra
// un día antes. Forzamos T00:00:00 (hora local) para evitar ese corrimiento.
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
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
