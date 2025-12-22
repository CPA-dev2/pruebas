import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";
import { useAuth } from "../context/AuthContext";

const RoutesMain = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {user ? (
        // RUTAS PRIVADAS (Usuario autenticado)
        <>
          <Route path="/*" element={<PrivateRoutes />} />
        </>
      ) : (
        // RUTAS PÚBLICAS (Usuario anónimo)
        // Cambiamos "/login" por "/*" para que PublicRoutes capture todas las URLs
        <Route path="/*" element={<PublicRoutes />} />
      )}
    </Routes>
  );
};

export default RoutesMain;