import { useEffect, useState } from "react";
import React from "react";
import arrow from "../assets/arrow.svg";
import { Equipment } from "./Equipment";
import {
  Box,
  Button,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  ListItemText,
  Select,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import TuneIcon from "@mui/icons-material/Tune";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const committeeNames = ["turingen", "arrkom", "bedkom", "ståpels"];
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const Sidebar = () => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [open, setOpen] = useState(true);
  const [showFilter, setShowfilter] = useState(false);
  const [committee, setCommittee] = React.useState<string[]>([]);

  useEffect(() => {
    async function loadEquipment() {
      try {
        const params = new URLSearchParams();
        committee.forEach((c) => params.append("committee", c));

        const res = await fetch(
          `http://localhost:5000/equipment/sidebar?${params.toString()}`,
        );

        const data = await res.json();
        setEquipment(data);
        console.log(data);
      } catch (err) {
        console.error("Error loading equipment:", err);
      }
    }

    loadEquipment();
  }, [committee]);

  const handleChange = (event: SelectChangeEvent<typeof committeeNames>) => {
    const {
      target: { value },
    } = event;
    setCommittee(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Box className="flex justify-end relative top-20 right-0">
          <Button
            onClick={() => {
              setShowfilter(!showFilter);
            }}
          >
            <TuneIcon color="primary"></TuneIcon>
          </Button>
        </Box>
        <ul className="relative flex flex-col gap-4 p-4 mt-24 max-h-1/2 overflow-y-auto scrollable-ul">
          {equipment.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => {
          setOpen(!open);
          setShowfilter(false);
        }}
        className={`fixed top-1/2  z-50 p-1
        transition-all duration-300 cursor-pointer
        ${open ? "left-62" : "left-0"}`}
      >
        <img
          src={arrow}
          alt="Toggle"
          className={`w-7 h-7 transition-transform duration-300
          ${open ? "rotate-90" : "rotate-270"}`}
        />
      </button>
      {showFilter && (
        <Box
          className=" fixed z-30 top-20 left-70 flex bg-white shadow-lg w-[16rem] p-4 flex flex-col gap-4"
          sx={{ borderRadius: "0.5rem" }}
        >
          <Typography variant="h6">Filtre</Typography>

          <Box className="flex flex-col">
            <FormControl sx={{ m: 1, width: 200 }}>
              <InputLabel id="demo-multiple-checkbox-label">Komité</InputLabel>
              <Select
                labelId="demo-multiple-checkbox-label"
                id="demo-multiple-checkbox"
                multiple
                value={committee}
                input={<OutlinedInput label="Komité" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
                onChange={handleChange}
              >
                {committeeNames.map((name) => {
                  const selected = committee.includes(name);
                  const SelectionIcon = selected
                    ? CheckBoxIcon
                    : CheckBoxOutlineBlankIcon;

                  return (
                    <MenuItem key={name} value={name}>
                      <SelectionIcon
                        fontSize="small"
                        style={{
                          marginRight: 8,
                          padding: 9,
                          boxSizing: "content-box",
                        }}
                      />
                      <ListItemText primary={name} />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          <Box className="flex flex-col">
            <Typography>Avstand</Typography>
            <Slider defaultValue={0} aria-label="Default"></Slider>
          </Box>
        </Box>
      )}
    </>
  );
};
