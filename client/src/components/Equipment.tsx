import { Box, Typography } from "@mui/material";

interface EquipmentProps {
  name: string;
}

export const Equipment = ({ name }: EquipmentProps) => {
  return (
    <Box className="bg-white shadow-lg rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer">
      <Typography className="text-black p-2">{name}</Typography>
    </Box>
  );
};
