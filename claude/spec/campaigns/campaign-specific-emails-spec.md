# Campaign-Specific Email Feature Specification

**Date:** 26 Dec 2025
**Feature:** Campaign-Specific Email Templates for Gift Card Recipients
**Status:** Proposed

## Problem Statement

Currently, when sponsors eceive the same generic email template regardless of the campaign they're associated with. Campaigns like "Glowback" require personalized email content that reflects the campaign's brand, messaging, and values.

### Current Flow

1. User creates gift card request linked to a campaign (via `rfr_id` → `referrals.c_key`)
2. Admin triggers "Send Email to Sponsor" from UI
3. System uses generic email template based on `event_type` (default, birthday, visit)
4. Email sent with 14Trees branding only

### Desired Flow

1. User creates gift card request linked to a campaign
2. Admin triggers "Send Email to Sponsor" from UI
3. System detects campaign association via referral
4. System selects campaign-specific email template (if available)
5. Email sent with campaign-specific branding, messaging, and sender

## Business Requirements

### User Stories

**As a Campaign Partner** (e.g., Glowback):
- I want my gift **sponsors** to receive emails that reflect my brand voice and values (not gift recipients)
- I want the email to come from my organization, not just 14Trees
- I want to include campaign-specific messaging about environmental impact
- I want to customize the email subject line and call-to-action
- I want certain stakeholders to be CC'd on all sponsor emails

**As a 14Trees Admin**:
- I want to manage campaign-specific email templates easily
- I want to see which campaign a gift request belongs to before sending emails
- I want to preview campaign-specific emails before sending
- I want fallback to default templates if campaign template doesn't exist

**As a Gift Recipient**:
- I want to receive personalized emails that explain the campaign context
- I want to understand who is behind the tree planting initiative
- I want clear instructions on how to track my tree

## Technical Requirements

### Database Schema Changes

#### 1. Add Campaign Email Template Fields to `campaigns` table

```sql
ALTER TABLE campaigns ADD COLUMN email_config JSONB NULL;
```

**email_config Structure:**
```typescript
{
  sponsor_email: {
    enabled: boolean;
    from_name: string;                    // e.g., "Sia Domkundwar of Glowback"
    from_email?: string;                  // Optional custom sender email
    subject_template_single: string;      // e.g., "Your Glowback is live 🌱"
    subject_template_multi: string;       // e.g., "Your Glowback trees are live 🌱"
    reply_to?: string;                    // Optional reply-to address
    cc_emails: string[];                  // CC email addresses for all sponsor emails
    template_name_single: string;         // e.g., "campaigns/glowback-sponsor-single-tree.html"
    template_name_multi: string;          // e.g., "campaigns/glowback-sponsor-multi-trees.html"
    custom_data?: {                       // Campaign-specific variables for templates
      [key: string]: any;
    }
  };
  receiver_email?: {
    enabled: boolean;
    from_name: string;
    subject_template: string;
    template_name: string;
    custom_data?: any;
  }
}
```

**Note:** We use JSONB approach for flexibility and future extensibility. No separate campaign_email_templates table is needed.

### Backend Implementation

#### 1. Update Campaign Model

**File:** `apps/api/src/models/campaign.ts`

```typescript
interface CampaignEmailConfig {
  sponsor_email?: {
    enabled: boolean;
    from_name: string;
    from_email?: string;
    subject_template_single: string;
    subject_template_multi: string;
    reply_to?: string;
    cc_emails: string[];
    template_name_single: string;
    template_name_multi: string;
    custom_data?: Record<string, any>;
  };
  receiver_email?: {
    enabled: boolean;
    from_name: string;
    subject_template: string;
    template_name: string;
    custom_data?: Record<string, any>;
  };
}

interface CampaignAttributes {
  // ... existing fields
  email_config: CampaignEmailConfig | null;
}
```

#### 2. Update Gift Card Email Logic

**File:** `apps/api/src/controllers/helper/giftRequestHelper.ts`

**Modify:** `sendMailsToSponsors()` function

