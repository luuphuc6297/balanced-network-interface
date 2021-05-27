import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import ShouldLedgerConfirmMessage from 'app/components/DepositStakeMessage';
import DropdownText from 'app/components/DropdownText';
import { Link } from 'app/components/Link';
import Modal from 'app/components/Modal';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { Typography } from 'app/theme';
import { ReactComponent as FlipIcon } from 'assets/icons/flip.svg';
import bnJs from 'bnJs';
import { getPairableCurrencies, CURRENCY } from 'constants/currency';
import {
  useSwapSlippageTolerance,
  useWalletModalToggle,
  useSetSlippageTolerance,
  useChangeShouldLedgerSign,
  useShouldLedgerSign,
} from 'store/application/hooks';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { CurrencyKey, Price } from 'types';
import { formatBigNumber, maxAmountSpend } from 'utils';

import { BrightPanel, swapMessage } from './utils';

export default function SwapPanel() {
  const { account } = useIconReact();
  const { independentField, typedValue } = useSwapState();
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const { trade, currencyBalances, currencyKeys, parsedAmount, inputError } = useDerivedSwapInfo();

  const parsedAmounts = React.useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }),
    [independentField, parsedAmount, trade],
  );

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const { onUserInput, onCurrencySelection, onSwitchTokens } = useSwapActionHandlers();

  const handleTypeInput = React.useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput],
  );
  const handleTypeOutput = React.useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput],
  );

  const handleInputSelect = React.useCallback(
    (inputCurrencyKey: CurrencyKey) => onCurrencySelection(Field.INPUT, inputCurrencyKey),
    [onCurrencySelection],
  );
  const handleOutputSelect = React.useCallback(
    (outputCurrencyKey: CurrencyKey) => onCurrencySelection(Field.OUTPUT, outputCurrencyKey),
    [onCurrencySelection],
  );

  const maxInputAmount = maxAmountSpend(currencyBalances[Field.INPUT]);
  const handleMaxInput = React.useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toFixed());
  }, [maxInputAmount, onUserInput]);

  const maxOutputAmount = maxAmountSpend(currencyBalances[Field.OUTPUT]);
  const handleMaxOutput = React.useCallback(() => {
    maxOutputAmount && onUserInput(Field.OUTPUT, maxOutputAmount.toFixed());
  }, [maxOutputAmount, onUserInput]);

  const pairableCurrencyList = React.useMemo(() => getPairableCurrencies(currencyKeys[Field.INPUT]), [currencyKeys]);

  const [showInverted, setShowInverted] = React.useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();
  const isValid = !inputError;

  // old code
  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
    changeShouldLedgerSign(false);
  };

  const toggleWalletModal = useWalletModalToggle();

  const handleSwap = () => {
    if (!account) {
      toggleWalletModal();
    } else {
      setShowSwapConfirm(true);
    }
  };

  const minimumToReceive = trade?.minimumAmountOut(slippageTolerance);

  const addTransaction = useTransactionAdder();

  const handleSwapConfirm = async () => {
    if (!trade || !account) return;

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const message = swapMessage(
      trade.inputAmount.amount.dp(2).toFormat(),
      trade.inputAmount.currencyKey,
      trade.outputAmount.amount.dp(2).toFormat(),
      trade.outputAmount.currencyKey,
    );

    if (trade.isQueue) {
      //handle queue
      if (trade.inputAmount.currencyKey === 'sICX') {
        bnJs
          .inject({ account })
          .sICX.swapToICX(BalancedJs.utils.toLoop(trade.inputAmount.amount))
          .then((res: any) => {
            setShowSwapConfirm(false);
            addTransaction(
              { hash: res.result },
              {
                pending: message.pendingMessage,
                summary: message.successMessage,
              },
            );
            handleTypeInput('');
            handleTypeOutput('');
          })
          .catch(e => {
            console.error('error', e);
          })
          .finally(() => {
            changeShouldLedgerSign(false);
          });
      } else {
        bnJs
          .inject({ account })
          .Staking.stakeICX(account, BalancedJs.utils.toLoop(trade.inputAmount.amount))
          .then((res: any) => {
            setShowSwapConfirm(false);
            addTransaction(
              { hash: res.result },
              {
                pending: message.pendingMessage,
                summary: message.successMessage,
              },
            );
            handleTypeInput('');
            handleTypeOutput('');
          })
          .catch(e => {
            console.error('error', e);
          })
          .finally(() => {
            changeShouldLedgerSign(false);
          });
      }
    } else {
      const minReceived = trade.minimumAmountOut(slippageTolerance);
      const tokenContract = bnJs.inject({ account })[trade.inputAmount.currencyKey];
      console.log(
        trade.inputAmount.amount.toFixed(),
        trade.outputAmount.currencyKey,
        BalancedJs.utils.toLoop(minReceived.amount).toFixed(),
      );

      tokenContract
        .swap(
          BalancedJs.utils.toLoop(trade.inputAmount.amount),
          trade.outputAmount.currencyKey,
          BalancedJs.utils.toLoop(minReceived.amount),
        )
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: message.pendingMessage,
              summary: message.successMessage,
            },
          );
          handleTypeInput('');
          handleTypeOutput('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    }
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">Swap</Typography>
            <Typography as="div" hidden={!account}>
              {'Wallet: '}
              <MaxButton onClick={handleMaxInput}>
                {`${formatBigNumber(currencyBalances[Field.INPUT]?.amount, 'currency')} ${currencyKeys[Field.INPUT]}`}
              </MaxButton>
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={false}
              currency={currencyKeys[Field.INPUT]}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              id="swap-currency-input"
              currencyList={CURRENCY}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="center" my={-1}>
            <FlipButton onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
            </FlipButton>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">For</Typography>
            <Typography as="div" hidden={!account}>
              {'Wallet: '}
              <MaxButton onClick={handleMaxOutput}>
                {`${formatBigNumber(currencyBalances[Field.OUTPUT]?.amount, 'currency')} ${currencyKeys[Field.OUTPUT]}`}
              </MaxButton>
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              showMaxButton={false}
              currency={currencyKeys[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              id="swap-currency-output"
              currencyList={pairableCurrencyList}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>Minimum to receive</Typography>
            {minimumToReceive && (
              <Typography>
                {minimumToReceive.amount.dp(4).toFormat()} {minimumToReceive.currencyKey}
              </Typography>
            )}
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>Execution price</Typography>
            {trade && (
              <TradePrice price={trade?.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
            )}
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>Liquidity provider fee</Typography>
            {trade && (
              <Typography>
                {trade.fee.amount.dp(4).toFormat()} {trade.fee.currencyKey}
              </Typography>
            )}
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography as="span">
              Slippage tolerance
              <QuestionHelper text="If the price slips by more than this amount, your swap will fail." />
            </Typography>
            <DropdownText text={`${formatBigNumber(new BigNumber(slippageTolerance / 100), 'currency')}%`}>
              <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
            </DropdownText>
          </Flex>

          <Flex justifyContent="center" mt={5}>
            {isValid ? (
              <Button color="primary" onClick={handleSwap}>
                Swap
              </Button>
            ) : (
              <Button disabled={!!account} color="primary" onClick={handleSwap}>
                {account ? inputError : 'Sign In'}
              </Button>
            )}
          </Flex>
        </AutoColumn>
      </BrightPanel>

      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Swap {currencyKeys[Field.INPUT]} for {currencyKeys[Field.OUTPUT]}?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {`${formatBigNumber(trade?.executionPrice.value, 'ratio')} ${trade?.executionPrice.quoteCurrencyKey} 
              per ${trade?.executionPrice.baseCurrencyKey}`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Pay</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(formattedAmounts[Field.INPUT]), 'currency')} {currencyKeys[Field.INPUT]}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(formattedAmounts[Field.OUTPUT]), 'currency')}{' '}
                {currencyKeys[Field.OUTPUT]}
              </Typography>
            </Box>
          </Flex>

          <Typography
            textAlign="center"
            hidden={currencyKeys[Field.INPUT] === 'ICX' && currencyKeys[Field.OUTPUT] === 'sICX'}
          >
            Includes a fee of {formatBigNumber(trade?.fee.amount, 'currency')} {currencyKeys[Field.INPUT]}.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleSwapConfirm}>Swap</Button>
          </Flex>
          {shouldLedgerSign && <ShouldLedgerConfirmMessage />}
        </Flex>
      </Modal>
    </>
  );
}

interface TradePriceProps {
  price: Price;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

const StyledPriceContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  padding: 0;
  border: none;
  cursor: pointer;
`;

function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  let formattedPrice: string;
  try {
    formattedPrice = showInverted ? price.value.toFormat(4) : price.invert().value.toFormat(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted ? `${price.quoteCurrencyKey}` : `${price.baseCurrencyKey} `;
  const labelInverted = showInverted ? `${price.baseCurrencyKey} ` : `${price.quoteCurrencyKey}`;
  const flipPrice = React.useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted]);

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`;

  return (
    <StyledPriceContainer onClick={flipPrice} title={text}>
      <div style={{ alignItems: 'center', display: 'flex', width: 'fit-content' }}>
        <Typography>{text}</Typography>
      </div>
    </StyledPriceContainer>
  );
}

const FlipButton = styled(Box)`
  cursor: pointer;
`;

const MaxButton = styled(Link)`
  cursor: pointer;
`;

const AutoColumn = styled(Box)<{
  gap?: 'sm' | 'md' | 'lg' | string;
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between';
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap }) => (gap === 'sm' && '10px') || (gap === 'md' && '15px') || (gap === 'lg' && '25px') || gap};
  justify-items: ${({ justify }) => justify && justify};
`;
