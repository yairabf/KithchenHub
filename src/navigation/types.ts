export type TabKey = 'Dashboard' | 'Shopping' | 'Recipes' | 'Chores' | 'Settings';

export type MainStackParamList = {
  MainTabs: undefined;
  SingleList: { listId: string; listName: string };
};

export type ShoppingStackParamList = {
  ShoppingLists: undefined;
  SingleList: { listId: string; listName: string };
};
