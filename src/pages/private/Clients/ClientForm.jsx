import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  FormControl, 
  FormLabel, 
  Input, 
  FormErrorMessage, 
  Button, 
  VStack, 
  Switch, 
  HStack, 
  Text
} from '@chakra-ui/react';

/**
 * Esquema de validación para el formulario para clientes.
 * Requiere nombres, apellidos, fecha de nacimiento, email y DPI (13 dígitos).
 * El NIT es opcional pero si se proporciona debe tener de 1 a 13 dígitos.
 */
const validationSchema = Yup.object({
  nombres: Yup.string().required('El nombre es obligatorio'),
  apellidos: Yup.string().required('El apellido es obligatorio'),
  fechaNacimiento: Yup.date()
    .nullable()
    .transform((value, originalValue) => {
      // Si el valor original es una cadena vacía, devuelve null
      if (originalValue === '') return null;
      // Si es una fecha válida, la devuelve
      return value;
    })
    .required('La fecha de nacimiento es obligatoria')
    .max(new Date(), 'La fecha no puede ser futura'),
  dpi: Yup.string()
    .required('El DPI es obligatorio')
    .matches(/^\d{13}$/, 'El DPI debe tener exactamente 13 dígitos'),
  nit: Yup.string()
    .notRequired()
    .test('nit-length', 'El NIT debe tener de 1 a 13 dígitos', function(value) {
      if (!value || value.trim() === '') return true; // Si está vacío, es válido (opcional)
      return /^\d{1,13}$/.test(value); // Si tiene valor, debe ser de 1 a 13 dígitos
    }),
  direccion: Yup.string().notRequired(),
  email: Yup.string().email('Email no válido').required('El email es obligatorio'),
  telefono: Yup.string().notRequired(),
  isActive: Yup.boolean().required('El estado es obligatorio'),
});

/**
 * `ClientForm` es un formulario completo para crear y editar clientes.
 *
 * Su comportamiento se controla mediante las props `isCreateMode` y `isEditMode`:
 * - **Modo Creación (`isCreateMode={true}`):** Formulario para crear nuevo cliente con botón "Crear".
 * - **Modo Edición (`isEditMode={true}`):** Formulario para editar cliente existente con botón "Actualizar".
 * - **Modo Visualización (`isCreateMode={false}`, `isEditMode={false}`):** Todos los campos deshabilitados para solo lectura.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Function} props.onSubmit - Callback que se ejecuta al enviar el formulario.
 * @param {object} [props.initialValues] - Valores iniciales para poblar el formulario.
 * @param {boolean} [props.isSubmitting=false] - Indica si el formulario está en proceso de envío.
 * @param {boolean} [props.isEditMode=false] - Activa el modo de edición.
 * @param {boolean} [props.isCreateMode=false] - Activa el modo de creación.
 */
