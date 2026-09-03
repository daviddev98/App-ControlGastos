export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Configuracion: undefined;
  RegistroMovimiento: { movimientoId?: string } | undefined;
  Register: undefined;
  CuentasDetalle: { accountId: string };
  NuevaCuenta: undefined;
  MetaForm: { metaId?: string } | undefined;
};

export type MainTabParamList = {
  Metas: undefined;
  Inicio: undefined;
  Cuentas: undefined;
};