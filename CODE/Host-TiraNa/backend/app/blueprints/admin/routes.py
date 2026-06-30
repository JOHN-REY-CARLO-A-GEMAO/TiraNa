from flask import request, jsonify
from app.blueprints.admin import admin_bp
from app.middleware.internal_auth import internal_api_required
from app.models.property import Property
from app.models.host import Host
from app.extensions import db
from app.utils.response import success_response, error_response
import requests
import os

CLIENT_API_URL = os.getenv("CLIENT_API_URL", "http://localhost:5000")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "tirana-internal-secret-key")

@admin_bp.route("/stats", methods=["GET"])
@internal_api_required
def get_stats():
    total_hosts = Host.query.count()
    total_properties = Property.query.count()

    # Try to get stats from client backend
    try:
        response = requests.get(
            f"{CLIENT_API_URL}/api/stats/summary",
            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            timeout=5
        )
        client_stats = response.json().get("data", {}) if response.status_code == 200 else {}
    except Exception:
        client_stats = {}

    return success_response(data={
        "total_hosts": total_hosts,
        "total_properties": total_properties,
        "total_bookings": client_stats.get("total_bookings", 0),
        "total_revenue": client_stats.get("total_revenue", 0)
    })

@admin_bp.route("/rooms", methods=["GET"])
@internal_api_required
def get_rooms():
    status = request.args.get("status")
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 50))

    query = Property.query
    if status:
        query = query.filter_by(status=status)

    properties = query.offset(skip).limit(limit).all()
    # Simplified room data for admin
    rooms_data = [{
        "id": p.id,
        "title": p.title,
        "status": p.status,
        "host_id": p.host_id,
        "base_price": float(p.base_price),
        "created_at": p.created_at.isoformat() if p.created_at else None
    } for p in properties]

    return success_response(data={"rooms": rooms_data})

@admin_bp.route("/rooms/<int:room_id>/approve", methods=["POST"])
@internal_api_required
def approve_room(room_id):
    prop = Property.query.get_or_404(room_id)
    prop.status = "active"
    db.session.commit()
    return success_response(message="Room approved successfully")

@admin_bp.route("/rooms/<int:room_id>/reject", methods=["POST"])
@internal_api_required
def reject_room(room_id):
    prop = Property.query.get_or_404(room_id)
    prop.status = "rejected"
    db.session.commit()
    return success_response(message="Room rejected")

@admin_bp.route("/bookings", methods=["GET"])
@internal_api_required
def get_bookings():
    # Proxy to client backend
    try:
        response = requests.get(
            f"{CLIENT_API_URL}/api/host/bookings/property-bookings",
            params=request.args,
            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            timeout=5
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return error_response(str(e), status=500)

@admin_bp.route("/reviews", methods=["GET"])
@internal_api_required
def get_reviews():
    # Proxy to client backend
    try:
        response = requests.get(
            f"{CLIENT_API_URL}/api/host/reviews/property-reviews",
            params=request.args,
            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            timeout=5
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return error_response(str(e), status=500)
