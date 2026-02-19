-- Drop the foreign key constraint that only allows products table IDs
ALTER TABLE public.penny_prime_coupons DROP CONSTRAINT penny_prime_coupons_product_id_fkey;