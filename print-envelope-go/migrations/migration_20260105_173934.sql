-- Migration generated on 2026-01-05 17:39:34
-- Total operations: 9

-- [1] Allow addresses.recipient_fore_name to be NULL
-- Type: modify_column
-- Table: addresses
-- Column: recipient_fore_name
ALTER TABLE "addresses" ALTER COLUMN "recipient_fore_name" DROP NOT NULL;

-- [2] Allow addresses.postal_address to be NULL
-- Type: modify_column
-- Table: addresses
-- Column: postal_address
ALTER TABLE "addresses" ALTER COLUMN "postal_address" DROP NOT NULL;

-- [3] Allow addresses.zip_code to be NULL
-- Type: modify_column
-- Table: addresses
-- Column: zip_code
ALTER TABLE "addresses" ALTER COLUMN "zip_code" DROP NOT NULL;

-- [4] Allow addresses.city to be NULL
-- Type: modify_column
-- Table: addresses
-- Column: city
ALTER TABLE "addresses" ALTER COLUMN "city" DROP NOT NULL;

-- [5] Allow addresses.phone_no to be NULL
-- Type: modify_column
-- Table: addresses
-- Column: phone_no
ALTER TABLE "addresses" ALTER COLUMN "phone_no" DROP NOT NULL;

-- [6] Drop unique constraint addresses.phone_no
-- Type: drop_constraint
-- Table: addresses
-- Column: phone_no
ALTER TABLE "addresses" DROP CONSTRAINT "uq_addresses_phone_no";

-- [7] Allow returning_addresses.zip_code to be NULL
-- Type: modify_column
-- Table: returning_addresses
-- Column: zip_code
ALTER TABLE "returning_addresses" ALTER COLUMN "zip_code" DROP NOT NULL;

-- [8] Allow returning_addresses.is_deleted to be NULL
-- Type: modify_column
-- Table: returning_addresses
-- Column: is_deleted
ALTER TABLE "returning_addresses" ALTER COLUMN "is_deleted" DROP NOT NULL;

-- [9] Drop unique constraint returning_addresses.zip_code
-- Type: drop_constraint
-- Table: returning_addresses
-- Column: zip_code
ALTER TABLE "returning_addresses" DROP CONSTRAINT "uq_returning_addresses_zip_code";

