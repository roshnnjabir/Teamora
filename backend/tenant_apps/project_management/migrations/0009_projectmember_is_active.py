# Generated by Django 5.2.1 on 2025-06-26 21:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('project_management', '0008_task_created_by_alter_project_priority_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='projectmember',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
