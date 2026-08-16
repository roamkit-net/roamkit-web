"use client";

export default function LocationError() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        This destination is temporarily unavailable
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        We could not load plans right now. Please try again shortly.
      </p>
    </main>
  );
}