const ClientForm = ({ onSubmit, initialValues, isSubmitting, isEditMode = false, isCreateMode = false }) => {
  return (
    <Formik
      initialValues={{
        nombres: initialValues?.nombres || '',
        apellidos: initialValues?.apellidos || '',
        fechaNacimiento: initialValues?.fechaNacimiento || '',
        dpi: initialValues?.dpi || '',
        nit: initialValues?.nit || '',
        direccion: initialValues?.direccion || '',
        email: initialValues?.email || '',
        telefono: initialValues?.telefono || '',
        isActive: initialValues?.isActive ?? true,
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, values, setFieldValue }) => (
        <Form>
          <VStack spacing={6}>
            {/* Campo para el nombre del cliente */}
            <Field name="nombres">
              {({ field }) => (
                <FormControl isInvalid={errors.nombres && touched.nombres} isDisabled={!isCreateMode && !isEditMode}>
                  <FormLabel htmlFor="nombres">Nombres del Cliente</FormLabel>
                  <Input {...field} id="nombres" placeholder="Ej: Juan" />
                  <FormErrorMessage>{errors.nombres}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Field name="apellidos">
              {({ field }) => (
                <FormControl isInvalid={errors.apellidos && touched.apellidos} isDisabled={!isCreateMode && !isEditMode}>
                  <FormLabel htmlFor="apellidos">Apellidos del Cliente</FormLabel>
                  <Input {...field} id="apellidos" placeholder="Ej: Pérez" />
                  <FormErrorMessage>{errors.apellidos}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Field name="fechaNacimiento">
              {({ field, form }) => (
                <FormControl isInvalid={errors.fechaNacimiento && touched.fechaNacimiento} isDisabled={!isCreateMode && !isEditMode}>
                  <FormLabel htmlFor="fechaNacimiento">Fecha de Nacimiento</FormLabel>
                  <Input 
                    {...field}
                    id="fechaNacimiento" 
                    type="date" 
                    value={field.value || ''}
                    onChange={(e) => form.setFieldValue('fechaNacimiento', e.target.value)}
                  />
                  <FormErrorMessage>{errors.fechaNacimiento}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Field name="dpi">
              {({ field }) => (
                <FormControl isInvalid={errors.dpi && touched.dpi} isDisabled={!isCreateMode && !isEditMode}>
                  <FormLabel htmlFor="dpi">DPI</FormLabel>
                  <Input 
                    {...field} 
                    id="dpi" 
                    placeholder="Ej: 1234567890123 (13 dígitos)" 
                    maxLength={13}
                    inputMode="numeric"
                  />
                  <FormErrorMessage>{errors.dpi}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Field name="nit">
              {({ field }) => (
                <FormControl isInvalid={errors.nit && touched.nit} isDisabled={!isCreateMode && !isEditMode}>
                  <FormLabel htmlFor="nit">NIT (Opcional)</FormLabel>
                  <Input 
                    {...field} 
                    id="nit" 
                    placeholder="Ej: 123456789 (1 a 13 dígitos)" 
                    maxLength={13}
                    inputMode="numeric"
                  />
                  <FormErrorMessage>{errors.nit}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Field name="direccion">
                {({ field }) => (
                    <FormControl isInvalid={errors.direccion && touched.direccion} isDisabled={!isCreateMode && !isEditMode}>
                    <FormLabel htmlFor="direccion">Dirección</FormLabel>
                    <Input {...field} id="direccion" placeholder="Ej: 5a Avenida 10-45 Zona 1" />
                    <FormErrorMessage>{errors.direccion}</FormErrorMessage>
                    </FormControl>
                )}
            </Field>

            <Field name="email">
                {({ field }) => (
                    <FormControl isInvalid={errors.email && touched.email} isDisabled={!isCreateMode && !isEditMode}>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <Input {...field} id="email" placeholder="Ej: cliente@ejemplo.com" />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>
                )}
            </Field>

            <Field name="telefono">
                {({ field }) => (
                    <FormControl isInvalid={errors.telefono && touched.telefono} isDisabled={!isCreateMode && !isEditMode}>
                    <FormLabel htmlFor="telefono">Teléfono</FormLabel>
                    <Input {...field} id="telefono" placeholder="Ej: 55541234" />
                    <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                    </FormControl>
                )}
            </Field>

            {/* Interruptor para el estado activo del cliente */}
            <FormControl as={HStack} justify="space-between" isDisabled={!isCreateMode && !isEditMode}>
              <FormLabel htmlFor="isActive" mb="0">¿Cliente Activo?</FormLabel>
              <Switch id="isActive" isChecked={values.isActive} onChange={(e) => setFieldValue('isActive', e.target.checked)} />
            </FormControl>

                   
            {/* Botón de envío visible según el modo */}
            {(isEditMode || isCreateMode) && (
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting} size="lg" mt={4}>
                {isCreateMode ? 'Crear Cliente' : 'Actualizar Cliente'}
              </Button>
            )}
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default ClientForm;
