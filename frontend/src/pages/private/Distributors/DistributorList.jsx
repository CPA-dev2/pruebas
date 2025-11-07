import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, useDisclosure, Heading, Flex, Card, CardBody, CardHeader,
  Text, Spinner, Center, VStack, Icon, useColorModeValue, Divider,
  Badge, IconButton, Tooltip, Grid
} from '@chakra-ui/react';
import { AddIcon } from "@chakra-ui/icons";
import { CgFileDocument } from "react-icons/cg";
import { MdAssignmentInd, MdCheckBox } from "react-icons/md";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, handleError } from "../../../services/NotificationService";
import DistributorService from "../../../services/DistributorService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import DistributorFilters from "./DistributorFilters";
import DistributorFiltersTracking from "./DistributorFiltersTracking";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import { usePagination } from "../../../hooks/usePagination";

/**
 * `DistributorList`
 * * Componente "Presentacional Inteligente" que renderiza la lista, filtros,
 * y paginación para *una* vista de distribuidores.
 * * Es reutilizado por `DistributorTabsPage` para cada pestaña.
 * * @param {object} props
 * @param {string} props.viewType - El identificador de la vista (ej. 'pending', 'my_revisions').
 * @param {boolean} props.isTrackingView - Flag para saber si debe usar la query de Tracking.
 * @param {Function} props.onAssignmentSuccess - Callback para notificar al padre de una asignación exitosa.
 */
