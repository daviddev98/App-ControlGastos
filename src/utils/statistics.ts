import { ChartPoint, MonthSpendingData, MovementItem } from '../constants/sampleData';
import { getMonthDateRange } from './date';

function getMonthShortLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-HN', { month: 'short' })
    .replace('.', '');
}

function getMonthLongLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('es-HN', { month: 'long' });
}

function buildCumulativeExpenseChart(
  movimientos: MovementItem[],
  monthKey: string
): ChartPoint[] {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const monthShort = getMonthShortLabel(monthKey);

  const expenseByDay: Record<number, number> = {};
  for (const movement of movimientos) {
    if (movement.amount >= 0 || !movement.date) {
      continue;
    }

    const day = Number(movement.date.slice(8, 10));
    if (Number.isNaN(day)) {
      continue;
    }

    expenseByDay[day] = (expenseByDay[day] ?? 0) + Math.abs(movement.amount);
  }

  const bucketEnds = [
    1,
    Math.ceil(lastDay * 0.25),
    Math.ceil(lastDay * 0.5),
    Math.ceil(lastDay * 0.75),
    lastDay,
  ]
    .map((day) => Math.min(day, lastDay))
    .filter((day, index, items) => items.indexOf(day) === index);

  let cumulative = 0;
  let previousEndDay = 0;

  const chartData = bucketEnds.map((endDay) => {
    for (let day = previousEndDay + 1; day <= endDay; day += 1) {
      cumulative += expenseByDay[day] ?? 0;
    }

    previousEndDay = endDay;

    return {
      label: `${monthShort} ${endDay}`,
      value: cumulative,
    };
  });

  if (chartData.length >= 2) {
    return chartData;
  }

  return [
    { label: `${monthShort} 1`, value: 0 },
    { label: `${monthShort} ${lastDay}`, value: chartData[0]?.value ?? 0 },
  ];
}

function buildChartHighlight(
  chartData: ChartPoint[],
  monthKey: string
): MonthSpendingData['chartHighlight'] {
  const [year] = monthKey.split('-').map(Number);
  const monthLong = getMonthLongLabel(monthKey);
  const peak = chartData.reduce(
    (best, point) => (point.value > best.value ? point : best),
    chartData[0] ?? { label: '', value: 0 }
  );
  const day = peak.label.split(' ').pop() ?? '1';

  return {
    amount: peak.value,
    date: `${day} ${monthLong}, ${year}`,
  };
}

export function buildMonthStatistics(
  movimientos: MovementItem[],
  monthKey: string
): MonthSpendingData {
  const ingresos = movimientos
    .filter((movement) => movement.amount > 0)
    .reduce((sum, movement) => sum + movement.amount, 0);

  const gastos = movimientos
    .filter((movement) => movement.amount < 0)
    .reduce((sum, movement) => sum + Math.abs(movement.amount), 0);

  const chartData = buildCumulativeExpenseChart(movimientos, monthKey);
  const [year] = monthKey.split('-').map(Number);
  const { endDate } = getMonthDateRange(monthKey);
  const lastDay = endDate.slice(8, 10);
  const monthLong = getMonthLongLabel(monthKey);

  return {
    totalSpending: gastos,
    ingresos,
    gastos,
    total: ingresos - gastos,
    chartData,
    chartHighlight: buildChartHighlight(chartData, monthKey),
    startLabel: `1 ${monthLong}, ${year}`,
    endLabel: `${Number(lastDay)} ${monthLong}, ${year}`,
  };
}

export function getScheduledPayments(movimientos: MovementItem[]): MovementItem[] {
  return [...movimientos]
    .filter((movement) => movement.amount < 0)
    .sort((left, right) => left.dueDate - right.dueDate);
}
