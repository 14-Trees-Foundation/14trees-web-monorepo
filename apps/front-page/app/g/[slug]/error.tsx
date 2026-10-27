"use client";

export default function GiftingPageError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-3 text-gray-600">
        Please try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-[#339933] px-5 py-2 text-white"
      >
        Try again
      </button>
    </main>
  );
}
