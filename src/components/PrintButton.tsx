"use client";
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-secondary py-1.5 px-3 text-sm"
    >
      Drucken
    </button>
  );
}
