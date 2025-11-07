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
import { CgFileDocument } from "react-icons/cg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, handleError } from "../../../services/NotificationService";
import ItemService from "../../../services/ItemService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import ItemForm from "./ItemForm";
import Filtros from "../../../components/Componentes_reutilizables/Filtros";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import { usePagination } from "../../../hooks/usePagination"; // 1. Importar hook de paginación

/**
 * `ItemsPage`
 * Página para la gestión completa (CRUD) de la entidad "Items".
 *
 * Responsabilidades:
 * - Mostrar lista paginada y filtrable de items.
 * - Manejar estados de carga (inicial y refetching).
 * - Proveer acciones de Crear, Editar, Eliminar y Ver detalles.
 * - Centraliza la lógica de datos usando React Query.
 */
const ItemsPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  const queryClient = useQueryClient(); // Cliente de React Query para invalidar caché

  // --- Estado Local ---
  // Solo se maneja el estado de los modales y los filtros no aplicados.
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'delete'
  const initialFilters = { search: "", isActive: "", createdAfter: "", createdBefore: "" };
  const [filters, setFilters] = useState(initialFilters); // Filtros en los inputs
  const [appliedFilters, setAppliedFilters] = useState(initialFilters); // Filtros aplicados a la query

  // --- Hooks de Paginación y Datos ---
  
  // 2. Usar el hook de paginación
  const { currentPage, currentCursor, itemsPerPage, nextPage, prevPage, resetPagination } = usePagination(10);

  /**
   * 3. Función de Fetching para React Query
   * Esta función es llamada por `useQuery` y recibe el `queryKey`.
   */
  const fetchItems = async ({ queryKey }) => {
    // queryKey es ['items', appliedFilters, currentCursor]
    const [_key, filters, cursor] = queryKey;
    
    // Limpia filtros vacíos antes de enviar a la API
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
    );
    // Convierte valores de string a booleano si es necesario
    if (cleanedFilters.isActive === "true") cleanedFilters.isActive = true;
    if (cleanedFilters.isActive === "false") cleanedFilters.isActive = false;

    const variables = { ...cleanedFilters, first: itemsPerPage, after: cursor };
    const response = await ItemService.getItems(variables);
    return response.data.data; // Devuelve { allItems, itemsTotalCount }
  };

  // 4. Hook `useQuery` para manejar el fetching, caching, y estados
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['items', appliedFilters, currentCursor], // La key identifica esta query
    queryFn: fetchItems,                               // Función que hace el fetch
    keepPreviousData: true,                            // Mantiene datos anteriores mientras carga nuevos
    onError: (error) => handleError("No se pudieron cargar los ítems."),
  });

  // --- Extracción de Datos ---
  // Extrae los datos de 'data' de forma segura
  const items = data?.allItems?.edges.map((edge) => edge.node) || [];
  const totalCount = data?.itemsTotalCount || 0;
  const pageInfo = data?.allItems?.pageInfo || {};

  // --- Mutaciones ---
  // 5. Hooks `useMutation` para Crear, Actualizar y Eliminar

  /**
   * Callback genérico para éxito de mutaciones.
   * Muestra notificación, resetea la paginación, invalida el caché, y cierra el modal.
   */
  const handleMutationSuccess = (message) => {
    showSuccess(message);
    resetPagination(); // Vuelve a la página 1
    queryClient.invalidateQueries(['items']); // Fuerza un refetch de los datos
    handleCloseModal();
  };

  const createItemMutation = useMutation({
    mutationFn: ItemService.createItem,
    onSuccess: () => handleMutationSuccess("Item creado con éxito."),
    onError: handleError,
  });

  const updateItemMutation = useMutation({
    mutationFn: ItemService.updateItem,
    onSuccess: () => handleMutationSuccess("Item actualizado con éxito."),
    onError: handleError,
  });

  const deleteItemMutation = useMutation({
    mutationFn: ItemService.deleteItem,
    onSuccess: () => handleMutationSuccess("Item eliminado con éxito."),
    onError: handleError,
  });
  
  // --- Handlers de UI ---

  // Actualiza el estado de los inputs de filtro
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  
  // Aplica los filtros, lo que dispara un refetch de useQuery
  const applyFilters = () => {
    setAppliedFilters(filters);
    resetPagination(); // Vuelve a la pág 1 al filtrar
  };
  
  // Limpia los filtros, lo que dispara un refetch
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetPagination();
  };

  // Abre el modal en el modo correcto
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    onOpen();
  };

  // Cierra y resetea el modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    onClose();
  };

  // Handler para el submit del formulario (dispara la mutación)
  const handleSubmit = (values) => {
    if (modalMode === "create") {
      createItemMutation.mutate(values);
    } else if (modalMode === "edit") {
      updateItemMutation.mutate({ id: selectedItem.id, ...values });
    }
  };

  // Handler para la confirmación de borrado (dispara la mutación)
  const handleDeleteConfirm = () => {
    deleteItemMutation.mutate(selectedItem.id);
  };
  
  // Handlers de Navegación
  const handleViewItem = (item) => navigate(`/items/${item.id}`);
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

  // Helper para el título del modal
  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Crear Nuevo Item";
      case "edit": return "Editar Item";
      case "delete": return "Confirmar Eliminación";
      default: return "";
    }
  };

  // --- Renderizado ---

  // Estado de carga inicial (pantalla completa)
  if (isLoading && items.length === 0) {
    return (
      <Center h="calc(100vh - 200px)">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  // Estado de 'submitting' para los botones del modal
  const isSubmitting = createItemMutation.isLoading || updateItemMutation.isLoading || deleteItemMutation.isLoading;

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
              <Heading size="lg">Gestión de Items</Heading>
              <Text color={textColor}>
                Visualiza, crea, edita y elimina los registros.
              </Text>
            </Box>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleOpenModal("create")}>
              Crear Item
            </Button>
          </Flex>
        </CardHeader>

        <Filtros
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          isLoading={isFetching} // Usa isFetching para el loader de filtros
        />

        <Divider />

        <CardBody pos="relative">
          {/* isFetching muestra el loader superpuesto durante recargas/paginación */}
          {isFetching && <OverlayLoader />}
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <GenericTable
              columns={columns}
              data={items}
              onView={handleViewItem}
              onEdit={(item) => handleOpenModal("edit", item)}
              onDelete={(item) => handleOpenModal("delete", item)}
            />
          )}
        </CardBody>

        {items.length > 0 && (
          <>
            <Divider />
            <Paginacion
              currentPage={currentPage}
              onAnterior={handlePrevious}
              onSiguiente={handleNext}
              isLoading={isFetching}
              itemCount={items.length}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </Card>

      {/* Modal para Crear/Editar/Eliminar */}
      <GenericModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={getModalTitle()}
        onConfirm={
          modalMode === "delete"
            ? handleDeleteConfirm
            : () => document.getElementById("item-form-submit").click()
        }
        confirmButtonText={modalMode === "delete" ? "Eliminar" : "Guardar"}
        isConfirming={isSubmitting} // Deshabilita botones mientras la mutación corre
      >
        {modalMode === "create" || modalMode === "edit" ? (
          <ItemForm
            onSubmit={handleSubmit}
            initialValues={selectedItem || { nombre: "", descripcion: "" }}
            isSubmitting={isSubmitting}
          />
        ) : (
          <Text>
            ¿Estás seguro de que deseas eliminar el item "<b>{selectedItem?.nombre}</b>"?
          </Text>
        )}
      </GenericModal>
    </Box>
  );
};

// --- Constantes y Componentes de UI ---

const columns = [
  { Header: "Nombre", accessor: "nombre" },
  { Header: "Descripción", accessor: "descripcion" },
  { Header: "Activo", accessor: "isActive" },
];

const OverlayLoader = () => (
  <Center
    pos="absolute"
    top="0"
    left="0"
    w="full"
    h="full"
    bg="whiteAlpha.700"
    zIndex="10"
  >
    <Spinner size="xl" color="blue.500" />
  </Center>
);

const EmptyState = () => (
  <Center p={10}>
    <VStack>
      <Icon as={CgFileDocument} boxSize={12} color="gray.400" />
      <Heading size="md" color="gray.600">
        No se encontraron resultados
      </Heading>
      <Text color="gray.500">Intenta ajustar tus filtros o crea un nuevo ítem.</Text>
    </VStack>
  </Center>
);

export default ItemsPage;