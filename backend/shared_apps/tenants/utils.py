import re
from django.conf import settings

def is_valid_subdomain(name: str) -> (bool, str):
    """
    Validate a subdomain string for syntax, length, and reserved words.
    Returns (True, None) if valid, otherwise (False, reason).
    """
    if not name:
        return False, "Subdomain is required."

    name = name.split(".")[0]

    # Must be lowercase letters, numbers, hyphens only
    if not re.match(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$", name):
        return False, "Invalid subdomain format."

    if name in settings.RESERVED_SUBDOMAINS:
        return False, f"'{name}' is a reserved subdomain."

    return True, None


def validate_tenant_name_format(name: str) -> (bool, str):
    """
    Match frontend rules:
    - Required
    - Length 3..63
    - Letters, numbers, spaces allowed (and hyphens optional, but not leading/trailing)
    """
    if not name:
        return False, "Tenant name is required."

    name = name.strip()
    if len(name) < 3:
        return False, "At least 3 characters required."
    if len(name) > 63:
        return False, "Cannot exceed 63 characters."

    # Allow letters, numbers, spaces, and hyphens
    import re
    if not re.match(r'^[A-Za-z0-9 \-]+$', name):
        return False, "Only letters, numbers, spaces and hyphens allowed."

    if name.startswith('-') or name.endswith('-'):
        return False, "Tenant name cannot start or end with a hyphen."

    return True, None