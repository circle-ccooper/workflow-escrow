import React from "react";
import {
  Shield,
  Zap,
  CheckCircle,
  Wallet,
  FileText,
  FileSearch,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <Header />

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Why Choose Workflow Escrow?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-blue-500" />}
              title="AI-Powered Smart Contracts"
              description="Automatically transform agreements into blockchain-backed smart contracts."
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8 text-green-500" />}
              title="Secure and Trust-Free"
              description="Funds are protected in decentralized escrow until tasks are verified."
            />
            <FeatureCard
              icon={<Wallet className="w-8 h-8 text-amber-500" />}
              title="Instant Payments"
              description="Funds are released automatically upon AI task approval."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-4 mb-4">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Upload Your Agreement
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Provide a paper contract or agreement document.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 mb-4">
                <FileSearch className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Extraction</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Our AI extracts task details and payment terms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-4 mb-4">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Escrow Creation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A smart contract is deployed, holding funds securely.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-4 mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Validation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI reviews submitted work and triggers payment release.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Simplify Your Transactions?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join the future of secure and automated escrow services today.
          </p>
          <a
            href="#"
            className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg shadow hover:bg-blue-700 transition"
          >
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-slate-800">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
          © 2024 Dark Horse Labs. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="relative py-16 overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950 opacity-20" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-8">
          <h1 className="sr-only">
            Workflow Escrow - Secure and Automated Escrow Platform
          </h1>

          {/* Main headline */}
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-600 !leading-tight">
              Effortless Escrow for Secure Deals
            </p>
            <p className="mt-4 text-xl md:text-2xl text-center text-slate-600 dark:text-slate-400">
              AI-Powered Escrow Service for Reliable Payments and Task
              Validation
            </p>
          </div>

          {/* Decorative line */}
          <div className="w-full max-w-3xl">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-600 to-transparent opacity-20" />
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>24/7 Automated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Instant Settlement</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-center mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-center">
        {description}
      </p>
    </div>
  );
}
