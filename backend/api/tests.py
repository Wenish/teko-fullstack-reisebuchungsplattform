from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

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
        self.client = Client(enforce_csrf_checks=True)
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

    def _csrf_headers(self):
        self.client.get("/api/auth/csrf/")
        return {"HTTP_X_CSRFTOKEN": self.client.cookies["csrftoken"].value}

    def _login(self, username="max", password="geheim123"):
        response = self.client.post(
            "/api/auth/login/",
            {"username": username, "password": password},
            content_type="application/json",
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        return response

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
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, 401)

    def test_login_sets_cookie_tokens_and_me_uses_cookie_auth(self):
        self._login()

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "max")

    def test_logout_clears_cookie_tokens(self):
        self._login()

        logout = self.client.post("/api/auth/logout/", {}, content_type="application/json", **self._csrf_headers())
        self.assertEqual(logout.status_code, 200)

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 401)

    def test_booking_create_then_cancel(self):
        self._login()

        response = self.client.post(
            "/api/bookings/",
            {
                "offer_id": self.offer.id,
                "customer_name": "Max Muster",
                "customer_email": "max@example.com",
                "quantity": 2,
            },
            content_type="application/json",
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, 201)

        booking = Booking.objects.get()
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.total_price, Decimal("400.00"))

        cancel = self.client.post(
            f"/api/bookings/{booking.id}/cancel/",
            {},
            content_type="application/json",
            **self._csrf_headers(),
        )
        self.assertEqual(cancel.status_code, 200)

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CANCELED)

    def test_register_and_me(self):
        register_headers = self._csrf_headers()
        register = self.client.post(
            "/api/auth/register/",
            {"username": "anna", "email": "anna@example.com", "password": "pass1234"},
            content_type="application/json",
            **register_headers,
        )
        self.assertEqual(register.status_code, 201)

        login = self.client.post(
            "/api/auth/login/",
            {"username": "anna", "password": "pass1234"},
            content_type="application/json",
            **self._csrf_headers(),
        )
        self.assertEqual(login.status_code, 200)

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "anna")

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_bookings_list_returns_only_authenticated_users_bookings(self):
        self._login()

        other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="secret123",
        )

        Booking.objects.create(
            user=self.user,
            offer=self.offer,
            customer_name="Max Muster",
            customer_email="max@example.com",
            quantity=1,
            total_price=Decimal("200.00"),
        )
        Booking.objects.create(
            user=other_user,
            offer=self.offer,
            customer_name="Other User",
            customer_email="other@example.com",
            quantity=1,
            total_price=Decimal("200.00"),
        )

        response = self.client.get("/api/bookings/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["username"], "max")
