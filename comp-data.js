/* =====================================================================
   COMPREHENSION TRACK — for students who passed every QPS level.
   Skills follow Wonders Unit 2 (Oct 19 – Dec 4, 2026, district pacing
   guide): words in context first. Passages are original, on the unit's
   topic (animals and survival), so nothing is copied from Wonders.

   Each item: a short passage with the target word marked *like this*.
     choices[0] is the right meaning; the site shuffles them.
     clues[0]   is the words that best show the meaning; the site shuffles.
   Levels (the site moves each student up and down on its own):
     1  the meaning is right next to the word ("or ...", "which means ...")
     2  an example or a nearby sentence shows the meaning
     3  an opposite or contrast shows it, or the clue is in another sentence
     4  words with two meanings, exaggeration, harder words, longer passages
   ===================================================================== */
const COMP_SKILLS = [
  {
    id: 'context',
    name: 'Words in context',
    icon: '🔎',
    // One line per level, shown to Mr. O and guests when they pick a level (students never pick).
    levelNotes: {
      1: 'The meaning is right next to the word.',
      2: 'An example or a nearby sentence shows the meaning.',
      3: 'An opposite shows it, or the clue is in another sentence.',
      4: 'Words with two meanings, harder words, longer passages.'
    },
    learn: [
      'Good readers do not skip a hard word. They look at the words around it.',
      'The words around a hard word are called context clues. Context clues help you figure out what the word means.',
      'Sometimes the meaning is right there, after a word like "or" or "which means."',
      'Sometimes an example shows what the word means.',
      'Sometimes the opposite shows it. Look for "but," "unlike," or "not."',
      'Try it: The cave was gloomy, but outside the sun was bright. "Gloomy" must mean dark, because it is the opposite of bright.'
    ],
    levels: {
      1: [
        { id: 'X1-01', passage: 'The baby owl was *drowsy*, or very sleepy, after staying up all night. It tucked its head under its wing.',
          choices: ['very sleepy', 'very hungry', 'very loud', 'very cold'],
          clues: ['or very sleepy', 'The baby owl', 'under its wing'] },
        { id: 'X1-02', passage: 'A hedgehog has a clever *defense*, a way to protect itself. When danger comes, it rolls into a tight, prickly ball.',
          choices: ['a way to protect itself', 'a place to sleep', 'a kind of food', 'a loud warning'],
          clues: ['a way to protect itself', 'A hedgehog has', 'a tight, prickly ball'] },
        { id: 'X1-03', passage: 'Camels can go a long time without water in the *arid* desert. Arid means very dry, with almost no rain.',
          choices: ['very dry', 'very windy', 'very crowded', 'very dark'],
          clues: ['very dry, with almost no rain', 'a long time', 'Camels can go'] },
        { id: 'X1-04', passage: 'The mother bird *gathered*, or collected, small twigs. She used them to build a nest high in the tree.',
          choices: ['collected', 'broke', 'dropped', 'painted'],
          clues: ['or collected', 'The mother bird', 'high in the tree'] },
        { id: 'X1-05', passage: 'Some frogs are *nocturnal*. That means they sleep during the day and look for food at night.',
          choices: ['awake and busy at night', 'able to swim', 'very small', 'bright green'],
          clues: ['sleep during the day and look for food at night', 'Some frogs', 'That means'] },
        { id: 'X1-06', passage: 'The rabbit stayed *motionless*. It did not move at all, so the hawk flying above did not see it.',
          choices: ['not moving', 'very fast', 'very scared', 'hiding underground'],
          clues: ['It did not move at all', 'the hawk flying above', 'The rabbit stayed'] },
        { id: 'X1-07', passage: 'Bees *communicate*, or share information, by dancing. A bee\'s dance tells the other bees where to find flowers.',
          choices: ['share information', 'fly in circles', 'make honey', 'fight each other'],
          clues: ['or share information', 'by dancing', 'where to find flowers'] },
        { id: 'X1-08', passage: 'A polar bear\'s thick fur and fat *insulate* its body. They keep the heat in, so the bear stays warm in the icy water.',
          choices: ['keep the heat in', 'make it heavy', 'help it swim fast', 'change its color'],
          clues: ['They keep the heat in', 'thick fur and fat', 'the icy water'] },
        { id: 'X1-09', passage: 'The kitten was *timid*, which means shy and easily scared. It hid under the bed when visitors came.',
          choices: ['shy and easily scared', 'hungry', 'playful', 'sleepy'],
          clues: ['which means shy and easily scared', 'The kitten was', 'when visitors came'] },
        { id: 'X1-10', passage: 'Squirrels *store* nuts in the fall. They bury the nuts in the ground and save them to eat in the winter.',
          choices: ['save for later', 'crack open', 'throw away', 'share with friends'],
          clues: ['save them to eat in the winter', 'in the fall', 'Squirrels'] }
      ],
      2: [
        { id: 'X2-01', passage: 'The fox *pounced* on the mouse. It jumped high and landed right on top of its dinner.',
          choices: ['jumped on it suddenly', 'ran away from it', 'called to it', 'sniffed it'],
          clues: ['It jumped high and landed right on top', 'The fox', 'its dinner'] },
        { id: 'X2-02', passage: 'Monarch butterflies *migrate* each fall. They fly thousands of miles south to Mexico, where it is warmer, and fly back north in the spring.',
          choices: ['travel to a new place for part of the year', 'change their colors', 'lay their eggs', 'sleep all winter'],
          clues: ['fly thousands of miles south to Mexico', 'Monarch butterflies', 'where it is warmer'] },
        { id: 'X2-03', passage: 'The puppy was *exhausted* after the long hike. It flopped onto its bed and fell asleep before dinner.',
          choices: ['very tired', 'very excited', 'very thirsty', 'very dirty'],
          clues: ['flopped onto its bed and fell asleep', 'The puppy was', 'before dinner'] },
        { id: 'X2-04', passage: 'Many small animals hide from *predators*. A mouse hides from owls, snakes, and cats that want to eat it.',
          choices: ['animals that hunt and eat other animals', 'animals that live in groups', 'baby animals', 'animals that eat only plants'],
          clues: ['owls, snakes, and cats that want to eat it', 'Many small animals', 'A mouse hides'] },
        { id: 'X2-05', passage: 'The desert lizard is hard to spot. Its sandy brown skin *blends in* with the rocks and sand around it.',
          choices: ['looks like what is around it', 'shines brightly', 'gets mixed with food', 'moves very quickly'],
          clues: ['is hard to spot', 'The desert lizard', 'Its sandy brown skin'] },
        { id: 'X2-06', passage: 'Ants are very *industrious*. They work all day long, carrying food and digging tunnels without stopping to rest.',
          choices: ['hard-working', 'tiny', 'lazy', 'dangerous'],
          clues: ['They work all day long', 'Ants are very', 'digging tunnels'] },
        { id: 'X2-07', passage: 'The young deer was *cautious* when it came to the stream. It looked left and right and sniffed the air before it took a drink.',
          choices: ['careful', 'brave', 'noisy', 'lost'],
          clues: ['looked left and right and sniffed the air', 'The young deer', 'took a drink'] },
        { id: 'X2-08', passage: 'An octopus can *escape* from danger in a cloud of ink. It squirts dark ink into the water and swims away while the enemy cannot see.',
          choices: ['get away', 'fight back', 'hide in a shell', 'eat'],
          clues: ['swims away while the enemy cannot see', 'An octopus can', 'dark ink'] },
        { id: 'X2-09', passage: 'The bear cub *devoured* the berries. In just a few minutes, every berry on the bush was gone.',
          choices: ['ate quickly and hungrily', 'picked carefully', 'looked at', 'shared'],
          clues: ['every berry on the bush was gone', 'The bear cub', 'In just a few'] },
        { id: 'X2-10', passage: 'Emperor penguins *huddle* to stay warm in the freezing wind. Hundreds of them stand close together in a big, tight group.',
          choices: ['crowd close together', 'dive into the water', 'flap their wings', 'sleep alone'],
          clues: ['stand close together in a big, tight group', 'Emperor penguins', 'the freezing wind'] }
      ],
      3: [
        { id: 'X3-01', passage: 'In winter, the arctic fox has thick white fur that matches the snow. In summer, when the snow melts, its coat turns brown. Its fur is not *conspicuous* in either season. The fox is hard to notice all year long.',
          choices: ['easy to see', 'soft and warm', 'wet', 'thick'],
          clues: ['The fox is hard to notice all year long', 'when the snow melts', 'thick white fur'] },
        { id: 'X3-02', passage: 'Unlike the busy beaver, the sloth is *sluggish*. It moves so slowly that tiny plants called algae can grow on its fur.',
          choices: ['slow-moving', 'hard-working', 'hungry', 'clever'],
          clues: ['It moves so slowly', 'tiny plants called algae', 'can grow on its fur'] },
        { id: 'X3-03', passage: 'Lena expected the old dog to be *hostile*, so she stood very still. But the dog wagged its tail, licked her hand, and rolled over for a belly rub.',
          choices: ['unfriendly and ready to fight', 'friendly', 'tired', 'small'],
          clues: ['But the dog wagged its tail, licked her hand', 'the old dog', 'Lena expected'] },
        { id: 'X3-04', passage: 'Some animals are *solitary*. A tiger lives and hunts by itself and meets other tigers only to have cubs. Wolves are different. They live, travel, and hunt together in packs.',
          choices: ['living alone', 'living in packs', 'very strong', 'hunting at night'],
          clues: ['lives and hunts by itself', 'Wolves are different', 'to have cubs'] },
        { id: 'X3-05', passage: 'Water was *scarce* on the island that summer. The streams dried up, the puddles were gone, and the birds had to fly far to find even a few drops.',
          choices: ['hard to find', 'everywhere', 'very cold', 'dirty'],
          clues: ['had to fly far to find even a few drops', 'on the island', 'that summer'] },
        { id: 'X3-06', passage: 'The turtle\'s shell is *rigid*. A leaf bends when you push it, but the shell does not bend at all. That is why the shell keeps the turtle safe.',
          choices: ['stiff and hard', 'soft', 'colorful', 'heavy'],
          clues: ['the shell does not bend at all', 'A leaf bends', 'keeps the turtle safe'] },
        { id: 'X3-07', passage: 'At first, the baby bird *hesitated* at the edge of the nest. It looked down, stepped back, and waited. Then, with a flap of its wings, it finally flew.',
          choices: ['stopped because it was not sure', 'fell quickly', 'sang loudly', 'flew away right away'],
          clues: ['It looked down, stepped back, and waited', 'the edge of the nest', 'with a flap of its wings'] },
        { id: 'X3-08', passage: 'Some birds are *vibrant*, like the parrot with its bright red, blue, and yellow feathers. Others, like the sparrow, are plain brown, so they are hard to see.',
          choices: ['bright and full of color', 'plain and brown', 'very loud', 'very small'],
          clues: ['bright red, blue, and yellow feathers', 'like the sparrow', 'hard to see'] },
        { id: 'X3-09', passage: 'The chipmunk worked hard all fall to *accumulate* food. It started with one acorn. By winter, its underground room held hundreds of nuts and seeds.',
          choices: ['gather a lot over time', 'eat quickly', 'give away', 'hide one thing'],
          clues: ['By winter, its underground room held hundreds of nuts', 'all fall', 'underground room'] },
        { id: 'X3-10', passage: 'Skunks *seldom* spray. First, a skunk stamps its feet, hisses, and raises its tail as a warning. It sprays only when nothing else works.',
          choices: ['not often', 'always', 'loudly', 'at night'],
          clues: ['It sprays only when nothing else works', 'stamps its feet', 'raises its tail'] }
      ],
      4: [
        { id: 'X4-01', passage: 'The sea lion pup lay on the rocks, calling for its mother. Its sharp *bark* echoed across the beach. Out in the waves, the mother lifted her head, answered with a bark of her own, and swam quickly to shore.',
          choices: ['a short, loud animal call', 'the hard outside of a tree', 'a small boat', 'a rough rock'],
          clues: ['answered with a bark of her own', 'lay on the rocks', 'Out in the waves'] },
        { id: 'X4-02', passage: 'After sleeping all winter, the bear woke up *so hungry it could eat a mountain*. From morning until night, it ate fish, berries, roots, and grass.',
          choices: ['extremely hungry', 'able to eat rocks', 'angry and grumpy', 'ready to climb'],
          clues: ['From morning until night, it ate fish, berries, roots, and grass', 'After sleeping all winter', 'the bear woke up'] },
        { id: 'X4-03', passage: 'Every animal has *adaptations* that help it survive where it lives. A duck\'s webbed feet push the water like paddles. A giraffe\'s long neck reaches leaves high in the trees. A camel\'s wide feet keep it from sinking in the sand.',
          choices: ['body parts or actions that help an animal live in its home', 'new homes an animal moves to', 'the foods an animal eats', 'changes to the weather'],
          clues: ['help it survive where it lives', 'like paddles', 'sinking in the sand'] },
        { id: 'X4-04', passage: 'The vulture is not a pretty bird, but it does an *essential* job. It eats dead animals that would otherwise rot and spread sickness. Without vultures, many places would be dirtier and less healthy.',
          choices: ['very important and needed', 'dangerous', 'ugly', 'easy'],
          clues: ['Without vultures, many places would be dirtier and less healthy', 'not a pretty bird', 'eats dead animals'] },
        { id: 'X4-05', passage: 'The forest seemed *deserted*. No birds sang, no squirrels chased each other, and the path was empty. Then Marco noticed hundreds of eyes watching him from the branches.',
          choices: ['empty, with no one there', 'dry and sandy', 'very dark', 'dangerous'],
          clues: ['No birds sang, no squirrels chased each other, and the path was empty', 'Marco noticed', 'from the branches'] },
        { id: 'X4-06', passage: 'Not every animal that looks *fierce* is dangerous. The frilled lizard opens a huge collar around its neck and hisses with its mouth wide open. Yet it is harmless to people and usually runs away after the show.',
          choices: ['scary and ready to attack', 'harmless', 'colorful', 'shy'],
          clues: ['opens a huge collar around its neck and hisses', 'usually runs away', 'to people'] },
        { id: 'X4-07', passage: 'When the hawk\'s shadow passed over the field, the rabbits *froze*. Not one ear twitched. A moment later, when the shadow was gone, they went back to nibbling the clover.',
          choices: ['stopped moving completely', 'got very cold', 'turned into ice', 'ran away'],
          clues: ['Not one ear twitched', 'passed over the field', 'nibbling the clover'] },
        { id: 'X4-08', passage: 'Sea otters have a clever way to rest. They *drift* on their backs and hold paws, so the moving water does not carry them away from each other. A group of resting otters is called a raft.',
          choices: ['float slowly, carried by the water', 'dive deep', 'swim fast', 'sleep on land'],
          clues: ['so the moving water does not carry them away', 'hold paws', 'is called a raft'] },
        { id: 'X4-09', passage: 'Some baby animals are *vulnerable* right after they are born. A newborn kangaroo is about the size of a jellybean. It cannot see or hear, so it crawls into its mother\'s pouch, where it is safe.',
          choices: ['easily hurt', 'very strong', 'very loud', 'very fast'],
          clues: ['It cannot see or hear', 'the size of a jellybean', 'its mother\'s pouch'] },
        { id: 'X4-10', passage: 'The rain forest *canopy* is like a roof. The tops of the tallest trees grow so close together that they block most of the sunlight. Down on the forest floor, it can be dim even at noon.',
          choices: ['the top layer of the forest, made of treetops', 'the forest floor', 'a tent', 'the trunk of a tree'],
          clues: ['The tops of the tallest trees grow so close together', 'even at noon', 'Down on the forest floor'] }
      ]
    }
  }
];

// Where each comprehension student starts (the site moves them from here).
// Everyone else on the comprehension track starts at level 2.
const COMP_START_LEVEL = { 'Pettway, Lanaura': 3 };
