# workflow-escrow

Automated escrow agent that facilitates secure transactions.

## Table of contents

- [Clone and run locally](#clone-and-run-locally)
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
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=[INSERT USDC CONTRACT ADDRESS]
   NEXT_PUBLIC_AGENT_WALLET_ID=[INSERT AGENT WALLET ID]
   CIRCLE_API_KEY=[INSERT CIRCLE API KEY]
   CIRCLE_ENTITY_SECRET=[INSERT CIRCLE ENTITY SECRET]
   GOOGLE_CLIENT_ID=[INSERT GOOGLE CLIENT ID]
   GOOGLE_CLIENT_SECRET=[INSERT GOOGLE CLIENT SECRET]
   OPENAI_API_KEY=[INSERT OPENAI API KEY]
   OPENAI_ASSISTANT_ID=[INSERT OPENAI ASSISTANT ID]
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://app.supabase.com/project/_/settings/api).

   - `CIRCLE_API_KEY` can be found in the [API Keys](https://console.circle.com/api-keys) section of Circle's console, while `CIRCLE_ENTITY_SECRET` must be shared, or rotated [here](https://console.circle.com/wallets/dev/configurator/entity-secret) in case it's lost.

   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` can be found in the [Google Cloud Developer Console](https://console.cloud.google.com/apis/credentials?project=workflow-escrow) of the project (APIs & Services > Credentials > Web).

   - `OPENAI_API_KEY` can be found in the [Settings](https://platform.openai.com/settings) of your OpenAI account (Settings > API keys), while `OPENAI_ASSISTANT_ID` is located on the [Assistants](https://platform.openai.com/assistants) page, after selecting the desired assistant, the ID can be seen right below the "Name" input.

   - `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS` is documented [here](https://developers.circle.com/stablecoins/usdc-on-test-networks) alongside other blockchain test networks, like Polygon PoS Amoy (the one used in the project).

   - For development purposes, `NEXT_PUBLIC_AGENT_WALLET_ID` can be the address of any developer controlled wallet registered on [Circle](https://console.circle.com/wallets/dev/wallets), that might change for a production scenario.

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

   The starter kit should now be running on [127.0.0.1:3000](http://127.0.0.1:3000/).

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

## Project Structure

```
.
├── app/                    # Next.js 13+ app directory (main application code)
│   ├── actions/            # Server actions for form handling and data mutations
│   ├── api/                # API routes and endpoints
│   │   ├── contracts/      # Smart contract interaction endpoints
│   │   ├── wallet/         # Digital wallet management endpoints
│   │   ├── wallet-set/     # Wallet configuration endpoints
│   │   └── webhooks/       # Webhook handlers (e.g., Circle payment notifications)
│   ├── auth/               # Authentication core functionality
│   ├── (auth-pages)/       # Authentication-related pages (grouped route)
│   ├── dashboard/          # Dashboard views and functionality
│   ├── hooks/              # Custom React hooks
│   └── services/           # Business logic and external service integrations
│
├── components/             # Reusable React components
│   ├── tutorial/           # Tutorial and onboarding components
│   ├── typography/         # Text styling components
│   └── ui/                 # UI components library
│
├── contracts/              # Smart contract definitions and ABIs
│   └── escrow-with-agent/  # Escrow contract implementation
│
├── lib/                    # Library code and utilities
│   ├── supabase/           # Supabase client configuration
│   └── utils/              # Utility functions and helpers
│
├── supabase/               # Supabase-specific configuration
│   ├── migrations/         # Database migration files
│   └── tests/              # Supabase-related tests
│
└── types/                  # TypeScript type definitions
```

### Key Directories

- **`app/`**: Core application code using Next.js 13+ app directory structure
  - `actions/`: Server-side actions for data mutations
  - `api/`: Backend API endpoints for contracts, wallets, and webhooks
  - `auth/`: Authentication system implementation
  - `dashboard/`: Main application dashboard features
  - `hooks/`: Reusable React hooks
  - `services/`: Business logic layer

- **`components/`**: Reusable React components organized by function
  - `ui/`: Core UI component library
  - `typography/`: Text and typography-related components
  - `tutorial/`: User onboarding and tutorial components

- **`contracts/`**: Smart contract related files
  - `escrow-with-agent/`: Implementation of the escrow system with agent functionality

- **`lib/`**: Utility functions and external service configurations
  - `supabase/`: Supabase database configuration and helpers
  - `utils/`: General utility functions

- **`supabase/`**: Database configuration and management
  - `migrations/`: Database schema migrations
  - `tests/`: Database-related tests

- **`types/`**: TypeScript type definitions for the project

This structure follows a modular architecture that separates concerns between the frontend, backend APIs, smart contracts, and database layers while maintaining a clear organization for scaling the application.