```typescript
export const sendMailsToSponsors = async (
  giftCardRequest: any,
  giftCards: any[],
  eventType: string,
  attachCard: boolean,
  ccMails?: string[],
  testMails?: string[]
) => {
  // NEW: Get campaign email config if gift request has campaign
  let campaignEmailConfig: CampaignEmailConfig | null = null;
  let campaignData: any = null;

  if (giftCardRequest.rfr_id) {
    const referrals = await ReferralsRepository.getReferrals({ id: giftCardRequest.rfr_id });
    if (referrals.length > 0 && referrals[0].c_key) {
      const campaigns = await CampaignsRepository.getCampaigns(0, 1, [
        { columnField: 'c_key', operatorValue: 'equals', value: referrals[0].c_key }
      ]);

      if (campaigns.results.length > 0) {
        campaignData = campaigns.results[0];
        campaignEmailConfig = campaignData.email_config;
      }
    }
  }

  const emailData: any = {
    trees: [] as any[],
    user_email: giftCardRequest.user_email,
    user_name: giftCardRequest.user_name,
    event_name: giftCardRequest.event_name,
    group_name: giftCardRequest.group_name,
    company_logo_url: giftCardRequest.logo_url,
    count: 0,

    // NEW: Add campaign-specific data
    campaign_name: campaignData?.name || null,
    campaign_description: campaignData?.description || null,
  };

  // Build tree data
  for (const giftCard of giftCards) {
    const treeData = {
      sapling_id: giftCard.sapling_id,
      dashboard_link: 'https://dashboard.14trees.org/profile/' + giftCard.sapling_id,
      planted_via: giftCard.planted_via,
      plant_type: giftCard.plant_type,
      scientific_name: giftCard.scientific_name,
      card_image_url: giftCard.card_image_url,
      event_name: giftCard.event_name,
      assigned_to_name: giftCard.assigned_to_name,
    };
    emailData.trees.push(treeData);
    emailData.count++;
  }

  // NEW: Merge campaign custom data
  if (campaignEmailConfig?.sponsor_email?.custom_data) {
    Object.assign(emailData, campaignEmailConfig.sponsor_email.custom_data);
  }

  const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
  const mailIds = (testMails && testMails.length !== 0) ? testMails : [emailData.user_email];

  // Handle attachments
  let attachments: { filename: string; path: string }[] | undefined = undefined;
  if (attachCard) {
    const files: { filename: string; path: string }[] = [];
    for (const tree of emailData.trees) {
      if (tree.card_image_url) {
        files.push({
          filename: tree.assigned_to_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
          path: tree.card_image_url
        });
      }
    }
    if (files.length > 0) attachments = files;
  }

  // NEW: Determine template and email config based on tree count
  let templateName: string;
  let fromName: string | undefined;
  let fromEmail: string | undefined;
  let replyTo: string | undefined;
  let subject: string | undefined;
  let campaignCcEmails: string[] = [];

  if (campaignEmailConfig?.sponsor_email?.enabled) {
    // Use campaign-specific template based on tree count
    const isSingleTree = emailData.count === 1;
    templateName = isSingleTree
      ? campaignEmailConfig.sponsor_email.template_name_single
      : campaignEmailConfig.sponsor_email.template_name_multi;

    fromName = campaignEmailConfig.sponsor_email.from_name;
    fromEmail = campaignEmailConfig.sponsor_email.from_email;
    replyTo = campaignEmailConfig.sponsor_email.reply_to;

    subject = isSingleTree
      ? campaignEmailConfig.sponsor_email.subject_template_single
      : campaignEmailConfig.sponsor_email.subject_template_multi;

    // NEW: Get campaign CC emails
    campaignCcEmails = campaignEmailConfig.sponsor_email.cc_emails || [];

    console.log(`[INFO] Using campaign-specific email template: ${templateName} for campaign: ${campaignData.c_key}`);
  } else {
    // Fallback to default template logic
    const templateType: TemplateType = emailData.count > 1 ? 'sponsor-multi-trees' : 'sponsor-single-tree';
    const templates = await EmailTemplateRepository.getEmailTemplates({
      event_type: eventType,
      template_type: templateType
    });

    if (templates.length === 0) {
      console.log("[ERROR]", "sendMailsToSponsors", "Email template not found");
      return;
    }

    templateName = templates[0].template_name;
  }

  // NEW: Merge campaign CC emails with provided CC emails
  const allCcEmails = [...(ccMails || []), ...campaignCcEmails];
  const finalCcMailIds = allCcEmails.length > 0 ? allCcEmails : undefined;

  // NEW: Send email with campaign-specific config
  const statusMessage: string = await sendDashboardMail(
    templateName,
    emailData,
    mailIds,
    finalCcMailIds,    // NEW: includes campaign CC emails
    attachments,
    subject,           // NEW: custom subject
    fromName,          // NEW: custom from name
    fromEmail,         // NEW: custom from email
    replyTo            // NEW: custom reply-to
  );

  // Update mail_sent flag
  if (statusMessage === '' && (!testMails || testMails.length === 0)) {
    await GiftCardsRepository.updateGiftCardRequests(
      {
        mail_sent: true,
        updated_at: new Date()
      },
      {
        id: giftCardRequest.id
      }
    );
  }
};
```

