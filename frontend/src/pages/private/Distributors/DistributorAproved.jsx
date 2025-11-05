import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, useDisclosure, Heading, Flex, Card, CardBody, CardHeader, 
  Text, Spinner, Center, VStack, Icon, useColorModeValue, Divider, Badge, IconButton, Tooltip
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { CgFileDocument } from "react-icons/cg";
import { MdAssignmentInd,MdCheckBox } from "react-icons/md";
import { showSuccess, handleError } from "../../../services/NotificationService";
import DistributorService from "../../../services/DistributorService";
import GenericTable from "../../../components/Componentes_reutilizables/GenericTable";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
import DistributorForm from "./DistributorEditPage";
import DistributorFilters from "./DistributorFilters";
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
const DistributorAproved = ({ assignmentCount }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("gray.500", "gray.400");
  
  // Estados para la gestión de datos y UI.
  const [distributors, setDistributors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

      const response = await DistributorService.getDistributorAproved({ ...cleanedFilters, ...variables });
      console.log('**Distribuidores obtenidos:', response.data.data);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!response.data.data.myAssignedDistributorsApproved) {
        throw new Error('No se recibieron distribuidores asignados');
      }

      const { edges, pageInfo: newPageInfo } = response.data.data.myAssignedDistributorsApproved;
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
  
  const resetPaginationAndFetch = () => {
    setCursorStack([null]);
    setCurrentPage(1);
    fetchDistributors({ first: ITEMS_PER_PAGE });
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
  const handleOpenModal = (mode, distributor = null) => {
    setModalMode(mode);
    setSelectedDistributor(distributor);
    onOpen();
  };
  
  const handleCloseModal = () => {
    setSelectedDistributor(null);
    onClose();
  };

  /**
   * Gestiona el envío de los formularios de creación y edición de distribuidores.
   * @param {object} values - Datos del formulario.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await DistributorService.createDistributor(values);
      } else {
        await DistributorService.updateDistributor(selectedDistributor.id, values);
      }
      showSuccess(`Distribuidor ${modalMode === "create" ? "creado" : "actualizado"} con éxito.`);
      resetPaginationAndFetch();
      handleCloseModal();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Confirma y ejecuta la eliminación de un distribuidor.
   */
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await DistributorService.deleteDistributor(selectedDistributor.id);
      showSuccess("El distribuidor ha sido eliminado.");
      resetPaginationAndFetch();
      handleCloseModal();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Cambia el estado de un distribuidor (aprobar, rechazar, etc.)
   */
  const handleStatusChange = async (distributor, newStatus) => {
    try {
      await DistributorService.updateDistributorStatus(distributor.id, newStatus);
      showSuccess(`Estado del distribuidor actualizado a: ${newStatus}`);
      resetPaginationAndFetch();
    } catch (error) {
      handleError(error);
    }
  };

  // --- Handlers de navegación (detalles, validaciones y edición)---
  const handleViewDistributor = (distributor) => navigate(`/distributors/${distributor.id}`);
  const handleEditDistributor = (distributor) => navigate(`/distributors/edit/${distributor.id}`);
  
  const handleValidateDistributor = (distributor) => navigate(`/distributors/validate/${distributor.id}`);
  
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
    { Header: "Negocio", accessor: "negocioNombre" },
    { Header: "NIT", accessor: "nit" },
    { 
      Header: "Contacto", 
      accessor: "nombres",
      Cell: ({ row }) => `${row.original.nombres} ${row.original.apellidos}`
    },
    { Header: "Email", accessor: "correo" },
    { Header: "Departamento", accessor: "departamento" },
    { Header: "Tipo", accessor: "tipoPersona" },
    { 
      Header: "Estado", 
      accessor: "estado",
      Cell: ({ value }) => (
        <Badge 
          colorScheme={getStatusColor(value)}
          variant="subtle"
        >
          {value}
        </Badge>
      )
    },
  ];

  // Función auxiliar para colores de estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'green';
      case 'pendiente': return 'yellow';
      case 'rechazado': return 'red';
      case 'validado': return 'orange';
      default: return 'gray';
    }
  };
  
  // -- uso del modal solo para confirmar eliminación
  const getModalTitle = () => {
    return "Confirmar Eliminación";
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
              <Heading size="lg">Distribuidores Aprobados</Heading>
              <Text color={textColor}>Listado de distribuidores con estado aprobado.</Text>
            </Box>
            
          </Flex>
        </CardHeader>

        <DistributorFilters
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
              onView={handleViewDistributor}
              renderActions={(distributor) => (
                <>
                <Grid>
                  <Tooltip label="Validar distribuidor" placement="top">
                  <IconButton
                    size="sm"
                    margin={2}
                    colorScheme="green"
                    icon={<MdCheckBox />}
                    onClick={() => handleValidateDistributor(distributor)}
                    aria-label="Validar distribuidor"
                  />
                </Tooltip>

                </Grid>
                </>
              )}
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

      <GenericModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={getModalTitle()}
        onConfirm={
          modalMode === "delete"
            ? handleDeleteConfirm
            : () => document.getElementById("distributor-form-submit").click()
        }
        confirmButtonText={modalMode === "delete" ? "Eliminar" : "Guardar"}
        isConfirming={isSubmitting}
        size={modalMode !== "delete" ? "xl" : "md"}
      >
        {modalMode !== 'delete' ? (
          <DistributorForm
            onSubmit={handleSubmit}
            initialValues={
              selectedDistributor || {
                nombres: "",
                apellidos: "",
                dpi: "",
                correo: "",
                telefono: "",
                departamento: "",
                municipio: "",
                direccion: "",
                negocioNombre: "",
                nit: "",
                telefonoNegocio: "",
                tipoPersona: "natural",
                antiguedad: "",
                productosDistribuidos: "",
                cuentaBancaria: "",
                numeroCuenta: "",
                tipoCuenta: "ahorro",
                banco: ""
              }
            }
            isSubmitting={isSubmitting}
          />
        ) : (
          <Text>
            ¿Estás seguro de que deseas eliminar al distribuidor "<b>{selectedDistributor?.negocioNombre}</b>"?
            <br />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Esta acción no se puede deshacer.
            </Text>
          </Text>
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

export default DistributorAproved;