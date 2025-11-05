import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction
from django.db.models import Q
import base64
from django.core.files.base import ContentFile

from ..permissions import check_permission

from api.models import Distributor, Document, Reference, Location, Assignmentdistributor, Trackingdistributor, Revisiondistributor
from ..schema.distributor import DistributorType, DocumentType, ReferenceType, LocationType, RevisiondistributorType
from api.utils.rtu_extractor import extract_rtu


# INPUT TYPES PARA DOCUMENTOS
class DocumentInput(graphene.InputObjectType):
    """Input type para crear documentos."""
    tipoDocumento = graphene.String(required=True, description="Tipo de documento")
    archivoData = graphene.String(required=True, description="Archivo en base64")
    nombreArchivo = graphene.String(required=True, description="Nombre del archivo")

# INPUT TYPES PARA REFERENCIAS
class ReferenceInput(graphene.InputObjectType):
    """Input type para crear/actualizar referencias."""
    nombres = graphene.String(required=True, description="Nombre de la referencia")
    telefono = graphene.String(required=True, description="Teléfono de la referencia")
    relacion = graphene.String(required=True, description="Relación con el distribuidor")

class ReferenceUpdateInput(graphene.InputObjectType):
    """Input type para actualizar referencias existentes."""
    id = graphene.ID(description="ID de la referencia (para actualizar)")
    nombres = graphene.String(description="Nombre de la referencia")
    telefono = graphene.String(description="Teléfono de la referencia")
    relacion = graphene.String(description="Relación con el distribuidor")

class LocationInput(graphene.InputObjectType):
    """Input type para crear/actualizar ubicaciones."""
    nombre = graphene.String(required=True, description="Nombre de la ubicación")

# INPUT TYPES PARA REVISIONES
class RevisionInput(graphene.InputObjectType):
    """Input type para crear/actualizar revisiones."""
    seccion = graphene.String(required=True, description="Sección del distribuidor que está siendo revisada.")
    campo = graphene.String(required=True, description="Campo específico dentro de la sección que está siendo revisado.")
    comentarios = graphene.String(description="Comentarios de la revisión")
    
    
