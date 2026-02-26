import { Map } from "./components/Map";
import { NavBar } from "./components/NavBar";
import { Sidebar } from "./components/Sidebar";
import { useEffect, useState } from "react";

type HealthResponse = Record<string, string>;

function App() {
  const [response, setResponse] = useState<HealthResponse>();

  const getBackendApiStatus = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/health`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: HealthResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    getBackendApiStatus();
  }, []);

  useEffect(() => {
    console.log("Response changed:", response);
  }, [response]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <NavBar />
      <Sidebar />
      <Map />
    </div>
  );
}

export default App;
