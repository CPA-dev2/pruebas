import React from 'react';
import { VStack, Heading, Text, Button, HStack, Box } from '@chakra-ui/react';

const Step6_Review = ({ formData, back, onSubmit, isSubmitting }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Revisión Final</Heading>
      <Box p={4} borderWidth="1px" borderRadius="md">
        <Text><strong>Nombre:</strong> {formData.nombres} {formData.apellidos}</Text>
        <Text><strong>NIT:</strong> {formData.nit}</Text>
        <Text><strong>Negocio:</strong> {formData.negocioNombre}</Text>
        <Text><strong>Refs:</strong> {formData.referencias.length}</Text>
      </Box>
      <HStack justify="space-between">
        <Button onClick={back}>Atrás</Button>
        <Button colorScheme="brand" onClick={onSubmit} isLoading={isSubmitting}>Enviar Solicitud</Button>
      </HStack>
    </VStack>
  );
};
export default Step6_Review;