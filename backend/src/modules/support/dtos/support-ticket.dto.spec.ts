import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateSupportTicketDto } from './create-support-ticket.dto';

const validPayload = {
  platform: 'iOS app',
  category: 'Bug',
  summary: 'Shopping list freezes',
  expectedBehavior: 'Milk should be added immediately',
  actualBehavior: 'The spinner stays visible',
  reproductionSteps: 'Open Shopping, add milk',
  frequency: 'Every time',
  contactEmail: 'user@example.com',
  appVersion: '1.0.1',
  deviceContext: 'ios 18.1',
  attachmentNote: 'Screenshot available',
  privacyAcknowledged: true,
};

describe('CreateSupportTicketDto', () => {
  it('accepts a complete support ticket payload', async () => {
    const dto = plainToInstance(CreateSupportTicketDto, validPayload);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('requires platform, category, summary, contact email, and privacy acknowledgement', async () => {
    const dto = plainToInstance(CreateSupportTicketDto, {
      ...validPayload,
      platform: '',
      category: '',
      summary: '',
      contactEmail: 'not-an-email',
      privacyAcknowledged: false,
    });

    const errors = await validate(dto);
    const errorProperties = errors.map((error) => error.property);

    expect(errorProperties).toEqual(
      expect.arrayContaining([
        'platform',
        'category',
        'summary',
        'contactEmail',
        'privacyAcknowledged',
      ]),
    );
  });
});
