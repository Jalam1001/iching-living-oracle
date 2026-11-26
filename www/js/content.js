// Educational content. Original text written for this project (MIT / CC BY 4.0).
// Classical quotations are from James Legge's public-domain translation (1882).
export const LINKS = {
  repo: 'https://github.com/Jalam1001/iching-living-oracle',
  apk: 'https://github.com/Jalam1001/iching-living-oracle/releases/download/v0.1-rc1/iching-living-oracle-v0.1-rc1.apk',
  apkRelease: 'https://github.com/Jalam1001/iching-living-oracle/releases/tag/v0.1-rc1',
  webRelease: 'https://github.com/Jalam1001/iching-living-oracle/releases/tag/v0.1',
  site: 'https://jalam1001.github.io/iching-living-oracle/',
  testing: 'https://github.com/Jalam1001/iching-living-oracle/blob/main/docs/TESTING.md',
  jungForeword: 'https://jungpage.org/learn/articles/analytical-psychology/519-forward-to-the-i-ching?showall=1',
};

export const REFERENCES = [
  { group: 'Classical source texts (translations of the original)', items: [
    { t: 'James Legge (trans.), The Yî King — Sacred Books of the East, vol. 16 (1882)', d: 'The public-domain translation used for every classical Judgment, Image and line statement in this app.', u: 'https://sacred-texts.com/ich/index.htm' },
    { t: 'Chinese Text Project — 易經 Book of Changes (Chinese original with Legge\'s English)', d: 'The original classical Chinese text, line by line, with a parallel translation.', u: 'https://ctext.org/book-of-changes/yi-jing' },
    { t: 'Richard Wilhelm & Cary F. Baynes, The I Ching or Book of Changes (Princeton, Bollingen Series XIX)', d: 'Wilhelm\'s 1924 German translation, rendered into English by Baynes in 1950, with Jung\'s foreword. Still in copyright; available from the publisher.', u: 'https://press.princeton.edu/books/hardcover/9780691097503/the-i-ching-or-book-of-changes' },
  ]},
  { group: 'Carl Gustav Jung (psychological interpretation)', items: [
    { t: 'C. G. Jung, Foreword to the I Ching (1949) — complete text', d: 'Hosted by the Jung Page (C. G. Jung Center of Houston). Copyright remains with the rights holders; this app gives only a summary.', u: 'https://jungpage.org/learn/articles/analytical-psychology/519-forward-to-the-i-ching?showall=1' },
    { t: 'C. G. Jung, Synchronicity: An Acausal Connecting Principle (Princeton)', d: 'Jung\'s 1952 essay, his fullest statement of the idea of meaningful coincidence.', u: 'https://press.princeton.edu/books/paperback/9780691150505/synchronicity' },
    { t: 'Synchronicity — overview (Wikipedia)', d: 'A neutral overview of the concept and its scientific reception.', u: 'https://en.wikipedia.org/wiki/Synchronicity' },
  ]},
  { group: 'History and scholarship (modern explanations)', items: [
    { t: 'Richard J. Smith, The I Ching: A Biography (Princeton University Press, 2012)', d: 'A readable history of the book in China, East Asia and the West.', u: 'https://press.princeton.edu/books/hardcover/9780691145099/the-i-ching' },
    { t: 'Edward L. Shaughnessy, Unearthing the Changes (Columbia University Press, 2014)', d: 'The excavated early manuscripts of the Changes and what they reveal.', u: 'https://cup.columbia.edu/book/unearthing-the-changes/9780231161848' },
    { t: 'Stanford Encyclopedia of Philosophy — Zhu Xi', d: 'The Song-dynasty philosopher whose rules for reading changing lines this app follows.', u: 'https://plato.stanford.edu/entries/zhu-xi/' },
    { t: 'Stanford Encyclopedia of Philosophy — Chinese Metaphysics', d: 'Yin–yang, qi and change in Chinese philosophy.', u: 'https://plato.stanford.edu/entries/chinese-metaphysics/' },
    { t: 'I Ching (Wikipedia)', d: 'General overview, with references to scholarly literature.', u: 'https://en.wikipedia.org/wiki/I_Ching' },
    { t: 'Ten Wings (Wikipedia)', d: 'The ancient commentaries traditionally attributed to Confucius.', u: 'https://en.wikipedia.org/wiki/Ten_Wings' },
    { t: 'King Wen sequence (Wikipedia)', d: 'The traditional order of the 64 hexagrams used in this app.', u: 'https://en.wikipedia.org/wiki/King_Wen_sequence' },
    { t: 'Mawangdui Silk Texts (Wikipedia)', d: 'Including a 2nd-century BCE manuscript of the Changes in a different order.', u: 'https://en.wikipedia.org/wiki/Mawangdui_Silk_Texts' },
  ]},
  { group: 'Leibniz and binary arithmetic', items: [
    { t: 'G. W. Leibniz, Explanation of Binary Arithmetic (1703), trans. Lloyd Strickland', d: 'Leibniz\'s paper noting the correspondence between binary numbers and the hexagram diagrams sent from China.', u: 'https://www.leibniz-translations.com/binary.htm' },
    { t: 'Stanford Encyclopedia of Philosophy — Gottfried Wilhelm Leibniz', d: 'Background on Leibniz\'s philosophy and his interest in China.', u: 'https://plato.stanford.edu/entries/leibniz/' },
  ]},
  { group: 'Translators', items: [
    { t: 'James Legge (Wikipedia)', d: 'Scottish sinologist (1815–1897), translator of the Chinese classics.', u: 'https://en.wikipedia.org/wiki/James_Legge' },
    { t: 'Richard Wilhelm (Wikipedia)', d: 'German sinologist (1873–1930) whose translation Jung admired.', u: 'https://en.wikipedia.org/wiki/Richard_Wilhelm_(sinologist)' },
  ]},
];

