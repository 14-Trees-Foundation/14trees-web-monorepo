-- Migration: Add email_config column to campaigns table
-- Date: 2025-12-26
-- Description: Adds JSONB column to store campaign-specific email configuration
--              including custom templates, sender info, CC lists, and branding.
--              Enables campaigns like Glowback to send branded sponsor emails.

-- Add email_config column to campaigns table
ALTER TABLE campaigns
ADD COLUMN email_config JSONB NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN campaigns.email_config IS 'Campaign-specific email configuration in JSON format. Structure: {sponsor_email: {enabled, from_name, from_email, subject_template_single, subject_template_multi, reply_to, cc_emails[], template_name_single, template_name_multi, custom_data}, receiver_email: {...}}';

-- Create index for querying campaigns with email config enabled
CREATE INDEX idx_campaigns_email_config_enabled
ON campaigns ((email_config->'sponsor_email'->>'enabled'))
WHERE email_config IS NOT NULL;

-- Example configuration (for documentation):
-- {
--   "sponsor_email": {
--     "enabled": true,
--     "from_name": "Sia Domkundwar of Glowback",
--     "from_email": "noreply@glowback.com",
--     "reply_to": "hello@glowback.com",
--     "subject_template_single": "Your Glowback is live 🌱",
--     "subject_template_multi": "Your Glowback trees are live 🌱",
--     "cc_emails": ["sia@glowback.com", "team@glowback.com"],
--     "template_name_single": "campaigns/glowback-sponsor-single-tree.html",
--     "template_name_multi": "campaigns/glowback-sponsor-multi-trees.html",
--     "custom_data": {
--       "campaign_tagline": "The world's first beauty offset program"
--     }
--   }
-- }
