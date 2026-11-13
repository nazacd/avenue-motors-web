// The Avenue Motors mark, traced from the official logo. It takes the current text colour.
export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 464.1 271.5"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        fillRule="evenodd"
        d="M118.6 0 L209 144.2 L464.1 52.9 L0 271.5 Z M127.1 93 L157.1 157 L91.4 179.5 Z M194.8 216.4 L240 196 L256 224.4 L199.8 224.4 Z"
      />
    </svg>
  );
}
