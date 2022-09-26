import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { Token } from '@balancednetwork/sdk-core';

import { sICX, ICX, bnUSD, BALN, IUSDC, USDS, OMM, IUSDT, FIN, CFT, METX, GBET } from 'constants/tokens';

import { NETWORK_ID } from './config';

export interface PairInfo {
  readonly chainId: number;
  readonly id: number;
  readonly name: string;
  readonly baseCurrencyKey: string;
  readonly quoteCurrencyKey: string;
  readonly rewards?: number;
  readonly baseToken: Token;
  readonly quoteToken: Token;
}

// this information contains the pairs the balanced supports
// eventually this information will saved in json file.
const SUPPORTED_PAIRS_INFO: { [ChainId: number]: PairInfo[] } = {
  [ChainId.MAINNET]: [
    {
      chainId: 1,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      rewards: 0.03,
      baseToken: sICX[ChainId.MAINNET],
      quoteToken: ICX[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      baseToken: sICX[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
      rewards: 0.12,
    },
    {
      chainId: 1,
      id: 3,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      baseToken: BALN[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
      rewards: 0.12,
    },
    {
      chainId: 1,
      id: 4,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      baseToken: BALN[ChainId.MAINNET],
      quoteToken: sICX[ChainId.MAINNET],
      rewards: 0.15,
    },
    {
      chainId: 1,
      id: 5,
      name: 'IUSDC/bnUSD',
      baseCurrencyKey: 'IUSDC',
      quoteCurrencyKey: 'bnUSD',
      baseToken: IUSDC[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
      rewards: 0.025,
    },
    {
      chainId: 1,
      id: 15,
      name: 'IUSDT/bnUSD',
      baseCurrencyKey: 'IUSDT',
      quoteCurrencyKey: 'bnUSD',
      baseToken: IUSDT[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
      rewards: 0.005,
    },
    {
      chainId: 1,
      id: 10,
      name: 'USDS/bnUSD',
      baseCurrencyKey: 'USDS',
      quoteCurrencyKey: 'bnUSD',
      baseToken: USDS[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
      rewards: 0.02,
    },
    {
      chainId: 1,
      id: 7,
      name: 'OMM/sICX',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'sICX',
      baseToken: OMM[ChainId.MAINNET],
      quoteToken: sICX[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 6,
      name: 'OMM/IUSDC',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'IUSDC',
      baseToken: OMM[ChainId.MAINNET],
      quoteToken: IUSDC[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 8,
      name: 'OMM/USDS',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'USDS',
      baseToken: OMM[ChainId.MAINNET],
      quoteToken: USDS[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 9,
      name: 'CFT/sICX',
      baseCurrencyKey: 'CFT',
      quoteCurrencyKey: 'sICX',
      baseToken: CFT[ChainId.MAINNET],
      quoteToken: sICX[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 11,
      name: 'METX/bnUSD',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'bnUSD',
      baseToken: METX[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 12,
      name: 'METX/sICX',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'sICX',
      baseToken: METX[ChainId.MAINNET],
      quoteToken: sICX[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 13,
      name: 'METX/IUSDC',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'IUSDC',
      baseToken: METX[ChainId.MAINNET],
      quoteToken: IUSDC[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 14,
      name: 'METX/USDS',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'USDS',
      baseToken: METX[ChainId.MAINNET],
      quoteToken: USDS[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 17,
      name: 'GBET/bnUSD',
      baseCurrencyKey: 'GBET',
      quoteCurrencyKey: 'bnUSD',
      baseToken: GBET[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
    },
    {
      chainId: 1,
      id: 31,
      name: 'FIN/bnUSD',
      baseCurrencyKey: 'FIN',
      quoteCurrencyKey: 'bnUSD',
      baseToken: FIN[ChainId.MAINNET],
      quoteToken: bnUSD[ChainId.MAINNET],
    },
  ],
  [ChainId.YEOUIDO]: [
    {
      chainId: 3,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      rewards: 0.1,
      baseToken: sICX[ChainId.YEOUIDO],
      quoteToken: ICX[ChainId.YEOUIDO],
    },
    {
      chainId: 3,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      baseToken: sICX[ChainId.YEOUIDO],
      quoteToken: bnUSD[ChainId.YEOUIDO],
      rewards: 0.175,
    },
    {
      chainId: 3,
      id: 6,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      baseToken: BALN[ChainId.YEOUIDO],
      quoteToken: bnUSD[ChainId.YEOUIDO],
      rewards: 0.175,
    },
    {
      chainId: 3,
      //id: 4,
      id: 5,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      baseToken: BALN[ChainId.YEOUIDO],
      quoteToken: sICX[ChainId.YEOUIDO],
      rewards: 0.05,
    },
    {
      chainId: 3,
      id: 24,
      name: 'OMM/IUSDC',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'IUSDC',
      baseToken: OMM[ChainId.YEOUIDO],
      quoteToken: IUSDC[ChainId.YEOUIDO],
    },
    {
      chainId: 3,
      id: 4,
      // id: 25,
      name: 'OMM/sICX',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'sICX',
      baseToken: OMM[ChainId.YEOUIDO],
      quoteToken: sICX[ChainId.YEOUIDO],
    },
    {
      chainId: 3,
      id: 23,
      name: 'OMM/USDS',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'USDS',
      baseToken: OMM[ChainId.YEOUIDO],
      quoteToken: USDS[ChainId.YEOUIDO],
    },
    {
      chainId: 3,
      id: 30,
      name: 'CFT/sICX',
      baseCurrencyKey: 'CFT',
      quoteCurrencyKey: 'sICX',
      baseToken: CFT[ChainId.YEOUIDO],
      quoteToken: sICX[ChainId.YEOUIDO],
    },
  ],
  [ChainId.SEJONG]: [
    {
      chainId: 83,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      baseToken: sICX[ChainId.SEJONG],
      quoteToken: ICX[ChainId.SEJONG],
      rewards: 0.1,
    },
    {
      chainId: 83,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      baseToken: sICX[ChainId.SEJONG],
      quoteToken: bnUSD[ChainId.SEJONG],
      rewards: 0.15,
    },
    {
      chainId: 83,
      id: 3,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      baseToken: BALN[ChainId.SEJONG],
      quoteToken: bnUSD[ChainId.SEJONG],
      rewards: 0.15,
    },
    {
      chainId: 83,
      id: 4,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      baseToken: BALN[ChainId.SEJONG],
      quoteToken: sICX[ChainId.SEJONG],
      rewards: 0.1,
    },
    {
      chainId: 83,
      id: 19,
      name: 'FIN/bnUSD',
      baseCurrencyKey: 'FIN',
      quoteCurrencyKey: 'bnUSD',
      baseToken: FIN[ChainId.SEJONG],
      quoteToken: bnUSD[ChainId.SEJONG],
    },
  ],
  [ChainId.BERLIN]: [
    {
      chainId: 7,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      baseToken: sICX[ChainId.BERLIN],
      quoteToken: ICX[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      baseToken: sICX[ChainId.BERLIN],
      quoteToken: bnUSD[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 3,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      baseToken: BALN[ChainId.BERLIN],
      quoteToken: bnUSD[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 4,
      name: 'IUSDC/bnUSD',
      baseCurrencyKey: 'IUSDC',
      quoteCurrencyKey: 'bnUSD',
      baseToken: IUSDC[ChainId.BERLIN],
      quoteToken: bnUSD[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 5,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      baseToken: BALN[ChainId.BERLIN],
      quoteToken: sICX[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 6,
      name: 'OMM/USDS',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'USDS',
      baseToken: OMM[ChainId.BERLIN],
      quoteToken: USDS[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 7,
      name: 'OMM/IUSDC',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'IUSDC',
      baseToken: OMM[ChainId.BERLIN],
      quoteToken: IUSDC[ChainId.BERLIN],
    },
    {
      chainId: 7,
      id: 8,
      name: 'OMM/sICX',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'sICX',
      baseToken: OMM[ChainId.BERLIN],
      quoteToken: sICX[ChainId.BERLIN],
    },
  ],
};

export const SUPPORTED_PAIRS = SUPPORTED_PAIRS_INFO[NETWORK_ID];
