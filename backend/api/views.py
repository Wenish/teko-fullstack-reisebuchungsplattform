from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, Cancellation, Offer
from .serializers import (
    BookingCreateSerializer,
    BookingSerializer,
    CurrentUserSerializer,
    OfferSerializer,
    RegisterSerializer,
)
from .services import calculate_refund


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
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)

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
