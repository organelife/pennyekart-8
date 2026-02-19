
-- Customer wallets
CREATE TABLE public.customer_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  min_usage_amount numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own wallet" ON public.customer_wallets FOR SELECT USING (auth.uid() = customer_user_id OR is_super_admin() OR has_permission('read_users'));
CREATE POLICY "Admins can manage customer wallets" ON public.customer_wallets FOR ALL USING (is_super_admin() OR has_permission('update_users'));
CREATE POLICY "System can insert customer wallet" ON public.customer_wallets FOR INSERT WITH CHECK (auth.uid() = customer_user_id OR is_super_admin());

CREATE TRIGGER update_customer_wallets_updated_at BEFORE UPDATE ON public.customer_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Customer wallet transactions
CREATE TABLE public.customer_wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES public.customer_wallets(id),
  customer_user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  type text NOT NULL DEFAULT 'credit',
  amount numeric NOT NULL,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own transactions" ON public.customer_wallet_transactions FOR SELECT USING (auth.uid() = customer_user_id OR is_super_admin() OR has_permission('read_users'));
CREATE POLICY "Admins can manage customer transactions" ON public.customer_wallet_transactions FOR ALL USING (is_super_admin() OR has_permission('update_users'));
CREATE POLICY "System can insert customer transactions" ON public.customer_wallet_transactions FOR INSERT WITH CHECK (is_super_admin() OR has_permission('update_users'));

-- Auto-create customer wallet on profile creation
CREATE OR REPLACE FUNCTION public.auto_create_customer_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_type = 'customer' THEN
    INSERT INTO public.customer_wallets (customer_user_id, balance)
    VALUES (NEW.user_id, 0)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_customer_wallet_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_customer_wallet();

-- Add wallet permissions
INSERT INTO public.permissions (name, feature, action, description) VALUES
('read_wallets', 'wallets', 'read', 'View all wallets'),
('update_wallets', 'wallets', 'update', 'Credit/debit wallets')
ON CONFLICT DO NOTHING;
