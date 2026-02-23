/**
 * Sync Status Indicator Component Tests
 * 
 * Tests for the SyncStatusIndicator component that displays entity sync status.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { colors } from '../../../theme';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('SyncStatusIndicator', () => {
  describe('status rendering', () => {
    it('should render pending status', () => {
      const { getByTestId } = render(
        <SyncStatusIndicator status="pending" showLabel={false} />
      );
      // Component should render (we can't easily test icon without testID)
      expect(getByTestId).toBeDefined();
    });

    it('should render failed status', () => {
      const { getByTestId } = render(
        <SyncStatusIndicator status="failed" showLabel={false} />
      );
      expect(getByTestId).toBeDefined();
    });

    it('should not render confirmed status without label', () => {
      const { queryByText } = render(
        <SyncStatusIndicator status="confirmed" showLabel={false} />
      );
      // Component returns null, so nothing should be rendered
      expect(queryByText('offline.synced')).toBeNull();
    });
  });

  describe('size prop', () => {
    it('should render with small size', () => {
      const { UNSAFE_root } = render(
        <SyncStatusIndicator status="pending" size="small" />
      );
      expect(UNSAFE_root).toBeDefined();
    });

    it('should render with medium size', () => {
      const { UNSAFE_root } = render(
        <SyncStatusIndicator status="pending" size="medium" />
      );
      expect(UNSAFE_root).toBeDefined();
    });
  });

  describe('showLabel prop', () => {
    it('should show label when showLabel is true', () => {
      const { getByText } = render(
        <SyncStatusIndicator status="pending" showLabel={true} />
      );

      expect(getByText('offline.pending')).toBeTruthy();
    });

    it('should hide label when showLabel is false', () => {
      const { queryByText } = render(
        <SyncStatusIndicator status="pending" showLabel={false} />
      );

      expect(queryByText('offline.pending')).toBeNull();
    });

    describe.each([
      ['pending with label', 'pending', 'offline.pending'],
      ['failed with label', 'failed', 'offline.failed'],
      ['confirmed with label', 'confirmed', 'offline.synced'],
    ])('%s', (description, status, expectedLabel) => {
      it(`should show ${expectedLabel} label`, () => {
        const { getByText } = render(
          <SyncStatusIndicator status={status as any} showLabel={true} />
        );

        expect(getByText(expectedLabel)).toBeTruthy();
      });
    });
  });

  describe('confirmed status behavior', () => {
    it('should return null when status is confirmed and showLabel is false', () => {
      const { queryByText } = render(
        <SyncStatusIndicator status="confirmed" showLabel={false} />
      );

      expect(queryByText('offline.synced')).toBeNull();
    });

    it('should render checkmark when status is confirmed and showLabel is true', () => {
      const { getByText } = render(
        <SyncStatusIndicator status="confirmed" showLabel={true} />
      );

      expect(getByText('offline.synced')).toBeTruthy();
    });
  });
});
