#!/bin/bash

# Array of networks
networks=(
    "sepolia"
    "mainnet"
    "arbitrum-sepolia"
    "arbitrum-one"
    "base-sepolia"
    "base"
)

# Function to delete subgraph with confirmation
delete_subgraph() {
    local network=$1

    # Note: update version if needed
    local subgraph_name="royco-vault-${network}/1.0.1" 
    
    echo "Attempting to delete ${subgraph_name}..."
    goldsky subgraph delete "${subgraph_name}" --force || true 
}

# Main execution
echo "Starting subgraph management script..."

for network in "${networks[@]}"; do
    delete_subgraph "$network"
done

# First, handle deletions
echo "=== Deletion Phase ==="