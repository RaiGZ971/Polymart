"""
Validation functions for Supabase client operations.
Contains validation logic for categories, statuses, prices, and other constraints.
"""

from typing import Optional
from fastapi import HTTPException

VALID_CATEGORIES = {
    "Academic_Essentials",
    "Tech_Gadgets", 
    "Creative_Works",
    "Fashion",
    "Services",
    "Other"
}

VALID_STATUSES = {"active", "inactive", "sold_out", "archived"}

VALID_ORDER_STATUSES = {"pending", "confirmed", "completed", "cancelled"}

VALID_TRANSACTION_METHODS = {"meet_up", "online"}

VALID_PAYMENT_METHODS = {"cash", "gcash", "maya", "bank_transfer", "remittance"}


def validate_category(category: Optional[str]) -> None:
    """Validate product category against allowed values."""
    if category and category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid category. Valid categories are: {', '.join(VALID_CATEGORIES)}"
        )


def validate_status(status: Optional[str]) -> None:
    """Validate listing status against allowed values."""
    if status and status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Valid statuses are: {', '.join(VALID_STATUSES)}"
        )


def validate_order_transaction_method(transaction_method: str) -> None:
    """Validate order transaction method against allowed values."""
    if transaction_method not in VALID_TRANSACTION_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transaction method. Valid methods are: {', '.join(VALID_TRANSACTION_METHODS)}"
        )


def validate_order_payment_method(payment_method: str) -> None:
    """Validate order payment method against allowed values."""
    if payment_method not in VALID_PAYMENT_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment method. Valid methods are: {', '.join(VALID_PAYMENT_METHODS)}"
        )


def validate_order_status(status: Optional[str]) -> None:
    """Validate order status against allowed values."""
    if status and status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order status. Valid statuses are: {', '.join(VALID_ORDER_STATUSES)}"
        )


def validate_price_range(price_min: Optional[float], price_max: Optional[float]) -> None:
    """Validate price range constraints."""
    if price_min is None and price_max is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot set maximum price without minimum price. Use price_min for single price items."
        )
    
    if (price_min is not None and 
        price_max is not None and 
        price_max < price_min):
        raise HTTPException(
            status_code=400,
            detail="Maximum price must be greater than or equal to minimum price"
        )
