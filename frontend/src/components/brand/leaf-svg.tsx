import { cn } from "@/lib/utils";

/** Cannabis leaf motif used on the storefront floating background. */
export function LeafSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block size-full", className)}
    >
      <path
        d="M32 6c1.2 6.5 2.2 12.2 2.4 18.2.1 2.4-.1 4.8-.6 7.1 4.8-3.8 9.6-5.8 14.8-6.2-3.4 5.2-7.8 8.6-13.2 10.6 4.6 1.4 8.6 4.2 11.6 8.2-5.6-.6-10.4-2.6-14.4-5.8.8 4.6.6 9.2-.4 13.9-2.2-4.2-4.2-8.4-5.2-13.1-4 3.2-8.8 5.2-14.4 5.8 3-4 7-6.8 11.6-8.2C18.6 33.7 14.2 30.3 10.8 25.1c5.2.4 10 2.4 14.8 6.2-.5-2.3-.7-4.7-.6-7.1.2-6 1.2-11.7 2.4-18.2.8 5.4 2.2 10.4 4.6 15.1C34.4 16.4 35.8 11.4 36.6 6 35.2 6 33.6 6 32 6Z"
        fill="currentColor"
      />
      <path
        d="M32 14v36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
