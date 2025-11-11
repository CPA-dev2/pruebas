import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Link,
} from '@chakra-ui/react';
import { DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';

/**
 * Componente reutilizable para previsualizar archivos (imágenes y PDFs).
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.fileUrl - URL completa del archivo a mostrar.
 * @param {string} props.fileName - Nombre descriptivo del archivo (opcional).
 * @param {string} [props.height='400px'] - Altura del contenedor de preview.
 * @param {string} [props.downloadLabel='Descargar archivo'] - Texto del botón de descarga.
 * @param {string} [props.colorScheme='blue'] - Color del botón de descarga.
 */
const FilePreview = ({ 
  fileUrl, 
  fileName = 'Archivo',
  height = '400px',
  downloadLabel = 'Descargar archivo',
  colorScheme = 'blue'
}) => {
  
  // Extraer la extensión del archivo desde la URL
  const getFileExtension = (url) => {
    if (!url) return '';
    const path = url.split('?')[0]; // Remover query params si existen
    const extension = path.split('.').pop().toLowerCase();
    return extension;
  };

  const fileExtension = getFileExtension(fileUrl);
  const isPDF = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);

  return (
    <Box 
      bg="gray.50" 
      borderRadius="md" 
      overflow="hidden"
      height={height}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      {isPDF ? (
        // Vista para archivos PDF
        <VStack spacing={4}>
          <AttachmentIcon boxSize={12} color={`${colorScheme}.400`} />
          <Text fontSize="lg" fontWeight="semibold">
            Documento PDF
          </Text>
          <Text color="gray.500" textAlign="center" px={4} fontSize="sm">
            Los documentos PDF no se pueden previsualizar.
            <br />
            Descarga el archivo para verlo.
          </Text>
          <Button
            as={Link}
            href={fileUrl}
            leftIcon={<DownloadIcon />}
            colorScheme={colorScheme}
            size="md"
            isExternal
            _hover={{ textDecoration: 'none' }}
          >
            {downloadLabel}
          </Button>
        </VStack>
      ) : isImage ? (
        // Vista previa para imágenes
        <Box
          as="img"
          src={fileUrl}
          alt={fileName}
          maxHeight={height}
          maxWidth="100%"
          objectFit="contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      ) : (
        // Vista para tipos de archivo no soportados
        <VStack spacing={4}>
          <AttachmentIcon boxSize={12} color="gray.400" />
          <Text fontSize="lg" fontWeight="semibold" color="gray.600">
            Archivo {fileExtension.toUpperCase()}
          </Text>
          <Text color="gray.500" textAlign="center" px={4} fontSize="sm">
            No se puede previsualizar este tipo de archivo.
          </Text>
          <Button
            as={Link}
            href={fileUrl}
            leftIcon={<DownloadIcon />}
            colorScheme={colorScheme}
            size="md"
            isExternal
            _hover={{ textDecoration: 'none' }}
          >
            {downloadLabel}
          </Button>
        </VStack>
      )}
      
      {/* Fallback oculto para errores de carga de imagen */}
      {isImage && (
        <VStack spacing={4} display="none">
          <Text color="gray.500" fontSize="sm">
            No se pudo cargar la imagen
          </Text>
          <Button
            as={Link}
            href={fileUrl}
            leftIcon={<DownloadIcon />}
            colorScheme={colorScheme}
            size="sm"
            isExternal
            _hover={{ textDecoration: 'none' }}
          >
            {downloadLabel}
          </Button>
        </VStack>
      )}
    </Box>
  );
};

export default FilePreview;
