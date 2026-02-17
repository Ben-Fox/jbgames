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
    question: "What is the likelihood of seeing a rainbow on any given day?",
    answer: "About 5%",
    options: ["About 0.5%", "About 5%", "About 20%", "About 40%"],
    correctIndex: 1,
    fact: "You need sun behind you and rain in front of you at a 42° angle. Double rainbows happen about 10% of the time you see one!",
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
    question: "What is the likelihood of spotting a wild dolphin on a beach visit?",
    answer: "About 15%",
    options: ["About 2%", "About 15%", "About 40%", "About 70%"],
    correctIndex: 1,
    fact: "Dolphins live in every ocean and often swim close to shore. Your best odds are early morning or late afternoon!",
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
    question: "What is the likelihood of a butterfly landing on you?",
    answer: "About 1 in 3,000 per outdoor hour",
    options: ["1 in 100", "1 in 3,000", "1 in 100,000", "1 in 1 million"],
    correctIndex: 1,
    fact: "Butterflies are attracted to bright colors and salt from sweat. Standing still in a garden wearing a red shirt? Your odds go way up!",
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
  }
];
