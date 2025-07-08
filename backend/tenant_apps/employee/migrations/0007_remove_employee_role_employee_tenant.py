from django.db import migrations, models
import django.db.models.deletion


def assign_tenant_to_existing_employees(apps, schema_editor):
    Employee = apps.get_model('employee', 'Employee')
    Client = apps.get_model('tenants', 'Client')

    # Choose the first client for now or filter appropriately
    default_client = Client.objects.first()
    if not default_client:
        raise Exception("No clients exist. Cannot assign tenant to employees.")

    for emp in Employee.objects.filter(tenant__isnull=True):
        emp.tenant = default_client
        emp.save()


class Migration(migrations.Migration):

    dependencies = [
        ('employee', '0006_remove_projectmanagerassignment_unique_pm_developer_assignment_and_more'),
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='tenant',
            field=models.ForeignKey(
                to='tenants.client',
                null=True,  # allow null first to avoid migration failure
                on_delete=django.db.models.deletion.CASCADE,
                related_name='employees',
            ),
        ),
        migrations.RunPython(assign_tenant_to_existing_employees),
        migrations.AlterField(
            model_name='employee',
            name='tenant',
            field=models.ForeignKey(
                to='tenants.client',
                null=False,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='employees',
            ),
        ),
    ]
