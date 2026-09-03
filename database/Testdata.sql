SET search_path TO grouptrip, public;

INSERT INTO users (name, email)
VALUES ('Rohan', 'rohan@example.com')
RETURNING *;

INSERT INTO trips
(
    name,
    destination,
    description,
    start_date,
    end_date,
    currency,
    budget,
    organizer_id
)
SELECT
    'Goa Group Trip',
    'Goa, India',
    'Group travel demo',
    '2026-09-10',
    '2026-09-13',
    'INR',
    50000,
    id
FROM users
WHERE email = 'rohan@example.com'
RETURNING *;

SELECT * FROM grouptrip.trips;

INSERT INTO participants
(trip_id, name, email, role)
SELECT
    t.id,
    p.name,
    p.email,
    p.role::participant_role
FROM trips t
CROSS JOIN (
    VALUES
    ('Rohan', 'rohan@example.com', 'organizer'),
    ('Aarav', 'aarav@example.com', 'member'),
    ('Priya', 'priya@example.com', 'member'),
    ('Neha', 'neha@example.com', 'member'),
    ('Kabir', 'kabir@example.com', 'member')
) AS p(name, email, role)
WHERE t.name = 'Goa Group Trip';

SELECT
    name,
    email,
    role
FROM grouptrip.participants;

INSERT INTO bookings
(
    trip_id,
    booking_type,
    provider,
    description,
    amount,
    status,
    location
)
SELECT
    id,
    'hotel',
    'Goa Beach Resort',
    '3 night stay',
    15000,
    'confirmed',
    'Baga, Goa'
FROM trips
WHERE name = 'Goa Group Trip'
RETURNING *;

INSERT INTO booking_participants
(booking_id, participant_id)

SELECT
    b.id,
    p.id

FROM bookings b

JOIN participants p
    ON p.trip_id = b.trip_id

WHERE
    b.provider = 'Goa Beach Resort'
    AND b.description = '3 night stay';

INSERT INTO expenses
(
    trip_id,
    booking_id,
    paid_by_id,
    title,
    description,
    amount,
    category,
    split_method
)

SELECT
    b.trip_id,
    b.id,
    p.id,
    'Hotel Expense',
    'Goa Beach Resort',
    15000,
    'Accommodation',
    'equal'

FROM bookings b

JOIN participants p
    ON p.trip_id = b.trip_id

WHERE
    b.provider = 'Goa Beach Resort'
    AND p.name = 'Rohan'
RETURNING *;


INSERT INTO expense_splits
(
    expense_id,
    participant_id,
    amount
)

SELECT
    e.id,
    p.id,
    3000

FROM expenses e

JOIN participants p
    ON p.trip_id = e.trip_id

WHERE e.title = 'Hotel Expense';



SELECT
    p.name,
    es.amount

FROM expense_splits es

JOIN participants p
    ON p.id = es.participant_id;

SELECT
    p.name,

    COALESCE(
        (
            SELECT SUM(e.amount)
            FROM expenses e
            WHERE e.paid_by_id = p.id
        ), 0
    ) AS paid,

    COALESCE(
        (
            SELECT SUM(es.amount)
            FROM expense_splits es
            WHERE es.participant_id = p.id
        ), 0
    ) AS owed

FROM participants p;