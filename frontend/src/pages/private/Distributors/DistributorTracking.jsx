import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, useDisclosure, Heading, Flex, Card, CardBody, CardHeader, 
  Text, Spinner, Center, VStack, Icon, useColorModeValue, Divider, Badge, IconButton, Tooltip
} from "@chakra-ui/react";
import { CgFileDocument } from "react-icons/cg";
import { showSuccess, handleError } from "../../../services/NotificationService";
import DistributorService from "../../../services/DistributorService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import DistributorFiltersTracking from "./DistributorFiltersTracking";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";

const ITEMS_PER_PAGE = 10;

/**
 * `DistributorsPage` es el componente principal para la gestión de distribuidores.
 *
 * Responsabilidades:
 * - Listar distribuidores del sistema en una tabla paginada y filtrable.
 * - Gestionar las operaciones CRUD (Crear, Editar, Eliminar) para los distribuidores.
 * - Manejar cambios de estado (aprobar, rechazar, suspender).
 * - Navegar a la página de detalle de un distribuidor.
 */
const DistributorTracking = ({ assignmentCount }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  
  // Estados para la gestión de datos y UI.
  const [distributors, setDistributors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para los filtros.
  const initialFilters = { 
    search: "", 
    estado: "", 
    tipoPersona: "", 
    departamento: "" 
  };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  /**
   * Obtiene la lista de distribuidores aplicando los filtros y la paginación actuales.
   * @param {object} variables - Opciones de paginación para GraphQL.
   */
  const fetchDistributors = useCallback(async (variables) => {
    setIsLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== null)
      );

      const response = await DistributorService.getDistributorsTrackingTable({ ...cleanedFilters, ...variables });
      console.log('**Distribuidores obtenidos:', response.data.data);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!response.data.data.distributorsTrackingTable) {
        throw new Error('No se recibieron distribuidores asignados');
      }

      const { edges, pageInfo: newPageInfo } = response.data.data.distributorsTrackingTable;
      setTotalCount(edges.length || 0);
      setDistributors(edges.map((edge) => edge.node));
      setPageInfo(newPageInfo);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  // Efecto para la carga inicial de datos y para recargar cuando cambian los filtros.
  useEffect(() => {
    fetchDistributors({ first: ITEMS_PER_PAGE });
  }, [appliedFilters, fetchDistributors, assignmentCount]);
  
  // --- Handlers para filtros y paginación ---
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  

  
  const applyFilters = () => {
    setCursorStack([null]);
    setAppliedFilters(filters);
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
   
  };

   
  // --- Handlers de Paginación ---
  const handleNext = () => {
    if (!pageInfo.hasNextPage) return;
    setCursorStack((prev) => [...prev, pageInfo.endCursor]);
    setCurrentPage((prev) => prev + 1);
    fetchDistributors({ first: ITEMS_PER_PAGE, after: pageInfo.endCursor });
  };
  
  const handlePrevious = () => {
    if (currentPage === 1) return;
    const prevCursor = cursorStack[currentPage - 2] || null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentPage((prev) => prev - 1);
    fetchDistributors({ first: ITEMS_PER_PAGE, after: prevCursor });
  };


  // Configuración de las columnas para la tabla.
  const columns = [
    { Header: "NIT", accessor: "nit" },
    { Header: "Distribuidor", accessor: "distribuidor" },
    { Header: "Tiempo Pendiente", accessor: "tiempoPendiente" },
    { Header: "Tiempo Revisión", accessor: "tiempoRevision" },
    { Header: "Tiempo Validado", accessor: "tiempoValidado" },
    { 
      Header: "Estado", 
      accessor: "estadoFinal",
      Cell: ({ value }) => (
        <Badge 
          colorScheme={getStatusColor(value)}
          variant="subtle"
        >
          {value}
        </Badge>
      )
    },
    { Header: "Tiempo Final", accessor: "tiempoFinal" },
  ];

  // Función auxiliar para colores de estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'green';
      case 'pendiente': return 'yellow';
      case 'rechazado': return 'red';
      case 'validado': return 'orange';
      case 'suspendido': return 'purple';
      case 'revision': return 'blue';
      case 'correccion': return 'teal';
      default: return 'gray';
    }
  };
  


  if (isLoading && distributors.length === 0) {
    return <Center h="calc(100vh - 200px)"><Spinner size="xl" /></Center>;
  }

  return (
    <Box>
      <Card borderRadius="xl" boxShadow="lg">
        <CardHeader borderBottomWidth="1px" p={4}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
            <Box>
              <Heading size="lg">Tracking de Distribuidores </Heading>
              <Text color={textColor}>Reporte cronológico de los estados del distribuidor.</Text>
            </Box>
            
          </Flex>
        </CardHeader>

        <DistributorFiltersTracking
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          isLoading={isLoading}
        />
        <Divider/>

        <CardBody pos="relative">
          {isLoading && <OverlayLoader />}
          {distributors.length === 0 ? (
            <EmptyState /> 
          ) : (
            <GenericTable
              columns={columns} 
              data={distributors}
              
              
            />
          )}
        </CardBody>

        {distributors.length > 0 && (
          <>
            <Divider />
            <Paginacion
              currentPage={currentPage} 
              onAnterior={handlePrevious} 
              onSiguiente={handleNext}
              isLoading={isLoading} 
              itemCount={distributors.length} 
              totalCount={totalCount} 
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </Card>

    </Box>
  );
};

/**
 * Muestra un spinner de carga superpuesto.
 */
const OverlayLoader = () => (
  <Center pos="absolute" top="0" left="0" w="full" h="full" bg="whiteAlpha.700" zIndex="10">
    <Spinner size="xl" color="orange.500" />
  </Center>
);

/**
 * Muestra un mensaje cuando no hay datos para mostrar en la tabla.
 */
const EmptyState = () => (
  <Center p={10}>
    <VStack>
      <Icon as={CgFileDocument} boxSize={12} color="gray.400" />
      <Heading size="md" color="gray.600">No se encontraron distribuidores</Heading>
      <Text color="gray.500">Intenta ajustar tus filtros o crea un nuevo distribuidor.</Text>
    </VStack>
  </Center>
);

export default DistributorTracking;