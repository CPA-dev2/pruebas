import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  useDisclosure,
  Heading,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Text,
  Spinner,
  Center,
  VStack,
  Icon,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { FiUsers } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, handleError } from "../../../services/NotificationService";
import ClientService from "../../../services/ClientService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import FiltrosClientes from "../../../components/Componentes_reutilizables/FiltrosClientes";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import { usePagination } from "../../../hooks/usePagination"; // 1. Importar hook

/**
 * `ClientsPage`
 * Página para la gestión completa (CRUD) de la entidad "Clientes".
 */
const ClientsPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  const queryClient = useQueryClient();

  // --- Estado Local ---
  const [selectedClient, setSelectedClient] = useState(null);
  // Nota: Este modal solo maneja la eliminación. Crear/Editar son páginas separadas.
  const [modalMode, setModalMode] = useState("delete");
  const initialFilters = { search: ""};
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // --- Hooks de Paginación y Datos ---
  
  // 2. Usar el hook de paginación
  const { currentPage, currentCursor, itemsPerPage, nextPage, prevPage, resetPagination } = usePagination(10);

  /**
   * 3. Función de Fetching para React Query
   */
  const fetchClients = async ({ queryKey }) => {
    // queryKey es ['clients', appliedFilters, currentCursor]
    const [_key, filters, cursor] = queryKey;
    
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
    );

    const variables = { ...cleanedFilters, first: itemsPerPage, after: cursor };
    const response = await ClientService.getClients(variables);
    return response.data.data; // Devuelve { allClients, clientsTotalCount }
  };

  // 4. Hook `useQuery`
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', appliedFilters, currentCursor],
    queryFn: fetchClients,
    keepPreviousData: true,
    onError: (error) => handleError("No se pudieron cargar los clientes."),
  });

  // --- Extracción de Datos ---
  const clients = data?.allClients?.edges.map((edge) => edge.node) || [];
  const totalCount = data?.clientsTotalCount || 0;
  const pageInfo = data?.allClients?.pageInfo || {};

  // --- Mutaciones ---
  // 5. Hook `useMutation` para Eliminar
  const deleteClientMutation = useMutation({
    mutationFn: ClientService.deleteClient,
    onSuccess: () => {
      showSuccess("El cliente ha sido eliminado.");
      resetPagination(); // Opcional: ir a pág 1 si el item borrado era el último
      queryClient.invalidateQueries(['clients']); // Refetch
      handleCloseModal();
    },
    onError: handleError,
  });

  // --- Handlers de UI ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    resetPagination();
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetPagination();
  };

  // Abre el modal de eliminación
  const handleDeleteModal = (client) => {
    setModalMode("delete");
    setSelectedClient(client);
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
    onClose();
  };

  // Confirma la eliminación
  const handleDeleteConfirm = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };

  // Handlers de Navegación
  const handleViewClient = (client) => navigate(`/clients/${client.id}`);
  const handleEditClient = (client) => navigate(`/clients/edit/${client.id}`);
  const handleCreateClient = () => navigate("/clients/create"); // Navega a la página de creación

  const handleNext = () => {
    if (pageInfo.hasNextPage) {
      nextPage(pageInfo.endCursor);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      prevPage();
    }
  };
  
  // --- Renderizado ---
  if (isLoading && clients.length === 0) {
    return (
      <Center h="calc(100vh - 200px)">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
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
              <Heading size="lg">Gestión de Clientes</Heading>
              <Text color={textColor}>
                Visualiza, crea, edita y elimina los clientes.
              </Text>
            </Box>
            <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={handleCreateClient}>
              Crear Cliente
            </Button>
          </Flex>
        </CardHeader>

        <FiltrosClientes
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          isLoading={isFetching}
        />

        <Divider />

        <CardBody pos="relative">
          {isFetching && <OverlayLoader />}
          {clients.length === 0 ? (
            <EmptyState />
          ) : (
            <GenericTable
              columns={columns}
              data={clients}
              onView={handleViewClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteModal} // Pasa el handler del modal
            />
          )}
        </CardBody>

        {clients.length > 0 && (
          <>
            <Divider />
            <Paginacion
              currentPage={currentPage}
              onAnterior={handlePrevious}
              onSiguiente={handleNext}
              isLoading={isFetching}
              itemCount={clients.length}
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
        isConfirming={deleteClientMutation.isLoading}
        size="md"
      >
        <Text>
          ¿Estás seguro de que deseas eliminar el cliente "<b>{selectedClient?.nombres} {selectedClient?.apellidos}</b>"?
          Esta acción no se puede deshacer.
        </Text>
      </GenericModal>
    </Box>
  );
};

// --- Constantes y Componentes de UI ---

const columns = [
  { Header: "Nombres", accessor: "nombres" },
  { Header: "Apellidos", accessor: "apellidos" },
  { Header: "DPI", accessor: "dpi" },
  { Header: "Email", accessor: "email" },
  { Header: "Teléfono", accessor: "telefono" },
  { Header: "Activo", accessor: "isActive" },
];

const OverlayLoader = () => (
  <Center
    position="absolute"
    top="0"
    left="0"
    right="0"
    bottom="0"
    bg="whiteAlpha.800"
    zIndex="10"
  >
    <Spinner size="xl" color="blue.500" />
  </Center>
);

const EmptyState = () => (
  <Center p={10}>
    <VStack>
      <Icon as={FiUsers} boxSize={12} color="gray.400" />
      <Heading size="md" color="gray.600">
        No se encontraron clientes
      </Heading>
      <Text color="gray.500">Intenta ajustar tus filtros o crea un nuevo cliente.</Text>
    </VStack>
  </Center>
);

export default ClientsPage;