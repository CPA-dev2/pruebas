import graphene
from graphene import relay
from graphene_file_upload.scalars import Upload
from django.db import transaction
from graphql import GraphQLError
from api.models import (
    Distributor, 
    DistributorDocument, 
    DistributorBranch, 
    DistributorReference
)
from api.graphql.schema.distributor import (
    DistributorNode, 
    DistributorDocumentNode, 
    DistributorBranchNode, 
    DistributorReferenceNode
)
from api.graphql.permissions import check_is_superuser

# --- 1. Mutación Principal del Distribuidor ---

class UpdateDistributorMutation(graphene.Mutation):
    """
    (Admin) Actualiza los datos maestros de un distribuidor APROBADO.
    Esta es una operación sensible y requiere permisos de Superusuario.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global del Distribuidor (maestro).")
        
        # Campos de Distributor
        nit = graphene.String()
        nombre_comercial = graphene.String()
        tipo_distribuidor = graphene.String()
        dpi_representante = graphene.String()
        nombre_representante_completo = graphene.String()
        email_contacto = graphene.String()
        telefono_contacto = graphene.String()
        telefono_negocio = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        equipamiento_desc = graphene.String()
        sucursales_desc = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        cuenta_bancaria_nombre = graphene.String()
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        is_active = graphene.Boolean()

    distributor = graphene.Field(DistributorNode)

    #@check_is_superuser
    def mutate(self, info, id, **kwargs):
        check_is_superuser(info.context.user)
        try:
            _, real_id = relay.Node.from_global_id(id)
            distributor = Distributor.objects.get(pk=real_id)
        except Distributor.DoesNotExist:
            raise GraphQLError("El distribuidor no existe.")
            
        # Actualización dinámica de campos
        # Solo actualiza los campos que vienen en kwargs (no nulos)
        for key, value in kwargs.items():
            if value is not None:
                setattr(distributor, key, value)
        
        distributor.save()
        return UpdateDistributorMutation(distributor=distributor)


# --- 2. Mutaciones de Sucursales ---

class CreateDistributorBranchMutation(graphene.Mutation):
    """
    (Admin) Añade una NUEVA sucursal a un distribuidor APROBADO.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True, description="ID Global del Distribuidor (maestro).")
        nombre = graphene.String(required=True)
        departamento = graphene.String(required=True)
        municipio = graphene.String(required=True)
        direccion = graphene.String(required=True)
        telefono = graphene.String()

    branch = graphene.Field(DistributorBranchNode)

    #@check_is_superuser
    def mutate(self, info, distributor_id, **kwargs):
        check_is_superuser(info.context.user)
        try:
            _, real_id = relay.Node.from_global_id(distributor_id)
            distributor = Distributor.objects.get(pk=real_id)
        except Distributor.DoesNotExist:
            raise GraphQLError("El distribuidor no existe.")

        branch = DistributorBranch.objects.create(
            distributor=distributor,
            revision_status='approved', # Nace aprobada por ser de admin
            **kwargs
        )
        return CreateDistributorBranchMutation(branch=branch)

class UpdateDistributorBranchMutation(graphene.Mutation):
    """
    (Admin) Edita una sucursal existente de un distribuidor APROBADO.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global de la DistributorBranch (maestra).")
        nombre = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        telefono = graphene.String()
        revision_status = graphene.String() # 'approved' o 'rejected'
        
    branch = graphene.Field(DistributorBranchNode)
    
    #@check_is_superuser
    def mutate(self, info, id, **kwargs):
        check_is_superuser(info.context.user)
        try:
            _, real_id = relay.Node.from_global_id(id)
            branch = DistributorBranch.objects.get(pk=real_id)
        except DistributorBranch.DoesNotExist:
            raise GraphQLError("La sucursal no existe.")

        for key, value in kwargs.items():
            if value is not None:
                setattr(branch, key, value)
        
        branch.save()
        return UpdateDistributorBranchMutation(branch=branch)

class DeleteDistributorBranchMutation(graphene.Mutation):
    """
    (Admin) Elimina (soft delete) una sucursal de un distribuidor APROBADO.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global de la DistributorBranch (maestra).")
    
    success = graphene.Boolean()
    
    #@check_is_superuser
    def mutate(self, info, id):
        check_is_superuser(info.context.user)
        _, real_id = relay.Node.from_global_id(id)
        try:
            branch = DistributorBranch.objects.get(pk=real_id)
            branch.delete() # Soft delete
            return DeleteDistributorBranchMutation(success=True)
        except DistributorBranch.DoesNotExist:
            raise GraphQLError("La sucursal no existe.")


# --- 3. Mutaciones de Documentos ---

