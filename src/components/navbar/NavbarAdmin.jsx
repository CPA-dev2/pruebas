import React from 'react';
import {
  Box,
  Icon,
  useColorModeValue,
  HStack,
  IconButton,
  Spacer,
} from '@chakra-ui/react';
import { IoMenuOutline } from 'react-icons/io5';
import NavbarLinksAdmin from './NavbarLinksAdmin';
import Breadcrumbs from './Breadcrumbs';
import PropTypes from 'prop-types';

export default function NavbarAdmin({ onToggle }) { // Prop renombrada a 'onToggle'
  const navbarBg = useColorModeValue('whiteAlpha.900', 'navy.800');
  const navbarIconColor = useColorModeValue('gray.500', 'white');

  return (
    <Box
      position="fixed"
      top={{ base: '12px', md: '16px' }}
      right={{ base: '12px', md: '30px' }}
      w={{
        base: 'calc(100vw - 24px)',
        md: 'calc(100vw - 60px)',
        xl: 'calc(100vw - 350px)',
      }}
      bg={navbarBg}
      backdropFilter="blur(20px)"
      borderWidth="1.5px"
      borderColor="transparent"
      borderRadius="2xl"
      boxShadow="sm"
      p={{ base: 2, md: 4 }}
      zIndex="overlay"
      transition="all 0.2s ease-in-out"
    >
      <HStack w="100%" spacing="4">
        <IconButton
          aria-label="Activar menú"
          icon={<Icon as={IoMenuOutline} boxSize={6} />}
          onClick={onToggle} // Llama a la función onToggle del layout padre
          display={{ base: 'flex', xl: 'none' }}
          variant="ghost"
          color={navbarIconColor}
        />

        <Box display={{ base: 'none', md: 'block' }}>
          <Breadcrumbs />
        </Box>
        <Spacer />
        <Box>
          <NavbarLinksAdmin />
        </Box>
      </HStack>
    </Box>
  );
}

NavbarAdmin.propTypes = {
  onToggle: PropTypes.func.isRequired, // PropType actualizado
};