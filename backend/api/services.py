from decimal import Decimal, ROUND_HALF_UP


def to_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_dynamic_unit_price(offer) -> Decimal:
    dynamic_price = (
        offer.base_price
        * offer.season_factor
        * offer.demand_factor
        * offer.availability_factor
    )
    return to_money(dynamic_price)


def calculate_total_price(offer, quantity: int) -> Decimal:
    return to_money(calculate_dynamic_unit_price(offer) * quantity)


def calculate_refund(total_price: Decimal) -> Decimal:
    # Minimalregel fuer Schulprojekt: 80% pauschale Rueckerstattung.
    return to_money(total_price * Decimal("0.80"))
