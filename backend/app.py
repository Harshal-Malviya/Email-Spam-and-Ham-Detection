# app.py

import joblib

# Load ML spam model
clf = joblib.load("spam_classifier.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

def classify_message(text):
    if not text:
        return "Ham"
    X = vectorizer.transform([text])
    pred = clf.predict(X)[0]
    return "Spam" if pred == 1 else "Ham"

from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS, cross_origin
import os
import pathlib
from datetime import datetime, timedelta
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request # Import Request for explicit refresh

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = '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'  # Use env var in production

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",

    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",   

    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file"     
]


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
CLIENT_SECRETS_FILE = os.path.join(pathlib.Path(__file__).parent, 'client_secret.json')

@app.route('/api/login')
def login():
    account_hint = request.args.get("hint")
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri='http://localhost:5000/api/callback'
    )
    auth_url, state = flow.authorization_url(
        # CRITICAL FIX: Always request 'consent' to ensure a refresh token is issued
        prompt='consent',
        login_hint=account_hint,
        access_type='offline',
        include_granted_scopes='true'
    )
    session['state'] = state
    return redirect(auth_url)

@app.route('/api/callback')
def callback():
    state = session['state']
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri='http://localhost:5000/api/callback'
    )
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    user_info = build('oauth2', 'v2', credentials=credentials).userinfo().get().execute()

    if 'accounts' not in session:
        session['accounts'] = []

    found = False
    for acc in session['accounts']:
        if acc['email'] == user_info['email']:
            acc['credentials'] = creds_to_dict(credentials)
            found = True

    if not found:
        session['accounts'].append({
            "email": user_info['email'],
            "name": user_info.get("name", "User"),
            "picture": user_info.get("picture", ""),
            "credentials": creds_to_dict(credentials)
        })

    session['credentials'] = creds_to_dict(credentials)
    session['active_email'] = user_info['email']

    return redirect('http://localhost:3000')

@app.route("/api/user")
def get_user():
    if 'credentials' not in session:
        return jsonify({"error": "Not logged in"}), 401
    creds = creds_from_dict(session['credentials'])
    # Attempt to refresh token if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session['credentials'] = creds_to_dict(creds) # Save updated credentials
        except Exception as e:
            print(f"Error refreshing token for user: {e}")
            return jsonify({"error": "Failed to refresh token, please re-login"}), 401
    
    service = build('oauth2', 'v2', credentials=creds)
    user_info = service.userinfo().get().execute()
    return jsonify(user_info)

@app.route('/api/accounts')
def get_accounts():
    return jsonify({
        "accounts": session.get("accounts", []),
        "active_email": session.get("active_email")
    })

@app.route('/api/switch-account', methods=["POST"])
def switch_account():
    email = request.json.get("email")
    for acc in session.get("accounts", []):
        if acc["email"] == email:
            session['credentials'] = acc["credentials"]
            session['active_email'] = acc["email"]
            # Attempt to refresh token after switching, if needed
            creds = creds_from_dict(session['credentials'])
            if creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    session['credentials'] = creds_to_dict(creds)
                except Exception as e:
                    print(f"Error refreshing token after account switch: {e}")
                    # Log error, but still proceed as switch happened. User might need to re-login.
            return jsonify({"success": True})
    return jsonify({"error": "Account not found"}), 404

