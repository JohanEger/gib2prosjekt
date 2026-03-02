import { useState } from "react";
import arrow from "../assets/arrow.svg";
import { Container, Box, Button, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [showFilter, setShowfilter] = useState(false);

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Container maxWidth="sm" className="relative top-20 right-0">
          <Box className="flex justify-end">
            <Button
              onClick={() => {
                setShowfilter(!showFilter);
              }}
            >
              <TuneIcon color="primary"></TuneIcon>
            </Button>
          </Box>
        </Container>
      </div>

      <button
        onClick={() => {
          setOpen(!open);
          setShowfilter(false);
        }}
        className={`fixed top-1/2  z-50 p-2
        transition-all duration-300 cursor-pointer
        ${open ? "left-64" : "left-0"}`}
      >
        <img
          src={arrow}
          alt="Toggle"
          className={`w-7 h-7 transition-transform duration-300
          ${open ? "rotate-90" : "rotate-270"}`}
        />
      </button>
      {showFilter && (
        <Container className="fixed z-30 top-20 left-64">
          <Box
            className="flex bg-white shadow-lg max-w-1/2"
            sx={{ borderRadius: "0.5rem" }}
          >
            <Typography className="">Hei</Typography>
          </Box>
        </Container>
      )}
    </>
  );
};
