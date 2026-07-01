from decimal import Decimal

from django.core.management.base import BaseCommand

from api.models import Offer, Provider


class Command(BaseCommand):
    help = "Legt einfache Beispieldaten fuer Angebote an."

    def handle(self, *args, **options):
        if Offer.objects.exists():
            self.stdout.write(self.style.WARNING("Seed uebersprungen: Angebote existieren bereits."))
            return

        sky = Provider.objects.create(name="SkyWays")
        stay = Provider.objects.create(name="StayEasy")
        drive = Provider.objects.create(name="DriveNow")

        Offer.objects.create(
            provider=sky,
            title="Zuerich nach Barcelona",
            offer_type=Offer.OfferType.FLIGHT,
            location="Barcelona",
            rating=Decimal("4.4"),
            base_price=Decimal("220.00"),
            season_factor=Decimal("1.15"),
            demand_factor=Decimal("1.05"),
            availability_factor=Decimal("1.00"),
            available_units=25,
        )

        Offer.objects.create(
            provider=stay,
            title="City Hotel Berlin (2 Naechte)",
            offer_type=Offer.OfferType.HOTEL,
            location="Berlin",
            rating=Decimal("4.1"),
            base_price=Decimal("180.00"),
            season_factor=Decimal("1.00"),
            demand_factor=Decimal("1.10"),
            availability_factor=Decimal("1.00"),
            available_units=15,
        )

        Offer.objects.create(
            provider=drive,
            title="Mietwagen Compact in Rom",
            offer_type=Offer.OfferType.CAR,
            location="Rom",
            rating=Decimal("4.0"),
            base_price=Decimal("95.00"),
            season_factor=Decimal("1.05"),
            demand_factor=Decimal("1.00"),
            availability_factor=Decimal("1.00"),
            available_units=12,
        )

        self.stdout.write(self.style.SUCCESS("Beispieldaten erfolgreich angelegt."))
