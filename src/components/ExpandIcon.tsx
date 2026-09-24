interface ExpandIconProps {
  expanded?: boolean;
  className?: string;
}

/** Diagonal expand / collapse arrows (matches product icon). */
export function ExpandIcon({ expanded = false, className = "h-4 w-4" }: ExpandIconProps) {
  if (expanded) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        <path d="M15 9l6-6" />
        <path d="M21 3h-5v5" />
        <path d="M9 15l-6 6" />
        <path d="M3 21h5v-5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}
