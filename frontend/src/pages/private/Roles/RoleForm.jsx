import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  FormControl, FormLabel, Input, FormErrorMessage, Button, VStack, Switch, HStack, Text
} from '@chakra-ui/react';

/**
 * Esquema de validación para el formulario de roles.
 * Solo requiere que el nombre del rol esté presente.
 */
const validationSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
});

/**
 * `RoleForm` es un formulario versátil para crear, editar y visualizar roles.
 *
 * Su comportamiento se controla mediante las props `isCreateMode` y `isEditMode`:
 * - **Modo Creación (`isCreateMode={true}`):** Muestra solo los campos esenciales (nombre, activo).
 * - **Modo Edición (`isEditMode={true}`):** Muestra todos los campos y los habilita para edición.
 * - **Modo Visualización (`isCreateMode={false}`, `isEditMode={false}`):** Muestra todos los campos deshabilitados.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Function} props.onSubmit - Callback que se ejecuta al enviar el formulario.
 * @param {object} [props.initialValues] - Valores iniciales para poblar el formulario.
 * @param {boolean} [props.isSubmitting=false] - Indica si el formulario está en proceso de envío.
 * @param {boolean} [props.isEditMode=false] - Activa el modo de edición.
 * @param {boolean} [props.isCreateMode=false] - Activa el modo de creación.
 */
const RoleForm = ({ onSubmit, initialValues, isSubmitting, isEditMode = false, isCreateMode = false }) => {
  return (
    <Formik
      initialValues={{
        nombre: initialValues?.nombre || '',
        isActive: initialValues?.isActive ?? true,
        canCreateItems: initialValues?.canCreateItems || false,
        canUpdateItems: initialValues?.canUpdateItems || false,
        canDeleteItems: initialValues?.canDeleteItems || false,
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, values, setFieldValue }) => (
        <Form>
          <VStack spacing={6}>
            {/* Campo para el nombre del rol */}
            <Field name="nombre">
              {({ field }) => (
                <FormControl isInvalid={errors.nombre && touched.nombre} isDisabled={!isCreateMode && !isEditMode}>
                  <FormLabel htmlFor="nombre">Nombre del Rol</FormLabel>
                  <Input {...field} id="nombre" placeholder="Ej: Editor" />
                  <FormErrorMessage>{errors.nombre}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            {/* Interruptor para el estado activo del rol */}
            <FormControl as={HStack} justify="space-between" isDisabled={!isCreateMode && !isEditMode}>
              <FormLabel htmlFor="isActive" mb="0">¿Rol Activo?</FormLabel>
              <Switch id="isActive" isChecked={values.isActive} onChange={(e) => setFieldValue('isActive', e.target.checked)} />
            </FormControl>

            {/* La sección de permisos solo se muestra en modo de edición o visualización */}
            {!isCreateMode && (
              <VStack spacing={4} align="stretch" w="full">
                <Text fontWeight="bold" mt={4}>Permisos sobre Items:</Text>
                {/* Los interruptores de permisos solo están habilitados en modo edición */}
                <FormControl as={HStack} justify="space-between" isDisabled={!isEditMode}>
                  <FormLabel htmlFor="canCreateItems" mb="0">Crear Items</FormLabel>
                  <Switch id="canCreateItems" isChecked={values.canCreateItems} onChange={(e) => setFieldValue('canCreateItems', e.target.checked)} />
                </FormControl>
                <FormControl as={HStack} justify="space-between" isDisabled={!isEditMode}>
                  <FormLabel htmlFor="canUpdateItems" mb="0">Editar Items</FormLabel>
                  <Switch id="canUpdateItems" isChecked={values.canUpdateItems} onChange={(e) => setFieldValue('canUpdateItems', e.target.checked)} />
                </FormControl>
                <FormControl as={HStack} justify="space-between" isDisabled={!isEditMode}>
                  <FormLabel htmlFor="canDeleteItems" mb="0">Eliminar Items</FormLabel>
                  <Switch id="canDeleteItems" isChecked={values.canDeleteItems} onChange={(e) => setFieldValue('canDeleteItems', e.target.checked)} />
                </FormControl>
              </VStack>
            )}

            {/* El botón de guardar solo es visible en modo de edición */}
            {isEditMode && (
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
                Guardar Cambios
              </Button>
            )}

            {/* Botón de envío oculto para ser activado por un modal padre en modo creación */}
            <Button id="role-form-submit" type="submit" style={{ display: 'none' }} />
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default RoleForm;