import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  Text,
  Card,
  CardBody,
  IconButton,
  HStack,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Link,
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DeleteIcon, AddIcon, DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';



// Tipos de documentos disponibles para listar en el select del modal
const TIPOS_DOCUMENTO = [
  { value: 'dpi_frontal', label: 'DPI (Frontal)' },
  { value: 'dpi_posterior', label: 'DPI (Posterior)' },
  { value: 'patente_comercio', label: 'Patente' },
  { value: 'rtu', label: 'RTU' },
  { value: 'otro', label: 'Otro' }
];
const api_url = import.meta.env.VITE_BACKEND_URL_FILES;


// Esquema de validación para nuevo documento
const documentValidationSchema = Yup.object({
  tipoDocumento: Yup.string().required('Tipo de documento es requerido'),
  archivo: Yup.mixed()
    .required('Archivo es requerido')
    .test('fileSize', 'El archivo es muy grande (máximo 5MB)', (value) => {
      if (!value) return false;
      return value.size <= 5 * 1024 * 1024; // 5MB
    })
    .test('fileType', 'Solo se permiten archivos PDF o imágenes (JPG, PNG, JPEG)', (value) => {
      if (!value) return false;
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      return validTypes.includes(value.type);
    }),
});

const DistributorEditDocuments = ({ 
    distributorId, 
    initialDocuments = [], 
    handleError, 
    showSuccess,
    DistributorService
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [documentos, setDocumentos] = useState(initialDocuments);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Manejar subir nuevo documento
  const handleUploadDocument = async (values, { setSubmitting, resetForm }) => {
    try {
      setUploadingDoc(true);
      console.log('Subiendo nuevo documento:', values);
      
      const response = await DistributorService.uploadSingleDocument(
        distributorId,
        values.tipoDocumento,
        values.archivo
      );

      const newDocument = response.data.data.addDocumentToDistributor.document;

      // Actualizar la lista local de documentos
      setDocumentos([...documentos, newDocument]);

      showSuccess('Documento subido', 'El documento se ha subido correctamente');

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error al subir documento:', error);
        handleError(error);
    } finally {
      setSubmitting(false);
      setUploadingDoc(false);
    }
  };

  // Manejar eliminar documento
  const handleDeleteDocument = async (documentId) => {
    try {
      setDeletingId(documentId);
      
      if (!documentId) {
        throw new Error('ID de documento no válido');
      }
      
      const response = await DistributorService.deleteDocument(documentId);
      
      // Verificar si hay errores en la respuesta GraphQL
      if (response.data.errors) {
        const errorMessages = response.data.errors.map(e => e.message).join(', ');
        handleError(`Error al eliminar documento: ${errorMessages}`);
        return;
      }
      
      // Verificar si la mutación fue exitosa
      if (response.data.data?.deleteDocumentFromDistributor?.success) {
        // Actualizar la lista local de documentos
        setDocumentos(documentos.filter(doc => doc.id !== documentId));

        showSuccess('Documento eliminado', 'El documento se ha eliminado correctamente');
      } else {
        handleError('La eliminación no fue confirmada por el servidor');
        return;
      }
    } catch (error) {
      
        handleError(error);
    } finally {
      setDeletingId(null);
    }
  };

  // Obtener etiqueta del tipo de documento
  const getTipoDocumentoLabel = (tipo) => {
    const found = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    return found ? found.label : tipo;
  };



  return (
    <Box p={8}>
      <Box mb={6}>
        <HStack justify="space-between" align="center">
          <Box>
            <Heading color="orange.600">Documentos del Distribuidor</Heading>
            <Text color="gray.600">
              Gestiona los documentos oficiales del distribuidor
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="orange"
            onClick={onOpen}
            size="md"
          >
            Subir Documento
          </Button>
        </HStack>
      </Box>

      {/* Lista de documentos */}
      <VStack spacing={4} align="stretch">
        {documentos.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <AttachmentIcon boxSize={12} color="gray.400" mb={4} />
              <Text color="gray.500" fontSize="lg">
                No hay documentos registrados
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Sube el primer documento haciendo clic en el botón "Subir Documento"
              </Text>
            </CardBody>
          </Card>
        ) : (
          documentos.map((documento) => (
            <Card key={documento.id} variant="outline">
              <CardBody>
                <Grid templateColumns="repeat(4, 1fr)" gap={4} alignItems="center">
                  <GridItem colSpan={1}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        TIPO DE DOCUMENTO
                      </Text>
                      <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                        {getTipoDocumentoLabel(documento.tipoDocumento)}
                      </Badge>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={2}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        SUBIDO
                      </Text>
                      
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <HStack justify="flex-end" spacing={2}>
                      <Link href={`${api_url}/${documento.archivo}`} isExternal>
                        <IconButton
                          icon={<DownloadIcon />}
                          colorScheme="blue"
                          variant="ghost"
                          aria-label="Descargar documento"
                          size="sm"
                        />
                      </Link>
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        aria-label="Eliminar documento"
                        onClick={() => handleDeleteDocument(documento.id)}
                        isLoading={deletingId === documento.id}
                        size="sm"
                      />
                    </HStack>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

      {/* Modal para subir nuevo documento */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="orange.600">Subir Nuevo Documento</ModalHeader>
          <ModalCloseButton />

          <Formik
            initialValues={{
              tipoDocumento: '',
              archivo: null,
            }}
            validationSchema={documentValidationSchema}
            onSubmit={handleUploadDocument}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4}>
                    <Field name="tipoDocumento">
                      {({ field }) => (
                        <FormControl isInvalid={errors.tipoDocumento && touched.tipoDocumento}>
                          <FormLabel>Tipo de Documento</FormLabel>
                          <Select
                            {...field}
                            placeholder="Selecciona el tipo de documento"
                          >
                            {TIPOS_DOCUMENTO.map((tipo) => (
                              <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </option>
                            ))}
                          </Select>
                          <FormErrorMessage>{errors.tipoDocumento}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <FormControl isInvalid={errors.archivo && touched.archivo}>
                      <FormLabel>Archivo (PDF o Imagen)</FormLabel>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) => {
                          const file = event.currentTarget.files[0];
                          setFieldValue('archivo', file);
                        }}
                        sx={{
                          '::file-selector-button': {
                            height: '40px',
                            padding: '0 16px',
                            mr: 4,
                            bg: 'orange.500',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'md',
                            cursor: 'pointer',
                            _hover: {
                              bg: 'orange.600',
                            },
                          },
                        }}
                      />
                      <FormErrorMessage>{errors.archivo}</FormErrorMessage>
                      {values.archivo && (
                        <Text fontSize="sm" color="gray.600" mt={2}>
                            {values.archivo.name} ({(values.archivo.size / 1024 / 1024).toFixed(2)} MB)
                        </Text>
                      )}
                    </FormControl>

                    <Box
                      bg="blue.50"
                      p={4}
                      borderRadius="md"
                      w="full"
                      borderLeft="4px"
                      borderColor="blue.500"
                    >
                      <Text fontSize="sm" color="blue.800">
                        <strong>ℹNota:</strong> Se permiten archivos PDF o imágenes (JPG, PNG) con un tamaño máximo de 5 MB.
                      </Text>
                    </Box>
                  </VStack>
                </ModalBody>

                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="orange"
                    isLoading={isSubmitting || uploadingDoc}
                    loadingText="Subiendo..."
                    isDisabled={!values.archivo || !values.tipoDocumento}
                  >
                    Subir Documento
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DistributorEditDocuments;
