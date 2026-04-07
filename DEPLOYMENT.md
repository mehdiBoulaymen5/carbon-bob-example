# IBM Cloud Code Engine Deployment Guide

This guide will help you deploy the Carbon React application to IBM Cloud Code Engine.

## Prerequisites

1. IBM Cloud account (sign up at https://cloud.ibm.com)
2. IBM Cloud CLI installed (https://cloud.ibm.com/docs/cli)
3. Code Engine plugin installed
4. Docker installed locally (optional, for local testing)

## Installation Steps

### 1. Install IBM Cloud CLI and Code Engine Plugin

```bash
# Install IBM Cloud CLI (if not already installed)
# macOS
curl -fsSL https://clis.cloud.ibm.com/install/osx | sh

# Login to IBM Cloud
ibmcloud login

# Install Code Engine plugin
ibmcloud plugin install code-engine
```

### 2. Create a Code Engine Project

```bash
# Set your target region (e.g., us-south, eu-de, jp-tok)
ibmcloud target -r us-south

# Create a new Code Engine project
ibmcloud ce project create --name carbon-react-app

# Select the project
ibmcloud ce project select --name carbon-react-app
```

### 3. Deploy from GitHub Repository

Code Engine can build directly from your GitHub repository:

```bash
# Deploy application from GitHub
ibmcloud ce application create \
  --name carbon-react-app \
  --build-source https://github.com/mehdiBoulaymen5/carbon-bob-example \
  --build-context-dir . \
  --build-dockerfile Dockerfile \
  --port 8080 \
  --min-scale 0 \
  --max-scale 2 \
  --cpu 0.25 \
  --memory 0.5G
```

### 4. Alternative: Deploy from Container Registry

If you prefer to build locally and push to IBM Container Registry:

```bash
# Login to IBM Container Registry
ibmcloud cr login

# Create a namespace (one-time setup)
ibmcloud cr namespace-add carbon-apps

# Build and push the Docker image
docker build -t us.icr.io/carbon-apps/carbon-react-app:latest .
docker push us.icr.io/carbon-apps/carbon-react-app:latest

# Deploy from container registry
ibmcloud ce application create \
  --name carbon-react-app \
  --image us.icr.io/carbon-apps/carbon-react-app:latest \
  --port 8080 \
  --min-scale 0 \
  --max-scale 2 \
  --cpu 0.25 \
  --memory 0.5G
```

## Deployment Configuration

### Application Settings

- **Port**: 8080 (configured in nginx.conf)
- **Min Scale**: 0 (scales to zero when not in use)
- **Max Scale**: 2 (can be adjusted based on traffic)
- **CPU**: 0.25 vCPU per instance
- **Memory**: 0.5 GB per instance

### Environment Variables

For a Code Engine deployment without PostgreSQL, configure the backend to use file storage mode.

```bash
ibmcloud ce application update \
  --name carbon-react-app \
  --env STORAGE_MODE=file \
  --env FILE_STORAGE_DIR=/tmp/bob-catalog-data \
  --env FILE_STORAGE_PATH=/tmp/bob-catalog-data/app-data.json \
  --env DEMO_ADMIN_EMAIL=admin@example.com \
  --env DEMO_ADMIN_PASSWORD=admin123 \
  --env DEMO_ADMIN_NAME="System Administrator" \
  --env JWT_SECRET=replace-with-a-secure-random-string \
  --env JWT_REFRESH_SECRET=replace-with-a-secure-random-string
```

Notes:
- File storage mode keeps backend data in a JSON file local to the container instance.
- This is suitable for demos and single-instance usage.
- Avoid scaling above one instance when using file-backed storage, because each instance would maintain its own local file state.

## Managing Your Deployment

### View Application Status

```bash
# Get application details
ibmcloud ce application get --name carbon-react-app

# List all applications
ibmcloud ce application list
```

### View Application URL

```bash
# Get the public URL
ibmcloud ce application get --name carbon-react-app --output url
```

### View Logs

```bash
# View application logs
ibmcloud ce application logs --name carbon-react-app

# Follow logs in real-time
ibmcloud ce application logs --name carbon-react-app --follow
```

### Update Application

```bash
# Update from latest GitHub commit
ibmcloud ce application update \
  --name carbon-react-app \
  --build-source https://github.com/mehdiBoulaymen5/carbon-bob-example

# Or update with new image
ibmcloud ce application update \
  --name carbon-react-app \
  --image us.icr.io/carbon-apps/carbon-react-app:latest
```

### Scale Application

```bash
# Update scaling configuration
ibmcloud ce application update \
  --name carbon-react-app \
  --min-scale 1 \
  --max-scale 5
```

### Delete Application

```bash
# Delete the application
ibmcloud ce application delete --name carbon-react-app

# Delete the project
ibmcloud ce project delete --name carbon-react-app
```

## Troubleshooting

### Check Build Logs

```bash
ibmcloud ce buildrun logs --name carbon-react-app
```

### Check Application Events

```bash
ibmcloud ce application events --name carbon-react-app
```

### Common Issues

1. **Build Failures**: Check that Dockerfile and nginx.conf are in the repository root
2. **Port Issues**: Ensure nginx is configured to listen on port 8080
3. **Memory Issues**: Increase memory allocation if the app crashes
4. **Scaling Issues**: Adjust min/max scale based on your traffic patterns
5. **No PostgreSQL Available**: Set [`STORAGE_MODE`](backend/.env.example) to `file` and keep the deployment at a single instance
6. **Admin Login Issues in Demo Mode**: Verify [`DEMO_ADMIN_EMAIL`](backend/.env.example), [`DEMO_ADMIN_PASSWORD`](backend/.env.example), [`JWT_SECRET`](backend/.env.example), and [`JWT_REFRESH_SECRET`](backend/.env.example) are set consistently in Code Engine

## Cost Optimization

- **Scale to Zero**: Set `--min-scale 0` to avoid charges when not in use
- **Right-size Resources**: Start with minimal CPU/memory and scale up as needed
- **Monitor Usage**: Use IBM Cloud monitoring to track resource consumption
- **File-backed Demo Deployments**: Keep `--max-scale 1` when [`STORAGE_MODE`](backend/.env.example:1) is `file`

## Additional Resources

- [IBM Cloud Code Engine Documentation](https://cloud.ibm.com/docs/codeengine)
- [Code Engine CLI Reference](https://cloud.ibm.com/docs/codeengine?topic=codeengine-cli)
- [Code Engine Pricing](https://www.ibm.com/cloud/code-engine/pricing)