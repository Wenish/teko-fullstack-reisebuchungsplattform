from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, CsrfView, LoginView, LogoutView, MeView, OfferViewSet, RefreshView, RegisterView

router = DefaultRouter()
router.register("offers", OfferViewSet, basename="offers")
router.register("bookings", BookingViewSet, basename="bookings")

urlpatterns = [
	path("auth/csrf/", CsrfView.as_view(), name="auth-csrf"),
	path("auth/register/", RegisterView.as_view(), name="auth-register"),
	path("auth/login/", LoginView.as_view(), name="auth-login"),
	path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
	path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
	path("auth/me/", MeView.as_view(), name="auth-me"),
]

urlpatterns += router.urls
