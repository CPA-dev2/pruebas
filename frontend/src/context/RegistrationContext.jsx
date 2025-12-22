import React, { createContext, useContext, useState, useMemo } from 'react';

// Creación del Contexto
const RegistrationContext = createContext();

// Hook personalizado para consumir el contexto fácilmente
export const useRegistration = () => {
    const context = useContext(RegistrationContext);
    if (!context) {
        throw new Error("useRegistration debe usarse dentro de un RegistrationProvider");
    }
    return context;
};

// Proveedor del estado global para el formulario
export const RegistrationProvider = ({ children }) => {
    // --- Estados de Control ---
    const [activeStep, setActiveStep] = useState(0);
    const [requestId, setRequestId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Estado Global de Datos (formData) ---
    // Estructura completa basada en tus requerimientos
    const [formData, setFormData] = useState({
        // Paso 1: Inicio
        nit: '',
        correo: '',
        tipoDistribuidor: '',

        // Paso 2: Archivos (Objetos File temporales en memoria)
        files: {
            // Pequeño
            dpiFront: null,
            dpiBack: null,
            rtu: null,
            patenteComercio: null,

            // S.A.
            propDpiFront: null,
            propDpiBack: null,
            repDpiFront: null,
            repDpiBack: null,
            patenteSociedad: null
        },

        // Paso 3: Datos Personales
        // Pequeño Contribuyente
        nombres: '', apellidos: '', direccion: '',
        depto: '', muni: '', telefono: '', genero: '', correoPersonal: '',

        // S.A. - Propietario
        propNombres: '', propApellidos: '', propDireccion: '',
        propDepto: '', propMuni: '', propTelefono: '', propCorreo: '', propGenero: '',

        // S.A. - Representante Legal
        repNombres: '', repApellidos: '', repDireccion: '',
        repDepto: '', repMuni: '', repTelefono: '', repCorreo: '', repGenero: '',

        // Paso 4: Información de la Empresa
        nombreComercial: '',
        direccionFiscal: '',
        regimen: '',
        formaCalculoIva: '',
        productos: [], // Array de strings
        sucursales: [], // Array de objetos { nombre, codigo, tipo, actividad }

        // Paso 5: Datos Bancarios
        banco: 'banrural',
        numeroCuenta: '',
        tipoCuenta: '',

        // Paso 6: Referencias
        referencias: [] // Array de objetos { nombre, telefono, relacion }
    });

    // --- Funciones de Utilidad ---

    /**
     * Actualiza parcialmente el objeto formData.
     * @param {Object} newData - Objeto con las claves/valores a actualizar.
     */
    const updateData = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    /**
     * Avanza al siguiente paso y resetea el scroll.
     */
    const nextStep = () => {
        setActiveStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    /**
     * Retrocede al paso anterior.
     */
    const prevStep = () => {
        setActiveStep(prev => (prev > 0 ? prev - 1 : 0));
        window.scrollTo(0, 0);
    };

    // Objeto de valor a proveer
    const value = useMemo(() => ({
        activeStep, setActiveStep,
        requestId, setRequestId,
        isSubmitting, setIsSubmitting,
        formData, updateData,
        nextStep, prevStep
    }), [activeStep, requestId, isSubmitting, formData]);

    return (
        <RegistrationContext.Provider value={value}>
            {children}
        </RegistrationContext.Provider>
    );
};