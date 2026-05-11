export interface ManageHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
  onInviteMember?: () => void;
  onShareInviteCode?: () => void;
}
