import hashlib
import hmac
import json
import logging
from decimal import Decimal
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import AdminAuditLog, Payment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/paymongo", tags=["PayMongo Webhooks"])


def _load_webhook_secret() -> str:
    settings = get_settings()
    return settings.PAYMONGO_WEBHOOK_SECRET


def _verify_paymongo_signature(raw_body: bytes, header: Optional[str], secret: str) -> bool:
    """Verify a `Paymongo-Signature` header.

    Header format (per PayMongo docs):
        t=<unix_timestamp>,v1=<hex_sig>[,v1=<hex_sig>...]

    Verification: for each v1 signature, compute
        HMAC_SHA256(secret, f"{t}.{raw_body}")
    and compare against the signature with hmac.compare_digest.
    Returns True if any v1 signature matches.
    """
    if not header or not secret:
        return False

    parts = dict(segment.split("=", 1) for segment in header.split(",") if "=" in segment)
    timestamp = parts.get("t")
    signatures = [v for k, v in parts.items() if k == "v1"]
    if not timestamp or not signatures:
        return False

    signed_payload = f"{timestamp}.".encode("utf-8") + raw_body
    expected = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, candidate) for candidate in signatures)


@router.post("/webhook")
async def receive_paymongo_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Receive PayMongo webhook events.

    Verifies the Paymongo-Signature header using HMAC-SHA256 against
    the configured `paymongo_webhook_secret` setting, then routes on
    `data.attributes.type` to update local payment state.

    Intended as a backup / second source of truth alongside the
    Client -> /admin/internal/payment-confirmed sync path.
    """
    secret = _load_webhook_secret()
    raw_body = await request.body()

    if not _verify_paymongo_signature(raw_body, request.headers.get("Paymongo-Signature"), secret):
        logger.warning("PayMongo webhook signature verification failed")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload: Dict[str, Any] = json.loads(raw_body or b"{}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    data = payload.get("data") or {}
    attributes = data.get("attributes") or {}
    event_type = attributes.get("type") or data.get("type") or "unknown"
    resource = data.get("attributes", {}).get("data") or {}

    action_taken = await _handle_event(db, event_type, resource, attributes)

    db.add(AdminAuditLog(
        action="PAYMONGO_WEBHOOK",
        details=f"{event_type} resource_id={data.get('id')} -> {action_taken}",
    ))
    db.commit()

    return {"received": True, "event": event_type, "action": action_taken}


async def _handle_event(
    db: Session,
    event_type: str,
    resource: Dict[str, Any],
    attributes: Dict[str, Any],
) -> str:
    """Apply the event to local state. Returns a short action string for
    audit logging. Never raises; unknown events are logged and ignored."""
    try:
        if event_type == "payment.paid":
            return _apply_payment_paid(db, resource, attributes)
        if event_type == "payment.failed":
            return _apply_payment_failed(db, resource)
        if event_type in ("refund.updated", "refund.created"):
            return _apply_refund_event(db, resource, attributes)
        if event_type == "source.chargeable":
            # Already handled by Client -> internal_api sync; treat as info.
            return "ignored (source.chargeable handled via internal_api)"
        return f"ignored (unhandled event type: {event_type})"
    except Exception as exc:  # noqa: BLE001
        logger.exception("PayMongo webhook handler error: %s", exc)
        return f"error: {exc}"


def _apply_payment_paid(db: Session, resource: Dict[str, Any], attributes: Dict[str, Any]) -> str:
    payment_id = resource.get("id")
    if not payment_id:
        return "ignored (no resource id)"
    payment = db.query(Payment).filter(Payment.external_id == payment_id).first()
    if not payment:
        return f"ignored (no matching payment for id {payment_id})"
    payment.status = "completed"
    return f"set payment {payment.id} -> completed"


def _apply_payment_failed(db: Session, resource: Dict[str, Any]) -> str:
    payment_id = resource.get("id")
    if not payment_id:
        return "ignored (no resource id)"
    payment = db.query(Payment).filter(Payment.external_id == payment_id).first()
    if not payment:
        return f"ignored (no matching payment for id {payment_id})"
    payment.status = "failed"
    return f"set payment {payment.id} -> failed"


def _apply_refund_event(
    db: Session, resource: Dict[str, Any], attributes: Dict[str, Any]
) -> str:
    """PayMongo refund payloads nest the refund under attributes.data
    (which contains id, attributes.amount, attributes.payment_id, attributes.status)."""
    refund_obj = resource
    if "attributes" in refund_obj and "id" in refund_obj:
        refund_attrs = refund_obj.get("attributes") or {}
    else:
        refund_attrs = attributes.get("data", {}).get("attributes") or {}

    refund_id = refund_obj.get("id") or refund_attrs.get("id")
    payment_external_id = refund_attrs.get("payment_id")
    refund_status = refund_attrs.get("status")
    amount_centavos = refund_attrs.get("amount")

    if not payment_external_id:
        return "ignored (no payment_id in refund payload)"

    payment = db.query(Payment).filter(Payment.external_id == payment_external_id).first()
    if not payment:
        return f"ignored (no matching payment for id {payment_external_id})"

    if refund_id:
        payment.provider_refund_id = refund_id

    if refund_status == "succeeded":
        # amount in centavos; sum with already-refunded
        if amount_centavos is not None:
            amount_php = Decimal(int(amount_centavos)) / Decimal(100)
        else:
            amount_php = Decimal(0)
        current_refunded = payment.refund_amount or Decimal(0)
        new_total_refunded = current_refunded + amount_php
        payment.refund_amount = new_total_refunded
        payment.status = "refunded" if new_total_refunded >= payment.amount else "partially_refunded"
        return f"set payment {payment.id} -> {payment.status} (refunded {new_total_refunded})"
    if refund_status == "failed":
        return f"logged refund failure for payment {payment.id} (no local state change)"
    return f"recorded refund {refund_id} status={refund_status} (no state change)"
