
-- Enums
CREATE TYPE public.slot_status AS ENUM ('open', 'pending', 'booked');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'declined', 'cancelled');

-- =========================================================
-- TABLES (create first so policies can reference each other)
-- =========================================================
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status public.slot_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slot_time_valid CHECK (end_time > start_time)
);
CREATE INDEX idx_slots_coach_date ON public.availability_slots(coach_id, date);
CREATE INDEX idx_slots_status ON public.availability_slots(status);

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.availability_slots(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.booking_status NOT NULL DEFAULT 'pending',
  note TEXT,
  price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_athlete ON public.bookings(athlete_id);
CREATE INDEX idx_bookings_coach ON public.bookings(coach_id);
CREATE INDEX idx_bookings_slot ON public.bookings(slot_id);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, coach_id)
);
CREATE INDEX idx_conv_athlete ON public.conversations(athlete_id);
CREATE INDEX idx_conv_coach ON public.conversations(coach_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX idx_msg_conversation ON public.messages(conversation_id, created_at);

-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;
GRANT SELECT ON public.availability_slots TO anon;
GRANT ALL ON public.availability_slots TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- availability_slots policies
CREATE POLICY "Public can view open slots of verified coaches"
ON public.availability_slots FOR SELECT
USING (
  status = 'open'
  AND EXISTS (SELECT 1 FROM public.coach_profiles cp WHERE cp.id = coach_id AND cp.verified = true)
);

CREATE POLICY "Coach can view own slots"
ON public.availability_slots FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Athlete can view slot for own booking"
ON public.availability_slots FOR SELECT
USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.slot_id = availability_slots.id AND b.athlete_id = auth.uid()));

CREATE POLICY "Coach can insert own slots"
ON public.availability_slots FOR INSERT
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coach can update own slots"
ON public.availability_slots FOR UPDATE
USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coach can delete own open slots"
ON public.availability_slots FOR DELETE
USING (auth.uid() = coach_id AND status = 'open');

-- bookings policies
CREATE POLICY "Athlete can view own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = athlete_id);

CREATE POLICY "Coach can view own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Athlete can create booking on open slot"
ON public.bookings FOR INSERT
WITH CHECK (
  auth.uid() = athlete_id
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.availability_slots s
    WHERE s.id = slot_id AND s.status = 'open' AND s.coach_id = bookings.coach_id
  )
);

CREATE POLICY "Coach can update own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Athlete can cancel own booking"
ON public.bookings FOR UPDATE
USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

-- conversations policies
CREATE POLICY "Participants can view conversation"
ON public.conversations FOR SELECT
USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Athlete can create conversation"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Participants can update conversation"
ON public.conversations FOR UPDATE
USING (auth.uid() = athlete_id OR auth.uid() = coach_id)
WITH CHECK (auth.uid() = athlete_id OR auth.uid() = coach_id);

-- messages policies
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND (c.athlete_id = auth.uid() OR c.coach_id = auth.uid())
));

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (c.athlete_id = auth.uid() OR c.coach_id = auth.uid())
  )
);

CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND (c.athlete_id = auth.uid() OR c.coach_id = auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND (c.athlete_id = auth.uid() OR c.coach_id = auth.uid())
));

-- =========================================================
-- TRIGGERS
-- =========================================================
CREATE TRIGGER trg_slots_updated_at BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_sync_slot_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.availability_slots SET status = 'pending' WHERE id = NEW.slot_id AND status = 'open';
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE public.availability_slots SET status = 'booked' WHERE id = NEW.slot_id;
    ELSIF NEW.status IN ('declined', 'cancelled') THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE slot_id = NEW.slot_id AND id <> NEW.id AND status IN ('pending', 'confirmed')
      ) THEN
        UPDATE public.availability_slots SET status = 'open' WHERE id = NEW.slot_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_slot_on_booking
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_slot_on_booking();

CREATE OR REPLACE FUNCTION public.tg_bump_conversation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_conversation AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.tg_bump_conversation();

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.availability_slots REPLICA IDENTITY FULL;