class CreateDistributorDocumentMutation(graphene.Mutation):
    """
    (Admin) Añade un NUEVO documento a un distribuidor APROBADO.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True, description="ID Global del Distribuidor (maestro).")
        document_type = graphene.String(required=True, description="Ej: 'DPI_FRONT', 'RTU', etc.")
        file = Upload(required=True)
    
    document = graphene.Field(DistributorDocumentNode)

    #@check_is_superuser
    def mutate(self, info, distributor_id, document_type, file, **kwargs):
        check_is_superuser(info.context.user)
        try:
            _, real_id = relay.Node.from_global_id(distributor_id)
            distributor = Distributor.objects.get(pk=real_id)
        except Distributor.DoesNotExist:
            raise GraphQLError("El distribuidor no existe.")
        
        doc = DistributorDocument.objects.create(
            distributor=distributor,
            document_type=document_type,
            file=file,
            revision_status='approved', # Nace aprobado
            ocr_status='COMPLETED' # Asumimos que no requiere OCR post-aprobación
        )
        return CreateDistributorDocumentMutation(document=doc)

class DeleteDistributorDocumentMutation(graphene.Mutation):
    """
    (Admin) Elimina (soft delete) un documento de un distribuidor APROBADO.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global del DistributorDocument (maestro).")
    
    success = graphene.Boolean()
    
    #@check_is_superuser
    def mutate(self, info, id):
        check_is_superuser(info.context.user)
        _, real_id = relay.Node.from_global_id(id)
        try:
            doc = DistributorDocument.objects.get(pk=real_id)
            # Opcional: Eliminar archivo de S3/disco
            # doc.file.delete(save=False) 
            doc.delete() # Soft delete
            return DeleteDistributorDocumentMutation(success=True)
        except DistributorDocument.DoesNotExist:
            raise GraphQLError("El documento no existe.")


# --- 4. Mutaciones de Referencias ---

class CreateDistributorReferenceMutation(graphene.Mutation):
    """
    (Admin) Añade una NUEVA referencia a un distribuidor APROBADO.
    """
    class Arguments:
        distributor_id = graphene.ID(required=True, description="ID Global del Distribuidor (maestro).")
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

    reference = graphene.Field(DistributorReferenceNode)

    #@check_is_superuser
    def mutate(self, info, distributor_id, **kwargs):
        check_is_superuser(info.context.user)
        try:
            _, real_id = relay.Node.from_global_id(distributor_id)
            distributor = Distributor.objects.get(pk=real_id)
        except Distributor.DoesNotExist:
            raise GraphQLError("El distribuidor no existe.")

        ref = DistributorReference.objects.create(
            distributor=distributor,
            revision_status='verified', # Nace verificada
            **kwargs
        )
        return CreateDistributorReferenceMutation(reference=ref)

class DeleteDistributorReferenceMutation(graphene.Mutation):
    """
    (Admin) Elimina (soft delete) una referencia de un distribuidor APROBADO.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global de la DistributorReference (maestra).")
    
    success = graphene.Boolean()
    
    #@check_is_superuser
    def mutate(self, info, id):
        check_is_superuser(info.context.user)
        _, real_id = relay.Node.from_global_id(id)
        try:
            ref = DistributorReference.objects.get(pk=real_id)
            ref.delete() # Soft delete
            return DeleteDistributorReferenceMutation(success=True)
        except DistributorReference.DoesNotExist:
            raise GraphQLError("La referencia no existe.")


# --- 5. Agrupador de Mutaciones ---

class DistributorMutations(graphene.ObjectType):
    """
    Agrupa mutaciones para la gestión (CRUD) de datos maestros 
    de Distribuidores ya aprobados.
    """
    # CRUD del Distribuidor principal
    update_distributor = UpdateDistributorMutation.Field()
    
    # CRUD de Sucursales maestras
    create_distributor_branch = CreateDistributorBranchMutation.Field()
    update_distributor_branch = UpdateDistributorBranchMutation.Field()
    delete_distributor_branch = DeleteDistributorBranchMutation.Field()

    # CRUD de Documentos maestros
    create_distributor_document = CreateDistributorDocumentMutation.Field()
    delete_distributor_document = DeleteDistributorDocumentMutation.Field()
    # Nota: UpdateDistributorDocument se omite; el flujo normal es borrar y subir uno nuevo.
    
    # CRUD de Referencias maestras
    create_distributor_reference = CreateDistributorReferenceMutation.Field()
    delete_distributor_reference = DeleteDistributorReferenceMutation.Field()
    # Nota: UpdateDistributorReference se omite; el flujo normal es borrar y crear una nueva.