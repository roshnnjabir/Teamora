from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, TaskViewSet, SubtaskViewSet,
    ProjectMemberViewSet, ProjectManagerAssignmentViewSet,
    GroupedPMAssignmentView, DeveloperAssignmentAuditLogList,
    ProjectManagerMyDevelopersView, MyAssignedTasksList, LabelViewSet,
    CommentViewSet
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
    path('my-developers/', ProjectManagerMyDevelopersView.as_view(), name='my-developers'),
    path('my-tasks/', MyAssignedTasksList.as_view(), name='my-tasks'),

    path('', include(router.urls)),
]