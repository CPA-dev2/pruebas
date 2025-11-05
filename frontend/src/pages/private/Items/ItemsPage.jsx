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
import { CgFileDocument } from "react-icons/cg";
import { showSuccess, handleError } from "../../../services/NotificationService";
import ItemService from "../../../services/ItemService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import ItemForm from "./ItemForm";
import Filtros from "../../../components/Componentes_reutilizables/Filtros";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";

const ITEMS_PER_PAGE = 10;

/**
 * `ItemsPage` es un componente de página completo para la gestión de "items".
 *
 * Responsabilidades:
 * - **Visualización de Datos**: Muestra una lista paginada y filtrable de items en una tabla.
 * - **Gestión de Estado**: Maneja el estado para los datos de items, paginación, filtros, carga y modales.
 * - **Operaciones CRUD**: Permite crear, editar y eliminar items a través de modales.
 * - **Navegación**: Redirige a la página de detalles de un item.
 * - **Feedback al Usuario**: Muestra notificaciones de éxito/error y estados de carga.
 *
 * Utiliza una serie de componentes reutilizables como `GenericTable`, `GenericModal`,
 * `Filtros` y `Paginacion` para construir la interfaz.
 */
const ItemsPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");

  // Estado para la lista de items y su paginación.
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]); // Almacena cursores para paginación hacia atrás.
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para controlar el modal (crear, editar, eliminar).
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Estado para gestionar los indicadores de carga.
  const [isLoading, setIsLoading] = useState(true); // Carga inicial o de datos.
  const [isSubmitting, setIsSubmitting] = useState(false); // Envío de formularios (crear/editar/eliminar).

  // Estado para los filtros de búsqueda.
  const initialFilters = { search: "", isActive: "", createdAfter: "", createdBefore: "" };
  const [filters, setFilters] = useState(initialFilters); // Filtros actuales en los inputs.
  const [appliedFilters, setAppliedFilters] = useState(initialFilters); // Filtros que se aplican a la consulta.

  /**
   * Obtiene los items desde el servicio aplicando los filtros y la paginación actual.
   * La función está envuelta en `useCallback` para optimizar el rendimiento,
   * evitando recreaciones innecesarias en cada render.
   * @param {object} variables - Opciones de paginación para la consulta GraphQL (e.g., first, after).
   */
  const fetchItems = useCallback(
    async (variables) => {
      setIsLoading(true);
      try {
        // Limpia los filtros para no enviar valores vacíos a la API.
        const cleanedFilters = Object.fromEntries(
          Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== null)
        );

        // Convierte el filtro `isActive` de string a booleano si es necesario.
        if (cleanedFilters.isActive === "true") cleanedFilters.isActive = true;
        if (cleanedFilters.isActive === "false") cleanedFilters.isActive = false;

        const response = await ItemService.getItems({
          ...cleanedFilters,
          ...variables,
        });
        setTotalCount(response.data.data.itemsTotalCount || 0);
        const { edges, pageInfo: newPageInfo } = response.data.data.allItems;
        setItems(edges.map((edge) => edge.node));
        setPageInfo(newPageInfo);
      } catch (error) {
        console.error("Error al cargar los items:", error);
        handleError("No se pudieron cargar los ítems.");
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilters]
  );

  // Efecto para la carga inicial de datos cuando el componente se monta.
  useEffect(() => {
    fetchItems({ first: ITEMS_PER_PAGE });
  }, [fetchItems]);

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
    fetchItems({ first: ITEMS_PER_PAGE });
  };

  /**
   * Abre el modal en un modo específico ('create', 'edit', 'delete') y
   * establece el item seleccionado si es necesario.
   * @param {string} mode - El modo en que se abrirá el modal.
   * @param {object|null} item - El item a editar o eliminar.
   */
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    onOpen();
  };

  /**
   * Cierra el modal y limpia el estado del item seleccionado.
   */
  const handleCloseModal = () => {
    setSelectedItem(null);
    onClose();
  };

  /**
   * Gestiona el envío del formulario de creación o edición de un item.
   * @param {object} values - Los datos del formulario.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await ItemService.createItem(values);
      } else if (modalMode === "edit") {
        await ItemService.updateItem({ id: selectedItem.id, ...values });
      }
      showSuccess(`Item ${modalMode === "create" ? "creado" : "actualizado"} con éxito.`);
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
   * Confirma y ejecuta la eliminación de un item.
   */
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await ItemService.deleteItem(selectedItem.id);
      showSuccess("El item ha sido eliminado.");
      resetPagination();
      handleCloseModal();
    } catch (error){
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navega a la página de detalle del item.
   * @param {object} item - El item al que se va a navegar.
   */
  const handleViewItem = (item) => navigate(`/items/${item.id}`);

  /**
   * Carga la página siguiente de resultados.
   */
  const handleNext = () => {
    if (!pageInfo.hasNextPage) return;
    setCursorStack((prev) => [...prev, pageInfo.endCursor]);
    setCurrentPage((prev) => prev + 1);
    fetchItems({ first: ITEMS_PER_PAGE, after: pageInfo.endCursor });
  };

  /**
   * Carga la página anterior de resultados.
   */
  const handlePrevious = () => {
    if (currentPage === 1) return;
    const prevCursor = cursorStack[cursorStack.length - 2] || null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentPage((prev) => prev - 1);
    fetchItems({ first: ITEMS_PER_PAGE, after: prevCursor });
  };

  // Define las columnas para el componente `GenericTable`.
  const columns = [
    { Header: "Nombre", accessor: "nombre" },
    { Header: "Descripción", accessor: "descripcion" },
    { Header: "Activo", accessor: "isActive" },
  ];

  /**
   * Determina el título del modal según el modo actual.
   * @returns {string} El título para el modal.
   */
  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Crear Nuevo Item";
      case "edit":
        return "Editar Item";
      case "delete":
        return "Confirmar Eliminación";
      default:
        return "";
    }
  };

  // Muestra un spinner de carga a pantalla completa si es la carga inicial.
  if (isLoading && items.length === 0) {
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
          isLoading={isLoading}
        />

        <Divider />

        <CardBody pos="relative">
          {isLoading && <OverlayLoader />}
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <GenericTable
              columns={columns}
              data={items}
              onView={handleViewItem}
              onEdit={(itemNode) => handleOpenModal("edit", itemNode)}
              onDelete={(itemNode) => handleOpenModal("delete", itemNode)}
            />
          )}
        </CardBody>

        {items.length > 0 && (
          <>
            <Divider />
            <Paginacion
              pageInfo={pageInfo}
              currentPage={currentPage}
              onAnterior={handlePrevious}
              onSiguiente={handleNext}
              isLoading={isLoading}
              itemCount={items.length}
              totalCount={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </Card>

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
        isConfirming={isSubmitting}
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

/**
 * `OverlayLoader` es un componente simple que muestra un spinner de carga
 * superpuesto sobre otro contenido. Se utiliza para indicar que una acción
 * en segundo plano (como una recarga de datos) está en progreso.
 */
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

/**
 * `EmptyState` es un componente que se muestra cuando una tabla o lista no
 * tiene datos para mostrar (por ejemplo, después de aplicar filtros que no
 * arrojan resultados).
 */
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
