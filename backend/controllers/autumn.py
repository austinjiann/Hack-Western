from blacksheep import json, Request, Response
from blacksheep.server.controllers import APIController, get, post, put, delete
from services.autumn_service import AutumnService
import json as pyjson

class Autumn(APIController):
    def __init__(self, autumn_service: AutumnService):
        self.autumn_service = autumn_service

    async def _get_customer_id(self, request: Request) -> str:
        """Extract customer_id from request (auth header, session, etc.)"""
        # TODO: Replace with your actual auth logic
        # For now, using a header or query param
        customer_id = request.headers.get("X-Customer-ID") or request.query.get("customer_id")
        if not customer_id:
            # In production, get from auth token/session
            customer_id = "demo-user"  # Remove this in production
        return customer_id


    @post("/checkout")
    async def autumn_checkout(self, request: Request):
        try:
            body = await request.json()
            print(f"Checkout request body: {body}")  # Debug log
            
            product_id = body.get("product_id", "")
            customer_id = "demo-user"
            
            result = await autumn_service.proxy_request(
                path="checkout",
                method="POST",
                customer_id=customer_id,
                customer_data={"name": "", "email": ""},
                body={"product_id": product_id}
            )
            print(f"Autumn response: {result}")  # Debug log
            return json(result["data"], status=result["status"])
        except Exception as e:
            import traceback
            traceback.print_exc()  # Print full error to terminal
            return json({"error": str(e)}, status=500)
            
    @get("*")
    async def handle_get(self, request: Request):
        """Handle GET requests to /api/autumn/*"""
        return await self._handle_request(request, method="GET")

    @post("*")
    async def handle_post(self, request: Request):
        """Handle POST requests to /api/autumn/*"""
        return await self._handle_request(request, method="POST")

    @put("*")
    async def handle_put(self, request: Request):
        """Handle PUT requests to /api/autumn/*"""
        return await self._handle_request(request, method="PUT")

    @delete("*")
    async def handle_delete(self, request: Request):
        """Handle DELETE requests to /api/autumn/*"""
        return await self._handle_request(request, method="DELETE")

    async def _handle_request(self, request: Request, method: str):
        """Proxy request to Autumn API"""
        try:
            # Get customer_id from auth
            customer_id = await self._get_customer_id(request)
            
            # Parse request body if present
            body = None
            if method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.json()
                except:
                    body = None

            # Extract the path after /api/autumn/
            # e.g., /api/autumn/checkout -> checkout
            path = request.url.path.replace("/api/autumn/", "").strip("/")
            
            # Get customer data (you can enhance this with actual user data)
            customer_data = {
                "name": "",  # Get from your user database
                "email": ""  # Get from your user database
            }

            # Forward to Autumn API
            result = await self.autumn_service.proxy_request(
                path=path,
                method=method,
                customer_id=customer_id,
                customer_data=customer_data,
                body=body
            )

            return json(result["data"], status=result["status"])

        except Exception as e:
            return json({"error": str(e)}, status=500)