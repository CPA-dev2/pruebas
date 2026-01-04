import os
import cv2
import re
import logging
import uuid
from typing import Dict, Any

from paddleocr import PaddleOCR
from rapidfuzz import fuzz

# Servicios internos
from app.services.image_processing import ImagePreprocessor
from app.services.pdf_parser import PDFParser
from app.services.qr_service import QREngine
from app.services.registry_validator import RegistryValidator # <--- NUEVO IMPORT
from app.core.config import settings

# Configuración Logs
logging.getLogger("ppocr").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class OCREngine:
    """
    Motor central unificado. 
    1. Intenta leer PDF Nativo (Texto + QR).
    2. Si falla o es imagen, preprocesa y usa OCR Visual + Detección QR.
    3. Si es Patente y tiene QR, valida contra el Registro Mercantil.
    """

    def __init__(self):
        # Cargar modelo personalizado si existe, sino usar default
        rec_model_dir = './training/output/final_dpi_model'
        if not os.path.exists(rec_model_dir):
            rec_model_dir = None
            
        self.ocr = PaddleOCR(
            use_angle_cls=True, 
            lang='es',
            rec_model_dir=rec_model_dir, 
            show_log=False
        )
        
        self.STOP_LABELS = [
            'NOMBRE', 'NOMBRES', 'APELLIDO', 'APELLIDOS',
            'NACIONALIDAD', 'SEXO', 'GENERO', 'FECHA', 'NACIMIENTO',
            'LUGAR', 'VECINDAD', 'ESTADO', 'CIVIL', 'CUI', 'REGISTRO',
            'PAIS', 'DE', 'NAC', 'GTM', 'IDGTM', 'RENAP', 'SERIE', 'NUMERO',
            'L:', 'F:', 'P:', 'LIBRO', 'FOLIO',
            'IDENTIFICACION', 'UBICACION', 'ACTIVIDAD', 'ESTABLECIMIENTOS', 
            'AFILIACIONES', 'VEHICULOS', 'CONTADOR', 'REPRESENTANTE'
        ]

    def process_document(self, file_path: str, doc_type: str) -> Dict[str, Any]:
        processed_path = None 
        temp_image_path = None 
        
        if not os.path.exists(file_path):
            return {'status': 'ERROR', 'data': {}, 'meta': {'message': 'Archivo no encontrado'}}

        # ==========================================================
        # 1. PARSING NATIVO (Prioritario para PDFs)
        # ==========================================================
        if file_path.lower().endswith('.pdf'):
            text_content = PDFParser.extract_text_content(file_path)
            
            # Si hay texto seleccionable
            if len(text_content.strip()) > 50: 
                try:
                    data = {}
                    if doc_type == 'RTU':
                        data = PDFParser.parse_rtu(text_content)
                    elif doc_type == 'PATENTE':
                        data = PDFParser.parse_patente(text_content)
                        
                        # --- QR & VALIDACION OFICIAL ---
                        qr_image = PDFParser.get_page_image(file_path, page_number=0)
                        if qr_image is not None:
                            qr_url = QREngine.scan_qr(qr_image)
                            if qr_url:
                                data['QR_URL'] = qr_url
                                # LLAMADA AL VALIDADOR WEB
                                validacion = RegistryValidator.validate_patente(data, qr_url)
                                data['VALIDACION_OFICIAL'] = validacion
                    
                    # Validar integridad mínima
                    has_key_data = (
                        data.get('NIT') or 
                        data.get('NOMBRE_COMPLETO') or 
                        data.get('RAZON_SOCIAL') or 
                        data.get('REGISTRO')
                    )
                    
                    if data and has_key_data:
                        # Si la validación oficial dice que coincide, score 100
                        score = 100
                        if doc_type == 'PATENTE':
                             val_info = data.get('VALIDACION_OFICIAL', {})
                             if val_info.get('COINCIDENCIA_TOTAL') is False:
                                 score = 60 # Penalizar si el QR dice una cosa y el PDF otra
                        
                        return {
                            'status': 'SUCCESS', 
                            'data': data, 
                            'meta': {
                                'isValid': True, 
                                'score': score, 
                                'method': 'NATIVE_PDF_VALIDATED'
                            }
                        }
                except Exception as e:
                    logger.error(f"Fallo en parser nativo: {e}. Intentando estrategia OCR.")

        # ==========================================================
        # 2. OCR VISUAL (Fallback para Imágenes o Scans)
        # ==========================================================
        try:
            file_to_process = file_path
            
            # Conversión PDF -> Imagen si falló el nativo
            if file_path.lower().endswith('.pdf'):
                logger.info("Convirtiendo PDF a Imagen para OCR...")
                pdf_image = PDFParser.get_page_image(file_path, page_number=0)
                if pdf_image is not None:
                    temp_name = f"{uuid.uuid4()}_temp_ocr.jpg"
                    temp_image_path = os.path.join(settings.TEMP_DIR, temp_name)
                    cv2.imwrite(temp_image_path, pdf_image)
                    file_to_process = temp_image_path
                else:
                    return {'status': 'FAILED', 'data': {}, 'meta': {'message': 'No se pudo rasterizar el PDF'}}

            # Preprocesamiento
            processed_path, perspective_fixed = ImagePreprocessor.enhance_document(file_to_process)
            
            if not processed_path:
                 return {'status': 'FAILED', 'data': {}, 'meta': {'message': 'Fallo en preprocesamiento'}}

            # --- VALIDACIÓN QR (IMAGEN) ---
            qr_url_visual = None
            if doc_type == 'PATENTE':
                qr_url_visual = QREngine.scan_qr(processed_path)

            # OCR Texto
            result = self.ocr.ocr(processed_path, cls=True)
            if not result or not result[0]:
                return {'status': 'FAILED', 'data': {}, 'meta': {'message': 'OCR no detectó texto'}}

            # Normalizar
            elements = self._normalize_ocr_result(result[0])
            full_text = " ".join([e['text'] for e in elements])
            data = {}

            # Parsing
            if doc_type == 'DPI_FRONT' or doc_type == 'DPI_FRONT_REPRESENTANTE':
                data = self._parse_dpi_front(elements, full_text)
            elif doc_type == 'DPI_BACK' or doc_type == 'DPI_BACK_REPRESENTANTE':
                spatial = self._parse_dpi_back_spatial(elements)
                mrz = self._parse_dpi_back_mrz(full_text)
                data = {**spatial, **mrz}
                if not data.get('FECHA_VENCIMIENTO') and data.get('FECHA_VENCIMIENTO_MRZ'):
                    data['FECHA_VENCIMIENTO'] = data['FECHA_VENCIMIENTO_MRZ']
            elif doc_type == 'RTU':
                data = self._parse_rtu_image(elements, full_text)
            elif doc_type == 'PATENTE':
                # En imágenes de patentes, el parsing nativo no funciona, pero tenemos el QR
                # Podemos confiar en los datos del QR si el OCR falla en la estructura
                pass
            
            # Integrar Validación Web en Imagen
            if doc_type == 'PATENTE' and qr_url_visual:
                data['QR_URL'] = qr_url_visual
                # Si el OCR de texto falló, podemos usar los datos de la web como primarios
                validacion = RegistryValidator.validate_patente(data, qr_url_visual) # data puede estar vacía
                data['VALIDACION_OFICIAL'] = validacion
                
                # Si el OCR no leyó nada pero el QR funcionó, rellenamos con datos de la web
                if validacion.get('ONLINE_CHECK') == 'SUCCESS' and not data.get('REGISTRO'):
                    web_data = validacion.get('DATOS_OFICIALES_WEB', {})
                    data['REGISTRO'] = web_data.get('REGISTRO')
                    data['FOLIO'] = web_data.get('FOLIO')
                    data['LIBRO'] = web_data.get('LIBRO')
                    data['NOMBRE_EMPRESA'] = web_data.get('NOMBRE')

            # Scoring
            is_valid_mrz = data.get('MRZ_VALID', False)
            has_qr_valid = data.get('VALIDACION_OFICIAL', {}).get('ONLINE_CHECK') == 'SUCCESS'
            
            found_fields = len([v for k, v in data.items() if v and 'MRZ' not in k])
            score = min(100, found_fields * 25)
            
            if is_valid_mrz or has_qr_valid: 
                score = max(score, 95)

            return {
                'status': 'SUCCESS' if score > 40 else 'UNREADABLE',
                'data': data,
                'meta': {
                    'isValid': score > 40,
                    'score': score,
                    'method': 'AI_OCR_ENHANCED'
                }
            }

        except Exception as e:
            logger.error(f"Error OCR Crítico: {e}", exc_info=True)
            return {'status': 'ERROR', 'meta': {'message': str(e)}, 'data': {}}
            
        finally:
            if processed_path and processed_path != file_path and os.path.exists(processed_path):
                try: os.remove(processed_path)
                except: pass
            if temp_image_path and os.path.exists(temp_image_path):
                try: os.remove(temp_image_path)
                except: pass

    # --- MÉTODOS PRIVADOS SIN CAMBIOS ---
    def _parse_dpi_front(self, elements, full_text):
        data = {}
        cui = re.search(r'(\d{4}\s?\d{5}\s?\d{4})', full_text.replace("CUI", ""))
        if cui: data['CUI'] = cui.group(1).replace(" ", "")
        data['NOMBRE'] = self._extract_block_spatial(elements, ['NOMBRE', 'NOMBRES'], ['APELLIDO'])
        data['APELLIDO'] = self._extract_block_spatial(elements, ['APELLIDO', 'APELLIDOS'], ['NACIONALIDAD', 'SEXO'])
        dob = re.search(r'(\d{1,2}\s?[A-Z]{3}\s?\d{4})', full_text)
        if dob: data['FECHA_NAC'] = dob.group(1)
        if 'MASCULINO' in full_text: data['GENERO'] = 'MASCULINO'
        elif 'FEMENINO' in full_text: data['GENERO'] = 'FEMENINO'
        return data

    def _parse_dpi_back_mrz(self, text):
        data = {}
        clean = text.replace(" ", "").upper()
        matches = re.findall(r'(IDGTM[A-Z0-9<]+)', clean)
        if matches:
            data['MRZ_RAW'] = "".join(matches)
            data['MRZ_VALID'] = True
            dates = re.search(r'\d{6}\d[MF]<*(\d{6})', data['MRZ_RAW'])
            if dates:
                venc = dates.group(1)
                try: data['FECHA_VENCIMIENTO_MRZ'] = f"{venc[4:6]}/{venc[2:4]}/20{venc[0:2]}"
                except: pass
        return data

    def _parse_dpi_back_spatial(self, elements):
        data = {}
        data['LUGAR_NACIMIENTO'] = self._extract_block_spatial(elements, ['LUGAR', 'NACIMIENTO'], ['VECINDAD'], width_tolerance=350)
        data['VECINDAD'] = self._extract_block_spatial(elements, ['VECINDAD'], ['NUMERO', 'SERIE'], width_tolerance=350)
        data['ESTADO_CIVIL'] = self._extract_block_spatial(elements, ['ESTADO', 'CIVIL'], ['FECHA', 'VENCIMIENTO'], width_tolerance=350)
        data['FECHA_VENCIMIENTO'] = self._extract_block_spatial(elements, ['FECHA', 'VENCIMIENTO'], ['IDGTM'], width_tolerance=350)
        for k, v in data.items(): 
            if v: data[k] = re.sub(r'^[\.\:\-\_]+\s*', '', v).strip()
        return data

    def _parse_rtu_image(self, elements, full_text):
        data = {}
        data['NIT'] = self._find_value_regex(full_text, r'NIT\s*:?\s*([0-9A-Z\-]+)')
        data['NOMBRE_PRIMERO'] = self._find_key_value(elements, "PRIMER NOMBRE")
        data['NOMBRE_SEGUNDO'] = self._find_key_value(elements, "SEGUNDO NOMBRE")
        data['APELLIDO_PRIMERO'] = self._find_key_value(elements, "PRIMER APELLIDO")
        data['APELLIDO_SEGUNDO'] = self._find_key_value(elements, "SEGUNDO APELLIDO")
        nom = f"{data.get('NOMBRE_PRIMERO','')} {data.get('NOMBRE_SEGUNDO','')}".strip()
        ape = f"{data.get('APELLIDO_PRIMERO','')} {data.get('APELLIDO_SEGUNDO','')}".strip()
        data['NOMBRE_COMPLETO'] = f"{nom} {ape}".strip()
        data['CUI'] = self._find_key_value(elements, "CODIGO UNICO DE IDENTIFICACION")
        data['FECHA_NAC'] = self._find_key_value(elements, "FECHA DE NACIMIENTO")
        depto = self._find_key_value(elements, "DEPARTAMENTO")
        muni = self._find_key_value(elements, "MUNICIPIO")
        zona = self._find_key_value(elements, "ZONA")
        vial = self._find_key_value(elements, "VIALIDAD")
        num = self._find_key_value(elements, "NUMERO DE VIALIDAD")
        col = self._find_key_value(elements, "COLONIA") or self._find_key_value(elements, "BARRIO")
        dir_p = []
        if num and vial: dir_p.append(f"{num} {vial}")
        elif vial: dir_p.append(vial)
        if zona: dir_p.append(f"ZONA {zona}")
        if col: dir_p.append(col)
        if muni: dir_p.append(muni)
        if depto: dir_p.append(depto)
        data['DIRECCION_FISCAL'] = ", ".join(dir_p)
        data['NOMBRE_COMERCIAL'] = self._find_key_value(elements, "NOMBRE COMERCIAL")
        return data

    def _extract_block_spatial(self, elements, starts, stops, width_tolerance=600):
        start_y, stop_y, start_x = -1, 99999, 0
        for el in elements:
            for s in starts:
                if fuzz.ratio(s, el['text']) > 85:
                    start_y, start_x = el['y_max'], el['x_min']
                    break
            if start_y > 0: break
        if start_y == -1: return None
        for el in elements:
            if el['y_min'] > start_y:
                for s in stops + self.STOP_LABELS:
                    if fuzz.ratio(s, el['text']) > 85:
                        stop_y = min(stop_y, el['y_min'])
        cands = [el['text'] for el in elements if start_y < el['y_min'] < stop_y and -100 < (el['x_min'] - start_x) < width_tolerance]
        return " ".join(cands) if cands else None

    def _find_key_value(self, elements, key, max_dist=500):
        key_box = next((el for el in elements if fuzz.partial_ratio(key, el['text']) > 90), None)
        if not key_box: return None
        y_mid = (key_box['y_min'] + key_box['y_max']) / 2
        cands = [(el['x_min'], el['text']) for el in elements if el is not key_box and el['y_min'] < y_mid < el['y_max'] and el['x_min'] > key_box['x_max'] and (el['x_min'] - key_box['x_max']) < max_dist]
        return sorted(cands, key=lambda x: x[0])[0][1] if cands else None

    def _find_value_regex(self, text, pat):
        m = re.search(pat, text)
        return m.group(1) if m else None

    def _normalize_ocr_result(self, res):
        els = []
        for line in res:
            coords, (text, _) = line[0], line[1]
            xs, ys = [p[0] for p in coords], [p[1] for p in coords]
            els.append({'text': text.upper(), 'x_min': min(xs), 'x_max': max(xs), 'y_min': min(ys), 'y_max': max(ys)})
        return sorted(els, key=lambda x: x['y_min'])