export const HISTORY = `
<p class="lede">The I Ching (易經, <i>Yìjīng</i>, the "Classic of Changes") is one of the oldest books in the world still in daily use. It began as a manual for divination and grew, over a thousand years of commentary, into one of the great works of Chinese philosophy.</p>
<h3>Ancient origins</h3>
<p>Long before the book existed, rulers of the Shang dynasty (c. 1600–1046 BCE) consulted ancestors and spirits by heating turtle shells and ox bones and reading the cracks. Under the Zhou dynasty, a different method spread: sorting stalks of the yarrow plant to obtain numbers, which were written as lines. The core text, called the <b>Zhōuyì</b> (周易, "Changes of Zhou"), took shape during the Western Zhou period, roughly 1000–750 BCE. It consists of 64 six-line figures, each with a short Judgment and six line statements full of vivid images: dragons, foxes crossing rivers, wells, cauldrons, wild geese.</p>
<h3>Legend and evidence</h3>
<p>Tradition credits four sages. The mythical culture-hero <b>Fu Xi</b> is said to have discovered the eight trigrams by observing patterns in heaven and earth. <b>King Wen</b> of Zhou (11th century BCE) is said to have doubled them into 64 hexagrams and written the Judgments while imprisoned. His son, the <b>Duke of Zhou</b>, is credited with the line statements, and <b>Confucius</b> (551–479 BCE) with the commentaries known as the Ten Wings.</p>
<p>Modern scholars treat these attributions as legend. The text shows signs of gradual compilation by diviners over generations. The oldest surviving manuscripts are a bamboo-slip version of about 300 BCE (now in the Shanghai Museum) and a silk manuscript from a tomb at Mawangdui sealed in 168 BCE, which arranges the hexagrams in a different order. The Ten Wings were written by several hands between roughly the 4th and 2nd centuries BCE, probably well after Confucius.</p>
<h3>The Ten Wings: from oracle to philosophy</h3>
<p>The <b>Ten Wings</b> (十翼) are seven commentaries, three of them in two parts. They explain the Judgments, interpret the trigram "Images", discuss the first two hexagrams in depth, describe the symbolism of each trigram, justify the order of the hexagrams and, above all in the <i>Great Treatise</i> (繫辭, Xìcí), present a whole philosophy of change: "In the Changes there is the Great Ultimate, which produces the two forms..." With these commentaries attached, the book became a classic. In 136 BCE the Han emperor Wu made it one of the official Five Classics of Confucian learning, and for two thousand years every educated person in China studied it.</p>
<h3>Yin and yang</h3>
<p>The I Ching is built from two kinds of line: a solid line <b>⚊</b> (yang: firm, active, light) and a broken line <b>⚋</b> (yin: yielding, receptive, dark). They are not good and evil, or male and female in a simple sense, but complementary phases that turn into one another, like day and night or breathing in and out. Each contains the seed of the other, and the extreme of one gives way to the other. That is exactly what a "changing line" shows.</p>
<h3>Eight trigrams, sixty-four hexagrams</h3>
<p>Three lines, each yin or yang, can be combined in 2 × 2 × 2 = 8 ways: the eight trigrams (八卦, bāguà), associated with heaven, earth, thunder, wind, water, fire, mountain and lake. Two trigrams stacked together make a hexagram, and there are 8 × 8 = 64 of them, covering every possible combination of six lines. The lower trigram is traditionally the inner or earlier part of a situation, and the upper trigram the outer or later part.</p>
<h3>The King Wen sequence</h3>
<p>The received order of the 64 hexagrams is called the King Wen sequence. It begins with pure yang (1, The Creative) and pure yin (2, The Receptive) and ends with After Completion (63) and Before Completion (64), so that the book closes on something unfinished: change never ends. The hexagrams come in pairs. In 28 pairs, the second hexagram is the first turned upside down; in the remaining 4 pairs, whose figures look the same upside down, every line is reversed instead.</p>
<h3>Taoist and Confucian readings</h3>
<p>Both great native traditions of Chinese thought claimed the book. <b>Confucian</b> scholars read it as a guide to moral conduct and good government: the recurring "superior person" (君子, jūnzǐ) is someone who reads the times and responds with integrity. <b>Taoist</b> thinkers shared its vision of a world in constant flow, where wisdom lies in yielding to the natural course (the Dao) instead of forcing it. The philosopher Wang Bi (226–249 CE) wrote a deeply influential philosophical commentary, and in the Song dynasty Zhu Xi (1130–1200) restored attention to its divinatory use and set down the rules for reading changing lines that this app follows.</p>
<h3>Leibniz and binary numbers</h3>
<p>In 1701 the Jesuit missionary Joachim Bouvet sent the German philosopher <b>Gottfried Wilhelm Leibniz</b> a diagram of the 64 hexagrams arranged in the order associated with Fu Xi (the arrangement of the 11th-century thinker Shao Yong). Leibniz, who had developed binary arithmetic, saw that if a broken line is read as 0 and a solid line as 1, the sequence counts from 0 to 63. He published his "Explanation of Binary Arithmetic" in 1703, mentioning the hexagrams. The ancient Chinese authors did not think of the figures as binary numbers, but the structure is mathematically the same: six binary digits give 2⁶ = 64 possibilities.</p>
<h3>Arrival in the West</h3>
<p>Jesuit missionaries brought knowledge of the book to Europe in the 17th century, and a Latin translation prepared by Jean-Baptiste Régis and colleagues was published in the 1830s. <b>James Legge</b>'s English translation appeared in 1882 as volume 16 of the <i>Sacred Books of the East</i>; it is the translation quoted in this app. In 1924 <b>Richard Wilhelm</b> published a German translation shaped by years in China and by his teacher Lao Naixuan. Cary F. Baynes's English version of Wilhelm (1950), with a foreword by Carl Jung, made the I Ching famous in the West and inspired writers, composers and artists from John Cage to Philip K. Dick.</p>
<h3>A philosophy of change</h3>
<p>Beneath its use as an oracle, the I Ching offers a way of seeing: every situation is a moment in a process; strength and weakness, advance and retreat, have their right times; small beginnings grow; extremes reverse. Its practical wisdom is about timing, balance, relationships and conduct, which is why people still return to it whether or not they believe in divination.</p>`;

