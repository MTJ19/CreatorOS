// E-sign provider interface. The spec leaves the provider unselected, so
// contract drafting/sending is built against this interface — swap
// StubEsignProvider for a real DocuSign/Zoho Sign/SignEasy implementation
// later without touching the contracts endpoint code.

export interface EsignEnvelope {
  envelopeId: string;
  signingUrl?: string;
}

export interface EsignStatusResult {
  status: "sent" | "viewed" | "signed" | "declined" | "voided";
}

export interface EsignProvider {
  createEnvelope(params: {
    docUrl: string;
    signerEmail: string;
    signerName: string;
  }): Promise<EsignEnvelope>;

  getStatus(envelopeId: string): Promise<EsignStatusResult>;
}

// ---- Stub implementation: lets the rest of the team build/test against
// this endpoint today. Replace with a real provider client once selected.
// DO NOT use in production — it does not actually collect a signature.
export class StubEsignProvider implements EsignProvider {
  async createEnvelope(params: {
    docUrl: string;
    signerEmail: string;
    signerName: string;
  }): Promise<EsignEnvelope> {
    const envelopeId = `stub_${crypto.randomUUID()}`;
    console.warn(
      `[StubEsignProvider] createEnvelope called for ${params.signerEmail} — ` +
        `no real e-sign provider configured yet. envelopeId=${envelopeId}`
    );
    return { envelopeId, signingUrl: `https://example.invalid/sign/${envelopeId}` };
  }

  async getStatus(envelopeId: string): Promise<EsignStatusResult> {
    console.warn(`[StubEsignProvider] getStatus called for ${envelopeId} — returning 'sent'`);
    return { status: "sent" };
  }
}

// Provider selection point — once a provider is chosen, branch here on an
// env var (ESIGN_PROVIDER) instead of changing call sites.
export function getEsignProvider(): EsignProvider {
  const provider = Deno.env.get("ESIGN_PROVIDER") ?? "stub";
  switch (provider) {
    // case "docusign": return new DocusignProvider(...);
    // case "zoho": return new ZohoSignProvider(...);
    default:
      return new StubEsignProvider();
  }
}
