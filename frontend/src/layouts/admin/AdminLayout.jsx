// frontend/src/layouts/admin/AdminLayout.jsx

import React from 'react';
import { Box, useDisclosure } from '@chakra-ui/react';
import NavbarAdmin from '../../components/navbar/NavbarAdmin';
import Sidebar from '../../components/sidebar/Sidebar';

export default function AdminLayout(props) {
  const { isOpen, onToggle, onClose } = useDisclosure();

  return (
    <Box bg="gray.50" _dark={{ bg: 'navy.900' }} minH="100vh">
      <Sidebar isOpen={isOpen} onClose={onClose} />

      <NavbarAdmin onToggle={onToggle} />

      <Box
        as="main"
        ml={{ base: 0, xl: '280px' }}
        minHeight="100vh"
        transition="margin-left .3s ease-in-out"
      >
        <Box
          mx="auto"
          p={{ base: '4', md: '8' }}
          pt={{ base: '100px', md: '120px' }}
        >
          {props.children}
        </Box>
      </Box>
    </Box>
  );
}