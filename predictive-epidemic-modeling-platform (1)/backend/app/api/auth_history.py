from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import uuid
from ..core import db as database

router = APIRouter()


def get_username_from_token(request: Request):
    auth = request.headers.get('authorization', '')
    if auth.lower().startswith('bearer '):
        token = auth.split(' ', 1)[1]
        row = database.query_one('SELECT username FROM tokens WHERE token = ?', (token,))
        return row['username'] if row else None
    return None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post('/auth/login', response_model=LoginResponse)
async def login(req: LoginRequest):
    user = database.query_one('SELECT username, password_hash FROM users WHERE username = ?', (req.username,))
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    if database.hash_password(req.password) != user['password_hash']:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = str(uuid.uuid4())
    database.execute('INSERT OR REPLACE INTO tokens (token, username) VALUES (?, ?)', (token, req.username))
    return {"access_token": token}


@router.post('/auth/logout')
async def logout(request: Request):
    username = get_username_from_token(request)
    if not username:
        raise HTTPException(status_code=401, detail='Not logged in')

    auth = request.headers.get('authorization', '')
    token = auth.split(' ', 1)[1]
    database.execute('DELETE FROM tokens WHERE token = ?', (token,))
    return {"status": "logged_out"}


@router.get('/auth/me')
async def me(request: Request):
    username = get_username_from_token(request)
    if not username:
        raise HTTPException(status_code=401, detail='Not authenticated')

    row = database.query_one('SELECT username, email FROM users WHERE username = ?', (username,))
    if not row:
        raise HTTPException(status_code=404, detail='User not found')
    return {"username": row['username'], "email": row['email']}


@router.get('/history')
async def get_history(request: Request):
    username = get_username_from_token(request)
    if not username:
        raise HTTPException(status_code=401, detail='Not authenticated')

    rows = database.query_all('SELECT id, username, title, details, created_at FROM history ORDER BY created_at DESC')
    return [
        {
            'id': row['id'],
            'user': row['username'],
            'title': row['title'],
            'details': row['details'],
            'created_at': row['created_at'],
        }
        for row in rows
    ]


class HistoryItem(BaseModel):
    title: str
    details: str


@router.post('/history')
async def post_history(item: HistoryItem, request: Request):
    username = get_username_from_token(request)
    if not username:
        raise HTTPException(status_code=401, detail='Not authenticated')

    entry_id = str(uuid.uuid4())
    database.execute(
        'INSERT INTO history (id, username, title, details) VALUES (?, ?, ?, ?)',
        (entry_id, username, item.title, item.details),
    )
    return {"id": entry_id, "user": username, "title": item.title, "details": item.details}
