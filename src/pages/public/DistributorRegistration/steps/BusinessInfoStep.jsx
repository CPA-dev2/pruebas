import React from 'react';
import { Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Heading, Textarea, RadioGroup, Radio, Stack
} from '@chakra-ui/react';

// 1. Exportar el schema de validación
export const validationSchema = Yup.object({
  telefono_negocio: Yup.string()
    .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos')
    .notRequired(),
  equipamiento: Yup.string().required('El equipamiento es obligatorio'),
  sucursales: Yup.string().required('Las sucursales son obligatorias'),
  antiguedad: Yup.string().required('La antigüedad es obligatoria'),
  productos_distribuidos: Yup.string().required('Los productos distribuidos son obligatorios'),
  tipo_persona: Yup.string().required('El tipo de persona es obligatorio')
});

// 2. Aceptar props de Formik
const BusinessInfoStep = ({ errors, touched, setFieldValue }) => {
  // 3. No hay <Formik>, <Form> ni handleSubmit
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" mb={4} fontWeight="semibold">
        Información del Negocio
      </Heading>
      
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
        
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Field name="tipo_persona">
            {({ field }) => (
              <FormControl isInvalid={errors.tipo_persona && touched.tipo_persona}>
                <FormLabel htmlFor="tipo_persona">Tipo de Persona *</FormLabel>
                <RadioGroup 
                  {...field} 
                  id="tipo_persona"
                  onChange={value => setFieldValue('tipo_persona', value)} // Usar setFieldValue de props
                  value={field.value}
                >
                  <Stack direction="row" spacing={5}>
                    <Radio value="individual">Individual</Radio>
                    <Radio value="juridica">Jurídica</Radio>
                  </Stack>
                </RadioGroup>
                <FormErrorMessage>{errors.tipo_persona}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>
        
        <GridItem>
          <Field name="telefono_negocio">
            {({ field }) => (
              <FormControl isInvalid={errors.telefono_negocio && touched.telefono_negocio}>
                <FormLabel htmlFor="telefono_negocio">Teléfono del Negocio (Opcional)</FormLabel>
                <Input {...field} id="telefono_negocio" placeholder="12345678" type="number" />
                <FormErrorMessage>{errors.telefono_negocio}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="equipamiento">
            {({ field }) => (
              <FormControl isInvalid={errors.equipamiento && touched.equipamiento}>
                <FormLabel htmlFor="equipamiento">Equipamiento *</FormLabel>
                <Select {...field} id="equipamiento" placeholder="Seleccionar equipamiento">
                  <option value="computadora_impresora">Computadora e Impresora</option>
                  <option value="solo_computadora">Solo Computadora</option>
                  <option value="ninguno">Ninguno</option>
                </Select>
                <FormErrorMessage>{errors.equipamiento}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem>
          <Field name="antiguedad">
            {({ field }) => (
              <FormControl isInvalid={errors.antiguedad && touched.antiguedad}>
                <FormLabel htmlFor="antiguedad">Antigüedad del Negocio *</FormLabel>
                <Select {...field} id="antiguedad" placeholder="Seleccionar antigüedad">
                  <option value="0-1">0-1 años</option>
                  <option value="1-3">1-3 años</option>
                  <option value="3-5">3-5 años</option>
                  <option value="5+">Más de 5 años</option>
                </Select>
                <FormErrorMessage>{errors.antiguedad}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>
        
        <GridItem>
          <Field name="productos_distribuidos">
            {({ field }) => (
              <FormControl isInvalid={errors.productos_distribuidos && touched.productos_distribuidos}>
                <FormLabel htmlFor="productos_distribuidos">Productos Distribuidos *</FormLabel>
                <Select {...field} id="productos_distribuidos" placeholder="Seleccionar productos">
                  <option value="Celulares">Celulares</option>
                  <option value="Electrodomésticos">Electrodomésticos</option>
                  <option value="Computadoras y laptops">Computadoras y laptops</option>
                  <option value="Celulares y electrodomésticos">Celulares y electrodomésticos</option>
                 </Select>
                <FormErrorMessage>{errors.productos_distribuidos}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>

        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Field name="sucursales">
            {({ field }) => (
              <FormControl isInvalid={errors.sucursales && touched.sucursales}>
                <FormLabel htmlFor="sucursales">Sucursales (direcciones) *</FormLabel>
                <Textarea {...field} id="sucursales" rows={3} placeholder="Si no tiene, escriba 'Ninguna'" />
                <FormErrorMessage>{errors.sucursales}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default BusinessInfoStep;