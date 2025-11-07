import React, { useState, useEffect, useCallback } from "react";
import {
  Box, 
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
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  IconButton
} from "@chakra-ui/react";
import { MdHistory, MdPerson, MdDateRange, MdVisibility } from "react-icons/md";
import { handleError } from "../../../services/NotificationService";
import AuditlogService from "../../../services/AuditlogService";
import Paginacion from "../../../components/Componentes_reutilizables/Paginacion";
import UserSearchSelect from "../../../components/Componentes_reutilizables/UserSearchSelect";

const ITEMS_PER_PAGE = 10;

/**
 * Convierte una fecha en formato datetime-local a formato ISO simple
 * @param {string} datetimeString - Fecha en formato YYYY-MM-DDTHH:mm
 * @returns {string} - Fecha en formato ISO sin conversión de timezone
 */
const convertDateTimeToISO = (datetimeString) => {
  if (!datetimeString) return null;
  
  // Solo agregamos segundos y Z para que sean exactos 
  // ej. 11/11/2023 14:30 -> 11/11/2023 14:30:00.000Z
  return datetimeString + ':00.000Z';
};

/**
 * Decodifica un ID de GraphQL Relay para obtener el ID real de la base de datos
 * @param {string} relayId - ID codificado de Relay (ej: "VXNlcjox")
 * @returns {string} - ID real de la base de datos (ej: "1")
 */
const decodeRelayId = (relayId) => {
  try {
    // Los IDs de Relay están codificados en base64 en formato "ModelName:id"
    const decoded = atob(relayId);
    const parts = decoded.split(':');
    return parts[parts.length - 1]; // Retorna la última parte que es el ID
  } catch (error) {
   
    return relayId; // Si falla, retorna el ID original
  }
};

/**
 * `AuditlogsPage` es el componente principal para la visualización de registros de auditoría.
 *
 * Responsabilidades:
 * - Listar registros de auditoría del sistema en una tabla paginada y filtrable.
 * - Aplicar filtros por usuario, acción y rango de fechas.
 * - Mostrar información detallada de cada registro de auditoría.
 * - Solo lectura: no permite operaciones de creación, edición o eliminación.
 */
