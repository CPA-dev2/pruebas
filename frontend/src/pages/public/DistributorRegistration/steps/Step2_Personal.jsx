import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { SimpleGrid, Button, FormControl, FormLabel, Input, FormErrorMessage, VStack, Heading, HStack } from '@chakra-ui/react';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';

const schema = Yup.object({
  nombres: Yup.string().required('Requerido'),
  apellidos: Yup.string().required('Requerido'),
  dpi: Yup.string().required('Requerido'),
  telefono: Yup.string().required('Requerido'),
});

const Step2_Personal = ({ formData, updateData, next, back, requestId }) => {
  const saveAndNext = async (values) => {
    updateData(values);
    await DistributorRegistrationService.updateRequest({ requestId, ...values });
    next();
  };

  return (
    <Formik initialValues={formData} validationSchema={schema} onSubmit={saveAndNext} enableReinitialize>
      {({ errors, touched, isSubmitting }) => (
        <Form>
          <VStack spacing={6} align="stretch">
            <Heading size="md">Datos Personales</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <Field name="nombres">{({ field }) => <FormControl isInvalid={errors.nombres && touched.nombres}><FormLabel>Nombres</FormLabel><Input {...field} /><FormErrorMessage>{errors.nombres}</FormErrorMessage></FormControl>}</Field>
              <Field name="apellidos">{({ field }) => <FormControl isInvalid={errors.apellidos && touched.apellidos}><FormLabel>Apellidos</FormLabel><Input {...field} /><FormErrorMessage>{errors.apellidos}</FormErrorMessage></FormControl>}</Field>
              <Field name="dpi">{({ field }) => <FormControl isInvalid={errors.dpi && touched.dpi}><FormLabel>DPI</FormLabel><Input {...field} /><FormErrorMessage>{errors.dpi}</FormErrorMessage></FormControl>}</Field>
              <Field name="telefono">{({ field }) => <FormControl isInvalid={errors.telefono && touched.telefono}><FormLabel>Teléfono</FormLabel><Input {...field} /><FormErrorMessage>{errors.telefono}</FormErrorMessage></FormControl>}</Field>
            </SimpleGrid>
            <HStack justify="space-between">
              <Button onClick={back}>Atrás</Button>
              <Button type="submit" colorScheme="brand" isLoading={isSubmitting}>Siguiente</Button>
            </HStack>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};
export default Step2_Personal;