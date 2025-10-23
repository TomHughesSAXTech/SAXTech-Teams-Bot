# SAXTech MegaMind Teams Bot

Teams bot that forwards messages to n8n workflows for AI processing with multiple specialized profiles.

## Features

- 5 AI assistant profiles: General Business, CPA, Trainer, Auditor, IT Tech
- Profile switching via slash commands
- Integration with n8n workflows
- Automatic message forwarding

## Deployment

This bot deploys automatically to Azure Functions via GitHub Actions when code is pushed to the `main` branch.

### Setup

1. Get the Function App publish profile:
   ```bash
   az functionapp deployment list-publishing-profiles --name saxtech-teams-megamind-bot --resource-group SAXTech-AI --xml
   ```

2. Add the publish profile as a GitHub secret named `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

3. Push to main branch to trigger deployment

## Configuration

Bot credentials are configured in Azure Function App settings:
- `MicrosoftAppId`: Bot App ID
- `MicrosoftAppPassword`: Bot secret

## Local Development

```bash
npm install
func start
```

## Commands

- `/help` - Show available commands
- `/profile` - Show current profile
- `/switch` - List profiles
- `/megamind`, `/cpa`, `/trainer`, `/auditor`, `/tech` - Switch profiles
