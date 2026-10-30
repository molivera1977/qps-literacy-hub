/* =====================================================================
   QPS PRACTICE — the content for each stop (one stop per QPS level).
   Practice words are NEW words with the same skill as the level; none is
   a test word (the Assessment keeps its own lists in index.html).
   Words are split into chunks with "|"; every chunk is one of Mr. O's
   recordings. check-practice.py proves both before a push.
     real      real words: blend, build, and the Hear-it of sentences
     made      made-up words: "Which one says it?" and "Which spelling?"
     contrast  for a made-up word, which chunk can be swapped to make the
               near-miss choices (it must SOUND different, never the same)
     sort      hear-it-first sorting (word hidden until the answer)
     chains    change one part to make a new word
   ===================================================================== */
// Sound names a lesson line (/uh/, /i~uh/) or a sound note uses, and Mr. O's recording each plays.
const SOUND_NAMES = { uh: 'o-schwa', ee: 'y-ee', air: 'ar-air', ul: 'al-ul', oh: 'o-long', yoo: 'u-yoo', ree: 're-long' };
const PRACTICE_STOPS = [
  {
    id: '1', num: '1', name: 'Letter sounds', example: 'a b c',
    learn: {
      lines: ['Every letter makes a sound.', 'Tap a letter to hear its sound. Then say the sound out loud.'],
      examples: ['a', 'm', 's', 't', 'f', 'qu']
    },
    letters: ['m','s','t','a','p','i','n','d','o','g','c','h','u','r','l','f','b','e','j','k','v','w','x','y','z','qu']
  },
  {
    id: '2', num: '2', name: 'Short vowels', example: 'cat',
    learn: {
      lines: ['The vowels are {a}, {e}, {i}, {o} and {u}.', 'In a short word like cat, the vowel makes its short sound: {a} says /a/, {e} says /e/, {i} says /i/, {o} says /o/, {u} says /u/.', 'Tap each word. Listen for the vowel in the middle.'],
      examples: ['c|a|t', 'b|e|d', 'p|i|g', 'h|o|t', 's|u|n']
    },
    real: ['c|a|p','b|e|d','f|i|x','h|o|t','s|u|n','r|i|p','j|o|g','w|e|t','m|u|d','t|a|g','p|e|n','l|i|d','b|u|s','f|a|n','k|i|t','r|u|b'],
    sort: {
      // The Listen directions: [on screen, said] (Marcos 10/29: "these instructions aren't clear enough").
      // Letters are said as letter names (A, E…); keep the same number of words in both so the highlight follows.
      directions: ['The word is hidden. Tap Hear the word. Listen for the vowel sound in the middle. Then tap the vowel you hear: a, e, i, o or u.',
                   'The word is hidden. Tap Hear the word. Listen for the vowel sound in the middle. Then tap the vowel you hear: A, E, I, O or U.'],
      prompt: 'Which vowel sound do you hear?',
      bins: [{ label: 'a', key: 'a' }, { label: 'e', key: 'e' }, { label: 'i', key: 'i' }, { label: 'o', key: 'o' }, { label: 'u', key: 'u' }],
      words: [['c|a|p','a'],['f|a|n','a'],['b|e|d','e'],['w|e|t','e'],['r|i|p','i'],['k|i|t','i'],['h|o|t','o'],['j|o|g','o'],['s|u|n','u'],['m|u|d','u']]
    },
    chains: [['c|a|t','c|o|t'],['c|o|t','c|u|t'],['c|u|t','h|u|t'],['h|u|t','h|i|t'],['p|i|g','p|i|n'],['p|i|n','p|e|n'],['p|e|n','t|e|n'],['b|e|d','b|a|d'],['b|a|d','b|a|t'],['b|a|t','b|i|t']],
    made: ['p|a|g','g|o|k','v|u|p','z|a|t','m|e|p','l|o|m','f|i|d','n|e|p','r|o|g','m|e|k','j|u|d','k|a|p','l|i|g','p|i|d','v|e|p','w|e|z',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           'f|e|g','v|i|k','t|o|k','m|u|t','b|i|p','b|o|f','p|a|f','d|a|t','r|u|z','v|a|d','k|a|z','v|i|t','n|a|d','t|e|t','v|i|z','d|e|s'],
    contrast: { a: ['i','o','u'], e: ['a','u','i'], i: ['e','a','o'], o: ['u','a','i'], u: ['o','i','e'] },   // 3rd = fills in for a blocked choice
    sentences: ['The pig sat in the mud.','Ten red bugs ran up the log.','Did Dan get a hot dog?','Pam has a big tan cat.','Sam can hop and jog.','The fox hid in a box.']
  },
  {
    id: '3', num: '3', name: 'sh ch th', sayName: 'letter pairs', example: 'ship',
    learn: {
      lines: ['Some letters work in pairs. Two letters make ONE sound.', '{s} and {h} say /sh/. {c} and {h} say /ch/. {t} and {h} say /th/.', '{w} and {h} say /wh/. {c} and {k} say /ck/. {n} and {g} say /ng/.'],
      examples: ['sh|i|p', 'ch|o|p', 'th|i|n', 'wh|e|n', 'd|u|ck', 's|i|ng']
    },
    real: ['sh|i|p','ch|o|p','th|i|n','wh|e|n','d|u|ck','s|i|ng','sh|o|p','ch|i|n','m|a|th','w|i|sh','r|i|ch','b|a|ck','r|i|ng','wh|i|p','b|a|th','m|u|ch'],
    sort: {
      directions: ['The word is hidden. Tap Hear the word. Listen for the sound that two letters make. Then tap the letters that make that sound: sh, ch or th.',
                   'The word is hidden. Tap Hear the word. Listen for the sound that two letters make. Then tap the letters that make that sound: S-H, C-H or T-H.'],
      prompt: 'Which sound do you hear?',
      bins: [{ label: 'sh', key: 'sh' }, { label: 'ch', key: 'ch' }, { label: 'th', key: 'th' }],
      words: [['sh|i|p','sh'],['w|i|sh','sh'],['f|i|sh','sh'],['d|i|sh','sh'],['ch|o|p','ch'],['ch|i|n','ch'],['r|i|ch','ch'],['m|u|ch','ch'],['th|i|n','th'],['m|a|th','th'],['b|a|th','th'],['m|o|th','th']]
    },
    made: ['d|a|th','ch|o|g','th|u|p','wh|i|d','f|u|sh','z|e|th','n|i|ch','v|a|ck','j|i|ng','sh|o|m','ch|e|p','z|o|ck','wh|e|g','r|a|th','z|e|ck','d|u|sh',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           'v|i|ck','w|e|ck','ch|e|d','wh|e|m','h|i|th','g|o|ck','sh|e|z','g|a|th','d|a|ck','wh|u|t','ch|o|s','sh|e|m','ch|u|k','r|i|sh','d|i|th','wh|e|p'],
    // a filler choice must not sound like the right one for the wrong reason (m next to n: jing/jim, 10/19);
    // th's t filler too (zeth/zet, rath/rat — Marcos voted No 10/20) → ch
    contrast: { sh: ['s','ch'], ch: ['sh','t','th'], th: ['ch','sh','t'], wh: ['th','h'], ck: ['ch','sh'], ng: ['n','m'] },
    sentences: ['The ship is in the dock.','Chad and Beth sing a song.','When can I get a fish?','That duck is on the path.','Seth has a chip in his lunch.','Which shell is thick?']
  },
  {
    id: '4', num: '4', name: 'Blends', example: 'frog',
    learn: {
      lines: ['A blend is two letters side by side. You hear BOTH sounds, said fast.', 'In frog you hear /f/ and /r/ together: /f/ /r/ /o/ /g/.', 'Do not skip a sound!'],
      examples: ['f|r|o|g', 's|t|o|p', 'c|r|a|b', 'j|u|m|p', 'm|i|l|k']
    },
    real: ['s|t|o|p','c|l|a|p','c|r|a|b','p|l|u|m','s|w|i|m','f|r|o|g','d|r|u|m','g|r|i|n','s|l|i|p','t|r|i|p','b|e|s|t','h|a|n|d','j|u|m|p','m|i|l|k','t|e|n|t','f|a|s|t'],
    chains: [['l|a|p','c|l|a|p'],['t|o|p','s|t|o|p'],['r|i|p','t|r|i|p'],['l|i|p','f|l|i|p'],['n|a|p','s|n|a|p'],['w|i|n','t|w|i|n'],['t|e|n','t|e|n|t'],['b|a|n','b|a|n|d']],
    made: ['b|l|i|m','c|r|a|d','f|l|e|p','s|n|o|p','p|l|a|g','p|l|i|n','s|p|e|t','g|r|o|t','d|r|e|n','t|r|o|p','f|r|e|m','s|t|i|d','l|u|s|k','m|e|s|t','d|r|i|n','d|r|e|p',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           't|u|s|t','p|l|u|z','d|r|i|g','f|l|u|p','g|r|e|t','g|r|e|z','g|r|u|k','s|w|i|t','c|l|u|f','p|r|e|f','g|u|f|t','s|t|i|f','s|m|i|g','h|a|l|d','s|l|o|m','t|r|u|t'],
    contrast: 'drop',
    sentences: ['The frog can jump in the pond.','Brad and Glen swim fast.','Stop the sled at the tent.','A crab is in the sand.','Can Fran spin the drum?','Trish left her milk on the desk.']
  },
  {
    id: '5', num: '5', name: 'Silent e', example: 'cake',
    learn: {
      lines: ['An e at the end of a word is quiet. You do not hear it.', 'The quiet e makes the vowel say its name: {a} says A, {i} says I, {o} says O.', 'cap has no e, so the {a} says /a/. Add e and it turns into cape.'],
      examples: ['m|a|t>m|ate', 'p|i|n>p|ine', 'n|o|t>n|ote']
    },
    real: ['g|ate','l|ate','s|k|ate','p|l|ate','sh|ade','g|r|ade','l|ane','c|r|ane','n|ice','m|ice','r|ice','n|ine','sh|ine','m|ile','s|m|ile','h|ole','p|ole','v|ote','d|une','t|une','f|r|oze'],
    sort: {
      directions: ['The word is hidden. Tap Hear the word. Listen to the vowel. Is the vowel short, like in cap? Or long, like in cape? Then tap Short or Long.'],
      prompt: 'Is the vowel short or long?',
      bins: [{ label: 'Short — like cap', key: 'short' }, { label: 'Long — like cape', key: 'long' }],
      words: [['m|a|t','short'],['m|ate','long'],['p|i|n','short'],['p|ine','long'],['c|a|n','short'],['c|ane','long'],['n|o|t','short'],['n|ote','long'],['h|a|t','short'],['h|ate','long'],['f|i|n','short'],['f|ine','long']]
    },
    chains: [['m|a|t','m|ate'],['h|a|t','h|ate'],['r|a|t','r|ate'],['m|a|d','m|ade'],['c|a|n','c|ane'],['p|l|a|n','p|l|ane'],['f|i|n','f|ine'],['p|i|n','p|ine'],['s|p|i|n','s|p|ine'],['sh|i|n','sh|ine'],['t|w|i|n','t|w|ine'],['n|o|t','n|ote']],   // 10/26: shin is Mr. O's recording (a device voice said "sheen")
    made: ['z|ade','t|ade','h|ane','j|ine','z|ile','b|ice','f|ole','l|oze','z|ote','b|une','p|l|ote','g|r|ine','c|l|ade','ch|ice','sh|ile','th|une',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           'z|ine','b|r|ate','b|r|ade','h|ote','h|ile','f|r|ade','p|une','b|l|ane','p|l|ine','b|l|ice','f|l|ate','k|ade','b|l|ote','b|r|ile','k|oze','g|r|ote'],
    contrast: { ate: ['a|t','ote'], ade: ['a|d','ine'], ane: ['a|n','ine'], ine: ['i|n','ane','ile'], ile: ['i|l','ine'], ice: ['i|c','ine'], ole: ['o|l','ile','ate'], oze: ['o|z','ote'], ote: ['o|t','ate'], une: ['u|n','ine'] },
    sentences: ['The cat ate a bite of cake.','Five mice hid in a hole.','Dave made a kite with a pole.','Nine kids rode their bikes home.','Kate will use tape on the note.','The dog ran to the gate at the end of the lane.','Can Rose hide the cube in the box?','Mike has a plane and a white kite.']
  },
  {
    id: '6', num: '6', name: 'Bossy R', example: 'car',
    learn: {
      lines: ['When {r} comes right after a vowel, the {r} is the boss.', 'The vowel and the {r} make a new sound together.', '{ar} says /ar/, like car. {or} says /or/, like for. {er}, {ir} and {ur} all say /er/, like her, bird and turn.'],
      examples: ['c|ar', 'f|or|k', 'h|er', 'b|ir|d', 't|ur|n']
    },
    real: ['c|ar','f|ar|m','s|t|ar','t|er|m','f|er|n','b|ir|d','g|ir|l','sh|ir|t','c|or|n','c|or|d','s|t|or|m','t|ur|n','h|ur|t','b|ur|n','p|ar|k','s|p|or|t'],
    sort: {
      directions: ['The word is hidden. Tap Hear the word. Listen for the Bossy R sound. Then tap the sound you hear: ar like car, or like for, or er like her.',
                   'The word is hidden. Tap Hear the word. Listen for the Bossy R sound. Then tap the sound you hear: A-R like car, O-R like for, or E-R like her.'],
      prompt: 'Which sound do you hear?',
      bins: [{ label: 'ar — like car', key: 'ar' }, { label: 'or — like for', key: 'or' }, { label: 'er ir ur — like her', key: 'er' }],
      words: [['f|ar|m','ar'],['s|t|ar','ar'],['p|ar|k','ar'],['d|ar|k','ar'],['c|or|n','or'],['s|t|or|m','or'],['s|p|or|t','or'],['h|or|n','or'],['f|er|n','er'],['b|ir|d','er'],['g|ir|l','er'],['t|ur|n','er']]
    },
    made: ['t|ar|k','b|er|p','n|ir|k','l|or|p','k|or|m','s|ar|n','z|ar|t','d|er|t','m|ur|z','n|ur|t','j|ar|p','p|er|n','p|ar|n','h|or|t','d|ar|d','g|ar|f',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           'm|ar|d','v|ir|k','t|ir|t','h|ur|k','h|er|f','b|or|k','k|ar|f','r|ir|f','g|ur|g','p|ur|g','p|ar|g','p|ur|f','k|er|d','k|or|s','r|ar|p','d|ur|d'],
    contrast: { ar: ['a','or','ur'], or: ['o','ar','er'], er: ['e','ar','or'], ir: ['i','or','o'], ur: ['u','ar'] },   // 3rd = fills in for a blocked choice
    sentences: ['The bird sat on the fork.','Mark has a dark red car.','The girl will turn the corn.','Her shirt got torn in the storm.','Burt hurt his arm.','We can play in the park.']
  },
  {
    id: '7', num: '7', name: 'Tricky letters', example: 'knot',
    learn: {
      lines: ['Some letter groups play tricks.', '{tch} says /tch/, like catch. {dge} says /dge/, like badge. {qu} says /qu/, like quit. {x} says /x/, like fox.', 'Some letters are silent. In {kn} the {k} is quiet, so {kn} says /kn/, like knot. In {wr} the {w} is quiet, so {wr} says /wr/, like wrap. In {gn} the {g} is quiet, so {gn} says /gn/, like gnat.'],
      examples: ['c|a|tch', 'b|a|dge', 'kn|o|t', 'wr|a|p', 'gn|a|t', 'qu|i|t', 'f|o|x']
    },
    real: ['c|a|tch','m|a|tch','d|i|tch','b|a|dge','f|u|dge','b|r|i|dge','kn|o|t','kn|i|t','wr|a|p','wr|i|s|t','qu|i|t','qu|a|ck','f|o|x','s|i|x','qu|i|z','gn|a|t'],
    made: ['z|a|tch','r|i|tch','f|o|dge','l|i|dge','kn|o|p','kn|u|g','kn|o|d','wr|i|d','wr|e|m','k|i|dge','gn|e|t','gn|o|p','qu|e|m','qu|o|t','j|e|x','v|i|x',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           'l|e|x','h|i|dge','kn|i|k','wr|o|g','gn|a|k','qu|i|f','g|i|tch','g|i|x','h|o|dge','kn|u|f','wr|e|f','gn|a|d','qu|u|n','l|o|tch','m|o|x','kn|e|p'],
    // fillers that sounded like the right one or each other (kneb/meb, gnet/met, jes/jez — Marcos 10/19) → p and t;
    // dge's ch filler too (fodge/foch, lidge/lich — voted No 10/20) → t
    contrast: { tch: ['t','sh'], dge: ['g','t'], kn: ['k','p'], wr: ['w','l'], gn: ['g','p'], qu: ['k','w'], x: ['s','t'] },
    sentences: ['The quick fox ran to the ditch.','Kate will wrap a gift for Madge.','I can knit a hat.','Six ducks sat on the bridge.','Do not let the cat catch the fish.']   // 10/28: "The fudge is on the top shelf." off — a device voice says "fah-dge" and a sentence is read by the voice (the word fudge is Mr. O's recording)
  },
  {
    id: '8', num: '8', name: 'Vowel teams', example: 'boat',
    learn: {
      lines: ['In a vowel team, two letters work together to make ONE vowel sound.', '{ai} and {ay} say /ai/, like rain and day. {oa} and {oe} say /oa/, like boat and toe. {ea} says /ea/, like seat. {igh} says /igh/, like night.', '{oo} says /oo/, like moon. {ew} says /ew/, like new. {ou} says /ou/, like out. {oi} and {oy} say /oi/, like coin and toy. {au} and {aw} say /au/, like haul and saw.'],
      examples: ['r|ai|n', 'd|ay', 'b|oa|t', 's|ea|t', 'n|igh|t', 'm|oo|n', 'ou|t', 'c|oi|n', 's|aw']
    },
    real: ['r|ai|n','t|ai|l','p|l|ay','d|ay','s|ea|t','t|ea|m','b|oa|t','s|oa|p','m|oo|n','f|oo|d','ou|t','l|ou|d','c|oi|n','b|oi|l','t|oy','h|au|l','s|aw','l|aw|n','p|aw','n|ew','n|igh|t','l|igh|t'],
    sort: {
      directions: ['Read the word. Is the word a real word or a made-up word? Tap Hear the word to check your reading. Then tap Real word or Made-up word.'],
      prompt: 'Is it a real word or a made-up word?', seeWord: true,
      bins: [{ label: 'Real word', key: 'real' }, { label: 'Made-up word', key: 'made' }],
      words: [['r|ai|n','real'],['z|ai|t','made'],['s|ea|t','real'],['d|ea|p','made'],['b|oa|t','real'],['k|oa|m','made'],['m|oo|n','real'],['z|oo|t','made'],['c|oi|n','real'],['d|oi|l','made'],['n|ew','real'],['t|r|ew','made']]
    },
    made: ['z|ai|t','v|ay','d|ea|p','k|oa|m','z|oo|t','m|ou|t','d|oi|l','z|oy','t|oo|z','z|aw','b|oe','t|r|ew','m|igh','sh|oa|m','g|ea|t','n|ol|t',
           // added 10/20 (two passes + new words each Check; site-tests/tools/qps-new-words.js, then by eye)
           'd|ai|k','v|ai|t','g|ea|f','z|ea|k','k|oi|t','l|ol|t','k|oi|p','z|ay','p|oi|p','h|ai|p','j|oo|f','h|oi|g','f|oi|t','v|ol|z','h|ai|d','f|ea|m'],
    contrast: { ai: ['a','oa'], ay: ['oy','aw'], ea: ['e','oa','ai'], oa: ['o','ea'], oo: ['o','ou'], ou: ['o','oo','oi'], oi: ['o','ai','oa'], oy: ['ay','aw'], au: ['a','ou','oi'], aw: ['ay','ew'], oe: ['ew','oy'], ew: ['e','aw','oy'], igh: ['ay','aw'], ol: ['o','oo'] },
    sentences: ['The boat sails in the rain.','Roy has a toy coin.','Dad saw the moon at night.','Pay for the soap and the food.','Paul saw a hawk in the light.','We can eat at noon.']
  },
  {
    id: '9a', num: '9a', name: 'Two-part words', example: 'mas·ter',
    // Learn, one idea per screen (Marcos 10/30, "accept all"). label is for Mr. O only: never shown or read.
    // recap: only for a student whose starting stop (login.js TRACKS) is this one.
    learn: { screens: [
      { label: 'What a syllable is',
        lines: ['Big words are made of parts. Each part is called a syllable. Each syllable has one vowel sound.', 'Say each part. Then say the real word. The real word can sound a little different from the parts: /mo/ + /tor/ = motor.'],
        examples: ['mo|tor', 'mas|ter'] },
      { label: 'Vowels and consonants',
        lines: ['The vowels are {a}, {e}, {i}, {o} and {u}. The letter {y} at the end of a word is a vowel, too. All the other letters are consonants.', 'To chop a word, look at the consonants between two vowels.'],
        examples: ['mas|ter', 'un|der'] },
      { label: 'Two consonants',
        lines: ['Two consonants between two vowels? Chop between the two consonants.', 'When the first part ends with a consonant, the vowel in the first part is short: /com/ + /ment/ = comment.'],
        examples: ['com|ment', 'sun|set', 'un|der'] },
      { label: 'Three consonants',
        lines: ['Three consonants between two vowels? Find two consonants that can start a word, like {dr} in drop.', 'Chop right before the {dr}: /hun/ + /dred/ = hundred.'],
        examples: ['hun|dred', 'chil|dren', 'sub|tract'] },
      { label: 'One consonant: try the name first',
        lines: ['One consonant between two vowels? First, chop right after the first vowel.', 'Then the vowel says the name of the letter: /pa/ + /per/ = paper.'],
        examples: ['pa|per', 'to|tal', 'so|lar'] },
      { label: 'One consonant: then try short',
        lines: ['Do the parts make a real word? No? Then chop right after the consonant. Now the vowel is short.', 'Not a real word: /ca/ + /bin/. A real word: /cab/ + /in/ = cabin.'],
        examples: ['cab|in', 'sev|en', 'riv|er'] },
      { label: 'Consonant + le',
        lines: ['Does the word end with a consonant and the letters {le}? Keep the consonant and the {le} together.', 'Chop right before the consonant and the {le}: /lit/ + /tle/ = little.'],
        examples: ['lit|tle', 'ca|ble', 'tur|tle'] },
      { label: 'Teams stay together',
        lines: ['Never chop a team. A team is two letters that make one sound, like {ck}, {sh}, {ch} and {th}. A team counts as one consonant.', 'The {ck} stays together: /tick/ + /et/ = ticket.'],
        examples: ['tick|et', 'dish|es'] },
      { label: 'Vowel teams',
        lines: ['Vowel teams stay together, too. In vowel teams like {ow} and {oy}, the {w} and the {y} are part of the team.', '{ow} can say /ou/: /cow/ + /boy/ = cowboy.'],
        examples: ['cow|boy', 'down|town', 'en|joy', 'pea|nut'] },
      { label: 'Bossy r stays with its vowel',
        lines: ['A bossy {r} stays with the vowel before the {r}: /par/ + /ty/ = party.', 'The letter {y} at the end of party says /ee/.'],
        examples: ['par|ty', 'mar|ket', 'gar|den'] },
      { label: 'Quiet e',
        lines: ['A quiet {e} at the end of a part makes the vowel in that part say the name of the letter: /in/ + /side/ = inside.'],
        examples: ['in|side', 'mis|take', 'com|plete'] }
    ] },
    big: true,
    real: ['com|ment','mas|ter','lit|ter','un|der','hun|dred','chil|dren','sub|tract','mo|tor','so|lar',
           'to|tal','pu|pil','pa|per','cab|in','sev|en','riv|er','rob|in','wag|on','ca|ble',
           'no|ble','lit|tle','ti|tle','tick|et','cow|boy','down|town','en|joy','con|tain','par|ty',
           'mar|ket','gar|den','in|side','in|vite','mis|take','com|plete','sun|set','tur|tle','pea|nut'],
    // a part that says something other than its letters: the tile shows the letters, this recording plays
    sounds: {'pea|nut': {'pea': 'pe'}},
    // Chop also takes this chop: it sounds right too (Marcos 10/30)
    chop2: {'tick|et': 'ti|cket'}
  },
  {
    id: '9b', num: '9b', name: 'Three-part words', example: 'an·i·mal',
    // Learn, one idea per screen (Marcos 10/30, "accept all"). label is for Mr. O only: never shown or read.
    // recap: only for a student whose starting stop (login.js TRACKS) is this one.
    learn: { screens: [
      { label: 'vowels and consonants', recap: true,
        lines: ['Say each part. Then say the real word. The real word can sound a little different from the parts.', 'The vowels are {a}, {e}, {i}, {o} and {u}. The letter {y} at the end of a word is a vowel, too. Consonants are the letters that are not vowels.'],
        examples: ['mas|ter', 'par|ty'] },
      { label: 'two and three consonants', recap: true,
        lines: ['Two consonants between two vowels? Chop between the two consonants: /mas/ + /ter/ = master.', 'Three consonants? Find two consonants that can start a word, like {dr}. Chop right before the {dr}: /hun/ + /dred/ = hundred.'],
        examples: ['mas|ter', 'hun|dred'] },
      { label: 'teams and bossy r', recap: true,
        lines: ['Never chop a team. A team is two letters that make one sound, like {ck} and {oy}.', 'A bossy {r} stays with the vowel before the {r}: /par/ + /ty/ = party.'],
        examples: ['tick|et', 'par|ty'] },
      { label: 'Three parts',
        lines: ['Chop three-part words the same way. Say each part. Then say the real word: /un/ + /der/ + /stand/ = understand.'],
        examples: ['un|der|stand', 'com|pu|ter', 'en|joy|ment'] },
      { label: 'Three consonants in a three-part word',
        lines: ['Three consonants between two vowels? Find two consonants that can start a word, like {tr}. Chop right before the {tr}: /sub/ + /trac/ + /tion/ = subtraction.'],
        examples: ['sub|trac|tion', 'hun|dred'] },
      { label: 'One consonant: the order',
        lines: ['One consonant between two vowels? First, chop right after the first vowel, and say the name of the letter.', 'Do the parts make a real word? No? Then make the vowel say /uh/. Still no? Then chop right after the consonant.'],
        examples: ['pa|per', 'e|lev|en', 'cab|in'] },
      { label: 'A vowel by itself says uh',
        lines: ['Sometimes one vowel is a part by itself. That vowel often says /uh/.', '/an/ + /i~uh/ + /mal/ = animal.'],
        examples: ['an|i|mal', 'cap|i|tal', 'cav|i|ty'] },
      { label: 'A first part can say uh',
        lines: ['A first part that ends with a vowel can also say /uh/.', '/po/ + /ta/ + /to/ = potato.'],
        examples: ['po|ta|to', 'a|part|ment', 'e|lev|en'] },
      { label: 'tion',
        lines: ['The letters {tion} make one part: /tion/. Never chop inside that part.', 'The letter {a} right before /tion/ says the name of the letter: /va/ + /ca/ + /tion/ = vacation.'],
        examples: ['va|ca|tion', 'lo|ca|tion', 'con|nec|tion'] },
      { label: 'y and cy at the end',
        lines: ['The letter {y} at the end of a word says /ee/.', '/fam/ + /i~uh/ + /ly/ = family.', 'The letters {cy} at the end say /cy/.', '/pol/ + /i~uh/ + /cy/ = policy.'],
        examples: ['fam|i|ly', 'pen|al|ty', 'pol|i|cy'] },
      { label: 'ic at the end',
        lines: ['The letters {ic} at the end say /ic/.', '/ter/ + /rif/ + /ic/ = terrific.'],
        examples: ['ter|rif|ic', 'mag|net|ic'] },
      { label: 'cal at the end',
        lines: ['The letters {cal} at the end say /cal/.', '/trop/ + /i~uh/ + /cal/ = tropical.'],
        examples: ['trop|i|cal', 'med|i|cal'] },
      { label: 'ate at the end',
        lines: ['The letters {ate} at the end say /ate/.', '/nav/ + /i~uh/ + /gate/ = navigate.'],
        examples: ['nav|i|gate', 'sep|a|rate', 'es|ti|mate'] },
      { label: 'When c says /s/ and g says /j/',
        lines: ['Before the letters {e} and {i}, the letter {c} says /s/.', '/cin/ + /na/ + /mon/ = cinnamon.', 'Before the letters {e} and {i}, the letter {g} often says /j/.', '/gi/ + /gan/ + /tic/ = gigantic.'],
        examples: ['cin|na|mon', 'ex|cel|lent', 'gi|gan|tic'] },
      { label: 'Two vowels side by side',
        lines: ['Two vowels side by side that are not a team? Chop between the two vowels.', 'The letter {i} before another vowel often says /ee/.', '/ra/ + /di~de/ + /o~oh/ = radio.', 'The letter {e} before another vowel can say /ee/, too: rodeo.'],
        examples: ['ra|di|o', 'stu|di|o', 'ro|de|o'] },
      { label: 'An r between two vowels',
        lines: ['The letter {r} between two vowels is like one consonant. First, chop right after the first vowel. The vowel says the name of the letter: /pi/ + /rate/ = pirate.', 'Do the parts make a real word? No? Then keep the bossy {r} with the vowel: /for/ + /est/ = forest.'],
        examples: ['pi|rate', 'for|est', 'pe|ri|od', 'ze|ro'] }
    ] },
    big: true,
    real: ['com|pu|ter','en|joy|ment','an|i|mal','cap|i|tal','cav|i|ty','a|part|ment','e|lev|en','pre|ven|tion','va|ca|tion',
           'lo|ca|tion','pen|al|ty','pol|i|cy','ter|rif|ic','nav|i|gate','es|ti|mate','cin|na|mon','gi|gan|tic','ra|di|o',
           'stu|di|o','ro|de|o','pe|ri|od','un|der|stand','con|nec|tion','sub|trac|tion','po|ta|to','fam|i|ly','mag|net|ic',
           'trop|i|cal','sep|a|rate','ex|cel|lent','med|i|cal'],
    // a part that says something other than its letters: the tile shows the letters, this recording plays
    sounds: {'an|i|mal': {'i': 'uh'}, 'a|part|ment': {'a': 'uh'}, 'cap|i|tal': {'i': 'uh'}, 'cav|i|ty': {'i': 'uh'}, 'e|lev|en': {'e': 'uh'}, 'fam|i|ly': {'i': 'uh'}, 'med|i|cal': {'i': 'uh'}, 'nav|i|gate': {'i': 'uh'}, 'pen|al|ty': {'al': 'ul'}, 'pol|i|cy': {'i': 'uh'}, 'ra|di|o': {'o': 'oh', 'di': 'de'}, 'ro|de|o': {'o': 'oh'}, 'sep|a|rate': {'a': 'uh'}, 'stu|di|o': {'o': 'oh', 'di': 'de'}, 'trop|i|cal': {'i': 'uh'}},
    // Chop also takes this chop: it sounds right too (Marcos 10/30)
    chop2: {'an|i|mal': 'an|im|al', 'cap|i|tal': 'cap|it|al', 'cav|i|ty': 'cav|it|y', 'fam|i|ly': 'fam|il|y', 'pol|i|cy': 'pol|ic|y', 'trop|i|cal': 'trop|ic|al', 'med|i|cal': 'med|ic|al', 'nav|i|gate': 'nav|ig|ate', 'sep|a|rate': 'sep|ar|ate', 'es|ti|mate': 'es|tim|ate', 'cin|na|mon': 'cin|nam|on', 'pe|ri|od': 'per|i|od'}
  },
  {
    id: '9c', num: '9c', name: 'Four-part words', example: 'in·fin·i·ty',
    // Learn, one idea per screen (Marcos 10/30, "accept all"). label is for Mr. O only: never shown or read.
    // recap: only for a student whose starting stop (login.js TRACKS) is this one.
    learn: { screens: [
      { label: 'say the real word', recap: true,
        lines: ['Say each part. Then say the real word. The real word can sound a little different from the parts.', 'Some parts come in many big words: /pre/, /dis/, /tion/ and /ment/. Look for those parts first.'],
        examples: ['pre|dic|tion', 'dis|ap|point|ment'] },
      { label: 'consonants and teams', recap: true,
        lines: ['The vowels are {a}, {e}, {i}, {o} and {u}. The letter {y} at the end of a word is a vowel, too. All the other letters are consonants.', 'Two consonants between two vowels? Chop between the two consonants: /un/ + /der/ + /stand/ = understand.'],
        examples: ['un|der|stand', 'in|de|pen|dent'] },
      { label: 'teams and bossy r', recap: true,
        lines: ['Never chop a team. A team is two letters that make one sound, like {ck} and {oy}.', 'A bossy {r} stays with the vowel before the {r}: /par/ + /ty/ = party.'],
        examples: ['tick|et', 'par|ty'] },
      { label: 'one consonant', recap: true,
        lines: ['One consonant between two vowels? First, chop right after the first vowel, and say the name of the letter: /su/ + /per/ + /mar/ + /ket/ = supermarket.', 'Do the parts make a real word? No? Then make the vowel say /uh/. Still no? Then chop right after the consonant.'],
        examples: ['su|per|mar|ket', 'a|bil|i|ty', 'cal|cu|la|tor'] },
      { label: 'or at the end', recap: true,
        lines: ['The letters {or} at the end of a word often say /er/.', '/com/ + /pet/ + /i~uh/ + /tor~ter/ = competitor.'],
        examples: ['com|pet|i|tor', 'cal|cu|la|tor'] },
      { label: 'an r between two vowels', recap: true,
        lines: ['The letter {r} between two vowels is like one consonant: /pe/ + /ri/ + /od/ = period.'],
        examples: ['pe|ri|od', 'ze|ro'] },
      { label: 'c, g and cy', recap: true,
        lines: ['Before the letters {e} and {i}, the letter {c} says /s/, and the letter {g} often says /j/.', '/cin/ + /na/ + /mon/ = cinnamon. /in/ + /tel/ + /li/ + /gent/ = intelligent.', 'The letters {cy} at the end say /cy/.', '/pol/ + /i~uh/ + /cy/ = policy.'],
        examples: ['cin|na|mon', 'in|tel|li|gent', 'pol|i|cy'] },
      { label: 'ity at the end',
        lines: ['The letters {ity} at the end make two parts: /ac/ + /tiv/ + /i~uh/ + /ty/ = activity.', 'The letter {y} at the end of a word says /ee/.'],
        examples: ['ac|tiv|i|ty', 'in|fin|i|ty', 'a|bil|i|ty'] },
      { label: 'tion',
        lines: ['The letters {tion} make one part: /tion/. Never chop inside that part.', 'The letter {a} right before /tion/ says the name of the letter: /in/ + /for/ + /ma/ + /tion/ = information.'],
        examples: ['in|for|ma|tion', 'con|ver|sa|tion', 're|la|tion|ship'] },
      { label: 'ate at the end',
        lines: ['The letters {ate} at the end say /ate/.', '/in/ + /ves/ + /ti/ + /gate/ = investigate.'],
        examples: ['in|ves|ti|gate', 'nav|i|gate'] },
      { label: 'ic at the end',
        lines: ['The letters {ic} at the end say /ic/.', '/au/ + /to/ + /mat/ + /ic/ = automatic.'],
        examples: ['au|to|mat|ic', 'ac|ro|bat|ic'] },
      { label: 'ior at the end',
        lines: ['The letter {i} before another vowel often says /ee/. The letters {or} at the end often say /er/.', '/ju/ + /ni/ + /or~er/ = junior.'],
        examples: ['ju|ni|or', 'se|ni|or'] },
      { label: 'ular at the end',
        lines: ['The letters {ular} at the end are two parts: /un/ + /pop/ + /u~yoo/ + /lar/ = unpopular.'],
        examples: ['un|pop|u|lar', 'ir|reg|u|lar'] },
      { label: 'ary at the end',
        lines: ['The letters {ary} at the end are two parts: /dic/ + /tion/ + /ar~air/ + /y~ee/ = dictionary.'],
        examples: ['dic|tion|ar|y', 'Jan|u|ar|y'] }
    ] },
    big: true,
    real: ['com|pet|i|tor','cal|cu|la|tor','in|de|pen|dent','su|per|mar|ket','dis|ap|point|ment','in|tel|li|gent','in|fin|i|ty','ac|tiv|i|ty','a|bil|i|ty',
           'in|for|ma|tion','con|ver|sa|tion','re|la|tion|ship','in|ves|ti|gate','au|to|mat|ic','ac|ro|bat|ic','dic|tion|ar|y','Jan|u|ar|y','un|pop|u|lar',
           'ir|reg|u|lar'],
    // a part that says something other than its letters: the tile shows the letters, this recording plays
    sounds: {'Jan|u|ar|y': {'u': 'yoo', 'ar': 'air', 'y': 'ee'}, 'ac|tiv|i|ty': {'i': 'uh'}, 'a|bil|i|ty': {'a': 'uh', 'i': 'uh'}, 'cal|cu|la|tor': {'tor': 'ter'}, 'com|pet|i|tor': {'i': 'uh', 'tor': 'ter'}, 'dic|tion|ar|y': {'ar': 'air', 'y': 'ee'}, 'in|fin|i|ty': {'i': 'uh'}, 'ju|ni|or': {'or': 'er'}, 'nav|i|gate': {'i': 'uh'}, 'pol|i|cy': {'i': 'uh'}, 're|la|tion|ship': {'re': 'ree'}, 'se|ni|or': {'or': 'er'}, 'un|pop|u|lar': {'u': 'yoo'}, 'ir|reg|u|lar': {'u': 'yoo'}},
    // Chop also takes this chop: it sounds right too (Marcos 10/30)
    chop2: {'ac|tiv|i|ty': 'act|iv|i|ty', 'in|tel|li|gent': 'in|tell|i|gent', 'ac|ro|bat|ic': 'a|cro|bat|ic', 'in|for|ma|tion': 'in|form|a|tion', 'com|pet|i|tor': 'com|pet|it|or', 'in|fin|i|ty': 'in|fin|it|y', 'a|bil|i|ty': 'a|bil|it|y', 'in|ves|ti|gate': 'in|ves|tig|ate', 'cal|cu|la|tor': 'cal|cul|a|tor', 'un|pop|u|lar': 'un|pop|ul|ar', 'ir|reg|u|lar': 'ir|reg|ul|ar'}
  },
  {
    id: '10', num: '10', name: 'Word parts', example: 'un·lock',
    // Learn, one idea per screen (Marcos 10/30, "accept all"). label is for Mr. O only: never shown or read.
    // recap: only for a student whose starting stop (login.js TRACKS) is this one.
    learn: { screens: [
      { label: 'Prefix and suffix',
        lines: ['A prefix is a part at the start of a word, like /un/ in unkind.', 'A suffix is a part at the end of a word, like /ful/ in helpful.'],
        examples: ['un|kind', 'help|ful'] },
      { label: 'One chop: after the prefix',
        lines: ['On this stop, you make one chop. The chop goes right after the prefix: /un/ + kind = unkind.', 'Kind is the base word. The base word is a word by itself.'],
        examples: ['un|kind', 're|tell'] },
      { label: 'One chop: before the suffix',
        lines: ['On a word with a suffix, the one chop goes right before the suffix: help + /ful/ = helpful. Help is the base word.'],
        examples: ['help|ful', 'end|less'] },
      { label: 'un and re',
        lines: ['/un/ means not. Unkind means not kind.', '/re/ means again. Retell means tell again.'],
        examples: ['un|kind', 'un|safe', 're|tell', 're|fill'] },
      { label: 'pre and dis',
        lines: ['/pre/ means before. Preschool is the school before kindergarten.', '/dis/ means not. Dislike means to not like.'],
        examples: ['pre|school', 'pre|heat', 'dis|like', 'dis|trust'] },
      { label: 'non and in',
        lines: ['/non/ means not. Nonfiction is not fiction.', '/in/ can mean not, too. Incorrect means not correct.'],
        examples: ['non|fiction', 'non|fat', 'in|correct', 'in|complete'] },
      { label: 'con',
        lines: ['/con/ is a prefix, too. The chop goes right after the prefix: /con/ + test = contest.'],
        examples: ['con|test', 'con|text'] },
      { label: 'ful and less',
        lines: ['/ful/ means full of. Helpful means full of help.', '/less/ means without. Endless means without an end.'],
        examples: ['help|ful', 'care|ful', 'end|less', 'pain|less'] },
      { label: 'ness',
        lines: ['/ness/ means being. Sadness means being sad. Kindness means being kind.'],
        examples: ['sad|ness', 'kind|ness', 'dark|ness'] },
      { label: 'est',
        lines: ['/est/ means the most. Softest means softer than all the others. Coldest means colder than all the others.'],
        examples: ['soft|est', 'cold|est', 'quick|est'] },
      { label: 'able',
        lines: ['/able/ means can be. A washable shirt can be washed. A breakable glass can be broken.'],
        examples: ['wash|able', 'break|able', 'bend|able'] },
      { label: 'ment',
        lines: ['/ment/ turns a word into a thing. A payment is money you pay. A movement is the way you move.'],
        examples: ['pay|ment', 'move|ment', 'ship|ment'] },
      { label: 'ous',
        lines: ['/ous/ means full of. Poisonous means full of poison.'],
        examples: ['poison|ous', 'danger|ous', 'marvel|ous'] },
      { label: 'ary',
        lines: ['/ary/ is a suffix, too. On this stop, /ary/ is one part: legend + /ary/ = legendary.'],
        examples: ['legend|ary', 'second|ary', 'planet|ary'] }
    ] },
    big: true, parts: true,
    real: ['un|kind','un|safe','un|lock','un|pack','re|tell','re|fill','re|build','pre|heat','pre|game',
           'pre|school','dis|trust','dis|like','dis|agree','non|fat','non|fiction','in|correct','in|active','in|complete',
           'con|test','con|text','thank|ful','help|ful','care|ful','hope|ful','end|less','pain|less','help|less',
           'sad|ness','dark|ness','kind|ness','soft|est','cold|est','quick|est','bend|able','wash|able','break|able',
           'pay|ment','ship|ment','move|ment','poison|ous','marvel|ous','danger|ous','second|ary','legend|ary','planet|ary',
           'non|living'],
    split: {'active': 'a|c|t|i|v|e', 'agree': 'a|g|r|e|e', 'bend': 'b|e|n|d', 'break': 'b|r|ea|k', 'build': 'b|u|i|l|d', 'care': 'c|ar|e', 'cold': 'c|o|l|d', 'complete': 'c|o|m|p|l|e|t|e', 'correct': 'c|or|r|e|c|t', 'danger': 'd|a|ng|er', 'dark': 'd|ar|k', 'end': 'e|n|d', 'fat': 'f|a|t', 'fiction': 'f|i|c|t|i|o|n', 'fill': 'f|i|ll', 'game': 'g|a|m|e', 'heat': 'h|ea|t', 'help': 'h|e|l|p', 'hope': 'h|o|p|e', 'kind': 'k|i|n|d', 'legend': 'l|e|g|e|n|d', 'like': 'l|i|k|e', 'living': 'l|i|v|i|ng', 'lock': 'l|o|ck', 'marvel': 'm|ar|v|e|l', 'move': 'm|o|v|e', 'pack': 'p|a|ck', 'pain': 'p|ai|n', 'pay': 'p|ay', 'planet': 'p|l|a|n|e|t', 'poison': 'p|oi|s|o|n', 'quick': 'qu|i|ck', 'sad': 's|a|d', 'safe': 's|a|f|e', 'school': 's|ch|oo|l', 'second': 's|e|c|o|n|d', 'ship': 'sh|i|p', 'soft': 's|o|f|t', 'tell': 't|e|ll', 'test': 't|e|s|t', 'text': 't|e|x|t', 'thank': 'th|a|n|k', 'trust': 't|r|u|s|t', 'wash': 'w|a|sh'}
  }
];
// A stop with Learn screens also gets learn.lines and learn.examples (every screen's), for the tools and tests that read those.
PRACTICE_STOPS.forEach(st => {
  if (!st.learn.screens) return;
  st.learn.lines = st.learn.screens.flatMap(sc => sc.lines);
  st.learn.examples = [...new Set(st.learn.screens.flatMap(sc => sc.examples))];
});
