import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente para proteger rutas privadas.
 * Verifica si el usuario está autenticado y si tiene los permisos necesarios.
 */
const PrivateRouteConfig = ({ accessValidate }) => {
  const { user, authTokens } = useAuth();

  // 1. Verificar si el usuario está autenticado
  if (!authTokens || !user) {
    // Si no hay token o datos de usuario, redirigir a login
    return <Navigate to="/login" />;
  }

  // 2. Verificar si el usuario es superusuario (acceso total)
  if (user.is_superuser) {
    return <Outlet />;
  }

  // 3. Verificar si la ruta requiere roles específicos
  if (accessValidate && accessValidate.length > 0) {
    const userRole = user.rol?.nombre; // Obtener el nombre del rol
    if (!userRole || !accessValidate.includes(userRole)) {
      // Si el usuario no tiene el rol requerido, redirigir a una página de "no autorizado" o al dashboard
      // Por simplicidad, redirigimos al dashboard
      return <Navigate to="/" />;
    }
  }

  // 4. Si pasa todas las validaciones, renderizar el componente de la ruta
  return <Outlet />;
};

export default PrivateRouteConfig;
