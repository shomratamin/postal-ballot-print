-- Migration generated on 2026-01-05 16:17:41
-- Total operations: 2

-- [1] Add column print_batch_jobs.job_token
-- Type: add_column
-- Table: print_batch_jobs
-- Column: job_token
ALTER TABLE "print_batch_jobs" ADD COLUMN "job_token" varchar(255);

-- [2] Add column print_single_jobs.job_token
-- Type: add_column
-- Table: print_single_jobs
-- Column: job_token
ALTER TABLE "print_single_jobs" ADD COLUMN "job_token" varchar(255);

