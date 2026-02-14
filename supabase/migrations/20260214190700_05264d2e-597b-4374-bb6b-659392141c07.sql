
-- Districts table
CREATE TABLE public.locations_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'Kerala',
  country text NOT NULL DEFAULT 'India',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Local bodies (Panchayath / Municipality)
CREATE TABLE public.locations_local_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES public.locations_districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  body_type text NOT NULL DEFAULT 'panchayath',
  ward_count integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations_local_bodies ENABLE ROW LEVEL SECURITY;

-- RLS policies for districts
CREATE POLICY "Anyone can read active districts" ON public.locations_districts FOR SELECT USING (is_active = true OR is_super_admin() OR has_permission('read_locations'));
CREATE POLICY "Authorized can create districts" ON public.locations_districts FOR INSERT WITH CHECK (is_super_admin() OR has_permission('create_locations'));
CREATE POLICY "Authorized can update districts" ON public.locations_districts FOR UPDATE USING (is_super_admin() OR has_permission('update_locations'));
CREATE POLICY "Authorized can delete districts" ON public.locations_districts FOR DELETE USING (is_super_admin() OR has_permission('delete_locations'));

-- RLS policies for local bodies
CREATE POLICY "Anyone can read active local bodies" ON public.locations_local_bodies FOR SELECT USING (is_active = true OR is_super_admin() OR has_permission('read_locations'));
CREATE POLICY "Authorized can create local bodies" ON public.locations_local_bodies FOR INSERT WITH CHECK (is_super_admin() OR has_permission('create_locations'));
CREATE POLICY "Authorized can update local bodies" ON public.locations_local_bodies FOR UPDATE USING (is_super_admin() OR has_permission('update_locations'));
CREATE POLICY "Authorized can delete local bodies" ON public.locations_local_bodies FOR DELETE USING (is_super_admin() OR has_permission('delete_locations'));

-- Triggers
CREATE TRIGGER update_locations_districts_updated_at BEFORE UPDATE ON public.locations_districts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_local_bodies_updated_at BEFORE UPDATE ON public.locations_local_bodies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default district
INSERT INTO public.locations_districts (name) VALUES ('Malappuram');

-- Seed permissions
INSERT INTO public.permissions (name, feature, action, description) VALUES
('read_locations', 'locations', 'read', 'View locations'),
('create_locations', 'locations', 'create', 'Create locations'),
('update_locations', 'locations', 'update', 'Update locations'),
('delete_locations', 'locations', 'delete', 'Delete locations');
