#!/usr/bin/env bash
# Create a GitHub Deployment record for the app commit, then dispatch the
# environment-specific private bmit-eng deployment workflow.
set -euo pipefail

GITHUB_API_URL="${GITHUB_API_URL:-https://api.github.com}"
GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-https://github.com}"
PRIVATE_REPO="${PRIVATE_REPO:-Bhakti-Marga/bmit-eng}"
PRIVATE_REF="${PRIVATE_REF:-main}"
PRIVATE_WORKFLOW="${PRIVATE_WORKFLOW:-deploy-hindu-saints.yml}"
DEPLOYMENT_ENVIRONMENT="${DEPLOYMENT_ENVIRONMENT:-production}"
DEPLOYMENT_IS_PRODUCTION="${DEPLOYMENT_IS_PRODUCTION:-true}"
DEPLOYMENT_IS_TRANSIENT="${DEPLOYMENT_IS_TRANSIENT:-false}"
DEPLOYMENT_DESCRIPTION="${DEPLOYMENT_DESCRIPTION:-${DEPLOYMENT_ENVIRONMENT} deploy requested by push to ${GITHUB_REF_NAME:-unknown}}"

deployment_id=""

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "${name} is required." >&2
    exit 1
  fi
}

require_tool() {
  local name="$1"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "${name} is required." >&2
    exit 127
  fi
}

require_boolean() {
  local name="$1"
  local value="${!name:-}"
  if [ "${value}" != "true" ] && [ "${value}" != "false" ]; then
    echo "${name} must be true or false." >&2
    exit 1
  fi
}

api_post() {
  local token="$1"
  local path="$2"
  local payload="$3"

  curl -fsSL \
    -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${token}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Content-Type: application/json" \
    "${GITHUB_API_URL}/${path}" \
    -d "${payload}"
}

run_url() {
  echo "${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
}

mark_deployment_status() {
  local state="$1"
  local description="$2"

  [ -n "${deployment_id}" ] || return 0

  local payload
  payload="$(jq -n \
    --arg state "${state}" \
    --arg log_url "$(run_url)" \
    --arg description "${description}" \
    '{
      state: $state,
      log_url: $log_url,
      description: $description,
      auto_inactive: false
    }')"

  api_post \
    "${GITHUB_TOKEN}" \
    "repos/${GITHUB_REPOSITORY}/deployments/${deployment_id}/statuses" \
    "${payload}" >/dev/null
}

on_exit() {
  local status="$?"
  if [ "${status}" -ne 0 ] && [ -n "${deployment_id}" ]; then
    set +e
    mark_deployment_status "failure" "Failed to dispatch private ${DEPLOYMENT_ENVIRONMENT} deploy"
  fi
  exit "${status}"
}
trap on_exit EXIT

require_tool curl
require_tool jq
require_env GITHUB_TOKEN
require_env BMIT_ENG_DEPLOY_DISPATCH_TOKEN
require_env GITHUB_REPOSITORY
require_env GITHUB_SHA
require_env GITHUB_REF_NAME
require_env GITHUB_RUN_ID
require_boolean DEPLOYMENT_IS_PRODUCTION
require_boolean DEPLOYMENT_IS_TRANSIENT

create_payload="$(jq -n \
  --arg ref "${GITHUB_SHA}" \
  --arg environment "${DEPLOYMENT_ENVIRONMENT}" \
  --arg description "${DEPLOYMENT_DESCRIPTION}" \
  --argjson production_environment "${DEPLOYMENT_IS_PRODUCTION}" \
  --argjson transient_environment "${DEPLOYMENT_IS_TRANSIENT}" \
  '{
    ref: $ref,
    environment: $environment,
    required_contexts: [],
    auto_merge: false,
    production_environment: $production_environment,
    transient_environment: $transient_environment,
    description: $description
  }')"

deployment_response="$(api_post "${GITHUB_TOKEN}" "repos/${GITHUB_REPOSITORY}/deployments" "${create_payload}")"
deployment_id="$(jq -r '.id // empty' <<<"${deployment_response}")"
if [ -z "${deployment_id}" ]; then
  echo "GitHub did not return a deployment id." >&2
  echo "${deployment_response}" >&2
  exit 1
fi

mark_deployment_status "queued" "Private ${DEPLOYMENT_ENVIRONMENT} deploy queued in bmit-eng"

dispatch_payload="$(jq -n \
  --arg ref "${PRIVATE_REF}" \
  --arg source_repo "${GITHUB_REPOSITORY}" \
  --arg source_ref "${GITHUB_REF_NAME}" \
  --arg target_sha "${GITHUB_SHA}" \
  --arg deployment_id "${deployment_id}" \
  '{
    ref: $ref,
    inputs: {
      source_repo: $source_repo,
      source_ref: $source_ref,
      target_sha: $target_sha,
      deployment_id: $deployment_id,
      force: "false"
    }
  }')"

api_post \
  "${BMIT_ENG_DEPLOY_DISPATCH_TOKEN}" \
  "repos/${PRIVATE_REPO}/actions/workflows/${PRIVATE_WORKFLOW}/dispatches" \
  "${dispatch_payload}" >/dev/null

echo "Dispatched ${PRIVATE_REPO}/${PRIVATE_WORKFLOW} for ${GITHUB_REPOSITORY}@${GITHUB_SHA}."
echo "Public deployment id: ${deployment_id}"
