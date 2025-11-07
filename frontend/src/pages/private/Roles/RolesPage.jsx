import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, useDisclosure, Heading, Flex, Card, CardBody, CardHeader, Text, Spinner, Center, Divider, VStack, Icon, useColorModeValue
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { CgFileDocument } from "react-icons/cg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, handleError } from "../../../services/NotificationService";
import RoleService from "../../../services/RoleService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import RoleForm from "./RoleForm";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import Filtros from "../../../components/Componentes_reutilizables/Filtros";
import { usePagination } from "../../../hooks/usePagination"; // 1. Importar hook

/**
 * `RolesPage`
 * Página para la gestión (CRUD) de la entidad "Roles".
 */
const RolesPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  const queryClient = useQueryClient();

  // --- Estado Local ---
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const initialFilters = { search: "" }; // Filtros para roles es más simple
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // --- Hooks de Paginación y Datos ---
  
  // 2. Usar el hook de paginación
  const { currentPage, currentCursor, itemsPerPage, nextPage, prevPage, resetPagination } = usePagination(10);

  /**
   * 3. Función de Fetching para React Query
   */
  const fetchRoles = async ({ queryKey }) => {
    // queryKey es ['roles', appliedFilters, currentCursor]
    const [_key, filters, cursor] = queryKey;
    
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
    );
    const variables = { ...cleanedFilters, first: itemsPerPage, after: cursor };
    const response = await RoleService.getRoles(variables);
    return response.data.data; // Devuelve { allRoles, rolesTotalCount }
  };

  // 4. Hook `useQuery`
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['roles', appliedFilters, currentCursor],
    queryFn: fetchRoles,
    keepPreviousData: true,
    onError: (error) => handleError(error),
  });

  // --- Extracción de Datos ---
  const roles = data?.allRoles?.edges.map((edge) => edge.node) || [];
  const totalCount = data?.rolesTotalCount || 0;
  const pageInfo = data?.allRoles?.pageInfo || {};

  // --- Mutaciones ---
  // 5. Hooks `useMutation`

  const handleMutationSuccess = (message) => {
    showSuccess(message);
    resetPagination();
    queryClient.invalidateQueries(['roles']); // Invalida caché de roles
    handleCloseModal();
  };

  const createRoleMutation = useMutation({
    // Solo pasamos los valores que espera el formulario de creación
    mutationFn: (values) => RoleService.createRole({ 
      nombre: values.nombre, 
      isActive: values.isActive 
    }),
    onSuccess: (data, variables) => handleMutationSuccess(`Rol "${variables.nombre}" creado con éxito.`),
    onError: handleError,
  });

  const deleteRoleMutation = useMutation({
    mutationFn: RoleService.deleteRole,
    onSuccess: () => handleMutationSuccess("El rol ha sido eliminado."),
    onError: handleError,
  });

  // --- Handlers de UI ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const applyFilters = () => {
    setAppliedFilters(filters);
    resetPagination();
  };
  
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetPagination();
  };

  const handleOpenModal = (mode, role = null) => {
    setModalMode(mode);
    setSelectedRole(role);
    onOpen();
  };
  
  const handleCloseModal = () => {
    setSelectedRole(null);
    onClose();
  };

  // Dispara la mutación de creación
  const handleSubmit = (values) => {
    createRoleMutation.mutate(values);
  };
  
  // Dispara la mutación de borrado
  const handleDeleteConfirm = () => {
    if (selectedRole) {
      deleteRoleMutation.mutate(selectedRole.id);
    }
  };

  // Handlers de Navegación
  const handleViewRole = (role) => navigate(`/roles/${role.id}`); // Va a la pág de detalle
  const handleEditRole = (role) => navigate(`/roles/edit/${role.id}`); // Va a la pág de edición

  const handleNext = () => pageInfo.hasNextPage && nextPage(pageInfo.endCursor);
  const handlePrevious = () => currentPage > 1 && prevPage();

  const getModalTitle = () => {
    return modalMode === 'create' ? "Crear Nuevo Rol" : "Confirmar Eliminación";
  };
  
  // --- Renderizado ---
  if (isLoading && roles.length === 0) {
    return <Center h="calc(100vh - 200px)"><Spinner size="xl" /></Center>;
  }

  const isSubmitting = createRoleMutation.isLoading || deleteRoleMutation.isLoading;

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
        
        {/* Usamos el componente Filtros genérico, pero solo se usará el 'search' */}
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
            <Paginacion 
              currentPage={currentPage} 
              onAnterior={handlePrevious} 
              onSiguiente={handleNext} 
              isLoading={isFetching} 
              itemCount={roles.length} 
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
        onConfirm={modalMode === 'delete' ? handleDeleteConfirm : () => document.getElementById("role-form-submit").click()}
        confirmButtonText={modalMode === 'delete' ? "Eliminar" : "Guardar"}
        isConfirming={isSubmitting}
      >
        {modalMode === 'create' ? (
          // El formulario de creación de rol solo necesita los campos básicos
          <RoleForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            isCreateMode={true} 
            initialValues={{ nombre: "", isActive: true }} // Valores iniciales para creación
          />
        ) : (
          <Text>¿Estás seguro de que deseas eliminar el rol "<b>{selectedRole?.nombre}</b>"?</Text>
        )}
      </GenericModal>
    </Box>
  );
};

// --- Constantes y Componentes de UI ---

const columns = [
  { Header: "Nombre", accessor: "nombre" },
  { Header: "Activo", accessor: "isActive" },
  { Header: "Permisos Activos", accessor: "permissionCount" },
  { Header: "Usuarios Asignados", accessor: "userCount" },
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
      <Heading size="md" color="gray.600">No se encontraron roles</Heading>
      <Text color="gray.500">Intenta ajustar tus filtros o crea un nuevo rol.</Text>
    </VStack>
  </Center> 
);

export default RolesPage;