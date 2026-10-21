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
      prompt: 'Is the vowel short or long?',
      bins: [{ label: 'Short — like cap', key: 'short' }, { label: 'Long — like cape', key: 'long' }],
      words: [['m|a|t','short'],['m|ate','long'],['p|i|n','short'],['p|ine','long'],['c|a|n','short'],['c|ane','long'],['n|o|t','short'],['n|ote','long'],['h|a|t','short'],['h|ate','long'],['f|i|n','short'],['f|ine','long']]
    },
    chains: [['m|a|t','m|ate'],['h|a|t','h|ate'],['r|a|t','r|ate'],['m|a|d','m|ade'],['c|a|n','c|ane'],['p|l|a|n','p|l|ane'],['f|i|n','f|ine'],['p|i|n','p|ine'],['s|p|i|n','s|p|ine'],['sh|i|n','sh|ine'],['t|w|i|n','t|w|ine'],['n|o|t','n|ote']],
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
    sentences: ['The quick fox ran to the ditch.','Kate will wrap a gift for Madge.','I can knit a hat.','Six ducks sat on the bridge.','Do not let the cat catch the fish.','The fudge is on the top shelf.']
  },
  {
    id: '8', num: '8', name: 'Vowel teams', example: 'boat',
    learn: {
      lines: ['In a vowel team, two letters work together to make ONE vowel sound.', '{ai} and {ay} say /ai/, like rain and day. {oa} and {oe} say /oa/, like boat and toe. {ea} says /ea/, like seat. {igh} says /igh/, like night.', '{oo} says /oo/, like moon. {ew} says /ew/, like new. {ou} says /ou/, like out. {oi} and {oy} say /oi/, like coin and toy. {au} and {aw} say /au/, like haul and saw.'],
      examples: ['r|ai|n', 'd|ay', 'b|oa|t', 's|ea|t', 'n|igh|t', 'm|oo|n', 'ou|t', 'c|oi|n', 's|aw']
    },
    real: ['r|ai|n','t|ai|l','p|l|ay','d|ay','s|ea|t','t|ea|m','b|oa|t','s|oa|p','m|oo|n','f|oo|d','ou|t','l|ou|d','c|oi|n','b|oi|l','t|oy','h|au|l','s|aw','l|aw|n','p|aw','n|ew','n|igh|t','l|igh|t'],
    sort: {
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
    id: '9a', num: '9a', name: 'Two-part words', example: 'en·joy',
    learn: {
      lines: ['Big words are made of parts called syllables. Each part has one vowel sound.', 'Read one part at a time. Then put the parts together.', '/con/ + /tent/ = content.'],
      examples: ['con|tent', 'en|joy', 'mo|tor']
    },
    big: true,
    real: ['con|tent','com|pare','en|joy','hon|est','mo|tor','par|ade','play|er','fear|less','dis|play','en|ter','mas|ter','sol|ar','pe|tal','com|ment','con|tain','fast|er','joy|ful','play|ful',
           // added 10/20 for two passes and new words each Check
           'un|der','lit|ter','tic|ket','par|ty','mo|lar','count|er']
  },
  {
    id: '9b', num: '9b', name: 'Three-part words', example: 'com·pu·ter',
    learn: {
      lines: ['These big words have three parts. Each part has one vowel sound.', 'Read one part at a time. Then put the parts together.', '/com/ + /pu/ + /ter/ = computer.'],
      examples: ['com|pu|ter', 'in|ven|tion', 'his|to|ry']
    },
    big: true,
    real: ['com|pu|ter','his|to|ry','gen|er|ous','en|or|mous','in|ven|tion','con|tain|er','en|joy|ment','dis|or|der','dis|hon|est','com|mu|ter','ca|vi|ty','con|ven|tion','in|ven|tor','con|tent|ment','in|ter|est',
           // added 10/20
           'mas|ter|ful','pre|ven|tion','mo|tion|less','joy|ful|ness','play|ful|ness','en|count|er','gen|er|al','jew|el|ry','mer|ri|ment','his|tor|ic','fear|less|ness','un|der|play']
  },
  {
    id: '9c', num: '9c', name: 'Four-part words', example: 'in·fi·ni·ty',
    learn: {
      lines: ['These big words have four parts. Each part has one vowel sound.', 'Go slow. Read one part at a time, then put them together.', '/in/ + /fi/ + /ni/ + /ty/ = infinity.'],
      examples: ['in|fi|ni|ty', 'com|pe|ti|tion', 'his|to|ri|cal']
    },
    big: true,
    real: ['com|pe|ti|tion','his|to|ri|cal','in|fi|ni|ty','in|com|pe|tent','in|com|par|able','in|ter|ven|tion','dis|hon|or|able','dis|con|tent|ment',
           // added 10/20
           're|pe|ti|tion','com|pe|ti|tor','pe|ti|tion|er','mas|ter|ful|ness','mo|tion|less|ness','un|en|joy|able']
  },
  {
    id: '10', num: '10', name: 'Word parts', example: 'un·lock',
    learn: {
      lines: ['A prefix is a part at the START of a word. /un/ means not. /re/ means again. /pre/ means before. /dis/ and /non/ mean not.', 'A suffix is a part at the END. /ful/ means full of. /less/ means without. /ness/ means being. /est/ means the most. /able/ means can be.', 'Find the parts. Read each part. Then read the whole word: /un/ + lock = unlock.'],
      examples: ['un|lock', 're|tell', 'help|ful', 'end|less']
    },
    big: true, parts: true,
    real: ['un|lock','un|fit','re|tell','pre|heat','dis|trust','non|fat','thank|ful','help|ful','sad|ness','soft|est','quick|est','fix|able','end|less','pain|less','ac|tion','joy|ful',
           // added 10/20
           'un|pack','un|wrap','un|plug','re|fill','pre|pay','non|stick','dark|ness','sick|ness','rest|ful','wish|ful','cold|est','dark|est','bend|able'],
    split: { lock: 'l|o|ck', fit: 'f|i|t', tell: 't|e|ll', heat: 'h|ea|t', trust: 't|r|u|s|t', fat: 'f|a|t', thank: 'th|a|n|k', help: 'h|e|l|p', sad: 's|a|d', soft: 's|o|f|t', quick: 'qu|i|ck', fix: 'f|i|x', end: 'e|n|d', pain: 'p|ai|n', ac: 'a|c',
             pack: 'p|a|ck', wrap: 'wr|a|p', plug: 'p|l|u|g', fill: 'f|i|ll', pay: 'p|ay', stick: 's|t|i|ck', dark: 'd|ar|k',
             sick: 's|i|ck', rest: 'r|e|s|t', wish: 'w|i|sh', cold: 'c|ol|d', bend: 'b|e|n|d' }
  }
];
