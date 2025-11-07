# api/services/distributor_service.py

from django.db import transaction
from django.core.files.base import ContentFile
from graphql import GraphQLError
from api.models import Distributor, Reference, Document, Trackingdistributor
from api.tasks import process_distributor_rtu

def _create_tracking_distributor(distributor, estado, comments):
    """
    Helper interno para crear un registro de seguimiento del distribuidor.
    
    Args:
        distributor (Distributor): La instancia del distribuidor.
        estado (str): El nuevo estado a registrar.
        comments (str): Comentarios sobre el cambio de estado.
    """
    Trackingdistributor.objects.create(
        distributor=distributor,
        estado=estado,
        comments=comments
    )

def create_distributor(data, referencias, documentos):
    """
    Servicio para crear un nuevo distribuidor y sus objetos relacionados
    (referencias, documentos) de forma atómica.
    
    Maneja la lógica de negocio compleja, liberando al resolver de GraphQL.
    
    Args:
        data (dict): Datos principales del distribuidor.
        referencias (list): Lista de dicts con datos de referencias.
        documentos (list): Lista de dicts con datos de documentos.

    Returns:
        Distributor: La instancia del distribuidor creado.
        
    Raises:
        GraphQLError: Si ocurre un error de validación o de base de datos.
    """
    
    # Usamos @transaction.atomic para asegurar que todas las operaciones
    # de base de datos (crear distribuidor, referencias, documentos)
    # ocurran exitosamente, o fallen todas juntas.
    try:
        with transaction.atomic():
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
                    # Extraer los datos del archivo
                    archivo_data = doc_data.pop('archivoData')
                    nombre_archivo = doc_data.pop('nombreArchivo')
                    tipo_documento = doc_data.get('tipoDocumento')

                    if tipo_documento == 'rtu':
                        has_rtu = True

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
                # ¡MEJORA DE ROBUSTEZ!
                # Usamos transaction.on_commit para prevenir una condición de carrera (race condition).
                # La tarea de Celery (process_distributor_rtu.delay) solo se encolará
                # DESPUÉS de que la transacción de la base de datos se haya completado
                # exitosamente. Esto evita que el worker intente buscar un distribuidor
                # que aún no existe en la BD.
                transaction.on_commit(
                    lambda: process_distributor_rtu.delay(distributor.id)
                )
                
                # Actualizamos el tracking para reflejar que el RTU está en proceso
                _create_tracking_distributor(
                    distributor, 
                    "pendiente", 
                    "RTU enviado a procesamiento en segundo plano."
                )

        # Si todo fue exitoso, retornamos el distribuidor
        return distributor
    
    except Exception as e:
        # Si algo falla dentro del bloque 'with transaction.atomic()',
        # Django revertirá todos los cambios en la BD.
        # Capturamos la excepción y la lanzamos como un error de GraphQL
        # para notificar al frontend.
        raise GraphQLError(f"Error al crear el distribuidor: {str(e)}")


def update_distributor(distributor, data):
    """
    Servicio para actualizar un distribuidor existente.
    
    Args:
        distributor (Distributor): La instancia a actualizar.
        data (dict): Los datos a modificar.

    Returns:
        Distributor: La instancia del distribuidor actualizada.
    """
    # Actualiza los campos del distribuidor con los datos proporcionados
    for key, value in data.items():
        setattr(distributor, key, value)
    
    distributor.save()
    
    # Registra el cambio en el tracking si el estado cambió
    if 'estado' in data:
        _create_tracking_distributor(
            distributor, 
            data['estado'], 
            f"Estado actualizado a {data['estado']} por un administrador."
        )
        
    return distributor