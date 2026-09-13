import pandas as pd

from ..models.event import FinancialEvent
from ..models.resolved_event import ResolvedFinancialEvent


class EvidenceResolver:
    def resolve_event(self, event: FinancialEvent, related_messages, related_images) -> ResolvedFinancialEvent:
        status = 'source_complete'
        evidence_ids = []

        if pd.isna(event.amount) or event.amount is None:
            if related_images:
                status = 'image_required'
                evidence_ids.extend([img['image_id'] for img in related_images])
            else:
                status = 'unresolved'

        if related_messages:
            evidence_ids.extend([msg['message_id'] for msg in related_messages])
            if status == 'source_complete':
                status = 'message_amended'

        return ResolvedFinancialEvent(
            **event.model_dump(),
            evidence_ids=evidence_ids,
            amount_source='original' if status == 'source_complete' else 'evidence',
            resolution_status=status
        )
