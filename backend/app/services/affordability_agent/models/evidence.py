from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel


class EvidenceType(str, Enum):
    financial_event = "financial_event"
    message = "message"
    image = "image"
    payment_option = "payment_option"
    profile = "profile"
    exchange_rate = "exchange_rate"

class EvidenceRecord(BaseModel):
    evidence_id: str
    evidence_type: EvidenceType
    source_identifier: str
    user_id: str
    request_id: str | None = None
    event_id: str | None = None
    observed_at: date | None = None
    payload: dict[str, Any]
    source_priority: int

class MessageInterpretation(BaseModel):
    message_id: str
    interpretation_type: str
    target_event_id: str | None = None
    effective_date: date | None = None
    amount: float | None = None
    currency: str | None = None
    new_status: str | None = None
    description: str
    confidence: float

class ImageInterpretation(BaseModel):
    image_id: str
    document_type: str
    amount: float | None = None
    currency: str | None = None
    document_date: date | None = None
    merchant_or_payer: str | None = None
    description: str | None = None
    confidence: float
    extraction_notes: str

class Message(BaseModel):
    message_id: str
    user_id: str
    related_request_id: str | None = None
    related_event_id: str | None = None
    source_type: str
    message_date: str
    message_text: str

class ImageEvidence(BaseModel):
    image_id: str
    user_id: str
    related_request_id: str | None = None
    related_event_id: str | None = None
    image_type: str
