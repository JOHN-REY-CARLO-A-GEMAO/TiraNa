from flask import Blueprint

admin_proxy_bp = Blueprint("admin_proxy", __name__, url_prefix="/api/admin")

from app.blueprints.admin_proxy import routes
