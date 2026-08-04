import { z } from "zod";

export const changePlanSchema = z.object({
  planCode: z.enum(["free", "h7"]),
  addonEnabled: z.boolean(),
});

export type ChangePlanValues = z.input<typeof changePlanSchema>;
