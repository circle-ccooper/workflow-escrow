-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    circle_wallet_id VARCHAR NOT NULL,
    wallet_type VARCHAR NOT NULL,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    currency VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    circle_transaction_id VARCHAR NOT NULL,
    transaction_type VARCHAR NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Escrow Agreements table
CREATE TABLE escrow_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_wallet_id UUID NOT NULL REFERENCES wallets(id),
    depositor_wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    status VARCHAR NOT NULL,
    disbursement_date TIMESTAMP WITH TIME ZONE,
    terms JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dispute Resolutions table
CREATE TABLE dispute_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_agreement_id UUID NOT NULL REFERENCES escrow_agreements(id),
    resolver_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR NOT NULL,
    resolution_type VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for foreign keys and frequently queried columns
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_escrow_agreements_transaction_id ON escrow_agreements(transaction_id);
CREATE INDEX idx_escrow_agreements_beneficiary_wallet_id ON escrow_agreements(beneficiary_wallet_id);
CREATE INDEX idx_escrow_agreements_depositor_wallet_id ON escrow_agreements(depositor_wallet_id);
CREATE INDEX idx_dispute_resolutions_escrow_agreement_id ON dispute_resolutions(escrow_agreement_id);
CREATE INDEX idx_dispute_resolutions_resolver_user_id ON dispute_resolutions(resolver_user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_agreements_updated_at
    BEFORE UPDATE ON escrow_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();