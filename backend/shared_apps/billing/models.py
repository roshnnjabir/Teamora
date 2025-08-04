# in public app models.py

from django.db import models

class PaymentAudit(models.Model):
    tenant_id = models.IntegerField()
    tenant_name = models.CharField(max_length=255)
    stripe_session_id = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='usd')
    paid_until = models.DateField()
    payment_status = models.CharField(max_length=50)  # e.g. 'paid', 'failed'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']