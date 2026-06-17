const fs = require('fs');
const glob = require('glob');

const files = glob.sync('apps/web/src/app/**/page.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Check if it uses useSession
  if (!content.includes('const { data: session } = useSession();')) {
    continue;
  }

  console.log(`Fixing ${file}`);

  // 1. Change useSession
  content = content.replace(
    'const { data: session } = useSession();',
    'const { data: session, status } = useSession();'
  );

  // 2. Fix the early return in the fetch function (which might be fetchDeals, fetchData, fetchContracts etc)
  // Look for `if (!accessToken) return;` or `if (!accessToken) { return; }`
  content = content.replace(
    /if\s*\(!accessToken\)\s*return;/g,
    'if (!accessToken) { setLoading(false); return; }'
  );

  // Also in some files it might be multi-line:
  content = content.replace(
    /if\s*\(!accessToken\)\s*\{\s*return;\s*\}/g,
    'if (!accessToken) { setLoading(false); return; }'
  );

  // 3. Fix the useEffect that calls the fetch function.
  // We need to find the useEffect that has the fetch function as dependency.
  // We can look for `React.useEffect(() => {\n    fetch`
  // Actually, we can just replace `React.useEffect(() => {` with `React.useEffect(() => {\n    if (status === 'loading') return;\n    if (status === 'unauthenticated') { setLoading(false); return; }`
  // But there might be multiple useEffects.
  // Better yet, we can use regex to find the useEffect that calls a function starting with `fetch` and taking no args.
  content = content.replace(
    /React\.useEffect\(\(\) => \{\n\s*(fetch[A-Za-z0-9_]*\(\));\n\s*\}, \[([^\]]+)\]\);/g,
    `React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    $1;
  }, [status, $2]);`
  );

  // In case it's a one liner or doesn't exactly match newlines:
  content = content.replace(
    /React\.useEffect\(\(\) => \{\s*(fetch[A-Za-z0-9_]*\(\));\s*\}, \[([^\]]+)\]\);/g,
    `React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { setLoading(false); return; }
    $1;
  }, [status, $2]);`
  );

  fs.writeFileSync(file, content);
}
console.log('Done');
