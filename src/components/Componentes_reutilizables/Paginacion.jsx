import React from 'react';
import { Flex, Button, Text } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

/**
 * `Paginacion` es un componente de UI para la navegación entre páginas de resultados.
 *
 * Muestra botones "Anterior" y "Siguiente" y un texto informativo sobre el
 * rango de items que se están mostrando actualmente del total.
 *
 * @param {object} props - Propiedades del componente.
 * @param {number} props.currentPage - El número de la página actual, comenzando en 1.
 * @param {function} props.onAnterior - Callback que se ejecuta al hacer clic en el botón "Anterior".
 * @param {function} props.onSiguiente - Callback que se ejecuta al hacer clic en el botón "Siguiente".
 * @param {boolean} props.isLoading - Si es `true`, los botones de navegación se deshabilitan.
 * @param {number} props.itemCount - El número de items que se muestran en la página actual.
 * @param {number} props.totalCount - El número total de items disponibles en todas las páginas.
 * @param {number} props.itemsPerPage - El número máximo de items por página, usado para los cálculos.
 */
const Paginacion = ({ currentPage, onAnterior, onSiguiente, isLoading, itemCount, totalCount, itemsPerPage }) => {
  // Calcula el rango de items que se están mostrando en la página actual.
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = startItem + itemCount - 1;

  /**
   * Genera el texto descriptivo para la paginación.
   * @returns {string} El texto a mostrar.
   */
  const getPaginationText = () => {
    if (totalCount === 0) return 'No hay resultados';
    return `Mostrando ${startItem} - ${endItem} de ${totalCount}`;
  };

  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      justify="space-between"
      align="center"
      p={4}
      gap={4}
    >
      <Button
        leftIcon={<ChevronLeftIcon />}
        onClick={onAnterior}
        // El botón "Anterior" se deshabilita en la primera página o si está cargando.
        isDisabled={currentPage === 1 || isLoading}
        w={{ base: 'full', sm: 'auto' }}
      >
        Anterior
      </Button>

      <Text color="gray.500" fontSize="sm" align="center" display={{ base: 'none', md: 'block' }}>
        {getPaginationText()}
      </Text>

      <Button
        rightIcon={<ChevronRightIcon />}
        onClick={onSiguiente}
        // El botón "Siguiente" se deshabilita si no hay items, si la página no está llena
        // (lo que implica que es la última página), o si se está cargando.
        isDisabled={!itemCount || itemCount < itemsPerPage || isLoading}
        w={{ base: 'full', sm: 'auto' }}
      >
        Siguiente
      </Button>
    </Flex>
  );
};

export default Paginacion;