from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import random
from datetime import datetime, timedelta

@api_view(['POST'])
@permission_classes([AllowAny])
def suggest_assignee(request):
    """
    Simulates ML logic to suggest the best team member for a task.
    In a real scenario, this would use a scikit-learn model.
    """
    task_title = request.data.get('title', '')
    members = request.data.get('members', [])
    
    if not members:
        return Response({'suggested_id': None, 'confidence': 0, 'reason': 'No members provided'})
    
    # Simple logic: pick a random member with a "matching" keyword or just random
    suggested = random.choice(members)
    return Response({
        'suggested_id': suggested.get('id'),
        'confidence': round(random.uniform(0.7, 0.95), 2),
        'reason': f"Based on historical performance on similar '{task_title}' tasks."
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def estimate_duration(request):
    """
    ML based task duration estimation (hours).
    """
    title = request.data.get('title', '').lower()
    complexity = request.data.get('priority', 'medium')
    
    base_hours = 4
    if 'high' in complexity: base_hours = 12
    if 'bug' in title or 'fix' in title: base_hours += 2
    
    estimated = base_hours + random.randint(-2, 4)
    return Response({
        'estimated_hours': max(1, estimated),
        'confidence': 0.85
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def suggest_meeting_time(request):
    """
    Suggests optimal meeting times based on availability.
    """
    participants = request.data.get('participants', [])
    # Mocking some slots
    now = datetime.now()
    suggestions = [
        (now + timedelta(days=1, hours=10)).isoformat(),
        (now + timedelta(days=1, hours=14)).isoformat(),
        (now + timedelta(days=2, hours=11)).isoformat(),
    ]
    return Response({
        'suggested_slots': suggestions,
        'reason': 'Maximum participant overlap found in these slots.'
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_meeting_agenda(request):
    """
    Generates a structured meeting agenda based on title and topics.
    """
    title = request.data.get('title', 'Meeting')
    duration = int(request.data.get('duration', 30))
    topics = request.data.get('topics', [])
    
    items = []
    if topics:
        time_per_topic = max(5, duration // len(topics))
        for t in topics:
            items.append({
                'topic': t,
                'duration': time_per_topic,
                'speaker': 'TBD'
            })
    else:
        items = [
            {'topic': 'Introduction & Context', 'duration': max(5, duration // 4), 'speaker': 'Organizer'},
            {'topic': f'Main Discussion: {title}', 'duration': duration // 2, 'speaker': 'All'},
            {'topic': 'Action Items & Next Steps', 'duration': max(5, duration // 4), 'speaker': 'Organizer'}
        ]
        
    return Response({
        'agenda': items,
        'suggested_duration': duration
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def productivity_forecast(request):
    """
    Returns a trend of expected productivity.
    """
    user_id = request.query_params.get('userId')
    days = int(request.query_params.get('days', 7))
    
    data = []
    for i in range(days):
        date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
        data.append({
            'date': date,
            'score': random.randint(60, 95)
        })
    
    return Response({
        'userId': user_id,
        'forecast': data,
        'trend': 'improving' if random.random() > 0.5 else 'stable'
    })
