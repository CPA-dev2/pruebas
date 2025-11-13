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
        // Si el usuario está autenticado, renderiza las rutas privadas
        <Route path="/*" element={<PrivateRoutes />} />
      ) : (
        // Si no, renderiza las rutas públicas y redirige cualquier otra ruta a /login
        <>
          <Route path="/login" element={<PublicRoutes />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
};

export default RoutesMain;
