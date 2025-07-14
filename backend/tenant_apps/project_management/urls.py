from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, TaskViewSet, SubtaskViewSet,
    ProjectMemberViewSet, ProjectManagerAssignmentViewSet,
    GroupedPMAssignmentView, DeveloperAssignmentAuditLogList,
    ProjectManagerMyDevelopersView, NotifyPMView,
    LabelViewSet, CommentViewSet, DeveloperDashboardDataView
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'subtasks', SubtaskViewSet)
router.register(r'labels', LabelViewSet)
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'members', ProjectMemberViewSet, basename='project-member')
router.register(r'pm-assignments', ProjectManagerAssignmentViewSet, basename='pm-assignment')

urlpatterns = [
    path('pm-assignments/grouped/', GroupedPMAssignmentView.as_view(), name='grouped-pm-assignments'),
    path('audit-logs/', DeveloperAssignmentAuditLogList.as_view(), name='assignment-audit-logs'),
    path('notify-pm/', NotifyPMView.as_view(), name='notify-pm'),

    path('my-developers/', ProjectManagerMyDevelopersView.as_view(), name='my-developers'),

    path('developer-dashboard/', DeveloperDashboardDataView.as_view(), name='developer-dashboard'),
    
    path('', include(router.urls)),
]