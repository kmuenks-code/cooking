/**
 * Content validation. Run with `npm run validate`.
 *
 * Checks the rules in docs/content-model.md: unique ids, resolvable
 * prerequisites, an acyclic graph, lesson/curriculum agreement, resolvable
 * recipe tags, and image credits. Exits non-zero on any error so it can gate a
 * commit hook later.
 */
import { loadLessons, loadModules, loadRecipes, validateContent } from '../lib/content';
import { allSkills } from '../lib/content';

const issues = validateContent();
const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warning');

const modules = loadModules();
const skills = allSkills();
const lessons = loadLessons();
const recipes = loadRecipes();

const edges = Array.from(skills.values()).reduce(
  (n, s) => n + s.prereqs.length,
  0,
);
const entryPoints = Array.from(skills.values()).filter(
  (s) => s.prereqs.length === 0,
);

console.log('');
console.log('  Content');
console.log(`    modules ................ ${modules.length}`);
console.log(`    sub-modules ............ ${skills.size}`);
console.log(`    prerequisite edges ..... ${edges}`);
console.log(`    entry points ........... ${entryPoints.length}`);
console.log(`    lessons written ........ ${lessons.size} / ${skills.size}`);
console.log(`    recipes ................ ${recipes.length}`);

// Media completeness, which is the thing most likely to rot quietly.
let videoSlots = 0;
let videoTodo = 0;
let imageSlots = 0;
let imageTodo = 0;
let unreviewed = 0;
for (const lesson of lessons.values()) {
  for (const v of lesson.frontmatter.videos ?? []) {
    videoSlots++;
    if (!v.youtube_id || v.youtube_id === 'TODO') videoTodo++;
  }
  for (const img of lesson.frontmatter.images ?? []) {
    imageSlots++;
    if (!img.src || img.src === 'TODO') imageTodo++;
  }
  if (!lesson.frontmatter.reviewed) unreviewed++;
}

console.log('');
console.log('  Media');
console.log(`    video slots ............ ${videoSlots} (${videoTodo} unfilled)`);
console.log(`    image slots ............ ${imageSlots} (${imageTodo} unfilled)`);
console.log(`    unreviewed lessons ..... ${unreviewed}`);

if (warnings.length) {
  console.log('');
  console.log(`  Warnings (${warnings.length})`);
  for (const w of warnings) console.log(`    ${w.where}: ${w.message}`);
}

console.log('');
if (errors.length) {
  console.log(`  ✗ ${errors.length} error(s)`);
  for (const e of errors) console.log(`    ${e.where}: ${e.message}`);
  console.log('');
  process.exit(1);
}

console.log('  ✓ no errors');
console.log('');
