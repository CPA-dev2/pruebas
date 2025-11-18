import pytesseract
import re
import os
import cv2
import numpy as np
import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
from django.conf import settings

class OCRService:
    """
    Servicio avanzado para extracción de datos de documentos oficiales (GT).
    Utiliza OpenCV para limpieza de imagen y pdfplumber para PDFs nativos.
    """

    @staticmethod
    def _preprocess_image_cv(image_path=None, pil_image=None):
        """
        Pre-procesamiento avanzado usando OpenCV.
        Ideal para DPIs con fondos tramados o fotos de celular (WhatsApp).
        """
        try:
            # Cargar imagen desde path o convertir desde PIL
            if image_path:
                img = cv2.imread(image_path)
            elif pil_image:
                img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            else:
                return None

            # 1. Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 2. Eliminación de ruido y suavizado (preserve bordes)
            # Ayuda a limpiar el ruido de compresión de WhatsApp
            gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

            # 3. Binarización Adaptativa (Thresholding)
            # Esto separa el texto negro del fondo de seguridad del DPI
            thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )

            # 4. Retornar imagen procesada como objeto PIL para Tesseract
            return Image.fromarray(thresh)
        except Exception as e:
            print(f"Error en pre-procesamiento CV: {e}")
            # Si falla OpenCV, devolvemos la original en PIL
            if pil_image: return pil_image
            return Image.open(image_path) if image_path else None

    @staticmethod
    def extract_text_from_pdf(file_path):
        """
        Intenta extraer texto digital primero (rápido y preciso).
        Si no hay texto (escaneado), usa OCR.
        """
        text = ""
        try:
            # Intento 1: Extracción Digital (pdfplumber) - Ideal para RTUs
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # Si extrajo una cantidad decente de texto, asumimos que es digital
            if len(text.strip()) > 50:
                return text
            
            # Intento 2: Fallback a OCR (pdf2image -> tesseract)
            print("PDF parece ser imagen escaneada, aplicando OCR...")
            images = convert_from_path(file_path)
            for img in images:
                # Usamos el preprocesamiento avanzado
                processed_img = OCRService._preprocess_image_cv(pil_image=img)
                text += pytesseract.image_to_string(processed_img, lang='spa') + "\n"
            
            return text

        except Exception as e:
            print(f"Error leyendo PDF: {e}")
            return ""

    @staticmethod
    def extract_text_from_file(file_path):
        ext = os.path.splitext(file_path)[1].lower()

        if ext == '.pdf':
            return OCRService.extract_text_from_pdf(file_path)
        elif ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp']:
            # Usar el preprocesador de OpenCV
            processed_img = OCRService._preprocess_image_cv(image_path=file_path)
            # Configuración --psm 6 asume un bloque de texto uniforme, suele funcionar mejor para DPIs
            return pytesseract.image_to_string(processed_img, lang='spa', config='--psm 6')
        else:
            return None

    @staticmethod
    def parse_dpi_front(text):
        """
        Extrae datos del DPI Frontal.
        """
        data = {}
        # Normalizamos saltos de línea para manejar mejor el regex
        text = text.upper().replace('\r', '') 

        # 1. CUI (Mejorado para capturar espacios irregulares)
        cui_match = re.search(r'(\d{4})\s*(\d{5})\s*(\d{4})', text)
        if cui_match:
            data['dpi'] = f"{cui_match.group(1)}{cui_match.group(2)}{cui_match.group(3)}"

        # 2. Estrategia de Extracción por Bloques
        # El DPI tiene etiquetas claras: "APELLIDOS", "NOMBRES", "FECHA DE NACIMIENTO"
        # Buscamos el texto que está ENTRE esas etiquetas.
        
        # Eliminar líneas vacías y ruido corto
        lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 2]
        clean_text = "\n".join(lines)

        # Regex multilínea para capturar lo que está después de APELLIDOS y antes de NOMBRES
        apellidos_match = re.search(r'APELLID[OS05]+[:\.]?\s*\n(.*?)\n\s*NOMBRE', clean_text, re.DOTALL)
        if apellidos_match:
            # Limpiamos caracteres no alfabéticos que el OCR pueda meter por error
            raw_lastname = apellidos_match.group(1).replace('\n', ' ')
            data['apellidos_ocr'] = re.sub(r'[^A-Z\sÑ]', '', raw_lastname).strip()

        nombres_match = re.search(r'NOMBRE[S5]?[:\.]?\s*\n(.*?)\n\s*FEC', clean_text, re.DOTALL)
        if not nombres_match:
            # Intento alternativo si "FECHA" no se lee bien, buscar hasta el final de línea o siguiente bloque
            nombres_match = re.search(r'NOMBRE[S5]?[:\.]?\s*\n([^\n]+)', clean_text)
        
        if nombres_match:
            raw_name = nombres_match.group(1).replace('\n', ' ')
            data['nombres_ocr'] = re.sub(r'[^A-Z\sÑ]', '', raw_name).strip()

        return data

    @staticmethod
    def parse_rtu(text):
        """
        Extrae datos del RTU (formato SAT Guatemala).
        """
        data = {}
        text_upper = text.upper()
        lines = [line.strip() for line in text_upper.split('\n') if line.strip()]

        # 1. NIT
        nit_match = re.search(r'NIT\s*[:\.]?\s*([0-9A-Z\-]+)', text_upper)
        if nit_match:
            data['nit'] = nit_match.group(1).replace('-', '').replace(' ', '')

        # 2. Nombre / Razón Social
        # En RTUs digitales, suele venir después de "Nombre del Contribuyente:" o similar
        for i, line in enumerate(lines):
            if "NOMBRE" in line and ("CONTRIBUYENTE" in line or "SOCIAL" in line):
                # Intentar obtener el valor de la misma línea o la siguiente
                parts = line.split(':', 1)
                if len(parts) > 1 and len(parts[1].strip()) > 3:
                    data['nombre_fiscal_ocr'] = parts[1].strip()
                elif i + 1 < len(lines):
                    data['nombre_fiscal_ocr'] = lines[i+1].strip()
                break

        # 3. Sucursales / Establecimientos
        # Buscamos bloques que contengan "Nombre Comercial" y "Estado"
        sucursales = []
        
        # Banderas para saber si estamos dentro de la sección de establecimientos
        capturing_locations = False
        
        for i, line in enumerate(lines):
            # Detectar inicio de sección (puede variar, buscamos pistas)
            if "ESTABLECIMIENTO" in line or "NEGOCIO" in line:
                capturing_locations = True
            
            if capturing_locations:
                # Patrón común en RTU: "Nombre Comercial: FARMACIA X"
                if "NOMBRE COMERCIAL" in line:
                    parts = line.split(':', 1)
                    val = ""
                    if len(parts) > 1 and parts[1].strip():
                        val = parts[1].strip()
                    elif i + 1 < len(lines):
                        # A veces el valor está abajo
                        val = lines[i+1].strip()
                    
                    # Limpieza básica para evitar capturar basura
                    if val and "ESTADO" not in val and len(val) > 3:
                        # Validar que no sea el mismo nombre fiscal (a veces se repite el principal)
                        if val != data.get('nombre_fiscal_ocr'):
                            sucursales.append(val)

        # Limpieza de duplicados
        data['sucursales_ocr'] = list(set(sucursales))

        return data

    @staticmethod
    def parse_patente(text):
        # ... (Tu lógica existente de patente estaba bien, se mantiene igual)
        data = {}
        text = text.upper()
        
        if "SOCIEDAD" in text: data['tipo_persona_ocr'] = 'Juridica'
        elif "PROPIETARIO" in text: data['tipo_persona_ocr'] = 'Natural'

        name_match = re.search(r'EMPRESA MERCANTIL[:\.\s]+(.*?)(?:\n|$)', text)
        if not name_match:
            # Búsqueda por líneas si falla el regex directo
             lines = text.split('\n')
             for i, line in enumerate(lines):
                 if "EMPRESA MERCANTIL" in line and i+1 < len(lines):
                     data['nombre_comercial_ocr'] = lines[i+1].strip()
                     break
        else:
            data['nombre_comercial_ocr'] = name_match.group(1).strip()

        return data

    @staticmethod
    def extract_data(document_type, file_path):
        # El router ahora recibe file_path para decidir cómo extraer texto
        raw_text = OCRService.extract_text_from_file(file_path)
        
        if not raw_text:
            return {}

        if document_type == 'DPI_FRONT':
            return OCRService.parse_dpi_front(raw_text)
        elif document_type == 'RTU':
            return OCRService.parse_rtu(raw_text)
        elif document_type == 'PATENTE':
            return OCRService.parse_patente(raw_text)
        
        return {}