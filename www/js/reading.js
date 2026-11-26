// Interpretation engine: turns a resolved cast into an integrated, plain-English reading.
// Works entirely offline from the JSON database. No AI service is used.
import { LINE } from './engine.js';

export const CONTEXTS = {
  relationships: { label: 'a relationship', field: 'love', re: /\b(love|lover|relationship|partner|boyfriend|girlfriend|husband|wife|spouse|marri|dating|date|romance|romantic|crush|ex\b|breakup|break up|divorce|heart)/i,
    frame: 'In matters of the heart, remember that a reading describes dynamics and attitudes, not the other person\'s fixed choices.' },
  family: { label: 'family', field: 'love', re: /\b(family|mother|father|mum|mom|dad|parent|sons?\b|daughter|child|children|kids?|brother|sister|sibling|grand(?:ma|pa|mother|father|child|parent|son|daughter)|in-law|relative)/i,
    frame: 'Families change slowly. Look for the small, consistent actions that would change the pattern between you.' },
  career: { label: 'work and career', field: 'work', re: /\b(job|career|work|boss|colleague|cowork|promotion|interview|business|company|startup|project|team|client|office|employ|hire|hiring|quit|resign|profession)/i,
    frame: 'At work, translate the reading into one concrete step you can take this week.' },
  finance: { label: 'money and finances', field: 'work', re: /\b(money|financ|invest|stock|crypto|loan|debt|mortgage|savings?|salary|income|buy|sell|purchase|price|budget|rent|house|property)/i,
    frame: 'The I Ching can help you reflect on attitude and timing, but it cannot predict markets or prices. Make financial decisions on real information and, where it matters, qualified advice.' },
  education: { label: 'study and learning', field: 'work', re: /\b(study|studies|exam|test|school|college|university|degree|course|learn|student|teacher|thesis|class)/i,
    frame: 'For study, the reading speaks to how you learn: patience, method and the right guidance.' },
  creativity: { label: 'creative work', field: 'work', re: /\b(creative|creativity|art|artist|write|writing|book|novel|music|song|paint|design|film|poem|inspiration)/i,
    frame: 'Creative work has its own seasons. Ask which phase your work is in: seeding, growing, harvesting or resting.' },
  conflict: { label: 'a conflict', field: 'self', re: /\b(conflict|fight|argument|argue|dispute|enemy|angry|anger|lawsuit|court|quarrel|tension|disagree)/i,
    frame: 'In conflict, the I Ching consistently values fairness, restraint and knowing when to stop.' },
  transition: { label: 'a major life change', field: 'self', re: /\b(move|moving|relocat|change|transition|new chapter|retire|leave|leaving|start over|decision|decide|choice|choose|path|direction|should i)/i,
    frame: 'At a crossroads, use the reading to clarify what matters to you, then decide with your own judgement.' },
  health: { label: 'health and wellbeing', field: 'self', re: /\b(health|ill|illness|sick|disease|doctor|diagnos|surgery|pregnan|medical|medicine|therapy|depress|anxiety|pain)/i,
    frame: 'The I Ching is a tool for reflection, not medical advice. For any health concern, please consult a qualified professional; use this reading only to reflect on your attitude and how you care for yourself.' },
  growth: { label: 'personal growth', field: 'self', re: /\b(myself|self|grow|growth|purpose|meaning|spiritual|habit|confidence|happy|happiness|life|who am i|understand)/i,
    frame: 'For personal growth, treat the reading as a mirror: which part of it describes you most honestly?' },
  future: { label: 'the future', field: 'self', re: /\b(future|will i|going to happen|next year|what lies ahead|fate|destiny|outcome)/i,
    frame: 'The I Ching does not predict a fixed future. It describes the tendencies of the present moment and how they may develop, depending partly on what you do.' },
};
const ORDER = ['health', 'finance', 'family', 'relationships', 'conflict', 'career', 'education', 'creativity', 'transition', 'future', 'growth'];

export function detectContext(question) {
  const q = (question || '').trim();
  if (!q) return { key: 'general', label: 'your situation', field: 'self', frame: 'You consulted in silence. Hold your situation in mind as you read; the parts that resonate are the ones that matter.' };
  for (const k of ORDER) if (CONTEXTS[k].re.test(q)) return { key: k, ...CONTEXTS[k] };
  return { key: 'general', label: 'your situation', field: 'self', frame: 'Your question is broad, which is fine: the reading speaks to the overall direction of your situation.' };
}

