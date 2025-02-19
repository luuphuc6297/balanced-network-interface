import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Currency, Token } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import '@reach/tabs/styles.css';
import { SUPPORTED_TOKENS_LIST, COMBINED_TOKENS_LIST, useICX } from 'constants/tokens';
import { useAllTokens } from 'hooks/Tokens';
import useArrowControl from 'hooks/useArrowControl';
import useDebounce from 'hooks/useDebounce';
import useKeyPress from 'hooks/useKeyPress';
import { useRatesQuery } from 'queries/reward';
import { useTokenListConfig } from 'store/lists/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { isDPZeroCA, toFraction } from 'utils';

import Divider from '../Divider';
import { filterTokens, useSortedTokensByQuery } from '../SearchModal/filtering';
import SearchInput from '../SearchModal/SearchInput';
import { useTokenComparator } from '../SearchModal/sorting';
import ICXWallet from './wallets/ICXWallet';
import SendPanel from './wallets/SendPanel';
import SICXWallet from './wallets/SICXWallet';
import { notificationCSS } from './wallets/utils';

const WalletUIs = {
  ICX: ICXWallet,
  sICX: SICXWallet,
};

const walletBreakpoint = '499px';
const modalWalletBreakpoint = '400px';

const WalletAssets = styled.div`
  padding: 0 25px;
  input {
    font-size: 14px;
  }
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
  white-space: nowrap;
`;

const DashGrid = styled(Box)`
  display: grid;
  grid-template-columns: 2fr 4fr;
  grid-template-areas: 'asset balance&value';
  align-items: center;
  @media screen and (max-width: ${walletBreakpoint}) {
    grid-template-columns: 3fr 5fr;
  }
  & > * {
    justify-content: flex-end;
    text-align: right;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const DataText = styled(Typography)`
  font-size: 14px;
`;

const BalanceAndValueWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  ${DataText}, ${HeaderText} {
    width: 50%;
    @media screen and (max-width: ${walletBreakpoint}) {
      width: 100%;
      &.value {
        opacity: 0.7;
      }
    }
  }
`;

const List = styled(Box)`
  max-height: 259px;
  overflow-y: auto;
  padding: 0 25px;
  margin: 0 -25px;
`;

const ListItem = styled(DashGrid)<{ border?: boolean }>`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  @media screen and (max-width: ${walletBreakpoint}) {
    padding: 15px 0;
  }
  &.active {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AssetSymbol = styled.div<{ hasNotification?: boolean }>`
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: auto 1fr;
  align-items: center;
  position: relative;
  ${({ hasNotification }) => hasNotification && notificationCSS}
  &:before, &:after {
    right: initial;
    left: -18px;
  }
`;

const ModalContent = styled(Box)`
  padding: 25px;
  width: 100%;
  button[role='tab'] {
    border-left: 0;
    border-top: 0;
    border-right: 0;
  }
  ${AssetSymbol} {
    &:before,
    &:after {
      display: none;
    }
  }
  @media screen and (max-width: ${modalWalletBreakpoint}) {
    padding: 15px;
  }
`;

const BoxPanelWithArrow = styled(BoxPanel)`
  position: relative;
  width: 100%;
  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #144a68;
    position: absolute;
    transition: all ease-in-out 200ms;
    top: 0;
    left: 34px;
    margin-top: -12px;
  }
  @media screen and (max-width: ${modalWalletBreakpoint}) {
    width: calc(100% + 30px);
    margin: 0 -15px -15px -15px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    padding: 15px;
    &:before {
      left: 50px;
    }
  }
`;

const Wrapper = styled.div``;

const WalletTotal = styled(Flex)`
  justify-content: space-between;
  padding: 20px 0;
