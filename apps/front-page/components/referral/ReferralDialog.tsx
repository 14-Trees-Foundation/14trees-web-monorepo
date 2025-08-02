import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Stack,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
    LinkedinShareButton,
    WhatsappShareButton,
    LinkedinIcon,
    WhatsappIcon,
    TelegramShareButton,
    TelegramIcon,
} from 'react-share';
import { apiClient } from '~/api/apiClient';

interface ReferralDialogProps {
    linkType: 'donate' | 'plant-memory'
    open: boolean;
    onClose: () => void;
    c_key?: string;
}

interface Campaign {
    name: string;
    c_key: string;
}

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

export const ReferralDialog = ({ linkType, open, onClose, c_key }: ReferralDialogProps) => {
    const [referralLink, setReferralLink] = useState<string>('');
    const [showCopiedAlert, setShowCopiedAlert] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('userEmail') || '';
        }
        return '';
    });
    const [emailError, setEmailError] = useState<string | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [showCampaignSelection, setShowCampaignSelection] = useState(false);
    const [referralData, setReferralData] = useState<{ rfr: string, c_key: string } | null>(null);
    const [showNameField, setShowNameField] = useState(false);
    const [name, setName] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('userName') || '';
        }
        return '';
    });
    const [nameError, setNameError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await apiClient.listCampaigns();
                setCampaigns(Array.isArray(response) ? response : []);
            } catch (err) {
                console.error('Failed to fetch campaigns:', err);
                setError('Failed to load campaigns. Please try again.');
            }
        };

        if (open && !c_key) {
            fetchCampaigns();
        }
    }, [open, c_key]);

    useEffect(() => {
        if (referralData) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.14trees.org';
            let link = `${baseUrl}/${linkType}`;
            const params = new URLSearchParams();

            if (referralData.rfr) {
                params.append('r', referralData.rfr);
            }

            if (referralData.c_key) {
                params.append('c', referralData.c_key);
            }

            if (params.toString()) {
                link += '?' + params.toString();
            }

            setReferralLink(link);
        }
    }, [referralData, linkType]);

    const validateEmail = (email: string): boolean => {
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError(null);
        return true;
    };

    const validateName = (name: string): boolean => {
        if (!name.trim()) {
            setNameError('Name is required');
            return false;
        }
        if (name.trim().length < 2) {
            setNameError('Name must be at least 2 characters long');
            return false;
        }
        setNameError(null);
        return true;
    };

    const handleGenerateLink = async () => {
        if (!validateEmail(email)) {
            return;
        }

        if (showNameField && !validateName(name)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            let campaignKey: string | undefined = c_key;
            if (!campaignKey && showCampaignSelection) {
                const selectedCampaignObj = campaigns.find(c => c.name === selectedCampaign);
                campaignKey = selectedCampaignObj?.c_key;
            }

            // If we need to register the user first
            if (showNameField) {
                try {
                    await apiClient.createUser(name.trim(), email);
                    console.log('User registered successfully');
                } catch (userCreationError: any) {
                    console.error('Failed to register user:', userCreationError);
                    // If user already exists, that's fine, continue with referral generation
                    if (!userCreationError.message?.includes('already exists')) {
                        throw userCreationError;
                    }
                }
            }

            const resp = await apiClient.getReferral(email, campaignKey);
            setReferralData(resp);
            setShowNameField(false); // Hide name field on success
        } catch (err: any) {
            console.error('Failed to generate referral link:', err);
            
            // Check if the error is about user not being registered
            if (err.message?.includes('User not registered in the system!') || err.message?.includes('User not registered in the system!')) {
                setShowNameField(true);
                setError('Since you are not registered in our system, please provide your name below to continue.');
            } else {
                setError('Failed to generate referral link. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = event.target.value;
        setEmail(newEmail);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userEmail', newEmail);
        }
        validateEmail(newEmail);
        // Reset referral link and data when email changes
        setReferralLink('');
        setReferralData(null);
        // Reset name field when email changes
        if (showNameField) {
            setShowNameField(false);
            setError(null);
        }
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newName = event.target.value;
        setName(newName);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userName', newName);
        }
        validateName(newName);
    };

    const handleCampaignChange = (event: any) => {
        setSelectedCampaign(event.target.value);
        setReferralLink('');
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setShowCopiedAlert(true);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setError('Failed to copy link to clipboard. Please try again.');
        }
    };

    const shareTitle = '14 Trees Initiative';
    const shareMessage = 'Join me in supporting 14 Trees Initiative!';

    const handleClose = () => {
        // Reset name field state when dialog closes
        setShowNameField(false);
        setNameError(null);
        setError(null);
        onClose();
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        width: { xs: '95%', sm: '500px' },
                        maxWidth: '500px',
                        margin: { xs: '16px', sm: '32px' },
                    }
                }}
            >
                <DialogTitle>Share 14 Trees Initiative</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Share our reforestation initiative with your friends and family using your personal referral link.
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Your Email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            error={!!emailError}
                            helperText={emailError}
                            sx={{ mb: 2 }}
                            InputProps={{
                                sx: {
                                    backgroundColor: '#f5f5f5',
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: emailError ? '#d32f2f' : '#e0e0e0',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: emailError ? '#d32f2f' : '#bdbdbd',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: emailError ? '#d32f2f' : '#4caf50',
                                        },
                                    },
                                },
                            }}
                        />
                        {showNameField && (
                            <TextField
                                fullWidth
                                label="Your Name"
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                error={!!nameError}
                                helperText={nameError}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    sx: {
                                        backgroundColor: '#f5f5f5',
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: nameError ? '#d32f2f' : '#e0e0e0',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: nameError ? '#d32f2f' : '#bdbdbd',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: nameError ? '#d32f2f' : '#4caf50',
                                            },
                                        },
                                    },
                                }}
                            />
                        )}
                        {!c_key && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={showCampaignSelection}
                                        onChange={(e) => { setShowCampaignSelection(e.target.checked); selectedCampaign && setReferralLink(""); }}
                                        sx={{
                                            color: '#4caf50',
                                            '&.Mui-checked': {
                                                color: '#4caf50',
                                            },
                                        }}
                                    />
                                }
                                label="Share for an ongoing campaign"
                                sx={{ mb: showCampaignSelection ? 2 : 0 }}
                            />
                        )}
                        {!c_key && showCampaignSelection && (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Select Campaign</InputLabel>
                                <Select
                                    value={selectedCampaign}
                                    label="Select Campaign"
                                    onChange={handleCampaignChange}
                                    sx={{
                                        backgroundColor: '#f5f5f5',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#e0e0e0',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#bdbdbd',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#4caf50',
                                        },
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {campaigns.map((campaign) => (
                                        <MenuItem key={campaign.c_key} value={campaign.name}>
                                            {campaign.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 2, sm: 1 },
                            alignItems: { sm: 'stretch' }
                        }}>
                            <TextField
                                fullWidth
                                value={referralLink}
                                placeholder="Your referral link will appear here"
                                multiline
                                minRows={1}
                                maxRows={3}
                                size='medium'
                                InputProps={{
                                    readOnly: true,
                                    sx: {
                                        backgroundColor: '#f5f5f5',
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: '#e0e0e0',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#bdbdbd',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#4caf50',
                                            },
                                        },
                                    },
                                    endAdornment: referralLink && (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            alignSelf: 'center',
                                            pr: 1
                                        }}>
                                            <IconButton 
                                                onClick={handleCopyLink} 
                                                sx={{ 
                                                    color: 'green',
                                                    borderRadius: '10px',
                                                    padding: '8px',
                                                    '&:hover': {
                                                        backgroundColor: 'rgb(146 195 146)',
                                                    },
                                                }}
                                            >
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Box>
                                    ),
                                }}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        height: '100%',
                                        alignItems: 'flex-start',
                                        paddingTop: '8px',
                                        paddingBottom: '8px',
                                    },
                                    '& .MuiInputBase-input': {
                                        alignSelf: 'center',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-all',
                                        paddingRight: referralLink ? '48px' : '14px',
                                    }
                                }}
                            />
                            {!referralLink && (
                                <Button
                                    variant="contained"
                                    onClick={handleGenerateLink}
                                    disabled={isLoading || !email || !!emailError || (showCampaignSelection && !selectedCampaign) || (showNameField && (!name || !!nameError))}
                                    sx={{ 
                                        backgroundColor: '#4caf50',
                                        minHeight: { xs: '48px', sm: '100%' },
                                        minWidth: { sm: '160px' },
                                        '&:hover': {
                                            backgroundColor: '#388e3c',
                                        },
                                    }}
                                >
                                    {isLoading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Generate Link'
                                    )}
                                </Button>
                            )}
                        </Box>
                        {error && (
                            <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                {error}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Share via:
                        </Typography>
                        <Stack 
                            direction="row" 
                            spacing={1}
                            sx={{
                                justifyContent: { xs: 'center', sm: 'flex-start' },
                                flexWrap: 'wrap',
                                gap: 1
                            }}
                        >
                            <WhatsappShareButton
                                disabled={referralLink === ""}
                                url={referralLink}
                                title={shareMessage}
                            >
                                <WhatsappIcon size={40} round />
                            </WhatsappShareButton>
                            <LinkedinShareButton
                                disabled={referralLink === ""}
                                url={referralLink}
                                title={shareTitle}
                                summary={shareMessage}
                                source="14%20Trees"
                            >
                                <LinkedinIcon size={40} round />
                            </LinkedinShareButton>
                            <TelegramShareButton
                                disabled={referralLink === ""}
                                url={referralLink}
                                title={shareTitle}
                            >
                                <TelegramIcon size={40} round />
                            </TelegramShareButton>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={showCopiedAlert}
                autoHideDuration={3000}
                onClose={() => setShowCopiedAlert(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setShowCopiedAlert(false)}>
                    Link copied to clipboard!
                </Alert>
            </Snackbar>
        </>
    );
};
