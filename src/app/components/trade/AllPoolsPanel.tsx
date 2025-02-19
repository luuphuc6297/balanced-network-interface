import React from 'react';

import { Trans } from '@lingui/macro';
import { Skeleton } from '@material-ui/lab';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import Divider from 'app/components/Divider';
import PoolLogo from 'app/components/PoolLogo';
import { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { PairInfo } from 'constants/pairs';
import useSort from 'hooks/useSort';
import { useAllPairs } from 'queries/reward';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo, useMintActionHandlers } from 'store/mint/hooks';
import { getFormattedNumber } from 'utils/formatter';

import { MAX_BOOST } from '../home/BBaln/utils';

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
  min-width: 930px;
  overflow: hidden;
`;

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: repeat(5, 1fr);
  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    grid-template-columns: 2fr repeat(4, 1fr);
  `}
  ${({ theme }) => theme.mediaWidth.upLarge`
    grid-template-columns: 1.2fr repeat(4, 1fr);
  `}
  > * {
    justify-content: flex-end;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const DataText = styled(Flex)`
  display: flex;
  font-size: 16px;
  color: #ffffff;
  align-items: center;
  line-height: 1.4;
`;

const PairGrid = styled(DashGrid)`
  cursor: pointer;
  &:hover {
    & > div {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary} !important;
        path {
          stroke: ${({ theme }) => theme.colors.primary} !important;
        }
      }
    }

    > ${DataText} {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const StyledSkeleton = styled(Skeleton)`
  background-color: rgba(44, 169, 183, 0.2) !important;
  &.pool-icon-skeleton {
    position: absolute;
    left: 0;

    &:last-of-type {
      left: 38px;
    }
  }
`;

export const HeaderText = styled(Flex)<{ className?: string }>`
  display: flex;
  font-size: 14px;
  color: #d5d7db;
  letter-spacing: 3px;
  text-transform: uppercase;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all ease 200ms;
  padding-left: 15px;
  white-space: nowrap;

  &:before,
  &:after,
  span:after,
  span:before {
    content: '';
    position: absolute;
    width: 8px;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.primary};
    display: inline-block;
    top: 50%;
    transition: all ease 200ms;
    right: 0;
    transform-origin: center;
    opacity: 0;
    transform: rotate(0) translate3d(0, 0, 0);
  }

  ${props =>
    props.className === 'ASC' &&
    css`
      padding-right: 15px;
      padding-left: 0;
      &:before,
      &:after,
      span:after,
      span:before {
        opacity: 1;
      }

      &:before,
      span:before {
        transform: rotate(-45deg) translate3d(-2px, -3px, 0);
      }

      &:after,
      span:after {
        transform: rotate(45deg) translate3d(0px, -1px, 0);
      }
    `};

  ${props =>
    props.className === 'DESC' &&
    css`
      padding-right: 15px;
      padding-left: 15px;
      &:before,
      &:after,
      span:after,
      span:before {
        opacity: 1;
      }

      &:before,
      span:before {
        transform: rotate(45deg) translate3d(-3px, 2px, 0);
      }

      &:after,
      span:after {
        transform: rotate(-45deg) translate3d(1px, 0, 0);
      }
    `};

  &:first-of-type {
    padding-left: 0;
    &::before,
    &::after {
      display: none;
    }

    span {
      position: relative;

      &::before,
      &:after {
        margin-right: -15px;
      }
    }
  }
`;

const APYItem = styled(Flex)`
  align-items: flex-end;
  line-height: 25px;
`;

const QuestionWrapper = styled(Box)`
  margin: 0 5px 0 5px;
`;

const TooltipWrapper = styled.span`
  display: inline-block;
  line-height: 0.8;
