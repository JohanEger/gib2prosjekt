import "./App.css";
import { useEffect, useState } from "react";
import { Map } from "./components/Map";


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

  return (
    
      <Map/>
  
  );
}

export default App;
