import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Button
} from '@chakra-ui/react';

const validationSchema = Yup.object({
  cuentaBancaria: Yup.string().required('La cuenta bancaria es obligatoria'),
  numeroCuenta: Yup.string()
    .matches(/^\d{7,20}$/, 'El número de cuenta debe tener entre 7 y 20 dígitos')
    .required('El número de cuenta es obligatorio'),
  tipoCuenta: Yup.string().required('El tipo de cuenta es obligatorio'),
  banco: Yup.string().required('El banco es obligatorio')
});

const BankingInfoStep = ({ formData, updateFormData, onNext }) => {
  const handleSubmit = (values) => {
    updateFormData(values);
    onNext();
  };

  return (
    <Formik
      initialValues={{
        cuentaBancaria: formData.cuentaBancaria || '',
        numeroCuenta: formData.numeroCuenta || '',
        tipoCuenta: formData.tipoCuenta || '',
        banco: formData.banco || ''
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form style={{ width: '100%' }}>
          <VStack spacing={6} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <Field name="cuentaBancaria">
                  {({ field }) => (
                    <FormControl isInvalid={errors.cuentaBancaria && touched.cuentaBancaria}>
                      <FormLabel>Nombre de la cuenta bancaria *</FormLabel>
                      <Input {...field} />
                      <FormErrorMessage>{errors.cuentaBancaria}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="numeroCuenta">
                  {({ field }) => (
                    <FormControl isInvalid={errors.numeroCuenta && touched.numeroCuenta}>
                      <FormLabel>Número de cuenta bancaria*</FormLabel>
                      <Input {...field} placeholder="123456789123558789" />
                      <FormErrorMessage>{errors.numeroCuenta}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="tipoCuenta">
                  {({ field }) => (
                    <FormControl isInvalid={errors.telefonoNegocio && touched.telefonoNegocio}>
                      <FormLabel>Tipo de Cuenta *</FormLabel>
                      <Select {...field} placeholder="Seleccionar tipo de cuenta">
                        
                        <option value="monetaria">Cuenta monetaria</option>
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
                    <FormControl>
                      <FormLabel>Banco *</FormLabel>
                       <Select {...field} placeholder="Seleccionar banco">
                            
                            <option value="Banrural">Banrural (Banco de Desarrollo Rural)</option>
                            
                         </Select>
                         <FormErrorMessage>{errors.banco}</FormErrorMessage>
                         </FormControl>
                     )}
                     </Field>
                 </GridItem>
               </Grid>
            
            <Button type="submit" colorScheme="orange" size="lg" w="full">
              Continuar al Siguiente Paso
            </Button>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default BankingInfoStep;