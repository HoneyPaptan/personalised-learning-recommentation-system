import os
import json
import random
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import db

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
CORS(app, supports_credentials=True)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

with open("questions.json", "r") as f:
    QUESTIONS = json.load(f)

db.init_db()

SLIP_TIME_LIMIT = 5
BATCH_SIZE = 5

student_profile = {
    "mastery_h": 0,
    "heatmap": {"Addition": 0, "Subtraction": 0, "Multiplication": 0, "Division": 0}
}

history_buffer = []

def get_user_name():
    return session.get("user_name", "Learner")

def generate_ai_message(state, user_name):
    messages = {
        "analyzing": [
            f"{user_name}, I'm analysing your moves...",
            f"Hmm, interesting pattern {user_name}...",
        ],
        "breath": [
            "Take a deep breath.",
            "One step at a time.",
            "You've got this!",
        ],
        "encourage": [
            "Keep going, you're doing great!",
            "Every attempt helps you grow.",
            "Progress, not perfection.",
        ]
    }
    return random.choice(messages.get(state, messages["encourage"]))

def calculate_neural_update(current_h, score, response_time):
    is_slip = False
    if score == 0 and response_time < SLIP_TIME_LIMIT:
        is_slip = True
        new_mastery = max(0.0, current_h - 0.01)
    else:
        learning_rate = 0.1
        if score == 1:
            effort_bonus = 1.2 if response_time > 20 else 1.0
            new_mastery = min(1.0, current_h + (learning_rate * effort_bonus))
        else:
            new_mastery = max(0.0, current_h - learning_rate)
    return round(new_mastery, 2), is_slip