#### 3. Update Email Service

**File:** `apps/api/src/services/gmail/gmail.ts`

**Modify:** `sendDashboardMail()` function signature

```typescript
export async function sendDashboardMail(
  templateName: string,
  data: any,
  toEmails: string[],
  ccEmails?: string[],
  attachments?: { filename: string; path: string }[],
  customSubject?: string,        // NEW
  customFromName?: string,       // NEW
  customFromEmail?: string,      // NEW
  customReplyTo?: string         // NEW
): Promise<string> {
  // ... existing implementation

  // NEW: Override sender if campaign-specific
  const fromEmail = customFromEmail || process.env.GMAIL_USER || 'noreply@14trees.org';
  const fromName = customFromName || '14 Trees Foundation';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmails.join(','),
    cc: ccEmails?.join(','),
    subject: customSubject || extractSubjectFromTemplate(htmlContent), // NEW
    html: htmlContent,
    attachments: attachments,
    replyTo: customReplyTo || undefined,  // NEW
  };

  // ... rest of implementation
}
```

#### 4. Create Campaign Email Template Management APIs

**File:** `apps/api/src/controllers/campaignController.ts`

```typescript
export const updateCampaignEmailConfig = async (req: Request, res: Response) => {
  const { c_key } = req.params;
  const { email_config } = req.body;

  try {
    // Validate c_key
    const campaigns = await CampaignsRepository.getCampaigns(0, 1, [
      { columnField: 'c_key', operatorValue: 'equals', value: c_key }
    ]);

    if (campaigns.results.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Validate email_config structure
    if (email_config && typeof email_config !== 'object') {
      return res.status(400).json({ message: "Invalid email_config format" });
    }

    // Update campaign
    await CampaignsRepository.updateCampaign(campaigns.results[0].id, {
      email_config: email_config
    });

    res.status(200).json({ message: "Campaign email config updated successfully" });
  } catch (error: any) {
    console.error("[ERROR] updateCampaignEmailConfig:", error);
    res.status(500).json({
      message: 'Failed to update campaign email config',
      error: error.message
    });
  }
};

export const getCampaignEmailConfig = async (req: Request, res: Response) => {
  const { c_key } = req.params;

  try {
    const campaigns = await CampaignsRepository.getCampaigns(0, 1, [
      { columnField: 'c_key', operatorValue: 'equals', value: c_key }
    ]);

    if (campaigns.results.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.status(200).json({
      email_config: campaigns.results[0].email_config || null
    });
  } catch (error: any) {
    console.error("[ERROR] getCampaignEmailConfig:", error);
    res.status(500).json({
      message: 'Failed to fetch campaign email config',
      error: error.message
    });
  }
};
```

**File:** `apps/api/src/routes/campaignRoutes.ts`

```typescript
routes.get('/:c_key/email-config', campaigns.getCampaignEmailConfig);
routes.put('/:c_key/email-config', campaigns.updateCampaignEmailConfig);
```

### Email Template Implementation

Campaign-specific templates will be stored in:
- `apps/api/src/services/gmail/templates/campaigns/`

Two templates are required for each campaign:
1. **Single Tree Template**: `{campaign}-sponsor-single-tree.html`
2. **Multi Trees Template**: `{campaign}-sponsor-multi-trees.html`

Templates are based on the default 14Trees templates but customized with campaign branding and messaging.

**Template Files Created:**
- `apps/api/src/services/gmail/templates/campaigns/glowback-sponsor-single-tree.html`
- `apps/api/src/services/gmail/templates/campaigns/glowback-sponsor-multi-trees.html`

See sample Glowback templates below in the Appendix section.

### Frontend Implementation

#### 1. Update Campaign Form to Include Email Config

**File:** `apps/frontend/src/pages/admin/campaign/EditCampaign.tsx`

Add fields for:
- Enable campaign-specific sponsor emails (checkbox)
- From Name (text input)
- Subject Template (text input)
- Template Name (dropdown - list available template files)
- Custom Variables (JSON editor - optional)

#### 2. Update Gift Card Email Modal

**File:** `apps/frontend/src/pages/admin/gift/Components/EmailConfirmationModal.tsx`

Add:
- Display campaign name if gift request is linked to campaign
- Show indicator if campaign-specific template will be used
- Preview button to see campaign template

