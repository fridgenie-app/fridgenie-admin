export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      households: {
        Row: Household;
        Insert: Partial<Household>;
        Update: Partial<Household>;
      };
      pantry_items: {
        Row: PantryItem;
        Insert: Partial<PantryItem>;
        Update: Partial<PantryItem>;
      };
      shopping_items: {
        Row: ShoppingItem;
        Insert: Partial<ShoppingItem>;
        Update: Partial<ShoppingItem>;
      };
      fridgenie_recipes: {
        Row: Recipe;
        Insert: Partial<Recipe>;
        Update: Partial<Recipe>;
      };
      user_cooked_recipes: {
        Row: CookHistory;
        Insert: Partial<CookHistory>;
        Update: Partial<CookHistory>;
      };
      user_favorites: {
        Row: UserFavorite;
        Insert: Partial<UserFavorite>;
        Update: Partial<UserFavorite>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string | null;
  subscription_tier: "free" | "pro";
  is_admin: boolean;
  deleted_at: string | null;
  created_at: string;
  last_active_at: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string;
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface PantryItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  expiry_date: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  is_purchased: boolean;
  added_by: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string | null;
  instructions: string | null;
  household_id: string | null;
  created_by: string;
  created_at: string;
}

export interface CookHistory {
  id: string;
  recipe_id: string | null;
  recipe_title: string;
  user_id: string;
  household_id: string | null;
  cooked_at: string;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeHouseholds: number;
  totalItems: number;
  recipesCooked: number;
  avgItemsPerHousehold: number;
  avgRecipesPerUser: number;
  dau?: number;
  wau?: number;
  mau?: number;
}

export interface Overview {
  total_users: number;
  pro_users: number;
  deleted_users: number;
  dau: number;
  wau: number;
  mau: number;
  households: number;
  pantry_items: number;
  recipes_cooked: number;
  ai_recipes: number;
  cost_today_usd: number;
  cost_7d_usd: number;
  cost_30d_usd: number;
}

export interface CostRow {
  usage_date: string;
  actor_type: string;
  function: string;
  provider: string;
  model: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  unpriced: boolean;
}

export interface UserRow {
  id: string;
  email: string | null;
  subscription_tier: "free" | "pro";
  is_admin: boolean;
  deleted_at: string | null;
  created_at: string;
  last_active_at: string | null;
}

export interface HouseholdRow {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  items_count: number;
  recipes_cooked: number;
}

export interface ActivityItem {
  id: string;
  type: "signup" | "item_added" | "recipe_cooked" | "item_removed";
  description: string;
  user_email?: string;
  timestamp: string;
}

export interface RetentionCohort {
  cohort_date: string;
  total_users: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

export interface FeatureUsageStat {
  feature_name: string;
  count: number;
  last_used: string | null;
}

export interface ReportSchedule {
  id: string;
  report_type: string;
  frequency: "daily" | "weekly" | "monthly";
  email: string;
  created_at: string;
}
