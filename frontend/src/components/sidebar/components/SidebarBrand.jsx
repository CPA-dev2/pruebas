// frontend/src/components/sidebar/components/SidebarBrand.jsx

import React from 'react';
import { Flex, Image, Heading, useColorModeValue } from '@chakra-ui/react';
import logo from '../../../assets/img/logos/logo_demo.avif'; // Importa la imagen directamente

/**
 * Componente para mostrar el logo y el nombre de la marca en la Sidebar.
 */
const SidebarBrand = () => {
  const textColor = useColorModeValue('navy.700', 'white');

  return (
    <Flex align="center" direction="row">
      <Image
        src={logo} // Usa la imagen importada
        alt="Logo de la App"
        boxSize="40px" // Un tamaño más refinado
        mr="4"
      />
      <Heading as="h1" size="md" color={textColor} letterSpacing="tight">
        Credicel
      </Heading>
    </Flex>
  );
};

export default SidebarBrand;