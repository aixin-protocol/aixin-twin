-- These tables are service_role-only (accessed via the /api/public/mcp handler
-- using supabaseAdmin, which bypasses RLS). Explicit deny-all policies silence
-- the "RLS enabled, no policy" linter and document intent.
CREATE POLICY demo_api_keys_no_direct ON public.demo_api_keys FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY demo_customers_no_direct ON public.demo_customers FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY demo_orders_no_direct ON public.demo_orders FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY demo_refunds_no_direct ON public.demo_refunds FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY demo_agent_actions_no_direct ON public.demo_agent_actions FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);