import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id

from ..permissions import check_permission

from api.models import Item
from ..schema.items import ItemNode as ItemType

from api.services.auditlog_service import log_action, log_model_update



class CreateItemMutation(graphene.Mutation):
    """
    Mutación para crear un nuevo item en la base de datos.

    Requiere permiso `can_create_items`.
    """
    class Arguments:
        nombre = graphene.String(required=True, description="Nombre del nuevo item.")
        descripcion = graphene.String(description="Descripción opcional del item.")

    item = graphene.Field(ItemType, description="El item recién creado.")

    def mutate(self, info, nombre, descripcion=None):
        """
        Crea y guarda un nuevo item si el usuario tiene los permisos necesarios.
        Devuelve el item creado.
        """
        check_permission(info.context.user, 'can_create_items')
        item = Item(nombre=nombre, descripcion=descripcion)
        item.save()

        # Registrar la acción en el log de auditoría
        log_action(
            usuario=info.context.user,
            accion="Creación de Item",
            descripcion=f"Item '{item.nombre}' creado con ID {item.id}."
        )
        return CreateItemMutation(item=item)


class UpdateItemMutation(graphene.Mutation):
    """
    Mutación para actualizar un item existente.

    Busca el item por su ID global y actualiza los campos proporcionados.
    Requiere permiso `can_update_items`.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del item a actualizar.")
        nombre = graphene.String(description="Nuevo nombre para el item.")
        descripcion = graphene.String(description="Nueva descripción para el item.")
        is_active = graphene.Boolean(description="Nuevo estado de actividad para el item.")

    item = graphene.Field(ItemType, description="El item actualizado.")

    def mutate(self, info, id, nombre=None, descripcion=None, is_active=None):
        """
        Actualiza un item existente si el usuario tiene permisos.
        Lanza un error si el item no se encuentra.
        """
        check_permission(info.context.user, 'can_update_items')
        try:
            real_id = from_global_id(id)[1]
            item = Item.objects.get(pk=real_id, is_deleted=False)

            # Preparar campos a actualizar
            updated_fields = {}
            if nombre is not None:
                updated_fields['nombre'] = nombre
            if descripcion is not None:
                updated_fields['descripcion'] = descripcion
            if is_active is not None:
                updated_fields['is_active'] = is_active
            
            # Labels personalizados para campos para el frontend
            field_labels = {
                'nombre': 'Nombre',
                'descripcion': 'Descripción',
                'is_active': 'Estado'
            }
            
            # Loggear cambios antes de guardar
            log_model_update(
                usuario=info.context.user,
                instance=item,
                updated_fields=updated_fields,
                model_name="Item",
                field_labels=field_labels
            )
            
            # Aplicar cambios al modelo
            # Se reciben los nombres de los campos y sus nuevos valores.
            # Por cada iteración equivale a: item.nombre = 'Item Actualizado'
            for field_name, new_value in updated_fields.items():
                setattr(item, field_name, new_value)
            
            item.save()
            return UpdateItemMutation(item=item)
        except Item.DoesNotExist:
            raise GraphQLError("El item no existe o ha sido eliminado.")


class DeleteItemMutation(graphene.Mutation):
    """
    Mutación para realizar un borrado lógico (soft delete) de un item.

    Marca el item como eliminado (`is_deleted=True`) pero no lo borra de la
    base de datos. Requiere permiso `can_delete_items`.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del item a marcar como eliminado.")

    success = graphene.Boolean(description="Indica si la operación fue exitosa.")

    def mutate(self, info, id):
        """
        Realiza el soft delete del item si el usuario tiene permisos.
        Lanza un error si el item no se encuentra.
        """
        check_permission(info.context.user, 'can_delete_items')
        try:
            real_id = from_global_id(id)[1]
            item = Item.objects.get(pk=real_id)
            item.delete()  # Llama al método soft delete del manager
            # Registrar la acción en el log de auditoría
            log_action(
                usuario=info.context.user,
                accion="Borrado Lógico de Item",
                descripcion=f"Item '{item.nombre}' (ID {item.id}) marcado como eliminado."
            )
            return DeleteItemMutation(success=True)
        except Item.DoesNotExist:
            raise GraphQLError("El item no existe o ha sido eliminado.")


class HardDeleteItemMutation(graphene.Mutation):
    """
    Mutación para realizar un borrado físico (hard delete) de un item.

    Elimina permanentemente el item de la base de datos.
    Requiere permiso `can_delete_items`.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del item a eliminar permanentemente.")

    success = graphene.Boolean(description="Indica si la operación fue exitosa.")

    def mutate(self, info, id):
        """
        Realiza el hard delete del item si el usuario tiene permisos.
        Lanza un error si el item no se encuentra.
        """
        check_permission(info.context.user, 'can_delete_items')
        try:
            real_id = from_global_id(id)[1]
            item = Item.objects.get(pk=real_id)
            item.hard_delete()  # Llama al método de borrado físico
            # Registrar la acción en el log de auditoría
            log_action(
                usuario=info.context.user,
                accion="Borrado Físico de Item",
                descripcion=f"Item '{item.nombre}' (ID {item.id}) eliminado permanentemente."
            )
            return HardDeleteItemMutation(success=True)
        except Item.DoesNotExist:
            raise GraphQLError("El item no existe o ha sido eliminado.")


class ItemMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones relacionadas con el modelo `Item`."""
    create_item = CreateItemMutation.Field(description="Crea un nuevo item.")
    update_item = UpdateItemMutation.Field(description="Actualiza un item existente.")
    delete_item = DeleteItemMutation.Field(description="Marca un item como eliminado (soft delete).")
    hard_delete_item = HardDeleteItemMutation.Field(description="Elimina un item permanentemente (hard delete).")
