import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { useDispatch } from 'react-redux';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Wrapper, UnderlineText, StyledArrowDownIcon } from 'app/components/DropdownText';
import { List, ListItem, DashGrid, HeaderText, DataText } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { Typography } from 'app/theme';
import { Pair, SUPPORTED_PAIRS } from 'constants/currency';
import { useAllPairsAPY } from 'queries/reward';
import { resetMintState } from 'store/mint/actions';
import { useSetPair, usePoolPair } from 'store/pool/hooks';

export default function LiquiditySelect() {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  // update the width on a window resize
  const ref = React.useRef<HTMLElement>(null);
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const selectedPair = usePoolPair();
  const setPair = useSetPair();
  const dispatch = useDispatch();

  const handleSelectPool = (pl: Pair) => {
    toggleOpen();
    setPair(pl);
    dispatch(resetMintState());
  };

  const apys = useAllPairsAPY();

  return (
    <Flex alignItems="flex-end" ref={ref}>
      <Typography variant="h2">Supply:&nbsp;</Typography>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div>
          <StyledWrapper onClick={toggleOpen}>
            <UnderlineText>{selectedPair.pair}</UnderlineText>
            <StyledArrowDownIcon />
          </StyledWrapper>

          <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom">
            <List style={{ width: width }}>
              <DashGrid>
                <HeaderText>POOL</HeaderText>
                <HeaderText textAlign="right">APY</HeaderText>
              </DashGrid>
              {SUPPORTED_PAIRS.map(pool => (
                <ListItem key={pool.pair} onClick={() => handleSelectPool(pool)}>
                  <DataText variant="p" fontWeight="bold">
                    {pool.pair}
                  </DataText>
                  <DataText variant="p" textAlign="right">
                    {apys && apys[pool.poolId] ? apys[pool.poolId].times(100).dp(2).toFormat() : '-'}%
                  </DataText>
                </ListItem>
              ))}
            </List>
          </PopperWithoutArrow>
        </div>
      </ClickAwayListener>
    </Flex>
  );
}

const StyledWrapper = styled(Wrapper)`
  font-size: 18px;
  padding-bottom: 5px;
  color: white;
  :hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
