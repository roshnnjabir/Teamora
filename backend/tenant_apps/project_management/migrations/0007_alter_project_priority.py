# Generated by Django 5.2.1 on 2025-06-26 05:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('project_management', '0006_project_priority'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='priority',
            field=models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='low', max_length=10),
        ),
    ]
