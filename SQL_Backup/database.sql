-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  fullname text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['SuperAdmin'::text, 'Admin'::text, 'Staff'::text, 'Boarder'::text])),
  boarderid uuid,
  createdby uuid,
  email text,
  phone text,
  address text,
  profilephoto text,
  emergencycontact text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  full_name text,
  boarder_id uuid,
  profile_photo text,
  emergency_contact text,
  created_by uuid,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_boarderid_fkey FOREIGN KEY (boarderid) REFERENCES public.boarders(id),
  CONSTRAINT accounts_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.accounts(id)
);
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal'::text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL,
  details text,
  performed_by text,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.beds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Available'::text,
  boarder_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT beds_pkey PRIMARY KEY (id),
  CONSTRAINT beds_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT fk_bed_boarder FOREIGN KEY (boarder_id) REFERENCES public.boarders(id)
);
CREATE TABLE public.boarders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  contact_number text,
  email text,
  address text,
  emergency_contact text,
  assigned_room_id uuid,
  assigned_bed_id uuid,
  move_in_date date DEFAULT CURRENT_DATE,
  move_out_date date,
  advance_amount numeric DEFAULT 0,
  deposit_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Active'::text,
  profile_photo text,
  occupation text,
  created_at timestamp with time zone DEFAULT now(),
  gender text,
  CONSTRAINT boarders_pkey PRIMARY KEY (id),
  CONSTRAINT boarders_assigned_room_id_fkey FOREIGN KEY (assigned_room_id) REFERENCES public.rooms(id),
  CONSTRAINT boarders_assigned_bed_id_fkey FOREIGN KEY (assigned_bed_id) REFERENCES public.beds(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category text NOT NULL,
  description text,
  amount numeric NOT NULL,
  date date DEFAULT CURRENT_DATE,
  paid_by text,
  receipt_ref text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.maintenance_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid,
  boarder_id uuid,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'Medium'::text,
  status text NOT NULL DEFAULT 'Open'::text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  category text DEFAULT 'Other'::text,
  images ARRAY DEFAULT '{}'::text[],
  CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_requests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT maintenance_requests_boarder_id_fkey FOREIGN KEY (boarder_id) REFERENCES public.boarders(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  boarder_id uuid,
  type text NOT NULL,
  amount numeric NOT NULL,
  month text,
  date date DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  status text NOT NULL DEFAULT 'Pending'::text,
  method text,
  received_by text,
  late_fee numeric DEFAULT 0,
  receipt_number text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_boarder_id_fkey FOREIGN KEY (boarder_id) REFERENCES public.boarders(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'Boarder'::text,
  boarder_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  email text,
  phone text,
  address text,
  profile_photo text,
  emergency_contact text,
  created_by uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_boarder_id_fkey FOREIGN KEY (boarder_id) REFERENCES public.boarders(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  monthly_rate numeric NOT NULL,
  status text NOT NULL DEFAULT 'Available'::text,
  floor text,
  amenities ARRAY,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  under_maintenance boolean DEFAULT false,
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'BoardHub Residences'::text,
  address text,
  contact text,
  email text,
  website text,
  tax_id text,
  owner_name text,
  currency text DEFAULT 'PHP'::text,
  late_fee_enabled boolean DEFAULT true,
  late_fee_amount numeric DEFAULT 0,
  grace_period_days integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  gcash_number text,
  gcash_qr_code text,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);