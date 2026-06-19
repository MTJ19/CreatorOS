import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

const IG_GRAPH = 'https://graph.instagram.com/v25.0';
const IG_GRAPH_BASE = 'https://graph.instagram.com';
const IG_AUTHORIZE = 'https://www.instagram.com/oauth/authorize';
const IG_TOKEN_EXCHANGE = 'https://api.instagram.com/oauth/access_token';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  buildAuthUrl(userId: string): string {
    const clientId = this.config.get('INSTAGRAM_APP_ID');
    const redirectUri = this.config.get('INSTAGRAM_REDIRECT_URI');
    const scope = 'instagram_business_basic,instagram_business_manage_insights';
    const state = Buffer.from(userId).toString('base64url');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
    });
    return `${IG_AUTHORIZE}?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    const userId = Buffer.from(state, 'base64url').toString('utf-8');
    const clientId = this.config.get('INSTAGRAM_APP_ID');
    const clientSecret = this.config.get('INSTAGRAM_APP_SECRET');
    const redirectUri = this.config.get('INSTAGRAM_REDIRECT_URI');

    const cleanCode = code.replace(/#_$/, '');

    const form = new URLSearchParams();
    form.append('client_id', clientId);
    form.append('client_secret', clientSecret);
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', redirectUri);
    form.append('code', cleanCode);

    const shortRes = await firstValueFrom(
      this.http.post(IG_TOKEN_EXCHANGE, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    const shortData = shortRes.data?.data?.[0] ?? shortRes.data;
    const shortToken: string = shortData.access_token;

    const longRes = await firstValueFrom(
      this.http.get(`${IG_GRAPH_BASE}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortToken,
        },
      }),
    );
    const accessToken: string = longRes.data.access_token;
    const expiresIn: number = longRes.data.expires_in;

    const profileRes = await firstValueFrom(
      this.http.get(`${IG_GRAPH}/me`, {
        params: {
          fields: 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
          access_token: accessToken,
        },
      }),
    );
    const profileData = profileRes.data?.data?.[0] ?? profileRes.data;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        igUserId: String(profileData.user_id ?? profileData.id),
        igUsername: profileData.username,
        igAccountType: profileData.account_type ?? null,
        igFollowersCount: profileData.followers_count ?? null,
        igFollowsCount: profileData.follows_count ?? null,
        igMediaCount: profileData.media_count ?? null,
        igProfilePicUrl: profileData.profile_picture_url ?? null,
        igAccessToken: accessToken,
        igTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        igConnectedAt: new Date(),
      },
    });

    await this.syncUserPosts(userId);

    return { igUsername: profileData.username, connected: true };
  }

  async syncUserPosts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.igAccessToken || !user?.igUserId) {
      throw new BadRequestException('Instagram not connected');
    }

    let postsCount = 0;
    let status = 'success';
    let errorMsg: string | undefined;

    try {
      const mediaRes = await firstValueFrom(
        this.http.get(`${IG_GRAPH}/${user.igUserId}/media`, {
          params: {
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
            limit: 25,
            access_token: user.igAccessToken,
          },
        }),
      );

      const posts = mediaRes.data.data ?? [];

      for (const post of posts) {
        if (post.media_type === 'STORY') continue;

        let metrics: Record<string, number> = {
          impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saved: 0,
        };
        try {
          const metricList = post.media_type === 'VIDEO' || post.media_type === 'REELS'
            ? 'reach,likes,comments,shares,saved,plays'
            : 'reach,likes,comments,shares,saved';

          const insightRes = await firstValueFrom(
            this.http.get(`${IG_GRAPH}/${post.id}/insights`, {
              params: { metric: metricList, access_token: user.igAccessToken },
            }),
          );
          for (const item of insightRes.data.data ?? []) {
            metrics[item.name] = item.values?.[0]?.value ?? 0;
          }
        } catch {
          // Insights may be unavailable for very new posts — skip silently
        }

        const existing = await this.prisma.performanceLog.findFirst({
          where: { creatorId: userId, contentUrl: post.permalink },
        });

        const reach = metrics.reach || 0;
        const engagementRate = reach > 0
          ? (((metrics.likes ?? 0) + (metrics.comments ?? 0) + (metrics.saved ?? 0)) / reach) * 100
          : 0;

        const logData = {
          creatorId: userId,
          recordedAt: new Date(post.timestamp),
          platform: 'INSTAGRAM',
          contentUrl: post.permalink,
          source: 'INSTAGRAM_API' as any,
          notes: post.caption?.slice(0, 200) ?? null,
          metrics: {
            views: metrics.plays ?? metrics.impressions ?? 0,
            impressions: metrics.impressions ?? 0,
            reach,
            likes: metrics.likes ?? 0,
            comments: metrics.comments ?? 0,
            shares: metrics.shares ?? 0,
            saves: metrics.saved ?? 0,
            engagementRate,
          },
        };

        if (existing) {
          await this.prisma.performanceLog.update({ where: { id: existing.id }, data: logData });
        } else {
          await this.prisma.performanceLog.create({ data: logData });
          postsCount++;
        }
      }

      const profileRes = await firstValueFrom(
        this.http.get(`${IG_GRAPH}/me`, {
          params: { fields: 'followers_count,follows_count,media_count', access_token: user.igAccessToken },
        }),
      );
      const pd = profileRes.data?.data?.[0] ?? profileRes.data;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          igFollowersCount: pd.followers_count ?? user.igFollowersCount,
          igFollowsCount: pd.follows_count ?? user.igFollowsCount,
          igMediaCount: pd.media_count ?? user.igMediaCount,
          igLastSyncedAt: new Date(),
        },
      });
    } catch (err: any) {
      status = 'error';
      errorMsg = err?.response?.data?.error_message ?? err.message;
      this.logger.error(`Instagram sync failed for user ${userId}:`, errorMsg);
    }

    await this.prisma.instagramSyncLog.create({
      data: { userId, postsCount, status, errorMsg },
    });

    return { postsCount, status };
  }

  async refreshTokenIfNeeded(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.igAccessToken || !user?.igTokenExpiresAt) return;

    const daysUntilExpiry = (user.igTokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry > 10) return;

    try {
      const res = await firstValueFrom(
        this.http.get(`${IG_GRAPH_BASE}/refresh_access_token`, {
          params: { grant_type: 'ig_refresh_token', access_token: user.igAccessToken },
        }),
      );
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          igAccessToken: res.data.access_token,
          igTokenExpiresAt: new Date(Date.now() + res.data.expires_in * 1000),
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to refresh Instagram token for user ${userId}`, err.message);
    }
  }

  async getConnectionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        igUsername: true, igConnectedAt: true, igTokenExpiresAt: true, igUserId: true,
        igFollowersCount: true, igFollowsCount: true, igMediaCount: true,
        igProfilePicUrl: true, igAccountType: true, igLastSyncedAt: true,
      },
    });
    return {
      connected: !!user?.igUserId,
      username: user?.igUsername ?? null,
      connectedAt: user?.igConnectedAt ?? null,
      expiresAt: user?.igTokenExpiresAt ?? null,
      followersCount: user?.igFollowersCount ?? null,
      followsCount: user?.igFollowsCount ?? null,
      mediaCount: user?.igMediaCount ?? null,
      profilePicUrl: user?.igProfilePicUrl ?? null,
      accountType: user?.igAccountType ?? null,
      lastSyncedAt: user?.igLastSyncedAt ?? null,
    };
  }

  async disconnectInstagram(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        igUserId: null, igAccessToken: null, igTokenExpiresAt: null, igUsername: null,
        igConnectedAt: null, igAccountType: null, igFollowersCount: null,
        igFollowsCount: null, igMediaCount: null, igProfilePicUrl: null, igLastSyncedAt: null,
      },
    });
    return { disconnected: true };
  }
}
