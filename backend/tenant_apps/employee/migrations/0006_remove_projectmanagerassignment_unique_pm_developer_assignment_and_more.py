# Generated by Django 5.2.1 on 2025-06-25 08:13

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employee', '0005_alter_projectmanagerassignment_developer'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='projectmanagerassignment',
            name='unique_pm_developer_assignment',
        ),
        migrations.AlterField(
            model_name='projectmanagerassignment',
            name='developer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_pm', to='employee.employee'),
        ),
        migrations.AddConstraint(
            model_name='projectmanagerassignment',
            constraint=models.UniqueConstraint(fields=('developer',), name='unique_developer_assignment'),
        ),
    ]
