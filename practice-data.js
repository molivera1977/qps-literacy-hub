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
      lines: ['The vowels are a, e, i, o and u.', 'In a short word like cat, the vowel makes its short sound.', 'Tap each word. Listen for the vowel in the middle.'],
      examples: ['c|a|t', 'b|e|d', 'p|i|g', 'h|o|t', 's|u|n']
    },
    real: ['c|a|p','b|e|d','f|i|x','h|o|t','s|u|n','r|i|p','j|o|g','w|e|t','m|u|d','t|a|g','p|e|n','l|i|d','b|u|s','f|a|n','k|i|t','r|u|b'],
    sort: {
      prompt: 'Which vowel sound do you hear?',
      bins: [{ label: 'a', key: 'a' }, { label: 'e', key: 'e' }, { label: 'i', key: 'i' }, { label: 'o', key: 'o' }, { label: 'u', key: 'u' }],
      words: [['c|a|p','a'],['f|a|n','a'],['b|e|d','e'],['w|e|t','e'],['r|i|p','i'],['k|i|t','i'],['h|o|t','o'],['j|o|g','o'],['s|u|n','u'],['m|u|d','u']]
    },
    chains: [['c|a|t','c|o|t'],['c|o|t','c|u|t'],['c|u|t','h|u|t'],['h|u|t','h|i|t'],['p|i|g','p|i|n'],['p|i|n','p|e|n'],['p|e|n','t|e|n'],['b|e|d','b|a|d'],['b|a|d','b|a|t'],['b|a|t','b|i|t']],
    made: ['t|i|b','g|o|k','v|u|p','z|a|t','h|e|s','l|o|m','f|i|d','n|e|p','r|o|g','k|a|b','j|u|d','w|i|m','p|o|f','m|i|b','v|e|p','a|b','o|t','u|g'],
    contrast: { a: ['i','o'], e: ['a','u'], i: ['e','a'], o: ['u','a'], u: ['o','i'] },
    sentences: ['The pig sat in the mud.','Ten red bugs ran up the log.','Did Dan get a hot dog?','Pam has a big tan cat.','Sam can hop and jog.','The fox hid in a box.']
  },
  {
    id: '3', num: '3', name: 'sh ch th', example: 'ship',
    learn: {
      lines: ['Some letters work in pairs. Two letters make ONE sound.', 's and h say sh. c and h say ch. t and h say th.', 'w and h say w. c and k say k. n and g say ng.'],
      examples: ['sh|i|p', 'ch|o|p', 'th|i|n', 'wh|e|n', 'd|u|ck', 's|i|ng']
    },
    real: ['sh|i|p','ch|o|p','th|i|n','wh|e|n','d|u|ck','s|i|ng','sh|o|p','ch|i|n','m|a|th','w|i|sh','r|i|ch','b|a|ck','r|i|ng','wh|i|p','b|a|th','m|u|ch'],
    sort: {
      prompt: 'Which sound do you hear?',
      bins: [{ label: 'sh', key: 'sh' }, { label: 'ch', key: 'ch' }, { label: 'th', key: 'th' }],
      words: [['sh|i|p','sh'],['w|i|sh','sh'],['f|i|sh','sh'],['d|i|sh','sh'],['ch|o|p','ch'],['ch|i|n','ch'],['r|i|ch','ch'],['m|u|ch','ch'],['th|i|n','th'],['m|a|th','th'],['b|a|th','th'],['m|o|th','th']]
    },
    made: ['sh|u|b','ch|o|g','th|u|p','wh|i|d','f|u|sh','z|e|th','n|i|ch','v|a|ck','j|i|ng','sh|o|m','ch|e|p','th|a|b','wh|e|g','r|a|th','z|e|ck','d|u|sh'],
    contrast: { sh: ['s','ch'], ch: ['sh','t'], th: ['t','sh'], wh: ['th','h'], ck: ['ch','sh'], ng: ['n','m'] },
    sentences: ['The ship is in the dock.','Chad and Beth sing a song.','When can I get a fish?','That duck is on the path.','Seth has a chip in his lunch.','Which shell is thick?']
  },
  {
    id: '4', num: '4', name: 'Blends', example: 'frog',
    learn: {
      lines: ['A blend is two letters side by side. You hear BOTH sounds, said fast.', 'In frog you hear f and r: f-r-og.', 'Do not skip a sound!'],
      examples: ['f|r|o|g', 's|t|o|p', 'c|r|a|b', 'j|u|m|p', 'm|i|l|k']
    },
    real: ['s|t|o|p','f|l|a|g','c|r|a|b','p|l|u|m','s|w|i|m','f|r|o|g','d|r|u|m','g|r|i|n','s|l|i|p','t|r|i|p','b|e|s|t','h|a|n|d','j|u|m|p','m|i|l|k','t|e|n|t','f|a|s|t'],
    chains: [['l|a|p','c|l|a|p'],['t|o|p','s|t|o|p'],['r|i|p','t|r|i|p'],['l|i|p','f|l|i|p'],['n|a|p','s|n|a|p'],['w|i|n','t|w|i|n'],['t|e|n','t|e|n|t'],['b|a|n','b|a|n|d']],
    made: ['b|l|i|m','c|r|a|d','f|l|e|p','s|n|o|p','t|r|a|b','p|l|i|n','s|p|e|t','g|r|o|t','d|r|i|b','s|w|u|b','f|r|e|m','s|t|i|d','l|u|s|k','m|e|s|t','r|i|l|d','b|a|m|p'],
    contrast: 'drop',
    sentences: ['The frog can jump in the pond.','Brad and Glen swim fast.','Stop the sled at the tent.','A crab is in the sand.','Can Fran spin the drum?','Trish left her milk on the desk.']
  },
  {
    id: '5', num: '5', name: 'Silent e', example: 'cake',
    learn: {
      lines: ['An e at the end of a word is quiet. You do not hear it.', 'The quiet e makes the vowel say its name: a says A, i says I, o says O.', 'cap has no e, so the a is short. Add e and it turns into cape.'],
      examples: ['m|a|t>m|ate', 'p|i|n>p|ine', 'n|o|t>n|ote']
    },
    real: ['g|ate','l|ate','s|k|ate','p|l|ate','sh|ade','g|r|ade','l|ane','c|r|ane','n|ice','m|ice','r|ice','n|ine','sh|ine','m|ile','s|m|ile','h|ole','p|ole','v|ote','d|une','t|une','f|r|oze'],
    sort: {
      prompt: 'Is the vowel short or long?',
      bins: [{ label: 'Short — like cap', key: 'short' }, { label: 'Long — like cape', key: 'long' }],
      words: [['m|a|t','short'],['m|ate','long'],['p|i|n','short'],['p|ine','long'],['c|a|n','short'],['c|ane','long'],['n|o|t','short'],['n|ote','long'],['h|a|t','short'],['h|ate','long'],['f|i|n','short'],['f|ine','long']]
    },
    chains: [['m|a|t','m|ate'],['h|a|t','h|ate'],['r|a|t','r|ate'],['m|a|d','m|ade'],['c|a|n','c|ane'],['p|l|a|n','p|l|ane'],['f|i|n','f|ine'],['p|i|n','p|ine'],['s|p|i|n','s|p|ine'],['sh|i|n','sh|ine'],['t|w|i|n','t|w|ine'],['n|o|t','n|ote']],
    made: ['j|ate','t|ade','h|ane','j|ine','z|ile','b|ice','f|ole','l|oze','z|ote','b|une','p|l|ote','g|r|ine','c|l|ade','ch|ice','sh|ile','th|une'],
    contrast: { ate: ['a|t','ote'], ade: ['a|d','ate'], ane: ['a|n','ine'], ine: ['i|n','ane'], ile: ['i|l','ole'], ice: ['i|c','ine'], ole: ['o|l','ile'], oze: ['o|z','ole'], ote: ['o|t','ate'], une: ['u|n','ine'] },
    sentences: ['The cat ate a bite of cake.','Five mice hid in a hole.','Dave made a kite with a pole.','Nine kids rode their bikes home.','Kate will use tape on the note.','The dog ran to the gate at the end of the lane.','Can Rose hide the cube in the box?','Mike has a plane and a white kite.']
  },
  {
    id: '6', num: '6', name: 'Bossy R', example: 'car',
    learn: {
      lines: ['When r comes right after a vowel, the r is the boss.', 'The vowel and the r make a new sound together.', 'ar says ar, like car. or says or, like for. er, ir and ur all say er, like her, bird and turn.'],
      examples: ['c|ar', 'f|or|k', 'h|er', 'b|ir|d', 't|ur|n']
    },
    real: ['c|ar','f|ar|m','s|t|ar','h|er','f|er|n','b|ir|d','g|ir|l','sh|ir|t','c|or|n','f|or|k','s|t|or|m','t|ur|n','h|ur|t','b|ur|n','p|ar|k','s|p|or|t'],
    sort: {
      prompt: 'Which sound do you hear?',
      bins: [{ label: 'ar — like car', key: 'ar' }, { label: 'or — like for', key: 'or' }, { label: 'er ir ur — like her', key: 'er' }],
      words: [['f|ar|m','ar'],['s|t|ar','ar'],['p|ar|k','ar'],['d|ar|k','ar'],['c|or|n','or'],['s|t|or|m','or'],['s|p|or|t','or'],['h|or|n','or'],['f|er|n','er'],['b|ir|d','er'],['g|ir|l','er'],['t|ur|n','er']]
    },
    made: ['t|ar|k','b|er|p','d|ir|b','l|or|p','m|ur|f','s|ar|n','g|er|d','k|ir|b','v|or|n','n|ur|t','j|ar|p','p|er|n','z|ir|t','h|or|t','l|ur|b','g|ar|f'],
    contrast: { ar: ['a','or'], or: ['o','ar'], er: ['e','ar'], ir: ['i','or'], ur: ['u','ar'] },
    sentences: ['The bird sat on the fork.','Mark has a dark red car.','The girl will turn the corn.','Her shirt got torn in the storm.','Burt hurt his arm.','We can play in the park.']
  },
  {
    id: '7', num: '7', name: 'Tricky letters', example: 'knot',
    learn: {
      lines: ['Some letter groups play tricks.', 'tch says ch, like catch. dge says j, like badge. qu says kw, like quit. x says ks, like fox.', 'Some letters are silent: in kn the k is quiet (knot). In wr the w is quiet (wrap). In gn the g is quiet (gnat).'],
      examples: ['c|a|tch', 'b|a|dge', 'kn|o|t', 'wr|a|p', 'gn|a|t', 'qu|i|t', 'f|o|x']
    },
    real: ['c|a|tch','m|a|tch','d|i|tch','b|a|dge','f|u|dge','b|r|i|dge','kn|o|t','kn|i|t','wr|a|p','wr|i|s|t','qu|i|t','qu|a|ck','f|o|x','s|i|x','qu|i|z','gn|a|t'],
    made: ['z|a|tch','r|i|tch','f|o|dge','l|i|dge','kn|o|p','kn|u|g','kn|e|b','wr|a|b','wr|e|m','wr|i|b','gn|e|t','gn|o|p','qu|i|b','qu|o|t','j|e|x','v|i|x'],
    contrast: { tch: ['t','sh'], dge: ['g','ch'], kn: ['k','m'], wr: ['w','l'], gn: ['g','m'], qu: ['k','w'], x: ['s','z'] },
    sentences: ['The quick fox ran to the ditch.','Kate will wrap a gift for Madge.','I can knit a hat.','Six ducks sat on the bridge.','Do not let the cat catch the fish.','The fudge is on the top shelf.']
  },
  {
    id: '8', num: '8', name: 'Vowel teams', example: 'boat',
    learn: {
      lines: ['In a vowel team, two letters work together to make ONE vowel sound.', 'ai and ay say A (rain, day). oa and oe say O (boat, toe). ea says E (seat). igh says I (night).', 'oo says oo (moon). ew says oo (new). ou says ow (out). oi and oy say oy (coin, toy). au and aw say aw (haul, saw).'],
      examples: ['r|ai|n', 'd|ay', 'b|oa|t', 's|ea|t', 'n|igh|t', 'm|oo|n', 'ou|t', 'c|oi|n', 's|aw']
    },
    real: ['r|ai|n','t|ai|l','p|l|ay','d|ay','s|ea|t','t|ea|m','b|oa|t','s|oa|p','m|oo|n','f|oo|d','ou|t','l|ou|d','c|oi|n','b|oi|l','t|oy','h|au|l','s|aw','l|aw|n','p|aw','n|ew','n|igh|t','l|igh|t'],
    sort: {
      prompt: 'Is it a real word or a made-up word?', seeWord: true,
      bins: [{ label: 'Real word', key: 'real' }, { label: 'Made-up word', key: 'made' }],
      words: [['r|ai|n','real'],['z|ai|t','made'],['s|ea|t','real'],['d|ea|p','made'],['b|oa|t','real'],['l|oa|b','made'],['m|oo|n','real'],['z|oo|t','made'],['c|oi|n','real'],['d|oi|l','made'],['n|ew','real'],['t|r|ew','made']]
    },
    made: ['z|ai|t','v|ay','d|ea|p','l|oa|b','z|oo|t','m|ou|t','d|oi|l','z|oy','f|au|l','z|aw','b|oe','t|r|ew','m|igh','sh|oa|m','g|ea|t','n|ol|t'],
    contrast: { ai: ['a','oa'], ay: ['a','oy'], ea: ['e','oa'], oa: ['o','ea'], oo: ['o','ou'], ou: ['o','oo'], oi: ['o','ai'], oy: ['o','ay'], au: ['a','ou'], aw: ['a','ew'], oe: ['o','ew'], ew: ['e','aw'], igh: ['i','ay'], ol: ['o','oo'] },
    sentences: ['The boat sails in the rain.','Roy has a toy coin.','Dad saw the moon at night.','Pay for the soap and the food.','Paul saw a hawk in the light.','We can eat at noon.']
  },
  {
    id: '9a', num: '9a', name: 'Two-part words', example: 'en·joy',
    learn: {
      lines: ['Big words are made of parts called syllables. Each part has one vowel sound.', 'Read one part at a time. Then put the parts together.', 'con + tent = content.'],
      examples: ['con|tent', 'en|joy', 'mo|tor']
    },
    big: true,
    real: ['con|tent','com|pare','en|joy','hon|est','mo|tor','par|ade','play|er','fear|less','dis|play','en|ter','mas|ter','sol|ar','pe|tal','com|ment','con|tain','fast|er','joy|ful','play|ful']
  },
  {
    id: '9b', num: '9b', name: 'Three-part words', example: 'com·pu·ter',
    learn: {
      lines: ['These big words have three parts. Each part has one vowel sound.', 'Read one part at a time. Then put the parts together.', 'com + pu + ter = computer.'],
      examples: ['com|pu|ter', 'in|ven|tion', 'his|to|ry']
    },
    big: true,
    real: ['com|pu|ter','his|to|ry','gen|er|ous','en|or|mous','in|ven|tion','con|tain|er','en|joy|ment','dis|or|der','dis|hon|est','com|mu|ter','ca|vi|ty','con|ven|tion','in|ven|tor','con|tent|ment','in|ter|est']
  },
  {
    id: '9c', num: '9c', name: 'Four-part words', example: 'in·fi·ni·ty',
    learn: {
      lines: ['These big words have four parts. Each part has one vowel sound.', 'Go slow. Read one part at a time, then put them together.', 'in + fi + ni + ty = infinity.'],
      examples: ['in|fi|ni|ty', 'com|pe|ti|tion', 'his|to|ri|cal']
    },
    big: true,
    real: ['com|pe|ti|tion','his|to|ri|cal','in|fi|ni|ty','in|com|pe|tent','in|com|par|able','in|ter|ven|tion','dis|hon|or|able','dis|con|tent|ment']
  },
  {
    id: '10', num: '10', name: 'Word parts', example: 'un·lock',
    learn: {
      lines: ['A prefix is a part at the START of a word. un means not. re means again. pre means before. dis and non mean not.', 'A suffix is a part at the END. ful means full of. less means without. ness means being. est means the most. able means can be.', 'Find the parts. Read each part. Then read the whole word: un + lock = unlock.'],
      examples: ['un|lock', 're|tell', 'help|ful', 'end|less']
    },
    big: true, parts: true,
    real: ['un|lock','un|fit','re|tell','pre|heat','dis|trust','non|fat','thank|ful','help|ful','sad|ness','soft|est','quick|est','fix|able','end|less','pain|less','ac|tion','joy|ful'],
    split: { lock: 'l|o|ck', fit: 'f|i|t', tell: 't|e|ll', heat: 'h|ea|t', trust: 't|r|u|s|t', fat: 'f|a|t', thank: 'th|a|n|k', help: 'h|e|l|p', sad: 's|a|d', soft: 's|o|f|t', quick: 'qu|i|ck', fix: 'f|i|x', end: 'e|n|d', pain: 'p|ai|n', ac: 'a|c' }
  }
];
