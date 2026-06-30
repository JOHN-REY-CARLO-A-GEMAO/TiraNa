from functools import wraps
from flask import request, jsonify
import os

def internal_api_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        internal_api_key = request.headers.get('X-Internal-API-Key')
        expected_key = os.getenv('INTERNAL_API_KEY', 'tirana-internal-secret-key')

        if not internal_api_key or internal_api_key != expected_key:
            return jsonify({
                "status": "error",
                "message": "Invalid or missing Internal API Key"
            }), 401

        return f(*args, **kwargs)
    return decorated_function
