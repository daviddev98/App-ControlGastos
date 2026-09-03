export function getMonthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

export function getMonthLabel(date: Date): string {
  const label = date.toLocaleDateString('es-HN', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function getMonthDateRange(monthKey: string): { startDate: string; endDate: string } {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const paddedLastDay = String(lastDay).padStart(2, '0');

  return {
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${paddedLastDay}`,
  };
}

export function getMonthKeyFromDateString(date: string): string {
  return date.slice(0, 7);
}

export function parseYYYYMMDDToDDMMYYYY(dateStr: string): string {
  const iso = dateStr.slice(0, 10);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return dateStr;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function parseDDMMYYYYtoYYYYMMDD(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}
