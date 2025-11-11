import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import ClientForm from './ClientForm';
import ClientService from '../../../services/ClientService';
import { showSuccess, handleError } from '../../../services/NotificationService';

/**
 * `ClientCreatePage` es una página dedicada para crear nuevos clientes.
 * 
 * Utiliza el componente `ClientForm` en modo creación y maneja
 * el envío del formulario y la navegación.
 */
const ClientCreatePage = () => {
  const navigate = useNavigate();
  const textColor = useColorModeValue("gray.500", "gray.400");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Maneja el envío del formulario para crear un nuevo cliente.
   * @param {object} values - Los datos del formulario.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await ClientService.createClient(values);
      showSuccess('Cliente creado con éxito.');
      navigate('/clients'); // Redirige a la lista de clientes
    } catch (error) {
      console.error('Error al crear cliente:', error);
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navega de vuelta a la lista de clientes.
   */
  const handleBack = () => {
    navigate('/clients');
  };

  return (
    <Box>
      <Card borderRadius="xl" boxShadow="lg">
        <CardHeader borderBottomWidth="1px" p={4}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            gap={4}
          >
            <Box>
              <Heading size="lg">Crear Nuevo Cliente</Heading>
              <Text color={textColor}>
                Completa la información para crear un nuevo cliente.
              </Text>
            </Box>
            <Button 
              leftIcon={<ArrowBackIcon />} 
              variant="outline" 
              onClick={handleBack}
            >
              Volver a Clientes
            </Button>
          </Flex>
        </CardHeader>

        <CardBody p={6}>
          <ClientForm
            onSubmit={handleSubmit}
            isCreateMode={true}
            isSubmitting={isSubmitting}
          />
        </CardBody>
      </Card>
    </Box>
  );
};

export default ClientCreatePage;