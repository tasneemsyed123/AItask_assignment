#!/bin/bash
# mongo-init/create-app-user.sh
# ------------------------------------------------------------------------
# Runs ONCE, automatically, the first time the mongo container initializes
# an empty data volume (standard docker-entrypoint-initdb.d behavior - it
# does NOT re-run on every restart, only on a fresh volume).
#
# MONGO_INITDB_ROOT_USERNAME/PASSWORD (set in docker-compose.yml) create the
# admin/root account used only for administration. This script creates a
# SEPARATE, least-privilege account - readWrite on just this app's database,
# nothing else - which is the account the backend/worker actually connect
# as. Neither the app nor its .env files ever need the root credentials.
set -e

mongosh <<EOF
use ${MONGO_INITDB_DATABASE}
db.createUser({
  user: "${MONGO_APP_USER}",
  pwd: "${MONGO_APP_PASSWORD}",
  roles: [{ role: "readWrite", db: "${MONGO_INITDB_DATABASE}" }]
})
EOF
