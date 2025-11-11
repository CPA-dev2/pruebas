import React, {useState} from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Grid,
  GridItem,
  Tooltip,
  useDisclosure
} from '@chakra-ui/react';
import { DeleteIcon, CheckCircleIcon} from '@chakra-ui/icons';
import GenericModal from '../../../../components/Componentes_reutilizables/GenericModal'; 


/**
 * Componente para mostrar las revisiones existentes de un distribuidor.
 * 
 * Este componente muestra las revisiones que ya fueron creadas previamente
 * por un revisor. Es de solo lectura y sirve para que el distribuidor vea
 * qué campos necesita corregir.
 * 
 * Props:
 * - distributorId: ID del distribuidor
 * - revisions: Array de revisiones existentes del backend
 */
const DistributorValidateSummary = ({
  revisions = [],
  distributorId,
  handleError,
  showSuccess,
  DistributorService,
  onRevisionDeleted

}) => {

const [revisiones, setRevisiones] = useState(revisions);
const { isOpen, onOpen, onClose } = useDisclosure();
const [isSubmitting, setIsSubmitting] = useState(false);

const handleDeleteRevision = async (revisionId) => {
    try {
      const response = await DistributorService.deleteRevision(revisionId);
      setRevisiones(revisiones.filter(revision => revision.id !== revisionId));
      showSuccess('Revisión eliminada exitosamente');
      
      
    } catch (error) {
      handleError(error);
    }
  };

  const handleApproveRevision = async (revisionId) => {
    try {
      const response = await DistributorService.updateRevision(revisionId, true);
      //setRevisiones(revisiones.filter(revision => revision.id !== revisionId));
      showSuccess('Revisión aprobada exitosamente');
      // Recargar los datos del distribuidor para reflejar los cambios
      if (onRevisionDeleted) {
        await onRevisionDeleted();//onRevisionRefreshed
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleValidateAllCorrect = async () => {
    setIsSubmitting(true);
    try {
      await DistributorService.updateDistributor(distributorId, { estado: 'validado' });
      
      showSuccess('Distribuidor validado correctamente');
      onClose();
      
      // Recargar los datos del distribuidor para reflejar los cambios
      if (onRevisionDeleted) {
        await onRevisionDeleted();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRevisions = revisiones && revisiones.length > 0;

  return (
    <Box p={8}>
      <Box mb={6}>
        <HStack justify="space-between" align="center">
          <Box>
            <Heading color="orange.600">Revisiones y Correcciones</Heading>
            <Text color="gray.600">
              Campos que necesitan corrección según el revisor
            </Text>
          </Box>
          <Badge 
            colorScheme={hasRevisions ? 'orange' : 'green'} 
            fontSize="md" 
            px={3} 
            py={1}
          >
            {hasRevisions ? `${revisiones.length} ${revisiones.length === 1 ? 'revisión' : 'revisiones'}` : 'Sin revisiones'}
          </Badge>
        </HStack>
      </Box>


      {/* Lista de revisiones */}
      <VStack spacing={4} align="stretch">
        {!hasRevisions ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Text color="gray.500" fontSize="lg">
                No hay revisiones registradas
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Este distribuidor no tiene revisiones. Todos los campos han sido validados correctamente.
              </Text>
               <Text color="gray.400" fontSize="lg" mt={2}>
                Si ha corroborado los campos y no existen errores, por favor proceda a enviar la validación.
              </Text>
              <Button 
                colorScheme="green" 
                mt={4}
                onClick={onOpen}
              >
                Validar información correcta
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Información de ayuda */}
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Campos que requieren corrección</AlertTitle>
                <AlertDescription>
                  El revisor ha identificado los siguientes campos que necesitan ser corregidos.
                  Por favor revisa cada observación.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Lista de revisiones */}
            {[...revisiones].reverse().map((revision, index) => (
              <Card key={revision.id || index} variant="outline">
                <CardBody>
                  <Grid 
                    templateColumns={{ 
                      base: "1fr", 
                      md: "repeat(2, 1fr)", 
                      lg: "repeat(4, 1fr)" 
                    }} 
                    gap={4} 
                    alignItems="center"
                  >
                    <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                          SECCIÓN
                        </Text>
                        <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                          {revision.seccion}
                        </Badge>
                      </VStack>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                          CAMPO
                        </Text>
                        <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                          {revision.campo}
                        </Badge>
                      </VStack>
                    </GridItem>

                    {revision.created && (
                      <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500" fontWeight="bold">
                            FECHA
                          </Text>
                          <Text fontWeight="semibold" fontSize="sm">
                            {new Date(revision.created).toLocaleDateString('es-GT', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Text>
                        </VStack>
                      </GridItem>
                    )}

                    <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                      <HStack justify={{ base: "flex-start", lg: "flex-end" }} spacing={2}>
                        <Tooltip label="Aprobar revisión" placement="top">
                          <IconButton
                            icon={<CheckCircleIcon />}
                            onClick={() => handleApproveRevision(revision.id)}
                            colorScheme="green"
                            size="md"
                            variant="ghost"
                            aria-label="Aprobar revisión"
                          />
                        </Tooltip>

                        <Tooltip label="Eliminar revisión" placement="top">
                          <IconButton
                            icon={<DeleteIcon />}
                            onClick={() => handleDeleteRevision(revision.id)}
                            colorScheme="red"
                            size="md"
                            variant="ghost"
                            aria-label="Eliminar revisión"
                          />
                        </Tooltip>
                      </HStack>
                    </GridItem>
                  </Grid>

                  {revision.comentarios && (
                    <Box mt={4}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={1}>
                        OBSERVACIONES
                      </Text>
                      <Text fontSize="sm">{revision.comentarios}</Text>
                    </Box>
                  )}

                  {revision.aprobado !== undefined && (
                    <Box mt={2} display="flex" justifyContent="flex-end">
                      <Badge 
                        colorScheme={revision.aprobado ? 'green' : 'red'}
                        fontSize="sm"
                        px={2}
                        py={1}
                      >
                        {revision.aprobado ? '✓ Aprobado' : '✗ Requiere corrección'}
                      </Badge>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ))}

            {/* Resumen */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  <strong>Total de campos a corregir: {revisiones.length}</strong>
                  <br />
                  Una vez realices las correcciones necesarias, el revisor validará los cambios.
                </AlertDescription>
              </Box>
            </Alert>
          </>
        )}
      </VStack>

      {/* Modal de confirmación */}
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Confirmar Validación"
        onConfirm={handleValidateAllCorrect}
        confirmButtonText="Validar"
        cancelButtonText="Cancelar"
        isConfirming={isSubmitting}
      >
        <VStack spacing={3} align="start">
          <Text>
            ¿Estás seguro de que deseas validar toda la información del distribuidor?
          </Text>
          <Text fontSize="sm" color="gray.500">
            Esta acción cambiará el estado del distribuidor a "validado" y notificará que toda la información es correcta.
          </Text>
        </VStack>
      </GenericModal>
    </Box>
  );
};

export default DistributorValidateSummary;
