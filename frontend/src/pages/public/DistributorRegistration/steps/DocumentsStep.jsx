import React, { useEffect, useRef } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, Button, Alert, AlertIcon, 
  Text, Box, Heading
} from '@chakra-ui/react';
import FileUploader from '../../../../components/Componentes_reutilizables/FileUpload/FileUploader';

// VALIDACIÓN MEJORADA PARA DOCUMENTOS
const validationSchema = Yup.object({
  documentos: Yup.array()
    .min(4, 'Debes subir al menos los 4 documentos obligatorios')
    .test('required-documents', 'Faltan documentos obligatorios', function(documentos) {
      const requeridos = ['dpi_frontal', 'dpi_posterior', 'rtu', 'patente_comercio'];
      const subidos = documentos?.map(doc => doc.tipo) || [];
      
      const faltantes = requeridos.filter(tipo => !subidos.includes(tipo));
      
      if (faltantes.length > 0) {
        const labels = {
          'dpi_frontal': 'DPI Frontal',
          'dpi_posterior': 'DPI Posterior',
          'rtu': 'RTU',
          'patente_comercio': 'Patente de Comercio'
        };
        const faltantesTexto = faltantes.map(tipo => labels[tipo]).join(', ');
        return this.createError({
          message: `Faltan los siguientes documentos: ${faltantesTexto}`
        });
      }


      //validar el tipo de documento rtu debe ser pdf y no debe ser mayor a 5mb
      const rtuDoc = documentos.find(doc => doc.tipo === 'rtu');
      if (rtuDoc) {
        if (rtuDoc.archivo && rtuDoc.archivo.type !== 'application/pdf') {
          return this.createError({
            message: 'El documento RTU debe ser un archivo PDF'
          });
        }
        
        if (rtuDoc.archivo && rtuDoc.archivo.size > 5 * 1024 * 1024) {
          return this.createError({
            message: 'El documento RTU no debe superar los 5MB'
          });
        }
      }

      // Validar que el resto de documentos sean imagenes (jpeg, png) y no mayores a 5MB
      for (const doc of documentos) {
        if (doc.tipo !== 'rtu') {
          if (doc.archivo && 
              !['image/jpeg', 'image/png'].includes(doc.archivo.type)) {
            return this.createError({
              message: `El documento ${doc.tipo} debe ser una imagen JPEG o PNG`
            });
          }
          
          if (doc.archivo && doc.archivo.size > 5 * 1024 * 1024) {
            return this.createError({
              message: `El documento ${doc.tipo} no debe superar los 5MB`
            });
          }
        }
      }

      return true;
    })
    .test('valid-files', 'Hay archivos con problemas', function(documentos) {
      if (!documentos || documentos.length === 0) return true;
      
      for (const doc of documentos) {
        if (!doc.archivo || !(doc.archivo instanceof File)) {
          return this.createError({
            message: `El archivo ${doc.tipo} no es válido`
          });
        }
        
        // Validar tamaño máximo 10MB
        if (doc.archivo.size > 5 * 1024 * 1024) {
          return this.createError({
            message: `El archivo ${doc.tipo} no debe superar 5MB`
          });
        }
      }
      
      return true;
    })
});

