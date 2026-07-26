import { GuideRenderer } from "@/components/esim/GuideRenderer";
import type { AndroidGuideId } from "@/lib/esim/androidGuides";
import { getAndroidGuide } from "@/lib/esim/guideService";

type AndroidInstallGuideProps = {
  guideId: AndroidGuideId;
  onChangePhone: () => void;
  className?: string;
};

export function AndroidInstallGuide({
  guideId,
  onChangePhone,
  className = "",
}: AndroidInstallGuideProps) {
  const guide = getAndroidGuide(guideId);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{guide.title}</p>
        <button
          type="button"
          onClick={onChangePhone}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          Change phone
        </button>
      </div>
      <GuideRenderer className="mt-3" title="Install steps" steps={guide.steps} />
    </div>
  );
}
