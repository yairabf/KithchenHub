import React from 'react';
import { render } from '@testing-library/react-native';
import { FormPresentationModal } from '../FormPresentationModal';

let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));

describe('FormPresentationModal', () => {
  beforeEach(() => {
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  });

  it('keeps the full-screen header below the iPhone status bar even when modal safe-area insets are zero', () => {
    const screen = render(
      <FormPresentationModal
        visible={true}
        title="Edit Recipe"
        submitText="Save"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      >
        {null}
      </FormPresentationModal>,
    );

    expect(screen.getByTestId('form-presentation-safe-area').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 44 })]),
    );
  });

  it('uses larger reported top safe-area insets when available', () => {
    mockInsets = { top: 59, bottom: 34, left: 0, right: 0 };

    const screen = render(
      <FormPresentationModal
        visible={true}
        title="Edit Recipe"
        submitText="Save"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      >
        {null}
      </FormPresentationModal>,
    );

    expect(screen.getByTestId('form-presentation-safe-area').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 59, paddingBottom: 34 })]),
    );
  });
});
