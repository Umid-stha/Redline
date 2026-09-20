from celery import shared_task
from .fingerprint import generate_fingerprint 

@shared_task()
def process_event(validated_data):
    print(type(validated_data['stack_trace']))
    print(generate_fingerprint(exception_type=validated_data['exception_type'], stack_trace=validated_data['stack_trace']))
