# api/services/distributor_service.py

from django.db import transaction
from django.core.files.base import ContentFile
from graphql import GraphQLError
from api.models import Distributor, Reference, Document, Trackingdistributor
from api.tasks import process_distributor_rtu

def _create_tracking_distributor(distributor, estado, comments):
    """
    Helper interno para crear un registro de seguimiento del distribuidor.
    """
    Trackingdistributor.objects.create(
        distributor=distributor,
        estado=estado,
        comments=comments
    )

@transaction.atomic
def create_distributor(data, referencias, documentos):
    """
    Servicio para crear un nuevo distribuidor y sus objetos relacionados
    (referencias, documentos) de forma atómica.
    
    Args:
        data (dict): Datos principales del distribuidor.
        referencias (list): Lista de dicts con datos de referencias.
        documentos (list): Lista de dicts con datos de documentos (Uploads).

    Returns:
        Distributor: La instancia del distribuidor creado.
    """
    
    # El decorador @transaction.atomic asegura que todo esto
    # ocurra como una sola operación.
    try:
        # 1) Crear el distribuidor
        distributor = Distributor.objects.create(**data)

        # 2) Crear las referencias
        if referencias:
            Reference.objects.bulk_create(
                [Reference(distributor=distributor, **ref_data) for ref_data in referencias]
            )

        # 3) Crear los documentos
        has_rtu = False
        if documentos:
            for doc_data in documentos:
                archivo_data = doc_data.pop('archivoData')
                nombre_archivo = doc_data.pop('nombreArchivo')
                tipo_documento = doc_data.get('tipoDocumento')

                if tipo_documento == 'rtu':
                    has_rtu = True
                
                # (Aquí también se podría encolar una tarea para el DPI)
                # if tipo_documento == 'dpi':
                #     ...

                Document.objects.create(
                    distributor=distributor,
                    archivo=ContentFile(archivo_data.read(), name=nombre_archivo),
                    **doc_data
                )

        # 4) Crear el registro de tracking inicial
        _create_tracking_distributor(
            distributor, 
            "pendiente", 
            "Distribuidor creado exitosamente."
        )

        # 5) Encolar procesamiento del RTU si existe
        if has_rtu:
            # ¡MEJORA DE ROBUSTEZ (P0)!
            # Se usa transaction.on_commit para prevenir la 'race condition'.
            # La tarea .delay() solo se encolará si la transacción tiene éxito.
            transaction.on_commit(
                lambda: process_distributor_rtu.delay(distributor.id)
            )
            
            _create_tracking_distributor(
                distributor, 
                "pendiente", 
                "RTU enviado a procesamiento en segundo plano."
            )
        
        return distributor
    
    except Exception as e:
        # El decorador @transaction.atomic se encargará de hacer rollback.
        logger.error(f"Error en transaction create_distributor: {str(e)}")
        raise GraphQLError(f"Error al crear el distribuidor: {str(e)}")


def update_distributor(distributor, data):
    """
    Servicio para actualizar un distribuidor existente y registrar el cambio.
    """
    estado_anterior = distributor.estado
    nuevo_estado = data.get('estado')
    
    # Actualiza los campos
    for key, value in data.items():
        setattr(distributor, key, value)
    
    distributor.save()
    
    # Registra el cambio en el tracking si el estado cambió
    if nuevo_estado and nuevo_estado != estado_anterior:
        _create_tracking_distributor(
            distributor, 
            nuevo_estado, 
            f"Estado actualizado a {nuevo_estado}."
        )
        
    return distributor