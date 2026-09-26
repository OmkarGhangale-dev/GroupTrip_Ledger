import json
import re

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from models.participant import Participant, ParticipantStatus
from schemas.nl_expense import ParsedSplit
from schemas.receipt_split import ReceiptSplitRequest, ReceiptSplitResult
from services.nl_expense_service import GROQ_URL, MODELS, _allocate, _norm, _resolve

SYSTEM_PROMPT = """You help split a restaurant or shop bill between friends.
You get the list of receipt items (numbered from 0) and one instruction from the user.
Reply with ONLY a JSON object, no markdown, no explanation, with these keys:
- item_assignments: array of {"items": [item numbers], "for": [names]}. Use it when the instruction says who had specific items. The people in "for" share those items equally. Items not mentioned are shared by everyone in the split.
- participants: names included in the split, as written ("me" for the speaker). [] means everyone on the trip.
- excluded: names who are NOT part of the split at all. [] if none.
- weights: object name -> number of shares that person counts as (for example a couple counts as 2). {} if none.
- fixed_amounts: object name -> exact amount that person pays in total. {} if none.
- percentages: object name -> percent of the bill that person pays. {} if none.
- payer: name of who paid the bill, or null if not said.
Rules: never invent names or items. Use item numbers exactly as given."""


async def _ask(system: str, user: str) -> dict:
    key = settings.effective_groq_api_key
    if not key:
        raise HTTPException(503, "GROQ_API_KEY is not set on the server.")

    last = None
    async with httpx.AsyncClient(timeout=25) as client:
        for model in MODELS:
            try:
                r = await client.post(
                    GROQ_URL,
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": model,
                        "temperature": 0,
                        "max_tokens": 700,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    },
                )
                r.raise_for_status()
                content = r.json()["choices"][0]["message"]["content"] or ""
                m = re.search(r"\{.*\}", content, re.S)
                if m:
                    return json.loads(m.group(0))
            except Exception as e:
                last = e
    raise HTTPException(502, f"Could not understand that instruction ({last}).")


