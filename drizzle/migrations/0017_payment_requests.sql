ALTER TABLE public.billing_settings
  ADD COLUMN payment_link text CHECK (payment_link IS NULL OR (payment_link ~ '^https://' AND length(payment_link) <= 300)),
  ADD COLUMN iban text CHECK (iban IS NULL OR length(iban) <= 40),
  ADD COLUMN default_due_days integer NOT NULL DEFAULT 14 CHECK (default_due_days BETWEEN 0 AND 90),
  ADD COLUMN request_prefix text NOT NULL DEFAULT 'LK' CHECK (request_prefix ~ '^[A-Z0-9]{1,8}$');

CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  number text,
  issue_date date,
  due_date date,
  period_start date,
  period_end date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_paid','paid','void')),
  total numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  notes text CHECK (notes IS NULL OR length(notes) <= 1000),
  sent_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, number)
);
CREATE INDEX payment_requests_owner_status_idx ON public.payment_requests(owner_id, status);
CREATE INDEX payment_requests_client_idx ON public.payment_requests(client_id);

CREATE TABLE public.payment_request_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  session_id uuid REFERENCES public.coach_sessions(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('session','group','trial','fee','custom')),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 200),
  qty numeric(8,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(10,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX payment_request_lines_request_idx ON public.payment_request_lines(request_id);
CREATE INDEX payment_request_lines_session_idx ON public.payment_request_lines(session_id) WHERE session_id IS NOT NULL;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL DEFAULT current_date,
  method text NOT NULL DEFAULT 'bank' CHECK (method IN ('cash','bank','card','other')),
  note text CHECK (note IS NULL OR length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_request_idx ON public.payments(request_id);
CREATE INDEX payments_owner_paid_on_idx ON public.payments(owner_id, paid_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_request_lines TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payment_requests, public.payment_request_lines, public.payments TO service_role;
REVOKE ALL ON public.payment_requests, public.payment_request_lines, public.payments FROM anon;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_request_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages payment requests" ON public.payment_requests FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner manages request lines" ON public.payment_request_lines FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner manages payments" ON public.payments FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Requests: ownership, protected fields, numbering and status transitions.
CREATE OR REPLACE FUNCTION public.tg_payment_request_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _svc boolean := coalesce(auth.role(), '') = 'service_role';
  _internal boolean := pg_trigger_depth() > 1;
  _prefix text; _days int; _year text; _seq int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF NOT _svc AND OLD.status <> 'draft' THEN RAISE EXCEPTION 'Only draft payment requests can be deleted; void it instead'; END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT _svc THEN
      NEW.owner_id := auth.uid();
      NEW.status := 'draft'; NEW.number := NULL; NEW.total := 0; NEW.paid_amount := 0;
      NEW.sent_at := NULL; NEW.paid_at := NULL; NEW.voided_at := NULL;
    END IF;
  ELSE
    IF NEW.owner_id <> OLD.owner_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
    IF NEW.client_id <> OLD.client_id AND OLD.status <> 'draft' THEN RAISE EXCEPTION 'Client can only change on a draft'; END IF;
    NEW.updated_at := now();
    IF NOT _svc AND NOT _internal THEN
      -- Derived / system fields are never taken from the app.
      NEW.total := OLD.total; NEW.paid_amount := OLD.paid_amount; NEW.number := OLD.number;
      NEW.sent_at := OLD.sent_at; NEW.paid_at := OLD.paid_at; NEW.voided_at := OLD.voided_at;
      IF OLD.status = 'void' THEN RAISE EXCEPTION 'This payment request is void'; END IF;
      IF NEW.status <> OLD.status THEN
        IF OLD.status = 'draft' AND NEW.status = 'sent' THEN
          SELECT coalesce(b.request_prefix, 'LK'), coalesce(b.default_due_days, 14) INTO _prefix, _days
            FROM (SELECT 1) x LEFT JOIN public.billing_settings b ON b.owner_id = NEW.owner_id;
          NEW.issue_date := coalesce(NEW.issue_date, current_date);
          NEW.due_date := coalesce(NEW.due_date, NEW.issue_date + _days);
          _year := to_char(NEW.issue_date, 'YYYY');
          PERFORM pg_advisory_xact_lock(hashtext(NEW.owner_id::text || _year));
          SELECT coalesce(max(substring(number FROM '(\d+)$')::int), 0) + 1 INTO _seq
            FROM public.payment_requests WHERE owner_id = NEW.owner_id AND number LIKE '%-' || _year || '-%';
          NEW.number := _prefix || '-' || _year || '-' || lpad(_seq::text, 4, '0');
          NEW.sent_at := now();
        ELSIF NEW.status = 'void' AND (OLD.status = 'draft' OR (OLD.status IN ('sent','partially_paid') AND OLD.paid_amount = 0)) THEN
          NEW.voided_at := now();
        ELSE
          RAISE EXCEPTION 'Status change from % to % is not allowed', OLD.status, NEW.status;
        END IF;
      END IF;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = NEW.client_id AND c.coach_id = NEW.owner_id) THEN
    RAISE EXCEPTION 'Client does not belong to you';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_requests_guard BEFORE INSERT OR UPDATE OR DELETE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_request_guard();

-- Lines: editable only on drafts; owner and session checks; one session per non-void request.
CREATE OR REPLACE FUNCTION public.tg_payment_line_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _svc boolean := coalesce(auth.role(), '') = 'service_role'; _req public.payment_requests;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO _req FROM public.payment_requests WHERE id = OLD.request_id;
    -- Parent already gone (cascade) or internal: allow.
    IF FOUND AND NOT _svc AND pg_trigger_depth() = 1 AND _req.status <> 'draft' THEN
      RAISE EXCEPTION 'Lines can only be changed while the payment request is a draft';
    END IF;
    RETURN OLD;
  END IF;
  SELECT * INTO _req FROM public.payment_requests WHERE id = NEW.request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment request not found'; END IF;
  IF pg_trigger_depth() = 1 AND _req.status <> 'draft' AND NOT (TG_OP = 'UPDATE' AND NEW.session_id IS NULL AND OLD.session_id IS NOT NULL AND NEW.description = OLD.description AND NEW.qty = OLD.qty AND NEW.unit_price = OLD.unit_price) THEN
    RAISE EXCEPTION 'Lines can only be changed while the payment request is a draft';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.request_id <> OLD.request_id THEN RAISE EXCEPTION 'A line cannot move to another request'; END IF;
  NEW.owner_id := _req.owner_id;
  IF NOT _svc AND _req.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Not your payment request'; END IF;
  IF NEW.session_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.coach_sessions s WHERE s.id = NEW.session_id AND s.coach_id = _req.owner_id) THEN
      RAISE EXCEPTION 'Session does not belong to you';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext('prl' || NEW.session_id::text || _req.client_id::text));
    -- Group sessions bill per head, so the same session may appear once per client.
    IF EXISTS (SELECT 1 FROM public.payment_request_lines l JOIN public.payment_requests r ON r.id = l.request_id
               WHERE l.session_id = NEW.session_id AND l.id <> NEW.id AND r.status <> 'void' AND r.client_id = _req.client_id) THEN
      RAISE EXCEPTION 'This session is already on another payment request';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_request_lines_guard BEFORE INSERT OR UPDATE OR DELETE ON public.payment_request_lines
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_line_guard();

CREATE OR REPLACE FUNCTION public.tg_payment_line_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rid uuid := coalesce(NEW.request_id, OLD.request_id);
BEGIN
  UPDATE public.payment_requests r
     SET total = coalesce((SELECT sum(amount) FROM public.payment_request_lines WHERE request_id = _rid), 0)
   WHERE r.id = _rid AND r.status = 'draft';
  RETURN NULL;
END $$;
CREATE TRIGGER payment_request_lines_total AFTER INSERT OR UPDATE OR DELETE ON public.payment_request_lines
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_line_total();

-- Payments: only on sent/partially paid, never above the remaining amount.
CREATE OR REPLACE FUNCTION public.tg_payment_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _svc boolean := coalesce(auth.role(), '') = 'service_role'; _req public.payment_requests;
BEGIN
  SELECT * INTO _req FROM public.payment_requests WHERE id = NEW.request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment request not found'; END IF;
  IF NOT _svc AND _req.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Not your payment request'; END IF;
  NEW.owner_id := _req.owner_id;
  IF _req.status NOT IN ('sent','partially_paid') THEN RAISE EXCEPTION 'Payments can only be recorded on sent payment requests'; END IF;
  IF NEW.amount > _req.total - _req.paid_amount THEN RAISE EXCEPTION 'Payment is more than the remaining amount'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payments_guard BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_guard();

CREATE OR REPLACE FUNCTION public.tg_payment_recompute()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rid uuid := coalesce(NEW.request_id, OLD.request_id); _paid numeric;
BEGIN
  SELECT coalesce(sum(amount), 0) INTO _paid FROM public.payments WHERE request_id = _rid;
  UPDATE public.payment_requests r SET
    paid_amount = _paid,
    status = CASE WHEN r.status IN ('draft','void') THEN r.status
                  WHEN _paid >= r.total AND r.total > 0 THEN 'paid'
                  WHEN _paid > 0 THEN 'partially_paid' ELSE 'sent' END,
    paid_at = CASE WHEN r.status NOT IN ('draft','void') AND _paid >= r.total AND r.total > 0 THEN coalesce(r.paid_at, now()) ELSE NULL END
  WHERE r.id = _rid;
  RETURN NULL;
END $$;
CREATE TRIGGER payments_recompute AFTER INSERT OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_recompute();

COMMENT ON TABLE public.payment_requests IS 'Payment requests (tracking only, not legal invoices). Overdue = due_date < today and status not paid/void; not stored.';