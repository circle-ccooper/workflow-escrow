-- Migration Up
CREATE TABLE smart_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    escrow_agreement_id UUID NOT NULL REFERENCES escrow_agreements(id),
    contract_address VARCHAR(255),
    blockchain VARCHAR(50),
    status VARCHAR(50),
    -- Possible statuses: PENDING, DEPLOYED, ACTIVE, PAUSED, TERMINATED
    transaction_hash VARCHAR(255),
    deployer_address VARCHAR(255),
    parties JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    deployment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
-- Add indexes
CREATE INDEX idx_smart_contracts_wallet_id ON smart_contracts(wallet_id);
CREATE INDEX idx_smart_contracts_escrow_agreement_id ON smart_contracts(escrow_agreement_id);
CREATE INDEX idx_smart_contracts_contract_address ON smart_contracts(contract_address);
CREATE INDEX idx_smart_contracts_status ON smart_contracts(status);
CREATE INDEX idx_smart_contracts_blockchain ON smart_contracts(blockchain);
-- Add comments
COMMENT ON TABLE smart_contracts IS 'Stores information about deployed smart contracts related to escrow agreements';
COMMENT ON COLUMN smart_contracts.escrow_agreement_id IS 'Reference to the associated escrow agreement';
COMMENT ON COLUMN smart_contracts.contract_address IS 'The address where the smart contract is deployed';
COMMENT ON COLUMN smart_contracts.status IS 'Current status of the smart contract';
COMMENT ON COLUMN smart_contracts.parties IS 'Array of parties involved in the contract';
COMMENT ON COLUMN smart_contracts.metadata IS 'Additional contract metadata and configuration';
-- Migration Down
DROP TABLE IF EXISTS smart_contracts;