-- =========================================================
-- GROUPTRIP LEDGER
-- PostgreSQL Database Schema
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Optional: keep public schema clean
CREATE SCHEMA IF NOT EXISTS grouptrip;

SET search_path TO grouptrip, public;


-- =========================================================
-- ENUM TYPES
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'trip_status'
    ) THEN
        CREATE TYPE trip_status AS ENUM (
            'planning',
            'active',
            'completed',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'participant_role'
    ) THEN
        CREATE TYPE participant_role AS ENUM (
            'organizer',
            'member'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'participant_status'
    ) THEN
        CREATE TYPE participant_status AS ENUM (
            'active',
            'removed'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'booking_type'
    ) THEN
        CREATE TYPE booking_type AS ENUM (
            'flight',
            'hotel',
            'activity',
            'transport',
            'other'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'booking_status'
    ) THEN
        CREATE TYPE booking_status AS ENUM (
            'confirmed',
            'pending',
            'cancelled',
            'refunded',
            'completed'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'split_method'
    ) THEN
        CREATE TYPE split_method AS ENUM (
            'equal',
            'custom',
            'percentage',
            'shares'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_status'
    ) THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',
            'completed',
            'failed',
            'refunded'
        );
    END IF;

END $$;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    email VARCHAR(254) UNIQUE NOT NULL,

    password_hash TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- TRIPS
-- =========================================================

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,

    destination VARCHAR(300) NOT NULL,

    description TEXT,

    start_date DATE,

    end_date DATE,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    budget NUMERIC(12,2),

    status trip_status NOT NULL DEFAULT 'planning',

    organizer_id UUID REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT trips_date_check
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        ),

    CONSTRAINT trips_budget_check
        CHECK (
            budget IS NULL OR budget >= 0
        )
);


-- =========================================================
-- PARTICIPANTS
-- =========================================================

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(254) NOT NULL,

    role participant_role NOT NULL DEFAULT 'member',

    status participant_status NOT NULL DEFAULT 'active',

    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    left_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT participant_leave_check
        CHECK (
            left_at IS NULL OR left_at >= joined_at
        )
);


-- =========================================================
-- BOOKINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    booking_type booking_type NOT NULL,

    provider VARCHAR(200),

    description TEXT,

    amount NUMERIC(12,2) NOT NULL,

    status booking_status NOT NULL DEFAULT 'confirmed',

    cancellation_policy TEXT,

    reference_number VARCHAR(100),

    start_datetime TIMESTAMPTZ,

    end_datetime TIMESTAMPTZ,

    location VARCHAR(400),

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT booking_amount_check
        CHECK (amount >= 0)
);


-- =========================================================
-- BOOKING PARTICIPANTS
-- Many-to-many relationship
-- =========================================================

CREATE TABLE IF NOT EXISTS booking_participants (
    booking_id UUID NOT NULL
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (booking_id, participant_id)
);


-- =========================================================
-- EXPENSES
-- =========================================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    booking_id UUID
        REFERENCES bookings(id)
        ON DELETE SET NULL,

    paid_by_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE RESTRICT,

    title VARCHAR(300) NOT NULL,

    description TEXT,

    amount NUMERIC(12,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    category VARCHAR(100),

    split_method split_method NOT NULL DEFAULT 'equal',

    receipt_url VARCHAR(500),

    expense_date DATE DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT expense_amount_check
        CHECK (amount >= 0)
);


-- =========================================================
-- EXPENSE SPLITS
-- =========================================================

CREATE TABLE IF NOT EXISTS expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    expense_id UUID NOT NULL
        REFERENCES expenses(id)
        ON DELETE CASCADE,

    participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE CASCADE,

    amount NUMERIC(12,2) NOT NULL,

    percentage NUMERIC(5,2),

    shares INTEGER,

    is_settled BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT expense_split_amount_check
        CHECK (amount >= 0),

    CONSTRAINT expense_split_percentage_check
        CHECK (
            percentage IS NULL
            OR (percentage >= 0 AND percentage <= 100)
        ),

    CONSTRAINT expense_split_shares_check
        CHECK (
            shares IS NULL OR shares > 0
        ),

    UNIQUE (expense_id, participant_id)
);


-- =========================================================
-- PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    from_participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE RESTRICT,

    to_participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    note TEXT,

    status payment_status NOT NULL DEFAULT 'completed',

    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payment_amount_check
        CHECK (amount > 0),

    CONSTRAINT payment_participant_check
        CHECK (from_participant_id <> to_participant_id)
);


-- =========================================================
-- SETTLEMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    from_participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE RESTRICT,

    to_participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    note TEXT,

    settled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT settlement_amount_check
        CHECK (amount > 0),

    CONSTRAINT settlement_participant_check
        CHECK (from_participant_id <> to_participant_id)
);


-- =========================================================
-- REFUNDS
-- =========================================================

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    expense_id UUID
        REFERENCES expenses(id)
        ON DELETE SET NULL,

    amount NUMERIC(12,2) NOT NULL,

    reason TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    refund_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT refund_amount_check
        CHECK (amount > 0)
);


