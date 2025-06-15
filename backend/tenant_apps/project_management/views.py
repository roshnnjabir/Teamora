from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsProjectManagerOrTenantAdmin

# Create your views here.
class ProjectOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def get(self, request):
        return Response({"message": "Welcome, Project Manager!"})