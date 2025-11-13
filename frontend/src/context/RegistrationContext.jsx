/**
 * @file
 * Contexto de React para gestionar el estado global del formulario de registro
 * de distribuidores de múltiples pasos.
 * Esta arquitectura reemplaza un único Formik gigante, mejorando el rendimiento
 * al aislar el estado de cada paso.
 */
import React, { createContext, useContext, useState, useMemo } from 'react';
import { useSteps } from '@chakra-ui/react';
// Importamos la configuración de validación para obtener los tipos de documentos
import { DOCUMENT_TYPES } from '../components/Componentes_reutilizables/FileUpload/FileValidation';

/**
 * Define la estructura de datos inicial y vacía para el formulario.
 */
const initialValues = {
  // Personal
  nombres: '',
  apellidos: '',
  dpi: '',
  correo: '',
  telefono: '',
  departamento: '',
  municipio: '',
  direccion: '',
  // Negocio
  tipo_persona: 'individual',
  telefono_negocio: '',
  equipamiento: '',
  sucursales: '',
  antiguedad: '',
  productos_distribuidos: '',
  // Bancaria
  cuenta_bancaria: '',
  numeroCuenta: '',
  tipoCuenta: '',
  banco: '',
  // Relaciones
  referencias: [
    { nombres: '', telefono: '', relacion: '' },
    { nombres: '', telefono: '', relacion: '' },
    { nombres: '', telefono: '', relacion: '' },
  ],
  // Documentos (ahora `null`, no strings Base64)
  documentos: {
    [DOCUMENT_TYPES.DPI_FRONTAL]: null,
    [DOCUMENT_TYPES.DPI_POSTERIOR]: null,
    [DOCUMENT_TYPES.RTU]: null,
    [DOCUMENT_TYPES.PATENTE_COMERCIO]: null,
    [DOCUMENT_TYPES.FACTURA_SERVICIO]: null,
  },
};

// 1. Crear el contexto
const RegistrationContext = createContext(null);

/**
 * Proveedor que encapsula el estado y la lógica del formulario de varios pasos.
 * @param {object} props - Propiedades del componente React.
 * @param {React.ReactNode} props.children - Los componentes hijos que se renderizarán.
 */
export const RegistrationProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialValues);
  
  // 2. Definir la configuración de los pasos
  const steps = [
    { title: 'Personal', description: 'Información de contacto' },
    { title: 'Negocio', description: 'Datos de su empresa' },
    { title: 'Bancaria', description: 'Datos de cuenta' },
    { title: 'Referencias', description: 'Contactos comerciales' },
    { title: 'Documentos', description: 'Archivos requeridos' },
    { title: 'Revisión', description: 'Confirmar datos' },
  ];
  
  const { activeStep, goToNext, goToPrevious, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const isLastStep = activeStep === steps.length - 1;

  /**
   * Función que cada paso llama para guardar su porción de datos en el estado global.
   * @param {object} dataToUpdate - Los datos del paso que se acaba de completar.
   */
  const updateFormData = (dataToUpdate) => {
    setFormData((prevData) => ({
      ...prevData,
      ...dataToUpdate,
    }));
  };

  /**
   * Resetea el formulario al estado inicial.
   */
  const resetForm = () => {
    setFormData(initialValues);
    setActiveStep(0);
  };

  // Memoizar el valor del contexto para optimizar el rendimiento
  const value = useMemo(() => ({
    formData,
    updateFormData,
    resetForm,
    steps,
    activeStep,
    isLastStep,
    goToNext,
    goToPrevious,
  }), [formData, activeStep, isLastStep]);

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

/**
 * Hook personalizado para acceder fácilmente al contexto del formulario.
 * @returns {object} El valor del contexto de registro.
 */
export const useRegistrationForm = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistrationForm debe ser usado dentro de un RegistrationProvider');
  }
  return context;
};