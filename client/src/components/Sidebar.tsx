import { useState } from "react";
import arrow from "../assets/arrow.svg";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      />
      <button
        onClick={() => setOpen(!open)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 p-2
        transition-all duration-300
        ${open ? "left-64" : "left-0"}`}
      >
        <img
          src={arrow}
          alt="Toggle"
          className={`w-7 h-7 transition-transform duration-300
          ${open ? "rotate-90" : "rotate-270"}`}
        />
      </button>
    </>
  );
};
