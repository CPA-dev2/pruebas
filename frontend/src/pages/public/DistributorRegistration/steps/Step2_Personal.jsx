import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { SimpleGrid, Button, FormControl, FormLabel, Input, FormErrorMessage, VStack, Heading, HStack, Alert, AlertIcon, Box } from '@chakra-ui/react';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';

const schema = Yup.object({
  nombres: Yup.string().required('Requerido'),
  apellidos: Yup.string().required('Requerido'),
  dpi: Yup.string().required('Requerido'),
  telefono: Yup.string().required('Requerido'),
  // Otros campos pueden ser opcionales en este paso si se llenan después
});

const Step2_Personal = ({ formData, updateData, next, back, requestId }) => {
  
  const saveAndNext = async (values, { setSubmitting }) => {
    try {
      updateData(values); // Actualizar estado global
      // Guardar en backend
      await DistributorRegistrationService.updateRequest({ 
        requestId, 
        ...values 
      });
      next();
    } catch (error) {
      console.error("Error guardando paso 2", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik 
      initialValues={formData} 
      validationSchema={schema} 
      onSubmit={saveAndNext} 
      enableReinitialize // CLAVE: Permite que los campos se actualicen si el OCR termina tarde
    >
      {({ errors, touched, isSubmitting }) => (
        <Form>
          <VStack spacing={6} align="stretch">
            <Heading size="md">Información Personal</Heading>
            
            <Alert status="info" borderRadius="md" fontSize="sm">
              <AlertIcon />
              Verifica que los datos extraídos de tu DPI sean correctos.
            </Alert>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Field name="nombres">{({ field }) => <FormControl isInvalid={errors.nombres && touched.nombres}><FormLabel>Nombres</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.nombres}</FormErrorMessage></FormControl>}</Field>
              <Field name="apellidos">{({ field }) => <FormControl isInvalid={errors.apellidos && touched.apellidos}><FormLabel>Apellidos</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.apellidos}</FormErrorMessage></FormControl>}</Field>
              <Field name="dpi">{({ field }) => <FormControl isInvalid={errors.dpi && touched.dpi}><FormLabel>DPI (CUI)</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.dpi}</FormErrorMessage></FormControl>}</Field>
              <Field name="telefono">{({ field }) => <FormControl isInvalid={errors.telefono && touched.telefono}><FormLabel>Teléfono</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.telefono}</FormErrorMessage></FormControl>}</Field>
              
              <Field name="departamento">{({ field }) => <FormControl isInvalid={errors.departamento && touched.departamento}><FormLabel>Departamento</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.departamento}</FormErrorMessage></FormControl>}</Field>
              <Field name="municipio">{({ field }) => <FormControl isInvalid={errors.municipio && touched.municipio}><FormLabel>Municipio</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.municipio}</FormErrorMessage></FormControl>}</Field>
              
              <Box gridColumn={{ md: "span 2" }}>
                <Field name="direccion">{({ field }) => <FormControl isInvalid={errors.direccion && touched.direccion}><FormLabel>Dirección Completa</FormLabel><Input {...field} bg="white" /><FormErrorMessage>{errors.direccion}</FormErrorMessage></FormControl>}</Field>
              </Box>
            </SimpleGrid>
            
            <HStack justify="space-between" pt={4}>
              <Button onClick={back} variant="ghost">Atrás</Button>
              <Button type="submit" colorScheme="brand" isLoading={isSubmitting}>Guardar y Continuar</Button>
            </HStack>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};
export default Step2_Personal;