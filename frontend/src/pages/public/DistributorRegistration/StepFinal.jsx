import React from 'react';
import { VStack, Heading, Text, Button, Center, Icon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

const StepFinal = () => {
  return (
    <Center py={10}>
      <VStack spacing={6} textAlign="center">
        <Icon as={CheckCircleIcon} w={24} h={24} color="green.500" />
        <Heading size="xl">¡Solicitud Enviada!</Heading>
        <Text fontSize="lg" color="gray.600">
            Gracias por completar tu registro. Tu expediente ha sido creado exitosamente y está en proceso de revisión.
        </Text>
        <Button colorScheme="brand" onClick={() => window.location.reload()} mt={4}>
            Volver al Inicio
        </Button>
      </VStack>
    </Center>
  );
};
export default StepFinal;