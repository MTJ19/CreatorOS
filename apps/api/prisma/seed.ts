import { PrismaClient, SocialPlatform, ContentFormat, DealType, BrandTier, DealStatus, DealStage, ContractStatus, InvoiceStatus, PersonaSegment } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_COMPARABLES = [
  {
    platform: SocialPlatform.INSTAGRAM,
    contentFormat: ContentFormat.SHORT_FORM_VIDEO,
    followerRange: '10K–50K',
    niche: 'tech',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MID,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 0,
    baseRate: 450.0,
    currency: 'USD',
    engagementRate: 3.5,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Creator survey 2026',
  },
  {
    platform: SocialPlatform.INSTAGRAM,
    contentFormat: ContentFormat.SHORT_FORM_VIDEO,
    followerRange: '50K–200K',
    niche: 'lifestyle',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MACRO,
    usageRights: ['ORGANIC_ONLY', 'PAID_ADS'],
    exclusivityDays: 30,
    baseRate: 1500.0,
    currency: 'USD',
    engagementRate: 2.1,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Influencer agency report',
  },
  {
    platform: SocialPlatform.YOUTUBE,
    contentFormat: ContentFormat.LONG_FORM_VIDEO,
    followerRange: '50K–200K',
    niche: 'tech',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.ENTERPRISE,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 14,
    baseRate: 5000.0,
    currency: 'USD',
    engagementRate: 4.8,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Verified contract upload',
  },
  {
    platform: SocialPlatform.TIKTOK,
    contentFormat: ContentFormat.SHORT_FORM_VIDEO,
    followerRange: '200K–1M',
    niche: 'beauty',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MEGA,
    usageRights: ['ORGANIC_ONLY', 'WHITELISTING'],
    exclusivityDays: 60,
    baseRate: 3500.0,
    currency: 'USD',
    engagementRate: 5.2,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Creator community submission',
  },
  {
    platform: SocialPlatform.LINKEDIN,
    contentFormat: ContentFormat.STATIC_IMAGE,
    followerRange: '10K–50K',
    niche: 'business',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MID,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 7,
    baseRate: 800.0,
    currency: 'USD',
    engagementRate: 4.0,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'LinkedIn creator community',
  },
  {
    platform: SocialPlatform.PODCAST,
    contentFormat: ContentFormat.PODCAST,
    followerRange: '1K–10K',
    niche: 'finance',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MICRO,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 0,
    baseRate: 250.0,
    currency: 'USD',
    engagementRate: 1.5,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Podcast network pricing sheet',
  },
  {
    platform: SocialPlatform.INSTAGRAM,
    contentFormat: ContentFormat.CAROUSEL,
    followerRange: '50K–200K',
    niche: 'fashion',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MACRO,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 30,
    baseRate: 1200.0,
    currency: 'USD',
    engagementRate: 2.8,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Agency contract',
  },
  {
    platform: SocialPlatform.YOUTUBE,
    contentFormat: ContentFormat.LONG_FORM_VIDEO,
    followerRange: '200K–1M',
    niche: 'education',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.ENTERPRISE,
    usageRights: ['ORGANIC_ONLY', 'REPURPOSE_ALLOWED'],
    exclusivityDays: 90,
    baseRate: 12000.0,
    currency: 'USD',
    engagementRate: 3.9,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Verified creator contract',
  },
  {
    platform: SocialPlatform.TIKTOK,
    contentFormat: ContentFormat.SHORT_FORM_VIDEO,
    followerRange: '10K–50K',
    niche: 'gaming',
    dealType: DealType.UGC,
    brandTier: BrandTier.MICRO,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 0,
    baseRate: 300.0,
    currency: 'USD',
    engagementRate: 6.7,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'UGC hub submission',
  },
  {
    platform: SocialPlatform.INSTAGRAM,
    contentFormat: ContentFormat.STORIES,
    followerRange: '50K–200K',
    niche: 'travel',
    dealType: DealType.SPONSORED_POST,
    brandTier: BrandTier.MID,
    usageRights: ['ORGANIC_ONLY'],
    exclusivityDays: 0,
    baseRate: 600.0,
    currency: 'USD',
    engagementRate: 1.8,
    country: 'US',
    year: 2026,
    isVerified: true,
    source: 'Creator rate card survey',
  },
];

