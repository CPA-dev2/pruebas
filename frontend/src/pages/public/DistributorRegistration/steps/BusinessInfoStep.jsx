import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Button
} from '@chakra-ui/react';

const validationSchema = Yup.object({
  telefonoNegocio: Yup.string()
    .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos')
    .required('El teléfono es obligatorio'),
  equipamiento: Yup.string().required('El equipamiento es obligatorio'),
  sucursales: Yup.string().required('Las sucursales son obligatorias'),
  antiguedad: Yup.string().required('La antigüedad es obligatoria'),
  productosDistribuidos: Yup.string().required('Los productos distribuidos son obligatorios'),
  tipoPersona: Yup.string().required('El tipo de persona es obligatorio')
});

const BusinessInfoStep = ({ formData, updateFormData, onNext }) => {
  const handleSubmit = (values) => {
    updateFormData(values);
    onNext();
  };

  return (
    <Formik
      initialValues={{
        telefonoNegocio: formData.telefonoNegocio || '',
        equipamiento: formData.equipamiento || '',
        sucursales: formData.sucursales || '',
        antiguedad: formData.antiguedad || '',
        productosDistribuidos: formData.productosDistribuidos || '',
        tipoPersona: formData.tipoPersona || ''
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form style={{ width: '100%' }}>
          <VStack spacing={6} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                            
              <GridItem>
                <Field name="telefonoNegocio">
                  {({ field }) => (
                    <FormControl isInvalid={errors.telefonoNegocio && touched.telefonoNegocio}>
                      <FormLabel>Teléfono del Negocio *</FormLabel>
                      <Input {...field} placeholder="12345678" />
                      <FormErrorMessage>{errors.telefonoNegocio}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>

              <GridItem>
                <Field name="sucursales">
                  {({ field }) => (
                    <FormControl>
                      <FormLabel>Sucursales disponibles*</FormLabel>
                      <Select {...field} placeholder="Seleccionar número de sucursales">
                        <option value="1 sucursal">1 sucursal</option>
                        <option value="2 sucursales">2 sucursales</option>
                        <option value="3 sucursales">3 sucursales</option>
                        <option value="4 sucursales">4 sucursales</option>
                        <option value="5 sucursales">5 sucursales</option>
                        <option value="Más de 5 sucursales">Más de 5 sucursales</option>
                      </Select>
                      <FormErrorMessage>{errors.sucursales}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>

              <GridItem>
                <Field name="equipamiento">
                  {({ field }) => (
                    <FormControl>
                      <FormLabel>Equipamiento para trabajar*</FormLabel>
                       <Select {...field} placeholder="Seleccionar equipamiento">
                         <option value="Pc de escritorio y laptops">Pc de escritorio y laptops</option>
                         <option value="Tablets">Tablets</option>
                         <option value="Celulares">Celulares</option>
                         <option value="Ninguno">Ninguno</option>
                       </Select>
                         <FormErrorMessage>{errors.equipamiento}</FormErrorMessage>
                         </FormControl>
                     )}
                     </Field>
                 </GridItem>
               
             <GridItem>
                <Field name="tipoPersona">
                  {({ field }) => (
                    <FormControl>
                      <FormLabel>Tipo de Persona</FormLabel>
                      <Select {...field} placeholder="Seleccionar tipo de entidad">
                        <option value="natural">Persona Natural</option>
                        <option value="juridica">Persona Jurídica</option>
                      </Select>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="antiguedad">
                  {({ field }) => (
                    <FormControl isInvalid={errors.antiguedad && touched.antiguedad}>
                      <FormLabel>Años en el mercado *</FormLabel>
                      <Select {...field} placeholder="Seleccionar antigüedad en el mercado">
                        <option value="1 año">1 año</option>
                        <option value="2 años">2 años</option>
                        <option value="3 años">3 años</option>
                        <option value="4 años">4 años</option>
                        <option value="5 años">5 años</option>
                        <option value="más de 5 años">Más de 5 años</option>
                      </Select>
                      <FormErrorMessage>{errors.antiguedad}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="productosDistribuidos">
                  {({ field }) => (
                    <FormControl isInvalid={errors.productosDistribuidos && touched.productosDistribuidos}>
                      <FormLabel>Productos Distribuidos *</FormLabel>
                      <Select {...field} placeholder="Seleccionar productos distribuidos">
                        <option value="Celulares">Celulares</option>
                        <option value="Electrodomésticos">Electrodomésticos</option>
                        <option value="Computadoras y laptops">Computadoras y laptops</option>
                        <option value="Celulares y electrodomésticos">Celulares y electrodomésticos</option>
                       </Select>
                      <FormErrorMessage>{errors.productosDistribuidos}</FormErrorMessage>
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

export default BusinessInfoStep;