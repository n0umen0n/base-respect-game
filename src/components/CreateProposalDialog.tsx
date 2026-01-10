import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ethers } from 'ethers';

interface CreateProposalDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateProposal: (
    type: 'ban' | 'transfer',
    data: BanProposalData | TransferProposalData
  ) => Promise<void>;
  isTopMember: boolean;
}

interface BanProposalData {
  targetMember: string;
  description: string;
}

interface TransferProposalData {
  token: 'ETH' | 'cbBTC' | 'EURC' | 'USDC';
  recipient: string;
  amount: string;
  description: string;
}

const TOKEN_ADDRESSES = {
  cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
} as const;

const TOKEN_DECIMALS = {
  ETH: 18,
  cbBTC: 8,
  EURC: 6,
  USDC: 6,
} as const;

export default function CreateProposalDialog({
  open,
  onClose,
  onCreateProposal,
  isTopMember,
}: CreateProposalDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Character limits
  const CHAR_LIMITS = {
    description: 1000,
  };

  const [proposalType, setProposalType] = useState<'ban' | 'transfer'>('transfer');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ban proposal fields
  const [targetMember, setTargetMember] = useState('');
  const [banDescription, setBanDescription] = useState('');

  // Transfer proposal fields
  const [token, setToken] = useState<'ETH' | 'cbBTC' | 'EURC' | 'USDC'>('USDC');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');

  const handleClose = () => {
    if (!creating) {
      setTargetMember('');
      setBanDescription('');
      setToken('USDC');
      setRecipient('');
      setAmount('');
      setTransferDescription('');
      setError(null);
      onClose();
    }
  };

  const validateAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  const handleCreate = async () => {
    setError(null);

    if (!isTopMember) {
      setError('Only top 6 apes can create proposals');
      return;
    }

    try {
      setCreating(true);

      if (proposalType === 'ban') {
        if (!targetMember || !banDescription) {
          setError('Please fill in all fields');
          return;
        }

        if (!validateAddress(targetMember)) {
          setError('Invalid target ape address');
          return;
        }

        if (banDescription.length > CHAR_LIMITS.description) {
          setError(`Description must be ${CHAR_LIMITS.description} characters or less`);
          return;
        }

        await onCreateProposal('ban', {
          targetMember,
          description: banDescription,
        });
      } else {
        if (!recipient || !amount || !transferDescription) {
          setError('Please fill in all fields');
          return;
        }

        if (!validateAddress(recipient)) {
          setError('Invalid recipient address');
          return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          setError('Invalid amount');
          return;
        }

        if (transferDescription.length > CHAR_LIMITS.description) {
          setError(`Description must be ${CHAR_LIMITS.description} characters or less`);
          return;
        }

        await onCreateProposal('transfer', {
          token,
          recipient,
          amount,
          description: transferDescription,
        });
      }

      handleClose();
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      
      // Decode the error message
      let errorMessage = 'Failed to create proposal';
      
      // Check if it's the "Not top" error (user not in top 6)
      const errorStr = err.message || err.toString();
      if (errorStr.includes('4e6f7420746f70') || errorStr.includes('Not top')) {
        errorMessage = 'Only top 6 apes can create proposals. Keep contributing to move up the leaderboard!';
      } else if (errorStr.includes('revert')) {
        errorMessage = 'Transaction reverted. Please check your permissions and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle
        sx={{
          fontFamily: '"Press Start 2P", sans-serif',
          fontSize: { xs: '0.7rem', sm: '0.9rem' },
          padding: { xs: 2, sm: 3 },
        }}
      >
        CREATE PROPOSAL
      </DialogTitle>
      <DialogContent>
        {!isTopMember && (
          <Alert severity="warning" sx={{ marginBottom: 2 }}>
            Only top 6 apes can create proposals
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ marginTop: 2 }}>
          <Typography
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.7rem',
              marginBottom: 2,
            }}
          >
            PROPOSAL TYPE
          </Typography>
          <ToggleButtonGroup
            value={proposalType}
            exclusive
            onChange={(_, value) => value && setProposalType(value)}
            fullWidth
            sx={{ marginBottom: 3 }}
          >
            <ToggleButton
              value="transfer"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.6rem',
              }}
            >
              TRANSFER
            </ToggleButton>
            <ToggleButton
              value="ban"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.6rem',
              }}
            >
              BAN APE
            </ToggleButton>
          </ToggleButtonGroup>

          {proposalType === 'ban' ? (
            <>
              <TextField
                label="Target Ape Address"
                value={targetMember}
                onChange={(e) => setTargetMember(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="0x..."
                error={targetMember !== '' && !validateAddress(targetMember)}
                helperText={
                  targetMember !== '' && !validateAddress(targetMember)
                    ? 'Invalid address'
                    : ''
                }
              />
              <TextField
                label="Description / Reason"
                value={banDescription}
                onChange={(e) => setBanDescription(e.target.value)}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                placeholder="Explain why this ape should be banned..."
                inputProps={{ maxLength: CHAR_LIMITS.description }}
                helperText={`${banDescription.length}/${CHAR_LIMITS.description} characters`}
                FormHelperTextProps={{
                  sx: {
                    fontSize: '0.7rem',
                    color: banDescription.length >= CHAR_LIMITS.description * 0.9 ? '#ff9800' : 'text.secondary',
                  }
                }}
              />
            </>
          ) : (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Token</InputLabel>
                <Select
                  value={token}
                  label="Token"
                  onChange={(e) => setToken(e.target.value as any)}
                >
                  <MenuItem value="ETH">ETH</MenuItem>
                  <MenuItem value="cbBTC">cbBTC</MenuItem>
                  <MenuItem value="EURC">EURC</MenuItem>
                  <MenuItem value="USDC">USDC</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="0x..."
                error={recipient !== '' && !validateAddress(recipient)}
                helperText={
                  recipient !== '' && !validateAddress(recipient)
                    ? 'Invalid address'
                    : ''
                }
              />

              <TextField
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                margin="normal"
                type="number"
                placeholder="0.0"
                helperText={`Amount in ${token}`}
              />

              <TextField
                label="Description"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                placeholder="Explain the purpose of this transfer..."
                inputProps={{ maxLength: CHAR_LIMITS.description }}
                helperText={`${transferDescription.length}/${CHAR_LIMITS.description} characters`}
                FormHelperTextProps={{
                  sx: {
                    fontSize: '0.7rem',
                    color: transferDescription.length >= CHAR_LIMITS.description * 0.9 ? '#ff9800' : 'text.secondary',
                  }
                }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={creating || !isTopMember}
          sx={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.7rem',
          }}
        >
          {creating ? 'CREATING...' : 'CREATE'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export type { BanProposalData, TransferProposalData };
export { TOKEN_ADDRESSES, TOKEN_DECIMALS };

