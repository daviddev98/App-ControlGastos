import React from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { CardBrand } from '../constants/sampleData';

type Props = {
  brand: CardBrand;
  width?: number;
  height?: number;
};

const VISA_RATIO = 1000 / 324.6;

export default function CardBrandLogo({ brand, width, height }: Props) {
  if (brand === 'mastercard') {
    const w = width ?? 52;
    const h = height ?? 32;
    return (
      <Svg width={w} height={h} viewBox="0 0 52 32" preserveAspectRatio="xMidYMid meet">
        <Circle cx="20" cy="16" r="12" fill="#EB001B" />
        <Circle cx="32" cy="16" r="12" fill="#F79E1B" />
      </Svg>
    );
  }

  if (brand === 'visa') {
    const w = width ?? 78;
    const h = height ?? Math.round(w / VISA_RATIO);
    return (
      <Svg width={w} height={h} viewBox="0 0 1000 324.6" preserveAspectRatio="xMidYMid meet">
        <Path
          fill="#1A1F71"
          d="M445.5 43.8h-88.2L301.8 281.4h88.3l55.4-237.6zM640.8 48.2c-17.5-6.6-45-13.8-79.4-13.8-87.7 0-149.5 44.2-150 107.5-.6 46.8 44.1 72.8 77.7 88.4 34.4 15.9 46 26.2 45.8 40.4-.3 21.8-27.6 31.8-53.2 31.8-35.6 0-54.5-4.9-83.7-17.1l-11.5-5.2-12.5 73.4c20.8 9.1 59.3 17 99 17.3 93.5 0 154.3-43.7 154.9-111.4.3-37.1-23.3-65.4-74.5-88.9-31-15.2-50-25.3-49.8-40.7 0-13.6 16.2-28.2 51.3-28.2 29.2-.5 50.4 5.9 66.8 12.6l8.1 3.8 12.1-70.5zM834.8 43.8h-68.9c-21.3 0-37.3 5.8-46.7 27.1l-132.4 210.5h93.3s15.3-40.3 18.7-49.1h113.8c2.6 11.3 10.6 49.1 10.6 49.1h82.4L834.8 43.8zm-70.3 148.1c8.5-21.8 41-105.8 41-105.8s9.3 24.4 15.1 40.2l22.6 65.6h-78.7zM249.3 43.8L165.1 256.2l-9-43.6c-15.6-50.2-64.3-104.6-118.6-131.8l76.7 256.8h93.5l139-294.6H249.3z"
        />
        <Path
          fill="#F9A533"
          d="M130.9 43.8H.5L0 50.2c103.4 25 171.8 67.8 200.4 125.3L152.8 50.2c-6.1-15.4-18.6-18.8-21.9-6.4z"
        />
      </Svg>
    );
  }

  const w = width ?? 52;
  const h = height ?? 32;
  return (
    <Svg width={w} height={h} viewBox="0 0 52 32" preserveAspectRatio="xMidYMid meet">
      <Rect x="0" y="4" width="52" height="24" rx="4" fill="#006FCF" />
      <SvgText
        x="26"
        y="20"
        fill="#FFFFFF"
        fontSize="9"
        fontWeight="700"
        textAnchor="middle"
      >
        AMEX
      </SvgText>
    </Svg>
  );
}
