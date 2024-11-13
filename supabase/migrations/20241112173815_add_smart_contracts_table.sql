create table if not exists public.smart_contracts (
    id uuid not null default uuid_generate_v4() primary key,
    wallet_id uuid references public.wallets(id),
    escrow_agreement_id uuid not null references public.escrow_agreements(id),
    contract_address varchar(255),
    blockchain varchar(50),
    status varchar(50) default 'PENDING'::varchar,
    transaction_hash varchar(255),
    deployer_address varchar(255),
    parties jsonb default '[]'::jsonb,
    metadata jsonb default '{}'::jsonb,
    deployment_date timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    is_active boolean default true
);

create index if not exists smart_contracts_wallet_id_idx on public.smart_contracts (wallet_id);
create index if not exists smart_contracts_escrow_agreement_id_idx on public.smart_contracts (escrow_agreement_id);