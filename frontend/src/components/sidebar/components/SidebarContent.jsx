// frontend/src/components/sidebar/components/SidebarContent.jsx

import React from 'react';
import { Box, Flex, VStack, CloseButton } from '@chakra-ui/react';
import SidebarBrand from './SidebarBrand';
import SidebarLinks from './Links'; // Este es nuestro contenedor de enlaces

/**
 * El contenido interno de la Sidebar.
 * @param {object} props - Propiedades, incluyendo 'onClose' para el modo móvil.
 */
const SidebarContent = ({ onClose, ...rest }) => {
  return (
    <Flex
      direction="column"
      h="full"
      borderRightWidth="1px"
      borderRightColor="inherit"
      {...rest}
    >
      {/* --- Cabecera con Logo y Botón de Cerrar (móvil) --- */}
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <SidebarBrand />
        <CloseButton display={{ base: 'flex', xl: 'none' }} onClick={onClose} />
      </Flex>

      {/* --- Contenedor de Enlaces con Scroll --- */}
      <Box
        flex="1"
        overflowY="auto"
        // Estilos para un scrollbar moderno y delgado
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.600',
            borderRadius: '24px',
          },
        }}
      >
        <VStack as="nav" spacing="2" align="stretch" px="4">
          <SidebarLinks onClose={onClose} />
        </VStack>
      </Box>
      
      {/* Espacio inferior opcional para un futuro 'logout' o perfil de usuario */}
      <Box p="4"></Box>
    </Flex>
  );
};

export default SidebarContent;