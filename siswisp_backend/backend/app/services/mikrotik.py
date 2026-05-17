"""
Servicio de integración con MikroTik RouterOS.
Permite cortar y reactivar clientes usando routeros-api.
"""
import routeros_api
from app.core.config import settings


def _get_connection():
    """Crea conexión a MikroTik RouterOS."""
    pool = routeros_api.RouterOsApiPool(
        settings.MIKROTIK_HOST,
        username=settings.MIKROTIK_USER,
        password=settings.MIKROTIK_PASSWORD,
        plaintext_login=True,
    )
    return pool.get_api()


def suspend_client(ip_address: str, client_name: str = "") -> dict:
    """
    Bloquea al cliente en MikroTik agregando una regla de firewall.
    Retorna {"success": True/False, "message": str}
    """
    if not ip_address:
        return {"success": False, "message": "El cliente no tiene IP asignada"}
    try:
        api = _get_connection()
        firewall = api.get_resource("/ip/firewall/address-list")
        firewall.add(
            **{
                "list": "clientes-suspendidos",
                "address": ip_address,
                "comment": f"SISWISP: {client_name}",
            }
        )
        return {"success": True, "message": f"Cliente {ip_address} suspendido"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def reactivate_client(ip_address: str) -> dict:
    """
    Elimina la regla de bloqueo del cliente en MikroTik.
    """
    if not ip_address:
        return {"success": False, "message": "El cliente no tiene IP asignada"}
    try:
        api = _get_connection()
        firewall = api.get_resource("/ip/firewall/address-list")
        entries = firewall.get(**{"address": ip_address, "list": "clientes-suspendidos"})
        for entry in entries:
            firewall.remove(id=entry["id"])
        return {"success": True, "message": f"Cliente {ip_address} reactivado"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def get_active_leases() -> list:
    """
    Obtiene todos los leases DHCP activos en MikroTik.
    Útil para ver clientes conectados en tiempo real.
    """
    try:
        api = _get_connection()
        dhcp = api.get_resource("/ip/dhcp-server/lease")
        leases = dhcp.get()
        return [
            {
                "ip": l.get("address", ""),
                "mac": l.get("mac-address", ""),
                "hostname": l.get("host-name", ""),
                "status": l.get("status", ""),
            }
            for l in leases
        ]
    except Exception as e:
        return []


def ping_client(ip_address: str) -> dict:
    """
    Hace ping a un cliente desde el MikroTik.
    Retorna si está online o no.
    """
    try:
        api = _get_connection()
        ping = api.get_resource("/ping")
        result = ping.call("", {"address": ip_address, "count": "3"})
        received = int(result[-1].get("received", 0)) if result else 0
        return {
            "online": received > 0,
            "packets_received": received,
            "ip": ip_address,
        }
    except Exception as e:
        return {"online": False, "ip": ip_address, "error": str(e)}
