"""
Agastya — Blender Dispenser Script
====================================
Paste this entire script into Blender's Text Editor and press "Run Script".

Architecture
------------
  React app  ──POST /dispense──►  Flask (port 5000)
  Blender    ──polls GET /pending──► Flask
  Blender    ──POST /status──►  Flask   (animation done)
  React app  ──polls GET /status──► Flask

Flask handles all HTTP. Blender never opens its own server — it only
makes outbound requests to Flask, which avoids the port-5000 conflict.

Setup
-----
1. Install the `requests` library into Blender's Python:
       <blender>/4.x/python/bin/python -m pip install requests
2. Make sure Flask server is running:   python server.py
3. Open your dispenser .blend file and run this script.
"""

import bpy
import threading
import time
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
FLASK_URL   = "http://localhost:5000"
POLL_EVERY  = 1.0   # seconds between /pending polls

# Frame ranges for each compartment.
# Edit these to match your Blender animation tracks.
COMPARTMENT_FRAMES = {
    1: {"start": 1, "end": 120, "name": "Morning"},
    2: {"start": 1, "end": 120, "name": "Afternoon"},
    3: {"start": 1, "end": 120, "name": "Night"},
}

# ── State ────────────────────────────────────────────────────────────────────
_current_command = None   # set by poller, consumed by Blender timer
_poller_running  = False
_poller_thread   = None   # track the thread so we can stop it on re-run


# ── Flask helpers ─────────────────────────────────────────────────────────────
def _flask_get_pending():
    """Return the next pending command dict, or None."""
    try:
        import requests
        r = requests.get(f"{FLASK_URL}/pending", timeout=2)
        if r.status_code == 204:
            return None
        return r.json()
    except Exception as e:
        print(f"[Agastya] /pending poll error: {e}")
        return None


def _flask_post_status(status, drug, tray):
    """Notify Flask that the animation finished (or report an error)."""
    try:
        import requests
        requests.post(
            f"{FLASK_URL}/status",
            json={
                "status": status,
                "drug":   drug,
                "tray":   tray,
                "time":   datetime.now().isoformat(),
            },
            timeout=3,
        )
        print(f"[Agastya] Notified Flask → status={status}, drug={drug}")
    except Exception as e:
        print(f"[Agastya] /status notify error: {e}")


# ── Animation playback ────────────────────────────────────────────────────────
def _play_animation(compartment, drug, dose, tray):
    """
    Called on Blender's main thread (via bpy.app.timers).
    Sets the frame range, plays the animation, waits for it to finish,
    then notifies Flask.
    """
    anim = COMPARTMENT_FRAMES.get(compartment, COMPARTMENT_FRAMES[1])
    fps  = bpy.context.scene.render.fps  # should be 24

    print(f"\n{'='*55}")
    print(f"  AGASTYA DISPENSER TRIGGERED")
    print(f"  Drug        : {drug} {dose}")
    print(f"  Compartment : {compartment} ({tray})")
    print(f"  Frames      : {anim['start']} – {anim['end']}  @ {fps} fps")
    print(f"{'='*55}\n")

    # Configure the scene's playback range
    bpy.context.scene.frame_start = anim["start"]
    bpy.context.scene.frame_end   = anim["end"]
    bpy.context.scene.frame_set(anim["start"])

    # 120 frames at 24 fps = exactly 5.0 seconds
    # Use (end - start + 1) / fps so frame count is inclusive
    duration = (anim["end"] - anim["start"] + 1) / fps  # e.g. 120/24 = 5.0s

    def _stop_and_notify():
        # Stop playback (animation_play toggles — if playing, this stops it)
        if bpy.context.screen.is_animation_playing:
            bpy.ops.screen.animation_play()
        # Reset to first frame so next dispense starts clean
        bpy.context.scene.frame_set(anim["start"])
        # Notify Flask from background thread (no network I/O on main thread)
        threading.Thread(
            target=_flask_post_status,
            args=("complete", drug, tray),
            daemon=True,
        ).start()
        print(f"[Agastya] Animation complete — {drug} dispensed to {tray} tray")
        return None  # one-shot: do not reschedule

    # Start playback then schedule stop after duration + small buffer
    bpy.ops.screen.animation_play()
    bpy.app.timers.register(_stop_and_notify, first_interval=duration + 0.5)


# ── Blender-safe wrapper called by bpy.app.timers ────────────────────────────
def _consume_command():
    """
    bpy.app.timers calls this on the main thread.
    Reads _current_command, plays the animation, then clears it.
    Return value None means "don't reschedule this timer".
    """
    global _current_command
    cmd = _current_command
    _current_command = None

    if cmd is None:
        return None   # nothing to do

    compartment = cmd.get("compartment", 1)
    drug        = cmd.get("drug", "Unknown")
    dose        = cmd.get("dose", "Unknown")
    tray        = cmd.get("tray") or COMPARTMENT_FRAMES.get(compartment, {}).get("name", "Unknown")

    try:
        _play_animation(compartment, drug, dose, tray)
    except Exception as e:
        print(f"[Agastya] Animation error: {e}")
        _flask_post_status("error", drug, tray)

    return None   # one-shot timer — no reschedule


# ── Background polling thread ─────────────────────────────────────────────────
def _poll_loop():
    """
    Runs in a daemon thread. Polls Flask /pending every POLL_EVERY seconds.
    When a command arrives, stores it in _current_command and registers a
    one-shot bpy.app.timer so the animation plays on the main thread.
    """
    global _current_command, _poller_running
    print(f"[Agastya] Poller started — polling {FLASK_URL}/pending every {POLL_EVERY}s")

    while _poller_running:
        cmd = _flask_get_pending()
        if cmd:
            print(f"[Agastya] Command received: {cmd}")
            _current_command = cmd
            # Schedule animation on Blender's main thread
            bpy.app.timers.register(_consume_command, first_interval=0.05)
        time.sleep(POLL_EVERY)

    print("[Agastya] Poller stopped.")


# ── Start / stop helpers ──────────────────────────────────────────────────────
def start_poller():
    global _poller_running, _poller_thread

    # Kill any previously running poller (handles script re-runs in Blender)
    if _poller_running:
        print("[Agastya] Stopping old poller thread...")
        _poller_running = False
        if _poller_thread and _poller_thread.is_alive():
            _poller_thread.join(timeout=3)

    _poller_running = True
    _poller_thread  = threading.Thread(target=_poll_loop, daemon=True)
    _poller_thread.start()


def stop_poller():
    global _poller_running
    _poller_running = False


# ── Entry point ───────────────────────────────────────────────────────────────
start_poller()
print("[Agastya] Blender dispenser ready.")
print(f"[Agastya] Frame ranges:")
for k, v in COMPARTMENT_FRAMES.items():
    print(f"  Compartment {k} ({v['name']}): frames {v['start']}–{v['end']}")
print(f"[Agastya] Flask: {FLASK_URL}")
