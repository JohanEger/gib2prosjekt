import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchBox({ }) {
    return (
        <TextField
            fullWidth
            placeholder="Søk etter utstyr eller brukere her..."
            variant="outlined"
            id="searchField"
            sx={{
                width: "22em",
                "& .MuiOutlinedInput-root": {
                    borderRadius: "1em",
                    backgroundColor: "#e8e8efff",
                    "& fieldset": {
                        borderColor: "transparent",
                    },
                    "&:hover fieldset": {
                        borderColor: "rgb(42, 80, 148)",
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: "rgb(42, 80, 148)",
                    },
                },
            }}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton>
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    )
}