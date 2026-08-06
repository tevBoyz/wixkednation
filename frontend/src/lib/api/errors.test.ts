import { describe, expect, it } from "vitest";

import {
  ApiError,
  getErrorMessage,
  getOrderSubmitErrorMessage,
  isTechnicalErrorMessage,
  sanitizeUserFacingMessage,
} from "@/lib/api/errors";

describe("isTechnicalErrorMessage", () => {
  it("flags Prisma / stack-style messages", () => {
    expect(
      isTechnicalErrorMessage(
        "Invalid `prisma.adminSettings.update()` invocation",
      ),
    ).toBe(true);
    expect(isTechnicalErrorMessage("Unknown argument `defaultCurrency`")).toBe(
      true,
    );
  });

  it("allows short user-facing validation messages", () => {
    expect(
      isTechnicalErrorMessage("defaultCurrency must be one of: ETB, USD"),
    ).toBe(false);
  });
});

describe("sanitizeUserFacingMessage", () => {
  it("replaces technical messages with fallback", () => {
    expect(
      sanitizeUserFacingMessage(
        "Invalid `prisma.adminSettings.update()` invocation",
        "Could not save settings",
      ),
    ).toBe("Could not save settings");
  });

  it("replaces 500-class responses with fallback", () => {
    expect(
      sanitizeUserFacingMessage("Something exploded", "Request failed", 500),
    ).toBe("Request failed");
  });

  it("keeps safe 4xx messages", () => {
    expect(
      sanitizeUserFacingMessage("Phone is required", "Request failed", 400),
    ).toBe("Phone is required");
  });
});

describe("getOrderSubmitErrorMessage", () => {
  it("returns delivery-area message from 400 ApiError body", () => {
    const deliveryMessage =
      "This ZIP code is outside our delivery area. We currently deliver in Northern Virginia, Washington DC, and South Maryland.";
    const error = new ApiError("Request failed", {
      status: 400,
      body: { success: false, message: deliveryMessage },
    });

    expect(getOrderSubmitErrorMessage(error)).toBe(deliveryMessage);
  });

  it("falls back when 400 body message is technical", () => {
    const error = new ApiError("Request failed", {
      status: 400,
      body: {
        success: false,
        message: "Invalid `prisma.order.create()` invocation",
      },
    });

    expect(getOrderSubmitErrorMessage(error)).toBe("Could not place order");
  });
});

describe("getErrorMessage", () => {
  it("reads ApiError message when safe", () => {
    const error = new ApiError("That value is already in use.", {
      status: 409,
    });
    expect(getErrorMessage(error, "Fallback")).toBe(
      "That value is already in use.",
    );
  });

  it("falls back for technical ApiError messages", () => {
    const error = new ApiError(
      "Invalid `prisma.adminSettings.update()` invocation",
      { status: 500 },
    );
    expect(getErrorMessage(error, "Could not save settings")).toBe(
      "Could not save settings",
    );
  });
});