const AuditlogsPage = () => {
  const textColor = useColorModeValue("gray.500", "gray.400");
  const bgColor = useColorModeValue("white", "gray.800");
  
  // Estados para la gestión de datos y UI.
  const [auditlogs, setAuditlogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [cursorStack, setCursorStack] = useState([null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para el modal de detalles
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  
  // Estados para los filtros.
  const initialFilters = { 
    usuario: null, 
    accion: "", 
    descripcion: "",
    createdAfter: "", 
    createdBefore: "" 
  };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  /**
   * Obtiene la lista de registros de auditoría aplicando los filtros y la paginación actuales.
   * @param {object} variables - Opciones de paginación para GraphQL.
   */
  const fetchAuditlogs = useCallback(async (variables) => {
    setIsLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== null)
      );

      // Si hay un usuario seleccionado, usar su ID decodificado
      if (cleanedFilters.usuario && typeof cleanedFilters.usuario === 'object') {
        const relayId = cleanedFilters.usuario.id;
        const realId = decodeRelayId(relayId);
        
        cleanedFilters.usuario = realId;
      }

      // Agregar segundos y Z antes de enviar
      // solo se agrega ":00.000Z" para cumplir con el formato ISO
      // frontend envia "YYYY-MM-DDTHH:mm" despues se convierte a "YYYY-MM-DDTHH:mm:00.000Z"
      if (cleanedFilters.createdAfter) {
        cleanedFilters.createdAfter = convertDateTimeToISO(cleanedFilters.createdAfter);
      }
      if (cleanedFilters.createdBefore) {
        cleanedFilters.createdBefore = convertDateTimeToISO(cleanedFilters.createdBefore);
      }

      // Obtener la lista de auditlogs y total count en una sola query
      const response = await AuditlogService.getAuditlogs({
        first: ITEMS_PER_PAGE,
        ...variables,
        ...cleanedFilters,
      });

      // Extraer totalCount de la misma respuesta
      setTotalCount(response.data.data.auditlogsTotalCount || 0);

      if (response.data?.data?.allAuditlogs) {
        const { edges, pageInfo } = response.data.data.allAuditlogs;
        setAuditlogs(edges.map(edge => edge.node));
        setPageInfo(pageInfo);
      }
    } catch (error) {
      handleError(error, "Error al obtener registros de auditoría");
      setAuditlogs([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  /**
   * Carga inicial de datos y cuando cambian los filtros aplicados.
   */
  useEffect(() => {
    fetchAuditlogs({ first: ITEMS_PER_PAGE });
  }, [fetchAuditlogs]);

  /**
   * Maneja el cambio en los campos de filtro.
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Reinicia la paginación a la primera página.
   */
  const resetPagination = () => {
    setCursorStack([null]);
    setCurrentPage(1);
    // fetchAuditlogs se ejecutará automáticamente por el useEffect
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    // Resetear paginación
    setCursorStack([null]);
    setCurrentPage(1);
    // Limpiar auditlogs temporalmente para forzar re-render
    setAuditlogs([]);
    // fetchAuditlogs se ejecutará automáticamente por el useEffect cuando appliedFilters cambie
  };

  /**
   * Limpia todos los filtros.
   */
  const clearFilters = () => {
    const clearedFilters = initialFilters;
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    resetPagination();
  };

  /**
   * Navega a la página siguiente.
   */
  const handleNextPage = () => {
    if (!pageInfo.hasNextPage) return;
    setCursorStack(prev => [...prev, pageInfo.endCursor]);
    setCurrentPage(prev => prev + 1);
    fetchAuditlogs({ first: ITEMS_PER_PAGE, after: pageInfo.endCursor });
  };

  /**
   * Navega a la página anterior.
   */
  const handlePrevPage = () => {
    if (currentPage === 1) return;
    const prevCursor = cursorStack[cursorStack.length - 2] || null;
    setCursorStack(prev => prev.slice(0, -1));
    setCurrentPage(prev => prev - 1);
    fetchAuditlogs({ first: ITEMS_PER_PAGE, after: prevCursor });
  };

  /**
   * Formatea la fecha para mostrar en formato legible.
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Formatea la descripción de auditoría para mostrar cambios de manera visual.
   */
  const formatAuditDescription = (descripcion) => {
    if (!descripcion) return null;
    
    const lines = descripcion.split('\n');
    const baseDescription = lines[0];
    const changes = lines.slice(1);
    
    return (
      <VStack align="start" spacing={1}>
        <Text fontSize="sm" fontWeight="medium">
          {baseDescription}
        </Text>
        {changes.length > 0 && (
          <VStack align="start" spacing={0.5} pl={2}>
            {changes.map((change, index) => {
              if (change.includes('→')) {
                const [field, values] = change.split(':');
                const [oldVal, newVal] = values.split('→').map(v => v.trim());
                return (
                  <HStack key={index} spacing={1} fontSize="xs">
                    <Text fontWeight="medium" color="gray.600">{field.trim()}:</Text>
                    <Text color="red.500">{oldVal}</Text>
                    <Text color="gray.400">→</Text>
                    <Text color="green.500">{newVal}</Text>
                  </HStack>
                );
              }
              return (
                <Text key={index} fontSize="xs" color="gray.500">
                  {change}
                </Text>
              );
            })}
          </VStack>
        )}
      </VStack>
    );
  };


  /**
   * Abre el modal de detalles con la información del registro de auditoría seleccionado
   */
  const handleOpenDetails = (auditLog) => {
    setSelectedAuditLog(auditLog);
    onOpen();
  };

  /**
   * Obtiene el color del badge según el tipo de acción.
   * 
   * Esta función asigna colores específicos a las acciones más comunes:
   * - "Creación" -> verde
   * - "Actualización" -> azul
   * - "Borrado" -> rojo
   *  # Registrar la acción en el log de auditoría en api/graphql/mutations/items.py
            log_action(
                usuario=info.context.user,
                accion="Actualización de Item", <----- Actualización, color azul!
                descripcion=f"Item '{item.nombre}' (ID {item.id}) actualizado." 
            )
   * 
   * Para cualquier otra acción, se asigna el color gris por defecto.
   */
  const getActionBadgeColor = (action) => {
    const keyWord = action.split(' ')[0]
    
    const colorMap = new Map([
        ['Creación', 'green'],
        ['Actualización', 'blue'],
        ['Borrado', 'red'],
    ])

    return colorMap.get(keyWord) || 'gray';
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg={bgColor} shadow="sm">
          <CardHeader>
            <Flex align="center" justify="space-between">
              <HStack spacing={3}>
                <Icon as={MdHistory} boxSize={8} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Heading size="lg">Auditoría del Sistema</Heading>
                  <Text color={textColor} fontSize="sm">
                    Registro de todas las acciones realizadas en el sistema
                  </Text>
                </VStack>
              </HStack>
              <Badge colorScheme="blue" variant="outline" px={3} py={1}>
                Solo Lectura
              </Badge>
            </Flex>
          </CardHeader>
        </Card>

        {/* Filtros */}
        <Card bg={bgColor} shadow="sm">
          <CardHeader>
            <Heading size="md">Filtros de Búsqueda</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>

              <FormControl>
                <UserSearchSelect
                  value={filters.usuario}
                  onChange={(user) => handleFilterChange('usuario', user)}
                  placeholder="Buscar usuario..."
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Acción</FormLabel>
                <Select
                  placeholder="Seleccionar tipo de acción..."
                  value={filters.accion}
                  onChange={(e) => handleFilterChange('accion', e.target.value)}
                  size="sm"
                >
                  <option value="Creación">Creación</option>
                  <option value="Actualización">Actualización</option>
                  <option value="Borrado">Borrado</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Descripción</FormLabel>
                <Input
                  placeholder="Buscar en descripción..."
                  value={filters.descripcion}
                  onChange={(e) => handleFilterChange('descripcion', e.target.value)}
                  size="sm"
                />
              </FormControl>

            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
              <FormControl>
                <FormLabel fontSize="sm">Fecha y Hora Desde</FormLabel>
                <Input
                  type="datetime-local"
                  value={filters.createdAfter}
                  onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Fecha y Hora Hasta</FormLabel>
                <Input
                  type="datetime-local"
                  value={filters.createdBefore}
                  onChange={(e) => handleFilterChange('createdBefore', e.target.value)}
                  size="sm"
                />
              </FormControl>
            </SimpleGrid>

            <Divider my={4} />

            <HStack spacing={3}>
              <Button
                colorScheme="blue"
                size="sm"
                onClick={applyFilters}
                leftIcon={<Icon as={MdDateRange} />}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabla de Registros */}
        <Card bg={bgColor} shadow="sm">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">Registros de Auditoría</Heading>
              <Text color={textColor} fontSize="sm">
                {totalCount} registros encontrados
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Center h="200px">
                <VStack spacing={4}>
                  <Spinner size="lg" color="blue.500" />
                  <Text color={textColor}>Cargando registros...</Text>
                </VStack>
              </Center>
            ) : auditlogs.length === 0 ? (
              <Center h="200px">
                <VStack spacing={4}>
                  <Icon as={MdHistory} boxSize={12} color="gray.300" />
                  <Text color={textColor}>No se encontraron registros de auditoría</Text>
                  <Text color={textColor} fontSize="sm">
                    Intenta ajustar los filtros de búsqueda
                  </Text>
                </VStack>
              </Center>
            ) : (
              <TableContainer key={`auditlogs-${auditlogs.length}-${totalCount}`}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>
                        <HStack spacing={2}>
                          <Icon as={MdPerson} />
                          <Text>Usuario</Text>
                        </HStack>
                      </Th>
                      <Th>Acción</Th>
                      <Th>Descripción</Th>
                      <Th>
                        <HStack spacing={2}>
                          <Icon as={MdDateRange} />
                          <Text>Fecha y Hora</Text>
                        </HStack>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {auditlogs.map((log) => (
                      <Tr key={log.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">
                              {log.usuario?.firstName} {log.usuario?.lastName}
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                              @{log.usuario?.username} • {log.usuario?.email}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getActionBadgeColor(log.accion)}
                            variant="subtle"
                          >
                            {log.accion}
                          </Badge>
                        </Td>
                        <Td maxW="400px">
                          <VStack align="start" spacing={2}>
                           
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="blue"
                              leftIcon={<Icon as={MdVisibility} />}
                              onClick={() => handleOpenDetails(log)}
                            >
                              Ver detalles
                            </Button>
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {formatDate(log.created)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            {/* Paginación */}
            {auditlogs.length > 0 && (
              <>
                <Divider my={4} />
                <Paginacion
                  pageInfo={pageInfo}
                  currentPage={currentPage}
                  onAnterior={handlePrevPage}
                  onSiguiente={handleNextPage}
                  isLoading={isLoading}
                  itemCount={auditlogs.length}
                  totalCount={totalCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de Detalles */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={MdHistory} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Text>Detalles de Auditoría</Text>
                <Text fontSize="sm" fontWeight="normal" color={textColor}>
                  Información completa del registro
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} maxH="70vh" overflowY="auto">
            {selectedAuditLog && (
              <VStack spacing={4} align="stretch">
                {/* Acción */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                    Acción Realizada
                  </Text>
                  <Badge
                    colorScheme={getActionBadgeColor(selectedAuditLog.accion)}
                    variant="subtle"
                    fontSize="sm"
                    px={3}
                    py={1}
                  >
                    {selectedAuditLog.accion}
                  </Badge>
                </Box>

                <Divider />

                {/* Descripción Detallada */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" color={textColor} mb={2} mp={2}>
                    Descripción Detallada
                  </Text>
                  <Box 
                    p={2}
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    borderRadius="md"
                    borderWidth={1}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    maxH="200px"
                    overflowY="auto"
                    overflowX="auto"
                    whiteSpace="pre"
                    w="100%"
                  >
                    <Box pr={8}>
                      {formatAuditDescription(selectedAuditLog.descripcion)}
                    </Box>
                  </Box>
                </Box>

                <Divider />

                {/* Fecha y Hora */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                    Fecha y Hora
                  </Text>
                  <HStack spacing={2}>
                    <Icon as={MdDateRange} color="gray.400" />
                    <Text fontSize="sm">
                      {formatDate(selectedAuditLog.created)}
                    </Text>
                  </HStack>
                </Box>

                
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} colorScheme="blue" variant="outline">
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AuditlogsPage;