import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('Clearing existing database...');
  await prisma.comparableDeal.deleteMany();
  await prisma.contractRiskFlag.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding comparable deals...');
  for (const deal of SEED_COMPARABLES) {
    await prisma.comparableDeal.create({
      data: deal,
    });
  }
  console.log(`Successfully seeded ${SEED_COMPARABLES.length} comparable deals.`);

  console.log('Seeding user and relationships...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'test@creatoros.com',
      name: 'Test Creator',
      password: hashedPassword,
      profile: {
        create: {
          bio: 'Test creator bio',
          niche: ['tech'],
          totalFollowers: 100000,
        }
      }
    }
  });

  const deal = await prisma.deal.create({
    data: {
      creatorId: user.id,
      brandName: 'Acme Corp',
      title: 'Acme Corp Sponsorship',
      amount: 5000.0,
      status: DealStatus.ACTIVE,
      stage: DealStage.ACTIVE,
    }
  });

  const contract = await prisma.contract.create({
    data: {
      creatorId: user.id,
      dealId: deal.id,
      title: 'Acme Corp Agreement',
      status: ContractStatus.SIGNED,
    }
  });

  const invoice = await prisma.invoice.create({
    data: {
      creatorId: user.id,
      dealId: deal.id,
      invoiceNumber: 'INV-001',
      brandName: 'Acme Corp',
      brandEmail: 'billing@acme.corp',
      totalAmount: 5000.0,
      subtotal: 5000.0,
      status: InvoiceStatus.DRAFT,
    }
  });

  console.log(`Successfully seeded User (test@creatoros.com), Deal, Contract, and Invoice.`);

  console.log('Seeding evaluator personas for Phase 3...');
  await prisma.contentScorePersonaResult.deleteMany();
  await prisma.contentScore.deleteMany();
  await prisma.contentScoreRun.deleteMany();
  await prisma.content.deleteMany();
  await prisma.evaluatorPersona.deleteMany();

  const personas = [
    // ─── NICHE AUDIENCE ──────────────────────────────────────
    {
      name: 'Elena Rostova',
      segment: PersonaSegment.NICHE,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      demographics: '29, Senior Full-Stack Engineer & AI Builder, San Francisco',
      bio: 'Deeply technical, values architectural clarity, intolerant of hand-wavy marketing claims, loves practical utility and code walkthroughs.',
      evaluationPrompt: 'Evaluate from the perspective of an experienced practitioner in this niche. Look for factual depth, authentic technical nuance, actionable value, and absence of generic buzzwords. Does the hook respect the viewer\'s expertise?',
    },
    {
      name: 'Marcus Vance',
      segment: PersonaSegment.NICHE,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      demographics: '34, Bootstrapped SaaS Founder & Creator, Austin',
      bio: 'Focuses on ROI, monetization, practical frameworks, and real metrics. Highly sensitive to fluff, respects real data.',
      evaluationPrompt: 'Evaluate as a domain insider and business operator. Is there tangible signal or is it empty posturing? Would sharing this validate your own professional credibility?',
    },
    {
      name: 'Dr. Priya Nair',
      segment: PersonaSegment.NICHE,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      demographics: '38, Tech Lead & Systems Specialist, London',
      bio: 'Detailed and analytical, cares about precision, clarity of explanation, and systematic reasoning.',
      evaluationPrompt: 'Evaluate as a specialist. Does the content clearly state the premise within 5 seconds? Is the information accurate and properly contextualized?',
    },
    {
      name: 'Kai Takahashi',
      segment: PersonaSegment.NICHE,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      demographics: '26, Indie Designer & Creative Technologist, Tokyo',
      bio: 'Appreciates craftsmanship, typography, clean pacing, and visual storytelling that honors the subject matter.',
      evaluationPrompt: 'Evaluate as a design and product specialist in this niche. Is the aesthetic intentional? Does the pacing keep you engaged without feeling cheap or spammy?',
    },
    {
      name: 'Sarah Jenkins',
      segment: PersonaSegment.NICHE,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      demographics: '31, Community Lead & Power User, Seattle',
      bio: 'Advocate for domain best practices. Wants practical takeaways that empower her peers.',
      evaluationPrompt: 'Evaluate as a core niche community member. Would you recommend this to a fellow peer? Does it spark insightful discussion in the comments?',
    },

    // ─── COLD OUTSIDER ───────────────────────────────────────
    {
      name: 'David Miller',
      segment: PersonaSegment.COLD_OUTSIDER,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      demographics: '45, Corporate Accountant & Suburban Parent, Ohio',
      bio: 'Has zero prior knowledge of creator tools or tech jargon. Easily alienated by insider acronyms, needs instant contextual clarity.',
      evaluationPrompt: 'Evaluate as someone completely outside this niche who stumbled upon this on their feed. Is the hook immediately comprehensible? Do you understand what problem is being solved in plain English, or does it feel like a foreign language?',
    },
    {
      name: 'Chloe Bennett',
      segment: PersonaSegment.COLD_OUTSIDER,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      demographics: '23, Kindergarten Teacher, Melbourne',
      bio: 'Browses social media purely for entertainment, uplifting stories, or simple life hacks. Skips quickly if confused.',
      evaluationPrompt: 'Evaluate as a general spectator. Does the content grab your curiosity even if you don\'t care about the specific industry? Is it emotionally resonant or intriguing, or do you swipe away within 2 seconds?',
    },
    {
      name: 'Robert Zhang',
      segment: PersonaSegment.COLD_OUTSIDER,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      demographics: '52, Civil Engineer & Skeptical Consumer, Toronto',
      bio: 'Extremely skeptical of "guru" or "influencer" content. Looks for authenticity and hates aggressive sales pitches.',
      evaluationPrompt: 'Evaluate as a skeptic with no background in this topic. Does this feel genuine or does it feel like an ad/gimmick? Is the voice trustworthy?',
    },
    {
      name: 'Amara Okafor',
      segment: PersonaSegment.COLD_OUTSIDER,
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
      demographics: '28, Healthcare Administrator, Atlanta',
      bio: 'High friction to complex concepts. If the value isn\'t crystal clear in 3 seconds, she scrolls.',
      evaluationPrompt: 'Evaluate as an outsider with a low attention span for niche subjects. Did the hook make you stop scrolling? Was the main takeaway simple enough to remember?',
    },
    {
      name: 'Liam O\'Connor',
      segment: PersonaSegment.COLD_OUTSIDER,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      demographics: '36, High School History Teacher, Dublin',
      bio: 'Values good storytelling, relatable analogies, and clear human connection over technical jargon.',
      evaluationPrompt: 'Evaluate as someone who values general storytelling. Does the narrative hold your attention? Can a complete beginner follow the progression from hook to payoff?',
    },

    // ─── PLATFORM NATIVE ─────────────────────────────────────
    {
      name: 'Zoe Martinez',
      segment: PersonaSegment.PLATFORM_NATIVE,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      demographics: '21, Gen-Z TikTok & Reels Power User, Miami',
      bio: 'Spends 3+ hours daily on vertical video feeds. Hyper-attuned to visual pacing, trending audio, cuts, captions, and dopamine loops.',
      evaluationPrompt: 'Evaluate strictly on platform dynamics and virality mechanics: visual hook within first 1.5s, pattern interrupts, retention spikes, caption placement, and shareability to DMs or group chats.',
    },
    {
      name: 'Jordan Brooks',
      segment: PersonaSegment.PLATFORM_NATIVE,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      demographics: '24, Social Media Manager & Meme Strategist, New York',
      bio: 'Studies the algorithm for a living. Knows what makes viewers save, comment, or send to friends.',
      evaluationPrompt: 'Evaluate platform algorithmic triggers: Does this invite comments/debates? Is it "save-worthy" as a reference? How strong is the end-loop or call-to-action?',
    },
    {
      name: 'Mia Chen',
      segment: PersonaSegment.PLATFORM_NATIVE,
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      demographics: '20, College Student & Content Creator, Los Angeles',
      bio: 'Consumes Reels with sound on and off. Fast judgment, loves dynamic text overlays and high energy transitions.',
      evaluationPrompt: 'Evaluate platform retention: Does the visual change every 2-3 seconds? Does it work well on mute with captions? Would this spark a reaction on an Instagram Story repost?',
    },
    {
      name: 'Lucas Silva',
      segment: PersonaSegment.PLATFORM_NATIVE,
      avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
      demographics: '27, Growth Hacker & Short-form Editor, Berlin',
      bio: 'Obsessed with the 3-second dropoff curve and watch-time completion rates.',
      evaluationPrompt: 'Evaluate for completion rate likelihood: Is the premise delivered efficiently? Is there unnecessary dead air or rambling? Is the hook misleading (clickbait) or legitimately rewarding?',
    },
    {
      name: 'Taylor Reed',
      segment: PersonaSegment.PLATFORM_NATIVE,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      demographics: '22, Trend Analyst & UGC Creator, London',
      bio: 'Tracks audio trends, visual framing, aspect ratios, and thumbnail/cover frame aesthetics.',
      evaluationPrompt: 'Evaluate as a native mobile feed consumer: Is the composition vertical-first? Are UI elements obstructed by platform buttons? Does it scream high-velocity mobile engagement?',
    },
  ];

  for (const p of personas) {
    await prisma.evaluatorPersona.create({
      data: p,
    });
  }
  console.log(`Successfully seeded ${personas.length} Evaluator Personas across 3 segments!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
