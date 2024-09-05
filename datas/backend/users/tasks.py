from django_cron import CronJobBase, Schedule
from django.utils import timezone
from .models import UserProfile

class ResetExpiredCodesJob(CronJobBase):
    schedule = Schedule(run_every_mins=60)  # Set the schedule interval as needed
    code = 'your_app.reset_expired_codes_job'  # Replace 'your_app' with your app name

    def do(self):
        UserProfile.objects.filter(
            code_expiry_time__lt=timezone.now(),
            otp__isnull=False
        ).update(otp='', otp_expiry_time=None)