const DocumentsStep = ({ formData, updateFormData, onNext }) => {
  
  // REF PARA CACHEAR URLs DE PREVIEW
  const previewUrlsRef = useRef(new Map());
  
  // CLEANUP SOLO AL DESMONTAR EL COMPONENTE
  useEffect(() => {
    return () => {
      // Limpiar URLs cacheadas al desmontar
      previewUrlsRef.current.forEach((url, key) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
          
        }
      });
      previewUrlsRef.current.clear();
    };
  }, []); // Solo al desmontar
  
  // FUNCIÓN PARA MANEJAR SUBIDA DE ARCHIVOS
  const handleFileUpload = (fileData, setFieldValue, currentValues) => {
    const nuevosDocumentos = [...(currentValues.documentos || [])];
    const index = nuevosDocumentos.findIndex(doc => doc.tipo === fileData.type);
    
    // Si ya existe, limpiar el anterior
    if (index >= 0) {
      const docAnterior = nuevosDocumentos[index];
      const claveAnterior = `${docAnterior.tipo}_${docAnterior.nombre}_${docAnterior.tamaño}`;
      
      // Limpiar cache y preview anterior
      if (previewUrlsRef.current.has(claveAnterior)) {
        const urlAnterior = previewUrlsRef.current.get(claveAnterior);
        URL.revokeObjectURL(urlAnterior);
        previewUrlsRef.current.delete(claveAnterior);
      }
    }
    
    // Crear nuevo documento
    const nuevoDocumento = {
      tipo: fileData.type,
      archivo: fileData.file,
      preview: fileData.preview,
      nombre: fileData.file.name,
      tamaño: fileData.file.size,
      fechaSubida: new Date().toISOString()
    };
    
    // Guardar en cache
    const nuevaClave = `${fileData.type}_${fileData.file.name}_${fileData.file.size}`;
    previewUrlsRef.current.set(nuevaClave, fileData.preview);
    
    if (index >= 0) {
      nuevosDocumentos[index] = nuevoDocumento;
    } else {
      nuevosDocumentos.push(nuevoDocumento);
    }
    
    setFieldValue('documentos', nuevosDocumentos);
    
  };
  
  // FUNCIÓN PARA REMOVER ARCHIVOS
  const handleFileRemove = (tipo, setFieldValue, currentValues) => {
    const documentoARemover = currentValues.documentos?.find(doc => doc.tipo === tipo);
    
    if (documentoARemover) {
      // Limpiar cache
      const clave = `${documentoARemover.tipo}_${documentoARemover.nombre}_${documentoARemover.tamaño}`;
      if (previewUrlsRef.current.has(clave)) {
        const url = previewUrlsRef.current.get(clave);
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(clave);
      }
      
      // Limpiar preview
      if (documentoARemover.preview && documentoARemover.preview.startsWith('blob:')) {
        URL.revokeObjectURL(documentoARemover.preview);
      }
    }
    
    const nuevosDocumentos = currentValues.documentos?.filter(doc => doc.tipo !== tipo) || [];
    setFieldValue('documentos', nuevosDocumentos);
  };
  
  // HELPER PARA OBTENER DOCUMENTO POR TIPO
  // HELPER PARA OBTENER DOCUMENTO CON PREVIEW GARANTIZADO
  const getDocumentoByTipo = (documentos, tipo) => {
    const documento = documentos?.find(doc => doc.tipo === tipo);
    
    if (!documento) return undefined;
    
    // Si es una imagen, asegurar que tenga preview válido
    if (documento.archivo && 
        documento.archivo.type && 
        documento.archivo.type.startsWith('image/')) {
      
      const fileKey = `${documento.tipo}_${documento.nombre}_${documento.tamaño}`;
      
      // Si ya tiene un preview válido, usarlo
      if (documento.preview && documento.preview.startsWith('blob:')) {
        // Actualizar cache si no está
        if (!previewUrlsRef.current.has(fileKey)) {
          previewUrlsRef.current.set(fileKey, documento.preview);
        }
        return documento;
      }
      
      // Si tenemos en cache, usarlo
      if (previewUrlsRef.current.has(fileKey)) {
        const cachedUrl = previewUrlsRef.current.get(fileKey);
        return {
          ...documento,
          preview: cachedUrl
        };
      }
      
      // Crear nuevo preview solo si no existe
      const nuevoPreview = URL.createObjectURL(documento.archivo);
      previewUrlsRef.current.set(fileKey, nuevoPreview);
            
      return {
        ...documento,
        preview: nuevoPreview
      };
    }
    
    return documento;
  };

  // FUNCIÓN DE ENVÍO
  const handleSubmit = (values) => {
    console.log('Datos completos del step:', values);
    console.log('Archivos a enviar:', values.documentos?.map(doc => ({
      tipo: doc.tipo,
      nombre: doc.nombre,
      tamaño: doc.tamaño,
      esArchivoValido: doc.archivo instanceof File
    })));
    
    // Actualizar el estado global del formulario
    updateFormData(values);
    
    // Continuar al siguiente paso
    onNext();
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch" mb={8}>
       
        <Text fontSize="md" color="gray.600">
          Sube los documentos necesarios para tu registro como distribuidor. 
          Todos los archivos deben ser claros y legibles.
        </Text>
      </VStack>

      <Formik
        initialValues={{
          documentos: formData.documentos || []
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched, isSubmitting }) => (
          <Form style={{ width: '100%' }}>
            <VStack spacing={8} align="stretch">
              
              {/* GRID DE DOCUMENTOS OBLIGATORIOS */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700">
                  Documentos Obligatorios
                </Text>
                
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                  
                  {/* DPI FRONTAL */}
                  <GridItem>
                    <FileUploader
                      documentType="dpi_frontal"
                      required={true}
                      file={getDocumentoByTipo(values.documentos, 'dpi_frontal')?.archivo}
                      preview={getDocumentoByTipo(values.documentos, 'dpi_frontal')?.preview}
                      onFileSelect={(fileData) => handleFileUpload(fileData, setFieldValue, values)}
                      onFileRemove={() => handleFileRemove('dpi_frontal', setFieldValue, values)}
                      disabled={isSubmitting}
                    />
                  </GridItem>
                  
                  {/* DPI POSTERIOR */}
                  <GridItem>
                    <FileUploader
                      documentType="dpi_posterior"
                      required={true}
                      file={getDocumentoByTipo(values.documentos, 'dpi_posterior')?.archivo}
                      preview={getDocumentoByTipo(values.documentos, 'dpi_posterior')?.preview}
                      onFileSelect={(fileData) => handleFileUpload(fileData, setFieldValue, values)}
                      onFileRemove={() => handleFileRemove('dpi_posterior', setFieldValue, values)}
                      disabled={isSubmitting}
                    />
                  </GridItem>

                  {/* RTU */}
                  <GridItem>
                    <FileUploader
                      documentType="rtu"
                      required={true}
                      file={getDocumentoByTipo(values.documentos, 'rtu')?.archivo}
                      preview={getDocumentoByTipo(values.documentos, 'rtu')?.preview}
                      onFileSelect={(fileData) => handleFileUpload(fileData, setFieldValue, values)}
                      onFileRemove={() => handleFileRemove('rtu', setFieldValue, values)}
                      disabled={isSubmitting}
                    />
                  </GridItem>

                  {/* PATENTE DE COMERCIO */}
                  <GridItem>
                    <FileUploader
                      documentType="patente_comercio"
                      required={true}
                      file={getDocumentoByTipo(values.documentos, 'patente_comercio')?.archivo}
                      preview={getDocumentoByTipo(values.documentos, 'patente_comercio')?.preview}
                      onFileSelect={(fileData) => handleFileUpload(fileData, setFieldValue, values)}
                      onFileRemove={() => handleFileRemove('patente_comercio', setFieldValue, values)}
                      disabled={isSubmitting}
                    />
                  </GridItem>

                </Grid>

              </Box>

             
              
              {/* RESUMEN DE ARCHIVOS SUBIDOS */}
              {values.documentos && values.documentos.length > 0 && (
                <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                  <Text fontSize="md" fontWeight="bold" color="green.700" mb={2}>
                    Archivos subidos ({values.documentos.length})
                  </Text>
                  {values.documentos.map((doc, index) => (
                    <Text key={index} fontSize="sm" color="green.600">
                      • {doc.tipo}: {doc.nombre} ({(doc.tamaño / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  ))}
                </Box>
              )}
              
              {/* ERRORES DE VALIDACIÓN */}
              {errors.documentos && touched.documentos && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Error en documentos:</Text>
                    <Text>{errors.documentos}</Text>
                  </Box>
                </Alert>
              )}
              
              {/* BOTÓN DE CONTINUAR */}
              <Button 
                type="submit" 
                colorScheme="orange" 
                size="lg" 
                w="full"
                isLoading={isSubmitting}
                loadingText="Procesando documentos..."
              >
                Continuar al Siguiente Paso
              </Button>
              
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default DocumentsStep;