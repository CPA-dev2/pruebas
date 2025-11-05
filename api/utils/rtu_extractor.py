from __future__ import annotations
import re
import os
from typing import List, Dict, Any, Optional

# Dependencias recomendadas
import pdfplumber
import fitz  # PyMuPDF
import numpy as np
import cv2

try:
    import camelot  # opcional (tablas)
except Exception:
    camelot = None

try:
    import pytesseract  # opcional (OCR)
except Exception:
    pytesseract = None


# ========= Regex base =========
NIT_REGEX = re.compile(
    r"(?:N[\.\s]*I[\.\s]*T[\.\s]*[:\-]?\s*)(\d{6,12})(?:[-–—\s]?(\d)?)?",
    re.IGNORECASE
)
RAZON_REGEXES = [
    re.compile(r"(?:Raz[oó]n\s+o\s+denominación\s+social|Nombre\s+del\s+Contribuyente)\s*:\s*(.+)", re.I),
    re.compile(r"(?:Contribuyente)\s*:\s*(.+)", re.I),
]

# Campos típicos del bloque de establecimiento
FIELD_RX = {
    "nombre_comercial": r"(?:Nombre\s+Comercial)\s*:\s*(?P<val>.+)",
    "numero_establecimiento": r"(?:N[uú]mero\s+de\s+secuencia\s+de\s+establecimiento)\s*:\s*(?P<val>\d+)",
    "actividad_economica": r"(?:Actividad\s+econ[oó]mica\s+por\s+establecimiento)\s*:\s*(?P<val>.+)",
    "fecha_inicio": r"(?:Fecha\s+Inicio\s+de\s+Operaciones)\s*:\s*(?P<val>[\d/.-]+)",
    "estado": r"(?:Estado\s+del\s+establecimiento)\s*:\s*(?P<val>[A-ZÁÉÍÓÚÑ]+)",
    "clasificacion": r"(?:Clasificaci[oó]n\s+por\s+establecimiento)\s*:\s*(?P<val>[A-ZÁÉÍÓÚÑ]+)",
    "tipo": r"(?:Tipo\s+de\s+establecimiento)\s*:\s*(?P<val>[A-ZÁÉÍÓÚÑ]+)",
}

# Delimitadores de bloque para 1..N establecimientos
BLOCK_START_HINTS = [
    r"ÚLTIMO\s+ESTABLECIMIENTO\s+REGISTRADO.*",
    r"ESTABLECIMIENTOS\s+REGISTRADOS.*",
    r"ESTABLECIMIENTO\s+#?\s*\d+",
]
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


def _extract_text_pdf_first(pdf_path: str) -> str:
    """Texto: primero vectorial; si no alcanza, OCR."""
    chunks = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for p in pdf.pages:
                t = p.extract_text() or ""
                if t.strip():
                    chunks.append(t)
    except Exception as e:
        print(f"⚠️ Error extrayendo texto vectorial: {e}")

    text = "\n".join(chunks)
    if len(text) >= 200:  # umbral simple
        return text

    # Fallback OCR solo si pytesseract está disponible
    if pytesseract is None:
        print("⚠️ pytesseract no disponible, no se puede hacer OCR")
        return text
        
    ocr = []
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            pix = page.get_pixmap(dpi=350)
            img = np.frombuffer(pix.tobytes("png"), dtype=np.uint8)
            img = cv2.imdecode(img, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                        cv2.THRESH_BINARY, 31, 10)
            ocr.append(pytesseract.image_to_string(thr, lang="spa", config="--oem 3 --psm 6"))
    except Exception as e:
        print(f"⚠️ Error en OCR: {e}")

    return "\n".join(ocr) if ocr else text


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
def extract_rtu(pdf_path: str) -> Dict[str, Any]:
    """
    Extrae información de un PDF de RTU (Registro Tributario Unificado).
    
    Argumento:
        pdf_path: str (ruta absoluta o relativa del PDF ya guardado)
        
    Retorna:
        {
          "nit": str|None,
          "razon_social": str|None,
          "establecimientos": [ { ... }, ... ]   # 0..N
        }
        
    Raises:
        FileNotFoundError: Si el archivo no existe
        ValueError: Si el archivo no es un PDF válido
    """
    # Validar que el archivo existe
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"El archivo no existe: {pdf_path}")
    
    # Validar que es un PDF
    if not pdf_path.lower().endswith('.pdf'):
        raise ValueError(f"El archivo no es un PDF: {pdf_path}")
    
    # 1) Texto para NIT y razón social
    text = _extract_text_pdf_first(pdf_path)
    nit, razon = _extract_nit_and_razon(text)

    # 2) Establecimientos: tablas -> texto/bloques
    establecimientos = _extract_tables_camelot(pdf_path)
    if not establecimientos:
        establecimientos = _extract_establecimientos_from_text(text)

    return {
        "nit": nit,
        "razon_social": razon,
        "establecimientos": establecimientos or []
    }
