import difflib
import json
import re
import uuid

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from models.participant import Participant, ParticipantStatus
from schemas.nl_expense import ParseExpenseResponse, ParsedSplit

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

CATEGORIES = [
    "Food & Dining",
    "Transportation",
    "Accommodation",
    "Activities & Tours",
    "Groceries & Supplies",
    "Entertainment",
    "Shopping",
    "Emergency / Medical",
    "Other",
]

SELF_WORDS = {"me", "i", "myself", "my", "self"}
WIDE_RE = re.compile(
    r"\b(all|everyone|everybody|each of us|entire group|whole group|"
    r"all members|rest of (?:the )?(?:group|us|them))\b",
    re.I,
)

SYSTEM_PROMPT = f"""You extract expense details from one sentence.
Reply with ONLY a JSON object, no markdown, no explanation, with these keys:
- amount: total bill as a number (read "2,400" as 2400, "2.4k" as 2400). If only line items are given, add them up.
- currency: 3-letter code, default "INR" (₹, rs, rupees = INR; $ = USD)
- title: short label such as "Dinner" or "Uber ride"
- category: exactly one of {CATEGORIES}
- payer: name of who paid as written, or "me" if the speaker paid or it is not stated
- participants: names the cost is shared between, as written ("me" for the speaker). Use [] if everyone.
- weights: object name -> number of shares that person counts as. Use for "Rahul with his wife counts as 2" or "Aman's family of 4". {{}} if none. Default is 1.
- households: array of arrays of names that together count as ONE share, for example a couple paying together: [["Rahul","Priya"]]. [] if none.
- items: array of {{"name": string, "amount": number, "for": [names]}} for separately listed line items. "for" is the people who had that item; [] means shared by everyone in the split. [] if the bill is not itemised.
- fixed_amounts: object name -> exact amount that person owes, ONLY when the sentence states that person's own share ("Rahul's share was 500"). {{}} otherwise. Never put the total here.
- split_method: "equal" (the server decides the real method)
- items: an EXTRA amount on top of the shared split for a person or a group. "Omkar had a beer for 1000" -> {{"name":"Beer","amount":1000,"for":["Omkar"]}}. The rest of the bill is then shared by remainder_among.
- fixed_amounts: ONLY when a person's WHOLE share is stated ("Rahul's share was 500", "Rahul owes 500"). That person is then left out of the rest split.
- percentages: object name -> percent of the WHOLE bill that person owes ("Rahul pays 30%"). {{}} if none. That person is then left out of the rest split.
- exclude: names left out entirely ("everyone except Aman", "Aman didn't have any"). [] if none.
- remainder_among: who shares whatever is left after items / fixed_amounts / percentages. Use "all" for everyone / all participants / the rest of the group / all of us, a list of names when specific people are named, or "" when the whole bill is simply split among "participants".
- amount: if a TOTAL / bill is stated, use it exactly. Never add the items to it.
- Never put the total in fixed_amounts.

Examples:
"Omkar bought a beer for 1000 and total bill was 4000, rest split equally among all the participants" ->
{{"amount":4000,"title":"Dinner","payer":"Omkar","participants":[],"items":[{{"name":"Beer","amount":1000,"for":["Omkar"]}}],"remainder_among":"all"}}
"Dinner 1500 for me, Rahul and Aman. Pizza 600, Aman's beer 250, split the rest" ->
{{"amount":1500,"participants":["me","Rahul","Aman"],"items":[{{"name":"Pizza","amount":600,"for":[]}},{{"name":"Beer","amount":250,"for":["Aman"]}}],"remainder_among":""}}
"Taxi 900 paid by Priya, everyone except Rahul" ->
{{"amount":900,"payer":"Priya","participants":[],"exclude":["Rahul"],"remainder_among":"all"}}
"Hotel 8000, Rahul pays 50%, rest split equally among everyone else" ->
{{"amount":8000,"percentages":{{"Rahul":50}},"remainder_among":"all"}}
"""


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", (s or "").lower()).strip()