def get_feedback_from_ai(verdict, response_time, mastery, user_name):
    prompt = f"""
Context: You are an empathetic AI Tutor for a student named {user_name}.
Stats: Result={verdict}, Time={response_time}s, Mastery={mastery*100}%.
Task: Write one sentence of encouraging feedback.
If a Slip occurred, explain that their progress is safe.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return "You're making progress! Keep going."

@app.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("setup"))
    return redirect(url_for("dashboard"))

@app.route("/setup", methods=["GET", "POST"])
def setup():
    if request.method == "POST":
        user_name = request.json.get("name", "").strip()
        user_id = db.create_user(name=user_name if user_name else None)
        session["user_id"] = user_id
        session["user_name"] = user_name if user_name else "Learner"
        session["session_id"] = None
        session["history_buffer"] = []
        student_profile["mastery_h"] = 0
        student_profile["heatmap"] = {"Addition": 0, "Subtraction": 0, "Multiplication": 0, "Division": 0}
        return jsonify({"success": True})
    return render_template("setup.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("setup"))
    user_settings = db.get_settings(session["user_id"])
    return render_template("dashboard.html", 
                         user_name=get_user_name(),
                         ai_avatar_enabled=user_settings["ai_avatar_enabled"])

@app.route("/quiz")
def quiz():
    if "user_id" not in session:
        return redirect(url_for("setup"))
    if session.get("session_id") is None:
        session["session_id"] = db.start_session(session["user_id"])
        session["history_buffer"] = []
    user_settings = db.get_settings(session["user_id"])
    q = random.choice(QUESTIONS)
    print(f"Quiz question: {q}")
    session["current_question"] = q
    return render_template("quiz.html",
                         question=q,
                         user_name=get_user_name(),
                         ai_avatar_enabled=user_settings["ai_avatar_enabled"])

@app.route("/start-session", methods=["POST"])
def start_session_route():
    if "user_id" not in session:
        return jsonify({"error": "No user"}), 401
    if session.get("session_id") is None:
        session["session_id"] = db.start_session(session["user_id"])
        session["history_buffer"] = []
    return jsonify({"success": True, "session_id": session["session_id"]})

@app.route("/question", methods=["GET"])
def get_question():
    if "user_id" not in session:
        return jsonify({"error": "No user"}), 401
    
    # Get previously asked questions
    history = session.get("history_buffer", [])
    used_texts = {entry["question_text"] for entry in history}
    
    # Add current question to used if it exists (so we don't repeat the immediate previous one)
    if session.get("current_question"):
        used_texts.add(session["current_question"].get("question", ""))
        used_texts.add(session["current_question"].get("question_text", ""))

    available = [q for q in QUESTIONS if q["question"] not in used_texts]
    if not available:
        available = QUESTIONS

    q = random.choice(available)
    session["current_question"] = q
    session["question_start_time"] = json.dumps({"time": random.random()})
    return jsonify(q)

@app.route("/submit", methods=["POST"])
def submit():
    if "user_id" not in session:
        print("ERROR: No user_id in session")
        return jsonify({"error": "No user"}), 401
    
    data = request.json
    print(f"Received data: {data}")
    score = int(data.get("score", 0))
    response_time = float(data.get("response_time", 0))
    skill = data.get("skill", "Addition")
    question_text = data.get("question_text", "")
    
    user_id = session["user_id"]
    session_id = session.get("session_id")
    
    trend = db.get_mastery_trend(user_id, 1)
    if trend:
        mastery_before = trend[0]["mastery_h"]
        try:
            current_heatmap = json.loads(trend[0]["heatmap"])
        except:
            current_heatmap = {"Addition": 0, "Subtraction": 0, "Multiplication": 0, "Division": 0}
    else:
        mastery_before = 0
        current_heatmap = {"Addition": 0, "Subtraction": 0, "Multiplication": 0, "Division": 0}
    
    new_h, is_slip = calculate_neural_update(mastery_before, score, response_time)
    current_heatmap[skill] = new_h
    
    verdict = "Slip" if is_slip else ("Gap" if score == 0 else "Success")
    user_name = get_user_name()
    feedback = get_feedback_from_ai(verdict, response_time, new_h, user_name)
    
    history_entry = {
        "skill": skill,
        "question_text": question_text,
        "score": score,
        "is_slip": is_slip,
        "response_time": response_time,
        "mastery_before": mastery_before,
        "mastery_after": new_h
    }
    session["history_buffer"] = session.get("history_buffer", []) + [history_entry]
    
    if len(session.get("history_buffer", [])) >= BATCH_SIZE:
        db.save_question_batch(user_id, session_id, session["history_buffer"])
        db.save_mastery_snapshot(user_id, new_h, current_heatmap)
        session["history_buffer"] = []
    
    ai_state = "analyzing" if score == 0 and response_time < SLIP_TIME_LIMIT else "breath" if response_time < 10 else "encourage"
    ai_message = generate_ai_message(ai_state, user_name) if db.get_settings(user_id)["ai_avatar_enabled"] else None
    
    return jsonify({
        "mastery": new_h,
        "is_slip": is_slip,
        "feedback": feedback,
        "heatmap": current_heatmap,
        "ai_message": ai_message,
        "ai_enabled": db.get_settings(user_id)["ai_avatar_enabled"]
    })

@app.route("/profile")
def profile():
    if "user_id" not in session:
        return redirect(url_for("setup"))
    
    user_id = session["user_id"]
    user = db.get_user(user_id)
    sessions = db.get_user_sessions(user_id)
    history = db.get_user_history(user_id, 50)
    mastery_trend = db.get_mastery_trend(user_id, 90)
    
    skill_totals = {}
    for row in history:
        skill = row["skill"]
        if skill not in skill_totals:
            skill_totals[skill] = {"total": 0, "correct": 0}
        skill_totals[skill]["total"] += 1
        if row["score"] == 1:
            skill_totals[skill]["correct"] += 1
    
    total_questions = sum(s["total"] for s in skill_totals.values())
    total_correct = sum(s["correct"] for s in skill_totals.values())
    
    overall_mastery = mastery_trend[0]["mastery_h"] if mastery_trend else 0
    try:
        heatmap = json.loads(mastery_trend[0]["heatmap"]) if mastery_trend else {}
    except:
        heatmap = {}
    
    return render_template("profile.html",
                         user=user,
                         sessions=sessions,
                         history=history,
                         mastery_trend=mastery_trend,
                         skill_totals=skill_totals,
                         total_questions=total_questions,
                         total_correct=total_correct,
                         overall_mastery=overall_mastery,
                         heatmap=heatmap,
                         user_name=get_user_name())

@app.route("/settings", methods=["GET", "POST"])
def settings():
    if "user_id" not in session:
        return redirect(url_for("setup"))
    
    user_id = session["user_id"]
    
    if request.method == "POST":
        data = request.json
        if "ai_avatar" in data:
            db.update_setting(user_id, "ai_avatar_enabled", 1 if data["ai_avatar"] else 0)
        if "name" in data:
            db.update_user_name(user_id, data["name"])
            session["user_name"] = data["name"] if data["name"] else "Learner"
        return jsonify({"success": True})
    
    user_settings = db.get_settings(user_id)
    return render_template("settings.html",
                         settings=user_settings,
                         user_name=get_user_name())

@app.route("/end-session", methods=["POST"])
def end_session_route():
    if "user_id" not in session or "session_id" not in session:
        return jsonify({"error": "No session"}), 400
    
    user_id = session["user_id"]
    session_id = session["session_id"]
    
    if session.get("history_buffer"):
        trend = db.get_mastery_trend(user_id, 1)
        current_h = trend[0]["mastery_h"] if trend else 0
        try:
            current_heatmap = json.loads(trend[0]["heatmap"]) if trend else {}
        except:
            current_heatmap = {}
            
        db.save_question_batch(user_id, session_id, session["history_buffer"])
        db.save_mastery_snapshot(user_id, current_h, current_heatmap)
    
    total_q = sum(1 for _ in db.get_user_history(user_id, 1000))
    correct_q = sum(1 for row in db.get_user_history(user_id, 1000) if row["score"] == 1)
    
    db.end_session(session_id, total_q, correct_q)
    
    session["session_id"] = None
    session["history_buffer"] = []
    
    return jsonify({"success": True})

@app.route("/api/dashboard-data")
def api_dashboard_data():
    if "user_id" not in session:
        return jsonify({"error": "No user"}), 401

    user_id = session["user_id"]
    user = db.get_user(user_id)
    sessions = db.get_user_sessions(user_id)
    history = db.get_user_history(user_id, 1000)
    mastery_trend = db.get_mastery_trend(user_id, 90)

    total_questions = len(history)
    correct_answers = sum(1 for row in history if row["score"] == 1)

    # Calculate streak
    streak = 0
    if sessions:
        for session_row in sessions:
            if session_row["ended_at"]:
                streak += 1
            else:
                break

    # Return actual mastery from snapshot if exists, else 0
    actual_mastery = 0
    heatmap = {}
    if mastery_trend:
        actual_mastery = mastery_trend[0]["mastery_h"]
        try:
            heatmap = json.loads(mastery_trend[0]["heatmap"])
        except:
            pass

    return jsonify({
        "mastery": actual_mastery,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "sessions": len(sessions),
        "streak": streak,
        "heatmap": heatmap,
        "user_name": get_user_name(),
        "mastery_trend": [{"created_at": m["created_at"], "mastery_h": m["mastery_h"]} for m in mastery_trend]
    })

@app.route("/api/profile-data")
def api_profile_data():
    if "user_id" not in session:
        return jsonify({"error": "No user"}), 401

    user_id = session["user_id"]
    history = db.get_user_history(user_id, 1000)
    mastery_trend = db.get_mastery_trend(user_id, 90)

    # Calculate per-skill stats
    skill_stats = {}
    for row in history:
        skill = row["skill"]
        if skill not in skill_stats:
            skill_stats[skill] = {"total": 0, "correct": 0, "mastery": 0.5}
        skill_stats[skill]["total"] += 1
        if row["score"] == 1:
            skill_stats[skill]["correct"] += 1
        skill_stats[skill]["mastery"] = row["mastery_after"]

    # Convert to list format
    skills = []
    for skill, stats in skill_stats.items():
        accuracy = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0
        trend = "up" if stats["mastery"] > 0.6 else ("down" if stats["mastery"] < 0.4 else "stable")
        skills.append({
            "name": skill,
            "mastery": stats["mastery"],
            "trend": trend,
            "questions": stats["total"],
            "correct": stats["correct"],
            "accuracy": round(accuracy, 1)
        })

    # Return actual mastery from snapshot if exists, else 0
    actual_mastery = 0
    if mastery_trend:
        actual_mastery = mastery_trend[0]["mastery_h"]

    # If no skills yet, show 0%
    if not skills:
        skills = [
            {"name": "Addition", "mastery": 0, "trend": "stable", "questions": 0, "correct": 0, "accuracy": 0},
            {"name": "Subtraction", "mastery": 0, "trend": "stable", "questions": 0, "correct": 0, "accuracy": 0},
            {"name": "Multiplication", "mastery": 0, "trend": "stable", "questions": 0, "correct": 0, "accuracy": 0},
            {"name": "Division", "mastery": 0, "trend": "stable", "questions": 0, "correct": 0, "accuracy": 0},
        ]

    total_questions = sum(s["total"] for s in skills)
    total_correct = sum(s["correct"] for s in skills)

    return jsonify({
        "mastery": actual_mastery,
        "total_questions": total_questions,
        "correct_answers": total_correct,
        "sessions": len(db.get_user_sessions(user_id)),
        "streak": 0,
        "skills": skills,
        "mastery_trend": [{"created_at": m["created_at"], "mastery_h": m["mastery_h"]} for m in mastery_trend]
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)