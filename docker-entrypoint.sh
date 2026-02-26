#!/bin/sh

# Run migrations and seed on first startup (when DB doesn't exist)
if [ ! -f "/app/data/sqlite.db" ]; then
  echo "First startup: initializing database..."
  npx drizzle-kit migrate
  npx tsx src/db/seed.ts
  echo "Database initialized successfully."
else
  echo "Database already exists, skipping seed."
fi

# Start the application
exec node server.js
