import type { ShoppingList } from '../../../../mocks/shopping';
import { getActiveListId, getSelectedList } from '../selectionUtils';

const makeList = (id: string): ShoppingList => ({
  id,
  localId: id,
  name: `List ${id}`,
  itemCount: 0,
  icon: 'cart-outline',
  color: '#10B981',
});

describe('selectionUtils', () => {
  describe.each([
    ['empty list', [], undefined, null],
    ['no current id', [makeList('a')], undefined, makeList('a')],
    ['missing current id', [makeList('a'), makeList('b')], 'x', makeList('a')],
    ['current id exists', [makeList('a'), makeList('b')], 'b', makeList('b')],
  ])('getSelectedList with %s', (_description, lists, currentId, expected) => {
    it('returns the expected list', () => {
      const result = getSelectedList(lists, currentId);
      expect(result?.id ?? null).toBe(expected?.id ?? null);
    });
  });

  describe.each([
    ['empty list', [], null, null],
    ['no current id', [makeList('a')], null, 'a'],
    ['missing current id', [makeList('a'), makeList('b')], 'x', 'a'],
    ['current id exists', [makeList('a'), makeList('b')], 'b', 'b'],
  ])('getActiveListId with %s', (_description, lists, currentId, expected) => {
    it('returns the expected id', () => {
      const result = getActiveListId(lists, currentId);
      expect(result).toBe(expected);
    });
  });
});
