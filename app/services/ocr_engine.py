import os
import cv2
import numpy as np
import re
import logging
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
from rapidfuzz import fuzz

logging.getLogger("ppocr").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class OCREngine:
    def __init__(self, debug=False):
        # show_log=False mantiene la consola limpia
        self.ocr = PaddleOCR(use_angle_cls=True, lang='es', show_log=False)
        self.debug = debug

        # Etiquetas que actúan como "Muros" o barreras
        self.STOP_LABELS = [
            'NOMBRE', 'NOMBRES', 'APELLIDO', 'APELLIDOS',
            'NACIONALIDAD', 'SEXO', 'GENERO', 'FECHA', 'NACIMIENTO',
            'LUGAR', 'VECINDAD', 'ESTADO', 'CIVIL', 'CUI', 'REGISTRO',
            'PAIS', 'DE', 'NAC', 'GTM', 'PAISDENAC', 'PAIS DE NAC', 
            'FOLIO', 'LIBRO', 'EXPEDIENTE', 'TITULAR', 'EMPRESA', 'NIT'
        ]

        # Configuración espacial
        self.FUZZY_LABEL_THRESH = 88
        self.MAX_VERTICAL_DIST = 250  # Distancia máxima de búsqueda si no hay barrera

    def generate_ton(self, text_ignored, doc_type: str, file_path: str = None) -> dict:
        if not file_path or not os.path.exists(file_path):
            return {}

        ext = os.path.splitext(file_path)[1].lower()
        target_image = file_path
        temp_img_created = False
        
        # Conversión PDF
        if ext == '.pdf':
            try:
                images = convert_from_path(file_path)
                if images:
                    target_image = file_path + "_temp.jpg"
                    images[0].save(target_image, 'JPEG')
                    temp_img_created = True
            except Exception as e:
                logger.error(f"Error PDF: {e}")
                return {}

        try:
            # 1. Preprocesamiento ligero
            preprocessed = self._preprocess_image_for_ocr(target_image)
            
            # 2. Inferencia OCR
            result = self.ocr.ocr(preprocessed, cls=True)
            if not result or not result[0]:
                return {}

            # 3. Normalizar Elementos
            elements = self._normalize_ocr_result(result[0])

            # Zona de exclusión (Encabezado)
            # Ignoramos el 12% superior para evitar leer títulos como campos
            max_y = max([el['y_max'] for el in elements]) if elements else 0
            header_limit = max_y * 0.12
            valid_elements = [el for el in elements if el['y_min'] > header_limit]
            
            # Fallback si recortamos demasiado
            if len(valid_elements) < 5: valid_elements = elements

            data = {}
            
            # --- LÓGICA DPI FRONTAL ---
            if doc_type == 'DPI_FRONT':
                # CUI
                data['CUI'] = self._find_cui(elements) # Usamos todos los elementos para el CUI

                # ESTRATEGIA DE BARRERAS
                # 1. NOMBRE: Busca desde "NOMBRE" hasta "APELLIDO"
                data['NOMBRE'] = self._extract_block_spatial(
                    valid_elements, 
                    start_label=['NOMBRE', 'NOMBRES'], 
                    stop_labels=['APELLIDO', 'APELLIDOS']
                )

                # 2. APELLIDO: Busca desde "APELLIDO" hasta "NACIONALIDAD" o "PAIS"
                data['APELLIDO'] = self._extract_block_spatial(
                    valid_elements, 
                    start_label=['APELLIDO', 'APELLIDOS'], 
                    stop_labels=['NACIONALIDAD', 'SEXO', 'GENERO', 'PAIS', 'GTM']
                )

                # 3. FECHA NACIMIENTO
                data['FECHA_NAC'] = self._extract_block_spatial(
                    valid_elements,
                    start_label=['NACIMIENTO', 'FECHA'],
                    stop_labels=['LUGAR', 'VECINDAD']
                )
                # Fallback Fecha por patrón regex (16SEP1998)
                if not data.get('FECHA_NAC'):
                    full_text = " ".join([e['text'] for e in valid_elements])
                    m = re.search(r'(\d{1,2}\s*[A-Z]{3}\s*\d{4})', full_text)
                    if m: data['FECHA_NAC'] = m.group(1)

                # 4. GENERO
                data['GENERO'] = self._extract_block_spatial(valid_elements, ['SEXO', 'GENERO'], ['FECHA'])
                if not data.get('GENERO'):
                    # Búsqueda directa
                    if any('MASCULINO' in e['text'] for e in valid_elements): data['GENERO'] = 'MASCULINO'
                    elif any('FEMENINO' in e['text'] for e in valid_elements): data['GENERO'] = 'FEMENINO'

                # 5. NACIONALIDAD
                data['NACIONALIDAD'] = self._extract_block_spatial(valid_elements, ['NACIONALIDAD'], ['SEXO', 'PAIS'])
                if not data.get('NACIONALIDAD') and any('GTM' in e['text'] for e in valid_elements):
                    data['NACIONALIDAD'] = 'GTM'
                
                # 6. PAIS NACIMIENTO
                data['PAIS_NAC'] = self._extract_block_spatial(valid_elements, ['PAIS', 'NAC'], ['GTM', 'FOTO'])
                if data.get('PAIS_NAC') and ("GTM" in data['PAIS_NAC'] or "GUATE" in data['PAIS_NAC']):
                     data['PAIS_NAC'] = "GTM"

                # Limpieza final de nombres (quitar basura si quedó)
                for field in ['NOMBRE', 'APELLIDO']:
                    if data.get(field):
                        # Quitar dos puntos, puntos iniciales y espacios dobles
                        data[field] = re.sub(r'^[\.\:\-]+\s*', '', data[field]).strip()

            # --- OTROS DOCUMENTOS ---
            elif doc_type == 'DPI_BACK':
                # MRZ
                full_str = "".join([e['text'] for e in elements])
                m = re.search(r'(IDGTM\w+)', full_str.replace(" ", ""))
                data['MRZ_RAW'] = m.group(1) if m else None
                
                data['VECINDAD'] = self._extract_block_spatial(valid_elements, ['VECINDAD'], ['ESTADO', 'CIVIL'])
                data['ESTADO_CIVIL'] = self._extract_block_spatial(valid_elements, ['CIVIL', 'ESTADO'], ['FECHA'])

            elif doc_type == 'RTU':
                data['NIT'] = self._find_value_right_or_below(valid_elements, ['NIT'])
                if data.get('NIT'): data['NIT'] = re.sub(r'[^0-9A-Z\-]', '', data['NIT'])
                
                data['NOMBRE_FISCAL'] = self._extract_block_spatial(
                    valid_elements, 
                    start_label=['NOMBRE', 'RAZON', 'SOCIAL'], 
                    stop_labels=['COMERCIAL', 'ESTABLECIMIENTO', 'NIT']
                )

            elif doc_type == 'PATENTE':
                data['REGISTRO'] = self._extract_block_spatial(valid_elements, ['REGISTRO'], ['FOLIO'])
                data['EMPRESA'] = self._extract_block_spatial(valid_elements, ['EMPRESA', 'MERCANTIL'], ['NUMERO'])
                data['PROPIETARIO'] = self._extract_block_spatial(valid_elements, ['PROPIETARIO'], ['DIRECCION'])

            # Construir respuesta final
            is_valid = bool(data.get('CUI') or data.get('MRZ_RAW') or data.get('NIT') or data.get('REGISTRO'))
            
            return {
                'status': 'SUCCESS' if is_valid else 'FAIL',
                'meta': {
                    'isValid': is_valid,
                    'score': 100 if is_valid else 0,
                    'message': 'Documento Procesado' if is_valid else 'No legible'
                },
                'data': data
            }

        except Exception as e:
            logger.error(f"Error Fatal: {e}")
            return {'status': 'ERROR', 'meta': {'isValid': False, 'message': str(e)}, 'data': {}}
        finally:
            if temp_img_created and os.path.exists(target_image):
                try: os.remove(target_image)
                except: pass

    # ------------------ MÉTODOS CORE DE IA ESPACIAL ------------------

    def _extract_block_spatial(self, elements, start_label, stop_labels):
        """
        Encuentra una etiqueta y captura TODO el texto hasta encontrar la siguiente etiqueta (barrera).
        """
        # Normalizar listas
        start_labels = start_label if isinstance(start_label, list) else [start_label]
        stop_labels = stop_labels if isinstance(stop_labels, list) else [stop_labels]

        # 1. Encontrar la caja de inicio (Etiqueta)
        label_box = None
        best_ratio = 0
        
        for el in elements:
            for kw in start_labels:
                ratio = fuzz.partial_ratio(kw, el['text'])
                if ratio > 90:
                    # Protección: Evitar falsos positivos en textos largos
                    if len(el['text']) < len(kw) + 12:
                        if ratio > best_ratio:
                            best_ratio = ratio
                            label_box = el
        
        if not label_box: return None

        # 2. Encontrar la Barrera Inferior (La etiqueta de parada más cercana)
        barrier_y = label_box['y_max'] + self.MAX_VERTICAL_DIST # Límite por defecto
        
        # Coordenadas de referencia
        l_x_min = label_box['x_min']
        l_y_max = label_box['y_max']

        for el in elements:
            if el is label_box: continue
            
            # Solo miramos cosas que están DEBAJO de nuestra etiqueta
            if el['y_min'] > l_y_max:
                # ¿Es esto una etiqueta de parada?
                is_stop = False
                for sl in stop_labels + self.STOP_LABELS:
                    # Chequeo estricto para stop labels
                    if fuzz.ratio(sl, el['text']) > 85 or \
                       (len(el['text']) < 20 and fuzz.partial_ratio(sl, el['text']) > 90):
                        is_stop = True
                        break
                
                # Si es una etiqueta y está alineada (más o menos) o centrada, es una barrera
                if is_stop:
                    # Si está alineada horizontalmente (o es muy ancha), actualizamos la barrera
                    if el['x_min'] < l_x_min + 300: 
                        if el['y_min'] < barrier_y:
                            barrier_y = el['y_min']

        # 3. Recolectar candidatos dentro de la zona segura (Start -> Barrera)
        candidates = []
        for el in elements:
            if el is label_box: continue
            
            # Filtro Vertical: Entre la etiqueta y la barrera
            # Permitimos -15px de tolerancia superior para capturar líneas muy pegadas
            if el['y_min'] > (l_y_max - 15) and el['y_max'] < (barrier_y + 10):
                
                # Filtro Horizontal: Alineación izquierda con tolerancia a sangría
                h_diff = el['x_min'] - l_x_min
                # -40px (un poco a la izq) hasta +250px (sangría o nombre corto)
                if -40 < h_diff < 250:
                    # Filtro extra: Que no sea una stop label que se nos pasó
                    if not any(fuzz.ratio(sl, el['text']) > 85 for sl in self.STOP_LABELS):
                        candidates.append(el)

        # Ordenar y unir
        if candidates:
            candidates.sort(key=lambda x: x['y_min'])
            return " ".join([c['text'] for c in candidates])
        
        return None

    def _find_value_right_or_below(self, elements, labels):
        """Intenta buscar a la derecha; si falla, busca abajo (bloque)."""
        # 1. Buscar a la derecha
        for el in elements:
            for kw in labels:
                if fuzz.partial_ratio(kw, el['text']) > 90:
                    # Barrido a la derecha en la misma línea
                    candidates = []
                    for cand in elements:
                        if cand is el: continue
                        # Misma Y, a la derecha X
                        if abs(cand['y_min'] - el['y_min']) < 20 and cand['x_min'] > el['x_max']:
                            candidates.append(cand)
                    
                    if candidates:
                        candidates.sort(key=lambda x: x['x_min'])
                        return candidates[0]['text']
        
        # 2. Si falla, usar lógica espacial estándar (abajo)
        return self._extract_block_spatial(elements, labels, self.STOP_LABELS)

    def _find_cui(self, elements):
        # Lógica robusta para encontrar 13 dígitos
        for el in elements:
            clean = re.sub(r'[^0-9]', '', el['text'])
            if len(clean) == 13:
                return f"{clean[:4]} {clean[4:9]} {clean[9:]}"
        # Intento concatenado
        full = "".join([e['text'] for e in elements])
        m = re.search(r'(\d{13})', re.sub(r'[^0-9]', '', full))
        if m:
            s = m.group(1)
            return f"{s[:4]} {s[4:9]} {s[9:]}"
        return None

    def _preprocess_image_for_ocr(self, path):
        img = cv2.imread(path)
        if img is None: return path
        # Aumentar contraste y escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Denoising suave
        gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        # Guardar temp
        tmp_path = path + ".proc.jpg"
        cv2.imwrite(tmp_path, gray)
        return tmp_path

    def _normalize_ocr_result(self, ocr_lines):
        elements = []
        for line in ocr_lines:
            coords = line[0]
            text = str(line[1][0]).strip().upper()
            xs = [p[0] for p in coords]
            ys = [p[1] for p in coords]
            elements.append({
                'text': text,
                'x_min': min(xs),
                'x_max': max(xs),
                'y_min': min(ys),
                'y_max': max(ys)
            })
        return elements