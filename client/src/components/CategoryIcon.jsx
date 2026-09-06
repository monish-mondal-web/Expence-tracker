import React from 'react';
import {
  Coffee,
  Utensils,
  UtensilsCrossed,
  Moon,
  Cookie,
  ShoppingCart,
  ShoppingBag,
  Apple,
  Salad,
  Fish,
  Beef,
  Wine,
  MoreHorizontal,
  Pizza,
  Flame,
  Cake,
  Sandwich,
  GlassWater,
  CupSoda,
  Soup,
  Carrot,
  Egg,
  Candy,
  Popcorn,
  IceCream,
  Sparkles,
  Wallet,
  Receipt,
  Store,
  Tag,
} from 'lucide-react';

const ICON_MAP = {
  Coffee,
  Utensils,
  UtensilsCrossed,
  Moon,
  Cookie,
  ShoppingCart,
  ShoppingBag,
  Apple,
  Salad,
  Fish,
  Beef,
  Wine,
  MoreHorizontal,
  Pizza,
  Flame,
  Cake,
  Sandwich,
  GlassWater,
  CupSoda,
  Soup,
  Carrot,
  Egg,
  Candy,
  Popcorn,
  IceCream,
  Sparkles,
  Wallet,
  Receipt,
  Store,
  Tag,
};

// Intelligent semantic fallback based on food names
const NAME_KEYWORD_MAP = [
  { keywords: ['breakfast', 'morning', 'coffee', 'tea', 'cafe', 'espresso'], icon: Coffee },
  { keywords: ['lunch', 'meal', 'bistro', 'restaurant'], icon: UtensilsCrossed },
  { keywords: ['dinner', 'supper', 'night'], icon: Utensils },
  { keywords: ['snack', 'cookie', 'biscuit', 'chips'], icon: Cookie },
  { keywords: ['grocery', 'groceries', 'market', 'supermarket', 'mart'], icon: ShoppingCart },
  { keywords: ['fruit', 'apple', 'banana', 'berries'], icon: Apple },
  { keywords: ['veg', 'vegetable', 'salad', 'greens'], icon: Salad },
  { keywords: ['fish', 'seafood', 'prawn', 'salmon'], icon: Fish },
  { keywords: ['meat', 'beef', 'chicken', 'pork', 'mutton', 'steak'], icon: Beef },
  { keywords: ['drink', 'beverage', 'juice', 'soda', 'cocktail', 'cola'], icon: CupSoda },
  { keywords: ['water', 'hydration'], icon: GlassWater },
  { keywords: ['pizza', 'italian'], icon: Pizza },
  { keywords: ['burger', 'sandwich', 'fast food', 'sub'], icon: Sandwich },
  { keywords: ['spicy', 'bbq', 'grill'], icon: Flame },
  { keywords: ['dessert', 'cake', 'sweet', 'bakery'], icon: Cake },
  { keywords: ['ice cream', 'gelato'], icon: IceCream },
  { keywords: ['soup', 'broth', 'ramen', 'noodles'], icon: Soup },
  { keywords: ['egg', 'omelet'], icon: Egg },
];

export const CategoryIcon = ({ name = 'Utensils', size = 20, color = '#64748B' }) => {
  // 1. Direct map by exact icon name
  if (ICON_MAP[name]) {
    const IconComponent = ICON_MAP[name];
    return <IconComponent size={size} color={color} strokeWidth={2} />;
  }

  // 2. Semantic fallback by lowercased category name
  const lower = String(name).toLowerCase();
  for (const item of NAME_KEYWORD_MAP) {
    if (item.keywords.some((k) => lower.includes(k))) {
      const MatchedIcon = item.icon;
      return <MatchedIcon size={size} color={color} strokeWidth={2} />;
    }
  }

  // 3. Universal Fallback
  return <UtensilsCrossed size={size} color={color} strokeWidth={2} />;
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
