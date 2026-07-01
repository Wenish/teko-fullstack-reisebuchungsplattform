from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Booking, Cancellation, Offer, Provider
from .services import calculate_dynamic_unit_price, calculate_total_price

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = ["id", "name"]


class OfferSerializer(serializers.ModelSerializer):
    provider = ProviderSerializer(read_only=True)
    dynamic_unit_price = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            "id",
            "title",
            "offer_type",
            "location",
            "rating",
            "base_price",
            "dynamic_unit_price",
            "available_units",
            "provider",
        ]

    def get_dynamic_unit_price(self, obj):
        return calculate_dynamic_unit_price(obj)


class BookingSerializer(serializers.ModelSerializer):
    offer = OfferSerializer(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "reference",
            "username",
            "offer",
            "customer_name",
            "customer_email",
            "quantity",
            "total_price",
            "status",
            "payment_status",
            "created_at",
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    offer_id = serializers.PrimaryKeyRelatedField(
        queryset=Offer.objects.all(), source="offer", write_only=True
    )

    class Meta:
        model = Booking
        fields = ["offer_id", "customer_name", "customer_email", "quantity"]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Menge muss mindestens 1 sein.")
        return value

    def validate(self, attrs):
        offer = attrs["offer"]
        quantity = attrs["quantity"]
        if quantity > offer.available_units:
            raise serializers.ValidationError(
                {"quantity": "Nicht genug Verfuegbarkeit fuer diese Menge."}
            )
        return attrs

    def create(self, validated_data):
        offer = validated_data["offer"]
        quantity = validated_data["quantity"]
        total_price = calculate_total_price(offer, quantity)
        offer.available_units -= quantity
        offer.save(update_fields=["available_units"])
        return Booking.objects.create(total_price=total_price, **validated_data)


class CancellationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cancellation
        fields = ["reason", "refund_amount", "canceled_at"]
