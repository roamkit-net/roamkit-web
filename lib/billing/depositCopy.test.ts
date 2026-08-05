import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { depositCopy } from "./depositCopy";

describe("depositCopy", () => {
  it("exposes Polygon PoS network warning without EIP-681 in headings", () => {
    assert.equal(depositCopy.networkWarningTitle, "Polygon PoS only");
    assert.equal(depositCopy.qrHeading, "Send using QR");
    assert.equal(depositCopy.cexHeading, "Deposit from exchange");
    assert.equal(depositCopy.cexNetworkBadge, "Polygon PoS");
    assert.equal(depositCopy.walletHeading, "Pay with wallet");
    assert.match(depositCopy.qrHeading, /QR/i);
    assert.doesNotMatch(depositCopy.qrHeading, /EIP-681/i);
    assert.doesNotMatch(depositCopy.cexHeading, /EIP-681/i);
  });

  it("includes CEX checklist and on-chain amount note", () => {
    assert.match(depositCopy.cexChecklistToken("USDT"), /USDT/);
    assert.match(depositCopy.cexAmountNote, /on-chain/i);
  });

  it("builds lead copy from token symbol and chain id", () => {
    const lead = depositCopy.networkWarningLead("USDT", 80002);
    assert.match(lead, /USDT/);
    assert.match(lead, /80002/);
    assert.match(lead, /Polygon PoS/);
  });
});
