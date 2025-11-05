// frontend/src/App.jsx

import { Toaster } from "react-hot-toast";
import "./assets/css/App.css";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "../theme/theme";
import RoutesMain from "./routes/RoutesMain";
import { useAuth } from "./context/AuthContext";

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Verificando sesión...</div>;
  }

  return (
    <>
      <ChakraProvider theme={theme}>
        <RoutesMain />
        <Toaster />
      </ChakraProvider>
    </>
  );
}

export default App;