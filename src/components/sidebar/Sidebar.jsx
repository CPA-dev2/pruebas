import React from 'react';
import {
  Box,
  useColorModeValue,
  Slide,
} from '@chakra-ui/react';
import SidebarContent from './components/SidebarContent';
import PropTypes from 'prop-types';

const Sidebar = ({ isOpen, onClose }) => {
  const sidebarBg = useColorModeValue('white', 'navy.800');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.08)',
    'unset'
  );

  return (
    <Box>
      <Box
        as="nav"
        display={{ base: 'none', xl: 'block' }}
        position="fixed"
        h="full"
        w="280px"
        bg={sidebarBg}
        boxShadow={shadow}
        zIndex="sticky"
      >
        <SidebarContent />
      </Box>
      {isOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          zIndex={1400}
          onClick={onClose}
          display={{ base: 'block', xl: 'none' }}
        />
      )}
      <Slide
        direction="left"
        in={isOpen}
        style={{ zIndex: 1500 }}
      >
        <Box
          bg={sidebarBg}
          w="50vw"
          maxW="320px"
          h="100vh"
          boxShadow="xl"
          display={{ base: 'block', xl: 'none' }}
        >
          <SidebarContent onClose={onClose} />
        </Box>
      </Slide>
    </Box>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;