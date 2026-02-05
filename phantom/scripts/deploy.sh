#!/bin/bash
# PHANTOM Deployment Script
# This script deploys all components of PHANTOM

set -e

echo "🔮 PHANTOM Deployment Script"
echo "================================"

# Check requirements
check_requirements() {
    echo "📋 Checking requirements..."
    
    command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }
    command -v forge >/dev/null 2>&1 || { echo "❌ Foundry is required"; exit 1; }
    command -v iexec >/dev/null 2>&1 || { echo "❌ iExec CLI is required (npm i -g iexec)"; exit 1; }
    
    echo "✅ All requirements met"
}

# Deploy iApp to iExec
deploy_iapp() {
    echo ""
    echo "📦 Deploying iApp to iExec..."
    cd iapp
    
    # Build Docker image
    echo "🐳 Building Docker image..."
    docker build -t phantomdefi/phantom-iapp:latest .
    
    # Push to Docker Hub (requires docker login)
    echo "⬆️  Pushing to Docker Hub..."
    docker push phantomdefi/phantom-iapp:latest
    
    # Initialize iExec wallet if not exists
    if [ ! -f "wallet.json" ]; then
        echo "🔑 Creating iExec wallet..."
        iexec wallet create --keystoredir .
    fi
    
    # Deploy to iExec
    echo "🚀 Deploying to iExec..."
    iexec app deploy --chain bellecour
    
    IAPP_ADDRESS=$(iexec app show --chain bellecour | grep "address:" | awk '{print $2}')
    echo "✅ iApp deployed at: $IAPP_ADDRESS"
    
    cd ..
    echo $IAPP_ADDRESS > .iapp_address
}

# Deploy contracts to Arbitrum Sepolia
deploy_contracts() {
    echo ""
    echo "📜 Deploying contracts to Arbitrum Sepolia..."
    cd contracts
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo "❌ PRIVATE_KEY environment variable not set"
        exit 1
    fi
    
    if [ -z "$RPC_URL" ]; then
        RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
    fi
    
    # Read iApp address if available
    if [ -f "../.iapp_address" ]; then
        IAPP_ADDRESS=$(cat ../.iapp_address)
    else
        IAPP_ADDRESS="0x0000000000000000000000000000000000000000"
    fi
    
    echo "🔨 Compiling contracts..."
    forge build
    
    echo "🚀 Deploying..."
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url $RPC_URL \
        --broadcast \
        --private-key $PRIVATE_KEY \
        -vvv
    
    echo "✅ Contracts deployed!"
    cd ..
}

# Update frontend .env
update_frontend() {
    echo ""
    echo "🎨 Updating frontend configuration..."
    
    # This would read deployed addresses from broadcast files
    # For now, remind user to update manually
    echo "⚠️  Please update frontend/.env.local with deployed contract addresses"
}

# Build frontend
build_frontend() {
    echo ""
    echo "🏗️  Building frontend..."
    cd frontend
    npm install
    npm run build
    echo "✅ Frontend built!"
    cd ..
}

# Main
main() {
    check_requirements
    
    echo ""
    echo "Select deployment option:"
    echo "1) Deploy everything (iApp + Contracts + Frontend)"
    echo "2) Deploy iApp only"
    echo "3) Deploy contracts only"
    echo "4) Build frontend only"
    read -p "Choice [1-4]: " choice
    
    case $choice in
        1)
            deploy_iapp
            deploy_contracts
            update_frontend
            build_frontend
            ;;
        2)
            deploy_iapp
            ;;
        3)
            deploy_contracts
            ;;
        4)
            build_frontend
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    echo "================================"
    echo "🎉 Deployment complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update frontend/.env.local with contract addresses"
    echo "2. Deploy frontend to Vercel: cd frontend && vercel"
    echo "3. Fund the Paymaster with ETH for gasless transactions"
    echo "4. Record your 4-minute demo video"
}

main "$@"
