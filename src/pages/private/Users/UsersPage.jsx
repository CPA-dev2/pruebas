import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, useDisclosure, Heading, Flex, Card, CardBody, CardHeader, Text, Spinner, Center, VStack, Icon, useColorModeValue, Divider,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { CgFileDocument } from "react-icons/cg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, handleError } from "../../../services/NotificationService";
import UserService from "../../../services/UserServices";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import UserForm from "./UserForm";
import Filtros from "../../../components/Componentes_reutilizables/Filtros";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import { usePagination } from "../../../hooks/usePagination"; // 1. Importar hook

/**
 * `UsersPage`
 * Página para la gestión completa (CRUD) de la entidad "Usuarios".
 */
const UsersPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  const queryClient = useQueryClient();

  // --- Estado Local ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const initialFilters = { search: "", isActive: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // --- Hooks de Paginación y Datos ---
  
  // 2. Usar el hook de paginación
  const { currentPage, currentCursor, itemsPerPage, nextPage, prevPage, resetPagination } = usePagination(10);

  /**
   * 3. Funciones de Fetching para React Query
   */
  
  // Query para la lista de roles (para el formulario)
  // Esta query se cachea globalmente
  const { data: rolesData } = useQuery({
    queryKey: ['rolesList'],
    queryFn: async () => {
      const response = await UserService.getRolesList();
      return response.data.data.allRoles.edges.map(edge => edge.node);
    },
    onError: () => handleError("No se pudieron cargar los roles."),
    staleTime: 1000 * 60 * 5, // Cachear roles por 5 minutos
  });
  const roles = rolesData || [];

  // Query para la lista de usuarios
  const fetchUsers = async ({ queryKey }) => {
    const [_key, filters, cursor] = queryKey;
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
    );
    if (cleanedFilters.isActive === "true") cleanedFilters.isActive = true;
    if (cleanedFilters.isActive === "false") cleanedFilters.isActive = false;

    const variables = { ...cleanedFilters, first: itemsPerPage, after: cursor };
    const response = await UserService.getUsers(variables);
    return response.data.data;
  };

  // 4. Hook `useQuery` para usuarios
  const { data, isLoading: isLoadingUsers, isFetching } = useQuery({
    queryKey: ['users', appliedFilters, currentCursor],
    queryFn: fetchUsers,
    keepPreviousData: true,
    onError: (error) => handleError(error),
  });

  // --- Extracción de Datos ---
  const users = data?.allUsers?.edges.map((edge) => edge.node) || [];
  const totalCount = data?.usersTotalCount || 0;
  const pageInfo = data?.allUsers?.pageInfo || {};

  // --- Mutaciones ---
  // 5. Hooks `useMutation`
  
  const handleMutationSuccess = (message) => {
    showSuccess(message);
    resetPagination();
    queryClient.invalidateQueries(['users']);
    handleCloseModal();
  };

  const createUserMutation = useMutation({
    mutationFn: UserService.createUser,
    onSuccess: () => handleMutationSuccess("Usuario creado con éxito."),
    onError: handleError,
  });

  const updateUserMutation = useMutation({
    mutationFn: UserService.updateUser,
    onSuccess: () => handleMutationSuccess("Usuario actualizado con éxito."),
    onError: handleError,
  });

  const deleteUserMutation = useMutation({
    mutationFn: UserService.deleteUser,
    onSuccess: () => handleMutationSuccess("El usuario ha sido eliminado."),
    onError: handleError,
  });

  // --- Handlers de UI ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const applyFilters = () => { setAppliedFilters(filters); resetPagination(); };
  const clearFilters = () => { setFilters(initialFilters); setAppliedFilters(initialFilters); resetPagination(); };

  const handleOpenModal = (mode, user = null) => { setModalMode(mode); setSelectedUser(user); onOpen(); };
  const handleCloseModal = () => { setSelectedUser(null); onClose(); };

  const handleSubmit = (values) => {
    const payload = { ...values };
    if (modalMode === "create") {
      createUserMutation.mutate(payload);
    } else {
      updateUserMutation.mutate({ id: selectedUser.id, ...payload });
    }
  };

  const handleDeleteConfirm = () => deleteUserMutation.mutate(selectedUser.id);
  const handleViewUser = (user) => navigate(`/users/${user.id}`);

  const handleNext = () => pageInfo.hasNextPage && nextPage(pageInfo.endCursor);
  const handlePrevious = () => currentPage > 1 && prevPage();

  const getModalTitle = () => {
    if (modalMode === "create") return "Crear Nuevo Usuario";
    if (modalMode === "edit") return "Editar Usuario";
    return "Confirmar Eliminación";
  };

  // --- Renderizado ---
  const isLoadingInitial = isLoadingUsers && users.length === 0;
  if (isLoadingInitial) {
    return <Center h="calc(100vh - 200px)"><Spinner size="xl" /></Center>;
  }

  const isSubmitting = createUserMutation.isLoading || updateUserMutation.isLoading || deleteUserMutation.isLoading;

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
          isLoading={isFetching}
        />
        <Divider/>

        <CardBody pos="relative">
          {isFetching && <OverlayLoader />}
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
              currentPage={currentPage}
              onAnterior={handlePrevious}
              onSiguiente={handleNext}
              isLoading={isFetching}
              itemCount={users.length}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
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
            initialValues={selectedUser || { username: "", email: "", password: "", rolId: "" }}
            isSubmitting={isSubmitting}
            roles={roles} // Pasa los roles cargados
            isCreateMode={modalMode === "create"}
          />
        ) : (
          <Text>¿Estás seguro de que deseas eliminar al usuario "<b>{selectedUser?.username}</b>"?</Text>
        )}
      </GenericModal>
    </Box>
  );
};

// --- Constantes y Componentes de UI ---

const columns = [
  { Header: "Usuario", accessor: "username" },
  { Header: "Email", accessor: "email" },
  { Header: "Nombre", accessor: "firstName" },
  { Header: "Rol", accessor: "rolDisplay" },
  { Header: "Activo", accessor: "isActive" },
];

const OverlayLoader = () => (
  <Center pos="absolute" top="0" left="0" w="full" h="full" bg="whiteAlpha.700" zIndex="10">
    <Spinner size="xl" color="blue.500" />
  </Center>
);

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