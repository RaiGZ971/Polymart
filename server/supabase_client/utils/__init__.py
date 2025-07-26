"""
Utility modules for Supabase client operations.
Organized utility functions for validation, database operations, and data processing.
"""

# Import all utility functions for easy access
from .validators import (
    VALID_CATEGORIES, VALID_STATUSES, VALID_ORDER_STATUSES, 
    VALID_TRANSACTION_METHODS, VALID_PAYMENT_METHODS,
    validate_category, validate_status, validate_order_transaction_method,
    validate_order_payment_method, validate_order_status, validate_price_range
)

from .helpers import (
    get_supabase_client, calculate_pagination_offset, apply_pagination,
    get_total_count, handle_database_errors
)

from .converters import (
    get_images_for_listing, convert_listing_to_product, convert_listings_to_products,
    convert_order_to_response, convert_orders_to_response
)

__all__ = [
    # Validators
    'VALID_CATEGORIES', 'VALID_STATUSES', 'VALID_ORDER_STATUSES', 
    'VALID_TRANSACTION_METHODS', 'VALID_PAYMENT_METHODS',
    'validate_category', 'validate_status', 'validate_order_transaction_method',
    'validate_order_payment_method', 'validate_order_status', 'validate_price_range',
    
    # Database helpers
    'get_supabase_client', 'calculate_pagination_offset', 'apply_pagination',
    'get_total_count', 'handle_database_errors',
    
    # Converters
    'get_images_for_listing', 'convert_listing_to_product', 'convert_listings_to_products',
    'convert_order_to_response', 'convert_orders_to_response'
]
