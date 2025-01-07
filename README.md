# workflow-escrow

Automated escrow agent that facilitates secure transactions.

## Table of contents

- [Clone and run locally](#clone-and-run-locally)
- [Using Supabase Cloud](#using-supabase-cloud)
- [Project Structure](#project-structure)

## Clone and run locally

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/[username]/workflow-escrow.git
   cd workflow-escrow
   npm install
   ```

2. Rename `.env.example` to `.env.local` and update the following:

   ```
   # Deployment URL (e.g., https://your-app.vercel.app)
   VERCEL_URL=
   NEXT_PUBLIC_VERCEL_URL= 

   # Supabase configuration (https://app.supabase.com/project/_/settings/api)
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=

   # USDC Smart Contract configuration
   NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=

   # Agent Wallet configuration
   NEXT_PUBLIC_AGENT_WALLET_ID=
   NEXT_PUBLIC_AGENT_WALLET_ADDRESS=

   # Circle API configuration (https://console.circle.com/apikeys)
   CIRCLE_API_KEY=
   CIRCLE_ENTITY_SECRET=
   CIRCLE_BLOCKCHAIN=

   # OpenAI API configuration (https://platform.openai.com/api-keys)
   OPENAI_API_KEY=
   ```
   - `VERCEL_URL` and `NEXT_PUBLIC_VERCEL_URL` is the base URL of the project (i.e. `https://your-app.vercel.app`).

   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://app.supabase.com/project/_/settings/api).

   - `CIRCLE_API_KEY` can be found in the [API Keys](https://console.circle.com/api-keys) section of Circle's console, while `CIRCLE_ENTITY_SECRET` must be shared, or rotated [here](https://console.circle.com/wallets/dev/configurator/entity-secret) in case it's lost.

   - `CIRCLE_BLOCKCHAIN` can be set to `MATIC-AMOY` for development purposes

   - `OPENAI_API_KEY` can be found in the [Settings](https://platform.openai.com/settings) of your OpenAI account (Settings > API keys), while `OPENAI_ASSISTANT_ID` is located on the [Assistants](https://platform.openai.com/assistants) page, after selecting the desired assistant, the ID can be seen right below the "Name" input.

   - `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS` is documented [here](https://developers.circle.com/stablecoins/usdc-on-test-networks) alongside other blockchain test networks, like Polygon PoS Amoy (the one used in the project).

   - For development purposes, `NEXT_PUBLIC_AGENT_WALLET_ID` and `NEXT_PUBLIC_AGENT_WALLET_ADDRESS` can be the id and address of the developer controlled wallet registered on [Circle](https://console.circle.com/wallets/dev/wallets) that you want to use for the escrow agent.

3. Then start a local instance of the Supabase server:

   ```bash
   npx supabase start
   ```

4. Initialize the database schema:

   ```bash
   npx supabase migration up
   ```

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. With the project up and running, open an ngrok tunnel on the same port as of the local development server:

   ```bash
   ngrok http 3000
   ```

7. Configure the Circle webhook:

   a. Go to [Circle Webhooks Dashboard](https://console.circle.com/webhooks)
   b. Click "Add Webhook"
   c. Configure the following settings:
      - Endpoint URL: Your ngrok URL + `/api/webhooks/circle` (e.g., `https://9940-170-239-106-57.ngrok-free.app/api/webhooks/circle`)
      - Events: Select only `transactions.outbound`
      - Status: Enabled
   d. Save the webhook configuration

   Note: The webhook is essential for processing transaction status updates. Ensure it's properly configured before testing transactions.

8. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Using Supabase Cloud

If you prefer to use Supabase Cloud instead of running it locally:

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/[username]/workflow-escrow.git
   cd workflow-escrow
   npm install
   ```

2. Rename `.env.example` to `.env.local` and update the following:

   ```
   # Deployment URL (e.g., https://your-app.vercel.app)
   VERCEL_URL=
   NEXT_PUBLIC_VERCEL_URL= 

   # Supabase configuration (https://app.supabase.com/project/_/settings/api)
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=

   # USDC Smart Contract configuration
   NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=

   # Agent Wallet configuration
   NEXT_PUBLIC_AGENT_WALLET_ID=
   NEXT_PUBLIC_AGENT_WALLET_ADDRESS=

   # Circle API configuration (https://console.circle.com/apikeys)
   CIRCLE_API_KEY=
   CIRCLE_ENTITY_SECRET=
   CIRCLE_BLOCKCHAIN=

   # OpenAI API configuration (https://platform.openai.com/api-keys)
   OPENAI_API_KEY=
   ```

   - `VERCEL_URL` and `NEXT_PUBLIC_VERCEL_URL` is the base URL of the project (i.e. `https://your-app.vercel.app`).

   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://app.supabase.com/project/_/settings/api).

   - `CIRCLE_API_KEY` can be found in the [API Keys](https://console.circle.com/api-keys) section of Circle's console, while `CIRCLE_ENTITY_SECRET` must be shared, or rotated [here](https://console.circle.com/wallets/dev/configurator/entity-secret) in case it's lost.

   - `CIRCLE_BLOCKCHAIN` can be set to `MATIC-AMOY` for development purposes

   - `OPENAI_API_KEY` can be found in the [Settings](https://platform.openai.com/settings) of your OpenAI account (Settings > API keys), while `OPENAI_ASSISTANT_ID` is located on the [Assistants](https://platform.openai.com/assistants) page, after selecting the desired assistant, the ID can be seen right below the "Name" input.

   - `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS` is documented [here](https://developers.circle.com/stablecoins/usdc-on-test-networks) alongside other blockchain test networks, like Polygon PoS Amoy (the one used in the project).

   - For development purposes, `NEXT_PUBLIC_AGENT_WALLET_ID` and `NEXT_PUBLIC_AGENT_WALLET_ADDRESS` can be the id and address of the developer controlled wallet registered on [Circle](https://console.circle.com/wallets/dev/wallets) that you want to use for the escrow agent.

3. Create a new project on [Supabase](https://app.supabase.com)

4. Set up authentication:
   - Go to Authentication > Providers
   - Enable Email provider
   - Disable "Confirm Email" to allow immediate sign-ins

5. Link your local project to your Supabase cloud project and push the database schema:
   ```bash
   # Install Supabase CLI if you haven't already
   npm install supabase --save-dev

   # Link to your remote project - you'll need your project ID and database password
   npx supabase link --project-ref <project-id>

   # Push the database schema
   npx supabase db push
   ```
   > Note: You can find your project ID in your Supabase project settings under Project Settings > General

6. You can now run the Next.js development server:

   ```bash
   npm run dev
   ```

7. With the project up and running, open an ngrok tunnel on the same port as of the local development server:

   ```bash
   ngrok http 3000
   ```

8. Configure the Circle webhook:

   a. Go to [Circle Webhooks Dashboard](https://console.circle.com/webhooks)
   b. Click "Add Webhook"
   c. Configure the following settings:
      - Endpoint URL: Your ngrok URL + `/api/webhooks/circle` (e.g., `https://9940-170-239-106-57.ngrok-free.app/api/webhooks/circle`)
      - Events: Select only `transactions.outbound`
      - Status: Enabled
   d. Save the webhook configuration

   Note: The webhook is essential for processing transaction status updates. Ensure it's properly configured before testing transactions.

## Project Structure

```
.
├── app/                    # Next.js 13+ app directory (main application code)
│   ├── actions/           # Server actions for form handling and data mutations
│   ├── api/               # API routes and endpoints
│   │   ├── contracts/     # Contract-related endpoints (analyze, escrow, validate)
│   │   ├── usdc/         # USDC token operations (buy, sell)
│   │   ├── wallet/       # Wallet operations (balance, transactions)
│   │   ├── wallet-set/   # Wallet set configuration
│   │   └── webhooks/     # Webhook handlers (Circle notifications)
│   ├── auth/             # Authentication core functionality
│   │   ├── auth-error/   # Error handling for auth failures
│   │   └── callback/     # OAuth and auth callback handling
│   ├── (auth-pages)/     # Authentication-related pages
│   │   ├── forgot-password/  # Password reset request
│   │   ├── sign-in/      # Login page
│   │   └── sign-up/      # Registration page
│   └── dashboard/        # Protected dashboard routes
│       ├── reset-password/  # Password reset form
│       └── transaction/   # Transaction details view
│
├── components/            # Reusable React components
│   ├── ui/               # Core UI components
│   │   ├── alert-dialog/ # Alert and confirmation dialogs
│   │   ├── button/      # Button components
│   │   ├── card/        # Card layout components
│   │   ├── dialog/      # Modal dialog components
│   │   └── form/        # Form input components
│   ├── agreement/       # Agreement-related components
│   │   ├── delete/      # Agreement deletion dialogs
│   │   ├── details/     # Agreement details views
│   │   └── table/       # Agreement listing components
│   └── wallet/          # Wallet-related components
│       ├── balance/     # Balance display components
│       └── transactions/# Transaction history components
│
├── contracts/              # Smart contract definitions and ABIs
│   ├── escrow_smart_contract/  # Escrow contract implementation
│   └── example_agreement/      # Example agreement with good and bad submission examples
│
├── lib/                    # Library code and utilities
│   ├── supabase/           # Supabase client configuration
│   └── utils/              # Utility functions and helpers
│
├── supabase/               # Supabase-specific configuration
│   └── migrations/         # Database migration files
│
└── types/                  # TypeScript type definitions
```

### Key Directories

- **`app/`**: Core application code using Next.js 13+ app directory structure
  - `actions/`: Server-side actions for authentication and data mutations
  - `api/`: Backend API endpoints organized by functionality:
    - `contracts/`: Smart contract interactions and document analysis
    - `usdc/`: USDC token purchase and sale operations
    - `wallet/`: Digital wallet management and transactions
    - `webhooks/`: External service webhook handlers
  - `auth/`: Authentication system implementation
  - `(auth-pages)/`: Authentication-related pages (login, signup, password reset)
  - `dashboard/`: Protected application routes and features

- **`components/`**: Reusable React components organized by function
  - `ui/`: Core UI component library

- **`contracts/`**: Smart contract related files
  - `escrow_smart_contract/`: Contains the `EscrowWithAgent.sol` contract, which implements the escrow system with agent functionality
  - `example_agreement/`: Contains an example agreement and examples of good and bad submissions

- **`lib/`**: Utility functions and external service configurations
  - `supabase/`: Database client configuration for browser and server
  - `utils/`: Helper functions for amounts, dates, and API clients

- **`types/`**: TypeScript type definitions
  - Database schema types
  - Agreement and escrow-related type definitions
  - Component prop types

- **`supabase/`**: Database configuration and management
  - `migrations/`: SQL migration files for schema changes
  - Configuration files for Supabase setup

This structure follows a modular architecture that separates concerns between the frontend, backend APIs, smart contracts, and database layers while maintaining a clear organization for scaling the application.