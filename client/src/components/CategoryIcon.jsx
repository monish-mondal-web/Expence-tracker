import React from 'react';
import {
  // Food & Dining
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
  ChefHat,

  // Maid / Housekeeping / Staff / Helpers
  Brush,
  SprayCan,
  WashingMachine,
  Shirt,
  HandHeart,
  HeartHandshake,
  Users,
  UserCheck,
  Sparkles,

  // Household & Bills & Utilities
  Home,
  Bed,
  Bath,
  Armchair,
  Zap,
  Lightbulb,
  Droplets,
  Wifi,
  Tv,
  Smartphone,
  Phone,
  PhoneCall,

  // Health & Medical
  Pill,
  Stethoscope,
  Syringe,
  HeartPulse,
  Hospital,
  Activity,

  // Commute & Transport
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Luggage,
  Fuel,
  Compass,

  // Shopping & Personal Care
  Scissors,
  Baby,
  Dog,
  Cat,
  Store,
  Tag,
  Gift,

  // Education & Work
  GraduationCap,
  Book,
  BookOpen,
  School,
  Backpack,
  Briefcase,
  Laptop,

  // Entertainment & Fitness
  Dumbbell,
  Film,
  Music,
  Gamepad2,
  Camera,
  Ticket,
  Palmtree,

  // Finance & Repairs
  Wallet,
  Receipt,
  CreditCard,
  Banknote,
  Coins,
  PiggyBank,
  Wrench,
  Hammer,
  ShieldCheck,
  Award,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';

const ICON_MAP = {
  // Food
  Coffee,
  Utensils,
  UtensilsCrossed,
  Moon,
  Cookie,
  Apple,
  Salad,
  Fish,
  Beef,
  Wine,
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
  ChefHat,

  // Maid & Household Help
  Brush,
  SprayCan,
  WashingMachine,
  Shirt,
  HandHeart,
  HeartHandshake,
  Users,
  UserCheck,
  Sparkles,

  // Rent & Utilities
  Home,
  Bed,
  Bath,
  Armchair,
  Zap,
  Lightbulb,
  Droplets,
  Wifi,
  Tv,
  Smartphone,
  Phone,
  PhoneCall,

  // Health & Medicine
  Pill,
  Stethoscope,
  Syringe,
  HeartPulse,
  Hospital,
  Activity,

  // Transport & Travel
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Luggage,
  Fuel,
  Compass,

  // Shopping & Personal
  ShoppingCart,
  ShoppingBag,
  Scissors,
  Baby,
  Dog,
  Cat,
  Store,
  Tag,
  Gift,

  // Education & Career
  GraduationCap,
  Book,
  BookOpen,
  School,
  Backpack,
  Briefcase,
  Laptop,

  // Entertainment & Sports
  Dumbbell,
  Film,
  Music,
  Gamepad2,
  Camera,
  Ticket,
  Palmtree,

  // Money & Tools
  Wallet,
  Receipt,
  CreditCard,
  Banknote,
  Coins,
  PiggyBank,
  Wrench,
  Hammer,
  ShieldCheck,
  Award,
  AlertCircle,
  MoreHorizontal,
};

// Intelligent semantic fallback based on category names
const NAME_KEYWORD_MAP = [
  // Maid / Housekeeping / Cooking help
  { keywords: ['maid', 'cook', 'cleaner', 'helper', 'bai', 'servant', 'housekeeping', 'cleaning', 'laundry', 'dhobi'], icon: Brush },
  { keywords: ['chef', 'kitchen cook', 'khansama'], icon: ChefHat },
  { keywords: ['ironing', 'clothes', 'washing', 'laundry'], icon: WashingMachine },

  // Food & Dining
  { keywords: ['breakfast', 'morning', 'coffee', 'tea', 'cafe', 'espresso', 'chai'], icon: Coffee },
  { keywords: ['lunch', 'meal', 'bistro', 'thali', 'restaurant'], icon: UtensilsCrossed },
  { keywords: ['dinner', 'supper', 'night', 'food', 'dining'], icon: Utensils },
  { keywords: ['snack', 'cookie', 'biscuit', 'chips', 'munchies', 'samosa'], icon: Cookie },
  { keywords: ['grocery', 'groceries', 'market', 'supermarket', 'mart', 'ration', 'sabzi'], icon: ShoppingCart },
  { keywords: ['fruit', 'apple', 'banana', 'mango', 'berries'], icon: Apple },
  { keywords: ['veg', 'vegetable', 'salad', 'greens'], icon: Salad },
  { keywords: ['fish', 'seafood', 'prawn', 'salmon', 'mach'], icon: Fish },
  { keywords: ['meat', 'beef', 'chicken', 'mutton', 'egg', 'kebab'], icon: Beef },
  { keywords: ['drink', 'beverage', 'juice', 'soda', 'cocktail', 'cola', 'water'], icon: CupSoda },
  { keywords: ['dessert', 'cake', 'sweet', 'bakery', 'mithai', 'ice cream'], icon: Cake },
  { keywords: ['pizza', 'burger', 'fast food', 'chowmein', 'roll'], icon: Pizza },

  // Healthcare
  { keywords: ['medicine', 'meds', 'pharmacy', 'chemist', 'tablet', 'syrup', 'dawaii'], icon: Pill },
  { keywords: ['doctor', 'clinic', 'hospital', 'consultation', 'test', 'diagnostic'], icon: Stethoscope },

  // Utilities & Bills
  { keywords: ['rent', 'room rent', 'flat', 'hostel', 'pg', 'house rent', 'maintenance'], icon: Home },
  { keywords: ['electricity', 'electric', 'power', 'bijli', 'current', 'bill'], icon: Zap },
  { keywords: ['water bill', 'water supply', 'water filter', 'aquaguard'], icon: Droplets },
  { keywords: ['wifi', 'internet', 'broadband', 'router', 'fiber'], icon: Wifi },
  { keywords: ['mobile', 'recharge', 'sim', 'airtel', 'jio', 'vi'], icon: Smartphone },
  { keywords: ['tv', 'cable', 'dth', 'dish', 'tata sky'], icon: Tv },

  // Commute & Transport
  { keywords: ['petrol', 'diesel', 'fuel', 'cng', 'gas'], icon: Fuel },
  { keywords: ['cab', 'uber', 'ola', 'auto', 'taxi', 'car'], icon: Car },
  { keywords: ['bike', 'motorcycle', 'rapido', 'scooter'], icon: Bike },
  { keywords: ['bus', 'train', 'metro', 'fare', 'ticket'], icon: Train },
  { keywords: ['flight', 'air', 'travel', 'trip', 'tour', 'vacation', 'hotel'], icon: Plane },

  // Personal Care & Education & Entertainment
  { keywords: ['gym', 'fitness', 'workout', 'exercise', 'protein'], icon: Dumbbell },
  { keywords: ['salon', 'parlour', 'haircut', 'shave', 'spa', 'beauty'], icon: Scissors },
  { keywords: ['pet', 'dog', 'cat', 'puppy', 'veterinary'], icon: Dog },
  { keywords: ['baby', 'kid', 'child', 'diaper', 'infant'], icon: Baby },
  { keywords: ['study', 'education', 'tuition', 'school', 'college', 'course', 'books'], icon: GraduationCap },
  { keywords: ['movie', 'cinema', 'netflix', 'ott', 'game', 'entertainment'], icon: Film },
  { keywords: ['shopping', 'clothes', 'dress', 'fashion', 'shoes', 'amazon', 'flipkart'], icon: ShoppingBag },
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
