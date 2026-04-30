import sqlite3
import json
import os
from datetime import datetime
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                started_at TEXT DEFAULT CURRENT_TIMESTAMP,
                ended_at TEXT,
                total_questions INTEGER DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS question_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                user_id INTEGER,
                skill TEXT,
                question_text TEXT,
                score INTEGER,
                is_slip INTEGER,
                response_time REAL,
                mastery_before REAL,
                mastery_after REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS mastery_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                mastery_h REAL,
                heatmap TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                ai_avatar_enabled INTEGER DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()

def create_user(name=None):
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO users (name) VALUES (?)",
            (name,)
        )
        user_id = cursor.lastrowid
        conn.execute(
            "INSERT INTO settings (user_id, ai_avatar_enabled) VALUES (?, 1)",
            (user_id,)
        )
        conn.commit()
        return user_id

def get_user(user_id):
    with get_db() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

def update_user_name(user_id, name):
    with get_db() as conn:
        conn.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
        conn.commit()

def get_settings(user_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM settings WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            conn.execute("INSERT INTO settings (user_id, ai_avatar_enabled) VALUES (?, 1)", (user_id,))
            conn.commit()
            row = conn.execute("SELECT * FROM settings WHERE user_id = ?", (user_id,)).fetchone()
        return dict(row)

def update_setting(user_id, key, value):
    with get_db() as conn:
        conn.execute(f"UPDATE settings SET {key} = ? WHERE user_id = ?", (value, user_id))
        conn.commit()

def start_session(user_id):
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO sessions (user_id) VALUES (?)",
            (user_id,)
        )
        session_id = cursor.lastrowid
        conn.commit()
        return session_id

def end_session(session_id, total_questions, correct_count):
    with get_db() as conn:
        conn.execute(
            "UPDATE sessions SET ended_at = CURRENT_TIMESTAMP, total_questions = ?, correct_count = ? WHERE id = ?",
            (total_questions, correct_count, session_id)
        )
        conn.commit()

def get_session(session_id):
    with get_db() as conn:
        return conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()

def save_question_batch(user_id, session_id, history_batch):
    with get_db() as conn:
        for item in history_batch:
            conn.execute("""
                INSERT INTO question_history 
                (session_id, user_id, skill, question_text, score, is_slip, response_time, mastery_before, mastery_after)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, user_id, item["skill"], item["question_text"],
                item["score"], int(item.get("is_slip", False)), item["response_time"],
                item["mastery_before"], item["mastery_after"]
            ))
        conn.commit()

def save_mastery_snapshot(user_id, mastery_h, heatmap):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO mastery_snapshots (user_id, mastery_h, heatmap, created_at) VALUES (?, ?, ?, datetime('now', 'localtime'))",
            (user_id, mastery_h, json.dumps(heatmap))
        )
        conn.commit()

def get_user_history(user_id, limit=50):
    with get_db() as conn:
        return conn.execute("""
            SELECT * FROM question_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT ?
        """, (user_id, limit)).fetchall()

def get_user_sessions(user_id):
    with get_db() as conn:
        return conn.execute("""
            SELECT * FROM sessions 
            WHERE user_id = ? 
            ORDER BY started_at DESC LIMIT 10
        """, (user_id,)).fetchall()

def get_mastery_trend(user_id, limit=20):
    with get_db() as conn:
        return conn.execute("""
            SELECT * FROM mastery_snapshots 
            WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT ?
        """, (user_id, limit)).fetchall()

def get_skill_mastery(user_id, skill):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT mastery_after FROM question_history 
            WHERE user_id = ? AND skill = ?
            ORDER BY created_at DESC
        """, (user_id, skill)).fetchall()
        if rows:
            return rows[0]["mastery_after"]
        return 0.5