import httpx
from typing import List, Optional, Dict, Any
from fastapi import Depends
from ..models import SystemSetting
from sqlalchemy.orm import Session
from ..database import SessionLocal, get_db

class HostAPIClient:
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._get_settings()
        self.base_url = self.settings.get("host_api_base_url", "http://localhost:5000")
        self.api_key = self.settings.get("host_api_key", "")
        self.timeout = 10.0

    def _get_settings(self) -> Dict[str, str]:
        settings = self.db.query(SystemSetting).all()
        return {s.key: s.value for s in settings}

    def _get_headers(self) -> Dict[str, str]:
        return {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    async def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url.rstrip('/')}/api/admin/{path.lstrip('/')}"
        headers = self._get_headers()
        async with httpx.AsyncClient(headers=headers, timeout=self.timeout) as client:
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()

    # Rooms Management
    async def get_rooms(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"status": status} if status else {}
        return await self._request("GET", "rooms", params=params)

    async def get_room(self, room_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"rooms/{room_id}")

    async def hide_room(self, room_id: str) -> bool:
        await self._request("POST", f"rooms/{room_id}/hide")
        return True

    async def show_room(self, room_id: str) -> bool:
        await self._request("POST", f"rooms/{room_id}/show")
        return True

    # Host/Guest Info
    async def get_host(self, external_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"hosts/{external_id}")

    async def get_host_wallet(self, external_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"hosts/{external_id}/wallet")

    async def get_guest(self, external_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"guests/{external_id}")

    # Bookings
    async def get_bookings(self, status: Optional[str] = None, page: int = 1) -> List[Dict[str, Any]]:
        params = {"status": status, "page": page}
        return await self._request("GET", "bookings", params=params)

    async def get_booking(self, booking_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"bookings/{booking_id}")

    async def get_booking_timeline(self, booking_id: str) -> List[Dict[str, Any]]:
        return await self._request("GET", f"bookings/{booking_id}/timeline")

    # Payments
    async def get_payments(self, booking_id: Optional[str] = None, page: int = 1) -> List[Dict[str, Any]]:
        params = {"booking_id": booking_id, "page": page}
        return await self._request("GET", "payments", params=params)

    async def get_payment(self, payment_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"payments/{payment_id}")

    # Reviews
    async def get_reviews(self, room_id: Optional[str] = None, page: int = 1) -> List[Dict[str, Any]]:
        params = {"room_id": room_id, "page": page}
        return await self._request("GET", "reviews", params=params)

    async def hide_review(self, review_id: str) -> bool:
        await self._request("POST", f"reviews/{review_id}/hide")
        return True

    async def show_review(self, review_id: str) -> bool:
        await self._request("POST", f"reviews/{review_id}/show")
        return True

    # Withdrawals
    async def get_withdrawals(self) -> List[Dict[str, Any]]:
        return await self._request("GET", "withdrawals")

    async def approve_withdrawal(self, withdrawal_id: str) -> bool:
        await self._request("POST", f"withdrawals/{withdrawal_id}/approve")
        return True

    async def reject_withdrawal(self, withdrawal_id: str, reason: str) -> bool:
        await self._request("POST", f"withdrawals/{withdrawal_id}/reject", json={"reason": reason})
        return True

    # Stats
    async def get_stats(self) -> Dict[str, Any]:
        return await self._request("GET", "stats")

    async def get_revenue_stats(self, period: str = "monthly") -> Dict[str, Any]:
        params = {"period": period}
        return await self._request("GET", "stats/revenue", params=params)

    async def get_booking_stats(self, period: str = "monthly") -> Dict[str, Any]:
        params = {"period": period}
        return await self._request("GET", "stats/bookings", params=params)

    # Verifications
    async def get_verifications(self, status: Optional[str] = None, user_type: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {}
        if status: params["status"] = status
        if user_type: params["type"] = user_type
        return await self._request("GET", "verifications", params=params)

    async def get_verification(self, verification_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"verifications/{verification_id}")

    async def approve_verification(self, verification_id: str) -> bool:
        await self._request("POST", f"verifications/{verification_id}/approve")
        return True

    async def reject_verification(self, verification_id: str, reason: str) -> bool:
        await self._request("POST", f"verifications/{verification_id}/reject", json={"reason": reason})
        return True

def get_host_api_client(db: Session = Depends(get_db)) -> HostAPIClient:
    return HostAPIClient(db)
