interface ChoreTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
}

// Mock Chores Database - Common household chores
export const mockChoresDB: ChoreTemplate[] = [
  // Kitchen
  { id: 'c1', name: 'Wash dishes', icon: '🍽️', category: 'Kitchen' },
  { id: 'c2', name: 'Clean counters', icon: '🧽', category: 'Kitchen' },
  { id: 'c3', name: 'Mop kitchen floor', icon: '🧹', category: 'Kitchen' },
  { id: 'c4', name: 'Take out trash', icon: '🗑️', category: 'Kitchen' },
  { id: 'c5', name: 'Empty dishwasher', icon: '🍽️', category: 'Kitchen' },
  { id: 'c6', name: 'Wipe stove', icon: '🔥', category: 'Kitchen' },
  { id: 'c7', name: 'Clean refrigerator', icon: '❄️', category: 'Kitchen' },
  { id: 'c8', name: 'Organize pantry', icon: '🥫', category: 'Kitchen' },

  // Bathroom
  { id: 'c9', name: 'Clean toilet', icon: '🚽', category: 'Bathroom' },
  { id: 'c10', name: 'Scrub shower', icon: '🚿', category: 'Bathroom' },
  { id: 'c11', name: 'Wipe mirrors', icon: '🪞', category: 'Bathroom' },
  { id: 'c12', name: 'Clean sink', icon: '🚰', category: 'Bathroom' },
  { id: 'c13', name: 'Mop bathroom floor', icon: '🧹', category: 'Bathroom' },
  { id: 'c14', name: 'Replace towels', icon: '🧴', category: 'Bathroom' },

  // Bedroom
  { id: 'c15', name: 'Make bed', icon: '🛏️', category: 'Bedroom' },
  { id: 'c16', name: 'Fold laundry', icon: '👕', category: 'Bedroom' },
  { id: 'c17', name: 'Vacuum bedroom', icon: '🧹', category: 'Bedroom' },
  { id: 'c18', name: 'Change bed sheets', icon: '🛏️', category: 'Bedroom' },
  { id: 'c19', name: 'Organize closet', icon: '👔', category: 'Bedroom' },
  { id: 'c20', name: 'Dust furniture', icon: '🪶', category: 'Bedroom' },

  // Living Areas
  { id: 'c21', name: 'Vacuum living room', icon: '🧹', category: 'Living Areas' },
  { id: 'c22', name: 'Dust shelves', icon: '🪶', category: 'Living Areas' },
  { id: 'c23', name: 'Organize living room', icon: '🛋️', category: 'Living Areas' },
  { id: 'c24', name: 'Clean windows', icon: '🪟', category: 'Living Areas' },
  { id: 'c25', name: 'Vacuum stairs', icon: '🧹', category: 'Living Areas' },
  { id: 'c26', name: 'Wipe baseboards', icon: '🧽', category: 'Living Areas' },

  // Laundry
  { id: 'c27', name: 'Wash clothes', icon: '👕', category: 'Laundry' },
  { id: 'c28', name: 'Dry clothes', icon: '🌀', category: 'Laundry' },
  { id: 'c29', name: 'Iron clothes', icon: '👔', category: 'Laundry' },
  { id: 'c30', name: 'Put away laundry', icon: '🧺', category: 'Laundry' },

  // Outdoor
  { id: 'c31', name: 'Water plants', icon: '🌱', category: 'Outdoor' },
  { id: 'c32', name: 'Mow lawn', icon: '🌿', category: 'Outdoor' },
  { id: 'c33', name: 'Sweep porch', icon: '🧹', category: 'Outdoor' },
  { id: 'c34', name: 'Rake leaves', icon: '🍂', category: 'Outdoor' },
  { id: 'c35', name: 'Take out recycling', icon: '♻️', category: 'Outdoor' },
  { id: 'c36', name: 'Clean garage', icon: '🚗', category: 'Outdoor' },

  // General
  { id: 'c37', name: 'Sweep floors', icon: '🧹', category: 'General' },
  { id: 'c38', name: 'Mop floors', icon: '🧽', category: 'General' },
  { id: 'c39', name: 'Dust surfaces', icon: '🪶', category: 'General' },
  { id: 'c40', name: 'Organize clutter', icon: '📦', category: 'General' },
];
