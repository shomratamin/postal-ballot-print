-- Migration generated on 2025-12-26 02:37:44
-- Total operations: 3

-- [1] Create table print_batch_jobs
-- Type: create_table
-- Table: print_batch_jobs
CREATE TABLE "print_batch_jobs" (
  "id" bigserial,
  "batch_number" varchar(50) NOT NULL,
  "order_batch_id" bigint NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT '''PENDING''',
  "total_jobs" integer NOT NULL DEFAULT 0,
  "completed_jobs" integer NOT NULL DEFAULT 0,
  "failed_jobs" integer NOT NULL DEFAULT 0,
  "created_by_id" bigint,
  "error_message" text,
  "printer_id" varchar(255),
  "command" varchar(255),
  "job_type" varchar(255),
  "job_uuid" varchar(255),
  "created_at" timestamp,
  "updated_at" timestamp,
  "started_at" timestamp,
  "completed_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- [2] Create table print_single_jobs
-- Type: create_table
-- Table: print_single_jobs
CREATE TABLE "print_single_jobs" (
  "id" bigserial,
  "print_batch_job_id" bigint NOT NULL,
  "order_id" bigint NOT NULL,
  "sequence" integer NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT '''PENDING''',
  "printed_at" timestamp,
  "error_message" text,
  "printer_id" varchar(255),
  "command" varchar(255),
  "job_type" varchar(255),
  "job_uuid" varchar(255),
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- [3] Create table print_job_data
-- Type: create_table
-- Table: print_job_data
CREATE TABLE "print_job_data" (
  "id" bigserial,
  "print_single_job_id" bigint NOT NULL,
  "order_id" bigint NOT NULL,
  "sequence" integer NOT NULL,
  "recipient_fore_name" varchar(255),
  "recipient_other_name" varchar(255),
  "postal_address" text,
  "zip_code" varchar(20),
  "city" varchar(255),
  "phone_no" varchar(20),
  "qr_id" varchar(255),
  "country_code" varchar(10),
  "district_head_post_office" varchar(255),
  "returning_zip_code" varchar(20),
  "district" varchar(255),
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  UNIQUE ("print_single_job_id"),
  PRIMARY KEY ("id")
);