async def split_receipt(
    db: AsyncSession, user, req: ReceiptSplitRequest
) -> ReceiptSplitResult:
    result = await db.execute(
        select(Participant).where(
            Participant.trip_id == req.trip_id,
            Participant.status == ParticipantStatus.ACTIVE,
        )
    )
    people = list(result.scalars().all())
    if not people:
        raise HTTPException(404, "This trip has no active participants.")

    me = next(
        (p for p in people if p.email and p.email.lower() == user.email.lower()),
        None,
    ) or next((p for p in people if _norm(p.name) == _norm(user.name)), None)

    items = req.line_items
    listing = (
        "\n".join(f"{i}: {it.item_name} ({it.item_total})" for i, it in enumerate(items))
        or "(no items were read)"
    )
    data = await _ask(
        SYSTEM_PROMPT,
        f"Trip members: {', '.join(p.name for p in people)}\n"
        f"Receipt items:\n{listing}\n"
        f"Instruction: {req.text}",
    )

    unresolved: list[str] = []

    def find(name):
        p = _resolve(str(name), people, me)
        if p is None:
            unresolved.append(str(name))
        return p

    names = data.get("participants") or []
    chosen: list[Participant] = [] if names else list(people)

    def add(p):
        if p and p.id not in {c.id for c in chosen}:
            chosen.append(p)

    for n in names:
        add(find(n))

    excluded: set = set()
    for n in data.get("excluded") or []:
        p = find(n)
        if p:
            excluded.add(p.id)

    weights: dict = {}
    raw_w = data.get("weights") or {}
    if isinstance(raw_w, dict):
        for n, w in raw_w.items():
            p = find(n)
            try:
                wv = float(w)
            except (TypeError, ValueError):
                continue
            if p and wv > 0:
                weights[p.id] = wv
                add(p)

    assignments = []
    for a in data.get("item_assignments") or []:
        if not isinstance(a, dict):
            continue
        who = [p for p in (find(n) for n in (a.get("for") or [])) if p]
        idxs = []
        for i in a.get("items") or []:
            try:
                k = int(i)
            except (TypeError, ValueError):
                continue
            if 0 <= k < len(items):
                idxs.append(k)
        if who and idxs:
            for p in who:
                add(p)
            assignments.append((idxs, who))

    total = round(req.total_amount * 100)
    fixed: dict = {}
    if not assignments:
        raw_f = data.get("fixed_amounts") or {}
        if isinstance(raw_f, dict):
            for n, v in raw_f.items():
                p = find(n)
                try:
                    c = round(float(v) * 100)
                except (TypeError, ValueError):
                    continue
                if p and c > 0:
                    fixed[p.id] = c
                    add(p)
        raw_p = data.get("percentages") or {}
        if isinstance(raw_p, dict):
            for n, v in raw_p.items():
                p = find(n)
                try:
                    pv = float(v)
                except (TypeError, ValueError):
                    continue
                if p and 0 < pv <= 100:
                    fixed[p.id] = round(total * pv / 100)
                    add(p)

    payer = find(data["payer"]) if data.get("payer") else None

    if unresolved:
        raise HTTPException(
            422,
            "I couldn't match: "
            + ", ".join(dict.fromkeys(unresolved))
            + ". Check the names on the Participants page.",
        )

    chosen = [p for p in chosen if p.id not in excluded]
    if not chosen:
        raise HTTPException(422, "Nobody is left in the split.")

    per = {p.id: 0 for p in chosen}
    notes: list[str] = []

    def w_for(group):
        return {p.id: weights.get(p.id, 1.0) for p in group}

    if assignments:
        item_cents = [round((it.item_total or 0) * 100) for it in items]
        used: set = set()

        for idxs, who in assignments:
            who = [p for p in who if p.id in per]
            fresh = [k for k in idxs if k not in used]
            if not who or not fresh:
                continue
            used.update(fresh)
            cents = sum(item_cents[k] for k in fresh)
            for pid, c in _allocate(cents, w_for(who)).items():
                per[pid] += c
            notes.append(
                ", ".join(items[k].item_name for k in fresh)
                + " → " + ", ".join(p.name for p in who)
            )

        shared = sum(item_cents[k] for k in range(len(items)) if k not in used)
        if shared:
            for pid, c in _allocate(shared, w_for(chosen)).items():
                per[pid] += c
            notes.append(f"Remaining items shared by {len(chosen)} people")

        extra = total - sum(item_cents)  # tax, service charge, discounts
        if extra != 0:
            basis = {pid: float(c) for pid, c in per.items() if c > 0} or {
                p.id: 1.0 for p in chosen
            }
            sign = 1 if extra > 0 else -1
            for pid, c in _allocate(abs(extra), basis).items():
                per[pid] += sign * c
            notes.append(
                f"Tax and charges ₹{extra / 100:.2f} shared in proportion to what each person had"
            )

    elif fixed:
        remaining = total - sum(fixed.values())
        rest_people = [p for p in chosen if p.id not in fixed]
        if remaining < 0:
            raise HTTPException(422, "The stated shares add up to more than the bill.")
        if rest_people:
            if remaining <= 0:
                raise HTTPException(
                    422, "The stated shares use up the whole bill, nothing is left for the others."
                )
            for pid, c in _allocate(remaining, w_for(rest_people)).items():
                per[pid] = c
        elif remaining != 0:
            raise HTTPException(422, "The stated shares do not add up to the bill.")
        per.update(fixed)
        notes.append(
            "Stated shares: "
            + ", ".join(f"{p.name} ₹{fixed[p.id] / 100:.2f}" for p in chosen if p.id in fixed)
        )

    else:
        for pid, c in _allocate(total, w_for(chosen)).items():
            per[pid] = c

    # make sure the parts add up to the bill exactly
    diff = total - sum(per.values())
    if diff != 0:
        top = max(per, key=lambda k: per[k])
        per[top] += diff

    splits = [
        ParsedSplit(participant_id=p.id, name=p.name, amount=per[p.id] / 100)
        for p in chosen
        if per[p.id] > 0
    ]
    if not splits:
        raise HTTPException(422, "Nobody ended up owing anything.")

    return ReceiptSplitResult(
        split_method="custom",
        paid_by_id=payer.id if payer else None,
        splits=splits,
        notes=notes,
    )