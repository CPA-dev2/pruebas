# api/graphql/mutations/distributors.py

import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction
from graphene_file_upload.scalars import Upload
from django.core.files.base import ContentFile

from ..permissions import check_permission
from api.models import (
    Distributor, Document, Reference, Location, 
    Assignmentdistributor, Revisiondistributor
)
# REFACTOR: Importar los 'Types' y 'Nodes' del archivo de schema consolidado
# Esto soluciona el error de importación circular.
from ..schema.distributor import (
    DistributorNode,
    DocumentType,
    ReferenceType,
    LocationType,
    RevisiondistributorType
)
from api.services.distributor_service import create_distributor, update_distributor

# --- InputTypes para sub-modelos ---

class DocumentInput(graphene.InputObjectType):
    """Input type para crear documentos durante la creación del distribuidor."""
    tipoDocumento = graphene.String(required=True)
    archivoData = Upload(required=True)
    nombreArchivo = graphene.String(required=True)

class DocumentUpdateInput(graphene.InputObjectType):
    """Input type para actualizar el estado de un documento durante la validación."""
    id = graphene.ID(required=True, description="ID Global del Document")
    estado = graphene.String(required=True, description="Nuevo estado (ej. 'aprobado', 'rechazado')")

class ReferenceInput(graphene.InputObjectType):
    """Input type para crear referencias."""
    nombres = graphene.String(required=True)
    telefono = graphene.String(required=True)
    relacion = graphene.String(required=True)
    estado = graphene.String(default_value='pendiente')

class ReferenceUpdateInput(graphene.InputObjectType):
    """Input type para actualizar una referencia durante la validación/edición."""
    id = graphene.ID(required=True, description="ID Global de la Reference")
    nombres = graphene.String()
    telefono = graphene.String()
    relacion = graphene.String()
    estado = graphene.String()

class LocationUpdateInput(graphene.InputObjectType):
    """Input type para actualizar una ubicación/sucursal."""
    id = graphene.ID(required=True, description="ID Global de la Location")
    nombre = graphene.String()
    departamento = graphene.String()
    municipio = graphene.String()
    direccion = graphene.String()
    telefono = graphene.String()
    estado = graphene.String()

class RevisionInput(graphene.InputObjectType):
    """Input type para crear nuevas revisiones (observaciones)."""
    seccion = graphene.String(required=True, description="Sección con la observación (ej. 'Documentos')")
    campo = graphene.String(required=True, description="Campo específico (ej. 'DPI')")
    comentarios = graphene.String(required=True, description="Observación del validador")

# --- Mutaciones del Agregado 'Distributor' ---

class CreateDistributor(graphene.Mutation):
    """
    Mutación para crear un nuevo distribuidor, incluyendo sus referencias
    y documentos iniciales, de forma atómica.
    """
    class Arguments:
        nombres = graphene.String(required=True)
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
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        
        referencias = graphene.List(ReferenceInput)
        documentos = graphene.List(DocumentInput)

    distributor = graphene.Field(DistributorNode)

    def mutate(self, info, **kwargs):
        referencias_data = kwargs.pop('referencias', [])
        documentos_data = kwargs.pop('documentos', [])
        
        try:
            # La lógica de negocio está en el servicio
            distributor = create_distributor(
                data=kwargs,
                referencias=referencias_data,
                documentos=documentos_data
            )
            return CreateDistributor(distributor=distributor)                 
        except Exception as e:
            raise GraphQLError(f"Error al crear el distribuidor: {str(e)}")

class UpdateDistributor(graphene.Mutation):
    """
    Mutación para actualizar los campos *principales* de un distribuidor.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global del Distribuidor")
        nombres = graphene.String()
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
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        estado = graphene.String(description="Actualiza el estado principal (ej. 'aprobado', 'rechazado')")
     
    distributor = graphene.Field(DistributorNode)

    def mutate(self, info, id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id, is_deleted=False)
            
            # Llamada al servicio que maneja la actualización y el tracking
            updated_distributor = update_distributor(
                distributor=distributor,
                data=kwargs
            )
            return UpdateDistributor(distributor=updated_distributor)
        except Distributor.DoesNotExist:
             raise GraphQLError("Distribuidor no encontrado.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")  

class DeleteDistributor(graphene.Mutation):
    """Mutación para eliminar (soft delete) un distribuidor."""
    class Arguments:
        id = graphene.ID(required=True)
    success = graphene.Boolean()

    def mutate(self, info, id):
        check_permission(info.context.user, "can_delete_distributors")
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            distributor.delete()  # Soft delete
            return DeleteDistributor(success=True)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")

# --- Mutaciones de Sub-Modelos (Ahora parte del Agregado) ---

class AddDocumentToDistributor(graphene.Mutation):
    """Añade un nuevo documento a un distribuidor existente."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        tipo_documento = graphene.String(required=True)
        archivo_base = Upload(required=True)
        nombre_archivo = graphene.String(required=True)
    
    document = graphene.Field(DocumentType)

    def mutate(self, info, distributor_id, tipo_documento, archivo_base, nombre_archivo):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=db_id, is_deleted=False)
            
            document = Document.objects.create(
                distributor=distributor,
                tipoDocumento=tipo_documento,
                archivo=ContentFile(archivo_base.read(), name=nombre_archivo),
                estado='pendiente'
            )
            return AddDocumentToDistributor(document=document)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except Exception as e:
            raise GraphQLError(f"Error al añadir documento: {str(e)}")

