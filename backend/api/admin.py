from django.contrib import admin

from .models import Booking, Cancellation, Offer, Provider

admin.site.register(Provider)
admin.site.register(Offer)
admin.site.register(Booking)
admin.site.register(Cancellation)
