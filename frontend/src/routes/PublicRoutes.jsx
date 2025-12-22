// importación de librerías y/o funciones
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// importación de pages
import LoginPage from "../pages/public/LoginScreen/LoginPage";
import DistributorRegistration from "../pages/public/DistributorRegistration/index";

const PublicRoutes = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
<Routes>
      {/* Ruta de Login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Ruta de Afiliación */}
      <Route path="/afiliate" element={<DistributorRegistration />} />

      {/* Redirección por defecto: Si entra a la raíz "/" o cualquier ruta desconocida, va a login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default PublicRoutes;