class CreateDistributor(graphene.Mutation):
    """Mutación para crear un nuevo distribuidor con referencias y documentos."""
    class Arguments:
        nombres= graphene.String(required=True)
        apellidos = graphene.String(required=True)
        dpi = graphene.String(required=True)
        correo = graphene.String(required=True)
        telefono = graphene.String(required=True)
        departamento = graphene.String(required=True)
        municipio = graphene.String(required=True)
        direccion = graphene.String(required=True)      
        telefono_negocio = graphene.String()
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String(required=True)
        productos_distribuidos = graphene.String(required=True)
        tipo_persona = graphene.String(required=True)
        cuenta_bancaria = graphene.String()
        numero_cuenta =graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        estado = graphene.String()
        
        # NUEVO CAMPO PARA REFERENCIAS
        referencias = graphene.List(ReferenceInput, description="Lista de referencias del distribuidor")
        
        # NUEVO CAMPO PARA DOCUMENTOS
        documentos = graphene.List(DocumentInput, description="Lista de documentos del distribuidor")


    distributor = graphene.Field(DistributorType)

    def mutate(self, info, **kwargs):
        """
        Crea un nuevo distribuidor con sus referencias y documentos asociados.
        Usa transacciones para asegurar consistencia de datos.
        """
        # Extraer referencias y documentos del kwargs
        referencias_data = kwargs.pop('referencias', [])
        documentos_data = kwargs.pop('documentos', [])
        
        try:
            with transaction.atomic():

                # EXTRAER NIT Y RAZON SOCIAL DEL ARCHIVO SUBIDO RTU
                # 1. Buscar el documento RTU en los documentos proporcionados
                rtu_doc_data= None
                for doc_data in documentos_data:
                    if doc_data.get('tipoDocumento') == 'rtu':
                        rtu_doc_data = doc_data
                        break

                # 2. Si existe el documento rtu, extraer NIT, razón social y sucursales

                nit_from_rtu = None
                razon_social_from_rtu = None
                sucursales_from_rtu = None

                if rtu_doc_data:
                   try:
                       # Decodificar base64
                       archivo_base64 = rtu_doc_data.get('archivoData')
                       archivo_decodificado = base64.b64decode(archivo_base64)

                       # Guardamos temporalmente el pdf para extraer datos
                       import tempfile
                       import os
                       
                       # delete=False para que no se elimine automáticamente
                       with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                           temp_pdf.write(archivo_decodificado)
                           temp_pdf_path = temp_pdf.name
                       
                       # Ahora podemos usar el archivo porque aún existe
                       rtu_data = extract_rtu(temp_pdf_path)

                       # Extraer NIT, razón social y sucursales
                       nit_from_rtu = rtu_data.get('nit')
                       razon_social_from_rtu = rtu_data.get('razon_social')
                       sucursales_from_rtu = rtu_data.get('establecimientos', [])
                       
                       # Limpiar el archivo temporal manualmente
                       os.unlink(temp_pdf_path)

                   except Exception as e:
                       # Si hay un archivo temporal, limpiarlo en caso de error
                       if 'temp_pdf_path' in locals() and os.path.exists(temp_pdf_path):
                           os.unlink(temp_pdf_path)
                       raise ValueError(f"Error al decodificar archivo RTU: {str(e)}")
                else:
                    raise ValueError("El documento RTU es obligatorio para crear un distribuidor.")
                   

                # VERIFICAR CAMPOS OBLIGATORIOS
                for field in ['nombres', 
                              'apellidos', 
                              'dpi', 
                              'correo', 
                              'telefono', 
                              'departamento',
                              'municipio', 
                              'direccion', 
                              'antiguedad',
                              'productos_distribuidos', 
                              'tipo_persona',
                              'telefono_negocio',
                              'equipamiento',
                              'sucursales',
                              'antiguedad',
                              'tipo_persona',
                              'cuenta_bancaria',
                              'numero_cuenta',
                              'tipo_cuenta',
                              'banco'
                              ]:
                        if not kwargs.get(field):
                            raise ValueError(f"El campo '{field}' es obligatorio y no fue proporcionado.")

                # 1. CREAR EL DISTRIBUIDOR
                distributor = Distributor(
                    nombres=kwargs.get("nombres"),
                    apellidos=kwargs.get("apellidos"),
                    dpi=kwargs.get("dpi"),
                    correo=kwargs.get("correo"),
                    telefono=kwargs.get("telefono"),
                    departamento=kwargs.get("departamento"),
                    municipio=kwargs.get("municipio"),
                    direccion=kwargs.get("direccion"),
                    negocio_nombre=razon_social_from_rtu,# Extraido
                    nit=nit_from_rtu,                    # Extraido
                    telefono_negocio=kwargs.get("telefono_negocio"),
                    equipamiento=kwargs.get("equipamiento"),
                    sucursales=kwargs.get("sucursales"),
                    antiguedad=kwargs.get("antiguedad"),
                    productos_distribuidos=kwargs.get("productos_distribuidos"),
                    tipo_persona=kwargs.get("tipo_persona"),
                    cuenta_bancaria=kwargs.get("cuenta_bancaria"),
                    numero_cuenta=kwargs.get("numero_cuenta"),
                    tipo_cuenta=kwargs.get("tipo_cuenta"),
                    banco=kwargs.get("banco"),
                    estado=kwargs.get("estado", "pendiente")
                )
                distributor.save()

                # VERIFICAR POR LO MENOS 2 REFERENCIAS
                if len(referencias_data) < 2:
                    raise ValueError("Se requieren al menos 2 referencias para crear un distribuidor.")
                                
                # 2. CREAR LAS REFERENCIAS
                referencias_creadas = []
                for ref_data in referencias_data:
                    referencia = Reference(
                        distribuidor=distributor,
                        nombres=ref_data.get('nombres'),
                        telefono=ref_data.get('telefono'),
                        relacion=ref_data.get('relacion')
                    )
                    referencia.save()
                    referencias_creadas.append(referencia)


                # 3. CREAR LOS DOCUMENTOS
                # Verificar que se envían los 4 documentos obligatorios
                if len(documentos_data) < 4:
                    raise ValueError("Todos los documentos son obligatorios. Se requieren 4 documentos (DPI frontal, DPI posterior, RTU y Patente de Comercio).")
                
                documentos_creados = []
                for doc_data in documentos_data:
                    try:
                                              
                        archivo_base64 = doc_data.get('archivoData')
                        nombre_archivo = doc_data.get('nombreArchivo')
                        tipo_documento = doc_data.get('tipoDocumento')
                        
                        # Verificar documentos tipo imagen
                        if tipo_documento in ['dpi_frontal', 'dpi_posterior', 'patente_comercio']:
                            if not (nombre_archivo.lower().endswith('.png') or nombre_archivo.lower().endswith('.jpg') or nombre_archivo.lower().endswith('.jpeg')):
                                raise ValueError(f"El documento '{tipo_documento}' debe ser una imagen PNG o JPG.")
                        elif tipo_documento == 'rtu':
                            if not nombre_archivo.lower().endswith('.pdf'):
                                raise ValueError("El documento 'RTU' debe ser un archivo PDF.")
                        
                        # Verificar que los datos necesarios estén presentes
                        if not archivo_base64 or not nombre_archivo or not tipo_documento:
                            raise ValueError(f"Datos incompletos para documento {tipo_documento}")
                        
                        # Decodificar base64
                        try:
                            archivo_decodificado = base64.b64decode(archivo_base64)
                            archivo_django = ContentFile(archivo_decodificado, name=nombre_archivo)
                        except Exception as e:
                            raise ValueError(f"Error al decodificar archivo {nombre_archivo}: {str(e)}")
                        
                        # Crear el documento
                        documento = Document(
                            distribuidor=distributor,
                            tipo_documento=tipo_documento,
                            archivo=archivo_django
                        )
                        documento.save()
                        documentos_creados.append(documento)
            
                    
                      
                    except Exception as e:
                        raise ValueError(f"Error procesando documento {doc_data.get('tipoDocumento', 'desconocido')}: {str(e)}")
                    

                # CREAR LAS SUCURSALES DESDE EL RTU SI EXISTEN
                if sucursales_from_rtu:
                    for establecimiento in sucursales_from_rtu:
                       nombre = establecimiento.get('nombre_comercial') or establecimiento.get('nombre') or 'Sin nombre'
                       direccion = establecimiento.get('direccion') or 'No especificada'
                       departamento = establecimiento.get('departamento') or 'No especificado'
                       municipio = establecimiento.get('municipio') or 'No especificado'
                       telefono = distributor.telefono_negocio or distributor.telefono or '00000000'   
                       location = Location(
                           distribuidor=distributor,
                           nombre=nombre,
                           direccion=direccion,
                           departamento=departamento,
                           municipio=municipio,
                           telefono=telefono
                       )
                       location.save()
                else:
                    raise ValueError("El RTU debe contener al menos un establecimiento para crear un distribuidor.")

                # crar la entrada de tracking inicial
                tracking_entry = Trackingdistributor(
                    distribuidor=distributor,
                    estado='pendiente',
                    observacion='Distribuidor ha creado su perfil en el sistema.'
                )
                tracking_entry.save()
                return CreateDistributor(distributor=distributor)
            
            
                
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al crear el distribuidor: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")

