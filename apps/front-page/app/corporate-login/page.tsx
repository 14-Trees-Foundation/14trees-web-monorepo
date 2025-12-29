"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Avatar,
  Typography,
  Backdrop,
  ThemeProvider,
  createTheme,
  CircularProgress
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { GoogleLogin } from "@react-oauth/google";
import { makeStyles } from "@mui/styles";
import axios from "axios";

const theme = createTheme({
  zIndex: {
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
});

const useStyles = makeStyles({
  container: {
    width: "100%",
    position: "relative",
    backgroundColor: "#1f3625",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(358.58deg, #1F3625 37.04%, rgba(31, 54, 37, 0.636721) 104.2%, rgba(31, 54, 37, 0) 140.95%)",
  },
  backdrop: {
    zIndex: 1201,
  },
});

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function CorporateLogin() {
  const [openBackdrop, setBackdropOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const classes = useStyles();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google login is not working at the moment. Please try again later!");
    }
  }, [])

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setBackdropOpen(true);
      setError(null);

      const googleRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
        JSON.stringify({ token: credentialResponse.credential }),
        { headers: { "Content-Type": "application/json" } }
      );

      const user = googleRes.data.user;

      if (!user) {
        setError("User not authorized! Contact Admin");
        setBackdropOpen(false);
        return;
      }

      // Get user-specific dashboard URL from backend
      const dashboardRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/corporate`,
        JSON.stringify({ token: credentialResponse.credential }),
        { headers: { "Content-Type": "application/json" } }
      );

      if (!dashboardRes.data.success || !dashboardRes.data.path) {
        setError(dashboardRes.data.message || "Failed to get dashboard URL");
        setBackdropOpen(false);
        return;
      }

      const { path, view_id, token_id } = dashboardRes.data;
      // Encode the credential and redirect path for URL safety
      const encodedRedirect = encodeURIComponent(`${path}?v=${view_id}`);
      const dashboardUrl = `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/login?credential=${token_id}&redirect=${encodedRedirect}`;

      try {
        // Open the dashboard directly with the credential
        const dashboardAppWindow = window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
        
        if (!dashboardAppWindow) {
          setError("If dashboard window didn't open then please disable popup blockers and try again.");
          setBackdropOpen(false);
          return;
        }

        // Check if the window was actually opened
        if (dashboardAppWindow.closed) {
          console.error('Window was opened but immediately closed');
          setError("Dashboard window was closed. Please try again.");
          setBackdropOpen(false);
          return;
        }

        setBackdropOpen(false);
      } catch (error) {
        setError("Failed to open dashboard. Please try again.");
        setBackdropOpen(false);
      }

    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
      setBackdropOpen(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
    setBackdropOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        <div>
          <Backdrop className={classes.backdrop} open={openBackdrop}>
            <CircularProgress color="primary" />
          </Backdrop>

          <Grid container justifyContent="center" alignItems="center" style={{ minHeight: "100vh" }}>
            <Grid>
              <Paper
                elevation={10}
                sx={{
                  width: 380,
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: '#d4dfd9',
                  gap: 2.5,
                }}
              >
                <Avatar sx={{ backgroundColor: "#1bbd7e" }}>
                  <LockOutlinedIcon />
                </Avatar>

                <Typography variant="h5">Corporate Login</Typography>

                <Typography variant="body1" sx={{ textAlign: "center", mb: 2 }}>
                  Please sign in with your corporate Google account
                </Typography>

                {error && (
                  <Typography variant="body2" sx={{ color: 'red', mb: 2, textAlign: 'center' }}>
                    {error}
                  </Typography>
                )}

                <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </div>
    </ThemeProvider>
  );
}