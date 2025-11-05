import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError

from ..permissions import check_permission
from ..permissions import check_is_superuser
from api.models import Client
from ..schema.clients import ClientNode as ClientType

class CreateClientMutation(graphene.Mutation):
    """Crea un nuevo cliente."""
    class Arguments:
        nombres = graphene.String(required=True)
        apellidos = graphene.String()
        fecha_nacimiento = graphene.Date()
        direccion = graphene.String()
        dpi = graphene.String(required=True)
        nit = graphene.String()
        email = graphene.String(required=True)
        telefono = graphene.String(required=True)

    client = graphene.Field(ClientType)

    def mutate(self, info, nombres, dpi, email, telefono, apellidos=None, fecha_nacimiento=None, direccion=None, nit=None):
        check_permission(info.context.user, 'can_create_clients')

        # Validar nit (NIT) único solo si se proporciona
        if nit and nit.strip():
            nit = nit.strip()
            existing_client = Client.objects.filter(
                nit__iexact=nit,
                is_deleted=False
            ).exclude(nit__isnull=True).exclude(nit='').exists()
            
            if existing_client:
                raise GraphQLError(f'Ya existe un cliente con el NIT "{nit}".')

        # Si nit es cadena vacía, convertir a None
        if nit is not None and nit.strip() == '':
            nit = None

        # Validar DPI único
        if dpi and dpi.strip():
            dpi = dpi.strip()
            existing_client = Client.objects.filter(
                dpi__iexact=dpi,
                is_deleted=False
            ).exists()
            
            if existing_client:
                raise GraphQLError(f'Ya existe un cliente con el DPI "{dpi}".')
        else:
            raise GraphQLError("El campo DPI es obligatorio y no puede estar vacío.")

        # Validar email único
        if email and email.strip():
            email = email.strip()
            existing_client = Client.objects.filter(
                email=email, 
                is_deleted=False
            ).exists()
            if existing_client:
                raise GraphQLError(f'Ya existe un cliente con el email "{email}".')
        else:
            raise GraphQLError("El campo email es obligatorio y no puede estar vacío.")
        
        try:
            client = Client(
                    nombres=nombres,
                    apellidos=apellidos,
                    fecha_nacimiento=fecha_nacimiento,
                    direccion=direccion or "",
                    dpi=dpi,
                    nit=nit,
                    email=email,
                    telefono=telefono,
                )
            client.save()
            return CreateClientMutation(client=client)
        except IntegrityError as e:
            raise GraphQLError(f"Hubo un problema al crear el cliente: {str(e)}")


class UpdateClientMutation(graphene.Mutation):
    """Actualiza un cliente existente."""
    class Arguments:
        id = graphene.ID(required=True)
        nombres = graphene.String()
        apellidos = graphene.String()
        fecha_nacimiento = graphene.Date()
        direccion = graphene.String()
        dpi = graphene.String()
        nit = graphene.String()
        email = graphene.String()
        telefono = graphene.String()
        is_active = graphene.Boolean()

    client = graphene.Field(ClientType)

    def mutate(self, info, id, **kwargs):
        check_permission(info.context.user, 'can_update_clients')
        try:
            real_id = from_global_id(id)[1]
            client = Client.objects.get(pk=real_id, is_deleted=False)

            # Validar nit único solo si se proporciona y cambió
            nit = kwargs.get('nit')
            if nit is not None:
                if nit.strip():
                    nit = nit.strip()
                    existing_client = Client.objects.filter(
                        nit__iexact=nit,
                        is_deleted=False
                    ).exclude(nit__isnull=True).exclude(nit='').exclude(pk=real_id).exists()

                    if existing_client:
                        raise GraphQLError(f'Ya existe otro cliente con el NIT "{nit}".')
                    kwargs['nit'] = nit
                else:
                    kwargs['nit'] = None

            # Validar dpi único si cambió
            dpi = kwargs.get('dpi')
    
            if dpi and dpi.strip():
                dpi = dpi.strip()
                existing_client = Client.objects.filter(
                    dpi__iexact=dpi,
                    is_deleted=False
                ).exclude(pk=real_id).exists()

                if existing_client:
                    raise GraphQLError(f'Ya existe otro cliente con el DPI "{dpi}".')
           

            # Validar email único si cambió
            email = kwargs.get('email')
            if email and email.strip():
                existing_client = Client.objects.filter(
                    email__iexact=email.strip(),
                    is_deleted=False
                ).exclude(pk=real_id).exists()

                if existing_client:
                    raise GraphQLError(f'Ya existe otro cliente con el email "{email}".')

            

            # Actualizar campos, permitiendo None para campos específicos
            for field, value in kwargs.items():
                if hasattr(client, field):
                    # Permitir None para campos que pueden ser NULL
                    if field in ['nit', 'apellidos', 'direccion', 'fecha_nacimiento'] or value is not None:
                        setattr(client, field, value)

            client.save()
            return UpdateClientMutation(client=client)
        except Client.DoesNotExist:
            raise GraphQLError("El cliente no existe o ha sido eliminado.")
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar cliente: {str(e)}")


class DeleteClientMutation(graphene.Mutation):
    """Soft delete un cliente existente."""
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        check_permission(info.context.user, 'can_delete_clients')
        try:
            real_id = from_global_id(id)[1]
            client = Client.objects.get(pk=real_id)
            client.delete()
            return DeleteClientMutation(success=True)
        except Client.DoesNotExist:
            raise GraphQLError("El cliente no existe o ha sido eliminado.")

class HardDeleteClientMutation(graphene.Mutation):
    """Borrado físico de un cliente."""
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        #solo superusuario puede hacer hard delete
        check_is_superuser(info.context.user)
        try:
            real_id = from_global_id(id)[1]
            client = Client.objects.get(pk=real_id)
            client.hard_delete()
            return HardDeleteClientMutation(success=True)
        except Client.DoesNotExist:
            raise GraphQLError("El cliente no existe o ha sido eliminado.")


class ClientMutations(graphene.ObjectType):
    create_client = CreateClientMutation.Field()
    update_client = UpdateClientMutation.Field()
    delete_client = DeleteClientMutation.Field()
    hard_delete_client = HardDeleteClientMutation.Field()
