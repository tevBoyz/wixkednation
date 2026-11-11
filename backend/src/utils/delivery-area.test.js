const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  assertDeliveryZip,
  isAllowedDeliveryZip,
  normalizeZip,
} = require("./delivery-area");

describe("delivery-area zip validation", () => {
  it("normalizes 5-digit and ZIP+4 formats", () => {
    assert.equal(normalizeZip("22201"), "22201");
    assert.equal(normalizeZip("22201-1234"), "22201");
    assert.equal(normalizeZip(" 22201 "), "22201");
  });

  it("accepts Arlington and DC ZIPs in the service area", () => {
    assert.equal(isAllowedDeliveryZip("22201"), true);
    assert.equal(isAllowedDeliveryZip("20001"), true);
    assert.equal(isAllowedDeliveryZip("20171"), true);
  });

  it("rejects ZIPs outside the service area", () => {
    assert.equal(isAllowedDeliveryZip("90210"), false);
    assert.equal(isAllowedDeliveryZip("10001"), false);
  });

  it("assertDeliveryZip throws for missing or invalid ZIP", () => {
    assert.throws(() => assertDeliveryZip(""), /postalCode is required/);
    assert.throws(() => assertDeliveryZip("123"), /valid 5-digit/);
    assert.throws(() => assertDeliveryZip("90210"), /outside our delivery area/);
    assert.equal(assertDeliveryZip("22201-4567"), "22201");
  });
});
