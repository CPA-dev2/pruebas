import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loginService, logoutService } from "../services/AuthService";
import { refreshAndGetUser } from "../services/AuthService"; // Importamos el nuevo servicio
import { showSuccess, handleError } from "../services/NotificationService";
import { Box, Spinner, Center } from "@chakra-ui/react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Nuevo estado de carga para la validación inicial de la sesión.
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    // Lógica de logout...
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authTokens");
    navigate("/login");
  }, [navigate]);
  

  useEffect(() => {
    const validateSession = async () => {
      const initialTokens = localStorage.getItem("authTokens");
      if (initialTokens) {
        try {
          // Intentamos validar la sesión usando el refreshToken.
          const { user: refreshedUser, tokens: refreshedTokens } = await refreshAndGetUser();
          // Si tiene éxito, actualizamos el estado de la aplicación.
          setUser(refreshedUser);
          setToken(refreshedTokens);
        } catch (error) {
          // Si falla (ej. el refreshToken expiró), cerramos la sesión.
          console.error("La validación de la sesión falló, cerrando sesión.", error);
          logout();
        }
      }
      // Terminamos la carga para que la aplicación se muestre.
      setIsLoading(false);
    };

    validateSession();
  }, [logout]); 


  const login = useCallback(
    async (data) => {
      try {
        const response = await loginService(data);
        const { user: userData, token, refreshToken } = response;

        const tokens = { access: token, refresh: refreshToken };

        setUser(userData);
        setToken(tokens);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("authTokens", JSON.stringify(tokens));

        // showSuccess(`Bienvenido, ${userData.username}`);
        navigate("/"); // Redirige al dashboard
      } catch (error) {

        console.error("Error en el login:", error);
        throw error; // Lanza el error para que LoginPage lo pueda capturar
      }
    },
    [navigate]
  );
  const contextData = { user, setUser, token, setToken, login, logout, isLoading };

  // Mientras se valida la sesión, mostramos un indicador de carga.
  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};