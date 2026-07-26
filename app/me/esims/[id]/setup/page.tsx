"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AuthNav } from "@/components/AuthNav";
import { DetailSkeleton } from "@/components/ui/ListSkeleton";
import {
  ApiError,
  Esim,
  clearTokens,
  fetchMyEsim,
  isAuthenticated,
} from "@/lib/api";
import { detectInstallDevice, type InstallDeviceClass } from "@/lib/esim/device";
import {
  activationPolicyMessage,
  createEsimTelemetry,
  createSetupSessionId,
} from "@/lib/esim/telemetry";
import { loginHref } from "@/lib/navigation/safePath";

const STEPS = [
  "Install eSIM",
  "Enable eSIM",
  "Turn on Data Roaming",
  "Confirm everything works",
] as const;

export default function EsimSetupWizardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const esimId = params.id;
  const setupPath = `/me/esims/${esimId}/setup`;

  const [esim, setEsim] = useState<Esim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState<InstallDeviceClass>("desktop");
  const [qrZoomed, setQrZoomed] = useState(false);
  const sessionId = useRef(createSetupSessionId());
  const telemetry = useMemo(
    () => createEsimTelemetry(esimId, sessionId.current),
    [esimId],
  );
  const opened = useRef(false);

  useEffect(() => {
    setDevice(detectInstallDevice());
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref(setupPath));
      return;
    }

    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await fetchMyEsim(esimId);
        if (cancelled) {
          return;
        }
        setEsim(detail);
        const resume = detail.setup_resume_step;
        if (resume != null && resume >= 1 && resume <= 4) {
          setStep(resume);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(setupPath));
          return;
        }
        setError("Unable to load this eSIM right now.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [esimId, router, setupPath]);

  useEffect(() => {
    if (!esim || opened.current) {
      return;
    }
    opened.current = true;
    telemetry.track("install.opened", { resumeStep: step });
    if (esim.qrcode_url || esim.qrcode) {
      telemetry.track("install.qr_rendered", { resumeStep: 1 });
    }
  }, [esim, step, telemetry]);

  function goTo(next: number) {
    const clamped = Math.min(4, Math.max(1, next));
    setStep(clamped);
    telemetry.track("install.opened", {
      resumeStep: clamped,
      idempotencyKey: `${sessionId.current}:resume:${clamped}`,
    });
    if (clamped === 3) {
      telemetry.track("install.roaming_checklist_viewed", { resumeStep: 3 });
    }
  }

  function markInstalled() {
    telemetry.track("install.completed", { resumeStep: step });
    goTo(2);
  }

  function finish(skip: boolean) {
    if (skip) {
      telemetry.track("install.setup_skipped", { resumeStep: step });
    } else {
      telemetry.track("install.setup_confirmed", { resumeStep: 4 });
    }
    router.push(`/me/esims/${esimId}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link
            href={`/me/esims/${esimId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Skip to eSIM details
          </Link>
          <AuthNav />
        </div>

        {isLoading ? (
          <DetailSkeleton label="Loading setup…" />
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{error}</p>
          </div>
        ) : esim ? (
          <div className="mt-8 space-y-6">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Purchase complete
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Set up your eSIM
              </h1>
              <p className="mt-3 text-slate-600">
                Step {step} of {STEPS.length}: {STEPS[step - 1]}
              </p>
              <ol className="mt-4 flex flex-wrap gap-2">
                {STEPS.map((label, index) => {
                  const n = index + 1;
                  const active = n === step;
                  return (
                    <li
                      key={label}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        active
                          ? "bg-sky-700 text-white"
                          : n < step
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {n}. {label}
                    </li>
                  );
                })}
              </ol>
            </header>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Activation</p>
              <p className="mt-1">
                {activationPolicyMessage(esim.activation_policy)}
              </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {step === 1 ? (
                <div className="space-y-4">
                  {device === "desktop" ? (
                    <>
                      <h2 className="text-lg font-semibold">
                        Open Camera on your phone
                      </h2>
                      <p className="text-sm text-slate-600">
                        Scan this QR code with your phone to install the eSIM.
                      </p>
                    </>
                  ) : device === "iphone" ? (
                    <>
                      <h2 className="text-lg font-semibold">Install on iPhone</h2>
                      <p className="text-sm text-slate-600">
                        Use the Apple install link, or scan the QR from another
                        device.
                      </p>
                      {esim.direct_apple_installation_url ? (
                        <a
                          href={esim.direct_apple_installation_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                          onClick={() =>
                            telemetry.track("install.apple_install_clicked", {
                              resumeStep: 1,
                            })
                          }
                        >
                          Open installation
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold">
                        Install on Android
                      </h2>
                      <p className="text-sm text-slate-600">
                        Scan the QR code or enter the SM-DP+ details manually in
                        Settings → Network → SIMs.
                      </p>
                    </>
                  )}

                  {(esim.qrcode_url || esim.qrcode) && (
                    <button
                      type="button"
                      className="block"
                      onClick={() => {
                        setQrZoomed((z) => !z);
                        telemetry.track("install.qr_zoomed", { resumeStep: 1 });
                      }}
                    >
                      {esim.qrcode_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={esim.qrcode_url}
                          alt={`QR code for eSIM ${esim.iccid}`}
                          className={`rounded-lg border border-slate-200 bg-white object-contain p-2 ${
                            qrZoomed ? "h-72 w-72" : "h-48 w-48"
                          }`}
                        />
                      ) : null}
                    </button>
                  )}

                  {esim.lpa ? (
                    <p className="break-all text-xs text-slate-500">
                      LPA: {esim.lpa}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    onClick={() =>
                      telemetry.track("install.manual_install_clicked", {
                        resumeStep: 1,
                      })
                    }
                  >
                    Show manual install tips
                  </button>
                  {esim.manual_installation ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: esim.manual_installation,
                      }}
                    />
                  ) : null}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={markInstalled}
                      className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                    >
                      I installed the eSIM
                    </button>
                    <button
                      type="button"
                      onClick={() => finish(true)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Enable eSIM</h2>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                    <li>Open Settings → Cellular / Mobile Network.</li>
                    <li>Turn on the new RoamKit eSIM line.</li>
                    <li>Keep your primary SIM for calls if you prefer.</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => goTo(3)}
                    className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                  >
                    Next
                  </button>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Turn on Data Roaming</h2>
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    <li>
                      <span className="font-medium">Data roaming</span> — ON for
                      the RoamKit eSIM.
                    </li>
                    <li>
                      <span className="font-medium">Primary SIM</span> — calls /
                      SMS as usual.
                    </li>
                    <li>
                      <span className="font-medium">RoamKit eSIM</span> — Mobile
                      data.
                    </li>
                  </ol>
                  <button
                    type="button"
                    onClick={() => goTo(4)}
                    className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                  >
                    Next
                  </button>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Confirm everything works
                  </h2>
                  <p className="text-sm text-slate-600">
                    Open a website or map app on mobile data. You can refresh
                    usage anytime from your eSIM page.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => finish(false)}
                      className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => finish(true)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
