import re
from django.conf import settings

def is_valid_subdomain(name: str) -> (bool, str):
    """
    Validate a subdomain string for syntax, length, and reserved words.
    Returns (True, None) if valid, otherwise (False, reason).
    """
    if not name:
        return False, "Subdomain is required."

    # Must be lowercase letters, numbers, hyphens only
    if not re.match(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$", name):
        return False, "Invalid subdomain format."

    if name in settings.RESERVED_SUBDOMAINS:
        return False, f"'{name}' is a reserved subdomain."

    return True, None