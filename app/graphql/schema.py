import strawberry
from strawberry.file_uploads import Upload
from typing import Optional, Any
import json
import shutil
import uuid
import os
from celery.result import AsyncResult
from app.core.config import settings
from worker.tasks import process_document_ton

# Definimos un escalar JSON para la respuesta TON flexible
@strawberry.scalar
class JSON:
    @staticmethod
    def serialize(value: Any) -> Any:
        return value

    @staticmethod
    def parse_value(value: Any) -> Any:
        return value

@strawberry.type
class OCRTaskResponse:
    task_id: str
    status: str
    message: str

@strawberry.type
class OCRResult:
    status: str
    meta: JSON
    data: JSON

@strawberry.type
class Query:
    @strawberry.field
    def get_ocr_result(self, task_id: str) -> Optional[OCRResult]:
        """Consulta el resultado de Celery por ID."""
        res = AsyncResult(task_id)
        if res.ready():
            result_data = res.result
            if not result_data: return None
            
            return OCRResult(
                status=result_data.get("status", "unknown"),
                meta=result_data.get("meta", {}),
                data=result_data.get("data", {})
            )
        return OCRResult(status="processing", meta={}, data={})

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def scan_document(self, file: Upload, doc_type: str) -> OCRTaskResponse:
        """
        Sube archivo, guarda en temporal y dispara Celery.
        Retorna el Task ID para hacer polling.
        """
        # Validar tipo
        valid_types = ['DPI_FRONT', 'DPI_BACK', 'RTU', 'PATENTE']
        if doc_type not in valid_types:
            return OCRTaskResponse(task_id="", status="error", message="Tipo de documento inválido")

        # Guardar archivo temporalmente
        file_ext = file.filename.split('.')[-1]
        temp_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(settings.TEMP_DIR, temp_name)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            return OCRTaskResponse(task_id="", status="error", message=f"Error guardando archivo: {str(e)}")

        # Encolar tarea
        task = process_document_ton.delay(file_path, doc_type)
        
        return OCRTaskResponse(
            task_id=task.id,
            status="queued",
            message="Documento encolado para análisis TON."
        )

schema = strawberry.Schema(query=Query, mutation=Mutation)