#### 3. Add Campaign Email Config API Methods

**File:** `apps/frontend/src/api/apiClient/apiClient.ts`

```typescript
async getCampaignEmailConfig(c_key: string) {
  const response = await this.api.get(`/campaigns/${c_key}/email-config`);
  return response.data;
}

async updateCampaignEmailConfig(c_key: string, email_config: any) {
  const response = await this.api.put(`/campaigns/${c_key}/email-config`, { email_config });
  return response.data;
}
```

## Data Flow

### Complete Email Sending Flow with Campaign Detection

```
1. Admin triggers "Send Email to Sponsors" from gift request
   ↓
2. Backend receives gift_card_request.id
   ↓
3. Check if gift_card_request.rfr_id exists
   ↓
4. If rfr_id exists:
   → Query referrals table for c_key
   → If c_key exists:
      → Query campaigns table for email_config
      → If email_config.sponsor_email.enabled = true:
         ✓ Use campaign-specific template
         ✓ Use campaign from_name, subject, etc.
   ↓
5. If no campaign or campaign email not enabled:
   → Fallback to default email template lookup
   ↓
6. Build email data with tree details
   ↓
7. Send email via SendGrid/Gmail service
   ↓
8. Update gift_card_request.mail_sent = true
```

## Configuration Example: Glowback Campaign

```json
{
  "sponsor_email": {
    "enabled": true,
    "from_name": "Sia Domkundwar of Glowback",
    "from_email": "noreply@glowback.com",
    "reply_to": "hello@glowback.com",
    "subject_template_single": "Your Glowback is live 🌱",
    "subject_template_multi": "Your Glowback trees are live 🌱",
    "cc_emails": ["sia@glowback.com", "team@glowback.com"],
    "template_name_single": "campaigns/glowback-sponsor-single-tree.html",
    "template_name_multi": "campaigns/glowback-sponsor-multi-trees.html",
    "custom_data": {
      "campaign_tagline": "The world's first beauty offset program",
      "founder_name": "Sia Domkundwar",
      "founder_title": "Founder, Glowback"
    }
  }
}
```

## Migration Strategy

### Phase 1: Database Setup
1. Add `email_config` JSONB column to campaigns table
2. Create database migration script
3. Test with sample data

### Phase 2: Backend Implementation
1. Update Campaign model
2. Modify `sendMailsToSponsors()` logic
3. Update `sendDashboardMail()` service
4. Create campaign email config APIs
5. Add campaign template detection logic

### Phase 3: Template Creation
1. Create Glowback-specific template HTML
2. Add template to `services/gmail/templates/` folder
3. Test template rendering with sample data

### Phase 4: Frontend Updates
1. Update campaign edit form
2. Add email config UI
3. Update email confirmation modal
4. Add campaign indicator in gift request view

### Phase 5: Testing
1. Create test campaign with email config
2. Create test gift request linked to campaign
3. Send test emails to verify template selection
4. Verify fallback to default templates works

### Phase 6: Production Rollout
1. Configure Glowback campaign email settings
2. Upload Glowback template
3. Test with real gift request
4. Monitor email delivery and logs

## Edge Cases & Error Handling

### 1. Missing Template File
- **Scenario:** Campaign email config references non-existent template file
- **Handling:** Log error, fallback to default template, notify admin

### 2. Invalid Email Config
- **Scenario:** Malformed JSON in email_config field
- **Handling:** Validate on save, reject invalid configs, show validation errors

### 3. Campaign Without Email Config
- **Scenario:** Gift request linked to campaign but no email_config set
- **Handling:** Fallback to default template (existing behavior)

### 4. Multiple Recipients
- **Scenario:** Gift request has multiple recipients
- **Handling:** Campaign template should support loops, same as default templates

### 5. Template Variable Mismatch
- **Scenario:** Campaign template uses variables not in emailData
- **Handling:** Template engine should handle gracefully (show empty or default)

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Campaign email config can be saved and retrieved
- [ ] Gift request with campaign triggers campaign template
- [ ] Gift request without campaign uses default template
- [ ] Email sent with correct from_name and subject
- [ ] Custom variables are interpolated correctly
- [ ] Fallback works when campaign template disabled
- [ ] Multiple tree assignments work with campaign template
- [ ] Email attachments still work with campaign templates
- [ ] Admin UI shows campaign email config correctly
- [ ] Email preview shows campaign template
- [ ] Test emails use campaign template
- [ ] Production emails use campaign template

## Future Enhancements

