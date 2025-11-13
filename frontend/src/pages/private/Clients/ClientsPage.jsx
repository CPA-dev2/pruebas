import React, { useState, useEffect, useCallback } from "react";
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
import { showSuccess, handleError } from "../../../services/NotificationService";
import ClientService from "../../../services/ClientService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import ClientForm from "./ClientForm";
import FiltrosClientes from "../../../components/Componentes_reutilizables/FiltrosClientes";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";

const ITEMS_PER_PAGE = 10;

/**
 * `ClientsPage` es un componente de página completo para la gestión de "clientes".
 *
 * Responsabilidades:
 * - **Visualización de Datos**: Muestra una lista paginada y filtrable de clientes en una tabla.
 * - **Gestión de Estado**: Maneja el estado para los datos de clientes, paginación, filtros, carga y modales.
 * - **Operaciones CRUD**: Permite crear, editar y eliminar clientes a través de modales.
 * - **Navegación**: Redirige a la página de detalles de un cliente.
 * - **Feedback al Usuario**: Muestra notificaciones de éxito/error y estados de carga.
 *
 * Utiliza una serie de componentes reutilizables como `GenericTable`, `GenericModal`,
 * `FiltrosClientes` y `Paginacion` para construir la interfaz.
 */
const ClientsPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");

  // Estado para la lista de clientes y su paginación.
  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]); // Almacena cursores para paginación hacia atrás.
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para controlar el modal (crear, editar, eliminar).
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Estado para gestionar los indicadores de carga.
  const [isLoading, setIsLoading] = useState(true); // Carga inicial o de datos.
  const [isSubmitting, setIsSubmitting] = useState(false); // Envío de formularios (crear/editar/eliminar).

  // Estado para los filtros de búsqueda.
  const initialFilters = { search: ""};
  const [filters, setFilters] = useState(initialFilters); // Filtros actuales en los inputs.
  const [appliedFilters, setAppliedFilters] = useState(initialFilters); // Filtros que se aplican a la consulta.

  /**
   * Obtiene los clientes desde el servicio aplicando los filtros y la paginación actual.
   * La función está envuelta en `useCallback` para optimizar el rendimiento,
   * evitando recreaciones innecesarias en cada render.
   * @param {object} variables - Opciones de paginación para la consulta GraphQL (e.g., first, after).
   */
  const fetchClients = useCallback(
    async (variables) => {
      setIsLoading(true);
      try {
        // Limpia los filtros para no enviar valores vacíos a la API.
        const cleanedFilters = Object.fromEntries(
          Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== null)
        );

        const response = await ClientService.getClients({
          ...cleanedFilters,
          ...variables,
        });
        setTotalCount(response.data.data.clientsTotalCount || 0);
        const { edges, pageInfo: newPageInfo } = response.data.data.allClients;
        setClients(edges.map((edge) => edge.node));
        setPageInfo(newPageInfo);
      } catch (error) {
        console.error("Error al cargar los clientes:", error);
        console.error("Detalles del error:", error.response?.data);
        handleError("No se pudieron cargar los clientes. Verifica que el backend esté funcionando correctamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilters]
  );

  // Efecto para la carga inicial de datos cuando el componente se monta.
  useEffect(() => {
    fetchClients({ first: ITEMS_PER_PAGE });
  }, [fetchClients]);

  /**
   * Maneja el cambio de valor en los inputs de filtro.
   * @param {React.ChangeEvent<HTMLInputElement>} e - El evento de cambio.
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Aplica los filtros seleccionados, actualizando el estado `appliedFilters`
   * y reiniciando la paginación para una nueva consulta.
   */
  const applyFilters = () => {
    setAppliedFilters(filters);
    resetPagination();
  };

  /**
   * Limpia todos los filtros, restaurándolos a su estado inicial y
   * realizando una nueva consulta.
   */
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetPagination();
  };

  /**
   * Reinicia la paginación a la primera página. Se llama al aplicar
   * o limpiar filtros.
   */
  const resetPagination = () => {
    setCursorStack([null]);
    setCurrentPage(1);
    fetchClients({ first: ITEMS_PER_PAGE });
  };

  /**
   * Abre el modal en un modo específico ('create', 'edit', 'delete') y
   * establece el cliente seleccionado si es necesario.
   * @param {string} mode - El modo en que se abrirá el modal.
   * @param {object|null} client - El cliente a editar o eliminar.
   */
  const handleOpenModal = (mode, client = null) => {
    if (mode === "delete"){
      setSelectedClient(client);
      onOpen();
    }
  };

  /**
   * Cierra el modal y limpia el estado del cliente seleccionado.
   */
  const handleCloseModal = () => {
    setSelectedClient(null);
    onClose();
  };

  /**
   * Gestiona el envío del formulario de creación o edición de un cliente.
   * @param {object} values - Los datos del formulario.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await ClientService.createClient(values);
      } else if (modalMode === "edit") {
        await ClientService.updateClient({ id: selectedClient.id, ...values });
      }
      showSuccess(`Cliente ${modalMode === "create" ? "creado" : "actualizado"} con éxito.`);
      resetPagination();
      handleCloseModal();
    } catch (error) {
      console.error("Error en operación:", error);
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navega a la página para creación o edición del cliente.
   * @param {object} client - El cliente al que se va a navegar.
   */
  const handleViewClient = (client) => navigate(`/clients/${client.id}`);
  const handleEditClient = (client) => navigate(`/clients/edit/${client.id}`);
  const handleCreateClient = () => navigate("/clients/create");
  const handleDeleteClient = (client) => { handleOpenModal("delete", client); }

  /**
   * Confirma y ejecuta la eliminación de un cliente.
   */
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await ClientService.deleteClient(selectedClient.id);
      showSuccess("El cliente ha sido eliminado.");
      resetPagination();
      handleCloseModal();
    } catch (error){
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Carga la página siguiente de resultados.
   */
  const handleNext = () => {
    if (!pageInfo.hasNextPage) return;
    setCursorStack((prev) => [...prev, pageInfo.endCursor]);
    setCurrentPage((prev) => prev + 1);
    fetchClients({ first: ITEMS_PER_PAGE, after: pageInfo.endCursor });
  };

  /**
   * Carga la página anterior de resultados.
   */
  const handlePrevious = () => {
    if (currentPage === 1) return;
    const prevCursor = cursorStack[cursorStack.length - 2] || null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentPage((prev) => prev - 1);
    fetchClients({ first: ITEMS_PER_PAGE, after: prevCursor });
  };

  // Define las columnas para el componente `GenericTable`.
  const columns = [
    { Header: "Nombres", accessor: "nombres" },
    { Header: "Apellidos", accessor: "apellidos" },
    { Header: "DPI", accessor: "dpi" },
    { Header: "Email", accessor: "email" },
    { Header: "Teléfono", accessor: "telefono" },
    { Header: "Activo", accessor: "isActive" },
  ];


  // Muestra un spinner de carga a pantalla completa si es la carga inicial.
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
          isLoading={isLoading}
        />

        <Divider />

        <CardBody pos="relative">
          {isLoading && <OverlayLoader />}
          {clients.length === 0 ? (
            <EmptyState />
          ) : (
            <GenericTable
              columns={columns}
              data={clients}
              onView={handleViewClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
            />
          )}
        </CardBody>

        {clients.length > 0 && (
          <>
            <Divider />
            <Paginacion
              pageInfo={pageInfo}
              currentPage={currentPage}
              onAnterior={handlePrevious}
              onSiguiente={handleNext}
              isLoading={isLoading}
              itemCount={clients.length}
              totalCount={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
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
        isLoading={isSubmitting}
        size="md"
      >
        
          <Text>
            ¿Estás seguro de que deseas eliminar el cliente "{selectedClient?.nombres} {selectedClient?.apellidos}"?
            Esta acción no se puede deshacer.
          </Text>
     
      </GenericModal>
    </Box>
  );
};

/**
 * `OverlayLoader` es un componente que muestra un indicador de carga superpuesto
 * sobre el contenido de la tabla cuando se están realizando operaciones.
 */
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

/**
 * `EmptyState` es un componente que se muestra cuando una tabla o lista no
 * tiene datos para mostrar (por ejemplo, después de aplicar filtros que no
 * arrojan resultados).
 */
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