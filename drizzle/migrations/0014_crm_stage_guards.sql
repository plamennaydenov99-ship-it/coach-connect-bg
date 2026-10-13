CREATE OR REPLACE FUNCTION public.tg_crm_stage_structure_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Whole pipeline being deleted (cascade): parent row is already gone.
    IF NOT EXISTS (SELECT 1 FROM public.crm_pipelines WHERE id = OLD.pipeline_id) THEN
      RETURN OLD;
    END IF;
    IF OLD.category = 'archived' THEN
      RAISE EXCEPTION 'The archived stage of a pipeline cannot be deleted' USING ERRCODE = 'P0001';
    END IF;
    IF OLD.category IN ('enquiry','active') AND NOT EXISTS (
      SELECT 1 FROM public.crm_stages WHERE pipeline_id = OLD.pipeline_id AND category = OLD.category AND id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'Each pipeline needs at least one % stage', CASE OLD.category WHEN 'enquiry' THEN 'Lead' ELSE 'Active' END USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.category IS DISTINCT FROM OLD.category THEN
    IF OLD.category = 'archived' THEN
      RAISE EXCEPTION 'The archived stage of a pipeline cannot change type' USING ERRCODE = 'P0001';
    END IF;
    IF OLD.category IN ('enquiry','active') AND NOT EXISTS (
      SELECT 1 FROM public.crm_stages WHERE pipeline_id = OLD.pipeline_id AND category = OLD.category AND id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'Each pipeline needs at least one % stage', CASE OLD.category WHEN 'enquiry' THEN 'Lead' ELSE 'Active' END USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER crm_stages_structure_delete BEFORE DELETE ON public.crm_stages
  FOR EACH ROW EXECUTE FUNCTION public.tg_crm_stage_structure_guard();
CREATE TRIGGER crm_stages_structure_category BEFORE UPDATE OF category ON public.crm_stages
  FOR EACH ROW EXECUTE FUNCTION public.tg_crm_stage_structure_guard();