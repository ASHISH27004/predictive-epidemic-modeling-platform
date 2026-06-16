import os
import sqlite3
import hashlib
from pathlib import Path

DB_FILE = Path(__file__).resolve().parent.parent / 'data' / 'app.db'
DB_FILE.parent.mkdir(parents=True, exist_ok=True)

CREATE_TABLE_USERS = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT
);
"""

CREATE_TABLE_TOKENS = """
CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_TABLE_HISTORY = """
CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin'
ADMIN_EMAIL = 'admin@gridoptimizer.com'


def get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def init_db():
    conn = get_connection()
    try:
        conn.execute(CREATE_TABLE_USERS)
        conn.execute(CREATE_TABLE_TOKENS)
        conn.execute(CREATE_TABLE_HISTORY)
        conn.commit()

        cur = conn.execute('SELECT username FROM users WHERE username = ?', (ADMIN_USERNAME,))
        if cur.fetchone() is None:
            pw_hash = hash_password(ADMIN_PASSWORD)
            conn.execute(
                'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                (ADMIN_USERNAME, pw_hash, ADMIN_EMAIL),
            )
            conn.commit()
    finally:
        conn.close()


def query_one(sql: str, params: tuple = ()):
    conn = get_connection()
    try:
        cur = conn.execute(sql, params)
        return cur.fetchone()
    finally:
        conn.close()


def query_all(sql: str, params: tuple = ()):
    conn = get_connection()
    try:
        cur = conn.execute(sql, params)
        return cur.fetchall()
    finally:
        conn.close()


def execute(sql: str, params: tuple = ()):
    conn = get_connection()
    try:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


# Initialize database on import
init_db()
