/**
 * @file Paso 1 del formulario: Información Personal.
 * Este componente ahora es autocontenido y maneja su propio estado
 * de Formik, guardando el resultado en el Contexto al avanzar.
 */
import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Textarea, Heading, Button, Flex, Divider
} from '@chakra-ui/react';
// 1. Importar el hook del contexto
import { useRegistrationForm } from '../../../../context/RegistrationContext';
import { DEPARTAMENTOS_GUATEMALA, getMunicipiosByDepartamento } from '../../../../variables/locations';

// 2. El schema de validación sigue siendo local del paso
export const validationSchema = Yup.object({
  nombres: Yup.string().required('El nombre es obligatorio'),
  apellidos: Yup.string().required('El apellido es obligatorio'),
  dpi: Yup.string().matches(/^\d{13}$/, 'El DPI debe tener 13 dígitos').required('El DPI es obligatorio'),
  correo: Yup.string().email('Email no válido').required('El email es obligatorio'),
  telefono: Yup.string().matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos').required('El teléfono es obligatorio'),
  departamento: Yup.string().required('El departamento es obligatorio'),
  municipio: Yup.string().required('El municipio es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
});

const PersonalInfoStep = () => {
  // 3. Obtiene los datos y las acciones del contexto
  const { formData, updateFormData, goToNext, goToPrevious, activeStep } = useRegistrationForm();

  /**
   * Manejador de envío local para este paso.
   * Valida los datos y, si son correctos, los guarda en el contexto
   * y avanza al siguiente paso.
   */
  const handleSubmit = (values, { setSubmitting }) => {
    updateFormData(values); // Guarda los datos en el contexto global
    goToNext(); // Avanza al siguiente paso
    setSubmitting(false);
  };

  return (
    // 4. Cada paso tiene su propio <Formik>
    // Esto es mucho más rápido ya que el estado es local.
    <Formik
      initialValues={{
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dpi: formData.dpi,
        correo: formData.correo,
        telefono: formData.telefono,
        departamento: formData.departamento,
        municipio: formData.municipio,
        direccion: formData.direccion,
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, values, isSubmitting }) => (
        <Form>
          <VStack spacing={6} align="stretch">
            <Heading size="lg" mb={4} fontWeight="semibold">
              Información Personal
            </Heading>
            
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              {/* --- Nombres --- */}
              <GridItem>
                <Field name="nombres">
                  {({ field }) => (
                    <FormControl isInvalid={errors.nombres && touched.nombres}>
                      <FormLabel htmlFor="nombres">Nombres *</FormLabel>
                      <Input {...field} id="nombres" placeholder="Nombres" />
                      <FormErrorMessage>{errors.nombres}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              {/* --- Apellidos --- */}
              <GridItem>
                <Field name="apellidos">
                  {({ field }) => (
                    <FormControl isInvalid={errors.apellidos && touched.apellidos}>
                      <FormLabel htmlFor="apellidos">Apellidos *</FormLabel>
                      <Input {...field} id="apellidos" placeholder="Apellidos" />
                      <FormErrorMessage>{errors.apellidos}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>

              {/* --- DPI --- */}
              <GridItem>
                <Field name="dpi">
                  {({ field }) => (
                    <FormControl isInvalid={errors.dpi && touched.dpi}>
                      <FormLabel htmlFor="dpi">DPI (13 dígitos) *</FormLabel>
                      <Input {...field} id="dpi" placeholder="2500123450101" />
                      <FormErrorMessage>{errors.dpi}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>

              {/* --- Correo --- */}
              <GridItem>
                <Field name="correo">
                  {({ field }) => (
                    <FormControl isInvalid={errors.correo && touched.correo}>
                      <FormLabel htmlFor="correo">Correo Electrónico *</FormLabel>
                      <Input {...field} id="correo" type="email" placeholder="ejemplo@correo.com" />
                      <FormErrorMessage>{errors.correo}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>

              {/* --- Teléfono --- */}
              <GridItem>
                <Field name="telefono">
                  {({ field }) => (
                    <FormControl isInvalid={errors.telefono && touched.telefono}>
                      <FormLabel htmlFor="telefono">Teléfono (8 dígitos) *</FormLabel>
                      <Input {...field} id="telefono" type="tel" placeholder="12345678" />
                      <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>

              {/* --- Departamento --- */}
              <GridItem>
                <Field name="departamento">
                  {({ field, form }) => (
                    <FormControl isInvalid={errors.departamento && touched.departamento}>
                      <FormLabel htmlFor="departamento">Departamento *</FormLabel>
                      <Select 
                        {...field} 
                        id="departamento" 
                        placeholder="Seleccionar departamento"
                        onChange={(e) => {
                          form.setFieldValue('departamento', e.target.value);
                          form.setFieldValue('municipio', ''); // Resetear municipio
                        }}
                      >
                        {DEPARTAMENTOS_GUATEMALA.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.departamento}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </GridItem>
              
              {/* --- Municipio --- */}
              <GridItem>
                <Field name="municipio">
                  {({ field }) => (
                    <FormControl isInvalid={errors.municipio && touched.municipio}>
                      <FormLabel htmlFor="municipio">Municipio *</FormLabel>
                      <Select 
                        {...field} 
                        id="municipio"
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
              
              {/* --- Dirección --- */}
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

            {/* 5. Botones de navegación locales */}
            <Divider my={10} />
            <Flex mt={6} justify="space-between">
              <Button
                onClick={goToPrevious}
                isDisabled={activeStep === 0 || isSubmitting}
              >
                Atrás
              </Button>
              <Button
                type="submit"
                colorScheme="orange"
                isLoading={isSubmitting}
              >
                Siguiente
              </Button>
            </Flex>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default PersonalInfoStep;
