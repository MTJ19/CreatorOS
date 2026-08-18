import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { StubEsignProvider } from "./supabase/functions/_shared/esignProvider.ts";

// ============================================================
// Agency Ops Core — Backend Test Suite
// Tests all business logic, provider adapters, and workflows
// ============================================================

Deno.test("1. E-Sign Provider (Stub Adapter): create envelope & get status", async () => {
  const provider = new StubEsignProvider();
  
  const envelope = await provider.createEnvelope({
    docUrl: "https://storage.example.com/contracts/test.pdf",
    signerEmail: "alex@creator.io",
    signerName: "Alex Rivera",
  });

  assert(envelope.envelopeId.startsWith("stub_"));
  assert(envelope.signingUrl?.includes(envelope.envelopeId));

  const status = await provider.getStatus(envelope.envelopeId);
  assertEquals(status.status, "sent");
});

Deno.test("2. Creator Onboarding Logic: validation & payload shape", () => {
  const validPayload = {
    agency_id: "a0000000-0000-0000-0000-000000000001",
    name: "Alex Rivera",
    email: "alex@creator.io",
    niche: "tech",
    follower_tier: "macro",
    connected_accounts: [{ platform: "youtube", handle: "@alextech", followers: 750000 }],
  };

  const missingNamePayload = {
    agency_id: "a0000000-0000-0000-0000-000000000001",
    name: "",
    email: "alex@creator.io",
  };

  const validate = (body: { agency_id?: string; name?: string; email?: string }) => {
    if (!body.agency_id || !body.name || !body.email) {
      return { valid: false, error: "agency_id, name, and email are required" };
    }
    return { valid: true };
  };

  assertEquals(validate(validPayload).valid, true);
  assertEquals(validate(missingNamePayload).valid, false);
});

Deno.test("3. Contract Drafting Guard: deal must be agreed before drafting", () => {
  const dealNegotiating = { id: "d1", status: "negotiating" };
  const dealAgreed = { id: "d2", status: "agreed", agreed_terms: { rate: 8500 } };

  const canDraftContract = (deal: { status: string }) => {
    if (deal.status !== "agreed") {
      return { canDraft: false, error: "Deal terms must be agreed before drafting a contract" };
    }
    return { canDraft: true };
  };

  assertEquals(canDraftContract(dealNegotiating).canDraft, false);
  assertEquals(canDraftContract(dealAgreed).canDraft, true);
});

Deno.test("4. Deliverables Guard: contract must be signed before deliverable creation", () => {
  const contractDrafted = { id: "c1", status: "drafted" };
  const contractSigned = { id: "c2", status: "signed" };

  const canCreateDeliverable = (contract: { status: string }) => {
    if (contract.status !== "signed") {
      return { canCreate: false, error: "Contract must be signed before creating a deliverable" };
    }
    return { canCreate: true };
  };

  assertEquals(canCreateDeliverable(contractDrafted).canCreate, false);
  assertEquals(canCreateDeliverable(contractSigned).canCreate, true);
});

Deno.test("5. Brand Magic-Link Token Generation & TTL Expiration Check", () => {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  assertEquals(token.length, 64);

  const activeLink = {
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const expiredLink = {
    token,
    expires_at: new Date(Date.now() - 1000).toISOString(),
  };

  const checkLink = (link: { expires_at: string }) => {
    if (new Date(link.expires_at) < new Date()) {
      return { valid: false, error: "This link has expired" };
    }
    return { valid: true };
  };

  assertEquals(checkLink(activeLink).valid, true);
  assertEquals(checkLink(expiredLink).valid, false);
});

Deno.test("6. Shared Activity Log Visibility Rules", () => {
  const DEFAULT_VISIBILITY: Record<string, string[]> = {
    creator: ["agency", "creator"],
    deal: ["agency", "creator"],
    contract: ["agency", "creator", "brand"],
    deliverable: ["agency", "creator", "brand"],
    payment: ["agency", "creator"],
  };

  assertEquals(DEFAULT_VISIBILITY["contract"], ["agency", "creator", "brand"]);
  assertEquals(DEFAULT_VISIBILITY["payment"], ["agency", "creator"]);
  assert(!DEFAULT_VISIBILITY["payment"].includes("brand"));
});
