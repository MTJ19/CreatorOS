-- Onboarding previously only captured a follower-tier bucket. Adding the
-- exact weekly-views figure alongside followers_count/engagement_rate so the
-- rate calculator can work from real per-creator numbers instead of a
-- generic manual guess entered on every negotiation.
ALTER TABLE creators ADD COLUMN avg_views_per_week integer;
