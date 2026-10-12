# One-time Azure setup

These resources have been provisioned in the dedicated **DevNet Demos Prod** subscription in `centralus`. The commands below are a reproducibility and handoff reference; skip creation for resources that already exist. The current public hostname is `twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io`, giving the site `https://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io/bank` and voice endpoint `wss://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io/voice-relay`. The private presenter token is saved in local `.env` and an Azure secret; do not regenerate it for each release. The workflow updates the app image while runtime values stay in Azure. [Azure Container Apps CLI](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest) · [GitHub OIDC with Azure](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)

The subscription requires a `created_by` resource tag. Create the Log Analytics workspace explicitly: otherwise `az containerapp env create` can generate an untagged workspace that the policy rejects.

## 1. Create the Azure resources

Run in a local Bash or zsh shell with Azure CLI access. Resource names are specific to this demo; the registry name is global across Azure. The sample ASP.NET image is only a temporary 8080-compatible placeholder until the first GitHub deployment. [Microsoft 8080 sample](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-scaling)

```bash
AZ_RESOURCE_GROUP=rg-twilio-branded-comms-webinar
AZ_REGION=centralus
AZ_ACR=twiliobrandedcomms
AZ_LOG_WORKSPACE=law-twilio-branded-comms
AZ_CONTAINER_ENV=cae-twilio-branded-comms
AZ_CONTAINER_APP=twilio-branded-comms
AZ_DEPLOY_IDENTITY=id-twilio-branded-comms-deploy
GH_REPO=anthonyplusAI/twilio-beyond-the-10-digit-number
AZ_TAGS=(created_by=adellavecchia project=twilio-branded-comms-webinar purpose=webinar-demo)

az login
az account set --subscription 'DevNet Demos Prod'
az extension add --name containerapp --upgrade
az group create --name "$AZ_RESOURCE_GROUP" --location "$AZ_REGION" --tags "${AZ_TAGS[@]}" --output none
az acr create --name "$AZ_ACR" --resource-group "$AZ_RESOURCE_GROUP" --location "$AZ_REGION" --sku Basic --admin-enabled false --role-assignment-mode rbac --tags "${AZ_TAGS[@]}" --output none

az monitor log-analytics workspace create --resource-group "$AZ_RESOURCE_GROUP" --workspace-name "$AZ_LOG_WORKSPACE" --location "$AZ_REGION" --tags "${AZ_TAGS[@]}" --output none
AZ_LOG_ID=$(az monitor log-analytics workspace show --resource-group "$AZ_RESOURCE_GROUP" --workspace-name "$AZ_LOG_WORKSPACE" --query customerId --output tsv)
AZ_LOG_KEY=$(az monitor log-analytics workspace get-shared-keys --resource-group "$AZ_RESOURCE_GROUP" --workspace-name "$AZ_LOG_WORKSPACE" --query primarySharedKey --output tsv)
az containerapp env create --name "$AZ_CONTAINER_ENV" --resource-group "$AZ_RESOURCE_GROUP" --location "$AZ_REGION" --logs-workspace-id "$AZ_LOG_ID" --logs-workspace-key "$AZ_LOG_KEY" --tags "${AZ_TAGS[@]}" --output none
unset AZ_LOG_KEY

az containerapp create --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --environment "$AZ_CONTAINER_ENV" --image mcr.microsoft.com/dotnet/samples:aspnetapp --target-port 8080 --ingress external --transport auto --revisions-mode single --cpu 0.5 --memory 1.0Gi --min-replicas 1 --max-replicas 1 --tags "${AZ_TAGS[@]}" --output none
```

The registry is explicitly in RBAC mode so its `AcrPush` and `AcrPull` assignments work; those legacy roles do not grant image access in an ABAC-mode registry. The app uses one warm replica because its story state is held in memory. [ACR role modes](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-abac-repository-permissions) · [Azure scaling](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)

## 2. Give the app permission to pull images

The Container App needs a **separate** image-pull identity. Grant its system-assigned identity `AcrPull`, then point its registry configuration at that identity. GitHub's later `AcrPush` permission cannot pull images on the app's behalf. [Microsoft managed-identity image pull](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull)

```bash
AZ_ACR_ID=$(az acr show --name "$AZ_ACR" --query id --output tsv)
AZ_PULL_PRINCIPAL_ID=$(az containerapp identity assign --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --system-assigned --query principalId --output tsv)
az role assignment create --assignee-object-id "$AZ_PULL_PRINCIPAL_ID" --assignee-principal-type ServicePrincipal --role AcrPull --scope "$AZ_ACR_ID" --output none
az containerapp registry set --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --server "${AZ_ACR}.azurecr.io" --identity system --output none
```

