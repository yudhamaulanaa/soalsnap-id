"use client";

/** Sakelar 46×26px (UIKit.md §4). */
export function Switch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors ${
        on ? "bg-teal" : "bg-fill-4"
      }`}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-[left] duration-200"
        style={{ left: on ? 23 : 3 }}
      />
    </button>
  );
}
