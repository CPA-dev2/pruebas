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
import { MdThumbUp, MdThumbDown, MdPanTool } from 'react-icons/md';
// Modal para agregar revisiones.
import AddRevisionModal from './AddRevisionModal';
// Componente para previsualizar archivos
import FilePreview from '../../../../components/Componentes_reutilizables/FilePreview';

// Tipos de documentos disponibles para listar en el select del modal
const TIPOS_DOCUMENTO = [
  { value: 'dpi_frontal', label: 'DPI (Frontal)' },
  { value: 'dpi_posterior', label: 'DPI (Posterior)' },
  { value: 'patente_comercio', label: 'Patente' },
  { value: 'rtu', label: 'RTU' },
  { value: 'otro', label: 'Otro' }
];
const api_url = import.meta.env.VITE_BACKEND_URL_FILES;



const DistributorValidateDocuments = ({ 
    distributorId, 
    initialDocuments = [], 
    handleError, 
    showSuccess,
    DistributorService,
    onRevisionAdded
}) => {
  const [documentos, setDocumentos] = useState(initialDocuments);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentRevision, setCurrentRevision] = useState({
        sectionName: '',
        fieldName: '',
        fieldLabel: ''
      });
  

  const handleOpenRevisionModal = (sectionName, fieldName, fieldLabel) => {
      setCurrentRevision({ sectionName, fieldName, fieldLabel });
      onOpen();
    };
  
  const handleSubmitRevision = async (revision) => {
      try {
        setIsSubmittingRevision(true);
        await DistributorService.createRevisions(distributorId, [revision]);
        showSuccess(`Revisión agregada exitosamente para el campo "${currentRevision.fieldLabel}"`);
        
        onClose();
        setCurrentRevision({ sectionName: '', fieldName: '', fieldLabel: '' });
        
        // Recargar los datos del distribuidor para mostrar la nueva revisión
        // Ojo refactor esto en assignments para refrescar la vista!
        if (onRevisionAdded) {
          await onRevisionAdded();
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsSubmittingRevision(false);
      }
    };
 
  // Obtener etiqueta del tipo de documento
  const getTipoDocumentoLabel = (tipo) => {
    const found = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    return found ? found.label : tipo;
  };

   const handleUpdateDocumentValidate = async (documentId) => {
        try {
           const documento = documentos.find(doc => doc.id === documentId);
           if(documento.estado === "verificado") {return;} 

          const response = await DistributorService.updateDocumentEstado(documentId, "verificado");
          if (response.data.data?.updateDocumentFromDistributor?.document) {
            // Actualizar la lista local de documentos
            setDocumentos(documentos.map(doc => 
              doc.id === documentId ? { ...doc, estado: "verificado" } : doc
            ));
            showSuccess('Documento actualizado', 'El documento se ha actualizado correctamente');
          } else {
            handleError('La actualización no fue confirmada por el servidor');
          }
        } catch (error) {
          handleError(error);
        }
      };

   const handleRejectDocument = async (documentId) => {
        try {
          const documento = documentos.find(doc => doc.id === documentId);
           if(documento.estado === "rechazado") {return;} 

          const response = await DistributorService.updateDocumentEstado(documentId, "rechazado");
          if (response.data.data?.updateDocumentFromDistributor?.document) {
            // Actualizar la lista local de documentos
            setDocumentos(documentos.map(doc => 
              doc.id === documentId ? { ...doc, estado: "rechazado" } : doc
            ));
            showSuccess('Documento rechazado', 'El documento se ha rechazado correctamente');
          } else {
            handleError('La actualización no fue confirmada por el servidor');
          }
        } catch (error) {
          handleError(error);
        }
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
            onClick={() => handleOpenRevisionModal('Información_documentos', 'Documento', 'Documento')}
            size="md"
          >
            <Text fontSize="sm">Agregar Revisión</Text>
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
                <Grid 
                  templateColumns={{ 
                    base: "1fr", 
                    md: "repeat(2, 1fr)", 
                    lg: "repeat(4, 1fr)" 
                  }} 
                  gap={4} 
                  alignItems="center"
                >
                  <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        TIPO DE DOCUMENTO
                      </Text>
                      <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                        {getTipoDocumentoLabel(documento.tipoDocumento)}
                      </Badge>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        ESTADO
                      </Text>
                      <Badge 
                        colorScheme={
                          documento.estado === 'verificado' ? 'green' : 
                          documento.estado === 'rechazado' ? 'red' : 
                          'gray'
                        } 
                        fontSize="sm" 
                        px={2} 
                        py={1}
                      >
                        {documento.estado === 'verificado' ? '✓ Verificado' : 
                         documento.estado === 'rechazado' ? '✗ Rechazado' : 
                         'Pendiente'}
                      </Badge>
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={{ base: 1, md: 2, lg: 2 }}>
                    <HStack justify={{ base: "flex-start", lg: "flex-end" }} spacing={2} flexWrap="wrap">
                      <Link href={`${api_url}/${documento.archivo}`} isExternal>
                        <IconButton
                          icon={<DownloadIcon />}
                          colorScheme="blue"
                          variant="ghost"
                          aria-label="Descargar documento"
                          size="sm"
                        />
                      </Link>

                      {/* NULL=no verificado, 'verificado'=aprobado, 'rechazado'=desestimado. */}
                      <IconButton
                        icon={<MdThumbDown />}
                        colorScheme={documento.estado === null ? "gray" : documento.estado === 'rechazado' ? "red" : "gray"}
                        variant="ghost"
                        aria-label="Rechazar documento"
                        onClick={() => handleRejectDocument(documento.id)}
                        size="md"
                      />
                
                      <IconButton
                        icon={<MdThumbUp />}
                        colorScheme={documento.estado === null ? "gray" : documento.estado === 'verificado' ? "green" : "gray"}
                        variant="ghost"
                        aria-label="Validar documento"
                        onClick={() => handleUpdateDocumentValidate(documento.id)}
                        size="md"
                      />
                    </HStack>
                  </GridItem>
                </Grid>

                {/* Vista previa del documento */}
                <Box mt={4} borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={2}>
                    VISTA PREVIA
                  </Text>
                  <FilePreview
                    fileUrl={`${api_url}/${documento.archivo}`}
                    fileName={getTipoDocumentoLabel(documento.tipoDocumento)}
                    height="300px"
                    downloadLabel={`Descargar ${getTipoDocumentoLabel(documento.tipoDocumento)}`}
                    colorScheme="orange"
                  />
                </Box>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

       {/* Modal para agregar nueva referencia */}
       <AddRevisionModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmitRevision}
        sectionName={'Información_documentos'}
        fieldName={'Documento'}
        fieldLabel={'Documento'}
        isSubmitting={isSubmittingRevision}
      />

    </Box>
  );
};

export default DistributorValidateDocuments;