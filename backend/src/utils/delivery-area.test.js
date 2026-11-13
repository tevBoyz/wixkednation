const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  assertDeliveryZip,
  isAllowedDeliveryZip,
  normalizeZip,
} = require("./delivery-area");

describe("delivery-area zip validation", () => {
  it("normalizes 5-digit and ZIP+4 formats", () => {
    assert.equal(normalizeZip("43215"), "43215");
    assert.equal(normalizeZip("43215-1234"), "43215");
    assert.equal(normalizeZip(" 43215 "), "43215");
  });

  it("accepts Ohio ZIPs in the service area", () => {
    assert.equal(isAllowedDeliveryZip("43215"), true);
    assert.equal(isAllowedDeliveryZip("44114"), true);
    assert.equal(isAllowedDeliveryZip("45202"), true);
  });

  it("rejects ZIPs outside the service area", () => {
    assert.equal(isAllowedDeliveryZip("90210"), false);
    assert.equal(isAllowedDeliveryZip("10001"), false);
    assert.equal(isAllowedDeliveryZip("22201"), false);
  });

  it("assertDeliveryZip throws for missing or invalid ZIP", () => {
    assert.throws(() => assertDeliveryZip(""), /postalCode is required/);
    assert.throws(() => assertDeliveryZip("123"), /valid 5-digit/);
    assert.throws(() => assertDeliveryZip("90210"), /outside our delivery area/);
    assert.equal(assertDeliveryZip("43215-4567"), "43215");
  });
});
