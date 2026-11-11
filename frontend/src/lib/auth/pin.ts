import { z } from "zod";

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export const pinSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`),
    `PIN must be ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits`,
  );

export const pinConfirmSchema = z
  .object({
    pin: pinSchema,
    confirmPin: z.string().trim(),
  })
  .refine((values) => values.pin === values.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });
