import React from 'react';
import { Box, Text, VStack, Grid, GridItem, Card, CardBody, Heading, Divider } from '@chakra-ui/react';

const ReviewStep = ({ formData}) => {
  return (
    <VStack spacing={6} w="full">
      <Text textAlign="center" fontSize="lg" fontWeight="bold" mb={4}>
        Revisa tu información antes de enviar
      </Text>
      
      <Grid templateColumns="repeat(1, 1fr)" gap={6} w="full">
        {/* Información Personal */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4} color="orange.600">Información Personal</Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <ReviewItem label="Nombres" value={formData.nombres} />
              <ReviewItem label="Apellidos" value={formData.apellidos} />
              <ReviewItem label="DPI" value={formData.dpi} />
              <ReviewItem label="Email" value={formData.correo} />
              <ReviewItem label="Teléfono" value={formData.telefono} />
              <ReviewItem label="Tipo de Persona" value={formData.tipoPersona} />
            </Grid>
          </CardBody>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4} color="orange.600">Ubicación</Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <ReviewItem label="Departamento" value={formData.departamento} />
              <ReviewItem label="Municipio" value={formData.municipio} />
              <GridItem colSpan={2}>
                <ReviewItem label="Dirección" value={formData.direccion} />
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* Información del Negocio */}
        {formData.negocioNombre && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4} color="orange.600">Información del Negocio</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <ReviewItem label="Antigüedad" value={`${formData.antiguedad} años`} />
                <ReviewItem label="Teléfono del Negocio" value={formData.telefonoNegocio} />
              </Grid>
            </CardBody>
          </Card>
        )}

        {/* Información Bancaria */}
        {formData.banco && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4} color="orange.600">Información Bancaria</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <ReviewItem label="Banco" value={formData.banco} />
                <ReviewItem label="Tipo de Cuenta" value={formData.tipoCuenta} />
                <ReviewItem label="Número de Cuenta" value={formData.numeroCuenta} />
                <ReviewItem label="Nombre de Cuenta" value={formData.cuentaBancaria} />
              </Grid>
            </CardBody>
          </Card>
        )}
      </Grid>
    </VStack>
  );
};

const ReviewItem = ({ label, value }) => {
  if (!value) return null;
  
  return (
    <GridItem>
      <VStack align="start" spacing={1}>
        <Text fontSize="sm" fontWeight="bold" color="gray.600">
          {label}
        </Text>
        <Text fontSize="md">
          {value}
        </Text>
      </VStack>
    </GridItem>
  );
};

export default ReviewStep;