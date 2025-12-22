from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    """
    Manager personalizado para el modelo Usuario donde el username es el
    identificador único.
    """
    def create_user(self, username, email, password=None, **extra_fields):
        """
        Crea y guarda un Usuario con el username, email y contraseña dados.
        """
        if not username:
            raise ValueError('El campo Username es obligatorio')
        if not email:
            raise ValueError('El campo Email es obligatorio')

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        """
        Crea y guarda un superusuario con el username, email y contraseña dados.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)
