type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  "aria-hidden": true,
} as const;

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="10" viewBox="0 0 22 10" {...stroke}>
      <path d="M0 5 h20 M16 1 l4.5 4 l-4.5 4" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="10" viewBox="0 0 22 10" {...stroke}>
      <path d="M22 5 H2 M6 1 L1.5 5 L6 9" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 12 14" fill="currentColor" aria-hidden>
      <path d="M0 0 l12 7 l-12 7 Z" />
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="17" viewBox="0 0 20 17" fill="currentColor" fillRule="evenodd" aria-hidden>
      <path d="M18.4 0.2 L1.2 6.8 c-1 0.4 -1 1.1 -0.2 1.3 l4.4 1.4 l1.7 5.2 c0.2 0.6 0.4 0.8 0.9 0.8 c0.4 0 0.6 -0.2 0.9 -0.5 l2.4 -2.3 l4.6 3.4 c0.8 0.5 1.4 0.2 1.6 -0.8 L19.9 1.6 C20.2 0.4 19.4 -0.2 18.4 0.2 Z M7.1 9.3 l8.9 -5.6 c0.4 -0.3 0.8 -0.1 0.5 0.2 l-7.3 6.6 l-0.3 3.4 Z" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" {...stroke}>
      <path d="M3.5 1.5 h2.4 l1.2 3.1 l-1.6 1.2 a8 8 0 0 0 4.7 4.7 l1.2 -1.6 l3.1 1.2 v2.4 a1.5 1.5 0 0 1 -1.6 1.5 A12.5 12.5 0 0 1 2 3.1 A1.5 1.5 0 0 1 3.5 1.5 Z" />
    </svg>
  );
}

export function SoundIcon({ className, muted }: IconProps & { muted: boolean }) {
  return (
    <svg className={className} width="18" height="14" viewBox="0 0 18 14" {...stroke}>
      <path d="M1 4.5 h3 l4 -3.5 v12 l-4 -3.5 H1 Z" />
      {muted ? (
        <path d="M12 4.5 l5 5 M17 4.5 l-5 5" />
      ) : (
        <path d="M11.5 4 a4.5 4.5 0 0 1 0 6 M13.8 1.8 a8 8 0 0 1 0 10.4" />
      )}
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" {...stroke}>
      <path d="M2 2 l12 12 M14 2 L2 14" />
    </svg>
  );
}