class UpdateDistributor(graphene.Mutation):
    """Mutación para actualizar un distribuidor existente, sus referencias y documentos."""
    class Arguments:
        id = graphene.ID(required=True)
        nombres= graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        correo = graphene.String()
        telefono = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        negocio_nombre = graphene.String()
        nit = graphene.String()
        telefono_negocio = graphene.String()
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        tipo_persona = graphene.String()
        cuenta_bancaria = graphene.String()
        numero_cuenta =graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        estado = graphene.String()
        
        # NUEVO CAMPO PARA REFERENCIAS (opcional en updates)
        referencias = graphene.List(ReferenceUpdateInput, description="Lista de referencias del distribuidor")
        
        # NUEVO CAMPO PARA DOCUMENTOS (opcional en updates)
        documentos = graphene.List(DocumentInput, description="Lista de documentos del distribuidor")

    distributor = graphene.Field(DistributorType)

    def mutate(self, info, id, **kwargs):
        """
        Actualiza un distribuidor, sus referencias y documentos.
        - Si se proporcionan referencias, reemplaza todas las existentes
        - Si se proporcionan documentos, reemplaza todos los existentes
        - Usa transacciones para asegurar consistencia
        """

        check_permission(info.context.user, "can_update_distributors")

        try:
            with transaction.atomic():


                distributor_id = from_global_id(id)[1]
                distributor = Distributor.objects.get(pk=distributor_id)
                
                #  ACTUALIZAR CAMPOS DEL DISTRIBUIDOR
                for field, value in kwargs.items():
                    # verificar si el campo estado está siendo actualizado
                    if field == 'estado':
                        # obtener el estado del distribuidor antes del cambio
                        previous_state = distributor.estado
                        
                        # Verificar si el estado actual es final (aprobado o rechazado)
                        if previous_state in ["aprobado", "rechazado"]:
                            raise ValueError(
                                f"No se puede modificar el estado del distribuidor. "
                                f"El estado '{previous_state}' es un estado final."
                            )
                        
                         # Filtrar revisiones pendientes excluyendo la actual
                        pending_revisions = Revisiondistributor.objects.filter(
                            distribuidor=distributor,
                            aprobado=False,
                            is_deleted=False
                        ).exclude(pk=distributor.pk)

                        # Filtrar referencias pendientes
                        pending_references = Reference.objects.filter(
                            Q(estado__isnull=True) | Q(estado='rechazado'),
                            distribuidor=distributor,
                            is_deleted=False
                        )

                        # Filtrar documentos pendientes
                        pending_documents = Document.objects.filter(
                            Q(estado__isnull=True) | Q(estado='rechazado'),
                            distribuidor=distributor,
                            is_deleted=False
                        )

                        # Si hay revisiones, referencias o documentos pendientes, no permitir el cambio de estado
                        if pending_revisions.exists() or pending_references.exists() or pending_documents.exists():
                            raise ValueError(
                                "No se puede cambiar el estado del distribuidor mientras haya "
                                "revisiones, referencias o documentos pendientes de aprobación."
                            )

                        # Si el estado anterior no es final, verificar si el nuevo estado es aprobado, rechazado o validado
                        if value in ["aprobado", "rechazado", "validado"]:
                            # crear entrada en tracking
                            tracking_entry = Trackingdistributor(
                                distribuidor=distributor,
                                estado=value,
                                observacion=f"El distribuidor ha sido {value}."
                            )
                            tracking_entry.save()
   
                    setattr(distributor, field, value)
                distributor.save()

                return UpdateDistributor(distributor=distributor)
                
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar el distributor: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")  


