const { marked } = require('marked');
const renderer = new marked.Renderer();

renderer.image = ({ href, title, text }) => {
  return '<img src="test" />';
};

renderer.link = ({ href, title, tokens }) => {
  const text = tokens ? tokens.map(t => 'text' in t ? t.text : '').join('') : '';
  return '<a>' + text + '</a>';
};

// Test with null/undefined content
try { marked.parse(null, { renderer, async: false }); console.log('null: OK'); } catch(e) { console.log('null:', e.message); }
try { marked.parse(undefined, { renderer, async: false }); console.log('undefined: OK'); } catch(e) { console.log('undefined:', e.message); }
try { marked.parse('', { renderer, async: false }); console.log('empty: OK'); } catch(e) { console.log('empty:', e.message); }

try { 
  const content = '# Test\n\n<div class="test">Hello</div>\n\n![salon](IMAGE:salon)\n\n[Link](https://example.com)';
  const result = marked.parse(content, { renderer, async: false });
  console.log('complex: OK, length:', result.length);
} catch(e) {
  console.log('complex:', e.message);
}

console.log('\nAll tests done.');
