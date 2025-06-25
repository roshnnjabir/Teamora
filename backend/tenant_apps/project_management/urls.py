from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, SubtaskViewSet, ProjectMemberViewSet, ProjectManagerAssignmentViewSet, GroupedPMAssignmentView, AssignmentAuditLogList

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'subtasks', SubtaskViewSet)
router.register(r'members', ProjectMemberViewSet)
router.register(r'pm-assignments', ProjectManagerAssignmentViewSet, basename='pm-assignment')

urlpatterns = [
    path('api/pm-assignments/grouped/', GroupedPMAssignmentView.as_view(), name='grouped-pm-assignments'),
    path('api/audit-logs/', AssignmentAuditLogList.as_view(), name='assignment-audit-logs'),
    path('api/', include(router.urls)),
]