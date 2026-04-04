from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)
dispense_log = []

COMPARTMENT_NAMES = {1: "Morning", 2: "Afternoon", 3: "Night"}


@app.route('/dispense', methods=['POST'])
def dispense():
    data = request.json or {}
    compartment = data.get('compartment', 1)
    drug = data.get('drug', 'Unknown')
    dose = data.get('dose', 'Unknown')
    timestamp = data.get('timestamp', datetime.now().isoformat())

    entry = {
        "compartment": compartment,
        "drug": drug,
        "dose": dose,
        "timestamp": timestamp,
        "status": "dispensed"
    }
    dispense_log.append(entry)

    tray = COMPARTMENT_NAMES.get(compartment, "Unknown")
    print(f"\n{'='*50}")
    print(f"AGASTYA AI DISPENSING DECISION")
    print(f"Medication: {drug} {dose}")
    print(f"AI routed to: {tray} tray (Compartment {compartment})")
    print(f"Time: {timestamp}")
    print(f"{'='*50}\n")

    return jsonify({
        "status": "dispensed",
        "compartment": compartment,
        "tray": tray,
        "drug": drug,
        "dose": dose,
        "message": f"{drug} dispensed to {tray} tray",
        "timestamp": timestamp
    })


@app.route('/log', methods=['GET'])
def get_log():
    return jsonify(dispense_log)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "dispenser": "ready",
        "total_dispenses": len(dispense_log)
    })


if __name__ == '__main__':
    print("Agastya Dispenser Bridge — http://localhost:5000")
    print("Waiting for dispensing commands...\n")
    app.run(port=5000, debug=True)
