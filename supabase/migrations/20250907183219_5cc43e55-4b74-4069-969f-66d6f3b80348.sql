-- Enable the auto-approval trigger for loan applications
CREATE TRIGGER loan_auto_approval_trigger
  BEFORE INSERT ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_loan_application();

-- Also approve existing qualifying applications
UPDATE public.loan_applications 
SET 
  status = 'approved',
  approval_date = now(),
  approved_amount = LEAST(requested_amount, lp.max_amount),
  interest_rate = lp.interest_rate,
  term_months = lp.term_months
FROM public.loan_products lp
WHERE 
  public.loan_applications.loan_product_id = lp.id
  AND public.loan_applications.status = 'pending'
  AND COALESCE(public.loan_applications.credit_score, 0) >= COALESCE(lp.min_credit_score, 300)
  AND public.loan_applications.requested_amount >= lp.min_amount
  AND public.loan_applications.requested_amount <= lp.max_amount;