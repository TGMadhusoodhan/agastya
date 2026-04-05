from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

dispense_log = []

# Blender updates this via POST /status when animation completes
dispenser_status = {
    "status": "idle",   # idle | dispensing | complete
    "last_drug": None,
    "last_tray": None,
    "last_time": None,
}

# Blender polls GET /pending to get the next dispense command.
# Flask sets this on POST /dispense; Blender clears it after reading.
pending_command = None

COMPARTMENT_NAMES = {1: "Morning", 2: "Afternoon", 3: "Night"}


@app.route('/dispense', methods=['POST'])
def dispense():
    global pending_command

    data        = request.json or {}
    compartment = data.get('compartment', 1)
    drug        = data.get('drug', 'Unknown')
    dose        = data.get('dose', 'Unknown')
    timestamp   = data.get('timestamp', datetime.now().isoformat())
    tray        = COMPARTMENT_NAMES.get(compartment, 'Unknown')

    # Mark as dispensing immediately so React's poller sees the state change
    dispenser_status['status']    = 'dispensing'
    dispenser_status['last_drug'] = drug
    dispenser_status['last_tray'] = tray
    dispenser_status['last_time'] = timestamp

    # Queue the command for Blender to pick up via GET /pending
    pending_command = {
        "compartment": compartment,
        "drug":        drug,
        "dose":        dose,
        "tray":        tray,
        "timestamp":   timestamp,
    }

    entry = {
        "compartment": compartment,
        "drug":        drug,
        "dose":        dose,
        "timestamp":   timestamp,
        "tray":        tray,
        "status":      "dispensing",
    }
    dispense_log.append(entry)

    print(f"\n{'='*50}")
    print(f"AGASTYA AI DISPENSING DECISION")
    print(f"Medication : {drug} {dose}")
    print(f"AI routed  : {tray} tray (Compartment {compartment})")
    print(f"Time       : {timestamp}")
    print(f"{'='*50}\n")

    return jsonify({
        "status":      "dispensing",
        "compartment": compartment,
        "tray":        tray,
        "drug":        drug,
        "dose":        dose,
        "message":     f"{drug} routed to {tray} tray",
        "timestamp":   timestamp,
    })


@app.route('/pending', methods=['GET'])
def get_pending():
    """
    Blender polls this every second to get the next dispense command.
    Returns the command and immediately clears it so it fires only once.
    """
    global pending_command
    cmd = pending_command
    pending_command = None          # consume — Blender won't replay it
    if cmd:
        return jsonify(cmd)
    return jsonify(None), 204       # 204 No Content = nothing pending


@app.route('/status', methods=['GET'])
def get_status():
    """React polls this every second to detect when Blender animation completes."""
    return jsonify(dispenser_status)


@app.route('/status', methods=['POST'])
def update_status():
    """
    Blender calls this endpoint (POST) when the dispense animation finishes.
    Body: { "status": "complete", "drug": "...", "time": "..." }
    """
    data = request.json or {}
    dispenser_status['status']    = data.get('status', 'idle')
    dispenser_status['last_drug'] = data.get('drug', dispenser_status['last_drug'])
    dispenser_status['last_time'] = data.get('time', dispenser_status['last_time'])

    # Mark matching log entry as complete
    drug = data.get('drug')
    if drug:
        for entry in reversed(dispense_log):
            if entry['drug'] == drug and entry['status'] == 'dispensing':
                entry['status'] = 'complete'
                break

    print(f"[STATUS] Blender reported: {dispenser_status['status']} — {dispenser_status['last_drug']}")
    return jsonify({"ok": True})


@app.route('/status/reset', methods=['POST'])
def reset_status():
    """Convenience endpoint to reset status back to idle."""
    dispenser_status['status'] = 'idle'
    return jsonify({"ok": True})


@app.route('/log', methods=['GET'])
def get_log():
    return jsonify(dispense_log)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status":          "online",
        "dispenser":       "ready",
        "total_dispenses": len(dispense_log),
        "current_status":  dispenser_status['status'],
    })


if __name__ == '__main__':
    print("Agastya Dispenser Bridge — http://localhost:5000")
    print("Endpoints:")
    print("  POST /dispense      — trigger dispense (from React)")
    print("  GET  /pending       — poll for next command (from Blender)")
    print("  GET  /status        — poll animation status (from React)")
    print("  POST /status        — update animation status (from Blender)")
    print("  GET  /health        — health check")
    print("  GET  /log           — dispense history\n")
    app.run(port=5000, debug=False)
