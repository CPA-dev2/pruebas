# 📷 OCR Microservice - Extracción Inteligente de Documentos

Microservicio de alto rendimiento diseñado para la extracción, validación y análisis de calidad de documentos oficiales de Guatemala (DPI, RTU, Patentes).

Construido con **FastAPI**, **Celery**, **Redis** y **Tesseract OCR**, utilizando técnicas de visión por computadora (**OpenCV**) para pre-procesamiento avanzado de imágenes.

---

## 🚀 Características Principales

* **Extracción de Texto:** Soporte para imágenes (JPG, PNG) y PDFs nativos o escaneados.
* **Pre-procesamiento Avanzado:** Limpieza de ruido, binarización adaptativa y corrección de perspectiva mediante OpenCV.
* **Validación de Documento Oficial:** Algoritmo que verifica palabras clave para asegurar que el archivo subido corresponde al tipo declarado (DPI, RTU, etc.).
* **Score de Legibilidad:** Cálculo de un puntaje (0-100) basado en la confianza del motor OCR para determinar la calidad de la imagen.
* **Procesamiento Asíncrono:** Arquitectura no bloqueante utilizando Celery.

---

## 🛠️ Stack Tecnológico

* **Python 3.10+**
* **FastAPI:** Framework web moderno y rápido.
* **Celery:** Cola de tareas distribuidas.
* **Redis:** Broker de mensajería y backend de resultados.
* **Tesseract 5:** Motor de OCR (Optical Character Recognition).
* **OpenCV:** Visión por computadora para limpieza de imágenes.

---

## 📋 Prerrequisitos del Sistema

Antes de instalar las dependencias de Python, es **obligatorio** instalar las librerías del sistema operativo para que Tesseract y OpenCV funcionen.

### Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    libtesseract-dev \
    poppler-utils \
    libgl1-mesa-glx \
    redis-server