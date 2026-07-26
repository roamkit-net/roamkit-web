import type { AndroidGuide, AndroidGuideId } from "@/lib/esim/androidGuides";
import { listAndroidGuides } from "@/lib/esim/guideService";

type AndroidManufacturerPickerProps = {
  guides?: AndroidGuide[];
  onSelect: (id: AndroidGuideId) => void;
  className?: string;
};

export function AndroidManufacturerPicker({
  guides = listAndroidGuides(),
  onSelect,
  className = "",
}: AndroidManufacturerPickerProps) {
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-900">
        Choose your phone
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Select your manufacturer for step-by-step install instructions.
      </p>
      <ul className="mt-4 space-y-2">
        {guides.map((guide) => (
          <li key={guide.id}>
            <button
              type="button"
              onClick={() => onSelect(guide.id)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:border-sky-600 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              {guide.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
