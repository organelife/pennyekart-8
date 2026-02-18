
-- Add delivery_type column to profiles for delivery_staff differentiation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'fixed' CHECK (delivery_type IN ('fixed', 'part_time'));

-- Add earning_balance column to delivery_staff_wallets for part-time earning tracking
ALTER TABLE public.delivery_staff_wallets
ADD COLUMN IF NOT EXISTS earning_balance numeric NOT NULL DEFAULT 0;
