DROP POLICY IF EXISTS mock_customers_read_all ON public.mock_customers;
DROP POLICY IF EXISTS mock_orders_read_all ON public.mock_orders;
REVOKE SELECT ON public.mock_customers FROM anon;
REVOKE SELECT ON public.mock_orders FROM anon;
CREATE POLICY mock_customers_read_authenticated ON public.mock_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY mock_orders_read_authenticated ON public.mock_orders FOR SELECT TO authenticated USING (true);