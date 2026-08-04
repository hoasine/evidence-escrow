"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { getContractAddress, getStudioUrl, ensureGenLayerNetwork } from "@/lib/genlayer/client";
import { EvidenceEscrowClient } from "@/lib/contracts/EvidenceEscrow";

export function useEscrowClient() {
  const { address } = useWallet();
  const contract = getContractAddress();
  return useMemo(() => {
    if (!contract) return null;
    return new EvidenceEscrowClient(contract, address, getStudioUrl());
  }, [contract, address]);
}

export function useDisputes() {
  const client = useEscrowClient();
  return useQuery({
    queryKey: ["disputes", getContractAddress()],
    queryFn: async () => {
      if (!client) return [];
      return client.getAllDisputes();
    },
    enabled: !!client,
    refetchInterval: 8000,
  });
}

export function useFileDispute() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      defendant: string;
      title: string;
      claim: string;
      evidenceUrls: string;
      stakeWei: bigint;
      responseWindowSeconds?: number;
    }) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.fileDispute(
        input.defendant,
        input.title,
        input.claim,
        input.evidenceUrls,
        input.stakeWei,
        input.responseWindowSeconds
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useSubmitDefense() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      disputeId: number;
      defense: string;
      evidenceUrls: string;
      stakeWei: bigint;
    }) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.submitDefense(
        input.disputeId,
        input.defense,
        input.evidenceUrls,
        input.stakeWei
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useJudgeDispute() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (disputeId: number) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.judgeDispute(disputeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useCancelExpiredDispute() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (disputeId: number) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.cancelExpiredDispute(disputeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useFinalizeDispute() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (disputeId: number) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.finalizeDispute(disputeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useAppealDispute() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      disputeId: number;
      reason: string;
      evidenceUrls: string;
      stakeWei: bigint;
    }) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.appealDispute(
        input.disputeId,
        input.reason,
        input.evidenceUrls,
        input.stakeWei
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useResolveAppeal() {
  const client = useEscrowClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (disputeId: number) => {
      if (!client) throw new Error("Contract address not set");
      await ensureGenLayerNetwork();
      return client.resolveAppeal(disputeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}
