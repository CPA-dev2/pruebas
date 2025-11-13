import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DEPARTAMENTOS_GUATEMALA, getMunicipiosByDepartamento } from '../../../../variables/locations';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Textarea, Button
} from '@chakra-ui/react';

const validationSchema = Yup.object({
  nombres: Yup.string().required('El nombre es obligatorio'),
  apellidos: Yup.string().required('El apellido es obligatorio'),
  dpi: Yup.string()
    .matches(/^\d{13}$/, 'El DPI debe tener 13 dígitos')
    .required('El DPI es obligatorio'),
  correo: Yup.string()
    .email('Email no válido')
    .required('El email es obligatorio'),
  telefono: Yup.string()
    .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos')
    .required('El teléfono es obligatorio'),
  departamento: Yup.string().required('El departamento es obligatorio'),
  municipio: Yup.string().required('El municipio es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
});

const PersonalInfoStep = ({ formData, updateFormData, onNext }) => {
  const handleSubmit = (values) => {
    updateFormData(values);
    onNext();
  };

  return (
    <Formik
      initialValues={{
        nombres: formData.nombres || '',
        apellidos: formData.apellidos || '',
        dpi: formData.dpi || '',
        correo: formData.correo || '',
        telefono: formData.telefono || '',
        departamento: formData.departamento || '',
        municipio: formData.municipio || '',
        direccion: formData.direccion || ''
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, values }) => (
        <Form style={{ width: '100%' }}>
          <VStack spacing={6} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <Field name="nombres">
                  {({ field }) => (
                    <FormControl isInvalid={errors.nombres && touched.nombres}>
                      <FormLabel>Nombres *</FormLabel>
                      <Input {...field} />
                      <FormErrorMessage>{errors.nombres}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="apellidos">
                  {({ field }) => (
                    <FormControl isInvalid={errors.apellidos && touched.apellidos}>
                      <FormLabel>Apellidos *</FormLabel>
                      <Input {...field} />
                      <FormErrorMessage>{errors.apellidos}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="dpi">
                  {({ field }) => (
                    <FormControl isInvalid={errors.dpi && touched.dpi}>
                      <FormLabel>DPI *</FormLabel>
                      <Input {...field} placeholder="1234567890123" />
                      <FormErrorMessage>{errors.dpi}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="correo">
                  {({ field }) => (
                    <FormControl isInvalid={errors.correo && touched.correo}>
                      <FormLabel>Email *</FormLabel>
                      <Input {...field} type="email" />
                      <FormErrorMessage>{errors.correo}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="telefono">
                  {({ field }) => (
                    <FormControl isInvalid={errors.telefono && touched.telefono}>
                      <FormLabel>Teléfono *</FormLabel>
                      <Input {...field} placeholder="12345678" />
                      <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem>
                <Field name="departamento">
                  {({ field }) => (
                    <FormControl isInvalid={errors.departamento && touched.departamento}>
                      <FormLabel>Departamento *</FormLabel>
                      <Select {...field} placeholder="Seleccionar departamento">
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
                      <FormLabel>Municipio *</FormLabel>
                      <Select 
                        {...field} 
                        placeholder="Seleccionar municipio"
                        isDisabled={!values.departamento}
                      >
                        {getMunicipiosByDepartamento(values.departamento).map((mun) => (
                          <option key={mun} value={mun}>{mun}</option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.municipio}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              <GridItem colSpan={2}>
                <Field name="direccion">
                  {({ field }) => (
                    <FormControl isInvalid={errors.direccion && touched.direccion}>
                      <FormLabel>Dirección Completa *</FormLabel>
                      <Textarea {...field} rows={3} placeholder="Dirección completa con referencias" />
                      <FormErrorMessage>{errors.direccion}</FormErrorMessage>
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

export default PersonalInfoStep;