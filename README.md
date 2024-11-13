# workflow-escrow

Automated escrow agent that facilitates secure transactions.

## Table of contents

- [Features](#features)
- [Demo](#demo)
- [Deploy to Vercel](#deploy-to-vercel)
- [Clone and run locally](#clone-and-run-locally)

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app -e with-supabase
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd name-of-new-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=[INSERT USDC CONTRACT ADDRESS]
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

5. Then start a local instance of the Supabase server:

   ```bash
   npx supabase start
   ```

> If that's your first time running the project, consider executing the migrations with `npx supabase migration up`

6. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [127.0.0.1:3000](http://127.0.0.1:3000/).

7. With the project up and running, open an ngrok tunnel on the same port as of the local development server:

   ```bash
   ngrok http 3000
   ```

8. Register a webhook at [Circle](https://console.circle.com/webhooks) with the URL provided by ngrok, it should look similar to this: `https://9940-170-239-106-57.ngrok-free.app`, this webhook should point to the `/api/webhooks/circle` endpoint, and ideally the webhook should be limited to the `transactions.outbound` event.

9. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.