@app.route("/api/send-reply", methods=["POST"])
def send_reply():
    if 'credentials' not in session:
        return jsonify({"error": "User not authenticated"}), 401

    creds = creds_from_dict(session['credentials'])
    # Attempt to refresh token if expired before sending email
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session['credentials'] = creds_to_dict(creds)
        except Exception as e:
            print(f"Error refreshing token before sending email: {e}")
            return jsonify({"error": "Failed to refresh token, please re-login"}), 401

    try:
        service = build('gmail', 'v1', credentials=creds)
        data = request.form if request.form else request.get_json()

        to = data.get("to")
        subject = data.get("subject")
        message_text = data.get("message")
        file = request.files.get("file")

        if not all([to, subject, message_text]):
            return jsonify({"error": "Missing required fields: to, subject, message"}), 400

        message = MIMEMultipart()
        message["to"] = to
        message["subject"] = subject
        message.attach(MIMEText(message_text))

        if file:
            part = MIMEBase('application', "octet-stream")
            part.set_payload(file.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', 'attachment', filename=file.filename)
            message.attach(part)

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        create_message = {'raw': raw_message}

        send_message = service.users().messages().send(userId="me", body=create_message).execute()

        internal_date_ms = int(datetime.now().timestamp() * 1000)

        return jsonify({
            "success": True,
            "message_id": send_message["id"],
            "internalDate": internal_date_ms
        })

    except HttpError as error:
        print(f"An error occurred: {error}")
        return jsonify({"error": str(error)}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": str(e)}), 500
        
@app.route("/api/chat-messages")
def get_chat_messages():
    if 'credentials' not in session:
        return jsonify({"error": "Not logged in"}), 401

    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Missing email"}), 400

    creds = creds_from_dict(session['credentials'])
    # Attempt to refresh token if expired before fetching chat messages
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session['credentials'] = creds_to_dict(creds) # Save updated credentials
        except Exception as e:
            print(f"Error refreshing token before fetching chat messages: {e}")
            return jsonify({"error": "Failed to refresh token, please re-login"}), 401

    try:
        service = build('gmail', 'v1', credentials=creds)
        query = f"to:{email} OR from:{email}"

        response = service.users().messages().list(userId='me', q=query, maxResults=50).execute() 
        messages = response.get('messages', [])
        chat_data = []

        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            
            headers = msg_data['payload'].get('headers', [])
            from_header = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'unknown')
            
            internal_date = int(msg_data.get('internalDate', datetime.now().timestamp() * 1000))

            is_sent_by_me = session['active_email'] in from_header 
            
            body = ''
            def get_message_body(parts_payload):
                if not parts_payload:
                    return ''
                for part in parts_payload:
                    if part.get('mimeType') == 'text/plain' and 'data' in part['body']:
                        return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                if parts_payload[0].get('parts'):
                    return get_message_body(parts_payload[0].get('parts'))
                return ''

            if 'body' in msg_data['payload'] and 'data' in msg_data['payload']['body']:
                body = base64.urlsafe_b64decode(msg_data['payload']['body']['data']).decode('utf-8', errors='ignore')
            elif msg_data['payload'].get('parts'):
                body = get_message_body(msg_data['payload'].get('parts'))

            chat_data.append({
                'id': msg['id'], 
                'from': 'you' if is_sent_by_me else 'them',
                'body': body.strip(),
                'internalDate': internal_date 
            })

        chat_data.sort(key=lambda x: x['internalDate'])
        
        return jsonify({'messages': chat_data})

    except Exception as e:
        print("Chat history fetch failed:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/send", methods=["POST"])
def send_email():
    if 'credentials' not in session:
        return jsonify({"error": "Not logged in"}), 401

    creds = creds_from_dict(session['credentials'])
    # Attempt to refresh token if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session['credentials'] = creds_to_dict(creds)
        except Exception as e:
            print(f"Error refreshing token before sending email: {e}")
            return jsonify({"error": "Failed to refresh token, please re-login"}), 401

    data = request.json
    to_email = data.get("to")
    subject = data.get("subject")
    message_body = data.get("message")

    if not to_email or not subject or not message_body:
        return jsonify({"error": "Missing fields"}), 400

    service = build('gmail', 'v1', credentials=creds)

    message = MIMEText(message_body)
    message['to'] = to_email
    message['subject'] = subject
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

    try:
        send_message = service.users().messages().send(userId="me", body={"raw": raw_message}).execute()
        return jsonify({"status": "Email sent", "id": send_message['id']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/create-meet", methods=["POST"])
@cross_origin()
def create_meet():
    if 'credentials' not in session:
        return jsonify({"error": "Not logged in"}), 401

    creds = creds_from_dict(session['credentials'])
    # Attempt to refresh token if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session['credentials'] = creds_to_dict(creds)
        except Exception as e:
            print(f"Error refreshing token before creating meet: {e}")
            return jsonify({"error": "Failed to refresh token, please re-login"}), 401

    invitee = request.json.get("invitee")

    try:
        service = build("calendar", "v3", credentials=creds)
        now = datetime.utcnow()
        end = now + timedelta(minutes=30)

        event = {
            "summary": "Quick Google Meet",
            "description": "Initiated via Gmail Chat Enhancement UI",
            "start": {"dateTime": now.isoformat() + "Z"},
            "end": {"dateTime": end.isoformat() + "Z"},
            "attendees": [{"email": invitee}],
            "conferenceData": {
                "createRequest": {
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                    "requestId": f"meet-{int(datetime.utcnow().timestamp())}"
                }
            }
        }

        created_event = service.events().insert(
            calendarId="primary",
            body=event,
            conferenceDataVersion=1
        ).execute()

        meet_link = created_event.get("conferenceData", {}).get("entryPoints", [])[0].get("uri")
        return jsonify({"meet_link": meet_link})

    except HttpError as error:
        print("Error creating Meet:", error)
        return jsonify({"error": str(error)}), 500

@app.route('/api/inbox', methods=['GET'])
def get_inbox():
    if 'credentials' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    creds = creds_from_dict(session['credentials'])
    # Attempt to refresh token if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session['credentials'] = creds_to_dict(creds)
        except Exception as e:
            print(f"Error refreshing token before fetching inbox: {e}")
            return jsonify({"error": "Failed to refresh token, please re-login"}), 401

    try:
        service = build('gmail', 'v1', credentials=creds)
        response = service.users().messages().list(userId='me', maxResults=10, labelIds=['INBOX']).execute()
        messages = response.get('messages', [])

        email_list = []
        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
            headers = msg_data['payload'].get('headers', [])
            snippet = msg_data.get('snippet', '')
            internal_date_ms = int(msg_data.get('internalDate', 0)) 

            from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')

            email_list.append({
                'id': msg['id'], 
                'from': from_email,
                'subject': subject,
                'snippet': snippet,
                'timestamp': datetime.fromtimestamp(internal_date_ms / 1000).strftime('%I:%M %p, %d %b'), 
                'internalDate': internal_date_ms ,
                    'spam_status': classify_message(snippet)
            })
        
        email_list.sort(key=lambda x: x['internalDate'], reverse=True)


        return jsonify({
            "messages": email_list,
            "nextPageToken": response.get("nextPageToken")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

def creds_to_dict(creds):
    return {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }

def creds_from_dict(data):
    # Ensure all required fields are present when creating the Credentials object
    # The 'refresh_token' can legitimately be None if offline access wasn't granted or if it's a one-time token.
    # The other fields ('token_uri', 'client_id', 'client_secret') are critical for refreshing.
    return Credentials(
        token=data['token'],
        refresh_token=data.get('refresh_token'), 
        token_uri=data.get('token_uri'), # Use .get() defensively here as well, although they should always be present
        client_id=data.get('client_id'),
        client_secret=data.get('client_secret'),
        scopes=data['scopes']
    )

if __name__ == "__main__":
    app.run(port=5000, debug=True)