import { ContractAnalysisResultSchema } from '@creator-os/shared';
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Prisma, ContractStatus, RiskSeverity } from '@prisma/client';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { extractTextFromFile } from '../storage/text-extractor';

import { CreateContractGenerationDto } from './contracts.dto';



@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
  ) {}

  async findAll(creatorId: string) {
    return this.prisma.contract.findMany({
      where: { creatorId },
      include: { riskFlags: true, deal: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, creatorId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { riskFlags: true, deal: true },
    });

    if (!contract || contract.creatorId !== creatorId) {
      throw new NotFoundException(`Contract with ID "${id}" not found`);
    }

    return contract;
  }

  /**
   * Programmatically generate a DOCX contract based on creator input
   */
  async generateContract(dto: CreateContractGenerationDto, creatorId: string): Promise<{ buffer: Buffer; filename: string }> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'COLLABORATION & CONTENT CREATION AGREEMENT',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `This Collaboration & Content Creation Agreement (the "Agreement") is entered into as of `,
                }),
                new TextRun({
                  text: new Date().toLocaleDateString(),
                  bold: true,
                }),
                new TextRun({
                  text: ` (the "Effective Date"), by and between `,
                }),
                new TextRun({
                  text: dto.creatorName,
                  bold: true,
                }),
                new TextRun({
                  text: ` ("Creator") and `,
                }),
                new TextRun({
                  text: dto.brandName,
                  bold: true,
                }),
                new TextRun({
                  text: ` ("Brand"). Creator and Brand may collectively be referred to as the "Parties."`,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: 'RECITALS',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: 'WHEREAS, Brand is engaged in the marketing and sale of products and services and desires to engage Creator to perform promotional and content creation services;',
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: 'WHEREAS, Creator is an independent content creator with social media reach and is willing to provide such services on the terms and conditions set forth herein;',
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: 'NOW, THEREFORE, the Parties agree as follows:',
              spacing: { after: 200 },
            }),

            // Section 1: Services & Deliverables
            new Paragraph({
              text: '1. Services & Deliverables',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: `Creator agrees to create and publish content (the "Deliverables") as outlined in the Campaign Details. Deliverables shall be posted to Creator's social channels. Creator shall have sole artistic control over the creation of the Deliverables, provided they comply with the campaign's reasonable brand guidelines.`,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: `1.1 Revision Limits: Brand shall be entitled to request up to ${dto.revisionLimit} round(s) of minor revisions to the draft Deliverables before publishing. Any additional revisions, or major structural changes not aligned with the initial brief, shall be subject to additional fees.`,
              spacing: { after: 200 },
            }),

            // Section 2: Compensation
            new Paragraph({
              text: '2. Compensation & Payment Terms',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: `Brand agrees to pay Creator the agreed fee upon delivery of the services. Payments shall be made within 30 days of invoice receipt.`,
              spacing: { after: 100 },
            }),
            dto.latePaymentPenaltyToggle
              ? new Paragraph({
                  text: `2.1 Late Payment Penalty: If Brand fails to make any payment by the due date, Creator reserves the right to charge a late fee of ${dto.latePaymentPenaltyPercent}% per month on all overdue balances until paid in full.`,
                  spacing: { after: 100 },
                })
              : new Paragraph({ text: '' }),
            new Paragraph({
              text: `2.2 Kill Fee: In the event that Brand cancels this Agreement or the campaign for convenience before the content is posted, Brand shall pay Creator a non-refundable "kill fee" equal to ${dto.killFeePercent}% of the total contract amount as compensation for work completed and schedule holding.`,
              spacing: { after: 200 },
            }),

            // Section 3: Intellectual Property & Usage Rights
            new Paragraph({
              text: '3. Intellectual Property & Usage Rights',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: `Unless otherwise agreed in writing, Creator retains all copyright and ownership rights in the Deliverables. Brand is granted a limited, non-exclusive license to use the Deliverables for: ${dto.usageRightsScope}.`,
              spacing: { after: 100 },
            }),
            (dto.exclusivityDays ?? 0) > 0
              ? new Paragraph({
                  text: `3.1 Exclusivity: For a period of ${dto.exclusivityDays} days following the final posting date, Creator agrees not to enter into similar promotional agreements or post sponsored content representing competitors in the following scope: ${dto.exclusivityScope || 'direct competitors in Brand\'s product category'}.`,
                  spacing: { after: 200 },
                })
              : new Paragraph({
                  text: '3.1 Exclusivity: This agreement is non-exclusive. Creator remains free to promote other brands and products, except direct competitor representations that create a conflict of interest during the active campaign period.',
                  spacing: { after: 200 },
                }),

            // Section 4: Compliance
            new Paragraph({
              text: '4. Compliance & Disclosures',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            dto.includeFtcDisclosure
              ? new Paragraph({
                  text: 'Creator shall make clear, conspicuous, and prominent disclosures in all posts, adhering strictly to the Federal Trade Commission (FTC) guidelines for endorsements and sponsorships (e.g., placing "#ad" or "#sponsored" visibly at the beginning of post descriptions).',
                  spacing: { after: 200 },
                })
              : new Paragraph({
                  text: 'Creator agrees to comply with all local advertising regulations regarding sponsored content disclosures.',
                  spacing: { after: 200 },
                }),

            // Section 5: Governing Law
            new Paragraph({
              text: '5. Miscellaneous & Governing Law',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: `This Agreement shall be governed by, and construed in accordance with, the laws of the State of ${dto.governingLaw}. Any disputes arising under this agreement shall be resolved in the courts located within that jurisdiction. This Agreement represents the entire agreement between the Parties.`,
              spacing: { after: 300 },
            }),

            // Signatures
            new Paragraph({
              text: 'IN WITNESS WHEREOF, the Parties have executed this Collaboration Agreement as of the Effective Date.',
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'CREATOR:\n\n_______________________\n', bold: true }),
                new TextRun({ text: `Name: ${dto.creatorName}\n` }),
                new TextRun({ text: 'Date: _________________\n\n\n' }),
                new TextRun({ text: 'BRAND:\n\n_______________________\n', bold: true }),
                new TextRun({ text: `Name: ${dto.brandName}\n` }),
                new TextRun({ text: 'Date: _________________\n' }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeBrand = dto.brandName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `contract_${safeBrand}_${Date.now()}.docx`;

    // If dealId is provided, let's also create a Draft contract in our DB
    if (dto.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dto.dealId },
      });
      if (deal && deal.creatorId === creatorId) {
        // Upload generated contract to storage to keep reference
        const fileObj = {
          buffer,
          originalname: filename,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const uploadResult = await this.storage.uploadFile(fileObj, `contracts/${dto.dealId}`);

        // Create or update contract record in DB
        await this.prisma.contract.upsert({
          where: { dealId: dto.dealId },
          update: {
            title: `Generated Agreement - ${dto.brandName}`,
            fileUrl: uploadResult.fileUrl,
            fileKey: uploadResult.fileKey,
            status: ContractStatus.DRAFT,
            governingLaw: dto.governingLaw || 'California',
          },
          create: {
            dealId: dto.dealId,
            creatorId,
            title: `Generated Agreement - ${dto.brandName}`,
            fileUrl: uploadResult.fileUrl,
            fileKey: uploadResult.fileKey,
            status: ContractStatus.DRAFT,
            governingLaw: dto.governingLaw || 'California',
          },
        });

        // Update deal stage to CONTRACT_SENT
        await this.prisma.deal.update({
          where: { id: dto.dealId },
          data: { stage: 'CONTRACT_SENT' },
        });
      }
    }

    return { buffer, filename };
  }

  /**
   * Upload an existing PDF/DOCX contract and trigger AI review
   */
  async uploadAndReviewContract(
    dealId: string,
    creatorId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal || deal.creatorId !== creatorId) {
      throw new NotFoundException(`Deal with ID "${dealId}" not found`);
    }

    // 1. Upload to storage
    const uploadResult = await this.storage.uploadFile(file, `contracts/${dealId}`);

    // 2. Extract text from contract
    const contractText = await extractTextFromFile(file.buffer, file.mimetype);

    // 3. Prompt Gemini to run comprehensive legal risk audit
    const prompt = `
You are an elite legal contract auditor specializing in influencer marketing and creator sponsorships.
Your job is to read the contract text and analyze it for potential risks, focusing on the following predefined risk lists.

---
IMMEDIATE RISK FLAGS TO AUDIT:
1. Perpetual IP: IP assignment, licensing, or rights usage that lasts forever/indefinitely instead of a limited duration (e.g. 1 year).
2. Unlimited Revisions: Clauses requiring the creator to do unlimited edits, or lacking a clear revision count limit (e.g. "at brand's sole discretion" without limits).
3. Missing Kill Fee: Lacking compensation for the creator if the campaign is cancelled before posting (e.g. 0% or no mention).
4. Overly Broad Non-Competes: Restricted from working with a huge list of competitor categories or for an excessively long time.
5. Auto-Renewals: Automatic renewal of contract or exclusivity without creator's written consent.
6. Indefinite Exclusivity: Exclusivity clauses with no defined end date, or lasting indefinitely.
7. Net-60+ Payment: Payment terms of Net 60, Net 90, or longer.
8. Unilateral Modification: Brand reserving the right to change contract terms, deliverables, or guidelines at any time without mutual consent.

FUTURE RISK FLAGS TO AUDIT:
1. Whitelisting Caps: Unlimited or uncapped advertising rights to the creator's social profiles/handles (whitelisting/boosting) without extra pay or duration limits.
2. Territory Creep: Intellectual property or usage rights extended globally (worldwide) when only regional rates were negotiated, or extending to new media/channels.
3. First Right of Refusal: Right of first refusal for future brand campaigns, locking the creator out of other deals.
4. Morality Clauses: Overly broad morality or termination clauses that let the brand terminate and claw back funds for minor or ambiguous reasons.
5. Revenue Share Escalators: Falsely promising high affiliate/rev-share payouts that are deferred behind complex, unrealistic sales tiers.
---

For each identified risk flag, provide:
- clause: The name/category of the risk flag (e.g., "Perpetual IP").
- clauseText: The exact text snippet or clause from the contract that triggers this risk flag. DO NOT include the entire contract text, only the relevant sentence/paragraph.
- severity: One of "LOW", "MEDIUM", "HIGH", "CRITICAL".
- description: A clear explanation of why this clause is a risk for the creator.
- recommendation: A practical action for the creator (e.g., "Request limit of 30 days usage").
- scenario: A brief real-world scenario of what could happen if they sign this as-is (e.g., "Brand runs paid ads with your face 5 years from now and you receive zero compensation").
- suggestedClause: A specific, copy-pasteable alternative clause they can ask the brand to use instead.

Also compute:
- overallRiskScore: A score from 0 (no risk) to 100 (extreme risk/unreasonable).
- summary: A high-level raw summary of the contract (1-2 paragraphs), highlighting key terms (duration, deliverables, payment) and major concerns.
- parties: List of names of parties involved in the contract.
- jurisdiction: Governing jurisdiction/court location if mentioned.
- governingLaw: The governing state/country law if mentioned.

Here is the contract text to analyze:
---
${contractText}
---

Provide only the JSON output matching the required schema. Do not write any preamble or code blocks.
`;

    const aiResult = await this.gemini.generateStructured(prompt, ContractAnalysisResultSchema);

    // 4. Create or update contract record in DB
    const contract = await this.prisma.contract.upsert({
      where: { dealId },
      update: {
        title: file.originalname,
        fileUrl: uploadResult.fileUrl,
        fileKey: uploadResult.fileKey,
        status: ContractStatus.PENDING_REVIEW,
        parties: aiResult.parties || [],
        jurisdiction: aiResult.jurisdiction || null,
        governingLaw: aiResult.governingLaw || null,
        aiSummary: aiResult.summary || null,
        overallRiskScore: aiResult.overallRiskScore || null,
      },
      create: {
        dealId,
        creatorId,
        title: file.originalname,
        fileUrl: uploadResult.fileUrl,
        fileKey: uploadResult.fileKey,
        status: ContractStatus.PENDING_REVIEW,
        parties: aiResult.parties || [],
        jurisdiction: aiResult.jurisdiction || null,
        governingLaw: aiResult.governingLaw || null,
        aiSummary: aiResult.summary || null,
        overallRiskScore: aiResult.overallRiskScore || null,
      },
    });

    // Clean up existing risk flags for this contract
    await this.prisma.contractRiskFlag.deleteMany({
      where: { contractId: contract.id },
    });

    // Insert new risk flags
    if (aiResult.riskFlags && aiResult.riskFlags.length > 0) {
      await this.prisma.contractRiskFlag.createMany({
        data: aiResult.riskFlags.map((flag) => ({
          contractId: contract.id,
          clause: flag.clause.slice(0, 500),
          clauseText: flag.clauseText || null,
          severity: flag.severity as RiskSeverity,
          description: flag.description,
          recommendation: flag.recommendation || null,
          scenario: flag.scenario || null,
          suggestedClause: flag.suggestedClause || null,
        })),
      });
    }

    // Update deal stage to NEGOTIATING
    await this.prisma.deal.update({
      where: { id: dealId },
      data: { stage: 'NEGOTIATING' },
    });

    return this.prisma.contract.findUnique({
      where: { id: contract.id },
      include: { riskFlags: true, deal: true },
    });
  }

  /**
   * Acknowledge a single risk flag
   */
  async acknowledgeFlag(flagId: string, creatorId: string) {
    const flag = await this.prisma.contractRiskFlag.findUnique({
      where: { id: flagId },
      include: { contract: true },
    });

    if (!flag || flag.contract.creatorId !== creatorId) {
      throw new NotFoundException(`Risk flag with ID "${flagId}" not found`);
    }

    return this.prisma.contractRiskFlag.update({
      where: { id: flagId },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }
}
