import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Flex,
  Spinner,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import ClientForm from './ClientForm';
import ClientService from '../../../services/ClientService';
import { showSuccess, handleError } from '../../../services/NotificationService';

/**
 * `ClientEditPage` es una página dedicada para editar clientes existentes.
 * Carga los datos del cliente especificado por ID y utiliza el componente 
 * `ClientForm` en modo edición para permitir modificaciones.
 */
const ClientEditPage = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const textColor = useColorModeValue("gray.500", "gray.400");
  
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Carga los datos del cliente cuando el componente se monta.
   */
  useEffect(() => {
    const fetchClient = async () => {
      try {
        setIsLoading(true);
        const response = await ClientService.getClientById(clientId);
        setClient(response.data.data.client);
      } catch (error) {
        handleError(error);
        navigate('/clients'); // Redirige si hay error
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, navigate]);

  /**
   * Maneja el envío del formulario para actualizar el cliente.
   * @param {object} values - Los datos del formulario.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await ClientService.updateClient({ id: clientId, ...values });
      showSuccess('Cliente actualizado con éxito.');
      navigate('/clients'); // Redirige a la lista de clientes
    } catch (error) {
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

  /**
   * Muestra spinner mientras carga los datos.
   */
  if (isLoading) {
    return (
      <Center h="calc(100vh - 200px)">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  /**
   * Si no se encontró el cliente.
   */
  if (!client) {
    return (
      <Box>
        <Card borderRadius="xl" boxShadow="lg">
          <CardBody>
            <Center p={10}>
              <Text>Cliente no encontrado.</Text>
            </Center>
          </CardBody>
        </Card>
      </Box>
    );
  }

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
              <Heading size="lg">Editar Cliente</Heading>
              <Text color={textColor}>
                Modifica la información de {client.nombres} {client.apellidos}.
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
            initialValues={client}
            isEditMode={true}
            isSubmitting={isSubmitting}
          />
        </CardBody>
      </Card>
    </Box>
  );
};

export default ClientEditPage;