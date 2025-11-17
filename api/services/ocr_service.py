import pytesseract
import re
import os
from pdf2image import convert_from_path
from PIL import Image, ImageEnhance, ImageFilter
from django.conf import settings


class OCRService:
    """
    Servicio dedicado a la extracción de texto y parseo de documentos
    específicos (DPI, RTU, Patente) usando Tesseract.
    """

    @staticmethod
    def _preprocess_image(image):
        """
        Pre-procesa una imagen para mejorar la precisión de Tesseract.
        Convierte a escala de grises, aumenta contraste y enfoca.
        """
        img = image.convert('L')  # Escala de grises
        
        # Aumentar contraste
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        
        # Aplicar un filtro de enfoque suave
        img = img.filter(ImageFilter.SHARPEN)
        
        return img

    @staticmethod
    def extract_text_from_file(file_path):
        """
        Extrae texto plano de un archivo (Imagen o PDF).
        """
        text = ""
        ext = os.path.splitext(file_path)[1].lower()

        try:
            if ext == '.pdf':
                # Convierte PDF a lista de imágenes
                images = convert_from_path(file_path)
                for img in images:
                    processed_img = OCRService._preprocess_image(img)
                    text += pytesseract.image_to_string(processed_img, lang='spa') + "\n"
            
            elif ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp']:
                img = Image.open(file_path)
                processed_img = OCRService._preprocess_image(img)
                text = pytesseract.image_to_string(processed_img, lang='spa')
            
            else:
                print(f"Formato no soportado para OCR: {ext}")
                return None
            
            return text
        except Exception as e:
            print(f"Error en motor OCR: {e}")
            return None

    @staticmethod
    def parse_dpi_front(text):
        """
        Extrae datos del Frente del DPI.
        Busca: CUI, Nombres, Apellidos.
        """
        data = {}
        text = text.upper()

        # 1. CUI: 13 dígitos (XXXX XXXXX XXXX)
        # El regex permite espacios o saltos de línea entre los grupos
        cui_match = re.search(r'\b(\d{4})\s*(\d{5})\s*(\d{4})\b', text)
        if cui_match:
            data['dpi'] = f"{cui_match.group(1)}{cui_match.group(2)}{cui_match.group(3)}"

        # 2. Nombres y Apellidos (Heurística básica)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        for i, line in enumerate(lines):
            if 'NOMBRE' in line and i + 1 < len(lines):
                data['nombres_ocr'] = lines[i+1]
            
            if 'APELLID' in line and i + 1 < len(lines):
                 data['apellidos_ocr'] = lines[i+1]
                 
        return data

    @staticmethod
    def parse_rtu(text):
        """
        Extrae datos del RTU Digital (SAT).
        Busca: NIT, Nombre/Razón Social y Sucursales (Establecimientos).
        """
        data = {}
        text_upper = text.upper()

        # 1. NIT: Busca "NIT:" seguido de números y guión
        nit_match = re.search(r'NIT[:\.\s]+([0-9A-Z\-]+)', text_upper)
        if nit_match:
            raw_nit = nit_match.group(1).replace(' ', '')
            data['nit'] = raw_nit.replace('-', '') # NIT Limpio

        # 2. Nombre del Contribuyente
        name_match = re.search(r'(?:NOMBRE|RAZÓN|RAZON)\s*(?:O\s*DENOMINACI[OÓ]N)?\s*SOCIAL[:\.\s]+(.+)', text_upper)
        if name_match:
            data['nombre_fiscal_ocr'] = name_match.group(1).strip()

        # 3. Sucursales (Nombre Comercial de Establecimientos)
        # El RTU lista los establecimientos, usualmente con la etiqueta "NOMBRE COMERCIAL:"
        sucursales = []
        lines = text_upper.split('\n')
        
        for i, line in enumerate(lines):
            # Buscamos la etiqueta "NOMBRE COMERCIAL"
            # A veces el OCR puede separar palabras o confundir caracteres, usamos un check simple
            if "NOMBRE COMERCIAL" in line:
                # Opción A: El valor está en la misma línea ("NOMBRE COMERCIAL: FERRETERIA EL SOL")
                parts = line.split(':', 1)
                if len(parts) > 1 and parts[1].strip():
                    val = parts[1].strip()
                    if val not in sucursales:
                        sucursales.append(val)
                
                # Opción B: El valor está en la siguiente línea (común en tablas del PDF)
                elif i + 1 < len(lines):
                    next_line = lines[i+1].strip()
                    # Validamos que la siguiente línea no sea otra etiqueta (ej. no contiene ":")
                    if next_line and ":" not in next_line:
                        if next_line not in sucursales:
                            sucursales.append(next_line)

        if sucursales:
            # Guardamos la lista. El campo JSONField del modelo lo soporta nativamente.
            data['sucursales_ocr'] = sucursales

        return data

    @staticmethod
    def parse_patente(text):
        """
        Extrae datos de la Patente de Comercio.
        Busca: Nombre de la Empresa, Registro, Tipo.
        """
        data = {}
        text = text.upper()

        if "SOCIEDAD ANÓNIMA" in text or "SOCIEDAD ANONIMA" in text:
            data['tipo_persona_ocr'] = 'Juridica'
        elif "PROPIETARIO" in text:
            data['tipo_persona_ocr'] = 'Natural'
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        for i, line in enumerate(lines):
            # Nombre comercial suele aparecer tras "LA EMPRESA MERCANTIL" o en texto grande
            if "LA EMPRESA MERCANTIL" in line and i + 1 < len(lines):
                 data['nombre_comercial_ocr'] = lines[i+1]
            
            # Número de Registro
            if "REGISTRO" in line and "NO." in line:
                reg_match = re.search(r'NO[:\.\s]+(\d+)', line)
                if reg_match:
                    data['registro_mercantil_ocr'] = reg_match.group(1)

        return data

    @staticmethod
    def extract_data(document_type, raw_text):
        """
        Router que decide qué parser usar según el tipo de documento.
        """
        if not raw_text:
            return {}

        if document_type == 'DPI_FRONT':
            return OCRService.parse_dpi_front(raw_text)
        elif document_type == 'RTU':
            return OCRService.parse_rtu(raw_text)
        elif document_type == 'PATENTE':
            return OCRService.parse_patente(raw_text)
        
        return {}