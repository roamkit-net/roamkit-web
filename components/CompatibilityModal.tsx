"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  compatibleDevices,
  filterCompatibleDevices,
  type DevicePlatform,
} from "@/lib/compatible-devices";

export function CompatibilityModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const searchId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [platform, setPlatform] = useState<DevicePlatform>("ios");
  const [query, setQuery] = useState("");

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const filtered = useMemo(
    () => filterCompatibleDevices(compatibleDevices[platform], query),
    [platform, query],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Check compatibility
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 border-b border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">
          <p>
            To use a RoamKit eSIM, a device must meet the following conditions:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The device supports eSIMs.</li>
            <li>The device is not carrier or network-locked.</li>
            <li>The device is not jailbroken (iOS) or rooted (Android).</li>
          </ul>
          <p>
            You can use our list to see if the device you want to use is
            eSIM-compatible. Note, some regional models may not support eSIMs.
          </p>
          <p>
            <span className="font-semibold text-slate-800">
              Don&apos;t see your device?
            </span>{" "}
            Our list is updated regularly, but not exhaustive — check with the
            device manufacturer to confirm it supports eSIMs.
          </p>
        </div>

        <div
          className="flex gap-6 border-b border-slate-200 px-5"
          role="tablist"
          aria-label="Device platform"
        >
          <PlatformTab
            active={platform === "ios"}
            onClick={() => setPlatform("ios")}
          >
            iOS
          </PlatformTab>
          <PlatformTab
            active={platform === "android"}
            onClick={() => setPlatform("android")}
          >
            Android
          </PlatformTab>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <label htmlFor={searchId} className="sr-only">
            Search devices
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by brand or device"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-amber-500 placeholder:text-slate-400 focus:ring-2"
          />
        </div>

        <div className="overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No devices match your search.
            </p>
          ) : (
            <ul className="space-y-5">
              {filtered.map((group) => (
                <li key={group.brand}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.brand}
                  </h3>
                  <ul className="mt-2 divide-y divide-slate-100">
                    {group.devices.map((device) => (
                      <li
                        key={device}
                        className="py-2.5 text-sm font-medium text-slate-900"
                      >
                        {device}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PlatformTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "-mb-px border-b-2 border-slate-900 pb-3 pt-3 text-sm font-semibold text-slate-900 outline-none focus-visible:outline-none"
          : "-mb-px border-b-2 border-transparent pb-3 pt-3 text-sm font-medium text-slate-400 outline-none transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:text-slate-700"
      }
    >
      {children}
    </button>
  );
}
