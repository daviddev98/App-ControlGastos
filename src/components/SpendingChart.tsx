import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { useAppSettings } from '../hooks/useAppSettings';
import { radius, shadows } from '../constants/theme';
import { ChartPoint } from '../constants/sampleData';
import { formatLPS } from '../utils/currency';
import { Card, Text } from './ui';

type Props = {
  data: ChartPoint[];
  highlightAmount: number;
  highlightDate: string;
  startLabel: string;
  endLabel: string;
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 140;
const PADDING = 16;

function buildPath(data: ChartPoint[]) {
  const safeData =
    data.length >= 2
      ? data
      : [
          { label: '', value: 0 },
          { label: '', value: data[0]?.value ?? 0 },
        ];

  const values = safeData.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (CHART_WIDTH - PADDING * 2) / (safeData.length - 1);

  const points = safeData.map((point, index) => {
    const x = PADDING + index * stepX;
    const y = CHART_HEIGHT - PADDING - ((point.value - min) / range) * (CHART_HEIGHT - PADDING * 2);
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

  return { points, linePath, areaPath };
}

export default function SpendingChart({
  data,
  highlightAmount,
  highlightDate,
  startLabel,
  endLabel,
}: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: 'relative',
          marginTop: 8,
        },
        tooltip: {
          position: 'absolute',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: radius.md,
          ...shadows.card,
          gap: 2,
        },
        tooltipAmount: {
          fontWeight: '700',
          fontSize: 13,
        },
        labels: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingHorizontal: 4,
        },
      }),
    []
  );

  const { points, linePath, areaPath } = buildPath(data);
  const highlightIndex = Math.max(0, Math.floor(data.length / 2));
  const highlightPoint = points[highlightIndex] ?? points[points.length - 1];

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <Line
            key={ratio}
            x1={PADDING}
            y1={CHART_HEIGHT * ratio}
            x2={CHART_WIDTH - PADDING}
            y2={CHART_HEIGHT * ratio}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        <Path d={areaPath} fill="url(#areaGradient)" />
        <Path d={linePath} stroke={colors.primary} strokeWidth={3} fill="none" />

        {points.map((point, index) => (
          <Circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={index === highlightIndex ? 5 : 3}
            fill={colors.card}
            stroke={colors.primary}
            strokeWidth={2}
          />
        ))}
      </Svg>

      <Card style={[styles.tooltip, { left: highlightPoint.x - 48, top: highlightPoint.y - 58 }]}>
        <Text variant="default" style={styles.tooltipAmount}>
          {formatLPS(highlightAmount)}
        </Text>
        <Text variant="muted">{highlightDate}</Text>
      </Card>

      <View style={styles.labels}>
        <Text variant="muted">{startLabel}</Text>
        <Text variant="muted">{endLabel}</Text>
      </View>
    </View>
  );
}
