#!/bin/bash

# Cansup Chatter - AWS Infrastructure Deployment Script
# This script deploys the full audio/video transcription pipeline to AWS

set -e

echo "=========================================="
echo "Cansup Chatter - AWS Deployment"
echo "=========================================="

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed."
    echo "Install it with: brew install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials not configured."
    echo "Run: aws configure"
    exit 1
fi

# Get the Vercel webhook URL
echo ""
read -p "Enter your Vercel app URL (e.g., https://your-app.vercel.app): " VERCEL_URL

if [ -z "$VERCEL_URL" ]; then
    echo "Error: Vercel URL is required"
    exit 1
fi

WEBHOOK_URL="${VERCEL_URL}/api/transcription-webhook"

# Optional: custom bucket name
read -p "S3 Bucket name [cansup-audio-uploads]: " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-cansup-audio-uploads}

# Get AWS region
REGION=$(aws configure get region)
REGION=${REGION:-us-east-1}

echo ""
echo "Deploying with:"
echo "  Webhook URL: $WEBHOOK_URL"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $REGION"
echo ""

# Deploy CloudFormation stack
STACK_NAME="cansup-transcription-pipeline"

echo "Creating CloudFormation stack..."
aws cloudformation deploy \
    --template-file "$(dirname "$0")/cloudformation.yaml" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        WebhookUrl="$WEBHOOK_URL" \
        BucketName="$BUCKET_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

# Get outputs
echo "Fetching credentials..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output json --region "$REGION")

ACCESS_KEY=$(echo "$OUTPUTS" | grep -A1 '"OutputKey": "AccessKeyId"' | grep OutputValue | cut -d'"' -f4)
SECRET_KEY=$(echo "$OUTPUTS" | grep -A1 '"OutputKey": "SecretAccessKey"' | grep OutputValue | cut -d'"' -f4)

echo ""
echo "=========================================="
echo "ADD THESE TO YOUR VERCEL ENVIRONMENT:"
echo "=========================================="
echo ""
echo "AWS_ACCESS_KEY_ID=$ACCESS_KEY"
echo "AWS_SECRET_ACCESS_KEY=$SECRET_KEY"
echo "AWS_REGION=$REGION"
echo "AWS_S3_BUCKET=$BUCKET_NAME"
echo ""
echo "=========================================="
echo ""
echo "Go to: https://vercel.com/your-project/settings/environment-variables"
echo "Add the above variables, then redeploy your app."
echo ""
