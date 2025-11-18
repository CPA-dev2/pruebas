import React, { useState, useEffect } from 'react';
import { VStack, SimpleGrid, Button, Text, FormControl, FormLabel, Input, useToast, Box, Spinner, Icon, Badge } from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { MdCloudUpload, MdCheckCircle, MdError } from 'react-icons/md';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';

// Esquema para el inicio rápido
const initSchema = Yup.object({
  nit: Yup.string().required('El NIT es requerido'),
  correo: Yup.string().email('Correo inválido').required('El correo es requerido'),
});

/**
 * Componente de tarjeta de subida individual.
 * Maneja el estado de carga de cada archivo.
 */
const UploadCard = ({ label, docType, requestId, onOCR }) => {
  const [status, setStatus] = useState('idle'); // idle, uploading, done, error
  
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('uploading');
    try {
      const res = await DistributorRegistrationService.uploadDocument(requestId, docType, file);
      if (res.data.data.uploadRequestDocument.success) {
        setStatus('done');
        // Notificamos al padre que se subió un archivo para que active el polling
        if (onOCR) onOCR();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
      console.error("Error uploading:", err);
    }
  };

  return (
    <Box 
      borderWidth="2px" 
      borderStyle="dashed" 
      borderRadius="lg" 
      p={5} 
      textAlign="center" 
      borderColor={status === 'done' ? 'green.400' : status === 'error' ? 'red.400' : 'gray.300'}
      bg={status === 'done' ? 'green.50' : 'white'}
    >
      {status === 'uploading' ? <Spinner /> : 
       status === 'done' ? <Icon as={MdCheckCircle} color="green.500" boxSize={8} /> : 
       status === 'error' ? <Icon as={MdError} color="red.500" boxSize={8} /> :
       <Icon as={MdCloudUpload} color="gray.400" boxSize={8} />}
       
      <Text fontWeight="bold" mt={2} fontSize="sm">{label}</Text>
      
      <Button 
        as="label" 
        size="xs" 
        mt={3} 
        cursor="pointer" 
        colorScheme={status === 'done' ? 'green' : 'brand'} 
        variant={status === 'done' ? 'outline' : 'solid'}
        isDisabled={status === 'uploading'}
      >
        {status === 'done' ? 'Cargado' : 'Seleccionar'}
        <input type="file" hidden accept=".jpg,.png,.pdf" onChange={handleUpload} />
      </Button>
    </Box>
  );
};

/**
 * Paso 1: Creación de Borrador y Carga de Documentos con OCR.
 */
