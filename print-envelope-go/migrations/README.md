# Database Migrations

This directory contains auto-generated SQL migration files that track all database schema changes.

## How It Works

- Each time the application starts and detects schema changes, a new migration file is automatically generated
- Migration files are named with timestamps: `migration_YYYYMMDD_HHMMSS.sql`
- Each file contains the SQL commands that were executed to update the database schema
- Files are saved **before** executing the migrations, so you have a complete audit trail

## File Format

Each migration file contains:
- Timestamp of when it was generated
- Total number of operations
- For each operation:
  - Description of the change
  - Operation type (add_column, drop_column, modify_column, etc.)
  - Table and column names (if applicable)
  - The actual SQL command executed

## Example

```sql
-- Migration generated on 2024-12-25 10:30:45
-- Total operations: 2

-- [1] Add column 'email_verified' to table 'users'
-- Type: add_column
-- Table: users
-- Column: email_verified
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;

-- [2] Add index on 'users.email_verified'
-- Type: add_index
-- Table: users
-- Column: email_verified
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

## Usage

### Automatic Migration (Default Behavior)
The migrations are automatically detected and saved when you run your application:

```go
db, err := database.InitDB()
```

### Manual Migration File Generation
You can also generate a migration file manually without executing it:

```go
err := database.GenerateMigrationFile("migrations/manual_migration.sql")
```

## Important Notes

1. **Version Control**: Consider committing these files to git to track schema evolution over time
2. **Review**: While migrations are automatic, you should review the generated files to understand what changed
3. **Backup**: These files serve as documentation but are NOT a replacement for proper database backups
4. **Order**: Files are timestamped, so they naturally sort in chronological order

## Troubleshooting

If a migration file is not generated:
- Check that the `migrations/` directory exists and is writable
- Ensure there are actual schema changes detected
- Check application logs for any warnings or errors

## Configuration

The migration system is configured in:
- `database/db.go` - Main initialization and migration saving logic
- `database/migration.go` - Migration detection and execution logic
