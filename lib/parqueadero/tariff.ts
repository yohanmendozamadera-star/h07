export type ParkingRateType = "hora" | "dia" | "mes";

export type ParkingCharge = {
  billableMinutes: number;
  units: number;
  amount: number;
};

/**
 * Única función de dominio para el cobro de parqueadero: la usan tanto el
 * preview en vivo (mientras el vehículo sigue estacionado) como el Server
 * Action que cobra al cerrar el movimiento. El legado tenía dos fórmulas
 * distintas (una con tolerancia en pantalla, otra sin tolerancia al cobrar)
 * que nunca coincidían — aquí solo existe esta.
 *
 * Regla: los primeros `graceMinutes` minutos no cuentan para la tarifa (se
 * restan del tiempo transcurrido antes de calcular las unidades a cobrar).
 */
export function calculateParkingCharge({
  entryAt,
  exitAt,
  graceMinutes,
  rateType,
  rateAmount,
}: {
  entryAt: Date;
  exitAt: Date;
  graceMinutes: number;
  rateType: ParkingRateType;
  rateAmount: number;
}): ParkingCharge {
  const elapsedMinutes = Math.max(0, Math.floor((exitAt.getTime() - entryAt.getTime()) / 60000));
  const billableMinutes = Math.max(0, elapsedMinutes - graceMinutes);

  let units: number;
  if (billableMinutes === 0) {
    units = 0;
  } else if (rateType === "hora") {
    units = Math.ceil(billableMinutes / 60);
  } else if (rateType === "dia") {
    units = Math.ceil(billableMinutes / 1440);
  } else {
    units = 1;
  }

  return { billableMinutes, units, amount: units * rateAmount };
}