`;

const ADDRESSES = SUPPORTED_TOKENS_LIST.map(currency => currency.address);
const COMBINED_ADDRESSES = COMBINED_TOKENS_LIST.map(currency => currency.address);

const WalletUI = ({ currency }: { currency: Currency }) => {
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const { account } = useIconReact();
  const transactions = useAllTransactions();

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  const UI = currency.symbol ? WalletUIs[currency.symbol] ?? SendPanel : SendPanel;
  if (currency.symbol === 'ICX') {
    return <UI currency={currency} claimableICX={claimableICX} />;
  } else {
    return <UI currency={currency} />;
  }
};

const Wallet = ({ setAnchor, anchor, ...rest }) => {
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const balances = useWalletBalances();
  const transactions = useAllTransactions();
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const { account } = useIconReact();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>();
  const [modalAsset, setModalAsset] = useState<string | undefined>();
  const tokenListConfig = useTokenListConfig();

  const debouncedQuery = useDebounce(searchQuery, 200);
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');
  const [isOpen, setOpen] = useState(false);

  const allTokens = useAllTokens();

  const tokenComparator = useTokenComparator(account, false);

  const icxAddress = bnJs.ICX.address;

  const addressesWithAmount = useMemo(
    () =>
      tokenListConfig.community
        ? COMBINED_ADDRESSES.filter(address => !isDPZeroCA(balances[address], 2))
        : ADDRESSES.filter(address => !isDPZeroCA(balances[address], 2)),
    [tokenListConfig, balances],
  );

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery).filter(
      token => addressesWithAmount.indexOf(token.address) >= 0,
    );
  }, [allTokens, debouncedQuery, addressesWithAmount]);

  const sortedTokens: Token[] = useMemo(() => {
    return [...filteredTokens].sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery);

  const icx = useICX();

  const filteredSortedTokensWithICX: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim();
    if (!isDPZeroCA(balances[icxAddress], 2) && ('icon'.indexOf(s) >= 0 || 'icx'.indexOf(s) >= 0)) {
      return icx ? [icx, ...filteredSortedTokens] : filteredSortedTokens;
    }
    return filteredSortedTokens;
  }, [debouncedQuery, icx, filteredSortedTokens, balances, icxAddress]);

  const { activeIndex, setActiveIndex } = useArrowControl(anchor !== null, filteredSortedTokensWithICX.length);

  // rates: using symbol as key?
  const { data: rates } = useRatesQuery();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  const totalBalance = useMemo(
    () =>
      filteredSortedTokensWithICX.reduce((total, token) => {
        const { address, symbol } = token.wrapped;
        const tokenValue =
          rateFracs && rateFracs[symbol!] && balances
            ? new BigNumber(balances[address].multiply(rateFracs[symbol!]).toFixed(2))
            : new BigNumber(0);
        return total.plus(tokenValue);
      }, new BigNumber(0)),
    [filteredSortedTokensWithICX, balances, rateFracs],
  );

  const handleAssetClick = (asset: string) => {
    setModalAsset(asset);
    showModal();
  };

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  const showModal = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  useEffect(() => {
    if (escape) {
      setAnchor(null);
    }
  }, [escape, setAnchor]);

  useEffect(() => {
    if (enter && anchor) {
      showModal();
    }
  }, [enter, anchor, showModal]);

  useEffect(() => {
    if (anchor) {
      setActiveIndex(undefined);
    }
  }, [anchor, setActiveIndex]);

  useEffect(() => {
    let focusTimeout;
    if (anchor && !isMobile) {
      focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    return () => {
      clearTimeout(focusTimeout);
    };
  }, [anchor]);

  const TokenInfo = ({ currency }) => {
    const { symbol, address } = currency;
    return (
      <>
        <AssetSymbol hasNotification={symbol.toLowerCase() === 'icx' && claimableICX.isGreaterThan(0)}>
          <CurrencyLogo currency={currency} />
          <Typography fontSize={16} fontWeight="bold">
            {symbol}
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div">{!account ? '-' : balances[address]?.toFixed(2, { groupSeparator: ',' })}</DataText>

          <DataText as="div">
            {!account || !rates || !symbol || !rates[symbol] || !rateFracs
              ? '-'
              : `$${balances[address]?.multiply(rateFracs[symbol]).toFixed(2, { groupSeparator: ',' })}`}
          </DataText>
        </BalanceAndValueWrap>
      </>
    );
  };

  return (
    <>
      <WalletAssets>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search assets`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={e => {
            setSearchQuery(e.target.value);
            activeIndex === undefined && setActiveIndex(0);
          }}
        />

        {filteredSortedTokensWithICX.length ? (
          <>
            <DashGrid marginTop={'15px'}>
              <HeaderText>
                <Trans>Asset</Trans>
              </HeaderText>
              <BalanceAndValueWrap>
                <HeaderText>
                  <Trans>Balance</Trans>
                </HeaderText>
                {isSmallScreen ? null : (
                  <HeaderText>
                    <Trans>Value</Trans>
                  </HeaderText>
                )}
              </BalanceAndValueWrap>
            </DashGrid>

            <List>
              {filteredSortedTokensWithICX.map((currency, index, arr) => {
                const symbol = currency.symbol!;
                return (
                  <ListItem
                    className={index === activeIndex ? 'active' : ''}
                    key={symbol}
                    border={index !== arr.length - 1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleAssetClick(symbol)}
                  >
                    <TokenInfo currency={currency} />
                  </ListItem>
                );
              })}
            </List>
            <Divider />
            <WalletTotal>
              <HeaderText>
                <Trans>Total</Trans>
              </HeaderText>
              <Typography color="text" fontWeight={700}>
                ${totalBalance.toFormat(2)}
              </Typography>
            </WalletTotal>

            <Modal isOpen={isOpen} onDismiss={() => setOpen(false)}>
              <ModalContent>
                <DashGrid>
                  <HeaderText>
                    <Trans>Asset</Trans>
                  </HeaderText>
                  <BalanceAndValueWrap>
                    <HeaderText>
                      <Trans>Balance</Trans>
                    </HeaderText>
                    {isSmallScreen ? null : (
                      <HeaderText>
                        <Trans>Value</Trans>
                      </HeaderText>
                    )}
                  </BalanceAndValueWrap>
                </DashGrid>
                <ListItem border={false}>
                  <TokenInfo
                    currency={
                      filteredSortedTokensWithICX.find(currency => currency.wrapped.symbol === modalAsset) ||
                      filteredSortedTokensWithICX[0]
                    }
                  />
                </ListItem>
                <BoxPanelWithArrow bg="bg3">
                  <WalletUI
                    currency={
                      filteredSortedTokensWithICX.find(currency => currency.wrapped.symbol === modalAsset) ||
                      filteredSortedTokensWithICX[0]
                    }
                  />
                </BoxPanelWithArrow>
              </ModalContent>
            </Modal>
          </>
        ) : (
          <Wrapper>
            <Typography textAlign="center" paddingY={'20px'}>
              <Trans>No assets available.</Trans>
            </Typography>
          </Wrapper>
        )}
      </WalletAssets>
    </>
  );
};

export default Wallet;
