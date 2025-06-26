from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, SubtaskViewSet, ProjectMemberViewSet, ProjectManagerAssignmentViewSet, GroupedPMAssignmentView, DeveloperAssignmentAuditLogList, ProjectManagerMyDevelopersView

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'subtasks', SubtaskViewSet)
router.register(r'members', ProjectMemberViewSet, basename='project-member')
router.register(r'pm-assignments', ProjectManagerAssignmentViewSet, basename='pm-assignment')

urlpatterns = [
    path('api/pm-assignments/grouped/', GroupedPMAssignmentView.as_view(), name='grouped-pm-assignments'),
    path('api/audit-logs/', DeveloperAssignmentAuditLogList.as_view(), name='assignment-audit-logs'),
    path("api/my-developers/", ProjectManagerMyDevelopersView.as_view(), name="my-developers"),
    path('api/', include(router.urls)),
]