import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Select,
} from '@chakra-ui/react';

/**
 * Modal para agregar una revisión individual a un campo específico.
 * 
 * La mutación espera:
 * - distributorId: ID del distribuidor
 * - revisions: Array con un elemento { seccion, campo, comentarios }
 * 
 * Props:
 * - isOpen: Estado del modal
 * - onClose: Función para cerrar el modal
 * - onSubmit: Callback (revision) => void
 * - sectionName: Nombre de la sección (ej: "informacion_contacto")
 * - fieldName: Nombre del campo (ej: "telefono")
 * - fieldLabel: Label amigable del campo (ej: "Teléfono")
 * - isSubmitting: Estado de carga
 */

// Tipos de documentos disponibles para listar en el select del modal
const TIPOS_DOCUMENTO = [
  { value: 'dpi_frontal', label: 'DPI (Frontal)' },
  { value: 'dpi_posterior', label: 'DPI (Posterior)' },
  { value: 'patente_comercio', label: 'Patente' },
  { value: 'rtu', label: 'RTU' },
  { value: 'otro', label: 'Otro' }
];

const AddRevisionModal = ({
  isOpen,
  onClose,
  onSubmit,
  sectionName = '',
  fieldName = '',
  fieldLabel = '',
  isSubmitting = false
}) => {
  const [comentarios, setComentarios] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = () => {
    if (comentarios.trim() === '') {
      return;
    }

    const revision = {
      seccion: sectionName,
      campo: fieldName === 'Documento' ? tipoDocumento : fieldName,
      comentarios: comentarios.trim()
    };

    onSubmit(revision);
  };

  const handleClose = () => {
    setComentarios('');
    onClose();
  };

  const isValid = comentarios.trim() !== '';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="lg"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} borderRadius="xl" boxShadow="2xl">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          <Text fontSize="2xl" fontWeight="bold">
            Agregar Revisión
          </Text>
          <Text fontSize="md" fontWeight="normal" color="gray.500" mt={1}>
            Campo: <strong>{fieldLabel || fieldName}</strong>
          </Text>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            {/* Información */}
            <Alert status="info" borderRadius="md" size="sm">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                Describe qué debe corregirse en este campo. El distribuidor verá 
                estas observaciones para realizar los ajustes necesarios.
              </AlertDescription>
            </Alert>

            {/* Campos de solo lectura (información) */}
            <FormControl>
              <FormLabel fontSize="md" color="gray.600">Sección</FormLabel>
              <Input
                value={sectionName}
                isReadOnly
                bg="gray.50"
                fontSize="md"
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="md" color="gray.600">Campo</FormLabel>
              {fieldName === 'Documento' && (
                <Select
                  placeholder="Selecciona un tipo de documento"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  bg="gray.50"
                  fontSize="md"
                  borderColor={borderColor}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>
              )}
                {fieldName !== 'Documento' && (
                <Input
                    value={fieldName}
                    isReadOnly
                    bg="gray.50"
                    fontSize="md"
                    borderColor={borderColor}
                />
                )}
            </FormControl>
          

            {/* Campo editable */}
            <FormControl isRequired>
              <FormLabel fontSize="md" color="gray.700">
                Comentarios / Observaciones
              </FormLabel>
              <Textarea
                placeholder="Ej: El teléfono debe tener 8 dígitos y no contiene espacios..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows={5}
                fontSize="md"
                borderColor={borderColor}
                _focus={{
                  borderColor: 'orange.400',
                  boxShadow: '0 0 0 1px var(--chakra-colors-orange-400)'
                }}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                {comentarios.length} caracteres
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor} gap={3}>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            isDisabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            isDisabled={!isValid}
            isLoading={isSubmitting}
            loadingText="Guardando..."
          >
            Agregar Revisión
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddRevisionModal;
