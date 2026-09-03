import React from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { CardBrand } from '../constants/sampleData';

type Props = {
  brand: CardBrand;
  width?: number;
  height?: number;
};

export default function CardBrandLogo({ brand, width = 52, height = 32 }: Props) {
  if (brand === 'mastercard') {
    return (
      <Svg width={width} height={height} viewBox="0 0 52 32">
        <Circle cx="20" cy="16" r="12" fill="#EB001B" />
        <Circle cx="32" cy="16" r="12" fill="#F79E1B" />
      </Svg>
    );
  }

  if (brand === 'visa') {
    return (
      <Svg width={width} height={height} viewBox="0 0 52 32">
        <Path
          d="M22.4 21.2L24.8 10.8H28.2L25.8 21.2H22.4ZM16.2 10.8L12.6 17.4L12.2 15.6C11.4 13.2 9.2 11.4 6.8 10.6L9.8 21.2H13.2L18.4 10.8H16.2ZM34.6 10.8C33.4 10.8 32.4 11.2 31.8 12.4L27.2 21.2H30.8L31.4 19.6H35.8L36.2 21.2H39.4L36.6 10.8H34.6ZM35.2 17.2L36.8 13.2L37.6 17.2H35.2ZM43.2 10.8L40.2 21.2H43.4L46.4 10.8H43.2Z"
          fill="#1A1F71"
        />
        <Path
          d="M6.4 10.8H2.8L2.6 11.6C5.6 12.4 7.8 14.2 8.8 16.4L6.4 10.8Z"
          fill="#FAA61A"
        />
      </Svg>
    );
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 52 32">
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
