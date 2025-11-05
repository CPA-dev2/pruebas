import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Card, CardBody, CardHeader, Heading, Text, Grid, GridItem,
  Badge, Button, Flex, VStack, HStack, Divider, Spinner, Center,
  Icon, useColorModeValue, Stat, StatLabel, StatNumber,
  StatHelpText, useDisclosure, Alert, AlertIcon
} from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon} from "@chakra-ui/icons";
import { FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaFileAlt } from "react-icons/fa";
import { showSuccess, handleError } from "../../../services/NotificationService";
import DistributorService from "../../../services/DistributorService";
import GenericModal from "../../../components/Componentes_reutilizables/GenericModal";
const api_url = import.meta.env.VITE_BACKEND_URL_FILES;

/**
 * `DistributorDetailPage` muestra toda la información detallada de un distribuidor específico.
 */
const DistributorDetailPage = () => {
  const { distributorId } = useParams();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");
  
  const [distributor, setDistributor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusAction, setStatusAction] = useState(null);

  
  useEffect(() => {
    fetchDistributor();
  }, [distributorId]);

  const fetchDistributor = async () => {
    setIsLoading(true);
    try {
      const response = await DistributorService.getDistributorById(distributorId);
      setDistributor(response.data.data.distributor);
    } catch (error) {
      handleError("Error al cargar la información del distribuidor");
      navigate("/distributors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    setIsUpdatingStatus(true);
    try {
      await DistributorService.updateDistributor(distributorId, {estado: statusAction});
      showSuccess(`Estado actualizado a: ${statusAction}`);
      fetchDistributor();
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openStatusModal = (action) => {
    setStatusAction(action);
    onOpen();
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'green';
      case 'pendiente': return 'yellow';
      case 'rechazado': return 'red';
      case 'validado': return 'blue';
      default: return 'gray';
    }
  };


  if (isLoading) {
    return (
      <Center h="calc(100vh - 200px)">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!distributor) {
    return (
      <Alert status="error">
        <AlertIcon />
        No se pudo cargar la información del distribuidor.
      </Alert>
    );
  }

  return (
    <Box maxW="7xl" mx="auto" p={4}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate("/distributors")}
          >
            Volver
          </Button>
          <Divider orientation="vertical" h="20px" />
          <Heading size="lg">{distributor.negocioNombre}</Heading>
          <Badge 
            colorScheme={getStatusColor(distributor.estado)}
            size="lg"
            variant="subtle"
          >
            {distributor.estado}
          </Badge>
        </HStack>
        
        <HStack>
          <Button
            leftIcon={<EditIcon />}
            colorScheme="orange"
            onClick={() => navigate(`/distributors/edit/${distributorId}`)}
          >
            Editar
          </Button>
          
          {distributor.estado === 'validado' && (
            <>
            {
              /* Botones para aprobar o rechazar */
              distributor.estado === 'aprobado' || distributor.estado === 'rechazado'?
              null
              :
              <>
               <Button
                colorScheme="green"
                onClick={() => openStatusModal('aprobado')}
              >
                Aprobar
              </Button>
              <Button
                colorScheme="red"
                onClick={() => openStatusModal('rechazado')}
              >
                Rechazar
              </Button>
              </>
            }
             
            </>
          )}
          
          {distributor.estado === 'aprobado' && (
            <Button
              colorScheme="orange"
              onClick={() => openStatusModal('suspendido')}
            >
              Suspender
            </Button>
          )}
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Información Principal */}
        <VStack spacing={6} align="stretch">
          
          {/* Información Personal */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md" color="orange.600">
                <Icon as={FaIdCard} mr={2} />
                Información Personal
              </Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <InfoItem label="Nombres" value={distributor.nombres} />
                <InfoItem label="Apellidos" value={distributor.apellidos} />
                <InfoItem label="DPI" value={distributor.dpi} />
                <InfoItem label="Tipo de Persona" value={distributor.tipoPersona} />
                <InfoItem label="Email" value={distributor.correo} icon={FaEnvelope} />
                <InfoItem label="Teléfono" value={distributor.telefono} icon={FaPhone} />
              </Grid>
            </CardBody>
          </Card>

          {/* Información del Negocio */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md" color="orange.600">
                <Icon as={FaBuilding} mr={2} />
                Información del Negocio
              </Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <InfoItem label="Nombre del Negocio" value={distributor.negocioNombre} />
                <InfoItem label="NIT" value={distributor.nit} />
                <InfoItem label="Teléfono Negocio" value={distributor.telefonoNegocio} icon={FaPhone} />
                <InfoItem label="Antigüedad" value={`${distributor.antiguedad} año(s)`} />
                <GridItem colSpan={2}>
                  <InfoItem 
                    label="Productos Distribuidos" 
                    value={distributor.productosDistribuidos} 
                    isTextArea 
                  />
                </GridItem>
                {distributor.equipamiento && (
                  <GridItem colSpan={2}>
                    <InfoItem 
                      label="Equipamiento" 
                      value={distributor.equipamiento} 
                      isTextArea 
                    />
                  </GridItem>
                )}
              </Grid>
            </CardBody>
          </Card>

          {/* Ubicación */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md" color="orange.600">
                <Icon as={FaMapMarkerAlt} mr={2} />
                Ubicación
              </Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <InfoItem label="Departamento" value={distributor.departamento} />
                <InfoItem label="Municipio" value={distributor.municipio} />
                <GridItem colSpan={2}>
                  <InfoItem label="Dirección" value={distributor.direccion} isTextArea />
                </GridItem>
              </Grid>
            </CardBody>
          </Card>

          {/* Información Bancaria */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md" color="orange.600">
                Información Bancaria
              </Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <InfoItem label="Banco" value={distributor.banco} />
                <InfoItem label="Tipo de Cuenta" value={distributor.tipoCuenta} />
                <InfoItem label="Nombre de Cuenta" value={distributor.cuentaBancaria} />
                <InfoItem label="Número de Cuenta" value={distributor.numeroCuenta} />
              </Grid>
            </CardBody>
          </Card>
        </VStack>

        {/* Panel Lateral */}
        <VStack spacing={6} align="stretch">
          
          {/* Estadísticas */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md">Resumen</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Stat textAlign="center">
                  <StatLabel>Documentos</StatLabel>
                  <StatNumber>{distributor.documentos?.length || 0}</StatNumber>
                  <StatHelpText>archivos subidos</StatHelpText>
                </Stat>
                
                <Stat textAlign="center">
                  <StatLabel>Referencias</StatLabel>
                  <StatNumber>{distributor.referencias?.length || 0}</StatNumber>
                  <StatHelpText>referencias registradas</StatHelpText>
                </Stat>
                
                <Divider />
                
                <Box textAlign="center">
                  <Text fontSize="sm" color={textColor}>Registro creado</Text>
                  <Text fontWeight="bold">
                    {new Date(distributor.created).toLocaleDateString()}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Documentos */}
          {distributor.documentos && distributor.documentos.length > 0 && (
            <Card bg={bgColor}>
              <CardHeader>
                <Heading size="md">
                  <Icon as={FaFileAlt} mr={2} />
                  Documentos
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {distributor.documentos.map((doc) => (
                    <Box
                      key={doc.id}
                      p={3}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                    >
                      <Text fontWeight="bold" fontSize="sm">
                        {doc.tipoDocumento}
                      </Text>
                      <Text fontSize="xs" color={textColor}>
                        Subido: {new Date(doc.created).toLocaleDateString()}
                      </Text>
                      <Button
                        size="xs"
                        mt={2}
                        colorScheme="orange"
                        variant="outline"
                        as="a"
                        href={`${api_url}/${doc.archivo}`} isexternal ={'true'}
                        target="_blank"
                      >
                        Ver archivo
                      </Button>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Referencias */}
          {distributor.referencias && distributor.referencias.length > 0 && (
            <Card bg={bgColor}>
              <CardHeader>
                <Heading size="md">Referencias</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {distributor.referencias.map((ref) => (
                    <Box
                      key={ref.id}
                      p={3}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                    >
                      <Text fontWeight="bold" fontSize="sm">
                        {ref.nombres}
                      </Text>
                      <Text fontSize="xs" color={textColor}>
                        {ref.relacion}
                      </Text>
                      <Text fontSize="xs">
                        <Icon as={FaPhone} mr={1} />
                        {ref.telefono}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Grid>

      {/* Modal de confirmación para cambio de estado */}
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Confirmar Cambio de Estado"
        onConfirm={handleStatusChange}
        confirmButtonText="Confirmar"
        isConfirming={isUpdatingStatus}
      >
        <Text>
          ¿Estás seguro de que deseas cambiar el estado del distribuidor a:{" "}
          "<strong>{statusAction}</strong>"?
        </Text>
      </GenericModal>
    </Box>
  );
};

/**
 * Componente para mostrar información de forma consistente
 */
const InfoItem = ({ label, value, icon, isTextArea = false }) => {
  const textColor = useColorModeValue("gray.600", "gray.300");
  
  if (!value) return null;
  
  return (
    <GridItem>
      <VStack align="start" spacing={1}>
        <Text fontSize="sm" fontWeight="bold" color={textColor}>
          {icon && <Icon as={icon} mr={1} />}
          {label}
        </Text>
        <Text fontSize="md" wordBreak={isTextArea ? "break-word" : "normal"}>
          {value}
        </Text>
      </VStack>
    </GridItem>
  );
};

export default DistributorDetailPage;