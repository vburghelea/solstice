#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/reset-db.sh <stage> [--profile <aws_profile>] [--yes]

Drops and recreates the database for the given SST stage, then runs migrations.

Examples:
  scripts/reset-db.sh sin-dev
  scripts/reset-db.sh qc-dev --profile techdev
  scripts/reset-db.sh sin-dev --yes
USAGE
}

stage=""
profile=""
assume_yes="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      profile="${2:-}"
      shift 2
      ;;
    --yes)
      assume_yes="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$stage" ]]; then
        stage="$1"
        shift
      else
        echo "Unknown argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$stage" ]]; then
  usage
  exit 1
fi

if [[ "$assume_yes" != "true" ]]; then
  echo "WARNING: This will DROP and recreate the database for stage: $stage"
  read -r -p "Type \"$stage\" to continue: " confirm
  if [[ "$confirm" != "$stage" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ -n "$profile" ]]; then
  AWS_PROFILE="$profile" npx sst shell --stage "$stage" -- bash -s <<'SCRIPT'
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set in SST shell." >&2
  exit 1
fi

admin_url=$(node -e "const { URL } = require(\"url\"); const u = new URL(process.env.DATABASE_URL); u.pathname = \"/postgres\"; console.log(u.toString());")
db_name=$(node -e "const { URL } = require(\"url\"); const u = new URL(process.env.DATABASE_URL); console.log(u.pathname.replace(/^\\//, \"\"));")
db_name="${db_name:-}"
db_url="${DATABASE_URL}"

if [[ "$db_url" != *"connect_timeout="* ]]; then
  if [[ "$db_url" == *"?"* ]]; then
    db_url="${db_url}&connect_timeout=5"
  else
    db_url="${db_url}?connect_timeout=5"
  fi
fi
export DATABASE_URL="$db_url"

if [[ -z "$db_name" ]]; then
  echo "Failed to resolve database name from DATABASE_URL." >&2
  exit 1
fi

case "$db_name" in
  ""|"postgres"|"template0"|"template1")
    echo "Refusing to drop database named \"$db_name\"." >&2
    exit 1
    ;;
esac

run_psql() {
  local sql="$1"
  local attempt=1
  while true; do
    if PGCONNECT_TIMEOUT=5 psql "$admin_url" -v ON_ERROR_STOP=1 -c "$sql"; then
      break
    fi
    if [[ $attempt -ge 3 ]]; then
      exit 1
    fi
    attempt=$((attempt + 1))
    echo "psql failed; retrying in 5s (attempt ${attempt}/3)..."
    sleep 5
  done
}

echo "Terminating connections to ${db_name}..."
run_psql "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db_name}' AND pid <> pg_backend_pid();"

echo "Dropping database ${db_name}..."
run_psql "DROP DATABASE IF EXISTS \"${db_name}\";"

echo "Creating database ${db_name}..."
run_psql "CREATE DATABASE \"${db_name}\";"

echo "Waiting for database to accept connections..."
sleep 5

echo "Running migrations..."
attempt=1
while ! pnpm db:migrate; do
  if [[ $attempt -ge 3 ]]; then
    exit 1
  fi
  attempt=$((attempt + 1))
  echo "Migration failed; retrying in 5s (attempt ${attempt}/3)..."
  sleep 5
done
SCRIPT
else
  npx sst shell --stage "$stage" -- bash -s <<'SCRIPT'
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set in SST shell." >&2
  exit 1
fi

admin_url=$(node -e "const { URL } = require(\"url\"); const u = new URL(process.env.DATABASE_URL); u.pathname = \"/postgres\"; console.log(u.toString());")
db_name=$(node -e "const { URL } = require(\"url\"); const u = new URL(process.env.DATABASE_URL); console.log(u.pathname.replace(/^\\//, \"\"));")
db_name="${db_name:-}"
db_url="${DATABASE_URL}"

if [[ "$db_url" != *"connect_timeout="* ]]; then
  if [[ "$db_url" == *"?"* ]]; then
    db_url="${db_url}&connect_timeout=5"
  else
    db_url="${db_url}?connect_timeout=5"
  fi
fi
export DATABASE_URL="$db_url"

if [[ -z "$db_name" ]]; then
  echo "Failed to resolve database name from DATABASE_URL." >&2
  exit 1
fi

case "$db_name" in
  ""|"postgres"|"template0"|"template1")
    echo "Refusing to drop database named \"$db_name\"." >&2
    exit 1
    ;;
esac

run_psql() {
  local sql="$1"
  local attempt=1
  while true; do
    if PGCONNECT_TIMEOUT=5 psql "$admin_url" -v ON_ERROR_STOP=1 -c "$sql"; then
      break
    fi
    if [[ $attempt -ge 3 ]]; then
      exit 1
    fi
    attempt=$((attempt + 1))
    echo "psql failed; retrying in 5s (attempt ${attempt}/3)..."
    sleep 5
  done
}

echo "Terminating connections to ${db_name}..."
run_psql "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db_name}' AND pid <> pg_backend_pid();"

echo "Dropping database ${db_name}..."
run_psql "DROP DATABASE IF EXISTS \"${db_name}\";"

echo "Creating database ${db_name}..."
run_psql "CREATE DATABASE \"${db_name}\";"

echo "Waiting for database to accept connections..."
sleep 5

echo "Running migrations..."
attempt=1
while ! pnpm db:migrate; do
  if [[ $attempt -ge 3 ]]; then
    exit 1
  fi
  attempt=$((attempt + 1))
  echo "Migration failed; retrying in 5s (attempt ${attempt}/3)..."
  sleep 5
done
SCRIPT
fi
