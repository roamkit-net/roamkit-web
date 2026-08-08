import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  activeUntilFromUiDate,
  uiDateFromActiveUntil,
} from "./autoTopupActiveUntil";

describe("autoTopupActiveUntil mapping", () => {
  it("maps UI date D to exclusive start of D+1 UTC", () => {
    assert.equal(
      activeUntilFromUiDate("2026-08-20"),
      "2026-08-21T00:00:00.000Z",
    );
  });

  it("maps month-end D to next month exclusive bound", () => {
    assert.equal(
      activeUntilFromUiDate("2026-01-31"),
      "2026-02-01T00:00:00.000Z",
    );
  });

  it("returns null for empty or invalid dates", () => {
    assert.equal(activeUntilFromUiDate(""), null);
    assert.equal(activeUntilFromUiDate("  "), null);
    assert.equal(activeUntilFromUiDate("20/08/2026"), null);
    assert.equal(activeUntilFromUiDate("2026-02-31"), null);
  });

  it("maps exclusive bound back to UI date D", () => {
    assert.equal(uiDateFromActiveUntil("2026-08-21T00:00:00.000Z"), "2026-08-20");
    assert.equal(uiDateFromActiveUntil(null), "");
    assert.equal(uiDateFromActiveUntil(undefined), "");
  });

  it("round-trips UI date through exclusive bound", () => {
    const dates = ["2026-08-20", "2026-12-31", "2027-01-01"];
    for (const d of dates) {
      const bound = activeUntilFromUiDate(d);
      assert.ok(bound);
      assert.equal(uiDateFromActiveUntil(bound), d);
    }
  });
});
