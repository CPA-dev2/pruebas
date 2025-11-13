import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction

from ..permissions import check_permission
from api.models import Distributor, Document, Location
from ..schema.distributor import LocationType
from api.utils.rtu_extractor import extract_rtu


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


class LocationMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones relacionadas con locations/sucursales."""
    add_location_to_distributor = AddLocationToDistributor.Field()
    update_location_from_distributor = UpdateLocationFromDistributor.Field()
    delete_location_from_distributor = DeleteLocationFromDistributor.Field()
