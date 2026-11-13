export const site = {
  name: "Avenue Motors",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phones: ["+998997474741", "+998935425555"],
  telegram: "Affalterbach",
  channel: "showroomavenue",
  // Read off the two installment offers posted in the channel: half down, and the
  // twelve payments add up to 15.69% more than the other half. Used only to estimate
  // cars with no posted offer, and shown as an estimate.
  installment: { downShare: 0.5, months: 12, markup: 0.1569 },
} as const;

export function formatPhone(phone: string) {
  return phone.replace(/^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5");
}

export function telegramLink(text?: string) {
  const base = `https://t.me/${site.telegram}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
