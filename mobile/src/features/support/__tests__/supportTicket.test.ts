import {
  SUPPORT_EMAIL,
  SUPPORT_GMAIL_LABEL,
  buildSupportTicketPacket,
  buildSupportTicketMailtoUrl,
  getSupportTicketQualityNudges,
} from '../supportTicket';

describe('supportTicket utilities', () => {
  it('builds the approved FullHouse support subject and agent-ready packet', () => {
    const packet = buildSupportTicketPacket({
      platform: 'iOS app',
      category: 'Bug',
      summary: 'Shopping list freezes',
      expectedBehavior: 'The item should be added immediately.',
      actualBehavior: 'The spinner stays visible.',
      reproductionSteps: '1. Open Shopping\n2. Add milk',
      frequency: 'Every time',
      contactEmail: 'user@example.com',
      appVersion: '1.0.0',
      deviceContext: 'iPhone 15, iOS 18',
      attachmentNote: 'Screenshot attached later',
      privacyAcknowledged: true,
    });

    expect(SUPPORT_EMAIL).toBe('yair.solutions.19@gmail.com');
    expect(SUPPORT_GMAIL_LABEL).toBe('KitchenHub/Support/Issues/New');
    expect(packet.subject).toBe('[FullHouse Support][iOS app][Bug] Shopping list freezes');
    expect(packet.body).toContain('Ticket title: Shopping list freezes');
    expect(packet.body).toContain('Recommended Gmail label: KitchenHub/Support/Issues/New');
    expect(packet.body).toContain('Privacy acknowledgment: Yes');
    expect(packet.body).toContain('Do not send passwords, full payment card details, or highly sensitive household information.');
  });

  it('creates a mailto fallback URL addressed to the confirmed support inbox', () => {
    const mailto = buildSupportTicketMailtoUrl({
      platform: 'Android app',
      category: 'Account',
      summary: 'Cannot sign in',
      expectedBehavior: '',
      actualBehavior: 'Google sign-in returns to the login screen.',
      reproductionSteps: '',
      frequency: 'Once',
      contactEmail: 'user@example.com',
      appVersion: '1.0.0',
      deviceContext: 'Pixel 8, Android 15',
      attachmentNote: '',
      privacyAcknowledged: true,
    });

    expect(mailto).toContain('mailto:yair.solutions.19%40gmail.com');
    expect(mailto).toContain('subject=%5BFullHouse%20Support%5D%5BAndroid%20app%5D%5BAccount%5D%20Cannot%20sign%20in');
    expect(mailto).toContain('body=');
  });

  it('nudges users for missing details without blocking a minimally valid ticket', () => {
    expect(getSupportTicketQualityNudges({
      platform: 'iOS app',
      category: 'Bug',
      summary: 'Crash',
      expectedBehavior: '',
      actualBehavior: '',
      reproductionSteps: '',
      frequency: '',
      contactEmail: '',
      appVersion: '',
      deviceContext: '',
      attachmentNote: '',
      privacyAcknowledged: false,
    })).toEqual(expect.arrayContaining([
      'Add what you expected to happen.',
      'Add what actually happened.',
      'Add steps to reproduce if you can.',
      'Add a contact email so support can reply.',
    ]));
  });
});