`;

const SkeletonPairPlaceholder = () => {
  return (
    <DashGrid my={2}>
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '95px', minHeight: '48px', position: 'relative' }}>
            <StyledSkeleton variant="circle" width={48} height={48} className="pool-icon-skeleton" />
            <StyledSkeleton variant="circle" width={48} height={48} className="pool-icon-skeleton" />
          </Box>
          <Text ml={2}>
            <StyledSkeleton width={90} />
          </Text>
        </Flex>
      </DataText>
      <DataText>
        <StyledSkeleton width={50} />
      </DataText>
      <DataText>
        <StyledSkeleton width={100} />
      </DataText>
      <DataText>
        <StyledSkeleton width={100} />
      </DataText>
      <DataText>
        <StyledSkeleton width={70} />
      </DataText>
    </DashGrid>
  );
};

type PairItemProps = {
  pair: PairInfo & {
    tvl: number;
    apy: number;
    feesApy: number;
    apyTotal: number;
    participant: number;
    volume: number;
    fees: number;
  };
  onClick: (pair: PairInfo) => void;
};

const PairItem = ({ pair, onClick }: PairItemProps) => (
  <>
    <PairGrid my={2} onClick={() => onClick(pair)}>
      <DataText minWidth={'220px'}>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '95px' }}>
            <PoolLogo baseCurrency={pair.baseToken} quoteCurrency={pair.quoteToken} />
          </Box>
          <Text ml={2}>{`${pair.baseCurrencyKey} / ${pair.quoteCurrencyKey}`}</Text>
        </Flex>
      </DataText>
      <DataText minWidth={'200px'}>
        <Flex flexDirection="column" py={2} alignItems="flex-end">
          {pair.apy && (
            <APYItem>
              <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                BALN:
              </Typography>
              {`${getFormattedNumber(pair.apy, 'percent2')} - ${getFormattedNumber(
                MAX_BOOST.times(pair.apy).toNumber(),
                'percent2',
              )}`}
            </APYItem>
          )}
          {pair.feesApy !== 0 && (
            <APYItem>
              <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                <Trans>Fees:</Trans>
              </Typography>
              {getFormattedNumber(pair.feesApy, 'percent2')}
            </APYItem>
          )}
          {!pair.feesApy && !pair.apy && '-'}
        </Flex>
      </DataText>
      <DataText>{getFormattedNumber(pair.tvl, 'currency0')}</DataText>
      <DataText>{pair.volume ? getFormattedNumber(pair.volume, 'currency0') : '-'}</DataText>
      <DataText>{pair.fees ? getFormattedNumber(pair.fees, 'currency0') : '-'}</DataText>
    </PairGrid>
    <Divider />
  </>
);

export default function AllPoolsPanel() {
  const allPairs = useAllPairs();
  const { sortBy, handleSortSelect, sortData } = useSort({ key: 'apyTotal', order: 'DESC' });
  const { noLiquidity } = useDerivedMintInfo();
  const { onCurrencySelection } = useMintActionHandlers(noLiquidity);

  const handlePoolLick = (pair: PairInfo) => {
    if (pair.id === 1) {
      onCurrencySelection(Field.CURRENCY_A, pair.quoteToken);
    } else {
      onCurrencySelection(Field.CURRENCY_A, pair.baseToken);
      onCurrencySelection(Field.CURRENCY_B, pair.quoteToken);
    }
  };

  return (
    <Box overflow="auto">
      <List>
        <DashGrid>
          <HeaderText
            role="button"
            minWidth="220px"
            className={sortBy.key === 'baseCurrencyKey' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'baseCurrencyKey',
              })
            }
          >
            <span>
              <Trans>POOL</Trans>
            </span>
          </HeaderText>
          <HeaderText
            minWidth="200px"
            role="button"
            className={sortBy.key === 'apyTotal' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'apyTotal',
              })
            }
          >
            <TooltipWrapper onClick={e => e.stopPropagation()}>
              <MouseoverTooltip
                width={330}
                text={
                  <>
                    <Trans>
                      The BALN APY is calculated from the USD value of BALN rewards allocated to a pool. Your rate will
                      vary based on the amount of bBALN you hold.
                    </Trans>
                    <br />
                    <br />
                    <Trans>The fee APY is calculated from the swap fees earned by a pool in the last 30 days.</Trans>
                    <Typography marginTop={'20px'} color="text1" fontSize={14}>
                      <Trans>Impermanent loss is not factored in.</Trans>
                    </Typography>
                  </>
                }
                placement="top"
                strategy="absolute"
              >
                <QuestionWrapper>
                  <QuestionIcon className="header-tooltip" width={14} />
                </QuestionWrapper>
              </MouseoverTooltip>
            </TooltipWrapper>
            <Trans>APY</Trans>
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'tvl' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'tvl',
              })
            }
          >
            <Trans>LIQUIDITY</Trans>
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'volume' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'volume',
              })
            }
          >
            <Trans>VOLUME (24H)</Trans>
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'fees' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'fees',
              })
            }
          >
            <Trans>FEES (24H)</Trans>
          </HeaderText>
        </DashGrid>

        {allPairs ? (
          sortData(Object.values(allPairs)).map(pair => <PairItem pair={pair} onClick={handlePoolLick} />)
        ) : (
          <>
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
          </>
        )}
      </List>
    </Box>
  );
}
