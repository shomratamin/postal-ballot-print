-- Migration generated on 2025-12-26 01:59:49
-- Total operations: 10

-- [1] Create table users
-- Type: create_table
-- Table: users
CREATE TABLE "users" (
  "id" bigserial,
  "uuid" varchar(255) NOT NULL,
  "username" varchar(255) NOT NULL,
  "legal_name" varchar(255) NOT NULL,
  "phone" varchar(20),
  "phone_verified" bool DEFAULT false,
  "email" varchar(255),
  "email_verified" bool DEFAULT false,
  "avatar" varchar(2048),
  "nonce" int,
  "password" varchar(255) NOT NULL,
  "joined_at" timestamp,
  "created_by_id" bigint,
  "approved_by_id" bigint,
  "current_role" varchar(100),
  "current_permissions" json,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  UNIQUE ("uuid"),
  UNIQUE ("username"),
  UNIQUE ("phone"),
  UNIQUE ("email"),
  PRIMARY KEY ("id")
);

-- [2] Create table admin_update_logs
-- Type: create_table
-- Table: admin_update_logs
CREATE TABLE "admin_update_logs" (
  "id" bigserial,
  "admin_id" bigint NOT NULL,
  "admin_u_u_id" varchar(255) NOT NULL,
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(100) NOT NULL,
  "entity_id" bigint NOT NULL,
  "description" text,
  "old_values" jsonb,
  "new_values" jsonb,
  "i_p_address" varchar(45),
  "user_agent" text,
  "request_id" varchar(255),
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  PRIMARY KEY ("id")
);

-- [3] Create table addresses
-- Type: create_table
-- Table: addresses
CREATE TABLE "addresses" (
  "id" bigserial,
  "recipient_fore_name" varchar(255) NOT NULL,
  "recipient_other_name" varchar(255),
  "postal_address" text NOT NULL,
  "zip_code" varchar(20) NOT NULL,
  "city" varchar(255) NOT NULL,
  "phone_no" varchar(20) NOT NULL,
  "qr_id" varchar(255),
  "country_code" varchar(10),
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  UNIQUE ("phone_no"),
  PRIMARY KEY ("id")
);

-- [4] Create table returning_addresses
-- Type: create_table
-- Table: returning_addresses
CREATE TABLE "returning_addresses" (
  "id" bigserial,
  "district_head_post_office" varchar(255),
  "zip_code" varchar(20) NOT NULL,
  "district" varchar(255),
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  UNIQUE ("zip_code"),
  PRIMARY KEY ("id")
);

-- [5] Create table orders
-- Type: create_table
-- Table: orders
CREATE TABLE "orders" (
  "id" bigserial,
  "sequence" integer NOT NULL,
  "address_id" bigint NOT NULL,
  "returning_address_id" bigint NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  UNIQUE ("sequence"),
  PRIMARY KEY ("id")
);

-- [6] Create table order_events
-- Type: create_table
-- Table: order_events
CREATE TABLE "order_events" (
  "id" bigserial,
  "order_id" bigint NOT NULL,
  "status" varchar(50) NOT NULL,
  "message" text,
  "metadata" jsonb,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- [7] Create table order_batches
-- Type: create_table
-- Table: order_batches
CREATE TABLE "order_batches" (
  "id" bigserial,
  "batch_number" varchar(50) NOT NULL,
  "start_sequence" integer NOT NULL,
  "end_sequence" integer NOT NULL,
  "total_orders" integer NOT NULL DEFAULT 0,
  "created_by_id" bigint,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  UNIQUE ("batch_number"),
  PRIMARY KEY ("id")
);

-- [8] Create table order_batch_items
-- Type: create_table
-- Table: order_batch_items
CREATE TABLE "order_batch_items" (
  "id" bigserial,
  "order_id" bigint NOT NULL,
  "order_batch_id" bigint NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- [9] Create table kafka_message_logs
-- Type: create_table
-- Table: kafka_message_logs
CREATE TABLE "kafka_message_logs" (
  "id" bigserial,
  "topic" varchar(255) NOT NULL,
  "partition" int NOT NULL,
  "offset" bigint NOT NULL,
  "key" text,
  "value" text NOT NULL,
  "timestamp" timestamp,
  "order_id" bigint,
  "status" varchar(50),
  "error" text,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- [10] Create table logs
-- Type: create_table
-- Table: logs
CREATE TABLE "logs" (
  "id" bigserial,
  "method" varchar(10) NOT NULL,
  "url" text NOT NULL,
  "request_body" text,
  "request_headers" text,
  "response_body" text,
  "response_headers" text,
  "status_code" int,
  "created_at" timestamp,
  "updated_at" timestamp,
  PRIMARY KEY ("id")
);

