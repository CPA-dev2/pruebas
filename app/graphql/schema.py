import strawberry
from strawberry.file_uploads import Upload
from typing import Optional, Any
import uuid
import os
import aiofiles
from celery.result import AsyncResult
from app.core.config import settings
from app.core.security import FileValidator
from worker.tasks import process_document_ton

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
        
        # 1. Si la tarea ya terminó (Ready)
        if res.ready():
            # Verificar si Celery falló a nivel infraestructura
            if res.status == 'FAILURE':
                return OCRResult(
                    status="FAILED", 
                    meta={"message": "Error crítico en worker"}, 
                    data={}
                )
            
            result_data = res.result
            
            # Si el resultado es nulo (caso raro)
            if not result_data:
                return OCRResult(status="FAILED", meta={}, data={})
            
            # Retornamos el estado calculado por el worker (SUCCESS, INCORRECT, FAILED)
            return OCRResult(
                status=result_data.get("status", "FAILED"),
                meta=result_data.get("meta", {}),
                data=result_data.get("data", {})
            )
        
        # 2. Si la tarea sigue ejecutándose -> PROCESSING
        return OCRResult(
            status="PROCESSING", 
            meta={"message": "Analizando documento..."}, 
            data={}
        )

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def scan_document(self, file: Upload, doc_type: str) -> OCRTaskResponse:
        """Sube archivo y dispara Celery."""
        # Validación básica de tipo solicitado
        valid_types = ['DPI_FRONT', 'DPI_BACK', 'RTU', 'PATENTE', 'DPI_FRONT_REPRESENTANTE', 'DPI_BACK_REPRESENTANTE']
        if doc_type not in valid_types:
            return OCRTaskResponse(task_id="", status="FAILED", message="Tipo de documento inválido")

        # Guardado temporal seguro
        safe_ext = "bin"
        if file.filename:
            ext = file.filename.split('.')[-1].lower()
            if ext in ['pdf', 'jpg', 'jpeg', 'png']:
                safe_ext = ext
        
        temp_name = f"{uuid.uuid4()}.{safe_ext}"
        file_path = os.path.join(settings.TEMP_DIR, temp_name)
        
        try:
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as out_file:
                await out_file.write(content)
            
            # Validación de Magic Bytes (Seguridad)
            is_safe, msg = FileValidator.validate_file_header(file_path)
            if not is_safe:
                os.remove(file_path)
                return OCRTaskResponse(task_id="", status="FAILED", message=f"Archivo inseguro: {msg}")

            # Encolar tarea
            task = process_document_ton.delay(file_path, doc_type)
            
            return OCRTaskResponse(
                task_id=task.id,
                status="PROCESSING", # Estado inicial
                message="Documento encolado."
            )

        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            return OCRTaskResponse(task_id="", status="FAILED", message=str(e))

schema = strawberry.Schema(query=Query, mutation=Mutation)