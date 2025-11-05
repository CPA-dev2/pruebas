import React from 'react';
import {
  Box, Flex, Input, Select, Button, InputGroup, InputLeftElement, 
  Collapse, useDisclosure, Text, Icon
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

/**
 * `DistributorFilters` componente de filtros específico para distribuidores.
 * 
 * @param {object} props - Propiedades del componente.
 * @param {object} props.filters - Estado actual de los filtros.
 * @param {Function} props.onFilterChange - Callback para cambios en filtros.
 * @param {Function} props.onApplyFilters - Callback para aplicar filtros.
 * @param {Function} props.onClearFilters - Callback para limpiar filtros.
 * @param {boolean} props.isLoading - Estado de carga.
 */
const DistributorFilters = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters, 
  isLoading
}) => {
  const { isOpen, onToggle } = useDisclosure();

  // Departamentos de Guatemala (datos estáticos)
  const DEPARTAMENTOS_GUATEMALA = [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula",
    "El Progreso", "Escuintla", "Guatemala", "Huehuetenango",
    "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango",
    "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos",
    "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa"
  ];

  const handleInputChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };

  const handleSelectChange = (name, value) => {
    onFilterChange(name, value);
  };

  return (
    <Box p={4} bg="gray.50" borderBottomWidth="1px">
      <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          rightIcon={<Icon as={isOpen ? ChevronUpIcon : ChevronDownIcon} />}
        >
          {isOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>
        
        <Flex gap={2}>
          <Button size="sm" onClick={onApplyFilters} colorScheme="orange" isLoading={isLoading}>
            Aplicar
          </Button>
          <Button size="sm" variant="outline" onClick={onClearFilters}>
            Limpiar
          </Button>
        </Flex>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Flex wrap="wrap" gap={4}>
          {/* Búsqueda general */}
          <Box flex="1" minW="250px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Búsqueda General
            </Text>
            <InputGroup>
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                name="search"
                value={filters.search}
                onChange={handleInputChange}
                placeholder="Buscar por nombre del negocio o NIT"
                bg="white"
              />
            </InputGroup>
          </Box>

          {/* Estado */}
          <Box minW="180px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Estado
            </Text>
            <Select
              name="estado"
              value={filters.estado}
              onChange={handleInputChange}
              placeholder="Todos los estados"
              bg="white"
            >
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="suspendido">Suspendido</option>
            </Select>
          </Box>

          {/* Tipo de Persona */}
          <Box minW="180px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Tipo de Persona
            </Text>
            <Select
              name="tipoPersona"
              value={filters.tipoPersona}
              onChange={handleInputChange}
              placeholder="Todos los tipos"
              bg="white"
            >
              <option value="natural">Persona Natural</option>
              <option value="juridica">Persona Jurídica</option>
            </Select>
          </Box>

          {/* Departamento */}
          <Box minW="180px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Departamento
            </Text>
            <Select
              name="departamento"
              value={filters.departamento}
              onChange={handleInputChange}
              placeholder="Todos los departamentos"
              bg="white"
            >
              {DEPARTAMENTOS_GUATEMALA.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>

        {/* Indicadores de filtros activos */}
        {Object.values(filters).some(value => value !== "" && value !== null) && (
          <Box mt={3} pt={3} borderTopWidth="1px">
            <Text fontSize="sm" color="gray.600">
              <strong>Filtros activos:</strong>{' '}
              {Object.entries(filters)
                .filter(([_, value]) => value !== "" && value !== null)
                .map(([key, value]) => {
                  const labels = {
                    search: 'Búsqueda',
                    estado: 'Estado',
                    tipoPersona: 'Tipo',
                    departamento: 'Departamento'
                  };
                  return `${labels[key]}: ${value}`;
                })
                .join(', ')}
            </Text>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default DistributorFilters;