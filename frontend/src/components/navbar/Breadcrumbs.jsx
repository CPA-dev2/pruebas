// frontend/src/components/navbar/Breadcrumbs.jsx

import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';

/**
 * Genera 'migas de pan' de navegación basadas en la ruta actual de la URL.
 */
const Breadcrumbs = () => {
  const location = useLocation();
  // Filtramos para quitar strings vacíos que resultan del split
  const pathnames = location.pathname.split('/').filter(Boolean);

  // --- Estilos ---
  const linkColor = useColorModeValue('gray.500', 'gray.400');
  const currentPageColor = useColorModeValue('gray.800', 'white');

  return (
    <Breadcrumb spacing="8px" separator={<ChevronRightIcon color={linkColor} />}>
      <BreadcrumbItem>
        <BreadcrumbLink
          as={RouterLink}
          to="/"
          color={linkColor}
          fontWeight="medium"
          fontSize="sm"
          _hover={{ textDecoration: 'underline' }}
        >
          Inicio
        </BreadcrumbLink>
      </BreadcrumbItem>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

        return (
          <BreadcrumbItem isCurrentPage={isLast} key={name}>
            {isLast ? (
              // La página actual se muestra como texto plano, no como un enlace.
              <Text color={currentPageColor} fontWeight="bold" fontSize="sm">
                {displayName}
              </Text>
            ) : (
              <BreadcrumbLink
                as={RouterLink}
                to={routeTo}
                color={linkColor}
                fontWeight="medium"
                fontSize="sm"
                _hover={{ textDecoration: 'underline' }}
              >
                {displayName}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

export default Breadcrumbs;