const DistributorList = ({ viewType, isTrackingView, onAssignmentSuccess }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal de borrado
  const textColor = useColorModeValue("gray.500", "gray.400");
  const queryClient = useQueryClient();

  // --- Estado Local (Filtros y Modal) ---
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const initialFilters = { search: "", estado: "", tipoPersona: "", departamento: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // --- Hooks de Paginación y Datos ---
  const { currentPage, currentCursor, itemsPerPage, nextPage, prevPage, resetPagination } = usePagination(10);

  // --- Query de Datos ---
  const queryConfig = {
    // La queryKey es ÚNICA por pestaña y filtros, gracias a 'viewType'
    queryKey: ['distributors', viewType, appliedFilters, currentCursor],
    
    queryFn: async ({ queryKey }) => {
      const [_key, _view, filters, cursor] = queryKey;
      
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
      );

      const variables = { ...cleanedFilters, first: itemsPerPage, after: cursor };

      if (isTrackingView) {
        // La vista de Tracking usa una query y servicio diferente
        const response = await DistributorService.getDistributorsTrackingTable(variables);
        return response.data.data.distributorsTrackingTable;
      } else {
        // Todas las demás vistas usan la query consolidada
        variables.viewType = viewType; // <-- Pasa el viewType a la query
        const response = await DistributorService.getDistributors(variables);
        return response.data.data;
      }
    },
    keepPreviousData: true,
    onError: (error) => handleError(error),
  };

  const { data, isLoading, isFetching } = useQuery(queryConfig);

  // --- Extracción de Datos (Condicional) ---
  const distributors = isTrackingView
    ? data?.edges?.map((edge) => edge.node) || []
    : data?.allDistributors?.edges.map((edge) => edge.node) || [];
  
  const totalCount = isTrackingView
    ? data?.totalCount || 0
    : data?.distributorsTotalCount || 0;
    
  const pageInfo = data?.pageInfo || {};

  // --- Mutaciones ---
  const deleteDistributorMutation = useMutation({
    mutationFn: DistributorService.deleteDistributor,
    onSuccess: () => {
      showSuccess("El distribuidor ha sido eliminado.");
      resetPagination();
      // Invalida *todas* las queries de distribuidores para refrescar todas las pestañas
      queryClient.invalidateQueries({ queryKey: ['distributors'] }); 
      handleCloseModal();
    },
    onError: handleError,
  });

  const assignDistributorMutation = useMutation({
    mutationFn: DistributorService.assignDistributorToMe,
    onSuccess: () => {
      showSuccess(`El distribuidor ha sido asignado.`);
      // Llama al callback del padre (TabsPage) para cambiar de pestaña
      if (onAssignmentSuccess) {
        onAssignmentSuccess();
      }
    },
    onError: handleError,
  });

  // --- Handlers ---
  const handleFilterChange = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
  const applyFilters = () => { setAppliedFilters(filters); resetPagination(); };
  const clearFilters = () => { setFilters(initialFilters); setAppliedFilters(initialFilters); resetPagination(); };

  const handleOpenModal = (distributor) => { setSelectedDistributor(distributor); onOpen(); };
  const handleCloseModal = () => { setSelectedDistributor(null); onClose(); };

  const handleDeleteConfirm = () => deleteDistributorMutation.mutate(selectedDistributor.id);
  const handleAssignDistributor = (distributor) => assignDistributorMutation.mutate(distributor.id);

  // Handlers de Navegación
  const handleViewDistributor = (distributor) => navigate(`/distributors/${distributor.id}`);
  const handleFormDistributor = () => navigate(`/distributors/create`);
  const handleEditDistributor = (distributor) => navigate(`/distributors/edit/${distributor.id}`);
  const handleValidateDistributor = (distributor) => navigate(`/distributors/validate/${distributor.id}`);

  // Handlers de Paginación
  const handleNext = () => pageInfo.hasNextPage && nextPage(pageInfo.endCursor);
  const handlePrevious = () => currentPage > 1 && prevPage();

  // --- Lógica de Renderizado Condicional ---
  const getTitle = () => tabConfig.find(t => t.viewType === viewType)?.label || "Distribuidores";
  
  const getSubTitle = () => {
    const messages = {
      pending: "Distribuidores esperando asignación.",
      my_revisions: "Distribuidores asignados a mi perfil para revisar.",
      my_validated: "Distribuidores que he validado.",
      approved: "Listado de todos los distribuidores aprobados.",
      rejected: "Listado de todos los distribuidores rechazados.",
      tracking: "Reporte cronológico de los estados del distribuidor."
    };
    return messages[viewType] || "";
  };

  const getColumns = () => isTrackingView ? trackingColumns : standardColumns;

  const renderActions = (distributor) => {
    switch (viewType) {
      case 'pending':
        return (
          <Tooltip label="Asignarme este distribuidor" placement="top">
            <IconButton 
              size="sm" marginLeft={2} colorScheme="green" 
              icon={<MdAssignmentInd />} 
              onClick={() => handleAssignDistributor(distributor)} 
              aria-label="Asignarme distribuidor"
              isLoading={assignDistributorMutation.isLoading}
            />
          </Tooltip>
        );
      case 'my_revisions':
      case 'my_validated':
      case 'rejected':
        return (
          <Grid>
            <Tooltip label="Validar/Revisar distribuidor" placement="top">
              <IconButton 
                size="sm" margin={2} colorScheme="green" 
                icon={<MdCheckBox />} 
                onClick={() => handleValidateDistributor(distributor)} 
                aria-label="Validar distribuidor" 
              />
            </Tooltip>
          </Grid>
        );
      default:
        return null;
    }
  };

  // --- Renderizado ---
  if (isLoading && distributors.length === 0) {
    return <Center h="calc(100vh - 300px)"><Spinner size="xl" color="orange.500" /></Center>;
  }

  return (
    <Box>
      <Card borderRadius="xl" boxShadow="lg">
        <CardHeader borderBottomWidth="1px" p={4}>
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'flex-start', md: 'center' }} 
            gap={4}
          >
            <Box>
              <Heading size="lg">{getTitle()}</Heading>
              <Text color={textColor}>{getSubTitle()}</Text>
            </Box>
            {viewType === 'pending' && (
              <Button 
                leftIcon={<AddIcon />} 
                colorScheme="orange" 
                onClick={handleFormDistributor}
              >
                Crear Distribuidor
              </Button>
            )}
          </Flex>
        </CardHeader>

        {isTrackingView ? (
          <DistributorFiltersTracking 
            filters={filters} onFilterChange={handleFilterChange} 
            onApplyFilters={applyFilters} onClearFilters={clearFilters} 
            isLoading={isFetching} 
          />
        ) : (
          <DistributorFilters 
            filters={filters} onFilterChange={handleFilterChange} 
            onApplyFilters={applyFilters} onClearFilters={clearFilters} 
            isLoading={isFetching} 
          />
        )}
        <Divider />

        <CardBody pos="relative">
          {(isFetching || assignDistributorMutation.isLoading) && <OverlayLoader />}
          {distributors.length === 0 ? (
            <EmptyState viewType={viewType} /> 
          ) : (
            <GenericTable
              columns={getColumns()}
              data={distributors}
              onView={!isTrackingView ? handleViewDistributor : undefined}
              onEdit={!isTrackingView ? handleEditDistributor : undefined}
              onDelete={!isTrackingView ? handleOpenModal : undefined}
              renderActions={!isTrackingView ? renderActions : undefined}
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
              isLoading={isFetching}
              itemCount={distributors.length}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </Card>

      <GenericModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={"Confirmar Eliminación"}
        onConfirm={handleDeleteConfirm}
        confirmButtonText="Eliminar"
        isConfirming={deleteDistributorMutation.isLoading}
        size="md"
      >
        <Text>
          ¿Estás seguro de que deseas eliminar al distribuidor "<b>{selectedDistributor?.negocioNombre}</b>"?
        </Text>
      </GenericModal>
    </Box>
  );
};

