import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardBody, CardHeader, Heading, Text, Spinner, Center, Badge, Button, Flex, Grid, GridItem, HStack, Icon, useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon, CalendarIcon, EditIcon, AtSignIcon, InfoIcon } from '@chakra-ui/icons';
import { MdVerifiedUser } from "react-icons/md";
import UserService from "../../../services/UserServices";
import { handleError } from '../../../services/NotificationService';

/**
 * `InfoDetail` es un componente de UI para mostrar un dato específico de un usuario.
 *
 * @param {object} props - Propiedades del componente.
 * @param {React.ElementType} props.icon - El ícono a mostrar junto a la etiqueta.
 * @param {string} props.label - La etiqueta descriptiva del dato.
 * @param {string} props.value - El valor del dato a mostrar.
 */
const InfoDetail = ({ icon, label, value }) => {
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  return (
    <Box>
      <HStack spacing={3} mb={1}>
        <Icon as={icon} color="blue.500" />
        <Heading size="xs" textTransform="uppercase" color={labelColor}>
          {label}
        </Heading>
      </HStack>
      <Text pl={8} fontSize="md" fontWeight="medium">
        {value}
      </Text>
    </Box>
  );
};

/**
 * `UserDetailPage` muestra la vista de detalle de un usuario específico.
 *
 * Obtiene el ID del usuario de la URL, busca sus datos en la API y los presenta
 * en una tarjeta. Maneja los estados de carga y los casos en que el usuario no se encuentra.
 */
const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Obtiene los datos del usuario. Si no lo encuentra o hay un error,
     * notifica al usuario y lo redirige a la lista de usuarios.
     */
    const fetchUser = async () => {
      try {
        const response = await UserService.getUserById(userId);
        if (response.data.data.user) {
          setUser(response.data.data.user);
        } else {
          throw new Error('Usuario no encontrado');
        }
      } catch (error) {
        handleError('No se pudo cargar el usuario.');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };
    
    // Se asegura de que la llamada a la API solo se ejecute si el ID del usuario existe.
    if (userId) {
        fetchUser();
    }
  }, [userId, navigate]);

  if (loading) {
    return <Center h="calc(100vh - 150px)"><Spinner size="xl" color="blue.500" /></Center>;
  }

  if (!user) {
    return <Center h="calc(100vh - 150px)"><Text fontSize="xl">Usuario no encontrado.</Text></Center>;
  }

  return (
    <Box>
      <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} mb={6} variant="outline">
        Volver a la lista
      </Button>
      <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
        <CardHeader bg={useColorModeValue('gray.50', 'gray.700')} borderBottomWidth="1px" p={6}>
          <Flex justify="space-between" align="center">
            <Heading size="lg">{user.username}</Heading>
            <HStack>
                {/* Muestra una insignia especial si el usuario es superusuario */}
                {user.isSuperuser && <Badge fontSize="md" px={4} py={2} borderRadius="full" colorScheme='purple'>Superusuario</Badge>}
                <Badge fontSize="md" px={4} py={2} borderRadius="full" colorScheme={user.isActive ? 'green' : 'red'}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody p={8}>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
            <GridItem>
              <InfoDetail icon={InfoIcon} label="Nombre Completo" value={`${user.firstName || ''} ${user.lastName || 'No especificado'}`} />
            </GridItem>
            <GridItem>
              <InfoDetail icon={AtSignIcon} label="Email" value={user.email} />
            </GridItem>
            <GridItem>
              <InfoDetail icon={MdVerifiedUser} label="Rol" value={user.rol?.nombre || 'Sin rol asignado'} />
            </GridItem>
            <GridItem>
              <InfoDetail icon={CalendarIcon} label="Fecha de Creación" value={new Date(user.created).toLocaleString()} />
            </GridItem>
            <GridItem>
              <InfoDetail icon={EditIcon} label="Última Modificación" value={new Date(user.modified).toLocaleString()} />
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default UserDetailPage;