-- =========================================================
-- ITINERARY
-- =========================================================

CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    booking_id UUID
        REFERENCES bookings(id)
        ON DELETE SET NULL,

    title VARCHAR(300) NOT NULL,

    description TEXT,

    item_type VARCHAR(50) NOT NULL DEFAULT 'other',

    date DATE,

    start_time TIME,

    end_time TIME,

    location VARCHAR(400),

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    notes TEXT,

    order_index INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- ITINERARY PARTICIPANTS
-- Allows personal itinerary
-- =========================================================

CREATE TABLE IF NOT EXISTS itinerary_participants (
    itinerary_item_id UUID NOT NULL
        REFERENCES itinerary_items(id)
        ON DELETE CASCADE,

    participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE CASCADE,

    PRIMARY KEY (itinerary_item_id, participant_id)
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID
        REFERENCES trips(id)
        ON DELETE CASCADE,

    participant_id UUID
        REFERENCES participants(id)
        ON DELETE CASCADE,

    type VARCHAR(100) NOT NULL,

    title VARCHAR(300) NOT NULL,

    message TEXT NOT NULL,

    channel VARCHAR(50) NOT NULL DEFAULT 'email',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_trips_organizer
    ON trips(organizer_id);

CREATE INDEX IF NOT EXISTS idx_participants_trip
    ON participants(trip_id);

CREATE INDEX IF NOT EXISTS idx_bookings_trip
    ON bookings(trip_id);

CREATE INDEX IF NOT EXISTS idx_booking_participants_participant
    ON booking_participants(participant_id);

CREATE INDEX IF NOT EXISTS idx_expenses_trip
    ON expenses(trip_id);

CREATE INDEX IF NOT EXISTS idx_expenses_paid_by
    ON expenses(paid_by_id);

CREATE INDEX IF NOT EXISTS idx_expense_splits_participant
    ON expense_splits(participant_id);

CREATE INDEX IF NOT EXISTS idx_payments_trip
    ON payments(trip_id);

CREATE INDEX IF NOT EXISTS idx_settlements_trip
    ON settlements(trip_id);

CREATE INDEX IF NOT EXISTS idx_refunds_booking
    ON refunds(booking_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_trip_date
    ON itinerary_items(trip_id, date);

CREATE INDEX IF NOT EXISTS idx_notifications_participant
    ON notifications(participant_id);


-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_trips_updated_at ON trips;
CREATE TRIGGER trg_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_participants_updated_at ON participants;
CREATE TRIGGER trg_participants_updated_at
BEFORE UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_expense_splits_updated_at ON expense_splits;
CREATE TRIGGER trg_expense_splits_updated_at
BEFORE UPDATE ON expense_splits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_settlements_updated_at ON settlements;
CREATE TRIGGER trg_settlements_updated_at
BEFORE UPDATE ON settlements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_refunds_updated_at ON refunds;
CREATE TRIGGER trg_refunds_updated_at
BEFORE UPDATE ON refunds
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_itinerary_updated_at ON itinerary_items;
CREATE TRIGGER trg_itinerary_updated_at
BEFORE UPDATE ON itinerary_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- BALANCE VIEW
-- =========================================================

CREATE OR REPLACE VIEW participant_balances AS

WITH paid AS (
    SELECT
        paid_by_id AS participant_id,
        SUM(amount) AS total_paid
    FROM expenses
    GROUP BY paid_by_id
),

owed AS (
    SELECT
        participant_id,
        SUM(amount) AS total_owed
    FROM expense_splits
    GROUP BY participant_id
),

received_payments AS (
    SELECT
        to_participant_id AS participant_id,
        SUM(amount) AS received
    FROM payments
    WHERE status = 'completed'
    GROUP BY to_participant_id
),

sent_payments AS (
    SELECT
        from_participant_id AS participant_id,
        SUM(amount) AS sent
    FROM payments
    WHERE status = 'completed'
    GROUP BY from_participant_id
)

SELECT
    p.id AS participant_id,
    p.trip_id,
    p.name,

    COALESCE(paid.total_paid, 0) AS total_paid,

    COALESCE(owed.total_owed, 0) AS total_owed,

    COALESCE(received_payments.received, 0) AS payments_received,

    COALESCE(sent_payments.sent, 0) AS payments_sent,

    (
        COALESCE(paid.total_paid, 0)
        - COALESCE(owed.total_owed, 0)
        - COALESCE(sent_payments.sent, 0)
        + COALESCE(received_payments.received, 0)
    ) AS balance

FROM participants p
LEFT JOIN paid
    ON p.id = paid.participant_id
LEFT JOIN owed
    ON p.id = owed.participant_id
LEFT JOIN received_payments
    ON p.id = received_payments.participant_id
LEFT JOIN sent_payments
    ON p.id = sent_payments.participant_id;