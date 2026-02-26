import { useState } from "react";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-20 left-4 z-50 p-2 bg-blue-600 text-white rounded-2xl cursor-pointer"
      >
        {open ? <h1>Close</h1> : <h1>Show</h1>}
      </button>

      <div
        className={`fixed left-0 h-screen w-64 bg-gray-800 text-white  
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      ></div>
    </>
  );
};
