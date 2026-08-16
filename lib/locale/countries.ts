export const COUNTRY_CODES = [
  "MX",
  "GT",
  "SV",
  "HN",
  "NI",
  "CR",
  "PA",
  "DO",
  "CO",
  "VE",
  "EC",
  "PE",
  "BO",
  "PY",
  "UY",
  "AR",
  "CL",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export const DEFAULT_COUNTRY: CountryCode = "CO";

type CountryConfig = {
  name: string;
  /** Código de moneda ISO 4217. */
  currency: string;
  /** Locale de Intl (formato de fecha/moneda). */
  locale: string;
  /** Zona horaria IANA. */
  timeZone: string;
  /** Indicativo telefónico, sin el símbolo +. */
  callingCode: string;
  /** Número de ejemplo (sin indicativo) para placeholders de formularios. */
  phoneExample: string;
};

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  MX: {
    name: "México",
    currency: "MXN",
    locale: "es-MX",
    // México tiene varias zonas horarias; se usa la de Ciudad de México (la
    // más poblada) como valor por defecto. Negocios en Tijuana/Chihuahua
    // verán reportes con 1-2h de desfase — limitación conocida.
    timeZone: "America/Mexico_City",
    callingCode: "52",
    phoneExample: "5512345678",
  },
  GT: {
    name: "Guatemala",
    currency: "GTQ",
    locale: "es-GT",
    timeZone: "America/Guatemala",
    callingCode: "502",
    phoneExample: "55123456",
  },
  SV: {
    name: "El Salvador",
    currency: "USD",
    locale: "es-SV",
    timeZone: "America/El_Salvador",
    callingCode: "503",
    phoneExample: "71234567",
  },
  HN: {
    name: "Honduras",
    currency: "HNL",
    locale: "es-HN",
    timeZone: "America/Tegucigalpa",
    callingCode: "504",
    phoneExample: "91234567",
  },
  NI: {
    name: "Nicaragua",
    currency: "NIO",
    locale: "es-NI",
    timeZone: "America/Managua",
    callingCode: "505",
    phoneExample: "81234567",
  },
  CR: {
    name: "Costa Rica",
    currency: "CRC",
    locale: "es-CR",
    timeZone: "America/Costa_Rica",
    callingCode: "506",
    phoneExample: "83001234",
  },
  PA: {
    name: "Panamá",
    currency: "PAB",
    locale: "es-PA",
    timeZone: "America/Panama",
    callingCode: "507",
    phoneExample: "61234567",
  },
  DO: {
    name: "República Dominicana",
    currency: "DOP",
    locale: "es-DO",
    timeZone: "America/Santo_Domingo",
    callingCode: "1",
    phoneExample: "8091234567",
  },
  CO: {
    name: "Colombia",
    currency: "COP",
    locale: "es-CO",
    timeZone: "America/Bogota",
    callingCode: "57",
    phoneExample: "3001234567",
  },
  VE: {
    name: "Venezuela",
    currency: "VES",
    locale: "es-VE",
    timeZone: "America/Caracas",
    callingCode: "58",
    phoneExample: "4121234567",
  },
  EC: {
    name: "Ecuador",
    currency: "USD",
    locale: "es-EC",
    timeZone: "America/Guayaquil",
    callingCode: "593",
    phoneExample: "991234567",
  },
  PE: {
    name: "Perú",
    currency: "PEN",
    locale: "es-PE",
    timeZone: "America/Lima",
    callingCode: "51",
    phoneExample: "987654321",
  },
  BO: {
    name: "Bolivia",
    currency: "BOB",
    locale: "es-BO",
    timeZone: "America/La_Paz",
    callingCode: "591",
    phoneExample: "71234567",
  },
  PY: {
    name: "Paraguay",
    currency: "PYG",
    locale: "es-PY",
    timeZone: "America/Asuncion",
    callingCode: "595",
    phoneExample: "981123456",
  },
  UY: {
    name: "Uruguay",
    currency: "UYU",
    locale: "es-UY",
    timeZone: "America/Montevideo",
    callingCode: "598",
    phoneExample: "91234567",
  },
  AR: {
    name: "Argentina",
    currency: "ARS",
    locale: "es-AR",
    timeZone: "America/Argentina/Buenos_Aires",
    callingCode: "54",
    phoneExample: "91123456789",
  },
  CL: {
    name: "Chile",
    currency: "CLP",
    locale: "es-CL",
    timeZone: "America/Santiago",
    callingCode: "56",
    phoneExample: "912345678",
  },
};

export function isCountryCode(value: string): value is CountryCode {
  return (COUNTRY_CODES as readonly string[]).includes(value);
}
