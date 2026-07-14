-- Auto-approve qualifying loan applications on insert
-- Function: public.auto_approve_loan_application
CREATE OR REPLACE FUNCTION public.auto_approve_loan_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_rec RECORD;
BEGIN
  -- Load loan product details
  SELECT 
    lp.min_amount,
    lp.max_amount,
    lp.interest_rate,
    lp.term_months,
    COALESCE(lp.min_credit_score, 300) AS min_credit_score
  INTO product_rec
  FROM public.loan_products lp
  WHERE lp.id = NEW.loan_product_id;

  IF NOT FOUND THEN
    RETURN NEW; -- If no product found, do nothing
  END IF;

  -- Auto-approval criteria:
  -- 1) Applicant credit score meets/exceeds product minimum
  -- 2) Requested amount is within product min/max bounds
  IF COALESCE(NEW.credit_score, 0) >= product_rec.min_credit_score
     AND NEW.requested_amount >= product_rec.min_amount
     AND NEW.requested_amount <= product_rec.max_amount
  THEN
    NEW.status := 'approved';
    NEW.approval_date := now();
    NEW.approved_amount := LEAST(NEW.requested_amount, product_rec.max_amount);
    NEW.interest_rate := product_rec.interest_rate;
    NEW.term_months := product_rec.term_months;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: auto_approve_before_insert on loan_applications
DROP TRIGGER IF EXISTS auto_approve_before_insert ON public.loan_applications;
CREATE TRIGGER auto_approve_before_insert
BEFORE INSERT ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_loan_application();