// --- Constantes de UI (Definidas en el mismo archivo para simplicidad) ---

const getStatusColor = (estado) => {
  const colors = {
    aprobado: 'green',
    pendiente: 'yellow',
    rechazado: 'red',
    validado: 'orange',
    suspendido: 'purple',
    revision: 'blue',
    correccion: 'teal',
  };
  return colors[estado] || 'gray';
};

const standardColumns = [
  { Header: "Negocio", accessor: "negocioNombre" },
  { Header: "NIT", accessor: "nit" },
  { Header: "Contacto", accessor: "nombres", Cell: ({ row }) => `${row.original.nombres} ${row.original.apellidos}` },
  { Header: "Email", accessor: "correo" },
  { Header: "Departamento", accessor: "departamento" },
  { Header: "Tipo", accessor: "tipoPersona" },
  { Header: "Estado", accessor: "estado", Cell: ({ value }) => <Badge colorScheme={getStatusColor(value)} variant="subtle">{value}</Badge> },
];

const trackingColumns = [
  { Header: "NIT", accessor: "nit" },
  { Header: "Distribuidor", accessor: "distribuidor" },
  { Header: "T. Pendiente", accessor: "tiempoPendiente" },
  { Header: "T. Revisión", accessor: "tiempoRevision" },
  { Header: "T. Validado", accessor: "tiempoValidado" },
  { Header: "Estado Final", accessor: "estadoFinal", Cell: ({ value }) => <Badge colorScheme={getStatusColor(value)} variant="subtle">{value}</Badge> },
  { Header: "Tiempo Final", accessor: "tiempoFinal" },
];

const OverlayLoader = () => (
  <Center pos="absolute" top="0" left="0" w="full" h="full" bg="whiteAlpha.700" zIndex="10">
    <Spinner size="xl" color="orange.500" />
  </Center>
);

const EmptyState = ({ viewType }) => {
  const messages = {
    pending: "No hay distribuidores pendientes de asignación.",
    my_revisions: "No tienes distribuidores en revisión o corrección.",
    my_validated: "No tienes distribuidores en estado 'Validado'.",
    approved: "No se encontraron distribuidores aprobados.",
    rejected: "No se encontraron distribuidores rechazados.",
    tracking: "No se encontraron datos de tracking."
  };
  return (
    <Center p={10}>
      <VStack>
        <Icon as={CgFileDocument} boxSize={12} color="gray.400" />
        <Heading size="md" color="gray.600">No se encontraron resultados</Heading>
        <Text color="gray.500">{messages[viewType] || "Intenta ajustar tus filtros."}</Text>
      </VStack>
    </Center>
  );
};

export default DistributorList;