import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  FormControl, FormLabel, Input, FormErrorMessage, Button, VStack, Select,
} from '@chakra-ui/react';

/**
 * `validationSchema` define las reglas de validación para el formulario de usuario.
 * Utiliza una validación condicional para el campo `password`:
 * - Es obligatorio y debe tener un mínimo de 8 caracteres solo si `isCreateMode` es `true`.
 * - No es requerido al editar un usuario.
 */
const validationSchema = Yup.object({
  username: Yup.string().required('El nombre de usuario es obligatorio'),
  email: Yup.string().email('Email no válido').required('El email es obligatorio'),
  password: Yup.string().when('$isCreateMode', {
      is: true,
      then: (schema) => schema.min(8, 'La contraseña debe tener al menos 8 caracteres').required('La contraseña es obligatoria'),
      otherwise: (schema) => schema.notRequired(),
  }),
  rolId: Yup.string().notRequired(),
});

/**
 * `UserForm` es un formulario para crear o editar usuarios del sistema.
 *
 * Se adapta para mostrar u ocultar el campo de contraseña según si se está
 * en modo de creación o edición.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Function} props.onSubmit - Callback que se ejecuta al enviar el formulario.
 * @param {object} props.initialValues - Valores iniciales para los campos del formulario.
 * @param {boolean} [props.isSubmitting=false] - Indica si el formulario se está enviando.
 * @param {Array<object>} [props.roles=[]] - Lista de roles para poblar el selector. Cada rol debe tener `id` y `nombre`.
 * @param {boolean} [props.isCreateMode=true] - Si es `true`, muestra el campo de contraseña y lo hace obligatorio.
 */
const UserForm = ({ onSubmit, initialValues, isSubmitting, roles = [], isCreateMode = true }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      // Se pasa `isCreateMode` al contexto de Yup para la validación condicional.
      context={{ isCreateMode }}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched }) => (
        <Form>
          <VStack spacing={4}>
            {/* Campo para el nombre de usuario */}
            <Field name="username">
              {({ field }) => (
                <FormControl isInvalid={errors.username && touched.username}>
                  <FormLabel htmlFor="username">Nombre de Usuario</FormLabel>
                  <Input {...field} id="username" />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            {/* Campo para el email */}
            <Field name="email">
              {({ field }) => (
                <FormControl isInvalid={errors.email && touched.email}>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input {...field} id="email" type="email" />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            {/* El campo de contraseña solo se renderiza en modo de creación */}
            {isCreateMode && (
              <Field name="password">
                {({ field }) => (
                  <FormControl isInvalid={errors.password && touched.password}>
                    <FormLabel htmlFor="password">Contraseña</FormLabel>
                    <Input {...field} id="password" type="password" />
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            )}

            {/* Selector para asignar un rol al usuario */}
            <Field name="rolId">
              {({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="rolId">Rol</FormLabel>
                  <Select {...field} id="rolId" placeholder="Seleccionar rol">
                    {roles.map(rol => (
                      <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Field>

            {/* Botón de envío oculto para ser activado por un modal padre */}
            <Button id="user-form-submit" type="submit" style={{ display: 'none' }} isLoading={isSubmitting} />
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default UserForm;