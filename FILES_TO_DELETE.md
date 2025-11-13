# Archivos para Eliminar

Este documento lista los archivos que se han vuelto obsoletos como resultado de la refactorización del flujo de registro y deben ser eliminados del proyecto.

---

## 1. `api/utils/rtu_extractor.py`

-   **Razón de la Eliminación:**
    Toda la lógica de extracción de texto y OCR que contenía este archivo ha sido refactorizada, mejorada y centralizada en un nuevo módulo más genérico: `api/utils/ocr_extractor.py`.

    El nuevo módulo no solo abarca la funcionalidad del RTU, sino que también incluye la extracción de datos para el DPI y la Patente de Comercio, eliminando la necesidad de tener un archivo separado y específico para un solo tipo de documento. Mantener este archivo generaría duplicación de código y posible confusión.