export const POSITION = [
  { name: 'first', role: 'the beginning of the situation, its foundation and first stirrings' },
  { name: 'second', role: 'the heart of your inner situation, where things settle into a steady form' },
  { name: 'third', role: 'the threshold between inner and outer, a place of transition and some risk' },
  { name: 'fourth', role: 'the entry into the outer world, close to the place of authority' },
  { name: 'fifth', role: 'the position of leadership, the center of the outer situation' },
  { name: 'sixth', role: 'the culmination of the situation, where things reach their limit or move beyond it' },
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
export const hexTitle = (h) => `${h.n}. ${h.name} (${h.zh} ${h.pinyin})`;
const triPhrase = (index, h) => {
  const lo = index.tri[h.lower], up = index.tri[h.upper];
  return lo.key === up.key ? `${up.image} doubled` : `${up.image} above ${lo.image}`;
};

function trigramShift(index, a, b) {
  const parts = [];
  if (a.lower !== b.lower) { const x = index.tri[a.lower], y = index.tri[b.lower]; parts.push(`the lower trigram, which traditionally represents your inner attitude and the starting point, turns from ${x.image} (${lc(x.quality)}) into ${y.image} (${lc(y.quality)})`); }
  if (a.upper !== b.upper) { const x = index.tri[a.upper], y = index.tri[b.upper]; parts.push(`the upper trigram, which represents outer circumstances and how things unfold, turns from ${x.image} (${lc(x.quality)}) into ${y.image} (${lc(y.quality)})`); }
  if (!parts.length) return '';
  return cap(parts.join(', while ')) + '.';
}

/** Compose the full reading. `res` comes from engine.resolve(). */
export function composeReading(res, index, question = '') {
  const ctx = detectContext(question);
  const P = res.primary, R = res.resulting, E = res.emphasis, ch = res.changing;
  const field = ctx.field;
  const all6Special = ch.length === 6 && (P.n === 1 || P.n === 2);

  // ---- A. Plain-English integrated reading
  const A = [];
  A.push(`${question.trim() ? `You asked about ${ctx.label}.` : 'You consulted the oracle in silence.'} The answer begins with Hexagram ${P.n}, ${P.name}: ${triPhrase(index, P)}. It describes ${P.core}. ${P[field]}`);
  if (!ch.length) {
    A.push(`None of your six lines is changing. That means the reading is not about a transformation already under way, but about understanding the present situation clearly and acting in harmony with it. ${firstSentence(P.dir.replace('The situation may be moving toward', 'The hexagram points toward'))}`);
  } else {
    const lineSumm = ch.map((p) => `the ${POSITION[p - 1].name} line (${lc(firstSentence(P.lines[p - 1].plain)).replace(/\.$/, '')})`);
    let s = `${ch.length === 1 ? 'One line is' : `${['','One','Two','Three','Four','Five','Six'][ch.length]} lines are`} changing: ${lineSumm.join('; ')}. `;
    if (E.focus === 'primary-lines' && E.main) {
      const L = P.lines[E.main - 1].plain;
      s += ch.length === 2 ? `Read together, the lower line describes the earlier or more inward stage of the situation, and the upper line, which carries more weight, the later or more outward stage. Its message is the key: ${lc(L)}` : `This line is the heart of the reading: ${lc(L)}`;
    } else if (E.focus === 'result-still-lines') {
      const lines = E.lines.map((p) => R.lines[p - 1].plain);
      s += `With so much in motion, the old situation is largely dissolving. Tradition then looks at what stays the same: the unchanging ${E.lines.length === 1 ? 'line' : 'lines'} of the new hexagram. The ${POSITION[E.lines[0] - 1].name} line of ${R.name} says: ${lc(lines[0])}`;
    } else if (E.focus === 'both-judgments') {
      s += 'With three lines in motion, the situation is evenly balanced between what it is and what it is becoming, so both hexagrams speak with equal force.';
    } else if (all6Special) {
      s += P.allLines.plain;
    } else {
      s += 'Every line is in motion, so the situation is turning into its opposite. The new hexagram carries the main message.';
    }
    A.push(s);
    const shift = trigramShift(index, P, R);
    A.push(`As these lines change, ${P.name} becomes Hexagram ${R.n}, ${R.name}, which describes ${R.core}. ${shift} Read this as a possible direction of development rather than a fixed outcome: the more consciously you respond to the present, the more you shape where it leads.`);
  }
  const doNow = lc(P.do[0]).replace(/\.$/, '');
  const doNext = R ? lc(R.do[0]).replace(/\.$/, '') : lc(P.do[1] || P.do[0]).replace(/\.$/, '');
  A.push(`In practical terms: for now, ${doNow}; ${R ? `as things develop, ${doNext}` : `and then ${doNext}`}. Be wary of ${lc(P.avoid[0]).replace(/\.$/, '')}. ${ctx.frame}`);

  // ---- B. Present situation
  const B = { hex: P, text: P.now, trigrams: [index.tri[P.lower], index.tri[P.upper]] };

  // ---- C. What is changing
  const C = ch.map((p) => ({ pos: p, value: res.lines[p - 1], kind: LINE[res.lines[p - 1]].name, role: POSITION[p - 1].role, plain: P.lines[p - 1].plain, legge: P.lines[p - 1].legge, main: E.main === p && E.focus === 'primary-lines' }));
  let cIntro = '';
  if (ch.length) {
    cIntro = ch.length === 1
      ? `A single changing line focuses the whole reading on one point: ${POSITION[ch[0] - 1].role}.`
      : `These lines run from ${POSITION[ch[0] - 1].role} up to ${POSITION[ch[ch.length - 1] - 1].role}. Read them as stages of one movement, from the earlier, more inward phase to the later, more outward one.`;
  }
  const stillLines = E.focus === 'result-still-lines' ? E.lines.map((p) => ({ pos: p, plain: R.lines[p - 1].plain, legge: R.lines[p - 1].legge })) : [];

  // ---- D. Where heading
  const D = R ? { hex: R, text: `${R.dir} ${R.now.split('. ').slice(1, 3).join('. ')}${R.now.split('. ').length > 2 ? '.' : ''}`.replace(/\.\.$/, '.') } : null;

  // ---- E. Practical guidance
  const doList = [...P.do.slice(0, 3), ...(R ? R.do.slice(0, 2) : [])];
  const avoidList = [...P.avoid.slice(0, 2), ...(R ? R.avoid.slice(0, 1) : [])];
  const questions = [
    `Where in your life do you recognize "${P.keywords[0]}" right now?`,
    ch.length ? `What would it mean, concretely, to act on the ${POSITION[(E.main || ch[0]) - 1].name} line's advice this week?` : `What would it look like to act in harmony with ${P.name.toLowerCase()} rather than against it?`,
    R ? `If things move toward ${R.name.toLowerCase()}, what could you do now to make that a healthy development?` : 'What is the one thing you already know you need to do?',
  ];
  const Eg = { context: ctx, focus: P[field], focusNext: R ? R[field] : null, doList, avoidList, questions };

  // ---- F. Traditional texts
  const F = { primary: { hex: P, judgment: P.judgment, image: P.image, lines: C.map((c) => ({ pos: c.pos, legge: c.legge })) }, resulting: R ? { hex: R, judgment: R.judgment, image: R.image, still: stillLines } : null, special: all6Special ? P.allLines : null, emphasis: E.text };

  // ---- G. Jung
  const G = [P.jung, R ? `The movement toward ${R.name} adds another layer. ${R.jung}` : 'Because nothing is changing, the reading invites you to stay with this single image and notice what it stirs in you.',
    'Jung suggested treating a consultation like a dream: notice which image or phrase affects you most strongly, and ask why. The meaning lies less in prediction than in what the reading brings into awareness.'];

  const summary = `${hexTitle(P)}${R ? ` → ${hexTitle(R)}` : ''}${ch.length ? `, changing line${ch.length > 1 ? 's' : ''} ${ch.join(', ')}` : ', no changing lines'}`;
  return { context: ctx, summary, A, B, C, cIntro, D, E: Eg, F, G, emphasis: E, stillLines };
}

/** Plain-text export of a reading (for the journal and sharing). */
export function readingToText(r, meta = {}) {
  const out = [];
  out.push('I CHING — THE LIVING ORACLE');
  if (meta.date) out.push(`Date: ${meta.date}`);
  out.push(`Question: ${meta.question || '(silent consultation)'}`);
  if (meta.lines) out.push(`Casts (bottom to top): ${meta.lines.join(', ')}  [${meta.method === 'yarrow' ? 'yarrow-stalk simulation' : 'three coins'}]`);
  out.push(`Result: ${r.summary}`, '');
  out.push('YOUR READING IN PLAIN ENGLISH', ...r.A, '');
  out.push('YOUR PRESENT SITUATION', r.B.text, '');
  if (r.C.length) { out.push('WHAT IS CHANGING'); if (r.cIntro) out.push(r.cIntro); r.C.forEach((c) => out.push(`Line ${c.pos} (${c.kind}): ${c.plain}`)); out.push(''); }
  if (r.D) out.push('WHERE THE SITUATION MAY BE HEADING', r.D.text, '');
  out.push('PRACTICAL GUIDANCE', r.E.focus, ...r.E.doList.map((d) => `• ${d}`), 'Avoid:', ...r.E.avoidList.map((d) => `• ${d}`), '');
  out.push('TRADITIONAL TEXT (James Legge, 1882)', `Judgment: ${r.F.primary.judgment}`, `Image: ${r.F.primary.image}`);
  r.F.primary.lines.forEach((l) => out.push(`Line ${l.pos}: ${l.legge}`));
  if (r.F.special) out.push(`All lines: ${r.F.special.legge}`);
  if (r.F.resulting) out.push(`Resulting hexagram — Judgment: ${r.F.resulting.judgment}`);
  out.push(`Convention: ${r.F.emphasis}`, '');
  out.push('JUNGIAN PERSPECTIVE', ...r.G);
  return out.join('\n');
}
