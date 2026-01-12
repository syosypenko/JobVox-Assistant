from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime
import os, json

from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/hirevoice')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Interview(Base):
    __tablename__ = 'interviews'
    id = Column(String, primary_key=True, index=True)
    payload = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Base.metadata.create_all(bind=engine)  <-- Moved to startup event

class InterviewIn(BaseModel):
    id: str
    payload: Dict[str, Any]

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Error creating tables: {e}")

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post('/interviews')
def upsert_interview(item: InterviewIn):
    db = SessionLocal()
    try:
        obj = db.query(Interview).filter(Interview.id == item.id).one_or_none()
        now = datetime.utcnow()
        if obj:
            obj.payload = json.dumps(item.payload)
            obj.updated_at = now
        else:
            obj = Interview(id=item.id, payload=json.dumps(item.payload), created_at=now, updated_at=now)
            db.add(obj)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@app.get('/interviews')
def list_interviews():
    db = SessionLocal()
    try:
        rows = db.query(Interview).order_by(Interview.updated_at.desc()).all()
        result = [
            {
                'id': r.id,
                'payload': json.loads(r.payload),
                'created_at': r.created_at.isoformat() if r.created_at else None,
                'updated_at': r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ]
        return result
    finally:
        db.close()


@app.delete('/interviews/{item_id}')
def delete_interview(item_id: str):
    db = SessionLocal()
    try:
        obj = db.query(Interview).filter(Interview.id == item_id).one_or_none()
        if not obj:
            raise HTTPException(status_code=404, detail='Not found')
        db.delete(obj)
        db.commit()
        return {"success": True}
    finally:
        db.close()

