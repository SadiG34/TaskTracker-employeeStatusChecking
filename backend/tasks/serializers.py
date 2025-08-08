from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'assigned_to', 'created_at']

    def validate(self, data):
        print("Полученные данные:", data)
        return data