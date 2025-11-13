import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, useDisclosure, Heading, Flex, Card, CardBody, CardHeader, Text, Spinner, Center, Divider, VStack, Icon, useColorModeValue
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { CgFileDocument } from "react-icons/cg";
import { showSuccess, handleError } from "../../../services/NotificationService";
import RoleService from "../../../services/RoleService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import RoleForm from "./RoleForm";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import Filtros from "../../../components/Componentes_reutilizables/Filtros";

const ITEMS_PER_PAGE = 10;

/**
 * `RolesPage` es el componente principal para la gestión de roles.
 *
 * Se encarga de:
 * - Listar los roles existentes en una tabla paginada y filtrable.
 * - Permitir la creación de nuevos roles a través de un modal.
 * - Permitir la eliminación de roles existentes.
 * - Navegar a la página de detalle/edición de un rol.
 */
const RolesPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  
  // Estado para la lista de roles y su paginación.
  const [roles, setRoles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]);
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para el modal de creación/eliminación.
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Estado para los indicadores de carga.
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para los filtros.
  const initialFilters = { search: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  /**
   * Obtiene los roles desde el servicio, aplicando filtros y paginación.
   * @param {object} variables - Opciones de paginación para GraphQL (first, after).
   */
  const fetchRoles = useCallback(async (variables) => {
    setIsLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== null)
      );
      const response = await RoleService.getRoles({ ...cleanedFilters, ...variables });
      setTotalCount(response.data.data.rolesTotalCount || 0);
      const { edges, pageInfo: newPageInfo } = response.data.data.allRoles;
      setRoles(edges.map((edge) => edge.node));
      setPageInfo(newPageInfo);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  // Carga inicial de datos.
  useEffect(() => { fetchRoles({ first: ITEMS_PER_PAGE }); }, [fetchRoles]);

  // --- Handlers para filtros y paginación ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const applyFilters = () => {
    setAppliedFilters(filters);
    resetPaginationAndFetch();
  };
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetPaginationAndFetch();
  };
  const resetPaginationAndFetch = () => {
    setCursorStack([null]);
    setCurrentPage(1);
    fetchRoles({ first: ITEMS_PER_PAGE });
  };

  // --- Handlers para el modal ---
  const handleOpenModal = (mode, role = null) => { setModalMode(mode); setSelectedRole(role); onOpen(); };
  const handleCloseModal = () => { setSelectedRole(null); onClose(); };

  /**
   * Gestiona el envío del formulario de creación de rol.
   * La edición se maneja en una página separada (`RoleEditPage`).
   */
  const handleSubmit = async (values) => {
    if (modalMode !== 'create') return;
    setIsSubmitting(true);
    try {
      await RoleService.createRole({ nombre: values.nombre, isActive: values.isActive });
      showSuccess(`Rol "${values.nombre}" creado con éxito.`);
      resetPaginationAndFetch();
      handleCloseModal();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Confirma y ejecuta la eliminación de un rol.
   */
  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      await RoleService.deleteRole(selectedRole.id);
      showSuccess("El rol ha sido eliminado.");
      resetPaginationAndFetch();
      handleCloseModal();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers de navegación ---
  const handleNext = () => {
    if (!pageInfo.hasNextPage) return;
    setCursorStack(prev => [...prev, pageInfo.endCursor]);
    setCurrentPage(prev => prev + 1);
    fetchRoles({ first: ITEMS_PER_PAGE, after: pageInfo.endCursor });
  };
  const handlePrevious = () => {
    if (currentPage === 1) return;
    const prevCursor = cursorStack[cursorStack.length - 2] || null;
    setCursorStack(prev => prev.slice(0, -1));
    setCurrentPage(prev => prev - 1);
    fetchRoles({ first: ITEMS_PER_PAGE, after: prevCursor });
  };
  const handleViewRole = (role) => navigate(`/roles/${role.id}`);
  const handleEditRole = (role) => navigate(`/roles/edit/${role.id}`);

  // Configuración de las columnas para la tabla genérica.
  const columns = [
    { Header: "Nombre", accessor: "nombre" },
    { Header: "Activo", accessor: "isActive" },
    { Header: "Permisos Activos", accessor: "permissionCount" },
    { Header: "Usuarios Asignados", accessor: "userCount" },
  ];
  
  const getModalTitle = () => {
    return modalMode === 'create' ? "Crear Nuevo Rol" : "Confirmar Eliminación";
  };

  if (isLoading && roles.length === 0) return <Center h="calc(100vh - 200px)"><Spinner size="xl" /></Center>;

  return (
    <Box>
      <Card borderRadius="xl" boxShadow="lg">
        <CardHeader borderBottomWidth="1px" p={4}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
            <Box>
              <Heading size="lg">Gestión de Roles</Heading>
              <Text color={textColor}>Define los roles y permisos de los usuarios.</Text>
            </Box>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleOpenModal("create")}>
              Crear Rol
            </Button>
          </Flex>
        </CardHeader>
        
        <Filtros filters={filters} onFilterChange={handleFilterChange} onApplyFilters={applyFilters} onClearFilters={clearFilters} isLoading={isLoading} />
        <Divider/>

        <CardBody pos="relative">
          {isLoading && <OverlayLoader />}
          {roles.length === 0 ? <EmptyState /> : (
            <GenericTable
              columns={columns}
              data={roles}
              onView={handleViewRole}
              onEdit={handleEditRole}
              onDelete={(role) => handleOpenModal("delete", role)}
            />
          )}
        </CardBody>
        {roles.length > 0 && (
          <>
            <Divider />
            <Paginacion currentPage={currentPage} onAnterior={handlePrevious} onSiguiente={handleNext} isLoading={isLoading} itemCount={roles.length} totalCount={totalCount} itemsPerPage={ITEMS_PER_PAGE} />
          </>
        )}
      </Card>

      <GenericModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={getModalTitle()}
        onConfirm={modalMode === 'delete' ? handleDeleteConfirm : () => document.getElementById("role-form-submit").click()}
        confirmButtonText={modalMode === 'delete' ? "Eliminar" : "Guardar"}
        isConfirming={isSubmitting}
      >
        {modalMode === 'create' ? (
          <RoleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} isCreateMode={true} />
        ) : (
          <Text>¿Estás seguro de que deseas eliminar el rol "<b>{selectedRole?.nombre}</b>"?</Text>
        )}
      </GenericModal>
    </Box>
  );
};

/**
 * Muestra un spinner de carga superpuesto.
 */
const OverlayLoader = () => ( <Center pos="absolute" top="0" left="0" w="full" h="full" bg="whiteAlpha.700" zIndex="10"><Spinner size="xl" color="blue.500" /></Center> );

/**
 * Muestra un mensaje cuando no hay datos para mostrar en la tabla.
 */
const EmptyState = () => ( <Center p={10}><VStack><Icon as={CgFileDocument} boxSize={12} color="gray.400" /><Heading size="md" color="gray.600">No se encontraron roles</Heading><Text color="gray.500">Intenta ajustar tus filtros o crea un nuevo rol.</Text></VStack></Center> );

export default RolesPage;