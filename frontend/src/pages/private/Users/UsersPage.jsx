import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, useDisclosure, Heading, Flex, Card, CardBody, CardHeader, Text, Spinner, Center, VStack, Icon, useColorModeValue, Divider,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { CgFileDocument } from "react-icons/cg";
import { showSuccess, handleError } from "../../../services/NotificationService";
import UserService from "../../../services/UserServices";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import UserForm from "./UserForm";
import Filtros from "../../../components/Componentes_reutilizables/Filtros";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";

const ITEMS_PER_PAGE = 10;

/**
 * `UsersPage` es el componente principal para la gestión de usuarios.
 *
 * Responsabilidades:
 * - Listar usuarios del sistema en una tabla paginada y filtrable.
 * - Obtener la lista de roles disponibles para asignarlos a los usuarios.
 * - Gestionar las operaciones CRUD (Crear, Editar, Eliminar) para los usuarios a través de modales.
 * - Navegar a la página de detalle de un usuario.
 */
const UsersPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  
  // Estados para la gestión de datos y UI.
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para los filtros.
  const initialFilters = { search: "", isActive: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  /**
   * Obtiene la lista de usuarios aplicando los filtros y la paginación actuales.
   * @param {object} variables - Opciones de paginación para GraphQL.
   */
  const fetchUsers = useCallback(async (variables) => {
    setIsLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== null)
      );
      if (cleanedFilters.isActive === "true") cleanedFilters.isActive = true;
      if (cleanedFilters.isActive === "false") cleanedFilters.isActive = false;

      const response = await UserService.getUsers({ ...cleanedFilters, ...variables });
      setTotalCount(response.data.data.usersTotalCount || 0);
      const { edges, pageInfo: newPageInfo } = response.data.data.allUsers;
      setUsers(edges.map((edge) => edge.node));
      setPageInfo(newPageInfo);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  /**
   * Obtiene la lista completa de roles para poblar el formulario de usuario.
   */
  const fetchRoles = useCallback(async () => {
    try {
      const response = await UserService.getRolesList();
      const rolesData = response.data.data.allRoles.edges.map(edge => edge.node);
      setRoles(rolesData);
    } catch (error) {
      handleError("No se pudieron cargar los roles.");
    }
  }, []);

  // Efecto para la carga inicial de datos y para recargar cuando cambian los filtros.
  useEffect(() => {
    fetchUsers({ first: ITEMS_PER_PAGE });
    if (roles.length === 0) { // Solo carga los roles una vez.
        fetchRoles();
    }
  }, [appliedFilters, fetchUsers, fetchRoles, roles.length]);
  
  // --- Handlers para filtros y paginación ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const resetPaginationAndFetch = () => {
    setCursorStack([null]);
    setCurrentPage(1);
    fetchUsers({ first: ITEMS_PER_PAGE });
  };
  
  const applyFilters = () => {
    setAppliedFilters(filters);
    resetPaginationAndFetch();
  };
  
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetPaginationAndFetch();
  };

  // --- Handlers para modales y acciones CRUD ---
  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    onOpen();
  };
  
  const handleCloseModal = () => {
    setSelectedUser(null);
    onClose();
  };

  /**
   * Gestiona el envío de los formularios de creación y edición de usuarios.
   * @param {object} values - Datos del formulario.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = { ...values };
      if (modalMode === "create") {
        await UserService.createUser(payload);
      } else {
        await UserService.updateUser({ id: selectedUser.id, ...payload });
      }
      showSuccess(`Usuario ${modalMode === "create" ? "creado" : "actualizado"} con éxito.`);
      resetPaginationAndFetch();
      handleCloseModal();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Confirma y ejecuta la eliminación de un usuario.
   */
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
        await UserService.deleteUser(selectedUser.id);
        showSuccess("El usuario ha sido eliminado.");
        resetPaginationAndFetch();
        handleCloseModal();
    } catch (error) {
        handleError(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleViewUser = (user) => navigate(`/users/${user.id}`);
  
  // --- Handlers de Paginación ---
  const handleNext = () => {
    if (!pageInfo.hasNextPage) return;
    setCursorStack((prev) => [...prev, pageInfo.endCursor]);
    setCurrentPage((prev) => prev + 1);
    fetchUsers({ first: ITEMS_PER_PAGE, after: pageInfo.endCursor });
  };
  
  const handlePrevious = () => {
    if (currentPage === 1) return;
    const prevCursor = cursorStack[currentPage - 2] || null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentPage((prev) => prev - 1);
    fetchUsers({ first: ITEMS_PER_PAGE, after: prevCursor });
  };

  // Configuración de las columnas para la tabla.
  const columns = [
    { Header: "Usuario", accessor: "username" }, { Header: "Email", accessor: "email" },
    { Header: "Nombre", accessor: "firstName" }, { Header: "Rol", accessor: "rolDisplay" },
    { Header: "Activo", accessor: "isActive" },
  ];
  
  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Crear Nuevo Usuario";
      case "edit": return "Editar Usuario";
      case "delete": return "Confirmar Eliminación";
      default: return "";
    }
  };

  if (isLoading && users.length === 0) return <Center h="calc(100vh - 200px)"><Spinner size="xl" /></Center>;

  return (
    <Box>
      <Card borderRadius="xl" boxShadow="lg">
        <CardHeader borderBottomWidth="1px" p={4}>
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
                <Box>
                    <Heading size="lg">Gestión de Usuarios</Heading>
                    <Text color={textColor}>Visualiza, crea, edita y elimina los usuarios del sistema.</Text>
                </Box>
                <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleOpenModal("create")}>Crear Usuario</Button>
            </Flex>
        </CardHeader>

        <Filtros
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          isLoading={isLoading}
        />
        <Divider/>

        <CardBody pos="relative">
          {isLoading && <OverlayLoader />}
          {users.length === 0 ? 
          <EmptyState /> : (
            <GenericTable
              columns={columns} 
              data={users}
              onView={handleViewUser}
              onEdit={(user) => handleOpenModal("edit", user)}
              onDelete={(user) => handleOpenModal("delete", user)}
            />
          )}
        </CardBody>

        {users.length > 0 && (
          <>
            <Divider />
            <Paginacion
              currentPage={currentPage} onAnterior={handlePrevious} onSiguiente={handleNext}
              isLoading={isLoading} itemCount={users.length} totalCount={totalCount} itemsPerPage={ITEMS_PER_PAGE}
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
            : () => document.getElementById("user-form-submit").click()
        }
        confirmButtonText={modalMode === "delete" ? "Eliminar" : "Guardar"}
        isConfirming={isSubmitting}
      >
        {modalMode !== 'delete' ? (
          <UserForm
            onSubmit={handleSubmit}
            initialValues={
              selectedUser || { username: "", email: "", password: "", rolId: "" }
            }
            isSubmitting={isSubmitting}
            roles={roles}
            isCreateMode={modalMode === "create"}
          />
        ) : (
          <Text>¿Estás seguro de que deseas eliminar al usuario "<b>{selectedUser?.username}</b>"?</Text>
        )}
      </GenericModal>
    </Box>
  );
};

/**
 * Muestra un spinner de carga superpuesto.
 */
const OverlayLoader = () => (
  <Center pos="absolute" top="0" left="0" w="full" h="full" bg="whiteAlpha.700" zIndex="10">
    <Spinner size="xl" color="blue.500" />
  </Center>
);

/**
 * Muestra un mensaje cuando no hay datos para mostrar en la tabla.
 */
const EmptyState = () => (
  <Center p={10}>
    <VStack>
      <Icon as={CgFileDocument} boxSize={12} color="gray.400" />
      <Heading size="md" color="gray.600">No se encontraron usuarios</Heading>
      <Text color="gray.500">Intenta ajustar tus filtros o crea un nuevo usuario.</Text>
    </VStack>
  </Center>
);

export default UsersPage;