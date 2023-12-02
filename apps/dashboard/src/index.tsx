import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";

export default function NextIndexWrapper() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <RecoilRoot>
            <App />
          </RecoilRoot>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}