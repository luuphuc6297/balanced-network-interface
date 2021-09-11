import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import { DefaultLayout } from 'app/components/Layout';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import ProposalTypesSelect from 'app/components/newproposal/ProposalTypesSelect';
import RatioInput from 'app/components/newproposal/RatioInput';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { PROPOSAL_CONFIG, PROPOSAL_TYPE } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { usePlatformDayQuery } from 'queries/vote';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX, useWalletFetchBalances } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

const NewProposalContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
`;

const ProposalDetailContainer = styled(Box)`
  margin-top: 30px;
  border-radius: 10px;
  padding: 35px 35px;
  margin-bottom: 50px;
  background-color: ${({ theme }) => theme.colors.bg2};
`;

const FieldContainer = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const FieldInput = styled.input`
  margin-top: 10px;
  margin-bottom: 20px;
  border-radius: 10px;
  width: 100%;
  height: 40px;
  border: none;
  caret-color: white;
  color: white;
  padding: 3px 20px;
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
  }
`;

const FieldTextArea = styled.textarea`
  margin-top: 10px;
  margin-bottom: 10px;
  border-radius: 10px;
  width: 100%;
  min-height: 150px;
  border: none;
  caret-color: white;
  color: white;
  padding: 15px 20px;
  font-family: tex-gyre-adventor, Arial, sans-serif;
  font-size: 16px;
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
    transition: border 0.2s ease;
  }
`;

interface Touched {
  forumLink: boolean;
  ratio: boolean;
}

export function NewProposalPage() {
  const theme = useTheme();
  const details = useBALNDetails();
  const { account } = useIconReact();
  useWalletFetchBalances(account);
  const [selectedProposalType, setProposalType] = React.useState<PROPOSAL_TYPE>(PROPOSAL_TYPE.TEXT);

  //Form
  const [title, setTitle] = useState('');
  const [forumLink, setForumLink] = useState('');
  const [description, setDescription] = useState('');
  const [ratioInputValue, setRatioInputValue] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<Touched>({
    forumLink: false,
    ratio: false,
  });

  // modal
  const [open, setOpen] = React.useState(false);
  const hasEnoughICX = useHasEnoughICX();

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
    changeShouldLedgerSign(false);
  };

  const addTransaction = useTransactionAdder();

  //Form
  const isTextProposal = selectedProposalType === PROPOSAL_TYPE.TEXT;
  const totalBALN: BigNumber = React.useMemo(() => details['Total balance'] || new BigNumber(0), [details]);
  const stakedBalance: BigNumber = React.useMemo(() => details['Staked balance'] || new BigNumber(0), [details]);
  const minimumStakeBalance = totalBALN.times(0.1 / 100);
  const isStakeValid = stakedBalance.isGreaterThanOrEqualTo(minimumStakeBalance);

  const { data: platformDay } = usePlatformDayQuery();

  // @ts-ignore
  const { submitParams, validate } = !isTextProposal ? PROPOSAL_CONFIG[selectedProposalType] : {};

  //Validation
  const validateRatioInput = () => {
    const arrayRatioValue = Object.values(ratioInputValue);
    const isEmpty = arrayRatioValue.every(ratio => ratio === '');
    if (isEmpty) return { isValid: false };
    const totalRatio = arrayRatioValue.reduce((sum: number, currentValue: string) => sum + Number(currentValue), 0);

    return !!validate && validate(totalRatio);
  };

  const isTitleValid = title.trim() && title.length <= 100;
  const isDescriptionValid = description.trim() && description.length <= 500;
  const isForumLinkValid = forumLink.includes('gov.balanced.network');

  const { isValid, message } = validateRatioInput();

  const isValidRatioInput = isTextProposal || isValid;

  const isValidForm =
    account && isStakeValid && isTitleValid && isDescriptionValid && isForumLinkValid && isValidRatioInput;

  const onTitleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setTitle(event.currentTarget.value);
  };

  const onForumInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setForumLink(event.currentTarget.value);
    !touched.forumLink && setTouched({ ...touched, forumLink: true });
  };

  const onTextAreaInputChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setDescription(event.currentTarget.value);
  };

  const onRatioInputChange = (value: string, recipent_name: string) => {
    setRatioInputValue({ ...ratioInputValue, [recipent_name]: value });
    !touched.ratio && setTouched({ ...touched, ratio: true });
  };

  useEffect(() => setRatioInputValue({}), [selectedProposalType]);

  const resetForm = () => {
    setTitle('');
    setForumLink('');
    setDescription('');
    setRatioInputValue({});
    setTouched({
      forumLink: false,
      ratio: false,
    });
  };

  const submit = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const actions = isTextProposal ? '{}' : JSON.stringify(submitParams(ratioInputValue));

    platformDay &&
      bnJs
        .inject({ account })
        .Governance.defineVote(title, description, platformDay + 1, platformDay, actions)
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Submitting a proposal...',
                summary: `${selectedProposalType} proposal submitted.`,
              },
            );
            toggleOpen();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          resetForm();
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
  };

  const handleProposalTypeSelect = (type: PROPOSAL_TYPE) => {
    setProposalType(type);
  };

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <NewProposalContainer>
        <Breadcrumb title={'New proposal'} locationText={'Vote'} locationPath={'/vote'} />
        <ProposalTypesSelect onSelect={handleProposalTypeSelect} selected={selectedProposalType} />
        <ProposalDetailContainer>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Title
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${title.length}/100`}
            </Typography>
          </FieldContainer>
          <FieldInput type="text" onChange={onTitleInputChange} value={title} />
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Forum link
            </Typography>
          </FieldContainer>
          <Tooltip
            containerStyle={{ width: 'auto' }}
            refStyle={{ display: 'block' }}
            placement="bottom"
            text="Must link to a discussion on gov.balanced.network."
            show={touched.forumLink && !forumLink.includes('gov.balanced.network')}
          >
            <FieldInput type="text" onChange={onForumInputChange} value={forumLink} />
          </Tooltip>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Description
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${description.length}/500`}
            </Typography>
          </FieldContainer>
          <FieldTextArea onChange={onTextAreaInputChange} value={description} />
          {!isTextProposal && (
            <RatioInput
              onRatioChange={onRatioInputChange}
              showErrorMessage={touched.ratio && message && !isValid}
              value={ratioInputValue}
              message={message}
              proposalType={selectedProposalType}
            />
          )}

          <Typography variant="content" mt="25px" mb="25px" textAlign="center">
            It costs 100 bnUSD to submit a proposal.
          </Typography>
          <div style={{ textAlign: 'center' }}>
            <Button disabled={!isValidForm} onClick={toggleOpen}>
              Submit
            </Button>
          </div>
          {account && !isStakeValid && (
            <Typography variant="content" mt="25px" mb="25px" textAlign="center" color={theme.colors.alert}>
              Stake at least {minimumStakeBalance.dp(2).toFormat()} BALN if you want to propose a change.
            </Typography>
          )}
        </ProposalDetailContainer>
      </NewProposalContainer>
      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Submit proposal?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            100 bnUSD
          </Typography>

          <Typography textAlign="center" marginTop="10px">
            Voting will begin at 5pm UTC,
            <br />
            and ends after 5 days.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner />}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Go back
                </TextButton>
                <Button onClick={submit} fontSize={14} disabled={!hasEnoughICX}>
                  Submit proposal
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </DefaultLayout>
  );
}
