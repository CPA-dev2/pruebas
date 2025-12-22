// frontend/src/components/navbar/NavbarLinksAdmin.jsx

import React from 'react';
import {
  Avatar,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  useColorModeValue,
  HStack,
  IconButton,
  MenuDivider,
  Button,
} from '@chakra-ui/react';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import { FiLogOut } from 'react-icons/fi'; // Icono para logout
import { useAuth } from '../../context/AuthContext';

/**
 * Muestra los controles de la derecha de la navbar:
 * Toggle de tema y menú de perfil de usuario.
 */
const NavbarLinksAdmin = () => {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  // --- Estilos y Colores ---
  const menuBg = useColorModeValue('white', 'navy.800');
  const shadow = useColorModeValue(
    '0px 4px 12px rgba(0, 0, 0, 0.1)',
    '0px 4px 12px rgba(0, 0, 0, 0.4)'
  );
  const iconColor = useColorModeValue('gray.600', 'whiteAlpha.800');
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.700', 'white');
  const avatarBg = useColorModeValue('brand.500', 'brand.400'); // Color de tema

  return (
    <HStack spacing="4" alignItems="center">
      {/* --- Toggle de Dark/Light Mode --- */}
      <IconButton
        aria-label="Cambiar tema"
        icon={colorMode === 'light' ? <IoMdMoon /> : <IoMdSunny />}
        variant="ghost"
        borderRadius="full"
        color={iconColor}
        onClick={toggleColorMode}
      />

      {/* --- Menú de Usuario --- */}
      <Menu>
        <MenuButton
          as={Button}
          rounded="full"
          variant="link"
          cursor="pointer"
          minW={0}
        >
          <Avatar
            size="sm"
            bg={avatarBg} // Usando color del tema
            color="white"
            name={user?.username || 'Usuario'}
          />
        </MenuButton>
        <MenuList
          bg={menuBg}
          boxShadow={shadow}
          borderRadius="xl" // Bordes más modernos
          p="2"
          border="none"
        >
          {/* --- Cabecera del Menú con Información del Usuario --- */}
          <Flex direction="column" px="3" py="2" mb="2">
            <Text fontWeight="bold" color={textColor} casing="capitalize">
              {user?.username || 'Usuario'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {user?.rol?.nombre || 'Rol no definido'}
            </Text>
          </Flex>

          <MenuDivider />

          {/* --- Elementos del Menú (ej. Perfil, Ajustes) --- */}
          {/* <MenuItem _hover={{ bg: hoverBg }} borderRadius="lg">
            Mi Perfil
          </MenuItem>
          <MenuItem _hover={{ bg: hoverBg }} borderRadius="lg">
            Ajustes
          </MenuItem> */}

          {/* --- Acción de Cerrar Sesión --- */}
          <MenuItem
            icon={<Icon as={FiLogOut} />}
            onClick={logout}
            color="red.500"
            _hover={{ bg: 'red.50', color: 'red.600' }}
            _dark={{ _hover: { bg: 'red.800', color: 'red.300' } }}
            borderRadius="lg"
            fontWeight="medium"
          >
            Cerrar sesión
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
};

export default NavbarLinksAdmin;