import React, { useState, useEffect } from 'react';
import { VStack, SimpleGrid, Button, Text, FormControl, FormLabel, Input, useToast, Box, Spinner, Icon } from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { MdCloudUpload, MdCheckCircle } from 'react-icons/md';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';
import { showSuccess, handleError } from "../../../../services/NotificationService";

const initSchema = Yup.object({
  nit: Yup.string().required('Requerido'),
  correo: Yup.string().email().required('Requerido'),
});

const UploadCard = ({ label, docType, requestId, onOCR }) => {
  const [status, setStatus] = useState('idle');
  
  const handleUpload = async (e) => {
    if (!e.target.files[0]) return;
    setStatus('uploading');
    try {
      const res = await DistributorRegistrationService.uploadDocument(requestId, docType, e.target.files[0]);
      if (res.data.data.uploadRequestDocument.success) {
        setStatus('done');
        if (onOCR) onOCR();
      }
    } catch (err) {
      setStatus('idle');
    }
  };

  return (
    <Box borderWidth="2px" borderStyle="dashed" borderRadius="lg" p={4} textAlign="center" borderColor={status === 'done' ? 'green.400' : 'gray.300'}>
      {status === 'uploading' ? <Spinner /> : status === 'done' ? <Icon as={MdCheckCircle} color="green.500" boxSize={8} /> : <Icon as={MdCloudUpload} color="gray.400" boxSize={8} />}
      <Text fontWeight="bold" mt={2}>{label}</Text>
      <Button as="label" size="sm" mt={2} cursor="pointer" colorScheme={status === 'done' ? 'green' : 'brand'} variant={status === 'done' ? 'outline' : 'solid'}>
        {status === 'done' ? 'Cargado' : 'Subir'}
        <input type="file" hidden accept=".jpg,.png,.pdf" onChange={handleUpload} />
      </Button>
    </Box>
  );
};

const Step1_Documents = ({ formData, updateData, setRequestId, next }) => {
  const [localId, setLocalId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let interval;
    if (isPolling && localId) {
      interval = setInterval(async () => {
        try {
          const res = await DistributorRegistrationService.getOCRStatus(localId);
          const data = res.data.data.distributorRequest.ocrDataExtracted;
          if (data && Object.keys(data).length > 0) {
             // Mapeo OCR -> Formulario
             const clean = {};
             if (data.nombres_ocr) clean.nombres = data.nombres_ocr;
             if (data.apellidos_ocr) clean.apellidos = data.apellidos_ocr;
             if (data.dpi) clean.dpi = data.dpi;
             if (data.nombre_fiscal_ocr) clean.negocioNombre = data.nombre_fiscal_ocr;
             if (data.nit) clean.nit = data.nit;
             
             updateData(clean);
             toast({ title: "Datos Detectados", status: "info", duration: 2000, isClosable: true });
          }
        } catch (e) {}
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPolling, localId, updateData]);

  const handleInit = async (values) => {
    try {
      const res = await DistributorRegistrationService.createDraft(values);
      if (res.data.data.createDistributorRequest.success) {
        const id = res.data.data.createDistributorRequest.request.id;
        setLocalId(id);
        setRequestId(id);
        updateData(values);
      }
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="xl" fontWeight="bold">Paso 1: Documentos</Text>
      {!localId ? (
        <Formik initialValues={{ nit: formData.nit, correo: formData.correo }} validationSchema={initSchema} onSubmit={handleInit}>
          {({ isSubmitting }) => (
            <Form>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field name="nit">{({ field, form }) => <FormControl isInvalid={form.errors.nit}><FormLabel>NIT</FormLabel><Input {...field} /></FormControl>}</Field>
                <Field name="correo">{({ field, form }) => <FormControl isInvalid={form.errors.correo}><FormLabel>Correo</FormLabel><Input {...field} /></FormControl>}</Field>
              </SimpleGrid>
              <Button mt={4} type="submit" colorScheme="brand" width="full" isLoading={isSubmitting}>Iniciar</Button>
            </Form>
          )}
        </Formik>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <UploadCard label="DPI Frontal" docType="DPI_FRONT" requestId={localId} onOCR={() => setIsPolling(true)} />
            <UploadCard label="RTU Digital" docType="RTU" requestId={localId} onOCR={() => setIsPolling(true)} />
          </SimpleGrid>
          <Button colorScheme="brand" onClick={next} alignSelf="end">Siguiente</Button>
        </>
      )}
    </VStack>
  );
};
export default Step1_Documents;