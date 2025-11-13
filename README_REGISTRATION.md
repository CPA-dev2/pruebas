# README: Nuevo Flujo de Registro de Distribuidores

Este documento describe el funcionamiento del módulo de registro de distribuidores, detallando el flujo de trabajo, los estados de una solicitud y las instrucciones técnicas para su ejecución y prueba.

---

## 1. Descripción del Flujo y Estados

El proceso de registro ha sido rediseñado para ser más robusto, automatizado y auditable. A continuación se describe el ciclo de vida de una solicitud:

### Flujo del Solicitante (Público)

1.  **Registro:** El aspirante a distribuidor accede al formulario público y completa la información requerida en varios pasos (personal, negocio, bancaria, referencias y documentos).
2.  **Validación Frontend:** La interfaz valida en tiempo real que los datos cumplan con los formatos requeridos (DPI, email, teléfono), que se adjunten al menos 3 referencias y que los documentos tengan el formato y tamaño correctos.
3.  **Envío:** Al enviar el formulario, se crea una `Solicitud de Registro` en el sistema con el estado inicial `PROCESANDO_DOCUMENTOS`.

### Flujo Interno (Backend y Colaboradores)

1.  **Procesamiento OCR (Asíncrono):**
    - Una tarea de Celery se activa automáticamente.
    - **Extracción:** Lee los documentos (DPI, RTU, Patente) y extrae información clave usando OCR.
    - **Poblado Automático:** Rellena campos como el NIT y la Razón Social en la solicitud.
    - **Validación Cruzada:** Compara los datos extraídos del DPI con los ingresados manualmente por el usuario.
    - **Resultado:**
        - **Éxito:** Si el OCR finaliza correctamente, el estado de la solicitud cambia a `PENDIENTE_ASIGNACION`.
        - **Error:** Si ocurre un fallo irrecuperable, el estado cambia a `ERROR_OCR` para revisión manual.

2.  **Asignación (Panel de Colaboradores):**
    - Un administrador o supervisor ve las solicitudes en estado `PENDIENTE_ASIGNACION` en el nuevo panel de "Solicitudes de Registro".
    - Asigna la solicitud a un colaborador específico. El estado cambia a `ASIGNADA`.

3.  **Revisión (Panel del Colaborador):**
    - El colaborador asignado revisa toda la información y los documentos.
    - **Acciones Posibles:**
        - **Solicitar Correcciones:** Si encuentra errores o inconsistencias, escribe sus observaciones en un campo de texto y cambia el estado a `PENDIENTE_CORRECCIONES`.
        - **Enviar a Aprobación:** Si toda la información es correcta, envía la solicitud al siguiente nivel, cambiando el estado a `PENDIENTE_APROBACION`.

4.  **Correcciones (Flujo del Solicitante):**
    - Si se solicitaron correcciones, el solicitante es notificado (eventualmente por email) y puede acceder a una vista para ver las observaciones.
    - Una vez corregida la información, la reenvía, y el estado vuelve a `EN_REVISION`.

5.  **Aprobación Final (Panel del Administrador):**
    - Un usuario con permisos de aprobación ve las solicitudes en estado `PENDiente_APROBACION`.
    - **Decisión Final:**
        - **Aprobar:** Cambia el estado a `APROBADO`. En este punto, el sistema crea automáticamente la entidad `Distribuidor` con toda su información asociada (documentos, ubicaciones, referencias) en las tablas de producción.
        - **Rechazar:** Cambia el estado a `RECHAZADO`. La solicitud se archiva.

### Diagrama de Estados

`PROCESANDO_DOCUMENTOS` -> `PENDIENTE_ASIGNACION` / `ERROR_OCR`
`PENDIENTE_ASIGNACION` -> `ASIGNADA`
`ASIGNADA` -> `EN_REVISION`
`EN_REVISION` -> `PENDIENTE_CORRECCIONES` / `PENDIENTE_APROBACION`
`PENDIENTE_CORRECCIONES` -> `EN_REVISION`
`PENDIENTE_APROBACION` -> `APROBADO` / `RECHAZADO`

---

## 2. Instrucciones de Ejecución

### Backend

1.  **Instalar Dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configurar Entorno:**
    - Copia `.env.example` a `.env` y configura las variables de entorno, especialmente la conexión a la base de datos.

3.  **Aplicar Migraciones:**
    ```bash
    python manage.py migrate
    ```

4.  **Ejecutar Servidor de Desarrollo:**
    ```bash
    python manage.py runserver
    ```

5.  **Ejecutar Worker de Celery:**
    - (Requiere un broker como Redis o RabbitMQ configurado en `.env`)
    ```bash
    celery -A app.celery worker -l info
    ```

### Frontend

1.  **Instalar Dependencias:**
    ```bash
    npm install
    # o si usas yarn
    yarn install
    ```

2.  **Ejecutar Servidor de Desarrollo:**
    ```bash
    npm run dev
    # o
    yarn dev
    ```

---

## 3. Cómo Probar el Flujo

### Probar OCR y Validaciones

1.  **Navega al formulario público** de registro (normalmente `/distributors/create`).
2.  **Completa todos los campos** del formulario.
3.  **Sube los documentos requeridos:**
    - **DPI:** Una imagen (PNG/JPG) clara.
    - **RTU:** Un archivo PDF. Puede ser un PDF vectorial o escaneado.
    - **Patente y Factura:** Imagen o PDF.
4.  **Envía el formulario.**
5.  **Observa la consola del worker de Celery.** Verás los logs del inicio y fin del procesamiento OCR.
6.  **Navega al panel de "Solicitudes de Registro"** (`/registrations`).
7.  **Verifica el estado:** La nueva solicitud debería aparecer con el estado `PENDIENTE_ASIGNACION`. Si hubo un error en el OCR, aparecerá como `ERROR_OCR`. Revisa las observaciones para más detalles.

### Probar el Flujo de Revisión

1.  Desde el panel de solicitudes, **asigna la solicitud** a un usuario.
2.  Accede como el usuario asignado.
3.  **Revisa la solicitud:**
    - **Opción A (Solicitar Corrección):** Añade texto en el campo de observaciones y haz clic en "Solicitar Correcciones". El estado debe cambiar a `PENDIENTE_CORRECCIONES`.
    - **Opción B (Enviar a Aprobación):** Haz clic en "Enviar a Aprobación". El estado debe cambiar a `PENDIENTE_APROBACION`.
4.  **Accede como un administrador** y aprueba o rechaza la solicitud para completar el flujo. Si se aprueba, verifica que el nuevo distribuidor aparezca en la lista de distribuidores activos.

---

## 4. Comandos de Prueba

- **Backend (Pytest):**
  ```bash
  pytest
  ```
- **Frontend (Vitest/Jest):**
  ```bash
  npm test
  # o
  yarn test
  ```
- **Linting:**
  ```bash
  # (Configurar según el linter del proyecto, ej. flake8 o eslint)
  eslint . --ext .js,.jsx
  ```
