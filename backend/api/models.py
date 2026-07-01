from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.db import models


class Provider(models.Model):
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name


class Offer(models.Model):
    class OfferType(models.TextChoices):
        FLIGHT = "flight", "Flug"
        HOTEL = "hotel", "Hotel"
        CAR = "car", "Mietwagen"

    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name="offers")
    title = models.CharField(max_length=180)
    offer_type = models.CharField(max_length=20, choices=OfferType.choices)
    location = models.CharField(max_length=120)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=Decimal("4.0"))
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    season_factor = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    demand_factor = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    availability_factor = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    available_units = models.PositiveIntegerField(default=10)

    def __str__(self):
        return f"{self.title} ({self.location})"


class Booking(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Aktiv"
        CANCELED = "canceled", "Storniert"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unbezahlt"
        PAID = "paid", "Bezahlt"
        REFUNDED = "refunded", "Rueckerstattet"

    reference = models.CharField(max_length=12, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
        null=True,
        blank=True,
    )
    offer = models.ForeignKey(Offer, on_delete=models.PROTECT, related_name="bookings")
    customer_name = models.CharField(max_length=120)
    customer_email = models.EmailField()
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = str(uuid4()).split("-")[0].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.customer_name}"


class Cancellation(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="cancellation")
    reason = models.CharField(max_length=200, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    canceled_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Storno {self.booking.reference}"
