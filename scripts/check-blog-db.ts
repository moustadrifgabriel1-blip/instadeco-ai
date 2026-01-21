
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkArticle() {
  const slug = 'meubles-multifonctions-petit-espace-revolutionnez-votre-interieur';
  console.log(`Checking for article with slug: ${slug}`);

  // Check if blog_articles table exists and has entries
  const { count, error: countError } = await supabase
    .from('blog_articles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error accessing blog_articles table:', countError);
  } else {
    console.log(`Total articles in 'blog_articles': ${count}`);
  }

  // Fetch the specific article
  const { data, error } = await supabase
    .from('blog_articles')
    .select('*')
    .eq('slug', slug);

  if (error) {
    console.error('Error fetching article:', error);
  } else {
    console.log('Article found:', data && data.length > 0 ? 'YES' : 'NO');
    if (data && data.length > 0) {
      console.log('Article status:', data[0].status);
    }
  }

  // List all available slugs for debugging
  const { data: allSlugs } = await supabase
    .from('blog_articles')
    .select('slug, status')
    .limit(10);
  
  if (allSlugs) {
    console.log('Available slugs (first 10):');
    allSlugs.forEach(a => console.log(`- ${a.slug} (${a.status})`));
  }
}

checkArticle();
