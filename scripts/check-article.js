require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, slug, title, content, tags, status, word_count')
    .eq('slug', 'eclairage-interieur-7-conseils-pour-une-ambiance-qui-transforme')
    .single();

  if (error) {
    console.log('ERROR:', error.code, error.message);
    return;
  }

  if (data === null) {
    console.log('NO DATA FOUND');
    return;
  }

  console.log('Found article:');
  console.log('  id:', data.id);
  console.log('  slug:', data.slug);
  console.log('  title:', data.title);
  console.log('  status:', data.status);
  console.log('  word_count:', data.word_count);
  console.log('  tags:', JSON.stringify(data.tags));
  console.log('  content is null:', data.content === null);
  console.log('  content is empty:', data.content === '');
  console.log('  content type:', typeof data.content);
  console.log('  content length:', data.content ? data.content.length : 0);
  console.log('  content first 200 chars:', data.content ? data.content.substring(0, 200) : 'NULL');
})();
