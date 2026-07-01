import base64
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Booking, Offer, Provider
from .services import calculate_dynamic_unit_price, calculate_refund

User = get_user_model()


class PriceServiceTests(TestCase):
    def test_dynamic_price_and_refund(self):
        provider = Provider.objects.create(name="Test Anbieter")
        offer = Offer.objects.create(
            provider=provider,
            title="Testflug",
            offer_type=Offer.OfferType.FLIGHT,
            location="Zuerich",
            rating=Decimal("4.5"),
            base_price=Decimal("100.00"),
            season_factor=Decimal("1.20"),
            demand_factor=Decimal("1.10"),
            availability_factor=Decimal("1.00"),
            available_units=20,
        )

        self.assertEqual(calculate_dynamic_unit_price(offer), Decimal("132.00"))
        self.assertEqual(calculate_refund(Decimal("132.00")), Decimal("105.60"))


class BookingApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="max",
            email="max@example.com",
            password="geheim123",
        )
        provider = Provider.objects.create(name="Air Demo")
        self.offer = Offer.objects.create(
            provider=provider,
            title="Bern - Paris",
            offer_type=Offer.OfferType.FLIGHT,
            location="Paris",
            rating=Decimal("4.2"),
            base_price=Decimal("200.00"),
            season_factor=Decimal("1.00"),
            demand_factor=Decimal("1.00"),
            availability_factor=Decimal("1.00"),
            available_units=5,
        )

    def _auth_headers(self):
        token = base64.b64encode(b"max:geheim123").decode("utf-8")
        return {"HTTP_AUTHORIZATION": f"Basic {token}"}

    def test_booking_requires_authentication(self):
        response = self.client.post(
            "/api/bookings/",
            {
                "offer_id": self.offer.id,
                "customer_name": "Max Muster",
                "customer_email": "max@example.com",
                "quantity": 1,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_booking_create_then_cancel(self):
        response = self.client.post(
            "/api/bookings/",
            {
                "offer_id": self.offer.id,
                "customer_name": "Max Muster",
                "customer_email": "max@example.com",
                "quantity": 2,
            },
            content_type="application/json",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 201)

        booking = Booking.objects.get()
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.total_price, Decimal("400.00"))

        cancel = self.client.post(
            f"/api/bookings/{booking.id}/cancel/",
            {},
            content_type="application/json",
            **self._auth_headers(),
        )
        self.assertEqual(cancel.status_code, 200)

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CANCELED)

    def test_register_and_me(self):
        register = self.client.post(
            "/api/auth/register/",
            {"username": "anna", "email": "anna@example.com", "password": "pass1234"},
            content_type="application/json",
        )
        self.assertEqual(register.status_code, 201)

        token = base64.b64encode(b"anna:pass1234").decode("utf-8")
        me = self.client.get("/api/auth/me/", **{"HTTP_AUTHORIZATION": f"Basic {token}"})
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "anna")
