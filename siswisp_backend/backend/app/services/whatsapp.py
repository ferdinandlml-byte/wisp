"""
Servicio de WhatsApp usando Evolution API (self-hosted, gratuito).
Envía mensajes de cobro, avisos de vencimiento y confirmaciones.
"""
import httpx
from app.core.config import settings


def _headers() -> dict:
    return {
        "apikey": settings.EVOLUTION_API_KEY,
        "Content-Type": "application/json",
    }


def _base_url() -> str:
    return f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}"


async def send_message(phone: str, message: str) -> dict:
    """
    Envía un mensaje de WhatsApp.
    phone: número con código de país, ej: "5219991234567"
    """
    if not phone or not settings.EVOLUTION_API_URL:
        return {"success": False, "message": "WhatsApp no configurado"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                _base_url(),
                headers=_headers(),
                json={"number": phone, "text": message},
            )
            resp.raise_for_status()
            return {"success": True, "message": "Mensaje enviado"}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def send_payment_reminder(client_name: str, phone: str, amount: float, due_date: str) -> dict:
    """Envía recordatorio de pago 3 días antes del vencimiento."""
    msg = (
        f"👋 Hola *{client_name}*,\n\n"
        f"Te recordamos que tu mensualidad de *${amount:.2f}* "
        f"vence el *{due_date}*.\n\n"
        f"Por favor realiza tu pago a tiempo para evitar la suspensión del servicio.\n\n"
        f"¡Gracias por preferirnos! 🌐"
    )
    return await send_message(phone, msg)


async def send_suspension_notice(client_name: str, phone: str, amount: float) -> dict:
    """Avisa al cliente que su servicio fue suspendido."""
    msg = (
        f"⚠️ *{client_name}*, tu servicio de internet ha sido *suspendido* "
        f"por falta de pago de *${amount:.2f}*.\n\n"
        f"Para reactivarlo, realiza tu pago y contáctanos. 📞"
    )
    return await send_message(phone, msg)


async def send_reactivation_notice(client_name: str, phone: str) -> dict:
    """Avisa al cliente que su servicio fue reactivado."""
    msg = (
        f"✅ *{client_name}*, tu servicio de internet ha sido *reactivado*.\n\n"
        f"¡Ya puedes disfrutar tu conexión! Gracias por tu pago. 🌐"
    )
    return await send_message(phone, msg)


async def send_payment_confirmation(client_name: str, phone: str, amount: float, month: str) -> dict:
    """Confirma que se registró el pago."""
    msg = (
        f"✅ *{client_name}*, hemos registrado tu pago de *${amount:.2f}* "
        f"correspondiente a *{month}*.\n\n"
        f"¡Gracias por tu puntualidad! 🙏"
    )
    return await send_message(phone, msg)
