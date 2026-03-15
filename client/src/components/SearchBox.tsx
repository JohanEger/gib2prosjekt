import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchBox({ }) {
    return (
        <TextField
            fullWidth
            placeholder="Søk etter utstyr her..."
            variant="outlined"
            id="searchField"
            sx={{
                width: "22em",
                "& .MuiOutlinedInput-root": {
                    borderRadius: "1em",
                    backgroundColor: "#f7f7f8",
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