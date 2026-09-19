import { TransactionType } from '../constants/sampleData';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Configuracion: undefined;
  RegistroMovimiento:
    | {
        movimientoId?: string;
        initialData?: {
          amount?: number;
          merchant?: string;
          category?: string;
          transactionType?: TransactionType;
          notes?: string;
        };
      }
    | undefined;
  Register: undefined;
  CuentasDetalle: { accountId: string };
  NuevaCuenta: undefined;
  MetaForm: { metaId?: string } | undefined;
  RedCategorias: undefined;
  AsistenteIA: undefined;
};

export type MainTabParamList = {
  Metas: undefined;
  Inicio: undefined;
  Cuentas: undefined;
};