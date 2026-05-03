#!/bin/bash
cd /home/z/my-project/connect
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export AUTH_TRUST_HOST=true
export AUTH_SECRET="decodex-dev-secret-key-2025-test"
export NEXTAUTH_URL="http://localhost:3000"
exec npx next start -p 3000
