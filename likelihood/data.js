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
    question: "What is the likelihood of being struck by a falling coconut?",
    answer: "1 in 250 million",
    options: ["1 in 50,000", "1 in 5 million", "1 in 250 million", "1 in 1 billion"],
    correctIndex: 2,
    fact: "Despite the urban legend, coconuts do kill about 150 people per year — more than sharks!",
    category: "Everyday Life"
  },
  {
    question: "What is the likelihood of dying in a plane crash?",
    answer: "1 in 11 million",
    options: ["1 in 50,000", "1 in 500,000", "1 in 11 million", "1 in 1 billion"],
    correctIndex: 2,
    fact: "Flying is statistically the safest form of transportation. You're far more likely to die driving to the airport.",
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
    question: "What is the likelihood of being attacked by a shark?",
    answer: "1 in 3.7 million",
    options: ["1 in 10,000", "1 in 250,000", "1 in 3.7 million", "1 in 500 million"],
    correctIndex: 2,
    fact: "You're more likely to be killed by a cow than a shark. There are only about 70 unprovoked shark attacks worldwide per year.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of being bitten by a snake in a given year?",
    answer: "1 in 37,500",
    options: ["1 in 500", "1 in 37,500", "1 in 1 million", "1 in 50 million"],
    correctIndex: 1,
    fact: "About 7,000-8,000 people are bitten by venomous snakes in the US annually, but only about 5 die.",
    category: "Nature & Animals"
  },
  {
    question: "What is the likelihood of a meteor hitting your house?",
    answer: "1 in 182 trillion",
    options: ["1 in 1 million", "1 in 1 billion", "1 in 182 trillion", "1 in 500,000"],
    correctIndex: 2,
    fact: "In 1954, Ann Hodges of Alabama was hit by a meteorite that crashed through her roof — the only confirmed case!",
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
    fact: "This includes indirect hits from meteor airbursts. A meteorite landing directly on you is far less likely.",
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
    question: "What is the likelihood of Earth being hit by a civilization-ending asteroid this year?",
    answer: "1 in 300,000",
    options: ["1 in 1,000", "1 in 300,000", "1 in 100 million", "1 in 10 billion"],
    correctIndex: 1,
    fact: "NASA's Planetary Defense office tracks near-Earth objects. The last major impact was 66 million years ago — the one that killed the dinosaurs.",
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
    question: "What is the likelihood of being killed by a vending machine?",
    answer: "1 in 112 million",
    options: ["1 in 100,000", "1 in 5 million", "1 in 112 million", "1 in 10 billion"],
    correctIndex: 2,
    fact: "About 2-3 people die annually from vending machine tip-overs. That's roughly twice the number killed by sharks in the US!",
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
