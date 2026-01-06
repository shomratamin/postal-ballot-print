-- Migration generated on 2026-01-06 12:11:12
-- Total operations: 2

-- [1] Drop unique constraint addresses.phone_no
-- Type: drop_constraint
-- Table: addresses
-- Column: phone_no
ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "uq_addresses_phone_no";

-- [2] Drop unique constraint returning_addresses.zip_code
-- Type: drop_constraint
-- Table: returning_addresses
-- Column: zip_code
ALTER TABLE "returning_addresses" DROP CONSTRAINT IF EXISTS "uq_returning_addresses_zip_code";

