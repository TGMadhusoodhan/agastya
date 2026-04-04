# proxy_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64

app = Flask(__name__)
CORS(app)

ANTHROPIC_API_KEY = "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"

@app.route('/proxy/claude', methods=['POST'])
def proxy_claude():
    try:
        data = request.json
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        }
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=data,
            timeout=30
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)