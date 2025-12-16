import fitz  # PyMuPDF
import re
import logging

logger = logging.getLogger(__name__)

class PDFParser:
    @staticmethod
    def extract_text_content(file_path):
        """Extrae todo el texto de un PDF nativo."""
        text_content = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text_content += page.get_text() + "\n"
            return text_content
        except Exception as e:
            logger.error(f"Error leyendo PDF nativo: {e}")
            return ""

    @staticmethod
    def parse_rtu(text):
        """
        Parsea el texto crudo del RTU de SAT (formato 2024/2025).
        """
        data = {}
        
        # 1. NIT y Datos Básicos
        # Busca "NIT: 83997075"
        m_nit = re.search(r'NIT:\s*([0-9A-Z\-]+)', text)
        if m_nit: data['NIT'] = m_nit.group(1)

        # 2. Identificación (Búsqueda línea a línea)
        # El formato del PDF suele ser "Etiqueta:\nValor"
        data['NOMBRE_PRIMERO'] = PDFParser._find_in_pdf(text, r'Primer nombre:\s*\n\s*"?([^"\n]+)')
        data['NOMBRE_SEGUNDO'] = PDFParser._find_in_pdf(text, r'Segundo nombre:\s*\n\s*"?([^"\n]+)')
        data['APELLIDO_PRIMERO'] = PDFParser._find_in_pdf(text, r'Primer apellido:\s*\n\s*"?([^"\n]+)')
        data['APELLIDO_SEGUNDO'] = PDFParser._find_in_pdf(text, r'Segundo apellido:\s*\n\s*"?([^"\n]+)')
        
        # Concatenar Nombre Completo
        partes = [data.get(k) for k in ['NOMBRE_PRIMERO', 'NOMBRE_SEGUNDO', 'APELLIDO_PRIMERO', 'APELLIDO_SEGUNDO'] if data.get(k)]
        data['NOMBRE_COMPLETO'] = " ".join(partes)

        data['CUI'] = PDFParser._find_in_pdf(text, r'Código Único de Identificación:\s*\n\s*"?(\d+)')
        data['FECHA_NAC'] = PDFParser._find_in_pdf(text, r'Fecha de Nacimiento:\s*\n\s*"?(\d{2}/\d{2}/\d{4})')
        data['ESTADO_CIVIL'] = PDFParser._find_in_pdf(text, r'Estado civil:\s*\n\s*"?([^"\n]+)')
        data['NACIONALIDAD'] = PDFParser._find_in_pdf(text, r'Nacionalidad:\s*\n\s*"?([^"\n]+)')
        
        # 3. Ubicación / Dirección
        # Buscamos la sección UBICACIÓN y tomamos la línea siguiente
        m_ubi = re.search(r'UBICACIÓN\s*\n\s*([^\n]+)', text)
        if m_ubi:
            data['DIRECCION_FISCAL'] = m_ubi.group(1).strip()
        else:
            # Intento alternativo por componentes
            depto = PDFParser._find_in_pdf(text, r'Departamento\s*\n\s*"?([^"\n]+)')
            muni = PDFParser._find_in_pdf(text, r'Municipio:\s*\n\s*"?([^"\n]+)')
            zona = PDFParser._find_in_pdf(text, r'Zona:\s*\n\s*"?(\d+)')
            if muni and depto:
                data['DIRECCION_FISCAL'] = f"ZONA {zona or ''}, {muni}, {depto}"

        # 4. Actividad Económica
        # Busca patrón de código: "9101.40\nACTIVIDADES..."
        m_act = re.search(r'(\d{4}\.\d{2})\s*\n\s*"([^"]+)', text)
        if m_act:
            data['ACTIVIDAD_CODIGO'] = m_act.group(1)
            data['ACTIVIDAD_DESC'] = m_act.group(2)

        # 5. Establecimientos
        m_comercial = re.search(r'Nombre Comercial:\s*\n\s*"([^"]+)', text)
        if m_comercial: data['NOMBRE_COMERCIAL'] = m_comercial.group(1)
        
        m_regimen = re.search(r'Régimen:\s*\n\s*"([^"]+)', text)
        if m_regimen: data['REGIMEN_IVA'] = m_regimen.group(1)

        return data

    @staticmethod
    def _find_in_pdf(text, pattern):
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None

    @staticmethod
    def parse_patente(text):
        """Parsea Patentes de Comercio."""
        data = {}
        if "Patente de Comercio de Empresa" in text:
            data['TIPO_PATENTE'] = "EMPRESA"
            data['REGISTRO'] = PDFParser._find_in_pdf(text, r'Registro\s*(\d+)')
            data['FOLIO'] = PDFParser._find_in_pdf(text, r'Folio\s*(\d+)')
            data['LIBRO'] = PDFParser._find_in_pdf(text, r'Libro\s*(\d+)')
            
            # Nombre Empresa
            m_emp = re.search(r'La Empresa Mercantil\s*\n\s*([^\n]+)', text)
            if m_emp: data['NOMBRE_EMPRESA'] = m_emp.group(1).strip()
            
            # Propietario
            m_prop = re.search(r'Nombre Propietario \(s\)\s*([^\n]+)', text)
            if m_prop: data['PROPIETARIO'] = m_prop.group(1).strip()

        return data