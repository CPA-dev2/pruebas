import React from 'react';
import { Formik, Form, Field } from 'formik';
import { SimpleGrid, Button, FormControl, FormLabel, Input, Select, VStack, Heading, HStack } from '@chakra-ui/react';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';

const Step3_Business = ({ formData, updateData, next, back, requestId }) => {
  const saveAndNext = async (values) => {
    updateData(values);
    await DistributorRegistrationService.updateRequest({ requestId, ...values });
    next();
  };

  return (
    <Formik initialValues={formData} onSubmit={saveAndNext} enableReinitialize>
      {({ isSubmitting }) => (
        <Form>
          <VStack spacing={6} align="stretch">
            <Heading size="md">Información de Negocio</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <Field name="negocioNombre">{({ field }) => <FormControl><FormLabel>Nombre Comercial</FormLabel><Input {...field} /></FormControl>}</Field>
              <Field name="tipoPersona">
                {({ field }) => (
                  <FormControl>
                    <FormLabel>Tipo</FormLabel>
                    <Select {...field}>
                      <option value="natural">Natural</option>
                      <option value="juridica">Jurídica</option>
                    </Select>
                  </FormControl>
                )}
              </Field>
              <Field name="direccion">{({ field }) => <FormControl><FormLabel>Dirección</FormLabel><Input {...field} /></FormControl>}</Field>
              <Field name="antiguedad">{({ field }) => <FormControl><FormLabel>Antigüedad</FormLabel><Input {...field} /></FormControl>}</Field>
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
export default Step3_Business;