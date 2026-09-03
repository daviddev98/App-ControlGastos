import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { useAppSettings } from '../hooks/useAppSettings';
import { Account } from '../constants/sampleData';
import { ThemeColors } from '../constants/themes';
import { formatLPS } from '../utils/currency';
import { Text } from './ui';

type Props = {
  accounts: Account[];
  totalBalance: number;
};

const SIZE = 340;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 105;
const INNER_R = 68;

const LIGHT_SLICE_COLORS = ['#E5E7EB', '#FFFFFF', '#F2F2F2', '#F3F4F6', '#F9FAFB'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const sweep = endAngle - startAngle;

  // SVG arcs cannot draw a full 360° segment (start and end coincide).
  if (sweep >= 359.99) {
    const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
    const outerMid = polarToCartesian(cx, cy, outerR, startAngle + 180);
    const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
    const innerMid = polarToCartesian(cx, cy, innerR, startAngle + 180);

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${outerMid.x} ${outerMid.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${outerStart.x} ${outerStart.y}`,
      `L ${innerMid.x} ${innerMid.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${innerMid.x} ${innerMid.y}`,
      'Z',
    ].join(' ');
  }

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = sweep <= 180 ? 0 : 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function getSliceLabelColor(sliceColor: string, foreground: string): string {
  return LIGHT_SLICE_COLORS.includes(sliceColor.toUpperCase()) ? foreground : sliceColor;
}

type Slice = {
  account: Account;
  startAngle: number;
  endAngle: number;
  percentage: number;
};

function buildSlices(accounts: Account[]): Slice[] {
  const weights = accounts.map((account) => Math.abs(account.balance));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;

  let currentAngle = 0;
  return accounts.map((account, index) => {
    const percentage = (weights[index] / totalWeight) * 100;
    const sweep = (weights[index] / totalWeight) * 360;
    const slice: Slice = {
      account,
      startAngle: currentAngle,
      endAngle: currentAngle + sweep,
      percentage,
    };
    currentAngle += sweep;
    return slice;
  });
}

export default function AccountsDonutChart({ accounts, totalBalance }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slices = useMemo(() => buildSlices(accounts), [accounts]);

  return (
    <View style={styles.wrapper}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices.map((slice) => (
          <Path
            key={slice.account.id}
            d={describeDonutSlice(CX, CY, OUTER_R, INNER_R, slice.startAngle, slice.endAngle)}
            fill={slice.account.color}
          />
        ))}

        {slices.map((slice) => {
          const midAngle = (slice.startAngle + slice.endAngle) / 2;
          const labelPoint = polarToCartesian(CX, CY, OUTER_R + 28, midAngle);
          const lineStart = polarToCartesian(CX, CY, OUTER_R + 2, midAngle);
          const isLeft = labelPoint.x < CX;
          const labelColor = getSliceLabelColor(slice.account.color, colors.foreground);

          return (
            <G key={`label-${slice.account.id}`}>
              <Line
                x1={lineStart.x}
                y1={lineStart.y}
                x2={labelPoint.x}
                y2={labelPoint.y}
                stroke={labelColor}
                strokeWidth={1}
              />
              <SvgText
                x={labelPoint.x + (isLeft ? -6 : 6)}
                y={labelPoint.y + 4}
                fill={labelColor}
                fontSize={11}
                fontWeight="600"
                textAnchor={isLeft ? 'end' : 'start'}
              >
                {slice.account.name}
              </SvgText>
              <SvgText
                x={labelPoint.x + (isLeft ? -6 : 6)}
                y={labelPoint.y + 18}
                fill={colors.mutedForeground}
                fontSize={10}
                textAnchor={isLeft ? 'end' : 'start'}
              >
                {slice.percentage.toFixed(1)}%
              </SvgText>
            </G>
          );
        })}

        <Circle
          cx={CX}
          cy={CY}
          r={INNER_R - 1}
          fill={colors.card}
          stroke={colors.border}
          strokeWidth={1}
        />
      </Svg>

      <View style={styles.centerOverlay} pointerEvents="none">
        <View style={styles.pill}>
          <Text variant="muted" style={styles.pillText}>
            Saldo
          </Text>
        </View>
        <Text style={styles.totalBalance}>{formatLPS(totalBalance)}</Text>
        <View style={styles.pill}>
          <Text variant="muted" style={styles.pillText}>
            HNL
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      height: SIZE,
      marginBottom: 8,
    },
    centerOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      width: INNER_R * 2 - 16,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.secondary,
    },
    pillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    totalBalance: {
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.foreground,
    },
  });
