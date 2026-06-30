import httpx
import logging
from typing import Optional, Dict, Any, List
from ..config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class ClientAPIClient:
    """Client for calling Client-TiraNa internal API endpoints."""

    def __init__(self):
        self.base_url = settings.CLIENT_API_BASE_URL.rstrip("/")
        self.timeout = 10.0
        self.headers = {
            "X-Internal-API-Key": settings.INTERNAL_API_KEY
        }

    async def _get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    params=params,
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except httpx.ConnectError:
            logger.warning(f"Client API unavailable: {endpoint}")
            return None
        except httpx.TimeoutException:
            logger.warning(f"Client API timeout: {endpoint}")
            return None
        except Exception as e:
            logger.error(f"Client API error: {endpoint} - {str(e)}")
            return None

    def _unwrap(self, result: Optional[Dict]) -> Optional[Dict]:
        if result and isinstance(result, dict) and "data" in result:
            return result["data"]
        return result

    async def _post(self, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make POST request to Client API with error handling."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}{endpoint}",
                    json=data,
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except httpx.ConnectError:
            logger.warning(f"Client API unavailable: {endpoint}")
            return None
        except httpx.TimeoutException:
            logger.warning(f"Client API timeout: {endpoint}")
            return None
        except Exception as e:
            logger.error(f"Client API error: {endpoint} - {str(e)}")
            return None

    async def get_users(self, search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        """Get list of client users from Client API."""
        params = {"skip": skip, "limit": limit}
        if search:
            params["search"] = search
        result = await self._get("/api/admin/users", params)
        data = self._unwrap(result)
        return data.get("users", []) if data else []

    async def get_verifications(self, status: str = "", type: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        """Get list of verification requests from Client API."""
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        if type:
            params["type"] = type
        result = await self._get("/api/admin/verifications", params)
        data = self._unwrap(result)
        return data.get("verifications", []) if data else []

    async def get_bookings(self, status: str = "", search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        """Get list of bookings from Client API."""
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        result = await self._get("/api/admin/bookings", params)
        return result.get("data", []) if result else []

    async def get_payments(self, status: str = "", search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        """Get list of payments from Client API."""
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        result = await self._get("/api/admin/payments", params)
        return result.get("data", []) if result else []

    async def get_payment_count(self, status: str = "") -> int:
        """Get count of payments from Client API."""
        params = {}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/payments/count", params)
        return result.get("count", 0) if result else 0

    async def get_revenue_stats(self) -> Dict[str, Any]:
        """Get revenue statistics from Client API."""
        result = await self._get("/api/admin/payments/revenue")
        return result or {"total_revenue": 0, "total_refunded": 0}

    async def refund_payment(self, payment_id: str, amount: float, reason: str) -> bool:
        """Process a refund for a payment via Client API."""
        result = await self._post(f"/api/admin/payments/{payment_id}/refund", {
            "amount": amount,
            "reason": reason
        })
        return result is not None

    async def approve_verification(self, verification_id: str) -> bool:
        """Approve a client verification."""
        result = await self._post(f"/api/admin/verifications/{verification_id}/approve")
        return result is not None

    async def reject_verification(self, verification_id: str) -> bool:
        """Reject a client verification."""
        result = await self._post(f"/api/admin/verifications/{verification_id}/reject")
        return result is not None


# Singleton instance
client_api_client = ClientAPIClient()


async def get_client_api_client():
    return client_api_client
