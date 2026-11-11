import * as React from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import {
  isValidUsPhone,
  stripToUsLocalDigits,
  toUsE164,
} from "@/lib/phone";
import { cn } from "@/lib/utils";

type UsPhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function UsPhoneInput({
  className,
  value = "",
  onChange,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  placeholder = "7035551234",
  ...props
}: UsPhoneInputProps) {
  const localDigits = stripToUsLocalDigits(value);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(stripToUsLocalDigits(event.target.value));
  }

  return (
    <div className="flex w-full">
      <span
        className={cn(
          "inline-flex h-8 shrink-0 items-center rounded-l-lg border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground",
          disabled && "opacity-50",
          ariaInvalid && "border-destructive",
        )}
        aria-hidden
      >
        +1 US
      </span>
      <Input
        {...props}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className={cn("rounded-l-none", className)}
        value={localDigits}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        placeholder={placeholder}
        maxLength={10}
      />
    </div>
  );
}

export function usPhoneLocalSchema(message = "Enter a valid 10-digit US number") {
  return z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => stripToUsLocalDigits(value).length === 10, {
      message: "Enter a 10-digit US phone number",
    })
    .refine((value) => isValidUsPhone(toUsE164(stripToUsLocalDigits(value))), {
      message,
    });
}

export function optionalUsPhoneLocalSchema(
  message = "Enter a valid 10-digit US number",
) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        !value || (stripToUsLocalDigits(value).length === 10 &&
          isValidUsPhone(toUsE164(stripToUsLocalDigits(value)))),
      { message },
    );
}
