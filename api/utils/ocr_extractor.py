"""
Módulo de Extracción de Contenido y OCR.

Este módulo centraliza todas las operaciones de bajo nivel para extraer
información de archivos, ya sea texto vectorial de PDFs o texto a través
de OCR de imágenes.
"""
import re
import os
from typing import List, Dict, Any, Optional

import pdfplumber
import fitz  # PyMuPDF
import numpy as np
import cv2

try:
    import pytesseract
except ImportError:
    pytesseract = None


# --- Funciones de Extracción de Texto ---

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Intenta extraer texto vectorial de un PDF. Es rápido y preciso
    para PDFs generados digitalmente.
    """
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extrayendo texto vectorial: {e}")
    return text

def ocr_image(image_path: str) -> str:
    """
    Realiza OCR en una imagen utilizando Tesseract.
    """
    if pytesseract is None:
        raise ImportError("Pytesseract no está instalado.")

    try:
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Binarización para mejorar el contraste
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(thresh, lang='spa', config=custom_config)
        return text
    except Exception as e:
        print(f"Error en OCR: {e}")
        return ""

def extract_text_from_file(file_path: str) -> str:
    """
    Función principal que extrae texto de un archivo.
    - Si es PDF, intenta primero con texto vectorial. Si no es suficiente,
      convierte a imagen y hace OCR.
    - Si es imagen (png, jpg), hace OCR directamente.
    """
    _, extension = os.path.splitext(file_path)
    extension = extension.lower()

    if extension == '.pdf':
        text = extract_text_from_pdf(file_path)
        # Si el texto vectorial es muy corto, probablemente sea un PDF escaneado
        if len(text.strip()) < 100:
            try:
                doc = fitz.open(file_path)
                full_ocr_text = ""
                for page in doc:
                    pix = page.get_pixmap(dpi=300)
                    img_bytes = pix.tobytes("png")
                    nparr = np.frombuffer(img_bytes, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

                    custom_config = r'--oem 3 --psm 6'
                    full_ocr_text += pytesseract.image_to_string(thresh, lang='spa', config=custom_config) + "\n"
                text = full_ocr_text
            except Exception as e:
                print(f"Error en el fallback a OCR para PDF: {e}")
        return text
    elif extension in ['.png', '.jpg', '.jpeg', '.tiff']:
        return ocr_image(file_path)
    else:
        raise ValueError(f"Formato de archivo no soportado: {extension}")


# --- Funciones de Extracción Específicas por Documento ---

def extract_dpi_data(text: str) -> Dict[str, Optional[str]]:
    """Extrae Nombres, Apellidos y CUI/DPI de un texto de DPI."""
    data = {"nombres": None, "apellidos": None, "dpi": None}

    # Regex para CUI (DPI)
    dpi_regex = re.compile(r'\b(\d{4}\s?\d{5}\s?\d{4})\b')
    match = dpi_regex.search(text)
    if match:
        data["dpi"] = match.group(1).replace(" ", "")

    # Regex para Nombres y Apellidos
    # Esto es un desafío, se asume un formato común
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if "Nombres" in line or "NOMBRE" in line:
            if i + 1 < len(lines):
                data["nombres"] = lines[i+1].strip()
        if "Apellidos" in line or "APELLIDO" in line:
            if i + 1 < len(lines):
                data["apellidos"] = lines[i+1].strip()

    return data

def extract_patente_data(text: str) -> Dict[str, Optional[str]]:
    """Extrae Razón Social y Nombre Comercial de una Patente de Comercio."""
    data = {"razon_social": None, "nombre_comercial": None}

    # Lógica de extracción para Patente de Comercio
    # (implementar con regex según el formato de la patente)

    return data
BLOCK_END_HINTS = [
    r"DATOS\s+DEL\s+CONTADOR",
    r"DATOS\s+DEL\s+REPRESENTANTE",
    r"REPRESENTANTE\s+LEGAL",
    r"OBSERVACIONES",
]
BLOCK_START = re.compile("|".join(BLOCK_START_HINTS), re.I)
BLOCK_END = re.compile("|".join(BLOCK_END_HINTS), re.I)


# ========= utilitarios =========
def _norm(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    return re.sub(r"\s+", " ", s.strip())


def _extract_nit_and_razon(text: str) -> tuple[Optional[str], Optional[str]]:
    nit = None

    # Buscar NIT en el texto completo
    m = NIT_REGEX.search(text)
    if m:
        cuerpo = m.group(1)
        verificador = m.group(2)
        nit = cuerpo if not verificador else f"{cuerpo}-{verificador}"

    # Si no lo encuentra directamente, buscar por línea
    if not nit:
        for line in text.splitlines():
            if "NIT" in line.upper():
                ml = NIT_REGEX.search(line)
                if ml:
                    cuerpo = ml.group(1)
                    verificador = ml.group(2)
                    nit = cuerpo if not verificador else f"{cuerpo}-{verificador}"
                    break

    razon = None
    for rx in RAZON_REGEXES:
        mm = rx.search(text)
        if mm:
            razon = _norm(mm.group(1))
            break
    return nit, razon


# ========= Tablas (si el RTU trae tabla de “ESTABLECIMIENTOS”) =========
def _parse_table_dataframe(df) -> List[Dict[str, Any]]:
    cols = [c.strip().lower() for c in df.columns]

    def findcol(cands):
        for i, c in enumerate(cols):
            for cand in cands:
                if cand in c:
                    return i
        return None

    idx_num = findcol(["n°", "no", "número", "numero", "secuencia"])
    idx_nom = findcol(["nombre comercial", "comercial", "nombre"])
    idx_dir = findcol(["dirección", "direccion"])
    idx_mun = findcol(["municipio"])
    idx_dep = findcol(["departamento"])
    idx_est = findcol(["estado", "estatus"])
    idx_fec = findcol(["fecha", "inicio"])

    out = []
    start_row = 1 if len(df) > 1 and any(h in cols[0] for h in ["n°", "no", "número", "numero"]) else 0
    for r in range(start_row, len(df)):
        row = df.iloc[r]
        item = {
            "numero_establecimiento": _norm(str(row.iloc[idx_num])) if idx_num is not None else None,
            "nombre_comercial": _norm(str(row.iloc[idx_nom])) if idx_nom is not None else None,
            "direccion": _norm(str(row.iloc[idx_dir])) if idx_dir is not None else None,
            "municipio": _norm(str(row.iloc[idx_mun])) if idx_mun is not None else None,
            "departamento": _norm(str(row.iloc[idx_dep])) if idx_dep is not None else None,
            "estado": _norm(str(row.iloc[idx_est])) if idx_est is not None else None,
            "fecha_inicio": _norm(str(row.iloc[idx_fec])) if idx_fec is not None else None,
        }
        if any(v for v in item.values() if v):
            out.append(item)
    return out


def _extract_tables_camelot(pdf_path: str) -> List[Dict[str, Any]]:
    if camelot is None:
        return []
    try:
        t = camelot.read_pdf(pdf_path, pages="all", flavor="lattice")
        if getattr(t, "n", 0) > 0:
            df = t[0].df
            df = df.rename(columns=df.iloc[0]).drop(index=0, errors="ignore")
            rows = _parse_table_dataframe(df)
            if rows:
                return rows
        t = camelot.read_pdf(pdf_path, pages="all", flavor="stream")
        if getattr(t, "n", 0) > 0:
            df = t[0].df
            df = df.rename(columns=df.iloc[0]).drop(index=0, errors="ignore")
            rows = _parse_table_dataframe(df)
            if rows:
                return rows
    except Exception:
        pass
    return []


# ========= Bloques 1..N (cuando no hay tabla) =========
def _split_blocks(text: str) -> List[str]:
    lines = text.splitlines()
    blocks, cur, inside = [], [], False

    for ln in lines:
        if not inside and BLOCK_START.search(ln):
            inside, cur = True, [ln]
            continue
        if inside:
            if BLOCK_END.search(ln):
                blocks.append("\n".join(cur))
                cur, inside = [], False
            else:
                cur.append(ln)

    if inside and cur:
        blocks.append("\n".join(cur))

    if not blocks:
        # Fallback: dividir por repetición de “Nombre Comercial:”
        chunks = re.split(r"(?=^\s*Nombre\s+Comercial\s*:)", text, flags=re.I | re.M)
        blocks = [c for c in chunks if re.search(r"Nombre\s+Comercial\s*:", c, re.I)]

    return blocks


def _parse_block(block: str) -> Dict[str, Any]:
    out = {
        "numero_establecimiento": None,
        "nombre_comercial": None,
        "direccion": None,
        "municipio": None,
        "departamento": None,
        "estado": None,
        "fecha_inicio": None,
        "clasificacion": None,
        "tipo": None,
        "actividad_economica": None,
    }
    for key, rx in FIELD_RX.items():
        m = re.search(rx, block, re.I)
        if m:
            out[key] = _norm(m.group("val"))

    # Campos a veces rotulan por separado
    for label, key in [
        (r"Direcci[oó]n\s*:\s*(?P<val>.+)", "direccion"),
        (r"Municipio\s*:\s*(?P<val>.+)", "municipio"),
        (r"Departamento\s*:\s*(?P<val>.+)", "departamento"),
    ]:
        m = re.search(label, block, re.I)
        if m and not out.get(key):
            out[key] = _norm(m.group("val"))

    return out


def _extract_establecimientos_from_text(text: str) -> List[Dict[str, Any]]:
    blocks = _split_blocks(text)
    items = []
    for b in blocks:
        it = _parse_block(b)
        if any(v for v in it.values() if v):
            items.append(it)

    # dedupe simple
    seen, unique = set(), []
    for it in items:
        k = (it.get("nombre_comercial"), it.get("numero_establecimiento"))
        if k not in seen:
            seen.add(k)
            unique.append(it)
    return unique


# ========= API pública =========
def extract_rtu_data(file_path: str) -> Dict[str, Any]:
    """
    Extrae información de un archivo de RTU (Registro Tributario Unificado).
    
    Argumento:
        file_path: str (ruta absoluta o relativa del archivo ya guardado)
        
    Retorna:
        {
          "nit": str|None,
          "razon_social": str|None,
          "establecimientos": [ { ... }, ... ]
        }
        
    Raises:
        FileNotFoundError: Si el archivo no existe
        ValueError: Si el formato de archivo no es soportado
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"El archivo no existe: {file_path}")
    
    # 1) Extraer texto del archivo (PDF o imagen)
    text = extract_text_from_file(file_path)
    nit, razon = _extract_nit_and_razon(text)

    # 2) Establecimientos: tablas (solo si es PDF) -> texto/bloques
    establecimientos = []
    if file_path.lower().endswith('.pdf'):
        establecimientos = _extract_tables_camelot(file_path)

    if not establecimientos:
        establecimientos = _extract_establecimientos_from_text(text)

    return {
        "nit": nit,
        "razon_social": razon,
        "establecimientos": establecimientos or []
    }
