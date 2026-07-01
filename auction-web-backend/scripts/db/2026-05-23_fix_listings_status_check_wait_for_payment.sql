-- Fix: allow WAIT_FOR_PAYMENT in listings.status CHECK constraint
--
-- Context:
-- - The application maps Listing.status using @Enumerated(EnumType.STRING).
-- - Hibernate can create a PostgreSQL CHECK constraint for enum columns.
-- - With spring.jpa.hibernate.ddl-auto=update, Hibernate will NOT update existing CHECK constraints.
--
-- Symptom:
-- - Auction finishing fails with:
--     "violates check constraint \"listings_status_check\"" when trying to persist status = WAIT_FOR_PAYMENT
--
-- Run this script ONCE on an existing database.

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN (
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'ARCHIVED',
    'SOLD',
    'WAIT_FOR_PAYMENT'
  ));
