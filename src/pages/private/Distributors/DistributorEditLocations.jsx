import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Grid,
  GridItem,
  Text,
  Card,
  CardBody,
  IconButton,
  HStack,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DeleteIcon, DownloadIcon, EditIcon } from '@chakra-ui/icons';
import { MdLocationOn } from 'react-icons/md';
import { DEPARTAMENTOS_GUATEMALA, getMunicipiosByDepartamento } from '../../../variables/locations';


const locationValidationSchema = Yup.object({
    nombre: Yup.string().required('El nombre de la sucursal es requerido'),
    departamento: Yup.string().required('El departamento es requerido'),
    municipio: Yup.string().required('El municipio es requerido'),
    direccion: Yup.string().required('La dirección es requerida'),
    telefono: Yup.string().required('El teléfono es requerido'),
})


const DistributorEditLocations = ({ 
    distributorId, 
    initialLocations = [],
    handleError,
    showSuccess,
    DistributorService
}) => {

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [locations, setLocations] = useState(initialLocations);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [processingRTU, setProcessingRTU] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Manejar procesar RTU y crear locations automáticamente
  const handleProcessRTU = async () => {
    try {
      setProcessingRTU(true);
      console.log('Procesando RTU para distribuidor:', distributorId);
      
      const response = await DistributorService.addLocationsFromRTU(distributorId);
      
      const { locations: newLocations, locationsCount } = response.data.data.addLocationToDistributor;

      // Actualizar la lista local de locations
      setLocations(newLocations);

        showSuccess(`Se han procesado ${locationsCount} sucursales desde el RTU`);
    } catch (error) {
      console.error('Error al procesar RTU:', error);
        handleError(error);
    } finally {
      setProcessingRTU(false);
    }
  };

  // Manejar eliminar location
  const handleDeleteLocation = async (locationId) => {
    try {
      setDeletingId(locationId);
      
      if (!locationId) {
        handleError('ID de sucursal no válido');
        return;
      }
      
           
      const response = await DistributorService.deleteLocation(locationId);
      
      // Verificar si hay errores en la respuesta
      if (response.data.errors) {
        const errorMessages = response.data.errors.map(e => e.message).join(', ');
        handleError(errorMessages);
        return;
      }
      
      // Verificar si la mutación fue exitosa
      if (response.data.data?.deleteLocationFromDistributor?.success) {
        // Actualizar la lista local de locations
        setLocations(locations.filter(loc => loc.id !== locationId));

        showSuccess('Sucursal eliminada correctamente');
      } else {
        handleError('La eliminación no fue confirmada por el servidor');
      }
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
        handleError(error);
    } finally {
      setDeletingId(null);
    }
  };

  // Manejar abrir modal de edición
  const handleEditLocation = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      setEditingId(locationId);
      onOpen();
    }
  };

  // Manejar actualización de location
  const handleUpdateLocation = async (values, { setSubmitting }) => {
    try {
      console.log('Actualizando sucursal:', values);
      
      const response = await DistributorService.updateLocationFromDistributor(
        selectedLocation.id,
        values.nombre,
        values.departamento,
        values.municipio,
        values.direccion,
        values.telefono
      );

      // Verificar errores
      if (response.data.errors) {
        const errorMessages = response.data.errors.map(e => e.message).join(', ');
        handleError(errorMessages);
        return;
      }

      if (response.data.data?.updateLocationFromDistributor?.location) {
        const updatedLocation = response.data.data.updateLocationFromDistributor.location;
        
        // Actualizar la lista local
        setLocations(locations.map(loc => 
          loc.id === updatedLocation.id ? updatedLocation : loc
        ));

        showSuccess('Sucursal actualizada correctamente');
        onClose();
        setSelectedLocation(null);
        setEditingId(null);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cierre del modal
  const handleCloseModal = () => {
    onClose();
    setSelectedLocation(null);
    setEditingId(null);
  };

  return (
    <Box p={8}>
      {/* Header */}
      <Box mb={6}>
        <HStack justify="space-between" align="center">
          <Box>
            <Heading color="orange.600">Sucursales del Distribuidor</Heading>
            <Text color="gray.600">
              Gestiona las ubicaciones donde opera el distribuidor
            </Text>
          </Box>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="orange"
            onClick={handleProcessRTU}
            isLoading={processingRTU}
            loadingText="Procesando RTU..."
            size="md"
          >
            Cargar desde RTU
          </Button>
        </HStack>
      </Box>

      {/* Alerta informativa */}
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Carga Automática</AlertTitle>
          <AlertDescription>
            Haz clic en "Cargar desde RTU" para extraer automáticamente las sucursales 
            del documento RTU del distribuidor.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Lista de locations */}
      <VStack spacing={4} align="stretch">
        {locations.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <MdLocationOn size={48} color="gray" style={{ margin: '0 auto 16px' }} />
              <Text color="gray.500" fontSize="lg">
                Sin sucursales por el momento
              </Text>
            </CardBody>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id} variant="outline">
              <CardBody>
                <Grid templateColumns="repeat(6, 1fr)" gap={4} alignItems="center">
                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        SUCURSAL
                      </Text>
                      <HStack>
                        <MdLocationOn color="orange" />
                        <Text fontWeight="semibold">{location.nombre}</Text>
                      </HStack>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        DEPARTAMENTO
                      </Text>
                      <Text fontSize="sm">{location.departamento}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        MUNICIPIO
                      </Text>
                      <Text fontSize="sm">{location.municipio}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        TELÉFONO
                      </Text>
                      <Text fontSize="sm">{location.telefono}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={2}>
                    <HStack justify="flex-end" spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        colorScheme="blue"
                        variant="ghost"
                        aria-label="Editar sucursal"
                        onClick={() => handleEditLocation(location.id)}
                        isLoading={editingId === location.id}
                        size="sm"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        aria-label="Eliminar sucursal"
                        onClick={() => handleDeleteLocation(location.id)}
                        isLoading={deletingId === location.id}
                        size="sm"
                      />
                    </HStack>
                  </GridItem>
                </Grid>

                {/* Dirección completa en una segunda fila */}
                {location.direccion && (
                  <Box mt={3} pt={3} borderTop="1px" borderColor="gray.200">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={1}>
                      DIRECCIÓN
                    </Text>
                    <Text fontSize="sm" color="gray.700">
                      {location.direccion}
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Sucursal</ModalHeader>
          <ModalCloseButton />

          <Formik
            initialValues={{
              nombre: selectedLocation?.nombre || '',
              departamento: selectedLocation?.departamento || '',
              municipio: selectedLocation?.municipio || '',
              direccion: selectedLocation?.direccion || '',
              telefono: selectedLocation?.telefono || '',
            }}
            validationSchema={locationValidationSchema}
            onSubmit={handleUpdateLocation}
            enableReinitialize
          >

            {/* Formulario de edición de sucursal */}
            {({ isSubmitting, errors, touched, values, setFieldValue }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <Field name="nombre">
                      {({ field }) => (
                        <FormControl isInvalid={errors.nombre && touched.nombre}>
                          <FormLabel>Nombre de la Sucursal</FormLabel>
                          <Input {...field} placeholder="Nombre de la sucursal" />
                          <FormErrorMessage>{errors.nombre}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Field name="departamento">
                          {({ field }) => (
                            <FormControl isInvalid={errors.departamento && touched.departamento}>
                              <FormLabel>Departamento</FormLabel>
                              <Select 
                                {...field} 
                                placeholder="Selecciona departamento"
                                onChange={(e) => {
                                  setFieldValue('departamento', e.target.value);
                                  setFieldValue('municipio', '');
                                }}
                              >
                                {DEPARTAMENTOS_GUATEMALA.map((dept) => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </Select>
                              <FormErrorMessage>{errors.departamento}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>
                      </GridItem>

                      <GridItem>
                        <Field name="municipio">
                          {({ field }) => (
                            <FormControl isInvalid={errors.municipio && touched.municipio}>
                              <FormLabel>Municipio</FormLabel>
                              <Select 
                                {...field} 
                                placeholder="Selecciona municipio"
                                isDisabled={!values.departamento}
                              >
                                {values.departamento && getMunicipiosByDepartamento(values.departamento).map((mun) => (
                                  <option key={mun} value={mun}>{mun}</option>
                                ))}
                              </Select>
                              <FormErrorMessage>{errors.municipio}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>
                      </GridItem>
                    </Grid>

                    <Field name="direccion">
                      {({ field }) => (
                        <FormControl isInvalid={errors.direccion && touched.direccion}>
                          <FormLabel>Dirección</FormLabel>
                          <Input {...field} placeholder="Dirección completa" />
                          <FormErrorMessage>{errors.direccion}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <Field name="telefono">
                      {({ field }) => (
                        <FormControl isInvalid={errors.telefono && touched.telefono}>
                          <FormLabel>Teléfono</FormLabel>
                          <Input {...field} placeholder="Número de teléfono" />
                          <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </VStack>
                </ModalBody>
                
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    colorScheme="blue" 
                    isLoading={isSubmitting}
                    loadingText="Guardando..."
                  >
                    Guardar Cambios
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

export default DistributorEditLocations;
