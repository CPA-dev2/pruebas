import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardBody, CardHeader, Heading, Spinner, Center, Button, Flex, useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import RoleService from '../../../services/RoleService';
import { handleError, showSuccess } from '../../../services/NotificationService';
import RoleForm from './RoleForm';

/**
 * `RoleEditPage` es una página que permite tanto visualizar como editar los detalles de un rol.
 *
 * Funciona en dos modos, controlados por el estado `isEditMode`:
 * 1. **Modo Visualización:** Muestra los datos del rol en un formulario deshabilitado.
 * 2. **Modo Edición:** Habilita el formulario para que el usuario pueda modificar los datos.
 *
 * La página obtiene los datos del rol al montarse y gestiona el proceso de actualización.
 */
const RoleEditPage = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();

  // Estado para almacenar los datos del rol.
  const [role, setRole] = useState(null);
  // Estado para la carga inicial de datos.
  const [loading, setLoading] = useState(true);
  // Estado para alternar entre el modo de visualización y edición.
  const [isEditMode, setIsEditMode] = useState(false);
  // Estado para el envío del formulario de actualización.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efecto para obtener los datos del rol cuando el componente se monta o el ID cambia.
  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const response = await RoleService.getRoleById(roleId);
        if (response.data.data.rol) {
          setRole(response.data.data.rol);
        } else {
          throw new Error('Rol no encontrado');
        }
      } catch (error) {
        handleError('No se pudo cargar el rol.');
        navigate('/roles');
      } finally {
        setLoading(false);
      }
    };
    if (roleId) fetchRole();
  }, [roleId, navigate]);
  
  /**
   * Maneja el envío del formulario de edición.
   * Envía los datos actualizados al servicio, muestra una notificación,
   * sale del modo de edición y vuelve a cargar los datos del rol para reflejar los cambios.
   * @param {object} values - Los valores del formulario enviados por Formik.
   */
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await RoleService.updateRole({ id: role.id, ...values });
      showSuccess('Rol actualizado con éxito.');
      setIsEditMode(false); // Salir del modo edición tras guardar.
      // Volver a cargar los datos para mostrar la información actualizada.
      const response = await RoleService.getRoleById(roleId);
      setRole(response.data.data.rol);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Center h="calc(100vh - 150px)"><Spinner size="xl" /></Center>;

  return (
    <Box>
      <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/roles')} mb={6} variant="outline">
        Volver a la lista
      </Button>
      <Card borderRadius="xl" boxShadow="lg">
        <CardHeader bg={useColorModeValue('gray.50', 'gray.700')} borderBottomWidth="1px" p={6}>
          <Flex justify="space-between" align="center">
            {/* El título cambia dinámicamente según el modo */}
            <Heading size="lg">{isEditMode ? `Editando: ${role.nombre}` : `Detalle: ${role.nombre}`}</Heading>
            {/* Botón para alternar entre modo visualización y edición */}
            <Button
              leftIcon={isEditMode ? <ViewIcon /> : <EditIcon />}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Modo Ver' : 'Modo Editar'}
            </Button>
          </Flex>
        </CardHeader>
        <CardBody p={8}>
          {/* El RoleForm se reutiliza para mostrar y editar los datos */}
          <RoleForm
            onSubmit={handleSubmit}
            initialValues={role}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
          />
        </CardBody>
      </Card>
    </Box>
  );
};

export default RoleEditPage;