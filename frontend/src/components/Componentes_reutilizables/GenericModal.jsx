import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * `GenericModal` es un componente wrapper reutilizable sobre el Modal de Chakra UI
 * para estandarizar la apariencia y el comportamiento de los modales en la aplicación.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {boolean} props.isOpen - Booleano que controla la visibilidad del modal.
 * @param {Function} props.onClose - Función que se invoca cuando el usuario intenta cerrar el modal (ej. clic en el botón de cerrar, overlay, o tecla Esc).
 * @param {string} props.title - El título que se muestra en el encabezado del modal.
 * @param {React.ReactNode} props.children - El contenido (elementos JSX) que se renderiza en el cuerpo del modal.
 * @param {Function} props.onConfirm - La función que se ejecuta al hacer clic en el botón de acción principal (confirmación).
 * @param {string} [props.confirmButtonText='Confirmar'] - Texto para el botón de confirmación.
 * @param {string} [props.cancelButtonText='Cancelar'] - Texto para el botón de cancelación.
 * @param {boolean} [props.isConfirming=false] - Si es `true`, el botón de confirmación mostrará un estado de carga. Útil para feedback durante operaciones asíncronas.
 */
const GenericModal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  isConfirming = false,
}) => {
  const modalBg = useColorModeValue('white', 'navy.800');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg}>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button
            colorScheme="blue"
            onClick={onConfirm}
            isLoading={isConfirming}
            loadingText="Confirmando..."
          >
            {confirmButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GenericModal;