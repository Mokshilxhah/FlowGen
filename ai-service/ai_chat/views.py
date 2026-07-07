from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import ChatSession, ChatMessage
from .services.chatbot_service import ChatbotService

chatbot = ChatbotService()


@api_view(['POST'])
@permission_classes([AllowAny])
def chat_message(request):
    """Handle incoming chat messages"""
    try:
        message = request.data.get('message')
        user_id = request.data.get('userId')
        org_id = request.data.get('organizationId')
        session_id = request.data.get('sessionId')
        
        if not all([message, user_id, org_id]):
            return Response(
                {'error': 'Missing required fields: message, userId, organizationId'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create session
        if session_id:
            session = ChatSession.objects.filter(id=session_id).first()
            if not session:
                session = ChatSession.objects.create(
                    user_id=user_id,
                    organization_id=org_id
                )
        else:
            session = ChatSession.objects.create(
                user_id=user_id,
                organization_id=org_id
            )
        
        # Save user message
        ChatMessage.objects.create(
            session=session,
            role='user',
            content=message
        )
        
        # Process message
        result = chatbot.process_message(message, user_id, org_id)
        
        # Save assistant response
        ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=result['response'],
            intent=result['intent'],
            confidence=result['confidence']
        )
        
        return Response({
            'sessionId': session.id,
            'response': result['response'],
            'intent': result['intent'],
            'confidence': result['confidence'],
            'action': result.get('action'),
            'actionResult': result.get('action_result')
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def chat_history(request, session_id):
    """Get chat history for a session"""
    try:
        messages = ChatMessage.objects.filter(session_id=session_id)
        data = [{
            'id': msg.id,
            'role': msg.role,
            'content': msg.content,
            'intent': msg.intent,
            'confidence': msg.confidence,
            'createdAt': msg.created_at.isoformat()
        } for msg in messages]
        
        return Response({'messages': data})
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'service': 'FlowGen AI Service',
        'version': '1.0.0'
    })
