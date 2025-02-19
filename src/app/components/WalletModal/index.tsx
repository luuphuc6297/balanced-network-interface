import React, { useEffect, useState } from 'react';

import { BalancedJs, getLedgerAddressPath, LEDGER_BASE_PATH } from '@balancednetwork/balanced-js';
import * as HwUtils from '@balancednetwork/hw-app-icx/lib/utils';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { VerticalDivider } from 'app/components/Divider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { Link } from 'app/components/Link';
import { MenuList, LanguageMenuItem } from 'app/components/Menu';
import Modal, { ModalProps } from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as IconWalletIcon } from 'assets/icons/iconex.svg';
import { ReactComponent as LedgerIcon } from 'assets/icons/ledger.svg';
import bnJs from 'bnJs';
import { LOCALE_LABEL, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales';
import { useActiveLocale } from 'hooks/useActiveLocale';
import {
  useWalletModalToggle,
  useModalOpen,
  useCurrentLedgerAddressPage,
  useChangeCurrentLedgerAddressPage,
} from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';

import { DropdownPopper } from '../Popover';

const displayAddress = (address: string) => `${address.slice(0, 9)}...${address.slice(-7)}`;

const generatePaths = (point: number) => {
  const paths = HwUtils.splitPath(`${LEDGER_BASE_PATH}/${point}'`);
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
};

const requestLedgerAddress = async ({
  paging: { offset, limit },
}: {
  paging: {
    offset: number;
    limit: number;
  };
}): Promise<any[]> => {
  const addressFromLedger: any[] = [];

  for (let i = offset; i < offset + limit; i++) {
    const buffer = generatePaths(i);
    const response = await bnJs.contractSettings.ledgerSettings.transport.send(0xe0, 0x02, 0x00, 0x01, buffer);

    const publicKeyLength = response[0];
    const addressLength = response[1 + publicKeyLength];

    addressFromLedger.push({
      publicKey: response.slice(1, 1 + publicKeyLength).toString('hex'),
      address: response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString(),
      chainCode: '',
      point: i,
      balance: '-',
    });
  }

  return addressFromLedger;
};

const LIMIT_PAGING_LEDGER = 5;

const LedgerAddressList = styled(Modal)`
  width: 500px;
`;

const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px 20px;
  margin: 0px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;

  ${({ theme }) => theme.mediaWidth.up360`
    width: 140px;
  `};

  > *:first-child {
    margin-bottom: 10px;
  }

  :hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;

const StyledModal = styled(({ mobile, ...rest }: ModalProps & { mobile?: boolean }) => <Modal {...rest} />).attrs({
  'aria-label': 'dialog',
})`
  &[data-reach-dialog-content] {
    ${({ mobile, theme }) =>
      !mobile &&
      `
      width: 320px;

      @media (min-width: 360px) {
        width: 100%;
        max-width: 360px;
      }
    `}
  }
`;

const Wrapper = styled.div`
  width: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const UnbrakableText = styled(Text)`
  white-space: nowrap;
`;

export default function WalletModal() {
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET);
  const toggleWalletModal = useWalletModalToggle();
  const [showLedgerAddress, updateShowledgerAddress] = useState(false);
  const [addressList, updateAddressList] = useState<any>([]);
  const [isLedgerLoading, setLedgerLoading] = useState(false);
  const [isLedgerErr, setIsLedgerErr] = useState(false);
  const upExtraSmall = useMedia('(min-width: 360px)');

  const [{ offset, limit }, updatePaging] = useState({
    offset: 0,
    limit: LIMIT_PAGING_LEDGER,
  });
  const currentLedgerAddressPage = useCurrentLedgerAddressPage();
  const changeCurrentLedgerAddressPage = useChangeCurrentLedgerAddressPage();

  const { requestAddress, hasExtension } = useIconReact();

  const handleOpenWallet = () => {
    toggleWalletModal();
    if (isMobile) {
      requestAddress();
    } else {
      if (hasExtension) {
        requestAddress();
      } else {
        window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl?hl=en', '_blank');
      }
    }
  };

  const updateLedgerAddress = React.useCallback(async ({ offset, limit }) => {
    const currentAddressList: any[] = await requestLedgerAddress({
      paging: {
        offset,
        limit,
      },
    });

    setIsLedgerErr(false);
    updateAddressList(currentAddressList);
    resolveBalanceByAddress(currentAddressList);
  }, []);

  const resolveBalanceByAddress = async (addressList: any[]) => {
    const data = await Promise.all(
      addressList.map((address: any) => {
        return new Promise((resolve, reject) => {
          bnJs.ICX.balanceOf(address.address)
            .then(balance => {
              resolve({
                ...address,
                balance: BalancedJs.utils.toIcx(balance.toFixed()).toFixed(2),
              });
            })
            .catch(reject);
        });
      }),
    );

    updateAddressList(data);
    setLedgerLoading(false);
  };

  const handleOpenLedger = async () => {
    setLedgerLoading(true);
    setIsLedgerErr(false);
    updateAddressList([]);
    updatePaging({
      offset: 0,
      limit: LIMIT_PAGING_LEDGER,
    });

    const timeout = setTimeout(() => {
      setIsLedgerErr(true);
    }, 3 * 1000);

    try {
      if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
        bnJs.contractSettings.ledgerSettings.transport.close();
      }
      const transport = await TransportWebHID.create();
      transport.setDebugMode && transport.setDebugMode(false);
      bnJs.inject({
        legerSettings: {
          transport,
        },
      });
      updateShowledgerAddress(true);

      await updateLedgerAddress({ offset, limit });
      clearTimeout(timeout);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.id === 'InvalidChannel') {
        await bnJs.contractSettings.ledgerSettings.transport.close();
        return setTimeout(() => {
          handleOpenLedger();
        }, 0);
      }
      alert('Insert your ledger device, then enter your password and try again.');
    }
  };

  const getLedgerPage = React.useCallback(
    async (pageNum: number) => {
      updateAddressList([]);

      setLedgerLoading(true);
      setIsLedgerErr(false);

      const timeout = setTimeout(() => {
        setIsLedgerErr(true);
      }, 3 * 1000);

      if (pageNum <= 0) {
        // should disable page number < 0;
        console.log('This is first pages, cannot request more address, try other please.');
        return;
      }

      // disable current page
      if (pageNum === currentLedgerAddressPage) {
        return;
      }

      const next = (pageNum - 1) * limit;

      await updateLedgerAddress({ offset: next, limit });
      clearTimeout(timeout);

      // setLedgerLoading(false);
      setIsLedgerErr(false);

      updatePaging({
        limit,
        offset: next,
      });
      changeCurrentLedgerAddressPage(pageNum);
    },
    [limit, currentLedgerAddressPage, updatePaging, changeCurrentLedgerAddressPage, updateLedgerAddress],
  );

  const chooseLedgerAddress = ({ address, point }: { address: string; point: number }) => {
    requestAddress({
      address,
      point,
    });
    bnJs.inject({
      account: address,
      legerSettings: {
        path: getLedgerAddressPath(point),
      },
    });
    updateShowledgerAddress(false);
    toggleWalletModal();
  };

  function getPageNumbers(index: number) {
    return index - 1 <= 0 ? [1, 2, 3] : [index - 1, index, index + 1];
  }

  //
  const activeLocale = useActiveLocale();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const toggleMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeMenu = () => {
    setAnchor(null);
  };

  useEffect(() => {
    if (walletModalOpen) {
      closeMenu();
    }
  }, [walletModalOpen]);

  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleWalletModal} mobile={isMobile}>
        <Wrapper>
          <Typography textAlign="center" mb={1}>
            <Trans>Sign in with</Trans>:
          </Typography>

          <Flex alignItems="stretch" justifyContent="space-between">
            <WalletOption onClick={handleOpenWallet}>
              <IconWalletIcon width="50" height="50" />
              <UnbrakableText>ICON</UnbrakableText>
            </WalletOption>

            {upExtraSmall && <VerticalDivider text={t`or`}></VerticalDivider>}

            <WalletOption onClick={handleOpenLedger}>
              <LedgerIcon width="50" height="50" />
              <UnbrakableText>Ledger</UnbrakableText>
            </WalletOption>
          </Flex>

          <Flex justifyContent="center" alignItems="center" sx={{ borderRadius: 10 }} padding={2} bg="bg3">
            <Typography mr={1}>
              <Trans>Use Balanced in</Trans>:
            </Typography>
            <ClickAwayListener onClickAway={closeMenu}>
              <div>
                <UnderlineTextWithArrow onClick={toggleMenu} text={LOCALE_LABEL[activeLocale]} arrowRef={arrowRef} />
                <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end" zIndex={2000}>
                  <MenuList>
                    {SUPPORTED_LOCALES.map((locale: SupportedLocale) => (
                      <LanguageMenuItem
                        locale={locale}
                        active={activeLocale === locale}
                        onClick={closeMenu}
                        key={locale}
                      />
                    ))}
                  </MenuList>
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </Flex>

          <Typography textAlign="center" as="div">
            <Trans>Use at your own risk. Project contributors are not liable for any lost or stolen funds.</Trans>
            <Box>
              <Link href="https://balanced.network/disclaimer/" target="_blank">
                <Trans>View disclaimer</Trans>
              </Link>
            </Box>
          </Typography>
        </Wrapper>
      </StyledModal>

      <LedgerAddressList
        isOpen={showLedgerAddress}
        onDismiss={() => {
          if (isLedgerLoading) return;

          updateShowledgerAddress(false);
        }}
      >
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3}>
            <Trans>Choose a wallet from your Ledger:</Trans>
          </Typography>
          {isLedgerLoading && (
            <Flex justifyContent="center">
              <Spinner></Spinner>
            </Flex>
          )}
          {isLedgerErr && (
            <Flex justifyContent="center" mt={4} mb={4}>
              <Typography>
                <Trans>Cancel any pending transactions on your Ledger, or give Chrome permission to use it.</Trans>
              </Typography>
            </Flex>
          )}
          {!isLedgerErr && (
            <>
              <table className="wallet">
                <tbody>
                  {addressList.map((address: any) => {
                    return (
                      <tr
                        key={address.point}
                        onClick={() => {
                          chooseLedgerAddress({
                            address: address.address,
                            point: address.point,
                          });
                        }}
                      >
                        <td style={{ textAlign: 'left' }}>{displayAddress(address.address)}</td>
                        <td style={{ textAlign: 'right' }}>{address.balance} ICX</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!isLedgerLoading && (
                <ul className="pagination">
                  <li
                    onClick={async () => {
                      await getLedgerPage(currentLedgerAddressPage - 1);
                    }}
                  >
                    ˂
                  </li>
                  {getPageNumbers(currentLedgerAddressPage).map(value => {
                    return (
                      <li
                        key={Date.now() + Math.random()}
                        className={value === currentLedgerAddressPage ? 'actived' : ''}
                        onClick={async () => {
                          await getLedgerPage(value);
                        }}
                      >
                        {value}
                      </li>
                    );
                  })}
                  <li
                    onClick={async () => {
                      await getLedgerPage(currentLedgerAddressPage + 1);
                    }}
                  >
                    ˃
                  </li>
                </ul>
              )}
            </>
          )}
        </Flex>
      </LedgerAddressList>
    </>
  );
}