const Step1_Documents = ({ formData, updateData, setRequestId, next }) => {
  const [localId, setLocalId] = useState(null); // ID de la solicitud
  const [isPolling, setIsPolling] = useState(false); // Bandera para activar búsqueda de OCR
  const toast = useToast();

  // --- EFECTO DE POLLING (Lógica OCR) ---
  useEffect(() => {
    let interval;
    
    // Solo hacemos polling si ya tenemos ID y se ha subido al menos un archivo
    if (isPolling && localId) {
      interval = setInterval(async () => {
        try {
          const res = await DistributorRegistrationService.getOCRStatus(localId);
          let extractedData = res.data.data.distributorRequest.ocrDataExtracted;

          // IMPORTANTE: Asegurar que sea objeto, a veces viene como string
          if (typeof extractedData === 'string') {
            try {
              extractedData = JSON.parse(extractedData);
            } catch (e) {
              console.error("Error parseando JSON de OCR", e);
              return;
            }
          }

          // Si encontramos datos útiles, actualizamos el formulario
          if (extractedData && Object.keys(extractedData).length > 0) {
             const cleanData = {};
             
             // Mapeo exacto: Keys del Backend -> Keys del Frontend (formData)
             if (extractedData.nombres_ocr) cleanData.nombres = extractedData.nombres_ocr;
             if (extractedData.apellidos_ocr) cleanData.apellidos = extractedData.apellidos_ocr;
             if (extractedData.dpi) cleanData.dpi = extractedData.dpi;
             if (extractedData.nit) cleanData.nit = extractedData.nit;
             if (extractedData.nombre_fiscal_ocr || extractedData.nombre_comercial_ocr) {
                 cleanData.negocioNombre = extractedData.nombre_comercial_ocr || extractedData.nombre_fiscal_ocr;
             }
             
             console.log("Datos OCR encontrados:", cleanData);
             updateData(cleanData); // Actualiza el estado global en index.jsx
             
             // Notificación no intrusiva
             if (!toast.isActive('ocr-toast')) {
                toast({ 
                    id: 'ocr-toast',
                    title: "Información Detectada", 
                    description: "Hemos extraído datos de tus documentos.", 
                    status: "info", 
                    duration: 3000, 
                    isClosable: true,
                    position: 'top-right' 
                });
             }
          }
        } catch (e) { console.error("Polling error:", e); }
      }, 4000); // Consultar cada 4 segundos
    }
    return () => clearInterval(interval);
  }, [isPolling, localId, updateData, toast]);

  // Manejador de creación inicial
  const handleInit = async (values) => {
    try {
      const res = await DistributorRegistrationService.createDraft(values);
      if (res.data.data.createDistributorRequest.success) {
        const id = res.data.data.createDistributorRequest.request.id;
        setLocalId(id);
        setRequestId(id); // Guardamos el ID en el padre
        updateData(values); // Guardamos NIT y Correo en el estado global
        toast({ status: 'success', title: 'Registro Iniciado', description: 'Ahora sube tus documentos.' });
      }
    } catch (err) {
      toast({ status: 'error', title: 'Error', description: 'No se pudo iniciar. Verifica tu conexión.' });
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="xl" fontWeight="bold">Paso 1: Identificación y Documentos</Text>
        <Text color="gray.500">Para comenzar, ingresa tus datos básicos y sube tus documentos.</Text>
      </Box>

      {/* Si no hay ID, mostramos el formulario inicial */}
      {!localId ? (
        <Formik initialValues={{ nit: formData.nit, correo: formData.correo }} validationSchema={initSchema} onSubmit={handleInit}>
          {({ isSubmitting }) => (
            <Form>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field name="nit">{({ field, form }) => <FormControl isInvalid={form.errors.nit && form.touched.nit}><FormLabel>NIT</FormLabel><Input {...field} placeholder="Sin guiones" /><Box color="red.500" fontSize="xs">{form.errors.nit}</Box></FormControl>}</Field>
                <Field name="correo">{({ field, form }) => <FormControl isInvalid={form.errors.correo && form.touched.correo}><FormLabel>Correo</FormLabel><Input {...field} placeholder="ejemplo@mail.com" /><Box color="red.500" fontSize="xs">{form.errors.correo}</Box></FormControl>}</Field>
              </SimpleGrid>
              <Button mt={6} type="submit" colorScheme="brand" width="full" isLoading={isSubmitting}>Comenzar Carga</Button>
            </Form>
          )}
        </Formik>
      ) : (
        /* Si ya hay ID, mostramos las tarjetas de carga */
        <>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <UploadCard label="DPI Frontal (Identificación)" docType="DPI_FRONT" requestId={localId} onOCR={() => setIsPolling(true)} />
            <UploadCard label="DPI Posterior" docType="DPI_BACK" requestId={localId} />
            <UploadCard label="RTU Digital (SAT)" docType="RTU" requestId={localId} onOCR={() => setIsPolling(true)} />
            <UploadCard label="Patente de Comercio" docType="PATENTE" requestId={localId} onOCR={() => setIsPolling(true)} />
          </SimpleGrid>
          
          <Box pt={4} display="flex" justifyContent="flex-end">
            <Button colorScheme="brand" size="lg" onClick={next}>
              Siguiente: Verificar Datos
            </Button>
          </Box>
        </>
      )}
    </VStack>
  );
};

export default Step1_Documents;