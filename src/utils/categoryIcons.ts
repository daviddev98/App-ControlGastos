import {
  Banknote,
  Briefcase,
  Camera,
  Car,
  CircleDollarSign,
  Gamepad2,
  Gift,
  HeartPulse,
  LucideIcon,
  Monitor,
  MoreHorizontal,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from 'lucide-react-native';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Supermercado: ShoppingCart,
  Transporte: Car,
  Electrónicos: Monitor,
  Fotografía: Camera,
  Servicios: Wrench,
  Salud: HeartPulse,
  Entretenimiento: Gamepad2,
  Salario: Banknote,
  Freelance: Briefcase,
  Inversiones: TrendingUp,
  Regalo: Gift,
  Otros: MoreHorizontal,
};

export function getCategoryBaseName(category: string): string {
  return category.split(' · ')[0].trim();
}

export function getCategoryIcon(category: string): LucideIcon {
  const baseCategory = getCategoryBaseName(category);
  return CATEGORY_ICON_MAP[baseCategory] ?? CircleDollarSign;
}

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICON_MAP);
