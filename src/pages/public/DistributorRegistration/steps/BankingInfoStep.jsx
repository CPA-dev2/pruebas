import React from 'react';
import { Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Heading
} from '@chakra-ui/react';

// 1. Exportar el schema de validación
export const validationSchema = Yup.object({
  cuenta_bancaria: Yup.string().required('El nombre de la cuenta es obligatorio'),
  numeroCuenta: Yup.string()
    .matches(/^\d{7,20}$/, 'El número de cuenta debe tener entre 7 y 20 dígitos')
    .required('El número de cuenta es obligatorio'),
  tipoCuenta: Yup.string().required('El tipo de cuenta es obligatorio'),
  banco: Yup.string().required('El banco es obligatorio')
});

// 2. Aceptar props de Formik
const BankingInfoStep = ({ errors, touched }) => {
  // 3. No hay <Formik>, <Form> ni handleSubmit
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" mb={4} fontWeight="semibold">
        Información Bancaria
      </Heading>
      
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
        
        <GridItem>
          <Field name="cuenta_bancaria">
            {({ field }) => (
              <FormControl isInvalid={errors.cuenta_bancaria && touched.cuenta_bancaria}>
                <FormLabel htmlFor="cuenta_bancaria">Nombre en la Cuenta *</FormLabel>
                <Input {...field} id="cuenta_bancaria" placeholder="Nombre al que está la cuenta" />
                <FormErrorMessage>{errors.cuenta_bancaria}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="numeroCuenta">
            {({ field }) => (
              <FormControl isInvalid={errors.numeroCuenta && touched.numeroCuenta}>
                <FormLabel htmlFor="numeroCuenta">Número de Cuenta *</FormLabel>
                <Input {...field} id="numeroCuenta" placeholder="00123456789" type="number"/>
                <FormErrorMessage>{errors.numeroCuenta}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="tipoCuenta">
            {({ field }) => (
              <FormControl isInvalid={errors.tipoCuenta && touched.tipoCuenta}>
                <FormLabel htmlFor="tipoCuenta">Tipo de Cuenta *</FormLabel>
                <Select {...field} id="tipoCuenta" placeholder="Seleccionar tipo de cuenta">
                  <option value="monetaria">Cuenta Monetaria</option>
                  <option value="ahorro">Cuenta de Ahorro</option>
                  <option value="corriente">Cuenta Corriente</option>
                </Select>
                <FormErrorMessage>{errors.tipoCuenta}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="banco">
            {({ field }) => (
              <FormControl isInvalid={errors.banco && touched.banco}>
                <FormLabel htmlFor="banco">Banco *</FormLabel>
                <Select {...field} id="banco" placeholder="Seleccionar banco">
                  <option value="Banrural">Banrural (Banco de Desarrollo Rural)</option>
                  <option value="Banco Industrial">Banco Industrial</option>
                  <option value="G&T Continental">G&T Continental</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                  <option value="Otro">Otro</option>
                </Select>
                <FormErrorMessage>{errors.banco}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>
        
      </Grid>
    </VStack>
  );
};

export default BankingInfoStep;