def _resolve(name: str, people: list[Participant], me: Participant | None):
    n = _norm(name)
    if not n:
        return None
    if n in SELF_WORDS:
        return me

    exact = [p for p in people if _norm(p.name) == n]
    if len(exact) == 1:
        return exact[0]

    first = [p for p in people if _norm(p.name).split()[:1] == n.split()[:1]]
    if len(first) == 1:
        return first[0]
    if len(first) > 1:
        return None  # ambiguous, e.g. two people named Rahul

    names = {_norm(p.name): p for p in people}
    close = difflib.get_close_matches(n, list(names.keys()), n=1, cutoff=0.75)
    if close:
        return names[close[0]]

    firsts = {_norm(p.name).split()[0]: p for p in people if _norm(p.name)}
    close = difflib.get_close_matches(n, list(firsts.keys()), n=1, cutoff=0.75)
    return firsts[close[0]] if close else None

def _allocate(cents: int, weights: dict) -> dict:
    """Split cents by weight. Amounts always add back up to exactly `cents`."""
    total_w = sum(weights.values())
    if cents <= 0 or total_w <= 0:
        return {k: 0 for k in weights}
    raw = {k: cents * w / total_w for k, w in weights.items()}
    out = {k: int(v) for k, v in raw.items()}
    leftover = cents - sum(out.values())
    for k in sorted(raw, key=lambda k: raw[k] - out[k], reverse=True)[:leftover]:
        out[k] += 1
    return out


async def _ask_llm(text: str) -> dict:
    key = settings.effective_groq_api_key
    if not key:
        raise HTTPException(503, "GROQ_API_KEY is not set on the server.")

    last_error = None
    async with httpx.AsyncClient(timeout=20) as client:
        for model in MODELS:
            try:
                r = await client.post(
                    GROQ_URL,
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": model,
                        "temperature": 0,
                        "max_tokens": 1200,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": text},
                        ],
                    },
                )
                r.raise_for_status()
                content = r.json()["choices"][0]["message"]["content"]
                match = re.search(r"\{.*\}", content, re.S)
                if match:
                    return json.loads(match.group(0))
            except Exception as e:  # try the next model
                last_error = e

    raise HTTPException(502, f"Could not read that sentence ({last_error}).")


