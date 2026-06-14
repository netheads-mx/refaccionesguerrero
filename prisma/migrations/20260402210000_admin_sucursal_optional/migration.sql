-- Administrators are not bound to a single branch.
-- Make sucursal_id nullable on usuarios so administrators can manage all branches.
ALTER TABLE "usuarios" ALTER COLUMN "sucursal_id" DROP NOT NULL;
