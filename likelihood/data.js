const QUESTIONS = [
  // EVERYDAY LIFE
  {
    question: "What is the likelihood of being struck by lightning in your lifetime?",
    answer: "1 in 15,300",
    options: ["1 in 700", "1 in 15,300", "1 in 2 million", "1 in 500,000"],
    correctIndex: 1,
    fact: "The odds are higher than you think! The US averages about 270 lightning strike survivors per year.",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of finding a four-leaf clover?",
    answer: "1 in 10,000",
    options: ["1 in 100", "1 in 1,000", "1 in 10,000", "1 in 1 million"],
    correctIndex: 2,
    fact: "For every four-leaf clover, there are about 10,000 three-leaf clovers. Some people have a genetic knack for spotting them!",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of getting a royal flush in poker?",
    answer: "1 in 649,740",
    options: ["1 in 5,000", "1 in 72,000", "1 in 649,740", "1 in 10 million"],
    correctIndex: 2,
    fact: "A royal flush is the rarest hand in poker. You'd need to play about 650,000 hands to expect one.",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of being born on a leap day?",
    answer: "1 in 1,461",
    options: ["1 in 365", "1 in 1,461", "1 in 4", "1 in 7,300"],
    correctIndex: 1,
    fact: "About 5 million people worldwide share a February 29th birthday. They're called 'leaplings'!",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of your song being played on the radio?",
    answer: "About 1 in 10,000",
    options: ["1 in 100", "1 in 10,000", "1 in 1 million", "1 in 50 million"],
    correctIndex: 1,
    fact: "Over 100,000 songs are uploaded to streaming platforms daily! Getting radio play requires luck, connections, and a genuinely catchy hook.",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of meeting someone with the same name as you?",
    answer: "About 1 in 1,500",
    options: ["1 in 50", "1 in 1,500", "1 in 100,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "With thousands of unique first names in use, bumping into your name twin is rarer than you'd think — unless you're named James or Mary!",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of an amateur golfer getting a hole in one?",
    answer: "1 in 12,500",
    options: ["1 in 500", "1 in 12,500", "1 in 100,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "For professional golfers, the odds improve to about 1 in 2,500. Some courses even offer insurance for hole-in-one prizes!",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of finding a pearl in an oyster?",
    answer: "1 in 12,000",
    options: ["1 in 100", "1 in 2,500", "1 in 12,000", "1 in 100,000"],
    correctIndex: 2,
    fact: "Natural pearls form when an irritant gets trapped inside an oyster. Most pearls sold today are cultured, not natural.",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of being audited by the IRS?",
    answer: "About 1 in 250",
    options: ["1 in 10", "1 in 250", "1 in 5,000", "1 in 50,000"],
    correctIndex: 1,
    fact: "The audit rate has been dropping for years. If you earn under $200K, your odds are even lower — about 1 in 500.",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of winning an Oscar if you're an actor?",
    answer: "About 1 in 11,500",
    options: ["1 in 500", "1 in 3,000", "1 in 11,500", "1 in 100,000"],
    correctIndex: 2,
    fact: "There are roughly 160,000 SAG-AFTRA members, and only about 14 acting nominations per year.",
    category: "Everyday Life"
  },
  // HUMAN BODY
  {
    question: "What is the likelihood of being left-handed?",
    answer: "About 10%",
    options: ["About 2%", "About 10%", "About 25%", "About 40%"],
    correctIndex: 1,
    fact: "Left-handedness has been consistent at about 10% across cultures and throughout history. Many US presidents were lefties!",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of having green eyes?",
    answer: "About 2%",
    options: ["About 2%", "About 10%", "About 20%", "About 35%"],
    correctIndex: 0,
    fact: "Green is the rarest natural eye color. It's most common in Northern and Central Europe, especially Ireland and Scotland.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of being born with an extra finger?",
    answer: "1 in 500",
    options: ["1 in 500", "1 in 5,000", "1 in 50,000", "1 in 1 million"],
    correctIndex: 0,
    fact: "Polydactyly is more common than you'd think! The extra finger is usually removed shortly after birth.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of having a true photographic memory?",
    answer: "Less than 1%",
    options: ["About 5%", "About 2%", "Less than 1%", "About 15%"],
    correctIndex: 2,
    fact: "True eidetic memory in adults is so rare that many scientists debate whether it actually exists at all.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of being double-jointed?",
    answer: "About 20%",
    options: ["About 3%", "About 10%", "About 20%", "About 50%"],
    correctIndex: 2,
    fact: "The medical term is 'joint hypermobility.' It's not extra joints — just unusually flexible ligaments!",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of a man being colorblind?",
    answer: "About 8%",
    options: ["About 1%", "About 8%", "About 20%", "About 0.5%"],
    correctIndex: 1,
    fact: "Colorblindness affects men far more than women (8% vs 0.5%) because it's carried on the X chromosome.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of two people sharing a birthday in a room of 23?",
    answer: "About 50%",
    options: ["About 6%", "About 15%", "About 50%", "About 85%"],
    correctIndex: 2,
    fact: "This is the famous Birthday Paradox! With just 70 people, the probability jumps to 99.9%.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of having type O blood?",
    answer: "About 45%",
    options: ["About 10%", "About 25%", "About 45%", "About 70%"],
    correctIndex: 2,
    fact: "Type O is the most common blood type in the US and the universal donor type for red blood cells.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of being truly ambidextrous?",
    answer: "About 1%",
    options: ["About 1%", "About 5%", "About 15%", "About 30%"],
    correctIndex: 0,
    fact: "True ambidexterity — equal skill with both hands — is extremely rare. Most 'ambidextrous' people still have a dominant hand.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of a man being over 6'3\" tall?",
    answer: "About 5%",
    options: ["About 1%", "About 5%", "About 15%", "About 25%"],
    correctIndex: 1,
    fact: "The average American male height is 5'9\". Being 6'3\" puts you in the 95th percentile!",
    category: "Human Body"
  },
  // NATURE & ANIMALS
  {
    question: "What is the likelihood of an octopus escaping its aquarium tank?",
    answer: "About 30%",
    options: ["About 2%", "About 30%", "About 60%", "About 90%"],
    correctIndex: 1,
    fact: "Octopuses are notorious escape artists! They can squeeze through any gap larger than their beak, open jars from the inside, and even climb out of tanks at night.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of a rattlesnake warning you before it strikes?",
    answer: "About 70%",
    options: ["About 20%", "About 50%", "About 70%", "About 95%"],
    correctIndex: 2,
    fact: "Rattlesnakes prefer to warn intruders with their rattle rather than waste venom. They're actually pretty polite for dangerous reptiles!",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of being bitten by a snake in a given year?",
    answer: "1 in 37,500",
    options: ["1 in 500", "1 in 37,500", "1 in 1 million", "1 in 50 million"],
    correctIndex: 1,
    fact: "About 7,000-8,000 people are bitten by venomous snakes in the US annually, but only about 5 experience serious complications.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of seeing a shooting star on any given night (per hour)?",
    answer: "About 5%",
    options: ["About 0.1%", "About 5%", "About 25%", "About 60%"],
    correctIndex: 1,
    fact: "During meteor showers like the Perseids, you might see 50-100 per hour! On a normal night, maybe 2-3.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of a white Christmas in New York City?",
    answer: "About 22%",
    options: ["About 5%", "About 22%", "About 50%", "About 75%"],
    correctIndex: 1,
    fact: "A 'white Christmas' requires at least 1 inch of snow on the ground. NYC's odds have been declining due to warming trends.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of being hit by a falling meteorite?",
    answer: "1 in 250,000",
    options: ["1 in 2,500", "1 in 250,000", "1 in 50 million", "1 in 10 billion"],
    correctIndex: 1,
    fact: "In 1954, Ann Hodges of Alabama was hit by a meteorite that crashed through her roof — the only confirmed case!",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of a cat landing on its feet when falling?",
    answer: "About 90%",
    options: ["About 50%", "About 70%", "About 90%", "About 99.9%"],
    correctIndex: 2,
    fact: "Cats have a 'righting reflex' that kicks in by 3 weeks old. They need at least 1 foot of falling distance to rotate!",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of a dog being left-pawed?",
    answer: "About 50%",
    options: ["About 10%", "About 25%", "About 50%", "About 80%"],
    correctIndex: 2,
    fact: "Unlike humans, dogs show roughly equal left/right paw preference. Some studies suggest female dogs tend to be right-pawed.",
    category: "Nature & Animals"
  },
  // SPACE & SCIENCE
  {
    question: "What is the likelihood of seeing the Northern Lights in your lifetime if you live in the US?",
    answer: "About 30%",
    options: ["About 5%", "About 30%", "About 60%", "About 90%"],
    correctIndex: 1,
    fact: "The aurora borealis is visible from northern US states several times per solar cycle. Solar maximum years give you the best shot!",
    category: "Space & Science"
  },
  {
    question: "What is the likelihood that your body contains an atom once part of a dinosaur?",
    answer: "Nearly 100%",
    options: ["About 1%", "About 25%", "About 60%", "Nearly 100%"],
    correctIndex: 3,
    fact: "Atoms are recycled endlessly. With quadrillions of atoms in your body, statistically you contain atoms from every dinosaur that ever lived!",
    category: "Space & Science"
  },
  {
    question: "What is the likelihood of two snowflakes being identical?",
    answer: "Essentially 0%",
    options: ["About 0.001%", "About 1%", "About 10%", "Essentially 0%"],
    correctIndex: 3,
    fact: "A typical snowflake has about 10 quintillion water molecules arranged in a crystal. The combinations are practically infinite.",
    category: "Space & Science"
  },
  {
    question: "What is the likelihood of flipping heads 10 times in a row?",
    answer: "1 in 1,024",
    options: ["1 in 100", "1 in 1,024", "1 in 10,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "Each flip is independent with 50/50 odds. 0.5^10 = 1/1,024. Try it — it might take you a while!",
    category: "Space & Science"
  },
  {
    question: "What is the likelihood of shuffling a deck into the same order twice?",
    answer: "1 in 8×10⁶⁷",
    options: ["1 in 1 million", "1 in 1 billion", "1 in 8×10⁶⁷", "1 in 10¹⁰⁰"],
    correctIndex: 2,
    fact: "52! (52 factorial) is so huge that every shuffle you've ever done has almost certainly never occurred before in history.",
    category: "Space & Science"
  },
  // SPORTS
  {
    question: "What is the likelihood of filling out a perfect NCAA bracket?",
    answer: "1 in 9.2 quintillion",
    options: ["1 in 1 million", "1 in 1 billion", "1 in 128 trillion", "1 in 9.2 quintillion"],
    correctIndex: 3,
    fact: "Warren Buffett once offered $1 billion for a perfect bracket. Nobody has ever come close to winning it.",
    category: "Sports"
  },
  {
    question: "What is the likelihood of bowling a perfect 300 game?",
    answer: "1 in 11,500",
    options: ["1 in 500", "1 in 11,500", "1 in 100,000", "1 in 5 million"],
    correctIndex: 1,
    fact: "You need 12 consecutive strikes. About 55,000 perfect games are bowled in the US each year — mostly by league bowlers.",
    category: "Sports"
  },
  {
    question: "What is the likelihood of an MLB game being a no-hitter?",
    answer: "About 0.08% per game",
    options: ["About 0.008%", "About 0.08%", "About 0.8%", "About 5%"],
    correctIndex: 1,
    fact: "There have been about 300 no-hitters in MLB history. They average roughly 2 per season across all teams.",
    category: "Sports"
  },
  {
    question: "What is the likelihood of a college basketball player making the NBA?",
    answer: "About 1.2%",
    options: ["About 0.03%", "About 1.2%", "About 10%", "About 25%"],
    correctIndex: 1,
    fact: "Of the roughly 4,500 NCAA Division I players eligible each year, only about 60 get drafted.",
    category: "Sports"
  },
  {
    question: "What is the likelihood of a soccer match ending 0-0?",
    answer: "About 7%",
    options: ["About 1%", "About 7%", "About 20%", "About 35%"],
    correctIndex: 1,
    fact: "The most common soccer score is 1-0, occurring about 20% of the time. A 0-0 draw is less exciting but not uncommon!",
    category: "Sports"
  },
  // WEIRD/FUN
  {
    question: "What is the likelihood of dating a millionaire?",
    answer: "About 1 in 215",
    options: ["1 in 20", "1 in 215", "1 in 5,000", "1 in 50,000"],
    correctIndex: 1,
    fact: "There are about 22 million millionaires in the US alone. The odds are better than you'd think!",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of becoming a movie star?",
    answer: "1 in 1.5 million",
    options: ["1 in 10,000", "1 in 100,000", "1 in 1.5 million", "1 in 100 million"],
    correctIndex: 2,
    fact: "Of the 160,000+ SAG members, only a tiny fraction become household names. Most actors work side jobs!",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of finding money on the ground today?",
    answer: "About 1 in 100",
    options: ["1 in 10", "1 in 100", "1 in 1,000", "1 in 10,000"],
    correctIndex: 1,
    fact: "Studies show the average person finds about $3.50 on the ground per year. Parking lots and sidewalks are your best bet!",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of writing a best-selling novel?",
    answer: "About 1 in 220",
    options: ["1 in 20", "1 in 220", "1 in 10,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "Of the roughly 2 million books published in the US annually, only about 500 make the bestseller lists. But the odds for published authors are better than you'd think!",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of being related to royalty (if European)?",
    answer: "About 1 in 200",
    options: ["1 in 200", "1 in 5,000", "1 in 100,000", "1 in 1 million"],
    correctIndex: 0,
    fact: "Genealogists estimate that most Europeans descend from Charlemagne. Royal bloodlines spread surprisingly wide over centuries!",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of your phone dying at the worst possible moment?",
    answer: "Basically 100% 😂",
    options: ["About 10%", "About 35%", "About 60%", "Basically 100% 😂"],
    correctIndex: 3,
    fact: "Murphy's Law of batteries: your phone will always die when you need it most. Science can't explain it, but we all know it's true.",
    category: "Weird & Fun"
  },
  // BONUS QUESTIONS to reach 50+
  {
    question: "What is the likelihood of winning the Powerball jackpot?",
    answer: "1 in 292.2 million",
    options: ["1 in 1 million", "1 in 50 million", "1 in 292.2 million", "1 in 2 billion"],
    correctIndex: 2,
    fact: "You're about 300 times more likely to be struck by lightning than win the Powerball. Yet Americans spend $80+ billion on lottery tickets annually!",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of being born a twin?",
    answer: "About 3.3%",
    options: ["About 0.5%", "About 3.3%", "About 10%", "About 20%"],
    correctIndex: 1,
    fact: "Twin births have increased 75% since 1980, largely due to fertility treatments. About 1 in 30 births produces twins.",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of a Friday falling on the 13th in any given month?",
    answer: "About 1 in 7",
    options: ["1 in 7", "1 in 12", "1 in 30", "1 in 365"],
    correctIndex: 0,
    fact: "The 13th of the month is actually slightly more likely to be a Friday than any other day due to calendar math!",
    category: "Space & Science"
  },
  {
    question: "What is the likelihood of guessing someone's zodiac sign correctly?",
    answer: "1 in 12",
    options: ["1 in 4", "1 in 12", "1 in 30", "1 in 365"],
    correctIndex: 1,
    fact: "There are 12 zodiac signs, but they aren't equally distributed — some cover more calendar days than others.",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of a US high school football player making the NFL?",
    answer: "About 0.08%",
    options: ["About 0.008%", "About 0.08%", "About 2%", "About 10%"],
    correctIndex: 1,
    fact: "Of the roughly 1 million high school players, only about 250 get drafted each year. The funnel is incredibly narrow.",
    category: "Sports"
  },
  {
    question: "What is the likelihood of being dealt a straight flush in poker?",
    answer: "1 in 72,193",
    options: ["1 in 5,000", "1 in 72,193", "1 in 500,000", "1 in 2 million"],
    correctIndex: 1,
    fact: "A straight flush is any five sequential cards of the same suit. There are 36 possible straight flushes (excluding royal flushes).",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of having AB negative blood type?",
    answer: "About 0.6%",
    options: ["About 0.6%", "About 4%", "About 12%", "About 25%"],
    correctIndex: 0,
    fact: "AB negative is the rarest blood type. Only about 1 in 167 people have it — making them incredibly valuable donors!",
    category: "Human Body"
  },
  {
    question: "What is the likelihood of a bird hitting your car windshield?",
    answer: "About 1 in 5,000 per trip",
    options: ["1 in 50", "1 in 5,000", "1 in 500,000", "1 in 10 million"],
    correctIndex: 1,
    fact: "With billions of birds and millions of cars on the road, bird strikes are more common than you'd think — yet still pretty rare per trip.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of rolling a Yahtzee on your first roll?",
    answer: "1 in 1,296",
    options: ["1 in 6", "1 in 216", "1 in 1,296", "1 in 7,776"],
    correctIndex: 2,
    fact: "All five dice must show the same number. The first die can be anything (6/6), then each subsequent die must match (1/6 each). That's 1/6⁴ = 1/1,296.",
    category: "Weird & Fun"
  },
  {
    question: "What is the likelihood of finding a diamond in nature?",
    answer: "About 1 in 10 million",
    options: ["1 in 1,000", "1 in 100,000", "1 in 10 million", "1 in 1 trillion"],
    correctIndex: 2,
    fact: "Diamonds form 100+ miles below Earth's surface under extreme pressure. Most are over 1 billion years old!",
    category: "Nature & Animals"
  },
  // MIND-BLOWING SCIENCE
  {
    question: "What is the likelihood of you quantum tunneling through a solid wall?",
    answer: "About 1 in 10^30 (essentially zero)",
    options: ["About 1 in 1,000", "About 1 in 1 million", "About 1 in 10^30 (essentially zero)", "About 1 in 10^10"],
    correctIndex: 2,
    fact: "Quantum tunneling is real — particles do it constantly! But for something as big as a human, you'd have to walk into a wall more times than the age of the universe to pass through even once.",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood of all the air molecules in your room randomly gathering in one corner?",
    answer: "Essentially 0% (but not impossible!)",
    options: ["About 5%", "About 0.1%", "1 in 1 million", "Essentially 0% (but not impossible!)"],
    correctIndex: 3,
    fact: "Thermodynamics says it's technically possible, just so unlikely that if you waited the entire age of the universe, it still wouldn't happen. This is called a 'Boltzmann fluctuation.'",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood that you share at least one atom with Julius Caesar?",
    answer: "Nearly 100%",
    options: ["About 0.01%", "About 5%", "About 50%", "Nearly 100%"],
    correctIndex: 3,
    fact: "Every breath you take contains about 1 atom that was once in Caesar's last breath. Atoms get recycled endlessly through the atmosphere over 2,000 years.",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood of a radioactive atom decaying in exactly its half-life period?",
    answer: "Exactly 50%",
    options: ["About 10%", "About 25%", "Exactly 50%", "About 75%"],
    correctIndex: 2,
    fact: "That's literally what 'half-life' means! After one half-life period, there's a 50/50 chance any given atom has decayed. It's beautifully random.",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood that your body is mostly empty space?",
    answer: "99.9999999%",
    options: ["About 50%", "About 80%", "About 95%", "99.9999999%"],
    correctIndex: 3,
    fact: "If you removed all the empty space from every atom in every human on Earth, the remaining matter would fit inside a sugar cube.",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood that a photon of light experiences time?",
    answer: "0% — photons don't experience time",
    options: ["100%", "About 50%", "0% — photons don't experience time", "It depends on the color"],
    correctIndex: 2,
    fact: "According to Einstein's relativity, at the speed of light, time stops completely. From a photon's perspective, it's created and absorbed at the exact same instant, even if it traveled across the entire universe.",
    category: "Mind-Blowing Science"
  },
  // ANIMAL KINGDOM (WEIRD/FUNNY)
  {
    question: "What is the likelihood of a squirrel forgetting where it buried its nuts?",
    answer: "About 74%",
    options: ["About 10%", "About 30%", "About 74%", "About 95%"],
    correctIndex: 2,
    fact: "Squirrels forget the location of roughly 74% of the nuts they bury. This forgetfulness is actually responsible for thousands of new trees growing each year!",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a pet parrot learning to swear?",
    answer: "About 30% of talking parrots",
    options: ["About 1%", "About 10%", "About 30% of talking parrots", "About 80%"],
    correctIndex: 2,
    fact: "Parrots preferentially mimic words spoken with strong emotion — which is exactly why swear words are so easy for them to pick up. One parrot was kicked out of a UK wildlife park for swearing at visitors.",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a goldfish actually having a 3-second memory?",
    answer: "0% — it's a myth! They remember for months",
    options: ["100% — it's true", "About 50%", "0% — it's a myth! They remember for months", "Only in cold water"],
    correctIndex: 2,
    fact: "Goldfish can remember things for at least 5 months! Scientists trained goldfish to push levers for food and they remembered the trick months later.",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a cow having a best friend?",
    answer: "About 100% — almost all cows do",
    options: ["About 5%", "About 25%", "About 60%", "About 100% — almost all cows do"],
    correctIndex: 3,
    fact: "Cows form deep bonds with other cows and become stressed when separated from their best friends. Their heart rates actually increase when they're apart!",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a sea otter holding hands while sleeping?",
    answer: "Very common — about 80%",
    options: ["About 5%", "About 20%", "About 50%", "Very common — about 80%"],
    correctIndex: 3,
    fact: "Sea otters hold hands (paws) while sleeping so they don't drift apart. They also wrap themselves in kelp as an anchor. It's called a 'raft' of otters!",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a mantis shrimp seeing colors humans can't?",
    answer: "100% — they have 16 color receptors",
    options: ["0% — they're colorblind", "About 25%", "100% — they have 16 color receptors", "Only females can"],
    correctIndex: 2,
    fact: "Humans have 3 types of color receptors (cones). Mantis shrimp have 16! They can see ultraviolet and polarized light. They also punch with the force of a .22 caliber bullet.",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a group of flamingos all standing on the same leg at the same time?",
    answer: "About 70%",
    options: ["About 10%", "About 30%", "About 70%", "About 99%"],
    correctIndex: 2,
    fact: "Flamingos stand on one leg to conserve body heat. A dead flamingo can balance on one leg — it's a passive mechanical ability, not muscular effort!",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of a housecat sharing 95% of its DNA with a tiger?",
    answer: "100% — they do",
    options: ["0% — they're too different", "About 50%", "100% — they do", "Only with lions"],
    correctIndex: 2,
    fact: "Your house cat shares 95.6% of its DNA with a tiger. They also share common behaviors like scent marking, prey stalking, and pouncing.",
    category: "Animal Kingdom"
  },
  // FOOD & DRINK
  {
    question: "What is the likelihood of finding a double-yolk egg?",
    answer: "About 1 in 1,000",
    options: ["1 in 50", "1 in 1,000", "1 in 100,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "Double-yolk eggs happen when a hen releases two yolks into the same shell. Young hens whose systems are still calibrating are most likely to produce them!",
    category: "Food & Drink"
  },
  {
    question: "What is the likelihood of honey going bad?",
    answer: "Essentially 0% — honey never expires",
    options: ["After about 1 year", "After about 5 years", "After about 100 years", "Essentially 0% — honey never expires"],
    correctIndex: 3,
    fact: "Archaeologists found 3,000-year-old honey in Egyptian tombs that was still perfectly edible! Honey's low moisture and high acidity make it hostile to bacteria.",
    category: "Food & Drink"
  },
  {
    question: "What is the likelihood that a banana is technically a berry?",
    answer: "100% — bananas are berries",
    options: ["0% — they're fruits", "100% — bananas are berries", "Only wild bananas", "Depends on the species"],
    correctIndex: 1,
    fact: "Botanically, bananas ARE berries, but strawberries, raspberries, and blackberries are NOT. Biology is weird.",
    category: "Food & Drink"
  },
  {
    question: "What is the likelihood of your toast landing butter-side down?",
    answer: "About 62%",
    options: ["Exactly 50%", "About 62%", "About 80%", "About 95%"],
    correctIndex: 1,
    fact: "It's not Murphy's Law — it's physics! Toast slides off a table at a height that gives it just enough time for a half rotation, landing butter-side down. Table height is the culprit.",
    category: "Food & Drink"
  },
  {
    question: "What is the likelihood of a coconut falling on your head (if you live near coconut trees)?",
    answer: "About 1 in 250 million per year",
    options: ["1 in 1,000", "1 in 50,000", "1 in 250 million", "1 in 10 billion"],
    correctIndex: 2,
    fact: "Despite the viral claim that coconuts kill 150 people per year, the actual number is much smaller. Still, they weigh up to 4 pounds and fall from 80+ feet!",
    category: "Food & Drink"
  },
  {
    question: "What is the likelihood of a peanut being technically a nut?",
    answer: "0% — peanuts are legumes",
    options: ["100% — obviously", "0% — peanuts are legumes", "Only raw peanuts", "About 50%"],
    correctIndex: 1,
    fact: "Peanuts grow underground and are legumes, related to lentils and beans. Almonds aren't true nuts either — they're seeds!",
    category: "Food & Drink"
  },
  {
    question: "What is the likelihood of a watermelon being over 90% water?",
    answer: "100% — they're about 92% water",
    options: ["0% — it's about 60%", "About 50%", "100% — they're about 92% water", "Only in summer"],
    correctIndex: 2,
    fact: "Watermelons are 92% water by weight. Cucumbers beat them at 95%! Ancient Egyptians placed watermelons in pharaohs' tombs as a water source for the afterlife.",
    category: "Food & Drink"
  },
  // TECHNOLOGY & INTERNET
  {
    question: "What is the likelihood of your email ending up in someone's spam folder?",
    answer: "About 45%",
    options: ["About 5%", "About 20%", "About 45%", "About 85%"],
    correctIndex: 2,
    fact: "Nearly half of all email sent globally is spam. Gmail alone blocks about 100 million phishing attempts per day!",
    category: "Technology & Internet"
  },
  {
    question: "What is the likelihood of a tweet going viral (1M+ impressions)?",
    answer: "About 1 in 500,000",
    options: ["1 in 1,000", "1 in 50,000", "1 in 500,000", "1 in 50 million"],
    correctIndex: 2,
    fact: "Over 500 million tweets are posted daily. Going viral is like winning a mini-lottery — except the prize is strangers arguing with you.",
    category: "Technology & Internet"
  },
  {
    question: "What is the likelihood of your password being in a known data breach?",
    answer: "About 25% for common passwords",
    options: ["About 1%", "About 25% for common passwords", "About 60%", "About 0.001%"],
    correctIndex: 1,
    fact: "The password '123456' appears in data breaches over 23 million times. Check haveibeenpwned.com to see if your accounts have been exposed!",
    category: "Technology & Internet"
  },
  {
    question: "What is the likelihood of a new app making money in its first year?",
    answer: "About 0.5%",
    options: ["About 0.5%", "About 5%", "About 25%", "About 50%"],
    correctIndex: 0,
    fact: "There are over 5 million apps across app stores. The top 1% of publishers earn 94% of all app revenue. Most apps get fewer than 1,000 downloads ever.",
    category: "Technology & Internet"
  },
  {
    question: "What is the likelihood of a website being hacked in any given year?",
    answer: "About 1 in 25",
    options: ["1 in 1,000", "1 in 25", "1 in 5", "1 in 2"],
    correctIndex: 1,
    fact: "About 30,000 websites are hacked daily worldwide. Small business sites are actually targeted more than big companies because their security is weaker.",
    category: "Technology & Internet"
  },
  {
    question: "What is the likelihood that your phone is listening to you right now?",
    answer: "Technically ~0% (but it feels like 100%)",
    options: ["100% — proven fact", "About 50%", "About 25%", "Technically ~0% (but it feels like 100%)"],
    correctIndex: 3,
    fact: "Studies have consistently shown phones don't secretly record conversations for ads. The real explanation is even creepier: algorithms know you so well they can predict what you'll talk about.",
    category: "Technology & Internet"
  },
  // HISTORY & RECORDS
  {
    question: "What is the likelihood of sharing a birthday with a US president?",
    answer: "About 10%",
    options: ["About 1%", "About 10%", "About 25%", "About 50%"],
    correctIndex: 1,
    fact: "With 46 presidents born on 42 different dates, you have about a 10% chance of sharing a birthday with one. No president has ever been born in June!",
    category: "History & Records"
  },
  {
    question: "What is the likelihood of being born during a total solar eclipse?",
    answer: "About 1 in 4,000",
    options: ["1 in 100", "1 in 4,000", "1 in 100,000", "1 in 10 million"],
    correctIndex: 1,
    fact: "Total solar eclipses happen about every 18 months somewhere on Earth, but they only last 2-7 minutes. Being born in that exact window at that exact location is rare!",
    category: "History & Records"
  },
  {
    question: "What is the likelihood that Shakespeare invented a word you use daily?",
    answer: "Very high — he coined 1,700+ words",
    options: ["Very unlikely — he used old English", "About 10%", "About 30%", "Very high — he coined 1,700+ words"],
    correctIndex: 3,
    fact: "Shakespeare invented words like 'bedroom,' 'lonely,' 'generous,' 'eyeball,' 'gossip,' and 'uncomfortable.' You probably use several of his inventions every single day.",
    category: "History & Records"
  },
  {
    question: "What is the likelihood of Cleopatra living closer in time to the Moon landing than to the building of the Great Pyramid?",
    answer: "100% — it's true",
    options: ["0% — that's absurd", "About 25%", "100% — it's true", "We can't be sure"],
    correctIndex: 2,
    fact: "The Great Pyramid was built around 2560 BC. Cleopatra lived around 30 BC. The Moon landing was 1969 AD. She's 2,530 years from the pyramid but only 1,999 years from the Moon landing!",
    category: "History & Records"
  },
  {
    question: "What is the likelihood that Oxford University is older than the Aztec Empire?",
    answer: "100% — Oxford predates the Aztecs",
    options: ["0% — Aztecs came first", "100% — Oxford predates the Aztecs", "They started the same year", "We don't know"],
    correctIndex: 1,
    fact: "Oxford University started teaching in 1096 AD. The Aztec civilization didn't begin until 1325 AD. Oxford is older by over 200 years!",
    category: "History & Records"
  },
  // HUMAN QUIRKS
  {
    question: "What is the likelihood of talking in your sleep on any given night?",
    answer: "About 5%",
    options: ["About 0.1%", "About 5%", "About 25%", "About 66%"],
    correctIndex: 1,
    fact: "About 66% of people have talked in their sleep at some point, but only about 5% do it regularly. Most sleep talk is gibberish or single words.",
    category: "Human Quirks"
  },
  {
    question: "What is the likelihood of experiencing déjà vu in a given week?",
    answer: "About 30%",
    options: ["About 2%", "About 10%", "About 30%", "About 80%"],
    correctIndex: 2,
    fact: "About 97% of people have experienced déjà vu at least once. It's most common in people aged 15-25 and decreases with age. Scientists still aren't sure why it happens!",
    category: "Human Quirks"
  },
  {
    question: "What is the likelihood of sneezing with your eyes open?",
    answer: "Nearly impossible — reflex closes them",
    options: ["About 50/50", "About 25%", "About 10%", "Nearly impossible — reflex closes them"],
    correctIndex: 3,
    fact: "The eye-closing during a sneeze is an involuntary reflex. Despite the myth, your eyes won't pop out if you manage to keep them open — it's just really hard to override the reflex.",
    category: "Human Quirks"
  },
  {
    question: "What is the likelihood of getting a song stuck in your head today?",
    answer: "About 90%",
    options: ["About 15%", "About 40%", "About 65%", "About 90%"],
    correctIndex: 3,
    fact: "These are called 'earworms.' Studies show 90% of people experience them at least once a week. Songs with simple, repetitive melodies are the worst offenders.",
    category: "Human Quirks"
  },
  {
    question: "What is the likelihood of you swallowing a spider in your sleep this year?",
    answer: "Essentially 0% — it's a myth",
    options: ["About 8 per year", "About 2 per year", "About 1 per year", "Essentially 0% — it's a myth"],
    correctIndex: 3,
    fact: "The 'swallowing 8 spiders a year' statistic was fabricated in 1993 to show how easily fake facts spread on the internet. Spiders avoid sleeping humans — the vibrations scare them!",
    category: "Human Quirks"
  },
  {
    question: "What is the likelihood of a hiccup lasting over an hour?",
    answer: "About 1 in 100",
    options: ["1 in 10", "1 in 100", "1 in 10,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "Charles Osborne hiccupped continuously for 68 years (1922-1990) — the longest case ever recorded. He hiccupped about 430 million times!",
    category: "Human Quirks"
  },
  {
    question: "What is the likelihood of you using only 10% of your brain?",
    answer: "0% — it's a total myth",
    options: ["100% — it's proven", "About 50%", "0% — it's a total myth", "Only when sleeping"],
    correctIndex: 2,
    fact: "Brain scans show we use virtually every part of our brain, and most of the brain is active most of the time. The '10% myth' likely came from a misquote of William James in the 1900s.",
    category: "Human Quirks"
  },
  // POP CULTURE & ENTERTAINMENT
  {
    question: "What is the likelihood of a movie sequel being rated higher than the original?",
    answer: "About 20%",
    options: ["About 5%", "About 20%", "About 50%", "About 75%"],
    correctIndex: 1,
    fact: "Notable exceptions include The Dark Knight, Terminator 2, The Godfather Part II, and Empire Strikes Back. But most sequels suffer from 'sequelitis.'",
    category: "Pop Culture"
  },
  {
    question: "What is the likelihood of a one-hit wonder artist having a second hit?",
    answer: "About 10%",
    options: ["About 2%", "About 10%", "About 35%", "About 60%"],
    correctIndex: 1,
    fact: "Artists like Dexys Midnight Runners ('Come On Eileen') and Soft Cell ('Tainted Love') had successful careers in other countries but are one-hit wonders in the US!",
    category: "Pop Culture"
  },
  {
    question: "What is the likelihood of a Netflix show being renewed for Season 2?",
    answer: "About 50%",
    options: ["About 15%", "About 50%", "About 80%", "About 95%"],
    correctIndex: 1,
    fact: "Netflix cancels roughly half of its original shows after one season. Shows that don't hook viewers in the first episode are especially at risk.",
    category: "Pop Culture"
  },
  {
    question: "What is the likelihood of correctly guessing the winner of the Super Bowl at the start of the season?",
    answer: "About 3% (1 in 32)",
    options: ["About 3% (1 in 32)", "About 10%", "About 25%", "About 50%"],
    correctIndex: 0,
    fact: "With 32 NFL teams, random chance gives you 3.1%. But the favorite at season start wins only about 10-15% of the time — upsets are the norm!",
    category: "Pop Culture"
  },
  // MONEY & LUCK
  {
    question: "What is the likelihood of finding a $100 bill on the ground?",
    answer: "About 1 in 50,000 per year",
    options: ["1 in 100", "1 in 5,000", "1 in 50,000", "1 in 10 million"],
    correctIndex: 2,
    fact: "Most found money is coins or small bills. $100 bills make up only about 3% of money lost. Your best odds are in casino parking lots and ATM vestibules!",
    category: "Money & Luck"
  },
  {
    question: "What is the likelihood of getting exact change back at a store without asking?",
    answer: "About 1 in 200 transactions",
    options: ["1 in 10", "1 in 200", "1 in 5,000", "1 in 100,000"],
    correctIndex: 1,
    fact: "With tax, round-dollar totals are rare. States with no sales tax (like Oregon) have much higher odds of hitting exact change!",
    category: "Money & Luck"
  },
  {
    question: "What is the likelihood of a penny landing on its edge when flipped?",
    answer: "About 1 in 6,000",
    options: ["Completely impossible", "1 in 6,000", "1 in 1 million", "1 in 100 million"],
    correctIndex: 1,
    fact: "Physicist Daniel Murray calculated that an American penny can land on its edge about 1 in 6,000 times when spun on a flat surface. It's rare but very much possible!",
    category: "Money & Luck"
  },
  {
    question: "What is the likelihood of winning a radio call-in contest?",
    answer: "About 1 in 10,000",
    options: ["1 in 50", "1 in 500", "1 in 10,000", "1 in 1 million"],
    correctIndex: 2,
    fact: "Major market radio stations can receive 10,000+ calls in minutes during a contest. Smaller stations with fewer listeners give you much better odds!",
    category: "Money & Luck"
  },
  {
    question: "What is the likelihood of a vending machine giving you a free item by mistake?",
    answer: "About 1 in 400 uses",
    options: ["1 in 20", "1 in 400", "1 in 10,000", "1 in 500,000"],
    correctIndex: 1,
    fact: "Vending machine malfunctions are more common than you'd think — items getting stuck is about 1 in 10, but getting a bonus free item is around 1 in 400.",
    category: "Money & Luck"
  },
  // RANDOM & WILD
  {
    question: "What is the likelihood of two strangers at a party wearing the same outfit?",
    answer: "About 23% (at a party of 30+)",
    options: ["About 2%", "About 23%", "About 50%", "About 75%"],
    correctIndex: 1,
    fact: "Similar to the birthday paradox, the more people present, the more likely a match becomes. Fast fashion makes this even more common since many people shop at the same stores!",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of a traffic light turning green right as you arrive?",
    answer: "About 15%",
    options: ["About 2%", "About 15%", "About 40%", "About 60%"],
    correctIndex: 1,
    fact: "Most traffic lights run on cycles of 60-120 seconds. Your odds of hitting it just right depend on the green phase length divided by the total cycle. It just FEELS like it never happens!",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of your luggage being lost by an airline?",
    answer: "About 0.5% per trip",
    options: ["About 0.01%", "About 0.5%", "About 5%", "About 15%"],
    correctIndex: 1,
    fact: "Airlines mishandle about 5 bags per 1,000 passengers. Most 'lost' bags are actually just delayed and show up within 48 hours. Only about 5% of lost bags are never found.",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of guessing the correct time to the exact minute without checking?",
    answer: "About 1 in 720",
    options: ["1 in 60", "1 in 720", "1 in 1,440", "1 in 10,000"],
    correctIndex: 1,
    fact: "There are 720 minutes in a 12-hour period. Most people can guess the time within 15-30 minutes, but nailing the exact minute is surprisingly hard!",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of your car odometer hitting all the same digits (like 111,111)?",
    answer: "Guaranteed — if you drive enough!",
    options: ["1 in 10,000", "1 in 100,000", "About 50%", "Guaranteed — if you drive enough!"],
    correctIndex: 3,
    fact: "A 6-digit odometer will hit 111111, 222222, etc. — there are 9 such milestones. The real challenge is actually catching it happen! Many people set up cameras on their dash.",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of dreaming about something that happens the next day?",
    answer: "About 30% report this happening",
    options: ["About 1%", "About 10%", "About 30% report this happening", "About 80%"],
    correctIndex: 2,
    fact: "This is called a 'precognitive dream,' but it's actually just confirmation bias and probability. You have ~5 dreams per night and forget most. You only remember the ones that match reality!",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of a cat choosing to sit on your laptop over an empty chair?",
    answer: "About 80%",
    options: ["About 20%", "About 50%", "About 80%", "About 99%"],
    correctIndex: 2,
    fact: "Cats are attracted to laptops for warmth, attention-seeking, and scent marking. Studies show cats preferentially sit on objects their owners are actively using!",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of a USB plug being inserted correctly on the first try?",
    answer: "About 50% (but it feels like 10%)",
    options: ["About 10%", "About 25%", "About 50% (but it feels like 10%)", "About 75%"],
    correctIndex: 2,
    fact: "USB-A connectors have a 50/50 chance since there are only 2 orientations. The phenomenon of always getting it wrong first is so famous that engineers call it 'USB Superposition.'",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood that a coconut crab can open a coconut by itself?",
    answer: "100% — that's literally what they do",
    options: ["About 5%", "About 30%", "About 60%", "100% — that's literally what they do"],
    correctIndex: 3,
    fact: "Coconut crabs have the strongest grip of any crustacean — about 740 pounds of force. They can climb trees, crack coconuts, and they've been known to steal camping supplies!",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of your birthday falling on the same day of the week two years in a row?",
    answer: "0% (except leap year transitions)",
    options: ["100% — it always does", "About 50%", "About 14%", "0% (except leap year transitions)"],
    correctIndex: 3,
    fact: "Each year, dates shift forward by 1 day of the week (or 2 after a leap year). So your birthday is always on a different day next year — unless a leap day intervenes!",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood of a monkey randomly typing Shakespeare?",
    answer: "Essentially 0% (1 in 10^183,946)",
    options: ["About 1 in 1 billion", "1 in 10^100", "Essentially 0% (1 in 10^183,946)", "Given enough time, 100%"],
    correctIndex: 2,
    fact: "The 'infinite monkey theorem' says it's theoretically possible given infinite time, but the actual probability is so small that the universe would end trillions of times over first.",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood of an astronaut growing taller in space?",
    answer: "100% — astronauts grow up to 2 inches",
    options: ["0% — height is fixed", "About 25%", "100% — astronauts grow up to 2 inches", "Only on long missions"],
    correctIndex: 2,
    fact: "Without gravity compressing the spine, astronauts grow 1-2 inches in space. They shrink back within a few days of returning to Earth!",
    category: "Mind-Blowing Science"
  },
  {
    question: "What is the likelihood of finding a message in a bottle?",
    answer: "About 1 in 5,000 bottles are found",
    options: ["1 in 100", "1 in 5,000", "1 in 1 million", "1 in 100 million"],
    correctIndex: 1,
    fact: "The longest time a message in a bottle has survived at sea is 131 years! It was thrown into the North Sea in 1886 and found on a beach in 2017.",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of a slot machine hitting the jackpot?",
    answer: "About 1 in 50 million",
    options: ["1 in 1,000", "1 in 100,000", "1 in 50 million", "1 in 1 billion"],
    correctIndex: 2,
    fact: "Modern slot machines use random number generators cycling through billions of combinations. The 'near miss' effect is intentionally designed to keep you playing!",
    category: "Money & Luck"
  },
  {
    question: "What is the likelihood of a dog actually understanding your words (not just tone)?",
    answer: "They understand about 89 words on average",
    options: ["0 words — it's all tone", "About 10 words", "About 89 words on average", "About 500 words"],
    correctIndex: 2,
    fact: "A 2022 study found dogs understand an average of 89 words and phrases. The smartest dogs understood over 200. 'Sit,' 'walk,' and 'treat' are the most universally understood!",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood of rain being predicted correctly by weather forecasts?",
    answer: "About 80% accurate",
    options: ["About 40%", "About 60%", "About 80%", "About 99%"],
    correctIndex: 2,
    fact: "Modern weather forecasting is about 80% accurate for the next day, dropping to about 50% for 10 days out. Your trick knee is NOT more accurate than meteorologists!",
    category: "Random & Wild"
  },
  {
    question: "What is the likelihood of a Pixar movie making you cry?",
    answer: "About 75% according to surveys",
    options: ["About 20%", "About 45%", "About 75%", "About 99%"],
    correctIndex: 2,
    fact: "The opening of 'Up' consistently ranks as one of the most emotionally devastating scenes in cinema history. Pixar story artists specifically design 'cry beats' into their films.",
    category: "Pop Culture"
  },
  {
    question: "What is the likelihood of a chicken living without its head?",
    answer: "Rare, but it's happened for 18 months",
    options: ["Completely impossible", "A few seconds at most", "Rare, but it's happened for 18 months", "Very common — about 30%"],
    correctIndex: 2,
    fact: "Mike the Headless Chicken survived for 18 months after being decapitated in 1945! His brain stem was intact enough to keep basic functions going. He became a sideshow celebrity.",
    category: "Animal Kingdom"
  },
  {
    question: "What is the likelihood that there are more possible chess games than atoms in the universe?",
    answer: "100% — it's true",
    options: ["0% — that's impossible", "About 50/50", "100% — it's true", "Only theoretically"],
    correctIndex: 2,
    fact: "The Shannon number estimates 10^120 possible chess games. There are only about 10^80 atoms in the observable universe. Chess is unfathomably complex!",
    category: "Mind-Blowing Science"
  }
];
