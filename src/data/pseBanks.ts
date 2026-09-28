export interface PSEBank {
  code: string;
  name: string;
  popular?: boolean;
}

export const PSE_BANKS_COLOMBIA: PSEBank[] = [
  // Principales / Más utilizados
  { code: '1007', name: 'Bancolombia', popular: true },
  { code: '1507', name: 'Nequi', popular: true },
  { code: '1051', name: 'Davivienda', popular: true },
  { code: '1551', name: 'Daviplata', popular: true },
  { code: '1001', name: 'Banco de Bogotá', popular: true },
  { code: '1013', name: 'BBVA Colombia', popular: true },
  { code: '1023', name: 'Banco de Occidente', popular: true },
  { code: '1040', name: 'Banco Agrario de Colombia' },
  { code: '1002', name: 'Banco Popular' },
  { code: '1006', name: 'Banco Itaú' },
  { code: '1012', name: 'Banco GNB Sudameris' },
  { code: '1019', name: 'Scotiabank Colpatria' },
  { code: '1062', name: 'Banco Falabella' },
  { code: '1061', name: 'Banco Serfinanza' },
  { code: '1060', name: 'Banco Pichincha Colombia' },
  { code: '1052', name: 'Banco AV Villas' },
  { code: '1032', name: 'Banco Caja Social' },
  { code: '1066', name: 'Banco Cooperativo Coopcentral' },
  { code: '1059', name: 'Bancamía' },
  { code: '1065', name: 'Banco Santander Colombia' },
  { code: '1063', name: 'Banco Finandina' },
  { code: '1058', name: 'Banco ProCredit' },
  { code: '1070', name: 'Banco W' },
  { code: '1069', name: 'Banco Mundo Mujer' },
  { code: '1502', name: 'Lulo Bank' },
  { code: '1071', name: 'Nu Colombia (Nubank)' },
  { code: '1504', name: 'RappiPay (DaviPlata / RappiCuenta)' },
  { code: '1558', name: 'Dale (Grupo Aval)' },
  { code: '1508', name: 'Movii' },
  { code: '1509', name: 'Uala' },
  { code: '1072', name: 'Iris Neobanco' },
  { code: '1073', name: 'Bold.co' },
  { code: '1074', name: 'Global66' },
  { code: '1283', name: 'CFA Cooperativa Financiera' },
  { code: '1289', name: 'Cotrafa Cooperativa Financiera' },
  { code: '1292', name: 'Confiar Cooperativa Financiera' },
  { code: '1291', name: 'Coofinep Cooperativa Financiera' },
  { code: '1370', name: 'Coltefinanciera' },
  { code: '1286', name: 'Juriscoop Compañía de Financiamiento' },
  { code: '1281', name: 'Financiera Comultrasan' },
];

export default PSE_BANKS_COLOMBIA;
