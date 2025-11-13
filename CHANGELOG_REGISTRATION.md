# Changelog: Mejoras en el Flujo de Registro de Distribuidores

Este documento detalla los cambios realizados en los archivos del proyecto para refactorizar y mejorar el proceso de registro de distribuidores.

---

## Backend (`api/`)

### Archivos Modificados

- **`api/models/RegistrationRequest.py`**
  - **Cambio:** Se actualizó la clase `Estado` para reflejar el nuevo flujo de trabajo (de `PROCESANDO_DOCUMENTOS` a `APROBADO`/`RECHAZADO`).
  - **Cambio:** Se renombró el campo `asignado_a` a `assignment_key` para mayor claridad.
  - **Cambio:** Se añadió el campo `observaciones` (TextField) para que los revisores puedan dejar comentarios.

- **`api/models/base_model.py`**
  - **Cambio:** Se convirtió en un modelo abstracto (`class Meta: abstract = True`) para solucionar conflictos de herencia en la base de datos.

- **`api/models/usuario.py`**
  - **Cambio:** Se eliminó la herencia de `BaseModel` para evitar conflictos con el modelo `AbstractUser`.
  - **Cambio:** Se añadieron manualmente los campos `is_deleted`, `created` y `modified` para mantener la funcionalidad de borrado suave.

- **`api/schema.py`**
  - **Cambio:** Se importó y registró `RegistrationRequestQuery` para exponer las nuevas consultas de solicitudes en la API de GraphQL.

- **`api/graphql/mutations/registration.py`**
  - **Cambio:** Se refactorizó la mutación `AssignRegistrationRequest` para aceptar un `userId` como argumento.
  - **Cambio:** Se eliminaron las mutaciones obsoletas `CreateRegistrationRevisions` y `UpdateRegistrationRevision`.
  - **Cambio:** Se añadieron las nuevas mutaciones (`SubmitReview`, `ResubmitRequest`, `SendToApproval`) que gestionan el nuevo flujo de revisión.

- **`api/services/registration_service.py`**
  - **Cambio:** Se refactorizó la lógica para alinearla con los nuevos estados y el campo `assignment_key`.
  - **Cambio:** Se implementó la lógica de negocio para las nuevas mutaciones del flujo de revisión.
  - **Cambio:** Se actualizó la llamada a la tarea de Celery para que apunte a la nueva tarea de procesamiento de OCR.

- **`api/tasks.py`**
  - **Cambio:** Se renombró la tarea `process_rtu_for_request` a `process_documents_ocr`.
  - **Cambio:** Se expandió la lógica para orquestar el procesamiento OCR de todos los documentos (DPI, RTU, Patente), realizar validaciones cruzadas y gestionar los estados de éxito (`PENDIENTE_ASIGNACION`) o error (`ERROR_OCR`).

- **`api/utils/distributors/validators.py`**
  - **Cambio:** Se actualizó la máquina de estados `ALLOWED` para reflejar las nuevas transiciones de estado permitidas.
  - **Cambio:** Se eliminaron las funciones de validación de revisiones, ahora obsoletas.

### Archivos Creados

- **`api/graphql/schema/registration_request.py`**
  - **Razón:** Este archivo faltaba y era necesario para definir los tipos de GraphQL (`RegistrationRequestNode`, `Inputs`, etc.) relacionados con el flujo de registro.

- **`api/utils/ocr_extractor.py`**
  - **Razón:** Se creó para centralizar toda la lógica de extracción de texto y OCR, absorbiendo y mejorando la funcionalidad del antiguo `rtu_extractor.py`.

- **`api/migrations/0002_...py`**
  - **Razón:** Migración de base de datos generada para aplicar los cambios en el modelo `RegistrationRequest`.

### Archivos Eliminados

- **`api/utils/rtu_extractor.py`**
  - **Razón:** Su funcionalidad fue refactorizada, mejorada y movida al nuevo módulo `ocr_extractor.py`.

---

## Frontend (`frontend/`)

### Archivos Modificados

- **`frontend/src/context/RegistrationContext.jsx`**
  - **Cambio:** Se actualizó el estado inicial (`initialValues`) para que el array `referencias` comience con tres objetos, cumpliendo con el nuevo requisito.

- **`frontend/src/pages/public/DistributorRegistration/steps/ReferencesStep.jsx`**
  - **Cambio:** Se refactorizó el componente para ser autocontenido, utilizando `Formik` para la gestión de su estado local y conectándose con el contexto, siguiendo el patrón del resto de los pasos.

- **`frontend/src/pages/public/DistributorRegistration/steps/DocumentsStep.jsx`**
  - **Cambio:** Se mejoró el `validationSchema` de `Yup` para incluir validaciones de formato y tamaño de archivo, utilizando las funciones del utilitario `FileValidation.js`.

- **`frontend/src/services/RegistrationService.js`**
  - **Cambio:** Se añadieron todas las nuevas consultas y mutaciones de GraphQL para la gestión del flujo de revisión (listar, asignar, revisar, aprobar, etc.).

- **`frontend/src/routes/routes.js`**
  - **Cambio:** Se añadió la nueva ruta `/registrations` para la página de listado de solicitudes.

### Archivos Creados

- **`frontend/src/pages/private/Distributors/RegistrationListPage.jsx`**
  - **Razón:** Nuevo componente de página que muestra una lista de todas las solicitudes de registro, con funcionalidades de filtrado y paginación.

---

## Raíz del Proyecto

- **`requirements.txt`**
  - **Cambio:** Se añadieron las dependencias `celery` y `django-celery-results` que faltaban en el proyecto.
