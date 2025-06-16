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
//import { Spinner } from "../../components/Spinner";

// Create theme with proper zIndex values
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
    zIndex: 1201, // drawer zIndex + 1
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

      localStorage.setItem("token", token);
      localStorage.setItem("loginInfo", JSON.stringify(response.profileObj));
      localStorage.setItem("roles", JSON.stringify(user.roles));

      const permissions = user.roles.includes("admin") ? ["all"] : [];
      localStorage.setItem("permissions", JSON.stringify(permissions));

      const accessRes = await axios.post(
        "/api/auth/verify-access",
        {
          user_id: user.id,
          path: window.location.pathname,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (accessRes.data.code !== 200) {
        toast.error(accessRes.data.message || "Access denied");
        setBackdropOpen(false);
        return;
      }

      router.push("/admin");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed. Contact Admin.");
    } finally {
      setBackdropOpen(false);
    }
  };

  const handleGoogleFailure = (error: any) => {
    console.error("Google login failed:", error);
    toast.error("Google login failed. Please try again.");
  };

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.container}>
        <div className={classes.overlay}>
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