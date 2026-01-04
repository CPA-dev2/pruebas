import fitz  # PyMuPDF
import re
import logging
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

class PDFParser:
    """
    Parser especializado para documentos PDF nativos (digitales) de Guatemala.
    Soporta extracción de texto estructurado y renderizado de páginas para validación visual (QR).
    """

    @staticmethod
    def extract_text_content(file_path: str) -> str:
        """Extrae el texto crudo preservando el orden visual (layout)."""
        text_content = ""
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    # 'sort=True' es vital para leer tablas complejas en orden
                    text_content += page.get_text("text", sort=True) + "\n"
            return text_content
        except Exception as e:
            logger.error(f"Error leyendo PDF nativo: {e}")
            return ""

    @staticmethod
    def get_page_image(file_path: str, page_number: int = 0) -> Optional[np.ndarray]:
        """
        Renderiza una página específica del PDF como una imagen (numpy array BGR).
        Utilizado para escanear QRs incrustados en PDFs digitales.
        """
        try:
            with fitz.open(file_path) as doc:
                if page_number >= len(doc):
                    return None
                
                page = doc.load_page(page_number)
                # Zoom x2 para asegurar que QRs pequeños tengan suficiente resolución
                mat = fitz.Matrix(2, 2)
                pix = page.get_pixmap(matrix=mat)
                
                # Convertir buffer de bytes a array numpy
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                # Ajustar espacio de color a BGR (formato estándar OpenCV)
                import cv2
                if pix.n == 4: # RGBA
                    return cv2.cvtColor(img_data, cv2.COLOR_RGBA2BGR)
                elif pix.n == 3: # RGB
                    return cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
                
                return img_data

        except Exception as e:
            logger.error(f"Error renderizando página de PDF: {e}")
            return None

    @staticmethod
    def parse_rtu(text: str) -> Dict[str, Any]:
        """
        Parsea RTUs de SAT (Soporta estructura de Pequeño Contribuyente y Sociedades).
        Extrae NIT, Datos Generales, Establecimientos, Impuestos y Forma de Cálculo.
        """
        data = {
            "TIPO_DOCUMENTO": "RTU",
            "METODO": "NATIVE_PDF_PARSER",
            "ESTABLECIMIENTOS": [],
            "IMPUESTOS": [],
            "FORMA_CALCULO_IVA": None, # Nuevo campo solicitado
            "DIRECCION_FISCAL": None
        }
        
        # Limpieza base
        text = text.replace('\xa0', ' ').replace('\r', '')

        # ---------------------------------------------------------
        # 1. NIT (Dato universal) [cite: 4]
        # ---------------------------------------------------------
        m_nit = re.search(r'(?:SAT\s*)?NIT:?\s*([0-9A-Z\-]+)', text)
        if m_nit: 
            data['NIT'] = m_nit.group(1).strip()

        # ---------------------------------------------------------
        # 2. Identificación (Diferenciación S.A. vs Individual) [cite: 6, 7]
        # ---------------------------------------------------------
        m_razon = re.search(r'Razón o denominación social:[\s\n]+([^\n]+)', text, re.IGNORECASE)
        
        if m_razon:
            # --- JURIDICA ---
            data['TIPO_PERSONA'] = 'JURIDICA'
            data['RAZON_SOCIAL'] = m_razon.group(1).strip()
            data['NOMBRE_COMPLETO'] = data['RAZON_SOCIAL']
            
            m_rep = re.search(r'Nombre del representante:[\s\n]+([^\n]+)', text, re.IGNORECASE)
            if m_rep:
                data['REPRESENTANTE_LEGAL'] = m_rep.group(1).strip()
            
            data['FECHA_CONSTITUCION'] = PDFParser._find_value(text, r'Fecha de constitución:', r'(\d{2}/\d{2}/\d{4})')
        else:
            # --- INDIVIDUAL ---
            data['TIPO_PERSONA'] = 'INDIVIDUAL'
            
            p_nom = PDFParser._find_value(text, r'Primer nombre:')
            s_nom = PDFParser._find_value(text, r'Segundo nombre:')
            p_ape = PDFParser._find_value(text, r'Primer apellido:')
            s_ape = PDFParser._find_value(text, r'Segundo apellido:')
            
            # Concatenación segura
            names = [x for x in [p_nom, s_nom, p_ape, s_ape] if x]
            data['NOMBRE_COMPLETO'] = " ".join(names).strip()
            
            data['CUI'] = PDFParser._find_value(text, r'Código Único de Identificación:')
            data['FECHA_NAC'] = PDFParser._find_value(text, r'Fecha de Nacimiento:', r'(\d{2}/\d{2}/\d{4})')
            data['ESTADO_CIVIL'] = PDFParser._find_value(text, r'Estado civil:')
            data['NACIONALIDAD'] = PDFParser._find_value(text, r'Nacionalidad:')

        # ---------------------------------------------------------
        # 3. Ubicación Fiscal Principal (Intento inicial)
        # ---------------------------------------------------------
        # Busca la sección global de ubicación (no la de establecimientos)
        ubicacion_section = ""
        m_start_ubi = re.search(r'UBICACIÓN', text)
        if m_start_ubi:
            fragment = text[m_start_ubi.start():]
            # Cortar antes de que empiece la lista de establecimientos o actividad
            m_end = re.search(r'(ESTABLECIMIENTOS|ACTIVIDAD ECONÓMICA|ÚLTIMO ESTABLECIMIENTO)', fragment)
            if m_end:
                ubicacion_section = fragment[:m_end.start()]
            else:
                ubicacion_section = fragment[:600] # Límite seguro
            
            # Extracción de campos comunes
            depto = PDFParser._find_value(ubicacion_section, r'Departamento:')
            muni = PDFParser._find_value(ubicacion_section, r'Municipio:')
            zona = PDFParser._find_value(ubicacion_section, r'Zona:', r'(\d+)')
            vial = PDFParser._find_value(ubicacion_section, r'Vialidad:')
            num_vial = PDFParser._find_value(ubicacion_section, r'Número de vialidad:', r'(\d+)')
            calle_av = PDFParser._find_value(ubicacion_section, r'Nombre de vialidad:')
            casa = PDFParser._find_value(ubicacion_section, r'Número y letra de casa:')
            colonia = PDFParser._find_value(ubicacion_section, r'(?:Colonia o Barrio|Grupo habitacional)\s*:?')
            
            # Construcción de string
            parts = []
            if vial:
                v = vial
                if num_vial: v += f" {num_vial}"
                if calle_av: v += f" {calle_av}"
                parts.append(v)
            elif calle_av:
                parts.append(calle_av)
            
            if casa: parts.append(f"CASA {casa}")
            if zona: parts.append(f"ZONA {zona}")
            if colonia: parts.append(colonia)
            if muni: parts.append(muni)
            if depto: parts.append(depto)
            
            if parts:
                data['DIRECCION_FISCAL'] = ", ".join(parts)
            else:
                # Fallback: leer línea cruda si existe la sección pero no el detalle
                m_raw = re.search(r'UBICACIÓN[\s\n]+([^\n]+)', text)
                if m_raw: data['DIRECCION_FISCAL'] = m_raw.group(1).strip()

        # ---------------------------------------------------------
        # 4. Actividad Económica [cite: 8, 9]
        # ---------------------------------------------------------
        m_act = re.search(r'(\d{4}\.\d{2})[\s\n]+([A-ZÁÉÍÓÚÑ\s,]+?)(?=\n|Clasificación)', text)
        if m_act:
            data['ACTIVIDAD_CODIGO'] = m_act.group(1).strip()
            data['ACTIVIDAD_DESC'] = m_act.group(2).strip()

        # ---------------------------------------------------------
        # 5. Establecimientos (Lista Detallada) [cite: 10, 11]
        # ---------------------------------------------------------
        estabs_data = []
        matches = list(re.finditer(r'Nombre Comercial:[\s\n]+([^\n]+)', text))
        
        for i, m in enumerate(matches):
            raw_name = m.group(1).strip()
            # Filtro básico para falsos positivos
            if len(raw_name) < 2 or "Nombre Comercial" in raw_name:
                continue
            
            clean_name = raw_name.replace('"', '').replace(',', '').strip()
            
            # Definir ventana de texto para ESTE establecimiento
            start_pos = m.start()
            if i + 1 < len(matches):
                end_pos = matches[i+1].start()
            else:
                m_fin = re.search(r'(AFILIACIONES|DATOS DEL CONTADOR)', text[start_pos:])
                end_pos = start_pos + m_fin.start() if m_fin else len(text)
            
            block = text[start_pos:end_pos]
            
            est_obj = {
                "nombre_comercial": clean_name,
                "numero_secuencia": PDFParser._find_value(block, r'Número de secuencia de establecimiento:', r'(\d+)'),
                "tipo_establecimiento": PDFParser._find_value(block, r'Tipo de establecimiento:'),
                "estado": PDFParser._find_value(block, r'Clasificación por establecimiento:') or "ACTIVO",
                "fecha_inicio": PDFParser._find_value(block, r'Fecha Inicio de Operaciones:', r'(\d{2}/\d{2}/\d{4})'),
                # Dirección local (Busca estos campos dentro del bloque del establecimiento)
                "departamento": PDFParser._find_value(block, r'Departamento:'),
                "municipio": PDFParser._find_value(block, r'Municipio:'),
                "zona": PDFParser._find_value(block, r'Zona:', r'(\d+)'),
                "colonia": PDFParser._find_value(block, r'(?:Colonia o Barrio|Grupo habitacional)\s*:?'),
                "vialidad": PDFParser._find_value(block, r'Vialidad:'),
                "numero_vialidad": PDFParser._find_value(block, r'Número de vialidad:', r'(\d+)'),
                "nombre_vialidad": PDFParser._find_value(block, r'Nombre de vialidad:'),
                "numero_casa": PDFParser._find_value(block, r'Número y letra de casa:'),
                "complemento_dir": PDFParser._find_value(block, r'Complemento de la dirección:')
            }
            
            # Construcción dirección establecimiento
            addr_p = []
            if est_obj['vialidad']:
                v = est_obj['vialidad']
                if est_obj['numero_vialidad']: v += f" {est_obj['numero_vialidad']}"
                if est_obj['nombre_vialidad']: v += f" {est_obj['nombre_vialidad']}"
                addr_p.append(v)
            elif est_obj['nombre_vialidad']:
                addr_p.append(est_obj['nombre_vialidad'])
            
            if est_obj['numero_casa']: addr_p.append(f"CASA {est_obj['numero_casa']}")
            if est_obj['complemento_dir']: addr_p.append(est_obj['complemento_dir'])
            if est_obj['zona']: addr_p.append(f"ZONA {est_obj['zona']}")
            if est_obj['colonia']: addr_p.append(est_obj['colonia'])
            if est_obj['municipio']: addr_p.append(est_obj['municipio'])
            if est_obj['departamento']: addr_p.append(est_obj['departamento'])
            
            est_obj['direccion_completa'] = ", ".join(addr_p) if addr_p else None
            estabs_data.append(est_obj)

        if estabs_data:
            data['ESTABLECIMIENTOS'] = estabs_data
            if not data.get('NOMBRE_COMERCIAL'):
                data['NOMBRE_COMERCIAL'] = estabs_data[0]['nombre_comercial']

        # ---------------------------------------------------------
        # 6. Impuestos y Forma de Cálculo [cite: 14, 21]
        # ---------------------------------------------------------
        impuestos = []
        
        # --- AQUI ESTÁ EL CAMBIO SOLICITADO PARA FORMA DE CÁLCULO ---
        # Busca "Forma de cálculo del IVA" o variantes
        m_calc = re.search(r'Forma de cálculo(?: del IVA)?:[\s\n]+([^\n]+)', text, re.IGNORECASE)
        if m_calc:
            data['FORMA_CALCULO_IVA'] = m_calc.group(1).strip()
        
        imp_matches = re.finditer(r'Nombre de Impuesto:[\s\n]+([^\n]+)', text)
        
        for m in imp_matches:
            imp_name = m.group(1).strip().replace('"', '')
            start_pos = m.end()
            # Ventana amplia (1500 chars) por si el régimen cae en la siguiente página
            search_window = text[start_pos:start_pos+1500]
            
            # Limitar ventana hasta el siguiente impuesto para no mezclar
            next_imp = re.search(r'Nombre de Impuesto:', search_window)
            limit = next_imp.start() if next_imp else len(search_window)
            window_safe = search_window[:limit]
            
            regimen = "GENERAL"
            m_reg = re.search(r'Régimen(?: por tipo de renta)?:[\s\n]+([^\n]+)', window_safe)
            if m_reg:
                regimen = m_reg.group(1).strip().replace('"', '')
                # Limpiar residuos comunes
                regimen = regimen.split("Periodo")[0].strip()
            
            impuestos.append({"impuesto": imp_name, "regimen": regimen})
        
        # Deduplicar impuestos
        unique_impuestos = {i['impuesto']: i for i in impuestos}.values()
        data['IMPUESTOS'] = list(unique_impuestos)

        # ---------------------------------------------------------
        # 7. Fallback Dirección Fiscal (Lógica solicitada)
        # ---------------------------------------------------------
        # Si no se encontró dirección fiscal en el encabezado Y existen establecimientos
        if (not data.get('DIRECCION_FISCAL') or len(data.get('DIRECCION_FISCAL', '')) < 5) and data.get('ESTABLECIMIENTOS'):
            # Tomamos el último establecimiento de la lista (suele ser el más reciente o el activo único)
            ultimo_establecimiento = data['ESTABLECIMIENTOS'][-1]
            if ultimo_establecimiento.get('direccion_completa'):
                data['DIRECCION_FISCAL'] = ultimo_establecimiento['direccion_completa']

        return data
        
    @staticmethod
    def _find_value(text: str, label_pattern: str, value_regex: str = r'([^\n]+)') -> Optional[str]:
        """Busca etiqueta y valor, ignorando falsos positivos (como leer la siguiente etiqueta)."""
        full_pattern = f"{label_pattern}[\s\n]*\"?{value_regex}"
        match = re.search(full_pattern, text, re.IGNORECASE)
        
        if match:
            val = match.group(1).strip().replace('"', '').rstrip(',')
            # Lista negra de etiquetas para evitar capturarlas como valor
            if re.match(r'^(Departamento|Municipio|Zona|Vialidad|Fecha|Nombre|Código|Estado)', val, re.IGNORECASE):
                return None
            return val if val else None
        return None

    @staticmethod
    def parse_patente(text: str) -> Dict[str, Any]:
        """Parsea Patentes de Comercio (Empresa y Sociedad)."""
        data = {
            "TIPO_DOCUMENTO": "PATENTE",
            "METODO": "NATIVE_PDF_PARSER",
            "VALIDACION_QR": None # Se llenará externamente si se encuentra QR
        }
        
        # --- PATENTE DE EMPRESA ---
        if "Patente de Comercio de Empresa" in text:
            data['TIPO_PATENTE'] = "EMPRESA"
            data['REGISTRO'] = PDFParser._find_value(text, r'Registro\s*(?:No\.)?', r'(\d+)')
            data['FOLIO'] = PDFParser._find_value(text, r'Folio\s*(?:No\.)?', r'(\d+)')
            data['LIBRO'] = PDFParser._find_value(text, r'Libro\s*(?:No\.)?', r'(\d+)')
            data['EXPEDIENTE'] = PDFParser._find_value(text, r'Expediente\s*(?:No\.)?', r'(\d+-\d+)')
            
            m_emp = re.search(r'La Empresa Mercantil[\s\n]+([^\n]+)', text)
            if m_emp: data['NOMBRE_EMPRESA'] = m_emp.group(1).strip()
            
            m_prop = re.search(r'Nombre Propietario \(s\)[\s\n]+([^\n]+)', text)
            if m_prop: data['PROPIETARIO'] = m_prop.group(1).strip()
            
            # Buscar dirección (puede variar la etiqueta exacta)
            m_dir = re.search(r'Dirección comercial[\s\n]+([^\n]+)', text)
            if not m_dir: m_dir = re.search(r'Dirección de la Empresa[\s\n]+([^\n]+)', text)
            if m_dir: data['DIRECCION'] = m_dir.group(1).strip()

        # --- PATENTE DE SOCIEDAD ---
        elif "Patente de Comercio de Sociedad" in text:
            data['TIPO_PATENTE'] = "SOCIEDAD"
            data['REGISTRO'] = PDFParser._find_value(text, r'Registro', r'(\d+)')
            data['FOLIO'] = PDFParser._find_value(text, r'Folio', r'(\d+)')
            data['LIBRO'] = PDFParser._find_value(text, r'Libro', r'(\d+)')
            data['EXPEDIENTE'] = PDFParser._find_value(text, r'Expediente', r'(\d+-\d+)')
            
            m_soc = re.search(r'La Sociedad[\s\n]+([^\n]+)', text)
            if m_soc: data['RAZON_SOCIAL'] = m_soc.group(1).strip()
            
            m_dir = re.search(r'Dirección de la Entidad[\s\n]+([^\n]+)', text)
            if m_dir: data['DIRECCION'] = m_dir.group(1).strip()

        return data