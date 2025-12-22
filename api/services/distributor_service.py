import os
import uuid
import time
import requests
import json
from django.db import transaction
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.core.exceptions import ValidationError
from api.models import (
    DistributorRequest, 
    RequestState, 
    RequestDocument, 
    Distributor, 
    DistributorDocument, 
    DistributorBranch, 
    DistributorReference, 
    RequestTracking,
    Usuario
)

class DistributorService:
    """
    Servicio de Dominio para la gestión de Solicitudes de Distribuidor.
    """

    @staticmethod
    def _check_editable(req):
        """Verifica si la solicitud se puede modificar."""
        if req.estado not in [RequestState.PENDIENTE, RequestState.CORRECCIONES_SOLICITADAS]:
            raise ValidationError(f"La solicitud no se puede editar en estado {req.estado}.")

    @staticmethod
    @transaction.atomic
    def create_draft(nit, correo, **kwargs):
        """
        Crea el borrador inicial.
        """
        nit_limpio = nit.replace('-', '').replace(' ', '')
        
        if DistributorRequest.objects.filter(nit=nit_limpio, is_deleted=False).exclude(estado=RequestState.RECHAZADO).exists():
            raise ValidationError("El NIT ya tiene una solicitud activa en el sistema.")

        defaults = {
            'tipo_distribuidor': '',
            'nombres': '', 'apellidos': '', 'dpi': '', 'telefono': '',
            'departamento': '', 'municipio': '', 'direccion': '',
            'antiguedad': '', 'productos_distribuidos': '',
            'cuenta_bancaria_nombre': '', 'numero_cuenta': '', 
            'tipo_cuenta': 'monetaria', 'banco': ''
        }
        
        clean_kwargs = {k: v for k, v in kwargs.items() if v is not None}
        create_data = {**defaults, **clean_kwargs}

        req = DistributorRequest.objects.create(
            nit=nit_limpio, 
            correo=correo, 
            **create_data
        )
        
        RequestTracking.objects.create(
            request=req, 
            estado_nuevo=RequestState.PENDIENTE, 
            comentario="Borrador iniciado."
        )
        return req

    @staticmethod
    @transaction.atomic
    def update_draft(request_id, **kwargs):
        """
        Actualiza los datos del borrador.
        Mapea nombres de variables del frontend a campos del modelo Django.
        """
        try:
            req = DistributorRequest.objects.get(pk=request_id)
        except DistributorRequest.DoesNotExist:
            raise ValidationError("La solicitud no existe.")

        DistributorService._check_editable(req)

        # Mapeo de campos del frontend a nombres de modelo
        # Key: Nombre en Mutation GraphQL -> Value: Nombre en Modelo Django
        field_mapping = {
            'direccion_comercial': 'direccion_comercial', # Directo
            'direccion_comercial_patente': 'direccion_comercial', # Alias
            'metodo_iva': 'forma_calculo_iva',
            'cuenta_bancaria': 'cuenta_bancaria_nombre', # Fix para el frontend
            'negocio_nombre': 'nombre_comercial'
        }

        for key, value in kwargs.items():
            if value is not None:
                # Usar el nombre mapeado o el original
                model_field = field_mapping.get(key, key)
                
                # Verificamos si el modelo tiene ese campo antes de setearlo
                if hasattr(req, model_field):
                    setattr(req, model_field, value)
        
        req.save()
        return req

    @staticmethod
    def process_ocr_document(request_id, document_type, file):
        """
        Maneja el flujo completo de OCR con UPSERT de documentos.
        """
        try:
            req = DistributorRequest.objects.get(pk=request_id)
        except DistributorRequest.DoesNotExist:
            raise ValidationError("La solicitud no existe.")
            
        DistributorService._check_editable(req)

        # 1. Guardado Temporal
        ext = os.path.splitext(file.name)[1]
        temp_name = f"temp_{uuid.uuid4()}{ext}"
        temp_path = default_storage.save(f"temp/{temp_name}", ContentFile(file.read()))
        full_temp_path = default_storage.path(temp_path)

        ocr_data = {}
        message = "Análisis completado."
        success = False
        ocr_status_db = 'FAILED'
        
        try:
            ocr_url = getattr(settings, 'OCR_MICROSERVICE_URL', 'http://localhost:8010/graphql')
            
            mutation_query = """
            mutation($file: Upload!, $docType: String!) {
                scanDocument(file: $file, docType: $docType) { taskId status message }
            }
            """
            
            with open(full_temp_path, 'rb') as f:
                operations = {
                    "query": mutation_query,
                    "variables": {"file": None, "docType": document_type}
                }
                files_payload = {
                    "operations": (None, json.dumps(operations), 'application/json'),
                    "map": (None, json.dumps({"0": ["variables.file"]}), 'application/json'),
                    "0": (file.name, f, file.content_type)
                }
                
                res = requests.post(ocr_url, files=files_payload, timeout=30)
            
            if res.status_code != 200: 
                raise Exception(f"OCR Service HTTP Error: {res.status_code}")
            
            resp_json = res.json()
            if "errors" in resp_json:
                raise Exception(f"OCR Mutation Error: {resp_json['errors'][0]['message']}")

            scan_data = resp_json.get("data", {}).get("scanDocument", {})
            task_id = scan_data.get("taskId")
            
            if not task_id: 
                raise Exception(f"Rechazado por OCR: {scan_data.get('message')}")

            # Polling
            polling_query = """
            query($taskId: String!) {
                getOcrResult(taskId: $taskId) { status meta data }
            }
            """
            
            start_time = time.time()
            TIMEOUT_SECONDS = 45 
            
            while (time.time() - start_time) < TIMEOUT_SECONDS:
                try:
                    poll_res = requests.post(ocr_url, json={
                        "query": polling_query, 
                        "variables": {"taskId": task_id}
                    }, timeout=5)
                    
                    poll_payload = poll_res.json().get("data", {}).get("getOcrResult", {})
                    status = poll_payload.get("status") 

                    if status == "SUCCESS":
                        ocr_data = poll_payload.get("data", {})
                        meta = poll_payload.get("meta", {})
                        ocr_status_db = 'SUCCESS'
                        success = True
                        message = "Datos extraídos y validados correctamente."
                        break
                    elif status == "INCORRECT":
                        ocr_data = poll_payload.get("data", {}) 
                        meta = poll_payload.get("meta", {})
                        ocr_status_db = 'INCORRECT' 
                        success = True 
                        reason = meta.get("message", "Documento Incorrecto")
                        score = meta.get("score", 0)
                        message = f"Revisión manual requerida: {reason} (Confianza: {score}%)"
                        break
                    elif status == "FAILED":
                        meta = poll_payload.get("meta", {})
                        error_msg = meta.get("message", "Error desconocido")
                        message = f"Fallo técnico en OCR: {error_msg}"
                        ocr_status_db = 'FAILED'
                        success = False
                        break
                    elif status == "UNREADABLE":
                        ocr_data = poll_payload.get("data", {})
                        meta = poll_payload.get("meta", {})
                        ocr_status_db = 'UNREADABLE' 
                        success = True
                        reason = meta.get("message", "Documento ilegible")
                        message = f"Revisión manual requerida: {reason}"
                        break
                    
                    time.sleep(1.5)

                except requests.exceptions.RequestException:
                    time.sleep(1)
                    continue

            if (time.time() - start_time) >= TIMEOUT_SECONDS:
                message = "El servicio de OCR tardó demasiado (Timeout)."
                ocr_status_db = 'FAILED'

        except Exception as e:
            print(f"🔥 Error Crítico Integración OCR: {str(e)}")
            message = f"Error de conexión: {str(e)}"
            success = False
            ocr_status_db = 'FAILED'
        
        finally:
            if os.path.exists(full_temp_path):
                try: os.remove(full_temp_path)
                except: pass

        if success and ocr_data:
            DistributorService._apply_ocr_data(req, document_type, ocr_data)
        
        # 5. Persistencia del Documento (UPSERT)
        existing_doc = RequestDocument.objects.filter(request=req, document_type=document_type).first()

        if existing_doc:
            if existing_doc.file:
                try: existing_doc.file.delete(save=False)
                except: pass

            existing_doc.file = file
            existing_doc.ocr_status = ocr_status_db
            existing_doc.extracted_data = ocr_data
            existing_doc.revision_status = 'pending'
            existing_doc.save()
            doc = existing_doc
        else:
            doc = RequestDocument.objects.create(
                request=req,
                document_type=document_type,
                file=file,
                ocr_status=ocr_status_db,
                extracted_data=ocr_data
            )
        
        return {
            "success": True, 
            "ocr_data": ocr_data,
            "message": message,
            "document": doc
        }

    @staticmethod
    def _apply_ocr_data(req, doc_type, data):
        """Helper para mapear datos del OCR al modelo Django."""
        if doc_type == 'DPI_FRONT':
            req.dpi = data.get('CUI', req.dpi) or req.dpi
            req.nombres = data.get('NOMBRE', req.nombres) or req.nombres
            req.apellidos = data.get('APELLIDO', req.apellidos) or req.apellidos
            req.nacionalidad = data.get('NACIONALIDAD', req.nacionalidad) or req.nacionalidad
            req.fecha_nacimiento = data.get('FECHA_NACIMIENTO', req.fecha_nacimiento) or req.fecha_nacimiento
            req.genero = data.get('GENERO', req.genero) or req.genero
            
        elif doc_type == 'RTU':
            req.nit = data.get('NIT', req.nit)
            req.nombre_comercial = data.get('NOMBRE_FISCAL', req.nombre_comercial)
            
        elif doc_type == 'PATENTE':
            req.empresa_mercantil = data.get('EMPRESA', req.empresa_mercantil)
            req.numero_registro = data.get('REGISTRO', req.numero_registro)
        
        current = req.ocr_data_extracted or {}
        current.update(data)
        req.ocr_data_extracted = current
        req.save()

    @staticmethod
    @transaction.atomic
    def finalize_request(request_id, files_map):
        """
        Recibe los archivos finales del Wizard y cambia el estado.
        """
        try:
            req = DistributorRequest.objects.get(pk=request_id)
        except DistributorRequest.DoesNotExist:
            raise ValidationError("Solicitud no encontrada.")
            
        DistributorService._check_editable(req)

        doc_type_map = {
            'dpi_front': 'DPI_FRONT', 'dpi_back': 'DPI_BACK',
            'rtu': 'RTU', 'patente_comercio': 'PATENTE_COMERCIO',
            'prop_dpi_front': 'DPI_FRONT', 'prop_dpi_back': 'DPI_BACK',
            'rep_dpi_front': 'DPI_FRONT', 'rep_dpi_back': 'DPI_BACK',
            'patente_sociedad': 'PATENTE_SOCIEDAD', 'foto_representante': 'FOTO_REPRESENTANTE',
            'politicas_garantia': 'POLITICAS_GARANTIA'
        }

        for arg_name, file_obj in files_map.items():
            if file_obj:
                doc_type = doc_type_map.get(arg_name, 'OTROS')
                
                # UPSERT Logic
                existing_doc = RequestDocument.objects.filter(request=req, document_type=doc_type).first()
                
                if existing_doc:
                    if existing_doc.file:
                        try: existing_doc.file.delete(save=False)
                        except: pass
                    
                    existing_doc.file = file_obj
                    existing_doc.ocr_status = 'COMPLETED'
                    existing_doc.revision_status = 'pending'
                    existing_doc.save()
                else:
                    RequestDocument.objects.create(
                        request=req,
                        document_type=doc_type,
                        file=file_obj,
                        ocr_status='COMPLETED',
                        revision_status='pending'
                    )
        
        req.estado = RequestState.PENDIENTE
        req.save()
        
        RequestTracking.objects.create(
            request=req, 
            estado_nuevo=RequestState.PENDIENTE, 
            comentario="Solicitud finalizada por usuario."
        )
        return req

    @staticmethod
    @transaction.atomic
    def approve_request(request_id, admin_user):
        """
        Aprueba la solicitud y migra todos los datos a las tablas maestras.
        """
        try:
            req = DistributorRequest.objects.get(pk=request_id)
        except DistributorRequest.DoesNotExist:
            raise ValidationError("Solicitud no encontrada.")

        if req.estado != RequestState.ENVIADO_AUTORIZACION:
             # Validación de estado
            pass 

        # 1. Crear Distribuidor Maestro
        dist = Distributor.objects.create(
            request_origin=req,
            nit=req.nit, 
            razon_social_o_nombre=f"{req.nombres} {req.apellidos}".strip(),
            nombre_comercial=req.nombre_comercial, 
            tipo_persona=req.tipo_distribuidor,
            dpi_representante=req.dpi,
            nombre_representante_completo=f"{req.nombres} {req.apellidos}".strip(),
            email_contacto=req.correo, 
            telefono_contacto=req.telefono,
            telefono_negocio=req.telefono_negocio,
            departamento=req.departamento, 
            municipio=req.municipio,
            direccion=req.direccion,
            equipamiento_desc=req.equipamiento,
            antiguedad=req.antiguedad,
            productos_distribuidos=req.productos_distribuidos,
            cuenta_bancaria_nombre=req.cuenta_bancaria_nombre,
            numero_cuenta=req.numero_cuenta,
            tipo_cuenta=req.tipo_cuenta,
            banco=req.banco,
            is_active=True
        )

        # 2. Migrar Documentos
        for doc in req.documents.filter(revision_status='approved'):
            DistributorDocument.objects.create(
                distributor=dist, 
                document_type=doc.document_type, 
                file=doc.file,
                raw_text=doc.raw_text,
                extracted_data=doc.extracted_data,
                revision_status='approved'
            )
        
        # 3. Migrar Sucursales
        for branch in req.branches.filter(revision_status='approved'):
            DistributorBranch.objects.create(
                distributor=dist,
                nombre=branch.nombre,
                departamento=branch.departamento,
                municipio=branch.municipio,
                direccion=branch.viabilidad,
                telefono=branch.telefono,
                revision_status='approved'
            )

        # 4. Migrar Referencias
        for ref in req.references.filter(revision_status='verified'):
            DistributorReference.objects.create(
                distributor=dist,
                nombres=ref.nombres,
                telefono=ref.telefono,
                relacion=ref.relacion,
                revision_status='verified'
            )

        # 5. Cerrar Solicitud
        req.estado = RequestState.APROBADO
        req.save()
        
        RequestTracking.objects.create(
            request=req, 
            usuario=admin_user, 
            estado_nuevo=RequestState.APROBADO, 
            comentario="Aprobado y Migrado a Maestro."
        )
        return dist