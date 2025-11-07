from contextlib import contextmanager
import tempfile
from django.core.files.base import ContentFile
import base64

def decode_base64_to_contentfile(b64: str, name: str) -> ContentFile:
    try:
        content = base64.b64decode(b64)
        return ContentFile(content, name=name)
    except Exception as e:
        raise ValueError(f"Error al decodificar archivo {name}: {e}")

@contextmanager
def write_bytes_to_temp_pdf(pdf_bytes: bytes):
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        f.write(pdf_bytes)
        f.flush()
        yield f.name
