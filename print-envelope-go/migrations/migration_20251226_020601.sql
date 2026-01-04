-- Migration generated on 2025-12-26 02:06:01
-- Total operations: 8

-- [1] Add foreign key constraint users.created_by_id -> users.id
-- Type: add_constraint
-- Table: users
-- Column: created_by_id
ALTER TABLE "users" ADD CONSTRAINT "fk_users_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- [2] Add foreign key constraint users.approved_by_id -> users.id
-- Type: add_constraint
-- Table: users
-- Column: approved_by_id
ALTER TABLE "users" ADD CONSTRAINT "fk_users_approved_by_id" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- [3] Add foreign key constraint admin_update_logs.admin_id -> users.id
-- Type: add_constraint
-- Table: admin_update_logs
-- Column: admin_id
ALTER TABLE "admin_update_logs" ADD CONSTRAINT "fk_admin_update_logs_admin_id" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- [4] Add foreign key constraint orders.address_id -> addresses.id
-- Type: add_constraint
-- Table: orders
-- Column: address_id
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_address_id" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- [5] Add foreign key constraint orders.returning_address_id -> returning_addresses.id
-- Type: add_constraint
-- Table: orders
-- Column: returning_address_id
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_returning_address_id" FOREIGN KEY ("returning_address_id") REFERENCES "returning_addresses"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- [6] Add foreign key constraint order_events.order_id -> orders.id
-- Type: add_constraint
-- Table: order_events
-- Column: order_id
ALTER TABLE "order_events" ADD CONSTRAINT "fk_order_events_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- [7] Add foreign key constraint order_batch_items.order_id -> orders.id
-- Type: add_constraint
-- Table: order_batch_items
-- Column: order_id
ALTER TABLE "order_batch_items" ADD CONSTRAINT "fk_order_batch_items_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- [8] Add foreign key constraint order_batch_items.order_batch_id -> order_batches.id
-- Type: add_constraint
-- Table: order_batch_items
-- Column: order_batch_id
ALTER TABLE "order_batch_items" ADD CONSTRAINT "fk_order_batch_items_order_batch_id" FOREIGN KEY ("order_batch_id") REFERENCES "order_batches"("id") ON UPDATE CASCADE ON DELETE CASCADE;

