import React from 'react';
import { VStack, Heading, Text, Button, Center, Icon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const StepFinal = () => {
  const navigate = useNavigate();
  return (
    <Center py={10}>
      <VStack spacing={6} textAlign="center">
        <Icon as={CheckCircleIcon} w={20} h={20} color="green.500" />
        <Heading size="xl">¡Solicitud Recibida!</Heading>
        <Text>Hemos recibido tu información. Te contactaremos pronto.</Text>
        <Button colorScheme="brand" onClick={() => navigate('/login')}>Volver al Inicio</Button>
      </VStack>
    </Center>
  );
};
export default StepFinal;