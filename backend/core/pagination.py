from rest_framework.pagination import LimitOffsetPagination

class StandardLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 100


class StandardAuditPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50