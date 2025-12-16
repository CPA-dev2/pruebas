import os
import cv2
import re
import logging
from paddleocr import PaddleOCR
from rapidfuzz import fuzz
from app.services.image_processing import ImagePreprocessor
from app.services.pdf_parser import PDFParser

# Reducir ruido de logs
logging.getLogger("ppocr").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class OCREngine:
    def __init__(self):
        # Modelo ligero, detecta ángulos
        self.ocr = PaddleOCR(
            use_angle_cls=True, 
            lang='es',
            rec_model_dir='./training/output/final_dpi_model', 
            show_log=False
        )
        
        # Etiquetas de parada globales (DPI + RTU Stop Words)
        self.STOP_LABELS = [
            'NOMBRE', 'NOMBRES', 'APELLIDO', 'APELLIDOS',
            'NACIONALIDAD', 'SEXO', 'GENERO', 'FECHA', 'NACIMIENTO',
            'LUGAR', 'VECINDAD', 'ESTADO', 'CIVIL', 'CUI', 'REGISTRO',
            'PAIS', 'DE', 'NAC', 'GTM', 'IDGTM', 'RENAP', 'SERIE', 'NUMERO',
            'L:', 'F:', 'P:', 'LIBRO', 'FOLIO',
            # Nuevas Stop Labels para RTU
            'IDENTIFICACION', 'UBICACION', 'ACTIVIDAD', 'ESTABLECIMIENTOS', 
            'AFILIACIONES', 'VEHICULOS', 'CONTADOR', 'REPRESENTANTE'
        ]

    def process_document(self, file_path: str, doc_type: str) -> dict:
        print(f"Procesando {doc_type}...")
        if not os.path.exists(file_path):
            return {'status': 'ERROR', 'data': {}, 'meta': {'message': 'Archivo no encontrado'}}

        # 1. ESTRATEGIA PARA PDF NATIVO (RTU / PATENTE)
        if file_path.lower().endswith('.pdf'):
            text_content = PDFParser.extract_text_content(file_path)
            # Si tiene suficiente texto, procesamos como PDF nativo
            if len(text_content) > 100: 
                data = {}
                if doc_type == 'RTU':
                    data = PDFParser.parse_rtu(text_content)
                elif doc_type == 'PATENTE':
                    data = PDFParser.parse_patente(text_content)
                
                if data:
                    return {
                        'status': 'SUCCESS', 
                        'data': data, 
                        'meta': {'isValid': True, 'score': 100, 'method': 'NATIVE_PDF'}
                    }

        # 2. ESTRATEGIA PARA IMÁGENES
        processed_path, perspective_fixed = ImagePreprocessor.enhance_document(file_path)
        
        try:
            result = self.ocr.ocr(processed_path, cls=True)
            if not result or not result[0]:
                return {'status': 'FAILED', 'data': {}, 'meta': {'message': 'No se detectó texto'}}

            elements = self._normalize_ocr_result(result[0])
            full_text = " ".join([e['text'] for e in elements])
            data = {}

            # --- LÓGICA ESPECÍFICA ---
            
            if doc_type == 'DPI_FRONT':
                data = self._parse_dpi_front(elements, full_text)

            elif doc_type == 'DPI_BACK':
                # 1. Lectura Visual (Prioridad para textos)
                spatial_data = self._parse_dpi_back_spatial(elements)
                
                # 2. Lectura MRZ (Prioridad para validación)
                mrz_data = self._parse_dpi_back_mrz(full_text)
                
                # 3. Fusión
                data = {**spatial_data, **mrz_data}
                
                # 4. Fallback Cruzado
                if not data.get('FECHA_VENCIMIENTO') and data.get('FECHA_VENCIMIENTO_MRZ'):
                    data['FECHA_VENCIMIENTO'] = data['FECHA_VENCIMIENTO_MRZ']

            elif doc_type == 'RTU':
                # Nueva lógica avanzada para RTU en imagen
                data = self._parse_rtu_image(elements, full_text)
            
            # Validación Final
            is_valid_mrz = data.get('MRZ_VALID', False)
            found_fields = len([v for k, v in data.items() if v and 'MRZ' not in k])
            
            # Calcular Score
            score = min(100, found_fields * 25)
            if is_valid_mrz:
                score = max(score, 95) # MRZ garantiza autenticidad

            return {
                'status': 'SUCCESS' if score > 80 else 'UNREADABLE',
                'data': data,
                'meta': {
                    'isValid': score > 80,
                    'score': score,
                    'method': 'AI_OCR_ENHANCED' if perspective_fixed else 'AI_OCR_STANDARD'
                }
            }

        except Exception as e:
            logger.error(f"Error OCR: {e}")
            return {'status': 'ERROR', 'meta': {'message': str(e)}, 'data': {}}
        finally:
            if processed_path != file_path and os.path.exists(processed_path):
                os.remove(processed_path)

    # --- PARSERS ---

    def _parse_dpi_front(self, elements, full_text):
        data = {}
        cui_match = re.search(r'(\d{4}\s?\d{5}\s?\d{4})', full_text.replace("CUI", ""))
        if cui_match:
            data['CUI'] = cui_match.group(1).replace(" ", "")

        data['NOMBRE'] = self._extract_block_spatial(elements, ['NOMBRE', 'NOMBRES'], ['APELLIDO'])
        data['APELLIDO'] = self._extract_block_spatial(elements, ['APELLIDO', 'APELLIDOS'], ['NACIONALIDAD', 'SEXO', 'GENERO'])
        
        dob_match = re.search(r'(\d{1,2}\s?[A-Z]{3}\s?\d{4})', full_text)
        if dob_match:
            data['FECHA_NAC'] = dob_match.group(1)

        if 'MASCULINO' in full_text: data['GENERO'] = 'MASCULINO'
        elif 'FEMENINO' in full_text: data['GENERO'] = 'FEMENINO'
        return data

    def _parse_dpi_back_mrz(self, text):
        data = {}
        clean_text = text.replace(" ", "").upper()
        # Regex para MRZ de Guatemala (IDGTM)
        matches = re.findall(r'(IDGTM[A-Z0-9<]+)', clean_text)
        
        if matches:
            mrz_raw = "".join(matches)
            data['MRZ_RAW'] = mrz_raw
            data['MRZ_VALID'] = True
            
            # Extraer Fecha Vencimiento del MRZ (Formato YYMMDD)
            # Busca: 6 digitos nacimiento + digito check + sexo + 6 digitos vencimiento
            dates_match = re.search(r'\d{6}\d[MF]<*(\d{6})', mrz_raw)
            if dates_match:
                venc_yymmdd = dates_match.group(1)
                try:
                    yy, mm, dd = venc_yymmdd[0:2], venc_yymmdd[2:4], venc_yymmdd[4:6]
                    data['FECHA_VENCIMIENTO_MRZ'] = f"{dd}/{mm}/20{yy}"
                except: pass
        return data

    def _parse_dpi_back_spatial(self, elements):
        data = {}
        
        # --- COLUMNA IZQUIERDA (Usamos width_tolerance=320 para no leer la derecha) ---
        
        # 1. LUGAR DE NACIMIENTO
        # Para en "VECINDAD" o datos de libro "L:"
        data['LUGAR_NACIMIENTO'] = self._extract_block_spatial(
            elements, 
            start_labels=['LUGAR', 'NACIMIENTO'], 
            stop_labels=['VECINDAD', 'L:', 'LIBRO'],
            width_tolerance=320 
        )

        # 2. VECINDAD
        # Para en "NÚMERO DE SERIE" o pie de página. 
        # width_tolerance evita que lea "SOLTERO" o "ESTADO CIVIL"
        data['VECINDAD'] = self._extract_block_spatial(
            elements, 
            start_labels=['VECINDAD'], 
            stop_labels=['NUMERO', 'SERIE', 'IDGTM'],
            width_tolerance=320 
        )

        # --- COLUMNA DERECHA ---

        # 3. ESTADO CIVIL
        # Está a la derecha. Para en "FECHA DE VENCIMIENTO"
        data['ESTADO_CIVIL'] = self._extract_block_spatial(
            elements, 
            start_labels=['ESTADO', 'CIVIL'], 
            stop_labels=['FECHA', 'VENCIMIENTO'],
            width_tolerance=320
        )

        # 4. FECHA DE VENCIMIENTO
        # Para en el MRZ (IDGTM) o Numero de Serie
        data['FECHA_VENCIMIENTO'] = self._extract_block_spatial(
            elements, 
            start_labels=['FECHA', 'VENCIMIENTO'], 
            stop_labels=['IDGTM', 'NUMERO', 'SERIE'],
            width_tolerance=320
        )

        # Limpieza de caracteres basura
        for key in data:
            if data[key]:
                # Elimina puntos, dos puntos o guiones al inicio
                data[key] = re.sub(r'^[\.\:\-\_]+\s*', '', data[key]).strip()

        return data

    # --- NUEVO PARSER PARA RTU (IMAGEN) ---

    def _parse_rtu_image(self, elements, full_text):
        """
        Extrae datos del RTU analizando la estructura tabular (Clave -> Valor a la derecha).
        """
        data = {}
        
        # 1. NIT (Encabezado)
        data['NIT'] = self._find_value_regex(full_text, r'NIT\s*:?\s*([0-9A-Z\-]+)')

        # 2. SECCIÓN IDENTIFICACIÓN (Búsqueda Key-Value en tabla)
        data['NOMBRE_PRIMERO'] = self._find_key_value(elements, "PRIMER NOMBRE")
        data['NOMBRE_SEGUNDO'] = self._find_key_value(elements, "SEGUNDO NOMBRE")
        data['APELLIDO_PRIMERO'] = self._find_key_value(elements, "PRIMER APELLIDO")
        data['APELLIDO_SEGUNDO'] = self._find_key_value(elements, "SEGUNDO APELLIDO")
        
        # Construcción de nombre completo
        nombres = f"{data.get('NOMBRE_PRIMERO', '')} {data.get('NOMBRE_SEGUNDO', '')}".strip()
        apellidos = f"{data.get('APELLIDO_PRIMERO', '')} {data.get('APELLIDO_SEGUNDO', '')}".strip()
        data['NOMBRE_COMPLETO'] = f"{nombres} {apellidos}".strip()

        data['CUI'] = self._find_key_value(elements, "CODIGO UNICO DE IDENTIFICACION")
        data['FECHA_NAC'] = self._find_key_value(elements, "FECHA DE NACIMIENTO")
        data['ESTADO_CIVIL'] = self._find_key_value(elements, "ESTADO CIVIL")
        data['NACIONALIDAD'] = self._find_key_value(elements, "NACIONALIDAD")
        
        # 3. SECCIÓN UBICACIÓN (Dirección Fiscal)
        depto = self._find_key_value(elements, "DEPARTAMENTO")
        muni = self._find_key_value(elements, "MUNICIPIO")
        zona = self._find_key_value(elements, "ZONA")
        vialidad = self._find_key_value(elements, "VIALIDAD") # Calle/Avenida
        numero = self._find_key_value(elements, "NUMERO DE VIALIDAD")
        colonia = self._find_key_value(elements, "COLONIA") or self._find_key_value(elements, "BARRIO")
        
        dir_parts = []
        if numero and vialidad: dir_parts.append(f"{numero} {vialidad}")
        elif vialidad: dir_parts.append(vialidad)
        if zona: dir_parts.append(f"ZONA {zona}")
        if colonia: dir_parts.append(colonia)
        if muni: dir_parts.append(muni)
        if depto: dir_parts.append(depto)
        
        data['DIRECCION_FISCAL'] = ", ".join(dir_parts)

        # 4. ACTIVIDAD ECONÓMICA
        # Buscar encabezado y leer el código debajo (formato XXXX.XX)
        act_header = self._find_element(elements, "ACTIVIDAD ECONOMICA")
        if act_header:
            for el in elements:
                # Buscar debajo del encabezado
                if el['y_min'] > act_header['y_max']:
                    # Patrón de código de actividad (ej: 9101.40)
                    if re.match(r'^\d{4}\.\d{2}$', el['text']):
                        data['ACTIVIDAD_CODIGO'] = el['text']
                        # La descripción suele estar a la derecha del código
                        data['ACTIVIDAD_DESC'] = self._find_value_right_of_box(elements, el)
                        break

        # 5. ESTABLECIMIENTOS (Nombre Comercial)
        data['NOMBRE_COMERCIAL'] = self._find_key_value(elements, "NOMBRE COMERCIAL")
        
        return data

    # --- MOTOR ESPACIAL ---

    def _extract_block_spatial(self, elements, start_labels, stop_labels, width_tolerance=600):
        """
        Extrae texto en bloque vertical respetando columnas.
        width_tolerance: Distancia máxima horizontal desde el inicio de la etiqueta.
        """
        start_y = -1
        stop_y = 99999
        start_x_min = 0
        
        # 1. Localizar etiqueta de inicio (Header)
        for el in elements:
            for lbl in start_labels:
                if fuzz.ratio(lbl, el['text']) > 85:
                    start_y = el['y_max']
                    start_x_min = el['x_min']
                    break
            if start_y > 0: break
            
        if start_y == -1: return None

        # 2. Localizar barrera inferior (Stop Label)
        for el in elements:
            # Solo buscar barreras debajo del inicio
            if el['y_min'] > start_y:
                for lbl in stop_labels + self.STOP_LABELS:
                    if fuzz.ratio(lbl, el['text']) > 85:
                        # Si encontramos una barrera, guardamos su Y
                        if el['y_min'] < stop_y:
                            stop_y = el['y_min']

        # 3. Recolectar candidatos (Filtrado Espacial)
        candidates = []
        for el in elements:
            # Filtro Vertical: Estar entre la etiqueta y la barrera
            if start_y < el['y_min'] < stop_y:
                
                # Filtro Horizontal: Pertenecer a la misma columna
                # Calculamos la distancia horizontal relativa a la etiqueta
                h_dist = el['x_min'] - start_x_min
                
                # Reglas:
                # > -100: Permite sangría ligera a la izquierda (ej. error de alineación)
                # < width_tolerance: No irse a la columna de al lado
                if -100 < h_dist < width_tolerance:
                    candidates.append(el['text'])
        
        return " ".join(candidates) if candidates else None

    # --- NUEVOS HELPERS PARA RTU ---

    def _find_key_value(self, elements, key_label, max_dist=500):
        """
        Encuentra una etiqueta (ej: 'PRIMER NOMBRE') y devuelve el texto que está 
        inmediatamente a su DERECHA en la misma línea.
        """
        key_box = None
        for el in elements:
            if fuzz.partial_ratio(key_label, el['text']) > 90:
                key_box = el
                break
        
        if not key_box: return None
        
        # Buscar elementos a la derecha y en la misma línea Y
        y_mid = (key_box['y_min'] + key_box['y_max']) / 2
        candidates = []
        
        for el in elements:
            if el is key_box: continue
            
            # Chequeo Vertical: El centro de la etiqueta pasa por el elemento
            if el['y_min'] < y_mid < el['y_max']:
                # Chequeo Horizontal: Está a la derecha
                if el['x_min'] > key_box['x_max']:
                    dist = el['x_min'] - key_box['x_max']
                    if dist < max_dist:
                        candidates.append((dist, el['text']))
        
        if candidates:
            candidates.sort(key=lambda x: x[0])
            return candidates[0][1]
        return None

    def _find_value_right_of_box(self, elements, ref_box):
        """Devuelve el texto a la derecha de una caja de referencia."""
        y_mid = (ref_box['y_min'] + ref_box['y_max']) / 2
        candidates = []
        for el in elements:
            if el is ref_box: continue
            if el['y_min'] < y_mid < el['y_max'] and el['x_min'] > ref_box['x_max']:
                candidates.append((el['x_min'], el['text']))
        
        if candidates:
            candidates.sort(key=lambda x: x[0])
            return candidates[0][1]
        return None

    def _find_element(self, elements, text):
        """Busca un elemento por texto aproximado."""
        for el in elements:
            if fuzz.partial_ratio(text, el['text']) > 90:
                return el
        return None

    # --- UTILIDADES GENERALES ---

    def _find_value_regex(self, text, pattern):
        m = re.search(pattern, text)
        return m.group(1) if m else None

    def _normalize_ocr_result(self, ocr_result):
        elements = []
        for line in ocr_result:
            coords = line[0]
            text = line[1][0].upper()
            xs = [p[0] for p in coords]
            ys = [p[1] for p in coords]
            elements.append({
                'text': text,
                'x_min': min(xs), 'x_max': max(xs),
                'y_min': min(ys), 'y_max': max(ys)
            })
        return sorted(elements, key=lambda x: x['y_min'])