async def parse_expense(
    db: AsyncSession, user, trip_id: uuid.UUID, text: str
) -> ParseExpenseResponse:
    result = await db.execute(
        select(Participant).where(
            Participant.trip_id == trip_id,
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

    data = await _ask_llm(text)

    unresolved: list[str] = []

    def find(name):
        p = _resolve(str(name), people, me)
        if p is None:
            unresolved.append(str(name))
        return p

    # ---- who is in the split -------------------------------------------
    names = data.get("participants") or []
    if not isinstance(names, list):
        names = []
    chosen: list[Participant] = []

    def add(p):
        if p and p.id not in {c.id for c in chosen}:
            chosen.append(p)

    for n in names:
        add(find(n))

    payer = find(data.get("payer") or "me")

    excluded_ids = set()
    for n in data.get("exclude") or []:
        p = find(n)
        if p:
            excluded_ids.add(p.id)

    # who shares "the rest": everyone, named people, or the listed participants
    ra = data.get("remainder_among")
    rest_group: list[Participant] = []
    if isinstance(ra, list) and ra:
        rest_group = [p for p in (find(n) for n in ra) if p]
    elif isinstance(ra, str) and ra.strip().lower() in ("all", "everyone", "everybody"):
        rest_group = list(people)
    elif not names:
        rest_group = list(people)
    elif ra is None and WIDE_RE.search(text or ""):
        rest_group = list(people)
    if not rest_group:
        rest_group = list(chosen) if chosen else list(people)
    rest_group = [p for p in rest_group if p.id not in excluded_ids]
    for p in rest_group:
        add(p)

    # ---- weights and households ----------------------------------------
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

    for group in data.get("households") or []:
        if not isinstance(group, list):
            continue
        members = [m for m in (find(n) for n in group) if m]
        if len(members) > 1:
            for m in members:
                add(m)
                weights.setdefault(m.id, 1 / len(members))

    # ---- items (extras on top of the shared split) ---------------------
    items = []
    raw_items = data.get("items") or []
    if isinstance(raw_items, list):
        for it in raw_items:
            try:
                a = round(float(it.get("amount")) * 100)
            except (AttributeError, TypeError, ValueError):
                continue
            if a <= 0:
                continue
            who = [p for p in (find(n) for n in (it.get("for") or [])) if p]
            for p in who:
                add(p)
            items.append((str(it.get("name") or "Item"), a, who))

    # ---- amount ---------------------------------------------------------
    try:
        amount = float(data["amount"])
    except (KeyError, TypeError, ValueError):
        amount = sum(a for _, a, _ in items) / 100 if items else 0
    if amount <= 0:
        raise HTTPException(422, "I couldn't find an amount in that sentence.")
    total = round(amount * 100)

    # ---- whole-share claims: fixed amounts and percentages -------------
    claimed: dict = {}
    raw_f = data.get("fixed_amounts") or {}
    if isinstance(raw_f, dict):
        for n, v in raw_f.items():
            p = find(n)
            try:
                c = round(float(v) * 100)
            except (TypeError, ValueError):
                continue
            if p and c > 0 and c < total:      # a "share" equal to the total is a mistake
                claimed[p.id] = c
                add(p)
    raw_p = data.get("percentages") or {}
    if isinstance(raw_p, dict):
        for n, v in raw_p.items():
            p = find(n)
            try:
                c = round(total * float(v) / 100)
            except (TypeError, ValueError):
                continue
            if p and c > 0:
                claimed[p.id] = c
                add(p)

    if unresolved:
        raise HTTPException(
            422,
            "I couldn't match: "
            + ", ".join(dict.fromkeys(unresolved))
            + ". Check the names on the Participants page, and make sure your "
            "login email is added as a participant.",
        )

    chosen = [p for p in chosen if p.id not in excluded_ids]
    rest_group = [p for p in rest_group if p.id not in excluded_ids]

    # ---- calculate ------------------------------------------------------
    per = {p.id: 0 for p in chosen}
    notes: list[str] = []

    def w_for(group):
        return {p.id: weights.get(p.id, 1.0) for p in group}

    spent = sum(a for _, a, _ in items)
    claimed_total = sum(claimed.values())
    if spent + claimed_total > total:
        raise HTTPException(
            422, "The listed items and stated shares add up to more than the total amount."
        )

    for name, a, who in items:
        group = [p for p in (who or rest_group) if p.id not in claimed]
        if not group:
            group = who or rest_group
        for pid, c in _allocate(a, w_for(group)).items():
            per[pid] = per.get(pid, 0) + c
        notes.append(
            f"{name} ₹{a / 100:.2f} → "
            + (", ".join(p.name for p in who) if who else "everyone")
        )

    for pid, c in claimed.items():
        per[pid] = per.get(pid, 0) + c
    if claimed:
        notes.append(
            "Stated shares: "
            + ", ".join(f"{p.name} ₹{claimed[p.id] / 100:.2f}" for p in chosen if p.id in claimed)
        )

    rest = total - spent - claimed_total
    rest_people = [p for p in rest_group if p.id not in claimed]
    if rest > 0:
        if not rest_people:
            raise HTTPException(
                422,
                f"₹{rest / 100:.2f} is left over but I can't tell who shares it. "
                "Say who splits the rest, e.g. 'rest split equally among everyone'.",
            )
        for pid, c in _allocate(rest, w_for(rest_people)).items():
            per[pid] = per.get(pid, 0) + c
        if items or claimed:
            notes.append(
                f"Remaining ₹{rest / 100:.2f} split among "
                + ("everyone" if len(rest_people) == len(people) else ", ".join(p.name for p in rest_people))
            )

    if any(weights.get(p.id, 1.0) != 1.0 for p in chosen):
        notes.append(
            "Shares: "
            + ", ".join(f"{p.name} ×{weights.get(p.id, 1.0):.2g}" for p in chosen)
        )

    uneven = bool(items or claimed) or any(
        weights.get(p.id, 1.0) != 1.0 for p in chosen
    )
    split_method = "custom" if uneven else "equal"

    splits = [
        ParsedSplit(participant_id=p.id, name=p.name, amount=per[p.id] / 100)
        for p in chosen
        if per[p.id] > 0
    ]
    if not splits:
        raise HTTPException(422, "Nobody ended up owing anything.")
    if len(splits) == 1 and splits[0].participant_id == payer.id and len(people) > 1:
        raise HTTPException(
            422,
            "That would leave only the payer owing everything. Say who shares the bill, "
            "e.g. 'split equally among everyone'.",
        )

    category = data.get("category")
    if category not in CATEGORIES:
        category = "Other"

    return ParseExpenseResponse(
        title=(data.get("title") or "Expense")[:300],
        amount=amount,
        currency=(data.get("currency") or "INR").upper()[:10],
        category=category,
        split_method=split_method,
        paid_by_id=payer.id,
        paid_by_name=payer.name,
        splits=splits,
        notes=notes,
    )