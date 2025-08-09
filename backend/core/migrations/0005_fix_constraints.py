from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_fix_member_duplicates'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE core_project 
            DROP CONSTRAINT IF EXISTS unique_project_id;

            ALTER TABLE core_project 
            ADD CONSTRAINT unique_project_id 
            UNIQUE (id);

            ALTER TABLE core_project_members
            DROP CONSTRAINT IF EXISTS unique_project_member;

            ALTER TABLE core_project_members
            ADD CONSTRAINT unique_project_member
            UNIQUE (project_id, customuser_id);
            """,
            reverse_sql="""
            ALTER TABLE core_project
            DROP CONSTRAINT IF EXISTS unique_project_id;

            ALTER TABLE core_project_members
            DROP CONSTRAINT IF EXISTS unique_project_member;
            """
        )
    ]