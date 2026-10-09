import { cn } from "@/utils/ui";

/** Editor mark. Filled with currentColor, so it follows the surrounding text color in light and dark. */
export function EditorLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2H22A8 8 0 0 1 30 10V22A8 8 0 0 1 22 30H10A8 8 0 0 1 2 22V10A8 8 0 0 1 10 2ZM12.50 11.20Q12.50 9.00 14.33 10.22L21.17 14.78Q23.00 16.00 21.17 17.22L14.33 21.78Q12.50 23.00 12.50 20.80Z"
      />
    </svg>
  );
}
