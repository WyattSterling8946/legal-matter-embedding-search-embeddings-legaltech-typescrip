import { describe, expect, it } from "vitest";
import { decideDeadline } from "../src/legal_document_index.js";

describe("deadline follow-up decision", () => {
  it("requests follow-up when a signed delivery deadline is five days away", () => {
    expect(decideDeadline("2026-08-18", "2026-08-13")).toEqual({
      action: "follow_up",
      daysRemaining: 5
    });
  });

  it("keeps a distant matter deadline under monitoring", () => {
    expect(decideDeadline("2026-09-01", "2026-08-13")).toEqual({
      action: "monitor",
      daysRemaining: 19
    });
  });
});
