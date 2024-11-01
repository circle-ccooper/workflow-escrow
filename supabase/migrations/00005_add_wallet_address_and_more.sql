-- Migration Up
ALTER TABLE wallets
    ADD COLUMN wallet_set_id UUID,
    ADD COLUMN wallet_address VARCHAR(255),
    ADD COLUMN account_type VARCHAR(50),
    ADD COLUMN blockchain VARCHAR(50);

CREATE INDEX idx_wallets_address ON wallets(wallet_address);

-- Add comments for clarity
COMMENT ON COLUMN wallets.wallet_set_id IS 'Reference to the wallet set';
COMMENT ON COLUMN wallets.wallet_address IS 'Blockchain wallet address';
COMMENT ON COLUMN wallets.account_type IS 'Type of blockchain account';
COMMENT ON COLUMN wallets.blockchain IS 'Name of the blockchain network';
