import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ANDROID_GUIDES, GuideId } from "@/lib/esim/androidGuides";
import {
  getAndroidGuide,
  guideHasInstallAction,
  listAndroidGuides,
  resolveAndroidGuideId,
} from "@/lib/esim/guideService";

describe("android guides registry", () => {
  it("validates required fields and uniqueness", () => {
    const ids = new Set<string>();
    const brands = new Set<string>();

    for (const guide of ANDROID_GUIDES) {
      assert.ok(guide.id, "id required");
      assert.ok(guide.title.trim(), "title required");
      assert.ok(guide.steps.length >= 1, `${guide.id} needs steps`);
      assert.ok(Number.isFinite(guide.order), `${guide.id} needs order`);
      assert.ok(
        Array.isArray(guide.installActions) && guide.installActions.length > 0,
        `${guide.id} needs installActions`,
      );

      assert.equal(ids.has(guide.id), false, `duplicate id ${guide.id}`);
      ids.add(guide.id);

      for (const brand of guide.supportedBrands) {
        assert.ok(brand.trim(), `${guide.id} empty brand`);
        const key = brand.toLowerCase();
        assert.equal(brands.has(key), false, `duplicate brand ${brand}`);
        brands.add(key);
      }

      for (const step of guide.steps) {
        assert.ok(step.body.trim(), `${guide.id} empty step body`);
        if (step.title != null) {
          assert.ok(step.title.trim(), `${guide.id} empty step title`);
        }
      }
    }

    assert.ok(ids.has(GuideId.SAMSUNG));
    assert.ok(ids.has(GuideId.PIXEL));
    assert.ok(ids.has(GuideId.OTHER));
  });

  it("listAndroidGuides sorts by order", () => {
    const listed = listAndroidGuides();
    const orders = listed.map((g) => g.order);
    assert.deepEqual(
      orders,
      [...orders].sort((a, b) => a - b),
    );
    assert.equal(listed[0]?.id, GuideId.SAMSUNG);
    assert.equal(listed.at(-1)?.id, GuideId.OTHER);
  });

  it("getAndroidGuide and resolveAndroidGuideId", () => {
    assert.equal(getAndroidGuide(GuideId.PIXEL).id, GuideId.PIXEL);
    assert.equal(getAndroidGuide("unknown-slug").id, GuideId.OTHER);
    assert.equal(resolveAndroidGuideId("Galaxy"), GuideId.SAMSUNG);
    assert.equal(resolveAndroidGuideId("google"), GuideId.PIXEL);
    assert.equal(resolveAndroidGuideId("Nokia"), GuideId.OTHER);
    assert.equal(resolveAndroidGuideId(""), GuideId.OTHER);
  });

  it("guideHasInstallAction is guide/qr content only (not deep-link)", () => {
    assert.equal(guideHasInstallAction(GuideId.SAMSUNG, "guide"), true);
    assert.equal(guideHasInstallAction(GuideId.SAMSUNG, "qr"), true);
    assert.equal(guideHasInstallAction(GuideId.PIXEL, "guide"), true);
    assert.equal(guideHasInstallAction(GuideId.OTHER, "guide"), true);
    for (const guide of ANDROID_GUIDES) {
      assert.equal(
        guide.installActions.includes("deep-link" as never),
        false,
        `${guide.id} must not own deep-link capability`,
      );
    }
  });
});
