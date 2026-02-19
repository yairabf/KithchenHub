import type { Chore } from '../../../../mocks/chores';
import type { NewChoreData } from '../../utils/choreFactory';

export type { Chore };

/**
 * Discriminated union enforcing correct prop combinations per modal mode.
 *
 * - `add` mode: requires `onAddChore`, forbids `chore` and `onUpdateChore`
 * - `edit` mode: requires `chore` and `onUpdateChore`, forbids `onAddChore`
 *
 * This ensures at compile-time that the correct handler is always provided,
 * preventing silent no-ops when a required callback is accidentally omitted.
 */
export type ChoreDetailsModalProps =
  | {
      mode: 'add';
      visible: boolean;
      onClose: () => void;
      onAddChore: (chore: NewChoreData) => void;
      chore?: never;
      onUpdateChore?: never;
    }
  | {
      mode: 'edit';
      visible: boolean;
      onClose: () => void;
      chore: Chore | null;
      onUpdateChore: (choreId: string, updates: Partial<Chore>) => void;
      onAddChore?: never;
    };
