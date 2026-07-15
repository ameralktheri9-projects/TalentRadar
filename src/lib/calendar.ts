export function generateIcs(params: {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TalentRadar//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(params.startDate)}`,
    `DTEND:${fmt(params.endDate)}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${params.description ?? ""}`,
    `LOCATION:${params.location ?? "Video Call"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
