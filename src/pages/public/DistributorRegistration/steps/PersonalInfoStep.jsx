import React from 'react';
import { Field } from 'formik';
import * as Yup from 'yup';
import { DEPARTAMENTOS_GUATEMALA, getMunicipiosByDepartamento } from '../../../../variables/locations';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Textarea, Heading
} from '@chakra-ui/react';

// 1. Exportar el schema de validación
export const validationSchema = Yup.object({
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

// 2. Aceptar props (values, errors, touched) del padre
const PersonalInfoStep = ({ errors, touched, values }) => {
  // 3. No hay <Formik>, <Form> ni handleSubmit
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" mb={4} fontWeight="semibold">
        Información Personal
      </Heading>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
        
        <GridItem>
          <Field name="nombres">
            {({ field }) => (
              <FormControl isInvalid={errors.nombres && touched.nombres}>
                <FormLabel htmlFor="nombres">Nombres *</FormLabel>
                <Input {...field} id="nombres" placeholder="Ingrese sus nombres" />
                <FormErrorMessage>{errors.nombres}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="apellidos">
            {({ field }) => (
              <FormControl isInvalid={errors.apellidos && touched.apellidos}>
                <FormLabel htmlFor="apellidos">Apellidos *</FormLabel>
                <Input {...field} id="apellidos" placeholder="Ingrese sus apellidos" />
                <FormErrorMessage>{errors.apellidos}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="dpi">
            {({ field }) => (
              <FormControl isInvalid={errors.dpi && touched.dpi}>
                <FormLabel htmlFor="dpi">DPI (CUI) *</FormLabel>
                <Input {...field} id="dpi" placeholder="1234567890101" type="number" />
                <FormErrorMessage>{errors.dpi}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="correo">
            {({ field }) => (
              <FormControl isInvalid={errors.correo && touched.correo}>
                <FormLabel htmlFor="correo">Correo Electrónico *</FormLabel>
                <Input {...field} id="correo" placeholder="ejemplo@correo.com" type="email" />
                <FormErrorMessage>{errors.correo}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="telefono">
            {({ field }) => (
              <FormControl isInvalid={errors.telefono && touched.telefono}>
                <FormLabel htmlFor="telefono">Teléfono *</FormLabel>
                <Input {...field} id="telefono" placeholder="12345678" type="number" />
                <FormErrorMessage>{errors.telefono}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="departamento">
            {({ field }) => (
              <FormControl isInvalid={errors.departamento && touched.departamento}>
                <FormLabel htmlFor="departamento">Departamento *</FormLabel>
                <Select {...field} id="departamento" placeholder="Seleccionar departamento">
                  {DEPARTAMENTOS_GUATEMALA.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
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
                <FormLabel htmlFor="municipio">Municipio *</FormLabel>
                <Select 
                  {...field} 
                  id="municipio"
                  placeholder="Seleccionar municipio"
                  isDisabled={!values.departamento} // Usar 'values' de props
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
        
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Field name="direccion">
            {({ field }) => (
              <FormControl isInvalid={errors.direccion && touched.direccion}>
                <FormLabel htmlFor="direccion">Dirección Completa *</FormLabel>
                <Textarea {...field} id="direccion" rows={3} placeholder="Dirección completa con referencias" />
                <FormErrorMessage>{errors.direccion}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default PersonalInfoStep;