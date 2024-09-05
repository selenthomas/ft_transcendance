from django.contrib.auth import get_user_model
from rest_framework.settings import api_settings
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.core.validators import MinLengthValidator
from users.models import User, Invitation
from websockets.models import Message
from django.core.exceptions import ObjectDoesNotExist
User = get_user_model() # Get reference to the model


from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import Invitation

User = get_user_model()
class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Print the new access token for demonstration purposes
        return data

class InvitationSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    receiver = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Invitation
        fields = ['id', 'sender', 'receiver', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    invitations_sent = serializers.SerializerMethodField()
    received_invitations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'avatar', 'username', 'password', 'first_name', 'last_name', 'biography', "status",
            "invitations_sent", "received_invitations", "follows", "followed_by", "blocks", "blocked_by", 'otp'
        )
        extra_kwargs = {
            'avatar': {'required': False},
            'password': {'write_only': True},
            'follows': {'required': False},
            'followed_by': {'required': False},
            'blocks': {'required': False},
            'blocked_by': {'required': False},
            'status': {'required': False},
            'email': {
                'validators': [UniqueValidator(queryset=User.objects.all())]
            },
            'otp': {'required': False},
            'otp_expiry_time': {'required': False},
            'id': {'read_only': True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

    def get_invitations_sent(self, obj):
        return [invitation.receiver.id for invitation in obj.sent_invitations.all()]

    def get_received_invitations(self, obj):
        return [invitation.sender.id for invitation in obj.received_invitations.all()]

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)
        data['user'] = UserSerializer(self.user).data

        return data

class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('avatar', 'username', 'first_name', 'last_name', 'biography', 'email')
        extra_kwargs = {
            'avatar': {'required': False},
        }

    def validate(self, attrs):
        username = attrs.get('username', None)
        email = attrs.get('email', None)
        
        if username and User.objects.exclude(pk=self.instance.pk).filter(username=username).exists():
            raise serializers.ValidationError({"username": "Ce nom d'utilisateur est déjà utilisé."})
        
        if email and User.objects.exclude(pk=self.instance.pk).filter(email=email).exists():
            raise serializers.ValidationError({"email": "Cet email est déjà utilisé."})
        
        return attrs

    def update(self, instance, validated_data):

        instance.avatar = validated_data.get('avatar', instance.avatar)
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.biography = validated_data.get('biography', instance.biography)
        instance.save()
        instance = super().update(instance, validated_data)

        return instance


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'message', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']
