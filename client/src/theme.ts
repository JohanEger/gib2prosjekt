import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "rgb(42, 80, 148)",
            contrastText: "#ffffff",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "1em",  // Setter runde hjørner på alle knapper
                },
                containedPrimary: {
                    backgroundColor: "rgb(42, 80, 148)",
                    color: "#ffffff",
                    "&:hover": {
                        backgroundColor: "rgb(95, 136, 99)",
                    },
                    "&:active": {
                        backgroundColor: "rgb(95, 136, 99)",
                    },
                    "&.Mui-focusVisible": {
                        outline: "none",
                    },
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: "1em",  // Runde hjørner på alle Paper-komponenter
                },
            },
        },
    },
});
export default theme;