1. **Template Versioning**
   - Track template changes over time
   - Roll back to previous template versions

2. **A/B Testing**
   - Test multiple templates for same campaign
   - Track open rates and engagement

3. **Template Builder UI**
   - Drag-and-drop email template editor
   - Live preview with sample data

4. **Multi-Language Support**
   - Campaign templates in multiple languages
   - Auto-detect recipient language preference

5. **Email Analytics**
   - Track campaign email open rates
   - Monitor click-through rates on tree links

6. **Dynamic Content Blocks**
   - Conditional sections based on tree count
   - Personalized recommendations

## Security Considerations

1. **Email Spoofing Prevention**
   - Validate `from_email` domain ownership
   - Use SPF/DKIM records for custom domains
   - Require domain verification before allowing custom from_email

2. **Template Injection**
   - Sanitize all template variables
   - Use safe template rendering (no executable code)
   - Validate HTML structure

3. **Access Control**
   - Only admins can configure campaign email settings
   - Log all email config changes
   - Audit trail for template updates

4. **Rate Limiting**
   - Prevent email spam from misconfigured campaigns
   - Monitor email send rates per campaign
   - Alert on unusual patterns

## Success Metrics

1. **Technical Metrics**
   - Email delivery rate for campaign templates
   - Template rendering time
   - Fallback invocation rate

2. **Business Metrics**
   - Campaign partner satisfaction
   - Email open rates by campaign
   - Tree tracking link click rates
   - Brand consistency score

3. **User Metrics**
   - Recipient engagement with campaign emails
   - Feedback from gift recipients
   - Reduction in email-related support tickets

## Rollback Plan

If issues arise:
1. Set `email_config.sponsor_email.enabled = false` for affected campaigns
2. System automatically falls back to default templates
3. No code deployment needed - configuration change only
4. Monitor logs for template selection behavior

## Documentation Requirements

1. **API Documentation**
   - Update Swagger/OpenAPI specs
   - Document new email config endpoints
   - Add request/response examples

2. **Admin Guide**
   - How to configure campaign email templates
   - Template variable reference
   - Troubleshooting guide

3. **Developer Guide**
   - Email template development guidelines
   - Testing campaign emails locally
   - Template syntax and best practices

## Appendix A: Glowback Email Templates

### Single Tree Template

**File:** `apps/api/src/services/gmail/templates/campaigns/glowback-sponsor-single-tree.html`

See actual file created in the codebase. Key customizations:
- **Header color:** Changed from #4CAF50 (14Trees green) to #9BC53D (Glowback green)
- **Heading:** "Your Glowback is live 🌱" instead of generic "Greetings from 14 Trees Foundation"
- **Opening message:** Glowback-specific messaging about beauty offset program
- **Signature:** From "Sia Domkundwar, Founder, Glowback" instead of 14 Trees
- **Footer:** Partnership acknowledgment between Glowback and 14 Trees
- **Button color:** Matching Glowback brand (#9BC53D)

### Multi Trees Template

**File:** `apps/api/src/services/gmail/templates/campaigns/glowback-sponsor-multi-trees.html`

See actual file created in the codebase. Same customizations as single tree template, with plural messaging for multiple trees.

## Appendix B: Sample Email Config for Other Campaigns

### Corporate CSR Campaign
```json
{
  "sponsor_email": {
    "enabled": true,
    "from_name": "{{group_name}} Green Initiative",
    "subject_template_single": "Thank you for planting a tree with {{group_name}}",
    "subject_template_multi": "Thank you for planting trees with {{group_name}}",
    "cc_emails": ["csr@company.com"],
    "template_name_single": "campaigns/corporate-csr-sponsor-single-tree.html",
    "template_name_multi": "campaigns/corporate-csr-sponsor-multi-trees.html",
    "custom_data": {
      "csr_program_name": "Green Future Initiative",
      "impact_statement": "Together, we are building a sustainable future"
    }
  }
}
```

### Birthday Campaign
```json
{
  "sponsor_email": {
    "enabled": true,
    "from_name": "{{planted_by}} and 14 Trees",
    "subject_template_single": "Happy Birthday from {{planted_by}} 🎂🌳",
    "subject_template_multi": "Happy Birthday wishes from {{planted_by}} 🎂🌳",
    "cc_emails": [],
    "template_name_single": "campaigns/birthday-sponsor-single-tree.html",
    "template_name_multi": "campaigns/birthday-sponsor-multi-trees.html",
    "custom_data": {
      "greeting": "Happy Birthday!",
      "occasion": "birthday"
    }
  }
}
```
