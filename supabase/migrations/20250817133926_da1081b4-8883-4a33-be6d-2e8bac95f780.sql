-- Function to adjust supplier balance on expenses changes
CREATE OR REPLACE FUNCTION public.adjust_supplier_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.supplier_id IS NOT NULL THEN
      UPDATE public.suppliers
      SET current_balance = COALESCE(current_balance, 0) + COALESCE(NEW.amount,0)
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.supplier_id IS NOT NULL THEN
      UPDATE public.suppliers
      SET current_balance = COALESCE(current_balance, 0) - COALESCE(OLD.amount,0)
      WHERE id = OLD.supplier_id;
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If supplier changed, remove from old and add to new
    IF (OLD.supplier_id IS DISTINCT FROM NEW.supplier_id) THEN
      IF OLD.supplier_id IS NOT NULL THEN
        UPDATE public.suppliers
        SET current_balance = COALESCE(current_balance, 0) - COALESCE(OLD.amount,0)
        WHERE id = OLD.supplier_id;
      END IF;
      IF NEW.supplier_id IS NOT NULL THEN
        UPDATE public.suppliers
        SET current_balance = COALESCE(current_balance, 0) + COALESCE(NEW.amount,0)
        WHERE id = NEW.supplier_id;
      END IF;
    ELSE
      -- Same supplier, adjust by difference
      IF NEW.supplier_id IS NOT NULL THEN
        UPDATE public.suppliers
        SET current_balance = COALESCE(current_balance, 0) + COALESCE(NEW.amount,0) - COALESCE(OLD.amount,0)
        WHERE id = NEW.supplier_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers on expenses
DROP TRIGGER IF EXISTS trg_expenses_adjust_balance ON public.expenses;
CREATE TRIGGER trg_expenses_adjust_balance
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.adjust_supplier_balance();