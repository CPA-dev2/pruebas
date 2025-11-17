import React from 'react';
import { Formik, Form, Field } from 'formik';
import { SimpleGrid, Button, FormControl, FormLabel, Input, Select, VStack, Heading, HStack } from '@chakra-ui/react';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';

const Step4_Financial = ({ formData, updateData, next, back, requestId }) => {
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
            <Heading size="md">Información Bancaria</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <Field name="banco">{({ field }) => <FormControl><FormLabel>Banco</FormLabel><Input {...field} /></FormControl>}</Field>
              <Field name="numeroCuenta">{({ field }) => <FormControl><FormLabel>No. Cuenta</FormLabel><Input {...field} /></FormControl>}</Field>
              <Field name="cuentaBancaria">{({ field }) => <FormControl><FormLabel>Nombre Cuenta</FormLabel><Input {...field} /></FormControl>}</Field>
              <Field name="tipoCuenta">
                {({ field }) => (
                  <FormControl>
                    <FormLabel>Tipo</FormLabel>
                    <Select {...field}>
                      <option value="monetaria">Monetaria</option>
                      <option value="ahorro">Ahorro</option>
                    </Select>
                  </FormControl>
                )}
              </Field>
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
export default Step4_Financial;