export const JUNG = `
<p class="lede">The Swiss psychiatrist <b>Carl Gustav Jung</b> (1875–1961) did more than anyone to bring the I Ching to Western readers, not as a fortune-telling device but as a tool for self-reflection.</p>
<h3>Wilhelm, Baynes and Jung</h3>
<p>Richard Wilhelm's German translation, <i>I Ging: Das Buch der Wandlungen</i>, was published in <b>1924</b>. Jung, who had been experimenting with the I Ching since the early 1920s, became Wilhelm's friend and invited him to lecture in Zurich. After Wilhelm's death in 1930, Jung encouraged his student <b>Cary F. Baynes</b> to translate Wilhelm's version into English. Jung wrote a foreword for it in <b>1949</b>, and the English translation was published in <b>1950</b> (Bollingen Series XIX).</p>
<h3>Summary of Jung's foreword</h3>
<p>Jung begins by admitting he is not a sinologist, so he can only describe his own experience. He contrasts Western science, which isolates causes and repeats experiments, with the Chinese view captured by the I Ching, which looks at the whole of a moment: everything that happens at the same time is taken to share the quality of that moment. Casting coins is a way of "reading" that moment.</p>
<p>To demonstrate, Jung did something unusual: he asked the I Ching what it thought of his plan to present it to Western readers, as though the book were a person. He obtained <b>Hexagram 50, The Cauldron</b> (a sacred vessel holding nourishment), with changing lines in the second and third places. He read this as the book describing itself: a vessel of spiritual nourishment whose "handle" (the concept by which it is grasped) had been altered, so that people no longer understood it. The resulting hexagram, <b>35, Progress</b>, suggested a new hearing. He also asked about his own action in writing the foreword and received <b>Hexagram 29, The Abysmal</b>, with a changing third line, which he took as a fitting warning about the difficulties and dangers of the task.</p>
<p>Jung is careful and candid throughout. He says the oracle cannot be proven, that a sceptic may see only projection, and that the reader must judge for themselves. What matters, he argues, is that the book insists on self-knowledge, and that its value can only be found through one's own experience. As he puts it near the end: "The I Ching does not offer itself with proofs and results; it does not vaunt itself, nor is it easy to approach. Like a part of nature, it waits until it is discovered." (You can try Jung's two consultations in this app: Hexagram 50 with lines 2 and 3, and Hexagram 29 with line 3.)</p>
<p><a class="ext" href="https://jungpage.org/learn/articles/analytical-psychology/519-forward-to-the-i-ching?showall=1" target="_blank" rel="noopener">Read the complete foreword (Jung Page, C. G. Jung Center of Houston) ↗</a></p>
<h3>Synchronicity</h3>
<p>Jung first used the word <b>synchronicity</b> publicly in a 1930 memorial lecture for Richard Wilhelm, and later developed it in his essay <i>Synchronicity: An Acausal Connecting Principle</i> (1952), written in dialogue with the physicist Wolfgang Pauli. He defined it as a <b>meaningful coincidence</b>: two events that are not linked by cause and effect, but are linked by meaning for the person who experiences them. His famous example: a patient was describing a dream about a golden scarab when a scarab-like beetle tapped on the window.</p>
<h3>Causes and meaningful coincidences</h3>
<p>A <b>causal</b> connection means one event produces another: rain makes the street wet. A <b>synchronistic</b> connection, in Jung's sense, means an outer event (such as the fall of three coins) and an inner state (your question, your mood, your situation) coincide in a way that feels meaningful, without one causing the other. Jung proposed that the I Ching works on this principle. This is a philosophical and psychological hypothesis. It is <b>not an established scientific mechanism</b>, and there is no scientific evidence that the coins can predict future events.</p>
<h3>Symbols, archetypes and the unconscious</h3>
<p>Jung believed the mind contains not only a personal unconscious but a <b>collective unconscious</b>: deep, shared patterns he called <b>archetypes</b>, such as the mother, the hero, the shadow and the wise old person. The I Ching's images (the dragon, the well, the abyss, the cauldron) are rich, ancient symbols that can resonate with these patterns. When a reading "hits home", Jung would say a symbol has touched something in you that was already active below the surface.</p>
<h3>Using a consultation for reflection</h3>
<ul><li>Treat the reading like a dream: notice which image affects you most strongly and why.</li><li>Ask what the reading reveals about your own attitude, not just about events.</li><li>Pay attention to resistance: a reading you dislike may point to something you are avoiding.</li><li>Write down what happens later, and compare (the Journal is designed for this).</li><li>Remember that you remain responsible for your decisions. The reading is a mirror, not a command.</li></ul>
<p class="note">In every reading, the "Jungian perspective" section is a modern psychological interpretation written for this app. It is kept separate from the classical Chinese text and from the plain-English reading so that you can always tell which is which.</p>`;

