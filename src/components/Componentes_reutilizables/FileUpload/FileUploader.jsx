import React, { useState, useRef, useCallback } from 'react';
import { Box, VStack, HStack, Text, Alert, AlertIcon} from '@chakra-ui/react';
import { handleError } from "../../../services/NotificationService";
import FileDropzone, { EmptyDropzone } from './FileDropzone';
import FilePreview, { UploadingPreview } from './FilePreview';
import { 
  validateFile, 
  createPreviewUrl, 
  revokePreviewUrl,
  VALIDATION_CONFIG 
} from './FileValidation';

const FileUploader = ({
  // Configuración básica
  documentType,
  required = false,
  
  // Estado actual
  file = null,
  preview = null,
  
  // Callbacks
  onFileSelect,
  onFileRemove,
  
  // Personalización
  disabled = false
}) => {
  // Estados locales
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Configuración del tipo de documento
  const config = VALIDATION_CONFIG[documentType];
  
  // Estado derivado
  const hasFile = file !== null;
  
  // Función para manejar selección de archivos
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile || disabled) return;
    
    // Validar archivo
    const validation = validateFile(selectedFile, documentType);
    
    if (!validation.isValid) {
      validation.errors.forEach(errorMsg => {
        handleError(errorMsg);
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Crear preview si es imagen
      const previewUrl = createPreviewUrl(selectedFile);
      
      // Simular progreso de carga
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 90) progress = 90;
        setUploadProgress(Math.round(progress));
      }, 200);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Pequeña pausa para mostrar el 100%
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Llamar callback del padre
      onFileSelect({
        file: selectedFile,
        preview: previewUrl,
        type: documentType
      });
      
    } catch (error) {
      handleError('Hubo un problema al procesar el archivo. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [documentType, disabled, onFileSelect]);
  
  // Manejo del input file
  const handleInputChange = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
    // Limpiar input para permitir seleccionar el mismo archivo
    event.target.value = '';
  }, [handleFileSelect]);
  
  // Si no hay configuración para este tipo de documento
  if (!config) {
    return (
      <Alert status="error">
        <AlertIcon />
        Tipo de documento no configurado: {documentType}
      </Alert>
    );
  }
  
  return (
    <Box position="relative">
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.acceptedTypes.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      {/* Label del documento */}
      <HStack mb={3}>
        <Text fontWeight="bold" fontSize="sm">
          {config.label}
        </Text>
        {required && (
          <Text color="red.500" fontSize="sm">*</Text>
        )}
      </HStack>
      
      {/* Contenedor principal */}
      <FileDropzone
        onFileDrop={handleFileSelect}
        acceptedTypes={config.acceptedTypes}
        maxSize={config.maxSize}
        disabled={disabled}
        colorScheme="orange"
        onClick={!hasFile && !isUploading ? () => fileInputRef.current?.click() : undefined}
        p={4}
      >
        <VStack spacing={3}>
          {/* Contenido condicional */}
          {isUploading ? (
            <UploadingPreview
              progress={uploadProgress}
              fileName={file?.name}
              colorScheme="orange"
            />
          ) : hasFile ? (
            <FilePreview
              file={file}
              preview={preview}
              onReplace={() => fileInputRef.current?.click()}
              onRemove={() => {
                if (preview) revokePreviewUrl(preview);
                onFileRemove();
              }}
              colorScheme="orange"
              disabled={disabled}
            />
          ) : (
            <EmptyDropzone
              acceptedTypes={config.acceptedTypes}
              maxSize={config.maxSize}
              colorScheme="orange"
              disabled={disabled}
              label={config.label.toLowerCase()}
            />
          )}
        </VStack>
      </FileDropzone>
      
    </Box>
  );
};

export default FileUploader;