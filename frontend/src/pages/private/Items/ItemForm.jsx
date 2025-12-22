import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  FormErrorMessage,
  Button,
  VStack,
} from '@chakra-ui/react';

/**
 * `validationSchema` define las reglas de validación para el formulario de items
 * utilizando Yup. Se asegura de que los datos ingresados por el usuario sean válidos
 * antes de enviarlos.
 */
const validationSchema = Yup.object({
  nombre: Yup.string()
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .required('El nombre es obligatorio'),
  descripcion: Yup.string(),
});

/**
 * `ItemForm` es un componente de formulario reutilizable para crear y editar items.
 *
 * Utiliza Formik para la gestión del estado del formulario y Yup para la validación.
 * Está diseñado para ser utilizado dentro de un modal o en una página dedicada.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Function} props.onSubmit - La función a ejecutar cuando el formulario es enviado
 *   y la validación es exitosa. Recibe los valores del formulario como argumento.
 * @param {object} props.initialValues - Un objeto con los valores iniciales para los
 *   campos del formulario (ej. `{ nombre: '', descripcion: '' }`). Esencial para
 *   poblar el formulario en modo de edición.
 * @param {boolean} props.isSubmitting - Un booleano que indica si el proceso de envío
 *   está en curso, para mostrar un estado de carga en el botón de envío.
 */
const ItemForm = ({ onSubmit, initialValues, isSubmitting }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
      // `enableReinitialize` es crucial para que el formulario se actualice
      // cuando `initialValues` cambia, por ejemplo, al abrir el modal para
      // editar un item diferente.
      enableReinitialize
    >
      {({ errors, touched }) => (
        <Form>
          <VStack spacing={4}>
            <Field name="nombre">
              {({ field }) => (
                <FormControl isInvalid={errors.nombre && touched.nombre}>
                  <FormLabel htmlFor="nombre">Nombre</FormLabel>
                  <Input {...field} id="nombre" placeholder="Nombre del item" />
                  <FormErrorMessage>{errors.nombre}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Field name="descripcion">
              {({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="descripcion">Descripción</FormLabel>
                  <Textarea {...field} id="descripcion" placeholder="Descripción (opcional)" />
                </FormControl>
              )}
            </Field>

            {/*
              Este botón de envío está oculto. La sumisión del formulario se
              desencadena externamente (por ejemplo, desde el botón "Guardar"
              de un componente modal) haciendo clic en este botón mediante su ID.
            */}
            <Button
              id="item-form-submit"
              type="submit"
              style={{ display: 'none' }}
              isLoading={isSubmitting}
            />
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default ItemForm;