export const HOWTO = `
<p class="lede">You don't need any prior knowledge. Here is everything a first-time user needs, in about three minutes.</p>
<h3>1. What is the I Ching?</h3>
<p>An ancient Chinese book of 64 short chapters, each built around a six-line figure called a hexagram. Each hexagram describes a type of situation (beginning, conflict, waiting, abundance, retreat...) and how to act wisely within it. For 3,000 years people have "consulted" it by asking a question and producing a hexagram by chance.</p>
<h3>2. How to ask a question</h3>
<p>Open questions work best: <i>"What should I understand about...?"</i>, <i>"How should I approach...?"</i>, <i>"What is the wisest attitude toward...?"</i>. Yes/no questions and requests for exact predictions work poorly, because the I Ching describes tendencies and attitudes, not fixed outcomes. Broad questions are fine. You can also simply hold your situation in mind without typing anything.</p>
<h3>3. How to cast the coins</h3>
<p>Tap <b>Cast</b> (or shake your phone, if you turn that on). Three coins are tossed. The inscribed side counts 2 (yin) and the plain side counts 3 (yang), so each toss totals 6, 7, 8 or 9:</p>
<table class="vals"><tr><th>Total</th><th>Line</th><th>Meaning</th><th>Coins</th></tr>
<tr><td>6</td><td>Old Yin <span class="mini y6"></span></td><td>broken, <b>changing</b> into solid</td><td>1 in 8</td></tr>
<tr><td>7</td><td>Young Yang <span class="mini y7"></span></td><td>solid, stable</td><td>3 in 8</td></tr>
<tr><td>8</td><td>Young Yin <span class="mini y8"></span></td><td>broken, stable</td><td>3 in 8</td></tr>
<tr><td>9</td><td>Old Yang <span class="mini y9"></span></td><td>solid, <b>changing</b> into broken</td><td>1 in 8</td></tr></table>
<h3>4. Why six casts, from the bottom up?</h3>
<p>Each cast makes one line, and a hexagram has six. They are built <b>from the bottom up</b>, like a plant growing or a building rising: the first line is the foundation and beginning of the situation, the sixth line its peak or conclusion. The lower three lines (a trigram) represent the inner side of the situation, the upper three the outer side.</p>
<h3>5. Yin and yang</h3>
<p>Solid lines are <b>yang</b>: active, firm, initiating. Broken lines are <b>yin</b>: receptive, yielding, nurturing. Neither is better. Every situation is a particular mixture of the two.</p>
<h3>6. Changing lines</h3>
<p>A 6 or a 9 is an "old" line: it has reached its extreme and is about to turn into its opposite. These <b>changing lines</b> (shown in gold) are the most personal part of a reading. Each has its own specific text in the book.</p>
<h3>7. How one hexagram becomes another</h3>
<p>Flip every changing line (broken ↔ solid) and you get a second hexagram: the <b>resulting hexagram</b>, which shows where the situation may be heading. If no lines change, the reading focuses on the present situation alone.</p>
<h3>8. Understanding your reading</h3>
<p>Start with <b>Your reading in plain English</b>, which brings everything together. Then explore the details: your present situation, what is changing, where things may be heading, practical guidance, the traditional texts and a psychological perspective. When several lines change, the app follows the documented rules of the scholar Zhu Xi (12th century) to decide which texts carry the most weight, and tells you which rule it applied.</p>
<h3>9. Applying it to everyday life</h3>
<p>Take one sentence that rings true and turn it into one small action for this week. Save the reading in your Journal, and later write down what actually happened. Over time you will notice your own recurring themes. Treat the I Ching as a wise conversation partner, not as an authority. It does not replace medical, legal or financial advice.</p>`;

export const ABOUT = `
<p><b>I Ching — The Living Oracle</b>, version 0.1. A free, open-source application with no account, no advertising, no analytics and no tracking. Everything (all 64 hexagrams, 384 line texts and your journal) lives on your device and works offline.</p>
<h3>Sources and method</h3>
<ul><li>Classical texts: James Legge's translation of the <i>Yi King</i> (1882), public domain.</li>
<li>Plain-English readings, practical guidance and Jungian notes: written for this project, staying close to the meaning of the classical text.</li>
<li>Casting: three-coin method (probabilities 1/8, 3/8, 3/8, 1/8 for 6, 7, 8, 9) and a yarrow-stalk probability simulation (1/16, 5/16, 7/16, 3/16), using your device's cryptographically secure random number generator.</li>
<li>Multiple changing lines: the rules of Zhu Xi (1130–1200), explained in each reading.</li>
<li>Verification: all 4,096 possible casts were tested automatically against two independent references (see the testing report).</li></ul>
<p class="note">The I Ching is presented here as a traditional oracle and a tool for philosophical and psychological reflection. It is not a scientifically validated method of predicting the future and is not a substitute for professional advice.</p>`;
