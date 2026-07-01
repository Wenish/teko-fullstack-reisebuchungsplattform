from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, MeView, OfferViewSet, RegisterView

router = DefaultRouter()
router.register("offers", OfferViewSet, basename="offers")
router.register("bookings", BookingViewSet, basename="bookings")

urlpatterns = [
	path("auth/register/", RegisterView.as_view(), name="auth-register"),
	path("auth/me/", MeView.as_view(), name="auth-me"),
]

urlpatterns += router.urls
