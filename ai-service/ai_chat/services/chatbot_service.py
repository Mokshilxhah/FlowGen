import re
import requests
from typing import Dict, Tuple
from django.conf import settings


class ChatbotService:
    """
    AI Chatbot service with intent classification and action execution
    """
    
    def __init__(self):
        self.intents = self._load_intents()
    
    def _load_intents(self) -> Dict:
        """Load intent patterns and responses"""
        return {
            'greeting': {
                'patterns': [
                    r'^hi$', r'^hello$', r'^hey$', r'^good morning', 
                    r'^good afternoon', r'^good evening'
                ],
                'action': None,
                'responses': [
                    'Hello! How can I assist you today?',
                    'Hi there! What can I help you with?',
                    'Hey! I\'m here to help. What do you need?'
                ]
            },
            'create_task': {
                'patterns': [
                    r'create.*task', r'add.*task', r'new task', 
                    r'make.*task', r'task.*create'
                ],
                'action': 'create_task',
                'responses': [
                    'I can help you create a task. What should the task be called?',
                    'Sure! What\'s the task title?'
                ]
            },
            'schedule_meeting': {
                'patterns': [
                    r'schedule.*meeting', r'book.*meeting', 
                    r'arrange.*meeting', r'set up.*meeting', r'meeting.*schedule'
                ],
                'action': 'schedule_meeting',
                'responses': [
                    'I\'ll help you schedule a meeting. When would you like it?',
                    'Let\'s schedule a meeting. What time works for you?'
                ]
            },
            'check_attendance': {
                'patterns': [
                    r'attendance', r'who.*present', r'check.*attendance',
                    r'attendance.*today', r'who.*absent'
                ],
                'action': 'check_attendance',
                'responses': [
                    'Let me check the attendance for you.',
                    'I\'ll fetch today\'s attendance data.'
                ]
            },
            'project_status': {
                'patterns': [
                    r'project.*status', r'how.*project', r'project.*progress',
                    r'status.*project', r'project.*update'
                ],
                'action': 'project_status',
                'responses': [
                    'I\'ll fetch the project status for you.',
                    'Let me get the latest project updates.'
                ]
            },
            'task_status': {
                'patterns': [
                    r'my tasks', r'task.*status', r'what.*tasks',
                    r'pending.*tasks', r'task.*list'
                ],
                'action': 'task_status',
                'responses': [
                    'Let me check your tasks.',
                    'I\'ll get your task list.'
                ]
            },
            'help': {
                'patterns': [
                    r'help', r'what.*can.*do', r'commands', r'features'
                ],
                'action': None,
                'responses': [
                    'I can help you with:\n- Creating tasks\n- Scheduling meetings\n- Checking attendance\n- Project status\n- Task management\n\nJust ask me naturally!'
                ]
            }
        }
    
    def classify_intent(self, message: str) -> Tuple[str, float]:
        """Classify user intent from message"""
        message_lower = message.lower().strip()
        
        for intent_name, intent_data in self.intents.items():
            for pattern in intent_data['patterns']:
                if re.search(pattern, message_lower):
                    return intent_name, 0.95
        
        return 'unknown', 0.0
    
    def process_message(self, message: str, user_id: str, org_id: str) -> Dict:
        """Process incoming message and generate response"""
        intent, confidence = self.classify_intent(message)
        
        if intent == 'unknown':
            return {
                'response': 'I\'m not sure I understand. Can you rephrase that? Try asking about tasks, meetings, attendance, or projects.',
                'intent': intent,
                'confidence': confidence,
                'action': None
            }
        
        intent_data = self.intents[intent]
        response = intent_data['responses'][0]  # Use first response
        action = intent_data.get('action')
        
        # Execute action if needed
        action_result = None
        if action:
            action_result = self._execute_action(action, message, user_id, org_id)
            if action_result and 'message' in action_result:
                response = action_result['message']
        
        return {
            'response': response,
            'intent': intent,
            'confidence': confidence,
            'action': action,
            'action_result': action_result
        }
    
    def _execute_action(self, action: str, message: str, user_id: str, org_id: str) -> Dict:
        """Execute specific actions by calling Node.js backend"""
        try:
            if action == 'check_attendance':
                return self._fetch_attendance(org_id)
            elif action == 'project_status':
                return self._fetch_project_status(org_id)
            elif action == 'task_status':
                return self._fetch_user_tasks(user_id, org_id)
            # Add more actions as needed
            return None
        except Exception as e:
            return {'error': str(e), 'message': 'Sorry, I encountered an error processing that request.'}
    
    def _fetch_attendance(self, org_id: str) -> Dict:
        """Fetch attendance from Node.js backend"""
        url = f"{settings.NODE_BACKEND_URL}/api/v1/attendance"
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                records = data.get('data', [])
                present = len([r for r in records if r.get('status') == 'present'])
                absent = len([r for r in records if r.get('status') == 'absent'])
                return {
                    'message': f"Today's attendance: {present} present, {absent} absent",
                    'data': records
                }
        except Exception as e:
            return {'error': str(e), 'message': 'Unable to fetch attendance data right now.'}
    
    def _fetch_project_status(self, org_id: str) -> Dict:
        """Fetch project status from Node.js backend"""
        url = f"{settings.NODE_BACKEND_URL}/api/v1/projects"
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                projects = data.get('data', [])
                return {
                    'message': f"You have {len(projects)} active projects",
                    'data': projects
                }
        except Exception as e:
            return {'error': str(e), 'message': 'Unable to fetch project data right now.'}
    
    def _fetch_user_tasks(self, user_id: str, org_id: str) -> Dict:
        """Fetch user tasks from Node.js backend"""
        url = f"{settings.NODE_BACKEND_URL}/api/v1/tasks"
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id,
            'X-User-Id': user_id
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                tasks = data.get('data', [])
                pending = len([t for t in tasks if t.get('status') != 'done'])
                return {
                    'message': f"You have {pending} pending tasks",
                    'data': tasks
                }
        except Exception as e:
            return {'error': str(e), 'message': 'Unable to fetch task data right now.'}
