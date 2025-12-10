import pytesseract
import cv2
import numpy as np
import re
import os
from PIL import Image
from pdf2image import convert_from_path
import pdfplumber

# Configuración de Tesseract (Ajustar si es necesario)
# pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'

class OCREngine:
    """
    Motor de OCR con preprocesamiento avanzado y salida TON.
    """
    
    @staticmethod
    def preprocess_image(image_path):
        """Limpieza de imagen con OpenCV."""
        img = cv2.imread(image_path)
        if img is None: return None
        
        # 1. Escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # 2. Denoising
        gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        # 3. Binarización
        _, thresh = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
        
        return Image.fromarray(thresh)

    @staticmethod
    def extract_text(file_path):
        """Extrae texto crudo de PDF o Imagen."""
        text = ""
        ext = os.path.splitext(file_path)[1].lower()

        if ext == '.pdf':
            # Intento digital
            try:
                with pdfplumber.open(file_path) as pdf:
                    text = "\n".join([p.extract_text() or "" for p in pdf.pages])
            except: pass
            
            # Fallback a OCR si no hay texto
            if len(text) < 50:
                images = convert_from_path(file_path)
                text = ""
                for img in images:
                    img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                    _, thresh = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
                    pil_img = Image.fromarray(thresh)
                    text += pytesseract.image_to_string(pil_img, lang='spa')
        else:
            proc_img = OCREngine.preprocess_image(file_path)
            if proc_img:
                text = pytesseract.image_to_string(proc_img, lang='spa', config='--psm 6')
        
        return text.upper()

    @staticmethod
    def generate_ton(text, doc_type):
        """
        Genera la estructura TON (Token Oriented Notation).
        Retorna un diccionario limpio clave-valor.
        """
        tokens = {}
        
        def get_val(pattern):
            m = re.search(pattern, text)
            return m.group(1).strip() if m else None

        if doc_type == 'DPI_FRONT':
            tokens['DOC_TYPE'] = 'DPI'
            tokens['CUI'] = get_val(r'(\d{4}\s*\d{5}\s*\d{4})')
            tokens['NOMBRE'] = get_val(r'NOMBRE\s*[:\.]?\s*(.*?)(?=APELLIDO|NACIONALIDAD)')
            tokens['APELLIDO'] = get_val(r'APELLIDO\s*[:\.]?\s*(.*?)(?=NACIONALIDAD|FECHA)')
            tokens['FECHA_NAC'] = get_val(r'(\d{2}\s*[A-Z]{3}\s*\d{4})')
            tokens['NACIONALIDAD'] = get_val(r'NACIONALIDAD\s*[:\.]?\s*([A-Z]+)')

        elif doc_type == 'RTU':
            tokens['DOC_TYPE'] = 'RTU'
            tokens['NIT'] = get_val(r'NIT\s*[:\.]?\s*([0-9A-Z\-]+)')
            tokens['NOMBRE_FISCAL'] = get_val(r'(?:NOMBRE|RAZÓN)\s*(?:SOCIAL)?[:\.]?\s*([^,\n]+)')
            # Lista de sucursales
            branches = re.findall(r'NOMBRE\s*COMERCIAL[:\.]?\s*([^,\n]+)', text)
            tokens['SUCURSALES'] = [b.strip() for b in branches if len(b) > 2]

        elif doc_type == 'PATENTE':
            tokens['DOC_TYPE'] = 'PATENTE'
            tokens['EMPRESA'] = get_val(r'EMPRESA\s*MERCANTIL.*?[:\.\s\n]+([^,\n]+)')
            tokens['REGISTRO'] = get_val(r'REGISTRO\s*[:\.]?\s*(\d+)')
            tokens['PROPIETARIO'] = get_val(r'NOMBRE\s*DEL\s*PROPIETARIO[:\.]?\s*([^,\n]+)')

        return tokens