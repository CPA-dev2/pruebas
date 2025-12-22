// frontend/src/components/sidebar/components/Links.jsx

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Flex, Icon, Text, Link, useColorModeValue } from '@chakra-ui/react';
import PropTypes from 'prop-types';

import { routes } from '../../../routes/routes';
import { useAuth } from '../../../context/AuthContext';

/**
 * Componente para un único elemento de navegación.
 * Ahora acepta 'onClose' para cerrar el menú al hacer clic.
 */
const NavItem = ({ route, onClose }) => { // <--- 1. Recibe 'onClose'
  const location = useLocation();
  const isActive = location.pathname.startsWith(route.path);

  const activeBg = useColorModeValue('blue.50', 'brand.800');
  const activeColor = useColorModeValue('brand.700', 'white');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const hoverColor = useColorModeValue('gray.800', 'gray.200');

  return (
    <Link
      as={NavLink}
      to={route.path}
      onClick={onClose} // <--- 2. ¡AQUÍ ESTÁ LA MAGIA! Se llama a onClose al hacer clic.
      _hover={{
        textDecoration: 'none',
        bg: hoverBg,
        color: hoverColor,
      }}
      _focus={{ boxShadow: 'none' }}
      display="block"
      borderRadius="lg"
      transition="background 0.2s ease-in-out"
    >
      <Flex
        align="center"
        p="3"
        mx="2"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : inactiveColor}
        fontWeight={isActive ? 'semibold' : 'medium'}
        role="group"
      >
        {route.icon && (
          <Icon
            as={route.icon}
            boxSize="5"
            mr="4"
            transition="color 0.2s"
            _groupHover={{ color: hoverColor }}
          />
        )}
        <Text>{route.name}</Text>
      </Flex>
    </Link>
  );
};

NavItem.propTypes = {
  route: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};


/**
 * Renderiza la lista de enlaces, pasando la función 'onClose'.
 */
const SidebarLinks = ({ onClose }) => { // <--- 3. Recibe 'onClose'
  const { user } = useAuth();

  const hasAccess = (route) => {
    if (user?.isSuperuser) return true;
    if (!route.accessValidate || route.accessValidate.length === 0) return true;
    return user?.rol?.nombre && route.accessValidate.includes(user.rol.nombre);
  };

  const routesSidebar = routes.filter(
    (route) => route.showSidebar && hasAccess(route)
  );

  return (
    <Box>
      {routesSidebar.map((route) => (
        // 4. Pasa 'onClose' a cada NavItem que renderiza
        <NavItem key={route.path} route={route} onClose={onClose} />
      ))}
    </Box>
  );
};

SidebarLinks.propTypes = {
  onClose: PropTypes.func,
};

export default SidebarLinks;