class DeleteDistributor(graphene.Mutation):
    """Mutación para eliminar un distribuidor existente."""
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        check_permission(info.context.user, "can_delete_distributors")
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            distributor.delete()
            return DeleteDistributor(success=True)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar el distribuidor: {str(e)}")
        
class HardDeleteDistributor(graphene.Mutation):
    """Mutación para eliminar permanentemente un distribuidor existente."""
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            distributor.hard_delete()
            return HardDeleteDistributor(success=True)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar permanentemente el distribuidor: {str(e)}")


class AddDocumentToDistributor(graphene.Mutation):
    """Mutación para agregar un documento a un distribuidor existente."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        archivo_base64 = graphene.String(required=True)
        nombre_archivo = graphene.String(required=True)
        tipo_documento = graphene.String(required=True)

    document = graphene.Field(DocumentType)

    def mutate(self, info, distributor_id, archivo_base64, nombre_archivo, tipo_documento):
        check_permission(info.context.user, "can_update_distributors")
        try:
            with transaction.atomic():
                # Decodificar el ID del distribuidor desde el Global ID
                dist_id = from_global_id(distributor_id)[1]
                
                # Obtener el objeto distribuidor
                distributor = Distributor.objects.get(pk=dist_id)
                
                # Validar que los datos necesarios estén presentes
                if not archivo_base64 or not nombre_archivo or not tipo_documento:
                    raise ValueError("Todos los campos son requeridos")
                
                # Validamos si el tipo de documento ya existe
                existing_doc = Document.objects.filter(
                    distribuidor=distributor,
                    tipo_documento=tipo_documento,
                    is_deleted=False
                ).first()
                if existing_doc:
                    raise ValueError(f"El documento de tipo '{tipo_documento}' ya existe para este distribuidor.")
                
                # Validar tipo de archivo según el tipo de documento
                if tipo_documento in ['dpi_frontal', 'dpi_posterior', 'patente_comercio']:
                    if not (nombre_archivo.lower().endswith('.png') or nombre_archivo.lower().endswith('.jpg') or nombre_archivo.lower().endswith('.jpeg')):
                        raise ValueError(f"El documento '{tipo_documento}' debe ser una imagen PNG o JPG.")
                elif tipo_documento == 'rtu':
                    if not nombre_archivo.lower().endswith('.pdf'):
                        raise ValueError("El documento 'RTU' debe ser un archivo PDF.")
                                
                # Decodificar base64
                try:
                    archivo_decodificado = base64.b64decode(archivo_base64)
                    archivo_django = ContentFile(archivo_decodificado, name=nombre_archivo)
                except Exception as e:
                    raise ValueError(f"Error al decodificar archivo {nombre_archivo}: {str(e)}")

                # Crear el documento
                new_document = Document(
                    distribuidor=distributor, 
                    tipo_documento=tipo_documento,
                    archivo=archivo_django
                )
                new_document.save()

                return AddDocumentToDistributor(document=new_document)

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al agregar el documento: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class UpdateDocumentFromDistributor(graphene.Mutation):
    """Mutación para actualizar un documento de un distribuidor existente."""
    class Arguments:
        document_id = graphene.ID(required=True)
        archivo_base64 = graphene.String()
        nombre_archivo = graphene.String()
        estado = graphene.String()
    document = graphene.Field(DocumentType)
    def mutate(self, info, document_id, archivo_base64=None, nombre_archivo=None, estado=None):
        check_permission(info.context.user, "can_update_distributors")
        try:
            document = Document.objects.get(pk=document_id)

            # Actualizar el archivo si se proporcionaron los datos
            if archivo_base64 and nombre_archivo:
                try:
                    archivo_decodificado = base64.b64decode(archivo_base64)
                    archivo_django = ContentFile(archivo_decodificado, name=nombre_archivo)
                    document.archivo = archivo_django
                except Exception as e:
                    raise ValueError(f"Error al decodificar archivo {nombre_archivo}: {str(e)}")

            # Actualizar el estado si se proporcionó
            if estado is not None:
                document.estado = estado

            document.save()

            return UpdateDocumentFromDistributor(document=document)

        except Document.DoesNotExist:
            raise GraphQLError(f"Documento no encontrado con ID: {document_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar el documento: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al actualizar documento: {str(e)}")
        


class DeleteDocumentFromDistributor(graphene.Mutation):
    """Mutación para eliminar un documento de un distribuidor existente."""
    class Arguments:
        document_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, document_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
                       
            document = Document.objects.get(pk=document_id)
            document.delete()
            return DeleteDocumentFromDistributor(success=True)
        except Document.DoesNotExist:
            raise GraphQLError(f"Documento no encontrado con ID: {document_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar el documento: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al eliminar documento: {str(e)}")

class AddReferenceToDistributor(graphene.Mutation):
    """Mutación para agregar referencias a un distribuidor específico"""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

   
    reference = graphene.Field(ReferenceType)

    def mutate(self, info, distributor_id, nombres, telefono, relacion):
        check_permission(info.context.user, "can_update_distributors")
        try:
            #
            dist_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=dist_id)

            # Validar que los datos necesarios estén presentes
            if not nombres or not telefono or not relacion:
                raise ValueError("Todos los campos son requeridos")

            # Crear la referencia
            new_reference = Reference(
                distribuidor=distributor,
                nombres=nombres,
                telefono=telefono,
                relacion=relacion
            )
            new_reference.save()

            return AddReferenceToDistributor(reference=new_reference)

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al agregar la referencia: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")

class DeleteReferenceFromDistributor(graphene.Mutation):
    """Mutación para eliminar una referencia de un distribuidor existente."""
    class Arguments:
        reference_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, reference_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
                           
            reference = Reference.objects.get(pk=reference_id)
            reference.delete()
            return DeleteReferenceFromDistributor(success=True)
        except Reference.DoesNotExist:
            raise GraphQLError(f"Referencia no encontrada con ID: {reference_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar la referencia: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al eliminar referencia: {str(e)}")

class UpdateReferenceFromDistributor(graphene.Mutation):
    """Mutación para actualizar una referencia de un distribuidor existente."""
    class Arguments:
        reference_id = graphene.ID(required=True)
        nombres = graphene.String()
        telefono = graphene.String()
        relacion = graphene.String()
        estado = graphene.String()
    reference = graphene.Field(ReferenceType)

    def mutate(self, info, reference_id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            reference = Reference.objects.get(pk=reference_id)

            # Actualizar campos proporcionados
            for field, value in kwargs.items():
                setattr(reference, field, value)
            reference.save()

            return UpdateReferenceFromDistributor(reference=reference)

        except Reference.DoesNotExist:
            raise GraphQLError(f"Referencia no encontrada con ID: {reference_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar la referencia: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al actualizar referencia: {str(e)}")
                

class AddLocationToDistributor(graphene.Mutation):
    """
    Mutación para agregar ubicaciones a un distribuidor desde su documento RTU.
    Busca automáticamente el documento RTU, lo procesa y crea las sucursales.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True)

    locations = graphene.List(LocationType)
    locations_count = graphene.Int()
    rtu_data = graphene.JSONString()

    def mutate(self, info, distributor_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            with transaction.atomic():
                # 1. Decodificar el ID del distribuidor
                dist_id = from_global_id(distributor_id)[1]
                distributor = Distributor.objects.get(pk=dist_id)
                
                # 2. Buscar el documento RTU del distribuidor
                rtu_document = Document.objects.filter(
                    distribuidor=distributor,
                    tipo_documento='rtu',
                    is_deleted=False
                ).first()
                
                if not rtu_document:
                    raise ValueError("No se encontró un documento RTU para este distribuidor")
                
                # 3. Obtener la ruta del archivo PDF
                pdf_path = rtu_document.archivo.path
                
                # 4. Extraer datos del RTU con la función rtu_extractor
                rtu_data = extract_rtu(pdf_path)
                
                # 5. Obtener los establecimientos
                establecimientos = rtu_data.get('establecimientos', [])
                
                if not establecimientos:
                    raise ValueError("El RTU no contiene establecimientos para procesar")
                
                # 6. Crear locations por cada establecimiento
                locations_created = []
                
                for establecimiento in establecimientos:
                    # Extraer datos del establecimiento con valores por defecto
                    nombre = establecimiento.get('nombre_comercial') or establecimiento.get('nombre') or 'Sin nombre'
                    direccion = establecimiento.get('direccion') or 'No especificada'
                    departamento = establecimiento.get('departamento') or 'No especificado'
                    municipio = establecimiento.get('municipio') or 'No especificado'
                    
                    # Usar teléfono del distribuidor o valor por defecto
                    telefono = distributor.telefono_negocio or distributor.telefono or '00000000'
                    
                    # Verificar si ya existe una location con ese nombre para evitar duplicados
                    existing_location = Location.objects.filter(
                        distribuidor=distributor,
                        nombre=nombre,
                        is_deleted=False
                    ).first()
                    
                    if existing_location:
                        # Si ya existe, actualizarla
                        existing_location.direccion = direccion
                        existing_location.departamento = departamento
                        existing_location.municipio = municipio
                        existing_location.telefono = telefono
                        existing_location.save()
                        locations_created.append(existing_location)
                    else:
                        # Si no existe, crearla
                        new_location = Location(
                            distribuidor=distributor,
                            nombre=nombre,
                            departamento=departamento,
                            municipio=municipio,
                            direccion=direccion,
                            telefono=telefono
                        )
                        new_location.save()
                        locations_created.append(new_location)
                
                return AddLocationToDistributor(
                    locations=locations_created,
                    locations_count=len(locations_created),
                    rtu_data=rtu_data
                )

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except FileNotFoundError:
            raise GraphQLError("El archivo RTU no se encuentra en el servidor.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")
        
class DeleteLocationFromDistributor(graphene.Mutation):
    """Mutación para eliminar una ubicación de un distribuidor existente."""
    class Arguments:
        location_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, location_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
                           
            location = Location.objects.get(pk=location_id)
            location.delete()
            return DeleteLocationFromDistributor(success=True)
        except Location.DoesNotExist:
            raise GraphQLError(f"Ubicación no encontrada con ID: {location_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar la ubicación: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al eliminar ubicación: {str(e)}")
        

class UpdateLocationFromDistributor(graphene.Mutation):
    """Mutación para actualizar una ubicación de un distribuidor existente."""
    class Arguments:
        location_id = graphene.ID(required=True)
        nombre = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        telefono = graphene.String()
        is_active = graphene.Boolean()

    location = graphene.Field(LocationType)
    def mutate(self, info, location_id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            location = Location.objects.get(pk=location_id)

            # Actualizar campos proporcionados
            for field, value in kwargs.items():
                setattr(location, field, value)
            location.save()

            return UpdateLocationFromDistributor(location=location)

        except Location.DoesNotExist:
            raise GraphQLError(f"Ubicación no encontrada con ID: {location_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar la ubicación: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al actualizar ubicación: {str(e)}")
        
class AssignDistributorToMe(graphene.Mutation):
    """
    Asigna un distribuidor al usuario autenticado.
    """

    class Arguments:
        distributor_id = graphene.ID(
            required=True, 
            description="ID global del distribuidor a asignar."
        )
    
    success = graphene.Boolean()
    

    def mutate(self, info, distributor_id):
        user = info.context.user

        if not user.is_authenticated:
            raise GraphQLError("Usuario no autenticado.")

        try:
            # Obtener el ID real del distribuidor
            dist_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=dist_id, is_deleted=False)
            
            # Verificar que el distribuidor esté en estado pendiente (disponible para asignación)
            if distributor.estado != 'pendiente':
                raise GraphQLError(f"El distribuidor no está disponible para asignación. Estado actual: {distributor.estado}")
            
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")

        try:
            with transaction.atomic():
                # Verificar si ya existe una asignación activa
                existing_assignment = Assignmentdistributor.objects.filter(
                    usuario=user,
                    distribuidor=distributor,
                    is_deleted=False
                ).first()
                
                if existing_assignment:
                    raise GraphQLError("Ya tienes este distribuidor asignado.")
                
                # Cambiar el estado del distribuidor a 'revision'
                distributor.estado = 'revision'
                distributor.save()

                # Crear una inserción en trackingdistributor
                tracking_entry = Trackingdistributor(
                    distribuidor=distributor,
                    estado='revision',
                    observacion=f"Distribuidor asignado a {user.username} para revisión."
                )
                tracking_entry.save()
                
                # Crear la asignación 
                assignment = Assignmentdistributor(
                    usuario=user, 
                    distribuidor=distributor
                )
                assignment.save()

            return AssignDistributorToMe(
                success=True
            )
            
        except IntegrityError as e:
            raise GraphQLError(f"Error al crear la asignación: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")
        

class CreateRevisions(graphene.Mutation):
    """
    Mutación para crear múltiples revisiones para un distribuidor.
    Permite documentar campos que necesitan corrección durante el proceso de revisión.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True, description="ID del distribuidor en revisión")
        revisions = graphene.List(RevisionInput, required=True, description="Lista de revisiones a crear")

    # Campos de retorno
    revisions = graphene.List(RevisiondistributorType)
    

    def mutate(self, info, distributor_id, revisions):
        """
        Crea múltiples revisiones para un distribuidor.
        """
        user = info.context.user

        # Verificar autenticación
        if not user.is_authenticated:
            raise GraphQLError("Usuario no autenticado.")

        # Validar que hay revisiones para crear
        if not revisions or len(revisions) == 0:
            raise GraphQLError("Debe proporcionar al menos una revisión.")

        try:
            with transaction.atomic():
                # Decodificar y obtener el distribuidor
                dist_id = from_global_id(distributor_id)[1]
                distributor = Distributor.objects.get(pk=dist_id, is_deleted=False)
                            
                # Verificar que el usuario tiene el distribuidor asignado
                assignment = Assignmentdistributor.objects.filter(
                    usuario=user,
                    distribuidor=distributor,
                    is_deleted=False
                ).first()
                
                if not assignment:
                    raise GraphQLError("No tienes este distribuidor asignado para revisión.")
                
                # Crear las revisiones
                revisiones_creadas = []
                for rev_data in revisions:
                    # Validar campos requeridos
                    seccion = rev_data.get('seccion')
                    campo = rev_data.get('campo')
                    comentarios = rev_data.get('comentarios', '')
                    
                    if not seccion or not campo:
                        raise ValueError("Los campos 'seccion' y 'campo' son obligatorios.")
                    
                    # Crear la revisión
                    revision = Revisiondistributor(
                        distribuidor=distributor,
                        seccion=seccion,
                        campo=campo,
                        comentarios=comentarios
                    )
                    revision.save()
                    revisiones_creadas.append(revision)

                # Crear una entrada en trackingdistributor
                # verificando no volver a crear la entrada si
                # el distribuidor ya este en estado 'revision'

                if distributor.estado != 'revision':
                    tracking_entry = Trackingdistributor(
                        distribuidor=distributor,
                        estado='revision',
                        observacion="Se agregaron nuevas revisiones durante el proceso de revisión."
                    )
                    tracking_entry.save()

                # Cambiar el estado del distribuidor a 'revision'

                distributor.estado = 'revision'
                distributor.save()
                
                

                return CreateRevisions(
                    revisions=revisiones_creadas
                )

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al crear las revisiones: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")
        


class UpdateRevision(graphene.Mutation):
    """Mutación para actualizar una revisión existente."""
    class Arguments:
        revision_id = graphene.ID(required=True)
        seccion = graphene.String()
        campo = graphene.String()
        aprobado = graphene.Boolean()
        comentarios = graphene.String()
    revision = graphene.Field(RevisiondistributorType)
    def mutate(self, info, revision_id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            revision = Revisiondistributor.objects.get(pk=revision_id)

            # Verificar si ya no tiene revisiones pendientes y actualizar el estado del distribuidor
            if 'aprobado' in kwargs and kwargs['aprobado'] is True:
                
                # Filtrar revisiones pendientes excluyendo la actual
                pending_revisions = Revisiondistributor.objects.filter(
                    distribuidor=revision.distribuidor,
                    aprobado=False,
                    is_deleted=False
                ).exclude(pk=revision.pk)

                # Filtrar referencias pendientes
                pending_references = Reference.objects.filter(
                    Q(estado__isnull=True) | Q(estado='rechazado'),
                    distribuidor=revision.distribuidor,
                    is_deleted=False
                )

                # Filtrar documentos pendientes
                pending_documents = Document.objects.filter(
                    Q(estado__isnull=True) | Q(estado='rechazado'),
                    distribuidor=revision.distribuidor,
                    is_deleted=False
                )

                if not pending_revisions.exists() and not pending_references.exists() and not pending_documents.exists():
                    # No hay revisiones pendientes, actualizar el estado del distribuidor
                    distributor = revision.distribuidor
                    distributor.estado = 'validado'
                    distributor.save()
                    
                    # Crear una entrada en trackingdistributor
                    tracking_entry = Trackingdistributor(
                        distribuidor=distributor,
                        estado='validado',
                        observacion="Todas las revisiones aprobadas. Distribuidor validado."
                    )
                    tracking_entry.save()
              

            # Actualizar el resto de campos proporcionados
            for field, value in kwargs.items():
                setattr(revision, field, value)
            revision.save()

            return UpdateRevision(revision=revision)

        except Revisiondistributor.DoesNotExist:
            raise GraphQLError(f"Revisión no encontrada con ID: {revision_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar la revisión: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al actualizar revisión: {str(e)}")
    
class DeleteRevision(graphene.Mutation):
    """Mutación para eliminar una revisión existente."""
    class Arguments:
        revision_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, revision_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
                           
            revision = Revisiondistributor.objects.get(pk=revision_id)
            revision.delete()
            return DeleteRevision(success=True)
        except Revisiondistributor.DoesNotExist:
            raise GraphQLError(f"Revisión no encontrada con ID: {revision_id}")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar la revisión: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado al eliminar revisión: {str(e)}")


class DistributorMutations(graphene.ObjectType):
    """Define las mutaciones disponibles para el modelo Distributor."""
    create_distributor = CreateDistributor.Field()
    update_distributor = UpdateDistributor.Field()
    delete_distributor = DeleteDistributor.Field()
    hard_delete_distributor = HardDeleteDistributor.Field()
    add_document_to_distributor = AddDocumentToDistributor.Field()
    update_document_from_distributor = UpdateDocumentFromDistributor.Field()
    delete_document_from_distributor = DeleteDocumentFromDistributor.Field()
    add_reference_to_distributor = AddReferenceToDistributor.Field()
    delete_reference_from_distributor = DeleteReferenceFromDistributor.Field()
    update_reference_from_distributor = UpdateReferenceFromDistributor.Field()
    add_location_to_distributor = AddLocationToDistributor.Field()
    delete_location_from_distributor = DeleteLocationFromDistributor.Field()
    update_location_from_distributor = UpdateLocationFromDistributor.Field()
    assign_distributor_to_me = AssignDistributorToMe.Field()
    create_revisions = CreateRevisions.Field()
    update_revision = UpdateRevision.Field()
    delete_revision = DeleteRevision.Field()

