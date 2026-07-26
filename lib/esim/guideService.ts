/**
 * Sole UI entry for Android install guides.
 * Today: TypeScript registry. Later (PR F): may swap to REST (+ cache).
 */

import {
  ANDROID_GUIDES,
  GuideId,
  type AndroidGuide,
  type AndroidGuideId,
  type InstallAction,
} from "@/lib/esim/androidGuides";

function isAndroidGuideId(value: string): value is AndroidGuideId {
  return (Object.values(GuideId) as string[]).includes(value);
}

export function listAndroidGuides(): AndroidGuide[] {
  return [...ANDROID_GUIDES].sort((a, b) => a.order - b.order);
}

export function getAndroidGuide(id: string): AndroidGuide {
  const guides = listAndroidGuides();
  if (isAndroidGuideId(id)) {
    const found = guides.find((g) => g.id === id);
    if (found) {
      return found;
    }
  }
  return guides.find((g) => g.id === GuideId.OTHER)!;
}

export function resolveAndroidGuideId(brandOrAlias: string): AndroidGuideId {
  const needle = brandOrAlias.trim().toLowerCase();
  if (!needle) {
    return GuideId.OTHER;
  }
  for (const guide of listAndroidGuides()) {
    if (guide.id === needle) {
      return guide.id;
    }
    for (const brand of guide.supportedBrands) {
      if (brand.toLowerCase() === needle) {
        return guide.id;
      }
    }
  }
  return GuideId.OTHER;
}

export function guideHasInstallAction(
  guideId: string,
  action: InstallAction,
): boolean {
  return getAndroidGuide(guideId).installActions.includes(action);
}
