"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Avatar,
  Typography,
  Backdrop,
  ThemeProvider,
  createTheme
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { GoogleLogin } from "react-google-login";
import { ToastContainer, toast } from "react-toastify";
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

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function CorporateLogin() {
  const router = useRouter();
  const [openBackdrop, setBackdropOpen] = useState(false);
  const classes = useStyles();

  const handleGoogleSuccess = async (response: any) => {
    try {
      setBackdropOpen(true);

      const googleRes = await axios.post(
        "/api/auth/google",
        JSON.stringify({ token: response.tokenId }),
        { headers: { "Content-Type": "application/json" } }
      );

      const user = googleRes.data.user;
      const token = googleRes.data.token;

      if (!user || !user.roles) {
        toast.error("User not authorized! Contact Admin");
        setBackdropOpen(false);
        return;
      }

      // Get user-specific dashboard URL from backend
      const dashboardRes = await axios.post(
        "/api/auth/corporate",
        JSON.stringify({ token: response.tokenId }),
        { headers: { "Content-Type": "application/json" } }
      );

      if (!dashboardRes.data.success || !dashboardRes.data.path) {
        toast.error(dashboardRes.data.message || "Failed to get dashboard URL");
        setBackdropOpen(false);
        return;
      }

      const { path, view_id } = dashboardRes.data;
      const dashboardUrl = `${window.location.protocol}//${window.location.host}${path}?v=${view_id}`;

      // Open dashboard in new tab and send auth data
      const dashboardWindow = window.open(dashboardUrl, '_blank');

      setTimeout(() => {
        if (dashboardWindow) {
          dashboardWindow.postMessage(
            {
              type: 'auth_token',
              token: token,
              sourceOrigin: window.location.origin
            },
            new URL(dashboardUrl).origin
          );
        } else {
          toast.error("Could not open dashboard. Please disable popup blockers.");
        }
        setBackdropOpen(false);
      }, 1000);

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed. Contact Admin.");
      setBackdropOpen(false);
    }
  };

  const handleGoogleFailure = (error: any) => {
    console.error("Google login failed:", error);
    toast.error("Google login failed. Please try again.");
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        <div>
          <Backdrop className={classes.backdrop} open={openBackdrop}>
            {/* <Spinner text={"Logging you in..."} /> */}
          </Backdrop>
          <ToastContainer />

          <Grid container justifyContent="center" alignItems="center" style={{ minHeight: "100vh" }}>
            <Grid item>
              <Paper
                elevation={10}
                sx={{
                  width: 380,
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
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

                <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <GoogleLogin
                    clientId={GOOGLE_CLIENT_ID}
                    buttonText="Sign in with Google"
                    onSuccess={handleGoogleSuccess}
                    onFailure={handleGoogleFailure}
                    cookiePolicy={'single_host_origin'}
                    isSignedIn={true}
                    render={(renderProps) => (
                      <button
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                        style={{
                          backgroundColor: "#4285F4",
                          color: "white",
                          border: "none",
                          padding: "10px 15px",
                          borderRadius: "4px",
                          fontSize: "16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        Sign in with Google
                      </button>
                    )}
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