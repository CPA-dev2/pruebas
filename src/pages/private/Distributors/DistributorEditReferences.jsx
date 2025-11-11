import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Text,
  Card,
  CardBody,
  IconButton,
  HStack,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';


// Esquema de validación para nueva referencia
const referenceValidationSchema = Yup.object({
  nombres: Yup.string().required('Nombres son requeridos'),
  telefono: Yup.string().required('Teléfono es requerido'),
  relacion: Yup.string().required('Relación es requerida'),
});

const DistributorEditReferences = ({ 
    distributorId, 
    initialReferences = [],
    showSuccess, 
    handleError,
    DistributorService
    
}) => {
 
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [referencias, setReferencias] = useState(initialReferences);
  const [deletingId, setDeletingId] = useState(null);

  // Manejar agregar nueva referencia
  const handleAddReference = async (values, { setSubmitting, resetForm }) => {
    try {
      //console.log('Agregando nueva referencia:', values);
      //console.log('Para el distribuidor ID:', distributorId);
      
      const response = await DistributorService.addReferenceToDistributor(
        distributorId,
        values.nombres,
        values.telefono,
        values.relacion
      );

      const newReference = response.data.data.addReferenceToDistributor.reference;

      // Actualizar la lista local de referencias
      setReferencias([...referencias, newReference]);

      showSuccess('Referencia agregada', 'La referencia se ha agregado correctamente');

      resetForm();
      onClose();
    } catch (error) {
      
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar eliminar referencia
  const handleDeleteReference = async (referenceId) => {
    try {
      setDeletingId(referenceId);
    
      
      if (!referenceId) {
        handleError('ID de referencia no existe');
      }
            
      const response = await DistributorService.deleteReference(referenceId);
      
         
      // Verificar si la mutación fue exitosa
      if (response.data.data?.deleteReferenceFromDistributor?.success) {
        // Actualizar la lista local de referencias
        setReferencias(referencias.filter(ref => ref.id !== referenceId));

        showSuccess('Referencia eliminada', 'La referencia se ha eliminado correctamente');
      } else {
        throw new Error('La eliminación no fue confirmada por el servidor');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setDeletingId(null);
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
            onClick={onOpen}
            size="md"
          >
            Agregar Referencia
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
                <Grid templateColumns="repeat(4, 1fr)" gap={4} alignItems="center">
                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        NOMBRE
                      </Text>
                      <Text fontWeight="semibold">{referencia.nombres}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        TELÉFONO
                      </Text>
                      <Text>{referencia.telefono}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        RELACIÓN
                      </Text>
                      <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                        {referencia.relacion}
                      </Badge>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <HStack justify="flex-end">
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        aria-label="Eliminar referencia"
                        onClick={() => handleDeleteReference(referencia.id)}
                        isLoading={deletingId === referencia.id}
                        size="sm"
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
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="orange.600">Agregar Nueva Referencia</ModalHeader>
          <ModalCloseButton />

          <Formik
            initialValues={{
              nombres: '',
              telefono: '',
              relacion: '',
            }}
            validationSchema={referenceValidationSchema}
            onSubmit={handleAddReference}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4}>
                    <Field name="nombres">
                      {({ field }) => (
                        <FormControl isInvalid={errors.nombres && touched.nombres}>
                          <FormLabel>Nombres Completos</FormLabel>
                          <Input
                            {...field}
                            placeholder="Nombre completo de la referencia"
                          />
                          <FormErrorMessage>{errors.nombres}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <Field name="telefono">
                      {({ field }) => (
                        <FormControl isInvalid={errors.telefono && touched.telefono}>
                          <FormLabel>Teléfono</FormLabel>
                          <Input
                            {...field}
                            placeholder="Número de teléfono"
                            type="tel"
                          />
                          <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <Field name="relacion">
                      {({ field }) => (
                        <FormControl isInvalid={errors.relacion && touched.relacion}>
                          <FormLabel>Relación</FormLabel>
                          <Input
                            {...field}
                            placeholder="Ej: Amigo, Familiar, Socio, etc."
                          />
                          <FormErrorMessage>{errors.relacion}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </VStack>
                </ModalBody>

                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="orange"
                    isLoading={isSubmitting}
                    loadingText="Agregando..."
                  >
                    Agregar Referencia
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DistributorEditReferences;
