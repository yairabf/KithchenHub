export const SUPPORT_EMAIL = 'yair.solutions.19@gmail.com';
export const SUPPORT_GMAIL_LABEL = 'KitchenHub/Support/Issues/New';

export type SupportTicketDraft = {
  platform: string;
  category: string;
  summary: string;
  expectedBehavior: string;
  actualBehavior: string;
  reproductionSteps: string;
  frequency: string;
  contactEmail: string;
  appVersion: string;
  deviceContext: string;
  attachmentNote: string;
  privacyAcknowledged: boolean;
};

export type SupportTicketPacket = {
  subject: string;
  body: string;
};

const clean = (value: string | undefined): string => value?.trim() ?? '';

const valueOrPlaceholder = (value: string | undefined): string => {
  const trimmed = clean(value);
  return trimmed.length > 0 ? trimmed : 'Not provided';
};

export const createEmptySupportTicketDraft = (defaults?: Partial<SupportTicketDraft>): SupportTicketDraft => ({
  platform: defaults?.platform ?? 'iOS app',
  category: defaults?.category ?? 'Bug',
  summary: defaults?.summary ?? '',
  expectedBehavior: defaults?.expectedBehavior ?? '',
  actualBehavior: defaults?.actualBehavior ?? '',
  reproductionSteps: defaults?.reproductionSteps ?? '',
  frequency: defaults?.frequency ?? 'Not sure',
  contactEmail: defaults?.contactEmail ?? '',
  appVersion: defaults?.appVersion ?? '1.0.0',
  deviceContext: defaults?.deviceContext ?? '',
  attachmentNote: defaults?.attachmentNote ?? '',
  privacyAcknowledged: defaults?.privacyAcknowledged ?? false,
});

export const isSupportTicketReadyToSubmit = (draft: SupportTicketDraft): boolean =>
  clean(draft.platform).length > 0 &&
  clean(draft.category).length > 0 &&
  clean(draft.summary).length > 0 &&
  clean(draft.contactEmail).length > 0 &&
  draft.privacyAcknowledged;

export const getSupportTicketQualityNudges = (draft: SupportTicketDraft): string[] => {
  const nudges: string[] = [];

  if (clean(draft.expectedBehavior).length === 0) {
    nudges.push('Add what you expected to happen.');
  }
  if (clean(draft.actualBehavior).length === 0) {
    nudges.push('Add what actually happened.');
  }
  if (clean(draft.reproductionSteps).length === 0) {
    nudges.push('Add steps to reproduce if you can.');
  }
  if (clean(draft.contactEmail).length === 0) {
    nudges.push('Add a contact email so support can reply.');
  }
  if (clean(draft.deviceContext).length === 0) {
    nudges.push('Add device and OS details if this is an app issue.');
  }

  return nudges;
};

export const buildSupportTicketPacket = (draft: SupportTicketDraft): SupportTicketPacket => {
  const summary = valueOrPlaceholder(draft.summary);
  const platform = valueOrPlaceholder(draft.platform);
  const category = valueOrPlaceholder(draft.category);
  const subject = `[FullHouse Support][${platform}][${category}] ${summary}`;
  const nudges = getSupportTicketQualityNudges(draft);

  const body = [
    'FullHouse support ticket',
    '',
    `Ticket title: ${summary}`,
    `Platform/source: ${platform}`,
    `Category: ${category}`,
    'Priority hint: User-reported support issue',
    `Expected behavior: ${valueOrPlaceholder(draft.expectedBehavior)}`,
    `Actual behavior: ${valueOrPlaceholder(draft.actualBehavior)}`,
    `Steps to reproduce: ${valueOrPlaceholder(draft.reproductionSteps)}`,
    `Frequency: ${valueOrPlaceholder(draft.frequency)}`,
    `Contact email: ${valueOrPlaceholder(draft.contactEmail)}`,
    `App/device context: ${valueOrPlaceholder([draft.appVersion, draft.deviceContext].filter(Boolean).join(' — '))}`,
    `Attachments: ${valueOrPlaceholder(draft.attachmentNote)}`,
    `Privacy acknowledgment: ${draft.privacyAcknowledged ? 'Yes' : 'No'}`,
    '',
    'Suggested follow-ups / missing details:',
    ...(nudges.length > 0 ? nudges.map((nudge) => `- ${nudge}`) : ['- No obvious missing details.']),
    '',
    `Recommended Gmail label: ${SUPPORT_GMAIL_LABEL}`,
    '',
    'Privacy reminder: Do not send passwords, full payment card details, or highly sensitive household information.',
  ].join('\n');

  return { subject, body };
};

export const buildSupportTicketMailtoUrl = (draft: SupportTicketDraft): string => {
  const packet = buildSupportTicketPacket(draft);
  return `mailto:${encodeURIComponent(SUPPORT_EMAIL)}?subject=${encodeURIComponent(packet.subject)}&body=${encodeURIComponent(packet.body)}`;
};
