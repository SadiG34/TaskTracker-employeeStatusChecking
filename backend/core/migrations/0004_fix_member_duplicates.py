# core/migrations/0004_fix_duplicates.py
from django.db import migrations, models

def forward(apps, schema_editor):
    """Удаление дубликатов через промежуточную таблицу"""
    sql = """
    DELETE FROM core_project_members
    WHERE id NOT IN (
        SELECT MIN(id) 
        FROM core_project_members 
        GROUP BY project_id, customuser_id
    )
    """
    schema_editor.execute(sql)

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_alter_project_options_project_created_by_and_more'),
    ]

    operations = [
        migrations.RunPython(forward),
        migrations.AddConstraint(
            model_name='project',
            constraint=models.UniqueConstraint(
                fields=('id',),
                name='unique_project_id'
            ),
        ),
        migrations.AlterUniqueTogether(
            name='project',
            unique_together={('name', 'organization')},
        ),
    ]