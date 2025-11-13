// importación de librerías y/o funciones
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// importación de pages
import LoginPage from "../pages/public/LoginScreen/LoginPage";

const PublicRoutes = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
};

export default PublicRoutes;
