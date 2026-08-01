import re
import requests
import json
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
    
    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API via direct REST request"""
        if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured in settings")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {
            'Content-Type': 'application/json'
        }
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ]
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        res_data = response.json()
        try:
            return res_data['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError) as e:
            raise ValueError(f"Unexpected response structure from Gemini API: {res_data}") from e

    def _clean_json_response(self, text: str) -> dict:
        """Clean markdown code block delimiters and parse JSON"""
        clean = re.sub(r'^```json\s*', '', text, flags=re.IGNORECASE)
        clean = re.sub(r'^```\s*', '', clean)
        clean = re.sub(r'\s*```$', '', clean)
        clean = clean.strip()
        return json.loads(clean)

    def process_message(self, message: str, user_id: str, org_id: str) -> Dict:
        """Process incoming message and generate response"""
        system_instructions = (
            "You are FlowBot, the intelligent AI work assistant for FlowGen (the Intelligent Workforce Operating System). "
            "You help users manage tasks, schedule meetings, view projects, and track attendance. "
            "Respond naturally, professionally, and keep answers concise. Use markdown formatting where appropriate."
        )

        # 1. Intent Classification & Parameter Extraction via Gemini
        classifier_prompt = (
            "You are the intent parser for FlowBot, an intelligent workspace AI assistant.\n"
            "Analyze the user's request and categorize it into one of the following actions:\n"
            "1. 'create_task': User wants to create, add, or make a new task.\n"
            "2. 'schedule_meeting': User wants to schedule, book, or arrange a meeting.\n"
            "3. 'query': User wants to ask about, view, or check existing information (e.g. tasks, projects, meetings, attendance, members, peers).\n"
            "4. 'chat': User greetings, chit-chat, or general questions.\n\n"
            "Respond ONLY with a valid JSON object of the following format (do not output any other text or description):\n"
            "{\n"
            "  \"action\": \"create_task\" | \"schedule_meeting\" | \"query\" | \"chat\",\n"
            "  \"extracted\": {\n"
            "     // For create_task:\n"
            "     \"title\": \"task title\",\n"
            "     \"description\": \"task description (optional)\",\n"
            "     \"assignee\": \"assignee name (e.g. 'Rahul', 'Alex', 'me')\",\n"
            "     \"project\": \"project name (optional)\",\n"
            "     \"priority\": \"low\" | \"medium\" | \"high\" (optional),\n"
            "     \"dueDate\": \"YYYY-MM-DD (optional)\"\n"
            "     \n"
            "     // For schedule_meeting:\n"
            "     \"title\": \"meeting title\",\n"
            "     \"description\": \"meeting description (optional)\",\n"
            "     \"scheduledAt\": \"date/time string (optional, e.g. 'tomorrow at 10 AM', '2026-08-01T10:00:00')\",\n"
            "     \"duration\": 30,\n"
            "     \"participants\": [\"name1\", \"name2\"],\n"
            "     \"platform\": \"internal\" | \"zoom\" | \"teams\" | \"meet\"\n"
            "  }\n"
            "}\n\n"
            f"User Request: \"{message}\"\n"
            "JSON Response:"
        )

        try:
            classification_raw = self._call_gemini(classifier_prompt)
            classification = self._clean_json_response(classification_raw)
            action = classification.get('action', 'chat')
            extracted = classification.get('extracted', {})
        except Exception as e:
            print(f"Classification failed: {e}. Falling back to default regex mapping.")
            intent, confidence = self.classify_intent(message)
            action = self.intents.get(intent, {}).get('action', 'chat')
            extracted = {}

        action_result = None

        try:
            # 2. Handle Query actions
            if action == 'query':
                # Fetch all database context to answer the user query
                peers = self._fetch_peers(user_id, org_id)
                projects = self._fetch_project_status(org_id)
                tasks = self._fetch_user_tasks(user_id, org_id)
                meetings = self._fetch_meetings(user_id, org_id)
                attendance = self._fetch_attendance(org_id)
                
                query_prompt = (
                    f"{system_instructions}\n\n"
                    f"User Query: \"{message}\"\n\n"
                    "Here is the current live data retrieved from our database:\n"
                    f"- Organization Projects: {json.dumps(projects.get('data', []), indent=2)}\n"
                    f"- User Tasks: {json.dumps(tasks.get('data', []), indent=2)}\n"
                    f"- Scheduled Meetings: {json.dumps(meetings.get('data', []), indent=2)}\n"
                    f"- Organization Peers/Members: {json.dumps(peers.get('data', []), indent=2)}\n"
                    f"- Today's Attendance: {json.dumps(attendance.get('data', []), indent=2)}\n\n"
                    "Analyze the retrieved data and directly answer the user's query with actual, real-time facts and details from the database."
                )
                response = self._call_gemini(query_prompt)
                return {
                    'response': response,
                    'intent': 'query',
                    'confidence': 0.95,
                    'action': 'query',
                    'action_result': {'query_success': True}
                }

            # 3. Handle Create Task action
            elif action == 'create_task':
                projects = self._fetch_project_status(org_id)
                peers = self._fetch_peers(user_id, org_id)
                
                resolver_prompt = (
                    "You are a database ID resolver for task creation. Map user text parameters to actual database IDs.\n"
                    f"Extracted task details:\n{json.dumps(extracted, indent=2)}\n\n"
                    f"Available Projects:\n{json.dumps(projects.get('data', []), indent=2)}\n\n"
                    f"Available Peers/Members:\n{json.dumps(peers.get('data', []), indent=2)}\n\n"
                    f"User ID (who is requesting this): \"{user_id}\"\n\n"
                    "Return ONLY a valid JSON object matching the following structure:\n"
                    "{\n"
                    "  \"projectId\": \"database project _id string (required, pick the first project if no match is found)\",\n"
                    "  \"assigneeId\": \"database user _id string (required, if 'me' or empty or not found, use User ID)\",\n"
                    "  \"title\": \"task title string (required)\",\n"
                    "  \"description\": \"task description string (default empty)\",\n"
                    "  \"priority\": \"low\" | \"medium\" | \"high\" (default 'medium'),\n"
                    "  \"dueDate\": \"YYYY-MM-DD (format if provided, else null)\"\n"
                    "}\n"
                    "JSON Response:"
                )
                
                resolver_raw = self._call_gemini(resolver_prompt)
                task_payload = self._clean_json_response(resolver_raw)
                
                # Clean task payload to satisfy Zod validation (Zod optional doesn't accept null)
                task_payload['description'] = task_payload.get('description') or ""
                if 'dueDate' in task_payload and not task_payload['dueDate']:
                    del task_payload['dueDate']
                
                create_result = self._create_task(user_id, org_id, task_payload)
                
                confirm_prompt = (
                    f"{system_instructions}\n\n"
                    f"Please generate a response confirming to the user that the task was successfully created.\n"
                    f"Created Task Details: {json.dumps(create_result, indent=2)}"
                )
                response = self._call_gemini(confirm_prompt)
                return {
                    'response': response,
                    'intent': 'create_task',
                    'confidence': 0.95,
                    'action': 'create_task',
                    'action_result': create_result
                }

            # 4. Handle Schedule Meeting action
            elif action == 'schedule_meeting':
                peers = self._fetch_peers(user_id, org_id)
                
                resolver_prompt = (
                    "You are a database ID resolver for meeting scheduling. Map user text parameters to database IDs and parse date-times.\n"
                    "Current local time: 2026-07-31T23:16:36+05:30\n\n"
                    f"Extracted meeting details:\n{json.dumps(extracted, indent=2)}\n\n"
                    f"Available Peers/Members:\n{json.dumps(peers.get('data', []), indent=2)}\n\n"
                    f"User ID (who is requesting this): \"{user_id}\"\n\n"
                    "Return ONLY a valid JSON object matching the following structure:\n"
                    "{\n"
                    "  \"title\": \"meeting title string (required)\",\n"
                    "  \"description\": \"meeting description string (optional)\",\n"
                    "  \"participantIds\": [\"database user _id strings\"] (must include at least the User ID, plus all resolved participant IDs),\n"
                    "  \"scheduledAt\": \"ISO 8601 date-time string (e.g. '2026-08-01T14:00:00') (required, calculate based on relative text like 'tomorrow at 2 PM' relative to current local time)\",\n"
                    "  \"duration\": number of minutes (default 30),\n"
                    "  \"platform\": \"internal\" | \"zoom\" | \"teams\" | \"meet\" (default 'internal')\n"
                    "}\n"
                    "JSON Response:"
                )
                
                resolver_raw = self._call_gemini(resolver_prompt)
                meeting_payload = self._clean_json_response(resolver_raw)
                
                # Clean meeting payload to satisfy Zod validation (Zod optional doesn't accept null)
                meeting_payload['description'] = meeting_payload.get('description') or ""
                if 'agenda' in meeting_payload and not meeting_payload['agenda']:
                    del meeting_payload['agenda']
                if 'meetingLink' in meeting_payload and not meeting_payload['meetingLink']:
                    del meeting_payload['meetingLink']
                if not meeting_payload.get('platform'):
                    meeting_payload['platform'] = 'internal'
                
                create_result = self._create_meeting(user_id, org_id, meeting_payload)

                
                confirm_prompt = (
                    f"{system_instructions}\n\n"
                    f"Please generate a response confirming to the user that the meeting was successfully scheduled.\n"
                    f"Created Meeting Details: {json.dumps(create_result, indent=2)}"
                )
                response = self._call_gemini(confirm_prompt)
                return {
                    'response': response,
                    'intent': 'schedule_meeting',
                    'confidence': 0.95,
                    'action': 'schedule_meeting',
                    'action_result': create_result
                }

            # 5. General Chat action
            else:
                chat_prompt = (
                    f"{system_instructions}\n\n"
                    f"User Request: {message}\n"
                    "Please respond to the user's greeting or general question."
                )
                response = self._call_gemini(chat_prompt)
                return {
                    'response': response,
                    'intent': 'chat',
                    'confidence': 0.95,
                    'action': None,
                    'action_result': None
                }

        except Exception as e:
            print(f"Advanced flow failed: {e}. Falling back to default regex response.")
            # Fallback to local regex/mock logic in case of Gemini failures
            try:
                intent, confidence = self.classify_intent(message)
                if intent == 'unknown':
                    response = "I'm not sure I understand. Can you rephrase that? Try asking about tasks, meetings, attendance, or projects."
                else:
                    intent_data = self.intents[intent]
                    action = intent_data.get('action')
                    if action:
                        action_result = self._execute_action(action, message, user_id, org_id)
                    response = intent_data['responses'][0]
                    if action_result and 'message' in action_result:
                        response = action_result['message']
            except Exception as e2:
                response = "I'm experiencing some difficulties retrieving workspace data. Please make sure the services are running."
                
            return {
                'response': response,
                'intent': 'fallback',
                'confidence': 0.5,
                'action': None,
                'action_result': None
            }

    def _execute_action(self, action: str, message: str, user_id: str, org_id: str) -> Dict:
        """Execute specific actions by calling Node.js backend (Legacy/Fallback)"""
        try:
            if action == 'check_attendance':
                return self._fetch_attendance(org_id)
            elif action == 'project_status':
                return self._fetch_project_status(org_id)
            elif action == 'task_status':
                return self._fetch_user_tasks(user_id, org_id)
            return None
        except Exception as e:
            return {'error': str(e), 'message': 'Sorry, I encountered an error processing that request.'}
    
    def _get_api_url(self, path: str) -> str:
        """Resolve backend URL by stripping /api/v1 from NODE_BACKEND_URL to avoid double mapping"""
        base = settings.NODE_BACKEND_URL.rstrip('/')
        if base.endswith('/api/v1'):
            base = base[:-7]
        return f"{base}/api/v1/{path.lstrip('/')}"

    def _fetch_attendance(self, org_id: str) -> Dict:
        """Fetch attendance from Node.js backend"""
        url = self._get_api_url("attendance")
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
            return {'error': f'Status {response.status_code}', 'data': []}
        except Exception as e:
            return {'error': str(e), 'message': 'Unable to fetch attendance data right now.', 'data': []}
    
    def _fetch_project_status(self, org_id: str) -> Dict:
        """Fetch project status from Node.js backend"""
        url = self._get_api_url("projects")
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
            return {'error': f'Status {response.status_code}', 'data': []}
        except Exception as e:
            return {'error': str(e), 'message': 'Unable to fetch project data right now.', 'data': []}
    
    def _fetch_user_tasks(self, user_id: str, org_id: str) -> Dict:
        """Fetch user tasks from Node.js backend"""
        url = self._get_api_url("tasks")
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
            return {'error': f'Status {response.status_code}', 'data': []}
        except Exception as e:
            return {'error': str(e), 'message': 'Unable to fetch task data right now.', 'data': []}

    def _fetch_peers(self, user_id: str, org_id: str) -> Dict:
        """Fetch peers from Node.js backend"""
        url = self._get_api_url("user/peers")
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id,
            'X-User-Id': user_id
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                return response.json()
            return {'error': f'Status {response.status_code}', 'data': []}
        except Exception as e:
            return {'error': str(e), 'data': []}

    def _fetch_meetings(self, user_id: str, org_id: str) -> Dict:
        """Fetch meetings from Node.js backend"""
        url = self._get_api_url("meetings")
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id,
            'X-User-Id': user_id
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                return response.json()
            return {'error': f'Status {response.status_code}', 'data': []}
        except Exception as e:
            return {'error': str(e), 'data': []}

    def _create_task(self, user_id: str, org_id: str, payload: dict) -> Dict:
        """Create task in Node.js backend"""
        url = self._get_api_url("tasks")
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id,
            'X-User-Id': user_id,
            'Content-Type': 'application/json'
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                return response.json()
            return {'error': response.text, 'status': response.status_code}
        except Exception as e:
            return {'error': str(e)}

    def _create_meeting(self, user_id: str, org_id: str, payload: dict) -> Dict:
        """Create meeting in Node.js backend"""
        url = self._get_api_url("meetings")
        headers = {
            'Authorization': f'Bearer {settings.NODE_BACKEND_API_KEY}',
            'X-Org-Id': org_id,
            'X-User-Id': user_id,
            'Content-Type': 'application/json'
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                return response.json()
            return {'error': response.text, 'status': response.status_code}
        except Exception as e:
            return {'error': str(e)}
