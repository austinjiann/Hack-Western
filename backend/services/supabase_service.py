from supabase import Client, create_client
from utils.env import settings
from typing import Optional
from blacksheep import Request



class SupabaseService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY
        )
    
    def get_user_id_from_token(self, token: str) -> Optional[str]:
        """Return the Supabase user id from a JWT access token.
        Uses GoTrue to validate the token and fetch the user.
        Returns None if invalid or user not found.
        """
        if not token:
            return None
        try:
            res = self.supabase.auth.get_user(token)
            # supabase-py v2: res has `.user` with `.id`
            if getattr(res, "user", None) and getattr(res.user, "id", None):
                return res.user.id
            return None
        except Exception:
            return None

    def get_user_id_from_request(self, request: Request) -> Optional[str]:
        """Extract Bearer token from Authorization header and return user id."""
        auth_header = request.get_first_header(b"authorization")
        if not auth_header:
            return None
        try:
            value = auth_header.decode()
            if value.lower().startswith("bearer "):
                token = value[7:].strip()
            else:
                # Not a Bearer token
                return None
            return self.get_user_id_from_token(token)
        except Exception:
            return None

    def do_transaction(self, user_id: str, transaction_type: str, credit_usage: int):
        """
        Logs transaction and adds credit usage for user
        """
        try:
            self.supabase.rpc(
                "add_user_credits",
                {
                    "p_user_id": user_id,
                    "p_credit_change": credit_usage
                }
            ).execute()

            self.supabase.table("transaction_log").insert({
                "transaction_type": transaction_type,
                "user_id": user_id,
                "credit_usage": credit_usage
            }).execute()
        except Exception as e:
            print(f"Failed to do transaction: {e}")
            pass

