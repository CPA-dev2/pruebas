import React from 'react';
import {
  Grid,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Button,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

/**
 * `Filtros` es un componente de UI reutilizable que proporciona una interfaz
 * para filtrar datos. Incluye campos de búsqueda de texto, selección de estado
 * y rangos de fechas.
 *
 * Es un "componente controlado", lo que significa que el estado de los filtros
 * y la lógica para manejarlos residen en el componente padre.
 *
 * @param {object} props - Propiedades del componente.
 * @param {object} props.filters - Objeto que contiene el estado actual de los filtros (ej. `{ search: 'texto', isActive: 'true' }`).
 * @param {function} props.onFilterChange - Función handler que se invoca cuando cambia el valor de cualquier input de filtro.
 * @param {function} props.onApplyFilters - Función handler que se ejecuta al hacer clic en el botón "Filtrar".
 * @param {function} props.onClearFilters - Función handler que se ejecuta al hacer clic en el botón "Limpiar".
 * @param {boolean} props.isLoading - Booleano para mostrar un estado de carga en los botones, deshabilitándolos.
 */
const Filtros = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  isLoading,
}) => {
  return (
    <Grid
      templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr auto auto' }}
      gap={4}
      alignItems="center"
      p={4}
    >
      {/* Campo de búsqueda por texto */}
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          name="search"
          placeholder="Buscar por nombre o ID..."
          value={filters.search}
          onChange={onFilterChange}
        />
      </InputGroup>

      {/* Selector de estado (Activo/Inactivo) */}
      <Select
        name="isActive"
        value={filters.isActive}
        onChange={onFilterChange}
        placeholder="Todos los estados"
      >
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </Select>

      {/* Selector de fecha "desde" */}
      <Input
        type="date"
        name="createdAfter"
        value={filters.createdAfter}
        onChange={onFilterChange}
      />

      {/* Selector de fecha "hasta" */}
      <Input
        type="date"
        name="createdBefore"
        value={filters.createdBefore}
        onChange={onFilterChange}
      />

      <Button colorScheme="blue" onClick={onApplyFilters} isLoading={isLoading}>
        Filtrar
      </Button>
      
      <Button onClick={onClearFilters} isLoading={isLoading}>
        Limpiar
      </Button>
    </Grid>
  );
};

export default Filtros;
