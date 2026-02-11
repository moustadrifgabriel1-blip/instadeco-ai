/**
 * Script pour corriger la récursion infinie dans les policies RLS de profiles.
 * 
 * Usage: node scripts/fix-rls-recursion.js
 * 
 * Ce script exécute les commandes SQL via l'API Supabase Management.
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extraire le project ref de l'URL
const PROJECT_REF = SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const sql_statements = [
  // 1. Créer la fonction is_admin()
  `CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS boolean
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = public
   STABLE
   AS $$
     SELECT EXISTS (
       SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
     );
   $$;`,

  // 2. Créer la fonction get_own_credits()
  `CREATE OR REPLACE FUNCTION public.get_own_credits()
   RETURNS integer
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = public
   STABLE
   AS $$
     SELECT credits FROM profiles WHERE id = auth.uid();
   $$;`,

  // 3. Créer la fonction get_own_role()
  `CREATE OR REPLACE FUNCTION public.get_own_role()
   RETURNS text
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = public
   STABLE
   AS $$
     SELECT role FROM profiles WHERE id = auth.uid();
   $$;`,

  // 4. Drop les anciennes policies
  `DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON profiles;`,

  // 5. Recréer la policy Admin sans récursion
  `CREATE POLICY "Admins have full access to profiles" ON profiles
   FOR ALL
   USING (public.is_admin());`,

  // 6. Recréer la policy Update sans récursion
  `CREATE POLICY "Users can update own profile" ON profiles
   FOR UPDATE
   USING (auth.uid() = id)
   WITH CHECK (
     auth.uid() = id AND
     credits = public.get_own_credits() AND
     role = public.get_own_role()
   );`,

  // 7. Corriger audit_logs
  `DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;`,
  `CREATE POLICY "Admins can read all audit logs" ON audit_logs
   FOR SELECT
   USING (public.is_admin());`,

  // 8. Corriger blog_articles
  `DROP POLICY IF EXISTS "Admins can insert blog articles" ON blog_articles;`,
  `CREATE POLICY "Admins can insert blog articles" ON blog_articles
   FOR INSERT
   WITH CHECK (public.is_admin());`,

  `DROP POLICY IF EXISTS "Admins can update blog articles" ON blog_articles;`,
  `CREATE POLICY "Admins can update blog articles" ON blog_articles
   FOR UPDATE
   USING (public.is_admin());`,

  `DROP POLICY IF EXISTS "Admins can delete blog articles" ON blog_articles;`,
  `CREATE POLICY "Admins can delete blog articles" ON blog_articles
   FOR DELETE
   USING (public.is_admin());`,
];

async function runSQL(sql) {
  // Use the Supabase REST API to run raw SQL via the pg_query extension
  // Alternative: use the /pg/query endpoint or the RPC endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

async function main() {
  console.log(`🔧 Correction RLS récursion infinie sur: ${PROJECT_REF}`);
  console.log(`📦 ${sql_statements.length} statements à exécuter\n`);

  // Try using the Supabase Management API (requires personal access token)
  // Since we don't have one, let's use an alternative approach:
  // Execute SQL via a temporary RPC function

  // First, create a helper RPC to execute SQL
  const createExecSQL = `
    CREATE OR REPLACE FUNCTION public._exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `;

  // Use the REST API to create the function first
  console.log('1️⃣  Création de la fonction helper _exec_sql...');
  
  // Actually, we can't create functions via REST API directly.
  // Let's use a different approach: write all SQL to a single block
  // and have the user paste it into the Supabase SQL Editor.

  const fullSQL = sql_statements.join('\n\n');
  
  console.log('='.repeat(60));
  console.log('📋 SQL À EXÉCUTER DANS LE SUPABASE SQL EDITOR');
  console.log('='.repeat(60));
  console.log('\n🔗 Ouvrez: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
  console.log('\n📋 Copiez-collez le SQL ci-dessous :\n');
  console.log('-'.repeat(60));
  console.log(fullSQL);
  console.log('-'.repeat(60));
  console.log('\n✅ Puis cliquez "Run" dans l\'éditeur SQL de Supabase.');
  console.log('📊 Ensuite, relancez: curl https://instadeco.app/api/v2/health');
}

main().catch(console.error);
