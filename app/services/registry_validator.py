import requests
from bs4 import BeautifulSoup
import logging
from rapidfuzz import fuzz
import re

logger = logging.getLogger(__name__)

class RegistryValidator:
    """
    Servicio encargado de validar la información extraída del PDF contra
    la base de datos pública del Registro Mercantil mediante la URL del QR.
    """

    @staticmethod
    def validate_patente(pdf_data: dict, qr_url: str) -> dict:
        """
        1. Consulta la URL del QR.
        2. Extrae los datos oficiales de la web del Registro Mercantil.
        3. Compara campo por campo con el PDF.
        4. Retorna los datos oficiales y el resultado de la validación.
        """
        logger.info(f"Iniciando validación online contra: {qr_url}")
        
        # 1. Obtener datos de la web
        web_data = RegistryValidator._scrape_registry_data(qr_url)
        
        if not web_data:
            return {
                "ONLINE_CHECK": "FAILED", 
                "ERROR": "No se pudo obtener información de la URL del QR"
            }

        # 2. Comparar datos (PDF vs WEB)
        comparison_result = RegistryValidator._compare_data(pdf_data, web_data)

        # 3. Retornar fusión de datos
        return {
            "ONLINE_CHECK": "SUCCESS",
            "DATOS_OFICIALES_WEB": web_data,
            "VALIDACION_CAMPOS": comparison_result['fields'],
            "COINCIDENCIA_TOTAL": comparison_result['is_match']
        }

    @staticmethod
    def _scrape_registry_data(url: str) -> dict:
        """Descarga y parsea la página del Registro Mercantil."""
        try:
            # Headers para parecer un navegador normal y evitar bloqueos
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            # verify=False porque los sitios de gobierno a veces tienen certificados SSL vencidos
            response = requests.get(url, headers=headers, timeout=10, verify=False)
            
            if response.status_code != 200:
                logger.error(f"Error HTTP {response.status_code} al consultar registro.")
                return None

            # Parsear HTML
            soup = BeautifulSoup(response.text, 'lxml')
            data = {}

            # Estrategia de extracción basada en la estructura visual de la tabla amarilla
            # Buscamos etiquetas (strong o bold) y tomamos el texto siguiente
            # Ejemplo: <strong>Registro</strong> 119593
            
            # Mapeo de textos visibles en la web a claves internas
            labels_map = {
                "Registro": "REGISTRO",
                "Folio": "FOLIO",
                "Libro": "LIBRO",
                "Expediente": "EXPEDIENTE",
                "Sociedad": "NOMBRE",
                "Empresa": "NOMBRE", # Puede variar si es patente de empresa
                "Estado": "ESTADO",
                "Dirección": "DIRECCION",
                "Nacionalidad": "NACIONALIDAD",
                "Emisión": "FECHA_EMISION"
            }

            # Iterar por todos los textos para encontrar pares Clave-Valor
            # La página del RM suele usar tablas o divs. Buscamos genéricamente.
            all_text_nodes = soup.find_all(text=True)
            
            for i, text in enumerate(all_text_nodes):
                clean_text = text.strip().replace(":", "")
                if clean_text in labels_map:
                    key = labels_map[clean_text]
                    # El valor suele estar en el siguiente nodo de texto no vacío
                    # Buscamos hasta 3 nodos adelante
                    value = None
                    for j in range(1, 4):
                        if i + j < len(all_text_nodes):
                            candidate = all_text_nodes[i+j].strip()
                            if candidate and candidate not in labels_map:
                                value = candidate
                                break
                    
                    if value:
                        data[key] = value

            # Normalización extra para nombres
            if 'NOMBRE' not in data:
                # Intento alternativo buscando header
                header = soup.find('h4') # A veces el nombre está en un H4 o H3
                if header: data['NOMBRE'] = header.text.strip()

            return data

        except Exception as e:
            logger.error(f"Excepción scrapeando registro: {e}")
            return None

    @staticmethod
    def _compare_data(pdf: dict, web: dict) -> dict:
        """Compara los datos extraídos del PDF contra los de la Web."""
        results = {}
        matches = 0
        total_checks = 0

        # Lista de campos críticos a comparar
        fields_to_check = [
            ('REGISTRO', 'REGISTRO'),
            ('FOLIO', 'FOLIO'),
            ('LIBRO', 'LIBRO'),
            ('EXPEDIENTE', 'EXPEDIENTE')
        ]

        # 1. Comparación de números exactos (limpiando ceros a la izquierda y espacios)
        for pdf_key, web_key in fields_to_check:
            val_pdf = str(pdf.get(pdf_key, '')).strip().lstrip('0')
            val_web = str(web.get(web_key, '')).strip().lstrip('0')
            
            if val_pdf and val_web:
                total_checks += 1
                if val_pdf == val_web:
                    results[pdf_key] = True
                    matches += 1
                else:
                    results[pdf_key] = False
                    logger.warning(f"Desajuste en {pdf_key}: PDF={val_pdf} vs WEB={val_web}")
            else:
                results[pdf_key] = None # No se pudo comparar

        # 2. Comparación Difusa de Nombre/Razón Social
        pdf_name = pdf.get('RAZON_SOCIAL') or pdf.get('NOMBRE_EMPRESA') or ''
        web_name = web.get('NOMBRE', '')
        
        if pdf_name and web_name:
            total_checks += 1
            ratio = fuzz.token_sort_ratio(pdf_name.upper(), web_name.upper())
            is_match = ratio > 85
            results['NOMBRE_MATCH'] = is_match
            if is_match: matches += 1
        
        # 3. Resultado Final
        # Consideramos match si la mayoría de campos numéricos coinciden
        is_total_match = (matches >= (total_checks - 1)) if total_checks > 1 else (matches == total_checks)

        return {
            "fields": results,
            "is_match": is_total_match
        }