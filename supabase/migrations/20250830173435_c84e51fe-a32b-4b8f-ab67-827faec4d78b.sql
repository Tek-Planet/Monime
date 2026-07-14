-- Fix function search path security warning
-- Update the adjust_supplier_balance function to have proper search_path

CREATE OR REPLACE FUNCTION public.adjust_supplier_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;