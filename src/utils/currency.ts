export function formatLPS(value: number): string {
  const absoluteValue = Math.abs(value);
  const formatted = absoluteValue.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (value < 0) {
    return `-L ${formatted}`;
  }

  return `L ${formatted}`;
}
