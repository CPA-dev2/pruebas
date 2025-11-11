import React from 'react';
import {
  Grid,
  InputGroup,
  InputLeftElement,
  Input,
  Button,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

/**
 * `FiltrosClientes` es un componente especializado para filtrar clientes.
 * Proporciona un único campo de búsqueda que permite buscar por:
 * - Nombres
 * - Apellidos  
 * - DPI
 * - NIT
 *
 * Es un componente controlado donde el estado reside en el componente padre.
 *
 * @param {object} props - Propiedades del componente.
 * @param {object} props.filters - Objeto que contiene el estado actual de los filtros (ej. `{ search: 'texto' }`).
 * @param {function} props.onFilterChange - Función handler que se invoca cuando cambia el valor del input de búsqueda.
 * @param {function} props.onApplyFilters - Función handler que se ejecuta al hacer clic en el botón "Buscar".
 * @param {function} props.onClearFilters - Función handler que se ejecuta al hacer clic en el botón "Limpiar".
 * @param {boolean} props.isLoading - Booleano para mostrar un estado de carga en los botones.
 */
const FiltrosClientes = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  isLoading = false,
}) => {
  return (
    <Grid
      templateColumns={{ base: '4fr', md: '2fr 1fr 1fr auto' }}
      gap={4}
      alignItems="center"
      p={4}
    >

        {/* Campo de búsqueda único */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            name="search"
            placeholder="Buscar por nombre, apellido, DPI o NIT..."
            value={filters.search || ''}
            onChange={onFilterChange}
          />
        </InputGroup>

        {/* Botón de búsqueda */}
        <Button 
          colorScheme="blue" 
          onClick={onApplyFilters} 
          isLoading={isLoading}
          loadingText="Buscando..."
        >
          Filtrar
        </Button>
        
        {/* Botón de limpiar */}
        <Button 
          variant="outline" 
          onClick={onClearFilters} 
          isLoading={isLoading}
        >
          Limpiar
        </Button>

    </Grid>
  );
};

export default FiltrosClientes;