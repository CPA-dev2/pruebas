// importación de librerías y/o funciones
import React from "react";
import { Route, Routes, Navigate} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// importación de pages
import LoginPage from "../pages/public/LoginScreen/LoginPage";
import DistributorRegistration from "../pages/public/DistributorRegistration/DistributorRegistration";

const PublicRoutes = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" />;
  }
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/afiliate" element={<DistributorRegistration />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default PublicRoutes;
