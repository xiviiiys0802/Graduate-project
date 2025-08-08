import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from functools import lru_cache

# Firebase Admin SDK 초기화
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

@lru_cache()
def get_firestore_client():
    return firestore.client()

def verify_firebase_token(token: str):
    """Firebase ID 토큰 검증"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise Exception(f"Token verification failed: {str(e)}")