class UpdateDocumentFromDistributor(graphene.Mutation):
    """Actualiza el estado de un documento que PERTENECE a un distribuidor."""
    class Arguments:
        distributor_id = graphene.ID(required=True, description="ID del Distribuidor padre")
        document_id = graphene.ID(required=True, description="ID del Documento a actualizar")
        estado = graphene.String(required=True, description="Nuevo estado (aprobado, rechazado)")
    
    document = graphene.Field(DocumentType)

    def mutate(self, info, distributor_id, document_id, estado):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            doc_id = from_global_id(document_id)[1]
            
            # MEJORA DE SEGURIDAD (Patrón Agregado):
            # Asegura que el documento pertenezca al distribuidor especificado
            document = Document.objects.get(
                pk=doc_id, 
                distributor_id=db_id, 
                is_deleted=False
            )
            
            document.estado = estado
            document.save()
            return UpdateDocumentFromDistributor(document=document)
        except Document.DoesNotExist:
            raise GraphQLError("Documento no encontrado o no pertenece a este distribuidor.")

class DeleteDocumentFromDistributor(graphene.Mutation):
    """Elimina (soft delete) un documento que PERTENECE a un distribuidor."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        document_id = graphene.ID(required=True)
        
    success = graphene.Boolean()

    def mutate(self, info, distributor_id, document_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            doc_id = from_global_id(document_id)[1]
            
            document = Document.objects.get(
                pk=doc_id, 
                distributor_id=db_id, 
                is_deleted=False
            )
            document.delete() # Soft delete
            return DeleteDocumentFromDistributor(success=True)
        except Document.DoesNotExist:
            raise GraphQLError("Documento no encontrado.")

# --- Mutaciones de Referencias (Consolidadas) ---

class AddReferenceToDistributor(graphene.Mutation):
    """Añade una nueva referencia a un distribuidor."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)
        estado = graphene.String(default_value='pendiente')
        
    reference = graphene.Field(ReferenceType)

    def mutate(self, info, distributor_id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=db_id, is_deleted=False)
            
            reference = Reference.objects.create(distributor=distributor, **kwargs)
            return AddReferenceToDistributor(reference=reference)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")

