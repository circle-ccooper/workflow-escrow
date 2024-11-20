# workflow-escrow

Automated escrow agent that facilitates secure transactions.

## Table of contents

- [Clone and run locally](#clone-and-run-locally)

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

7. Register a webhook at [Circle](https://console.circle.com/webhooks) with the URL provided by ngrok, it should look similar to this: `https://9940-170-239-106-57.ngrok-free.app`, this webhook should point to the `/api/webhooks/circle` endpoint, and ideally the webhook should be limited to the `transactions.outbound` event.

8. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.
