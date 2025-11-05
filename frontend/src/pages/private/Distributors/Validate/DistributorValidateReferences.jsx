import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Grid,
  GridItem,
  Button,
  Text,
  Card,
  CardBody,
  IconButton,
  HStack,
  Badge,
  useDisclosure,
 
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { MdThumbUp, MdThumbDown, MdPanTool } from 'react-icons/md';
// Modal para agregar revisiones.
import AddRevisionModal from './AddRevisionModal';



const DistributorValidateReferences = ({ 
    distributorId, 
    initialReferences = [],
    showSuccess, 
    handleError,
    DistributorService,
    onRevisionAdded
}) => {
 
  
  const [referencias, setReferencias] = useState(initialReferences);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentRevision, setCurrentRevision] = useState({
      sectionName: '',
      fieldName: '',
      fieldLabel: ''
    });
    
  
    const handleOpenRevisionModal = (sectionName, fieldName, fieldLabel) => {
      setCurrentRevision({ sectionName, fieldName, fieldLabel });
      onOpen();
    };
  
    const handleSubmitRevision = async (revision) => {
      try {
        setIsSubmittingRevision(true);
        await DistributorService.createRevisions(distributorId, [revision]);
        showSuccess(`Revisión agregada exitosamente para el campo "${currentRevision.fieldLabel}"`);
        
        onClose();
        setCurrentRevision({ sectionName: '', fieldName: '', fieldLabel: '' });
        
        // Recargar los datos del distribuidor para mostrar la nueva revisión
        // Ojo refactor esto en assignments para refrescar la vista!
        if (onRevisionAdded) {
          await onRevisionAdded();
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsSubmittingRevision(false);
      }
    };

      const handleUpdateReferenceValidate = async (referenceId) => {
        try {
          const referencia = referencias.find(ref => ref.id === referenceId);
          if(referencia.estado === "verificado") {return;} 
          
          const response = await DistributorService.updateReferenceStatus(referenceId, "verificado");
        
          if (response.data.data?.updateReferenceFromDistributor?.reference) {
            // Actualizar la lista local de referencias
            setReferencias(referencias.map(ref => 
              ref.id === referenceId ? { ...ref, estado: "verificado" } : ref
            ));
            showSuccess('Referencia actualizada', 'La referencia se ha actualizado correctamente');
          } else {
            throw new Error('La actualización no fue confirmada por el servidor');
          }
        } catch (error) {
          handleError(error);
        }
      };

      const handleUpdateReferenceReject = async (referenceId) => {
        try {
          const referencia = referencias.find(ref => ref.id === referenceId);
           if(referencia.estado === "rechazado") {return;}          
         
          const response = await DistributorService.updateReferenceStatus(referenceId, "rechazado");
    
          if (response.data.data?.updateReferenceFromDistributor?.reference) {
            // Actualizar la lista local de referencias
            setReferencias(referencias.map(ref => 
              ref.id === referenceId ? { ...ref, estado: "rechazado" } : ref
            ));
            showSuccess('Referencia actualizada', 'La referencia se ha actualizado correctamente');
          } else {
            throw new Error('La actualización no fue confirmada por el servidor');
          }
        } catch (error) {
          handleError(error);
        }
      };

  return (
    <Box p={8}>
      <Box mb={6}>
        <HStack justify="space-between" align="center">
          <Box>
            <Heading color="orange.600">Referencias del Distribuidor</Heading>
            <Text color="gray.600">
              Gestiona las referencias personales del distribuidor
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="orange"
            onClick={() => handleOpenRevisionModal('Información_referencias', 'Referencia', 'Referencia')}
            size="md"
          >
            <Text fontSize="sm">Agregar Revisión</Text>
          </Button>
        </HStack>
      </Box>

      {/* Lista de referencias */}
      <VStack spacing={4} align="stretch">
        {referencias.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Text color="gray.500" fontSize="lg">
                No hay referencias registradas
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Agrega la primera referencia haciendo clic en el botón "Agregar Referencia"
              </Text>
            </CardBody>
          </Card>
        ) : (
          referencias.map((referencia) => (
            <Card key={referencia.id} variant="outline">
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
                    <VStack align="start" spacing={1} w="full">
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        NOMBRE
                      </Text>
                      <Text fontWeight="semibold" fontSize="md">{referencia.nombres}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                    <VStack align="start" spacing={1} w="full">
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        TELÉFONO
                      </Text>
                      <Text fontSize="md">{referencia.telefono}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                    <VStack align="start" spacing={1} w="full">
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        RELACIÓN
                      </Text>
                      <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                        {referencia.relacion}
                      </Badge>
                    </VStack>
                  </GridItem>


                  <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                    <HStack justify={{ base: "flex-start", lg: "flex-end" }} spacing={2}>
                     {/* NULL=no verificado, 'verificado'=aprobado, 'rechazado'=desestimado. */}
                      <IconButton
                        icon={<MdThumbDown />}
                        colorScheme={referencia.estado === null ? "gray" : referencia.estado === 'rechazado' ? "red":"gray"}
                        variant="ghost"
                        aria-label="Rechazar referencia"
                        onClick={() => handleUpdateReferenceReject(referencia.id)}
                        size="md"
                      />

                      <IconButton
                        icon={<MdThumbUp />}
                        colorScheme={referencia.estado === null ? "gray" : referencia.estado === 'verificado' ? "green" : "gray"}
                        variant="ghost"
                        aria-label="Verificar referencia"
                        onClick={() => handleUpdateReferenceValidate(referencia.id)}
                        size="md"
                      />
                    </HStack>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

        {/* Modal para agregar nueva referencia */}
      <AddRevisionModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmitRevision}
        sectionName={'Información_referencias'}
        fieldName={'Referencia'}
        fieldLabel={'Referencia'}
        isSubmitting={isSubmittingRevision}
      />
     
    </Box>
  );
};

export default DistributorValidateReferences;
