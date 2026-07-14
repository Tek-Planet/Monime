-- Drop the foreign key constraint that's causing the issue
ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_product_id_fkey;

-- Add a new foreign key constraint to reference the inventory table instead
ALTER TABLE invoice_items 
ADD CONSTRAINT invoice_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES inventory(id) ON DELETE SET NULL;