class UpdateReferenceFromDistributor(graphene.Mutation):
    """Actualiza una referencia que PERTENECE a un distribuidor."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        reference_input = ReferenceUpdateInput(required=True)
        
    reference = graphene.Field(ReferenceType)

    def mutate(self, info, distributor_id, reference_input):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            ref_id = from_global_id(reference_input.id)[1]
            
            reference = Reference.objects.get(
                pk=ref_id, 
                distributor_id=db_id, 
                is_deleted=False
            )
            
            # Actualizar solo campos proporcionados
            for key, value in reference_input.items():
                if key != 'id' and value is not None:
                    setattr(reference, key, value)
            
            reference.save()
            return UpdateReferenceFromDistributor(reference=reference)
        except Reference.DoesNotExist:
            raise GraphQLError("Referencia no encontrada o no pertenece a este distribuidor.")

class DeleteReferenceFromDistributor(graphene.Mutation):
    """Elimina (soft delete) una referencia."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        reference_id = graphene.ID(required=True)
        
    success = graphene.Boolean()

    def mutate(self, info, distributor_id, reference_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            ref_id = from_global_id(reference_id)[1]
            
            reference = Reference.objects.get(
                pk=ref_id, 
                distributor_id=db_id, 
                is_deleted=False
            )
            reference.delete() # Soft delete
            return DeleteReferenceFromDistributor(success=True)
        except Reference.DoesNotExist:
            raise GraphQLError("Referencia no encontrada.")

# --- Mutaciones de Ubicaciones (Consolidadas) ---

class UpdateLocationFromDistributor(graphene.Mutation):
    """Actualiza una ubicación que PERTENECE a un distribuidor."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        location_input = LocationUpdateInput(required=True)
        
    location = graphene.Field(LocationType)

    def mutate(self, info, distributor_id, location_input):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            loc_id = from_global_id(location_input.id)[1]
            
            location = Location.objects.get(
                pk=loc_id, 
                distributor_id=db_id, 
                is_deleted=False
            )
            
            for key, value in location_input.items():
                if key != 'id' and value is not None:
                    setattr(location, key, value)
            
            location.save()
            return UpdateLocationFromDistributor(location=location)
        except Location.DoesNotExist:
            raise GraphQLError("Ubicación no encontrada o no pertenece a este distribuidor.")

class DeleteLocationFromDistributor(graphene.Mutation):
    """Elimina (soft delete) una ubicación."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        location_id = graphene.ID(required=True)
        
    success = graphene.Boolean()

    def mutate(self, info, distributor_id, location_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            loc_id = from_global_id(location_id)[1]
            
            location = Location.objects.get(
                pk=loc_id, 
                distributor_id=db_id, 
                is_deleted=False
            )
            location.delete() # Soft delete
            return DeleteLocationFromDistributor(success=True)
        except Location.DoesNotExist:
            raise GraphQLError("Ubicación no encontrada.")

# --- Mutaciones de Flujo de Trabajo (Consolidadas) ---

class AssignDistributorToMe(graphene.Mutation):
    """
    Toma un distribuidor 'pendiente' y se lo asigna al usuario actual,
    cambiando su estado a 'revision'.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    distributor = graphene.Field(DistributorNode)

    def mutate(self, info, distributor_id):
        check_permission(info.context.user, "can_update_distributors") 
        user = info.context.user
        
        try:
            with transaction.atomic():
                db_id = from_global_id(distributor_id)[1]
                distributor = Distributor.objects.get(
                    pk=db_id, 
                    estado='pendiente', 
                    is_deleted=False
                )
                
                distributor.estado = 'revision'
                distributor.save()
                
                Assignmentdistributor.objects.create(
                    distributor=distributor,
                    usuario=user
                )
                
                # Reusa la lógica del servicio para crear el tracking
                update_distributor(distributor, {'estado': 'revision'})
                
                return AssignDistributorToMe(success=True, distributor=distributor)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado o ya no está pendiente.")
        except Exception as e:
            raise GraphQLError(f"Error al asignar distribuidor: {str(e)}")

class CreateRevisions(graphene.Mutation):
    """
    Crea un lote de revisiones (observaciones) para un distribuidor.
    Generalmente se usa al cambiar el estado a 'correccion'.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True)
        revisions = graphene.List(graphene.NonNull(RevisionInput), required=True)
    
    revisions = graphene.List(RevisiondistributorType)

    def mutate(self, info, distributor_id, revisions):
        check_permission(info.context.user, "can_update_distributors")
        try:
            db_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=db_id, is_deleted=False)
            
            new_revisions = [
                Revisiondistributor(
                    distributor=distributor,
                    usuario=info.context.user,
                    **rev_data
                ) for rev_data in revisions
            ]
            
            created = Revisiondistributor.objects.bulk_create(new_revisions)
            return CreateRevisions(revisions=created)
            
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except Exception as e:
            raise GraphQLError(f"Error al crear revisiones: {str(e)}")

# --- Agrupador de Mutaciones ---
        
class DistributorMutations(graphene.ObjectType):
    """
    Agrupa TODAS las mutaciones relacionadas con el Agregado 'Distributor'.
    """
    # Mutaciones Principales
    create_distributor = CreateDistributor.Field()
    update_distributor = UpdateDistributor.Field()
    delete_distributor = DeleteDistributor.Field()
    
    # Mutaciones de Flujo de Trabajo
    assign_distributor_to_me = AssignDistributorToMe.Field()
    create_revisions = CreateRevisions.Field()
    
    # Mutaciones de Documentos
    add_document_to_distributor = AddDocumentToDistributor.Field()
    update_document_from_distributor = UpdateDocumentFromDistributor.Field()
    delete_document_from_distributor = DeleteDocumentFromDistributor.Field()
    
    # Mutaciones de Referencias
    add_reference_to_distributor = AddReferenceToDistributor.Field()
    update_reference_from_distributor = UpdateReferenceFromDistributor.Field()
    delete_reference_from_distributor = DeleteReferenceFromDistributor.Field()

    # Mutaciones de Ubicaciones
    update_location_from_distributor = UpdateLocationFromDistributor.Field()
    delete_location_from_distributor = DeleteLocationFromDistributor.Field()