"use client";

import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getContractAddress } from "@/lib/genlayer/client";

export function ContractSetupBanner() {
  if (getContractAddress()) return null;

  return (
    <Alert className="border-amber-500/40 bg-amber-500/10 mb-8">
      <AlertCircle className="h-5 w-5 text-amber-400" />
      <AlertTitle className="text-amber-200">Contract not configured</AlertTitle>
      <AlertDescription className="text-amber-100/80 space-y-2">
        <p>
          Create <code className="text-accent">frontend/.env</code> with your deployed contract address:
        </p>
        <pre className="text-xs p-3 rounded-lg bg-black/40 overflow-x-auto">
          {`NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api`}
        </pre>
        <p className="text-sm">Then restart <code>npm run dev</code>.</p>
        <a
          href="https://studio.genlayer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline text-sm"
        >
          Open GenLayer Studio <ExternalLink className="w-3 h-3" />
        </a>
      </AlertDescription>
    </Alert>
  );
}