## 3. Give GitHub an OIDC deploy identity

This user-assigned Azure identity trusts only this repository's `main` branch. It can push images to this registry and update this specific Container App. GitHub stores its client, tenant, and subscription **IDs**, with no Azure password or client secret. This repo uses GitHub's immutable OIDC subject, which includes numeric owner and repo IDs, so read its exact prefix before creating the Azure trust. [GitHub OIDC subject format](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims) · [Federated credential CLI](https://learn.microsoft.com/en-us/cli/azure/identity/federated-credential?view=azure-cli-latest) · [Azure Login OIDC](https://github.com/Azure/login) · [Container Apps Contributor role](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/containers#container-apps-contributor)

```bash
az identity create --name "$AZ_DEPLOY_IDENTITY" --resource-group "$AZ_RESOURCE_GROUP" --location "$AZ_REGION" --tags "${AZ_TAGS[@]}" --output none
AZ_DEPLOY_CLIENT_ID=$(az identity show --name "$AZ_DEPLOY_IDENTITY" --resource-group "$AZ_RESOURCE_GROUP" --query clientId --output tsv)
AZ_DEPLOY_PRINCIPAL_ID=$(az identity show --name "$AZ_DEPLOY_IDENTITY" --resource-group "$AZ_RESOURCE_GROUP" --query principalId --output tsv)
AZ_CONTAINER_APP_ID=$(az containerapp show --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --query id --output tsv)
AZ_SUBSCRIPTION_ID=$(az account show --query id --output tsv)
AZ_TENANT_ID=$(az account show --query tenantId --output tsv)
GH_OIDC_PREFIX=$(gh api "repos/${GH_REPO}/actions/oidc/customization/sub" --jq '.sub_claim_prefix // empty')
if [ -z "$GH_OIDC_PREFIX" ]; then GH_OIDC_PREFIX="repo:${GH_REPO}"; fi

az identity federated-credential create --name github-main --identity-name "$AZ_DEPLOY_IDENTITY" --resource-group "$AZ_RESOURCE_GROUP" --issuer https://token.actions.githubusercontent.com --subject "${GH_OIDC_PREFIX}:ref:refs/heads/main" --audiences api://AzureADTokenExchange --output none
az role assignment create --assignee-object-id "$AZ_DEPLOY_PRINCIPAL_ID" --assignee-principal-type ServicePrincipal --role AcrPush --scope "$AZ_ACR_ID" --output none
az role assignment create --assignee-object-id "$AZ_DEPLOY_PRINCIPAL_ID" --assignee-principal-type ServicePrincipal --role 'Container Apps Contributor' --scope "$AZ_CONTAINER_APP_ID" --output none

gh variable set ACR_NAME --repo "$GH_REPO" --body "$AZ_ACR"
gh variable set ACA_NAME --repo "$GH_REPO" --body "$AZ_CONTAINER_APP"
gh variable set ACA_RESOURCE_GROUP --repo "$GH_REPO" --body "$AZ_RESOURCE_GROUP"
gh secret set AZURE_CLIENT_ID --repo "$GH_REPO" --body "$AZ_DEPLOY_CLIENT_ID"
gh secret set AZURE_TENANT_ID --repo "$GH_REPO" --body "$AZ_TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --repo "$GH_REPO" --body "$AZ_SUBSCRIPTION_ID"
```

Check the configured **names**, without printing secret values: `gh variable list --repo "$GH_REPO"` and `gh secret list --repo "$GH_REPO"`. Azure role assignments can take a few minutes to propagate before the first workflow run.

## 4. Set the public URL and private presenter token

The public URL enables the exact host/origin checks and lets the app derive `wss://<app-fqdn>/voice-relay`. Generate a stable 32-byte base64url presenter token once; save its URL privately before unsetting the shell variable. The token is kept in a Container Apps secret and is not printed by the deployed server. [Azure ingress and WebSocket support](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview) · [Container Apps secret references](https://learn.microsoft.com/en-us/azure/container-apps/environment-variables)

```bash
AZ_FQDN=$(az containerapp show --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)
BANK_PRESENTER_TOKEN=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')
az containerapp secret set --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --secrets "presenter-token=$BANK_PRESENTER_TOKEN" --output none
az containerapp update --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --set-env-vars "PORT=8080" "PUBLIC_BASE_URL=https://${AZ_FQDN}" "PRESENTER_TOKEN=secretref:presenter-token" --output none
printf 'Save privately: https://%s/presenter#token=%s\n' "$AZ_FQDN" "$BANK_PRESENTER_TOKEN"
unset BANK_PRESENTER_TOKEN
```

After the workflow files are on `main`, run `gh workflow run deploy.yml --repo "$GH_REPO" --ref main` and watch the run in GitHub Actions. A push to `main` also deploys automatically. If the push happened before Azure was configured, its preflight will fail and the manual run can be used after setup.

## Live demo settings

The simulated story needs no live Twilio or OpenAI credentials. For real RCS and AI calls, set these values directly on the Container App; the deploy workflow preserves them. Set only the features you will use. `TWILIO_CONVERSATION_RELAY_URL` is normally omitted in Azure because it is derived from `PUBLIC_BASE_URL`; the resulting URL is `wss://<app-fqdn>/voice-relay`. `TWILIO_RCS_MEDIA_URL` is used only by the local template-creation helper, not by the deployed server. [Twilio RCS test onboarding](https://www.twilio.com/docs/rcs/onboarding) · [ConversationRelay URL](https://www.twilio.com/docs/voice/conversationrelay/onboarding)

| Feature | Container App environment variables |
| --- | --- |
| Shared live credentials | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (secret), `DEMO_TO_NUMBER` (secret) |
| Real RCS | `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_RCS_CONTENT_SID` |
| Real branded AI call | `TWILIO_VOICE_FROM`, `OPENAI_API_KEY` (secret) |
| Optional call tuning | `TWILIO_ELEVENLABS_VOICE_ID`, `OPENAI_MODEL` |

For the shared credentials, enter values privately in your shell and attach them to the Container App. The `read -s` inputs do not echo the Auth Token or phone number; keep shell tracing (`set -x`) off.

```bash
printf 'Twilio Account SID: '; IFS= read -r BANK_ACCOUNT_SID
printf 'Twilio Auth Token: '; IFS= read -rs BANK_AUTH_TOKEN; printf '\n'
printf 'Demo phone in E.164: '; IFS= read -rs BANK_DEMO_TO_NUMBER; printf '\n'
az containerapp secret set --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --secrets "twilio-auth-token=$BANK_AUTH_TOKEN" "demo-to-number=$BANK_DEMO_TO_NUMBER" --output none
az containerapp update --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --set-env-vars "TWILIO_ACCOUNT_SID=$BANK_ACCOUNT_SID" "TWILIO_AUTH_TOKEN=secretref:twilio-auth-token" "DEMO_TO_NUMBER=secretref:demo-to-number" --output none
unset BANK_ACCOUNT_SID BANK_AUTH_TOKEN BANK_DEMO_TO_NUMBER
```

Add RCS SIDs when the test sender, accepted tester, Messaging Service, and Content Template are ready. Twilio documents the test invitation and onboarding steps. The hosted card image URL is `https://<app-fqdn>/rcs-alert-card.png`; put it in local `.env` as `TWILIO_RCS_MEDIA_URL` if you run the template helper. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Rich card template](https://www.twilio.com/docs/content/twiliocard)

```bash
printf 'Messaging Service SID (MG...): '; IFS= read -r BANK_MESSAGING_SERVICE_SID
printf 'RCS Content SID (HX...): '; IFS= read -r BANK_RCS_CONTENT_SID
az containerapp update --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --set-env-vars "TWILIO_MESSAGING_SERVICE_SID=$BANK_MESSAGING_SERVICE_SID" "TWILIO_RCS_CONTENT_SID=$BANK_RCS_CONTENT_SID" --output none
unset BANK_MESSAGING_SERVICE_SID BANK_RCS_CONTENT_SID
```

Add the approved Enhanced Branded Calling number and OpenAI key for the live voice step. Twilio ConversationRelay handles ElevenLabs voice output; the app uses its own OpenAI key for the agent's replies. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

```bash
printf 'Approved voice number in E.164: '; IFS= read -r BANK_VOICE_FROM
printf 'OpenAI API key: '; IFS= read -rs BANK_OPENAI_KEY; printf '\n'
az containerapp secret set --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --secrets "openai-api-key=$BANK_OPENAI_KEY" --output none
az containerapp update --name "$AZ_CONTAINER_APP" --resource-group "$AZ_RESOURCE_GROUP" --set-env-vars "TWILIO_VOICE_FROM=$BANK_VOICE_FROM" "OPENAI_API_KEY=secretref:openai-api-key" "OPENAI_MODEL=gpt-4o-mini" --output none
unset BANK_VOICE_FROM BANK_OPENAI_KEY
```

The app intentionally has no database. Restarting or deploying a new revision clears the current story, so finish setup and rehearse before going on air. [Container Apps revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions-manage)
