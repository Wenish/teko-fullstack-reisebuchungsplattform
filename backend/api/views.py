from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

from .models import Booking, Cancellation, Offer
from .serializers import (
    BookingCreateSerializer,
    BookingSerializer,
    CurrentUserSerializer,
    OfferSerializer,
    RegisterSerializer,
)
from .services import calculate_refund


def parse_decimal_param(value):
    if value in (None, ""):
        return None
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError, ValueError):
        return None


def set_auth_cookies(response, access_token, refresh_token=None):
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        access_token,
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path="/",
    )
    if refresh_token is not None:
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE_NAME,
            refresh_token,
            httponly=settings.JWT_COOKIE_HTTPONLY,
            secure=settings.JWT_COOKIE_SECURE,
            samesite=settings.JWT_COOKIE_SAMESITE,
            path="/",
        )


def clear_auth_cookies(response):
    response.delete_cookie(settings.JWT_ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME, path="/")
    return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        get_token(request)
        return Response({"detail": "CSRF cookie gesetzt."})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(CurrentUserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response = Response(CurrentUserSerializer(serializer.user).data)
        set_auth_cookies(
            response,
            serializer.validated_data["access"],
            serializer.validated_data["refresh"],
        )
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response({"detail": "Refresh-Token fehlt."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        response = Response({"detail": "Token erneuert."})
        set_auth_cookies(
            response,
            serializer.validated_data["access"],
            serializer.validated_data.get("refresh", refresh_token),
        )
        return response


class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Ausgeloggt."})
        return clear_auth_cookies(response)


class OfferViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Offer.objects.select_related("provider").all().order_by("id")
    serializer_class = OfferSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        offer_type = self.request.query_params.get("type")
        location = self.request.query_params.get("location")
        min_rating = self.request.query_params.get("min_rating")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")

        if offer_type:
            queryset = queryset.filter(offer_type=offer_type)
        if location:
            queryset = queryset.filter(location__icontains=location)
        parsed_min_rating = parse_decimal_param(min_rating)
        parsed_min_price = parse_decimal_param(min_price)
        parsed_max_price = parse_decimal_param(max_price)

        if min_rating and parsed_min_rating is None:
            return queryset.none()
        if min_price and parsed_min_price is None:
            return queryset.none()
        if max_price and parsed_max_price is None:
            return queryset.none()

        if parsed_min_rating is not None:
            queryset = queryset.filter(rating__gte=parsed_min_rating)
        if parsed_min_price is not None:
            queryset = queryset.filter(base_price__gte=parsed_min_price)
        if parsed_max_price is not None:
            queryset = queryset.filter(base_price__lte=parsed_max_price)

        return queryset


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("offer", "offer__provider").all().order_by("-created_at")
    serializer_class = BookingSerializer
    http_method_names = ["get", "post", "patch"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        booking = self.get_object()
        if booking.status == Booking.Status.CANCELED:
            return Response(
                {"detail": "Stornierte Buchungen koennen nicht bezahlt werden."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if booking.payment_status == Booking.PaymentStatus.PAID:
            return Response(
                {"detail": "Buchung ist bereits bezahlt."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.payment_status = Booking.PaymentStatus.PAID
        booking.save(update_fields=["payment_status"])
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status == Booking.Status.CANCELED:
            return Response(
                {"detail": "Buchung ist bereits storniert."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund_amount = calculate_refund(booking.total_price)
        booking.status = Booking.Status.CANCELED
        if booking.payment_status == Booking.PaymentStatus.PAID:
            booking.payment_status = Booking.PaymentStatus.REFUNDED
        booking.save(update_fields=["status", "payment_status"])

        booking.offer.available_units += booking.quantity
        booking.offer.save(update_fields=["available_units"])

        cancellation = Cancellation.objects.create(
            booking=booking,
            reason=request.data.get("reason", ""),
            refund_amount=refund_amount,
        )

        return Response(
            {
                "booking": BookingSerializer(booking).data,
                "cancellation": {
                    "reason": cancellation.reason,
                    "refund_amount": cancellation.refund_amount,
                    "canceled_at": cancellation.canceled_at,
                },
            }
        )
