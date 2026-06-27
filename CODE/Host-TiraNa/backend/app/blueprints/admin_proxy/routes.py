"""
Stub admin-proxy endpoints consumed by the Admin dashboard's host_api_client.

These return empty/mock data so the Admin UI can render without 500 errors.
When the Host team implements real logic, replace the stubs with database queries.

Route contract matches:
  Admin-TiraNa/backend/app/services/host_api_client.py
"""

from flask import request
from app.blueprints.admin_proxy import admin_proxy_bp
from app.utils.response import success_response


# ─── Rooms ──────────────────────────────────────────────────────────

@admin_proxy_bp.route("/rooms", methods=["GET"])
def get_rooms():
    return success_response(data={"rooms": [], "total": 0})


@admin_proxy_bp.route("/rooms/<room_id>", methods=["GET"])
def get_room(room_id):
    return success_response(data={"room": None})


@admin_proxy_bp.route("/rooms/<room_id>/hide", methods=["POST"])
def hide_room(room_id):
    return success_response(message="Room hidden (stub).")


@admin_proxy_bp.route("/rooms/<room_id>/show", methods=["POST"])
def show_room(room_id):
    return success_response(message="Room shown (stub).")


# ─── Hosts / Guests ─────────────────────────────────────────────────

@admin_proxy_bp.route("/hosts/<external_id>", methods=["GET"])
def get_host(external_id):
    return success_response(data={"host": None})


@admin_proxy_bp.route("/hosts/<external_id>/wallet", methods=["GET"])
def get_host_wallet(external_id):
    return success_response(data={"wallet": None})


@admin_proxy_bp.route("/guests/<external_id>", methods=["GET"])
def get_guest(external_id):
    return success_response(data={"guest": None})


# ─── Bookings ───────────────────────────────────────────────────────

@admin_proxy_bp.route("/bookings", methods=["GET"])
def get_bookings():
    return success_response(data={"bookings": [], "total": 0})


@admin_proxy_bp.route("/bookings/<booking_id>", methods=["GET"])
def get_booking(booking_id):
    return success_response(data={"booking": None})


@admin_proxy_bp.route("/bookings/<booking_id>/timeline", methods=["GET"])
def get_booking_timeline(booking_id):
    return success_response(data={"timeline": []})


# ─── Payments ───────────────────────────────────────────────────────

@admin_proxy_bp.route("/payments", methods=["GET"])
def get_payments():
    return success_response(data={"payments": [], "total": 0})


@admin_proxy_bp.route("/payments/<payment_id>", methods=["GET"])
def get_payment(payment_id):
    return success_response(data={"payment": None})


# ─── Reviews ────────────────────────────────────────────────────────

@admin_proxy_bp.route("/reviews", methods=["GET"])
def get_reviews():
    return success_response(data={"reviews": [], "total": 0})


@admin_proxy_bp.route("/reviews/<review_id>/hide", methods=["POST"])
def hide_review(review_id):
    return success_response(message="Review hidden (stub).")


@admin_proxy_bp.route("/reviews/<review_id>/show", methods=["POST"])
def show_review(review_id):
    return success_response(message="Review shown (stub).")


# ─── Withdrawals ────────────────────────────────────────────────────

@admin_proxy_bp.route("/withdrawals", methods=["GET"])
def get_withdrawals():
    return success_response(data={"withdrawals": [], "total": 0})


@admin_proxy_bp.route("/withdrawals/<withdrawal_id>/approve", methods=["POST"])
def approve_withdrawal(withdrawal_id):
    return success_response(message="Withdrawal approved (stub).")


@admin_proxy_bp.route("/withdrawals/<withdrawal_id>/reject", methods=["POST"])
def reject_withdrawal(withdrawal_id):
    return success_response(message="Withdrawal rejected (stub).")


# ─── Stats ──────────────────────────────────────────────────────────

@admin_proxy_bp.route("/stats", methods=["GET"])
def get_stats():
    return success_response(data={
        "total_hosts": 0,
        "total_properties": 0,
        "total_bookings": 0,
        "total_revenue": 0,
    })


@admin_proxy_bp.route("/stats/revenue", methods=["GET"])
def get_revenue_stats():
    return success_response(data={"revenue": [], "total": 0})


@admin_proxy_bp.route("/stats/bookings", methods=["GET"])
def get_booking_stats():
    return success_response(data={"bookings": [], "total": 0})


# ─── Verifications ──────────────────────────────────────────────────

@admin_proxy_bp.route("/verifications", methods=["GET"])
def get_verifications():
    return success_response(data={"verifications": [], "total": 0})


@admin_proxy_bp.route("/verifications/<verification_id>", methods=["GET"])
def get_verification(verification_id):
    return success_response(data={"verification": None})


@admin_proxy_bp.route("/verifications/<verification_id>/approve", methods=["POST"])
def approve_verification(verification_id):
    return success_response(message="Verification approved (stub).")


@admin_proxy_bp.route("/verifications/<verification_id>/reject", methods=["POST"])
def reject_verification(verification_id):
    return success_response(message="Verification rejected (stub).")
