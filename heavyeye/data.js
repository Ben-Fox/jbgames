// HeavyEye — Comparison Data
// Each entry: { a: {name, detail, emoji, weight_lbs, fun_fact}, b: {...}, ratio }
// ratio = lighter / heavier (0.05 = very easy, 0.95 = nearly impossible)

const CAMPAIGN_ROUNDS = [
    // Round 1: EASY — ratio 0.01-0.25 (one is dramatically heavier)
    [
        {
            a: { name: "A Bowling Ball", detail: "Standard 16-pounder", emoji: "🎳", weight_lbs: 16, fun_fact: "A regulation bowling ball has a maximum weight of 16 lbs" },
            b: { name: "A Golden Retriever", detail: "Adult, healthy boy", emoji: "🐕", weight_lbs: 70, fun_fact: "Golden Retrievers were originally bred in Scotland in the 1860s" },
            ratio: 0.23
        },
        {
            a: { name: "An Elephant's Heart", detail: "African elephant", emoji: "❤️", weight_lbs: 46, fun_fact: "An elephant's heart beats about 30 times per minute" },
            b: { name: "A Chihuahua", detail: "Tiny but fierce", emoji: "🐕", weight_lbs: 5, fun_fact: "Chihuahuas have the largest brain-to-body ratio of any dog" },
            ratio: 0.11
        },
        {
            a: { name: "A Gallon of Honey", detail: "Pure, raw honey", emoji: "🍯", weight_lbs: 12, fun_fact: "Honey never spoils — 3000-year-old honey from Egypt was still edible" },
            b: { name: "A Bag of Feathers", detail: "1,000 feathers", emoji: "🪶", weight_lbs: 0.7, fun_fact: "It takes about 1,000 goose feathers to equal one pound" },
            ratio: 0.06
        },
        {
            a: { name: "The Statue of Liberty's Nose", detail: "Just the nose", emoji: "🗽", weight_lbs: 150, fun_fact: "Lady Liberty's nose is 4 feet 6 inches long" },
            b: { name: "A Baby Grand Piano", detail: "With bench", emoji: "🎹", weight_lbs: 650, fun_fact: "The first piano was invented in Italy around 1700" },
            ratio: 0.23
        },
        // NEW entries below
        {
            a: { name: "A School Bus", detail: "Empty, Type C", emoji: "🚌", weight_lbs: 24000, fun_fact: "About 480,000 school buses operate in the US every day" },
            b: { name: "A Blue Whale's Heart", detail: "The heart alone", emoji: "❤️", weight_lbs: 880, fun_fact: "A blue whale's heart is the size of a golf cart" },
            ratio: 0.04
        },
        {
            a: { name: "A Hippo", detail: "Adult male", emoji: "🦛", weight_lbs: 4000, fun_fact: "Hippos can hold their breath underwater for up to 5 minutes" },
            b: { name: "A Hummingbird", detail: "Ruby-throated", emoji: "🐦", weight_lbs: 0.011, fun_fact: "Hummingbirds can fly backwards and upside down" },
            ratio: 0.000003
        },
        {
            a: { name: "A King-Size Mattress", detail: "Memory foam", emoji: "🛏️", weight_lbs: 130, fun_fact: "The average person spends 26 years of their life sleeping" },
            b: { name: "A Hamster", detail: "Syrian hamster", emoji: "🐹", weight_lbs: 0.35, fun_fact: "Hamsters can run up to 8 miles per night on their wheel" },
            ratio: 0.003
        },
        {
            a: { name: "A Giraffe", detail: "Adult male", emoji: "🦒", weight_lbs: 2800, fun_fact: "A giraffe's neck contains the same number of vertebrae as a human's — just seven" },
            b: { name: "A Basketball", detail: "Official NBA size", emoji: "🏀", weight_lbs: 1.4, fun_fact: "An NBA basketball must bounce to 52-56 inches when dropped from 6 feet" },
            ratio: 0.0005
        },
        {
            a: { name: "A Refrigerator", detail: "Standard side-by-side", emoji: "🧊", weight_lbs: 300, fun_fact: "The first household refrigerator cost $714 in 1913 — about $22,000 today" },
            b: { name: "A Loaf of Bread", detail: "Sliced white bread", emoji: "🍞", weight_lbs: 1.3, fun_fact: "Sliced bread was first sold in 1928 in Chillicothe, Missouri" },
            ratio: 0.004
        },
        {
            a: { name: "A Grand Piano", detail: "Steinway Model D", emoji: "🎹", weight_lbs: 990, fun_fact: "A Steinway grand piano has over 12,000 individual parts" },
            b: { name: "A Cat", detail: "Average domestic cat", emoji: "🐱", weight_lbs: 10, fun_fact: "Cats spend about 70% of their lives sleeping" },
            ratio: 0.01
        },
        {
            a: { name: "A Grizzly Bear", detail: "Adult male", emoji: "🐻", weight_lbs: 600, fun_fact: "Grizzlies can run up to 35 mph — faster than a racehorse in short sprints" },
            b: { name: "A Skateboard", detail: "Standard deck", emoji: "🛹", weight_lbs: 8, fun_fact: "The longest skateboard ride ever was over 7,555 miles across Australia" },
            ratio: 0.01
        },
        {
            a: { name: "A Canoe", detail: "16-foot aluminum", emoji: "🛶", weight_lbs: 70, fun_fact: "The oldest known canoe is over 8,000 years old, found in the Netherlands" },
            b: { name: "A Smartphone", detail: "iPhone 15 Pro", emoji: "📱", weight_lbs: 0.44, fun_fact: "The average person touches their phone over 2,600 times a day" },
            ratio: 0.006
        },
        {
            a: { name: "A Polar Bear", detail: "Adult male", emoji: "🐻‍❄️", weight_lbs: 1200, fun_fact: "Polar bear fur is actually transparent, not white — it reflects light" },
            b: { name: "A Turkey", detail: "Thanksgiving-sized", emoji: "🦃", weight_lbs: 30, fun_fact: "Benjamin Franklin wanted the turkey, not the bald eagle, as the national bird" },
            ratio: 0.025
        },
        {
            a: { name: "A Bathtub Full of Water", detail: "Standard 60-gallon tub", emoji: "🛁", weight_lbs: 500, fun_fact: "Archimedes discovered buoyancy while getting into a bath" },
            b: { name: "A Chicken Egg", detail: "Large egg", emoji: "🥚", weight_lbs: 0.14, fun_fact: "A hen turns her egg about 50 times per day to prevent the yolk from sticking" },
            ratio: 0.0003
        },
        {
            a: { name: "A Vending Machine", detail: "Fully stocked", emoji: "🏧", weight_lbs: 900, fun_fact: "Vending machines kill about 2 people per year — more than sharks in some years" },
            b: { name: "A Pineapple", detail: "Large Hawaiian", emoji: "🍍", weight_lbs: 4, fun_fact: "A pineapple takes about 2-3 years to grow" },
            ratio: 0.004
        }
    ],

    // Round 2: MODERATE — ratio 0.25-0.55
    [
        {
            a: { name: "10,000 Pennies", detail: "Stacked in towers", emoji: "🪙", weight_lbs: 55, fun_fact: "10,000 pennies = $100, and would stack about 50 feet high" },
            b: { name: "A Dalmatian", detail: "Fully grown, spotted", emoji: "🐕‍🦺", weight_lbs: 55, fun_fact: "Dalmatian puppies are born completely white — spots appear later" },
            ratio: 1.0
        },
        {
            a: { name: "A Cubic Foot of Gold", detail: "Pure 24K gold", emoji: "🥇", weight_lbs: 1206, fun_fact: "All the gold ever mined would fit in about 3.5 Olympic swimming pools" },
            b: { name: "A Horse", detail: "Average thoroughbred", emoji: "🐴", weight_lbs: 1100, fun_fact: "Horses can sleep both lying down and standing up" },
            ratio: 0.91
        },
        {
            a: { name: "100 Bricks", detail: "Standard red clay", emoji: "🧱", weight_lbs: 500, fun_fact: "The Great Wall of China used approximately 3.8 billion bricks" },
            b: { name: "A Baby Grand Piano", detail: "Baby grand", emoji: "🎹", weight_lbs: 600, fun_fact: "A baby grand piano has about 230 strings inside" },
            ratio: 0.83
        },
        // NEW entries below
        {
            a: { name: "A Human Brain", detail: "Average adult", emoji: "🧠", weight_lbs: 3, fun_fact: "Your brain uses 20% of your body's total energy despite being 2% of its weight" },
            b: { name: "A Gallon of Milk", detail: "Whole milk", emoji: "🥛", weight_lbs: 8.6, fun_fact: "The average American drinks about 18 gallons of milk per year" },
            ratio: 0.35
        },
        {
            a: { name: "A Million Ants", detail: "Fire ants", emoji: "🐜", weight_lbs: 6.6, fun_fact: "Ants can carry 10-50 times their own body weight" },
            b: { name: "A House Cat", detail: "Average domestic", emoji: "🐱", weight_lbs: 10, fun_fact: "A group of cats is called a clowder" },
            ratio: 0.66
        },
        {
            a: { name: "The Mona Lisa", detail: "With frame", emoji: "🖼️", weight_lbs: 18, fun_fact: "The Mona Lisa was stolen from the Louvre in 1911 and was missing for 2 years" },
            b: { name: "A Bowling Ball", detail: "Heaviest regulation", emoji: "🎳", weight_lbs: 16, fun_fact: "Professional bowlers can spin the ball at up to 600 RPM" },
            ratio: 0.89
        },
        {
            a: { name: "An Ostrich Egg", detail: "Largest bird egg", emoji: "🥚", weight_lbs: 3.1, fun_fact: "An ostrich egg is equivalent to about 24 chicken eggs" },
            b: { name: "A Newborn Baby", detail: "Average at birth", emoji: "👶", weight_lbs: 7.5, fun_fact: "Babies are born with 300 bones — adults have only 206" },
            ratio: 0.41
        },
        {
            a: { name: "A Bicycle", detail: "Road bike", emoji: "🚲", weight_lbs: 18, fun_fact: "There are about 1 billion bicycles in the world — twice as many as cars" },
            b: { name: "A Large Dog Crate", detail: "Wire crate, XL", emoji: "📦", weight_lbs: 45, fun_fact: "The first dog crate patent was filed in 1966" },
            ratio: 0.40
        },
        {
            a: { name: "A Bald Eagle", detail: "Adult female (larger)", emoji: "🦅", weight_lbs: 12, fun_fact: "A bald eagle's nest can weigh over 2 tons after years of use" },
            b: { name: "A Thanksgiving Turkey", detail: "Cooked, 20 lbs raw", emoji: "🦃", weight_lbs: 20, fun_fact: "Americans eat about 46 million turkeys on Thanksgiving" },
            ratio: 0.60
        },
        {
            a: { name: "A Microwave Oven", detail: "Countertop model", emoji: "📻", weight_lbs: 30, fun_fact: "The microwave was invented by accident when a radar engineer's chocolate bar melted" },
            b: { name: "A Toilet", detail: "Standard porcelain", emoji: "🚽", weight_lbs: 96, fun_fact: "The average person spends about 3 years of their life on the toilet" },
            ratio: 0.31
        },
        {
            a: { name: "A Sword", detail: "Medieval longsword", emoji: "⚔️", weight_lbs: 3.5, fun_fact: "Medieval swords weighed only 2.5-4 lbs — far lighter than movies suggest" },
            b: { name: "A Laptop", detail: "15-inch MacBook Pro", emoji: "💻", weight_lbs: 4.8, fun_fact: "The first laptop, the Osborne 1, weighed 24.5 lbs" },
            ratio: 0.73
        },
        {
            a: { name: "An Acoustic Guitar", detail: "Full-size dreadnought", emoji: "🎸", weight_lbs: 5, fun_fact: "The oldest known guitar-like instrument is over 3,500 years old" },
            b: { name: "A Fire Extinguisher", detail: "Standard ABC type", emoji: "🧯", weight_lbs: 18, fun_fact: "The first fire extinguisher was patented in 1723" },
            ratio: 0.28
        },
        {
            a: { name: "An Anvil", detail: "Blacksmith's anvil", emoji: "⚒️", weight_lbs: 150, fun_fact: "A quality anvil can last over 100 years with daily use" },
            b: { name: "A Kangaroo", detail: "Adult male red kangaroo", emoji: "🦘", weight_lbs: 200, fun_fact: "Kangaroos can't walk backwards — that's why they're on Australia's coat of arms" },
            ratio: 0.75
        },
        {
            a: { name: "A Car Battery", detail: "12V lead-acid", emoji: "🔋", weight_lbs: 40, fun_fact: "The average car battery lasts about 3-5 years" },
            b: { name: "A Bulldog", detail: "English Bulldog", emoji: "🐕", weight_lbs: 50, fun_fact: "English Bulldogs can't swim — their heavy heads pull them under" },
            ratio: 0.80
        },
        {
            a: { name: "A Manhole Cover", detail: "Standard cast iron", emoji: "⭕", weight_lbs: 250, fun_fact: "Manhole covers are round so they can't fall through the hole" },
            b: { name: "A Gorilla", detail: "Adult male silverback", emoji: "🦍", weight_lbs: 400, fun_fact: "Gorillas share 98.3% of their DNA with humans" },
            ratio: 0.63
        }
    ],

    // Round 3: HARD — ratio 0.55-0.75
    [
        {
            a: { name: "20 Tungsten Cubes", detail: "4 inch × 4 inch × 4 inch each", emoji: "🔲", weight_lbs: 230, fun_fact: "Tungsten has the highest melting point of any element: 6,192°F" },
            b: { name: "An Adult Male Lion", detail: "King of the jungle", emoji: "🦁", weight_lbs: 420, fun_fact: "A lion's roar can be heard from 5 miles away" },
            ratio: 0.55
        },
        {
            a: { name: "A Cloud", detail: "Average cumulus cloud", emoji: "☁️", weight_lbs: 1100000, fun_fact: "An average cloud weighs 1.1 million lbs — the water is just very spread out" },
            b: { name: "100 Elephants", detail: "African elephants", emoji: "🐘", weight_lbs: 1400000, fun_fact: "An African elephant weighs about 14,000 lbs" },
            ratio: 0.79
        },
        {
            a: { name: "ISS Solar Panels", detail: "All 8 arrays", emoji: "☀️", weight_lbs: 55000, fun_fact: "The ISS solar arrays could cover half a football field" },
            b: { name: "A Semi Truck", detail: "Fully loaded 18-wheeler", emoji: "🚛", weight_lbs: 80000, fun_fact: "A loaded semi can take the length of 2 football fields to stop from 65 mph" },
            ratio: 0.69
        },
        {
            a: { name: "An Aircraft Carrier", detail: "USS Gerald Ford", emoji: "🚢", weight_lbs: 200000000, fun_fact: "The USS Gerald Ford cost $13 billion — the most expensive warship ever" },
            b: { name: "20,000 Elephants", detail: "African elephants", emoji: "🐘", weight_lbs: 280000000, fun_fact: "There are only about 415,000 African elephants left in the wild" },
            ratio: 0.71
        },
        // NEW entries below
        {
            a: { name: "A Harley-Davidson", detail: "Road King motorcycle", emoji: "🏍️", weight_lbs: 800, fun_fact: "Harley-Davidson started in a 10×15 foot wooden shed in 1903" },
            b: { name: "A Grand Piano", detail: "Steinway concert grand", emoji: "🎹", weight_lbs: 990, fun_fact: "Steinway uses 17 coats of lacquer on each piano" },
            ratio: 0.81
        },
        {
            a: { name: "A Moose", detail: "Adult bull moose", emoji: "🫎", weight_lbs: 1500, fun_fact: "Moose can dive up to 20 feet underwater to eat aquatic plants" },
            b: { name: "A Smart Car", detail: "Smart ForTwo", emoji: "🚗", weight_lbs: 2050, fun_fact: "A Smart ForTwo is shorter than some pickup truck beds" },
            ratio: 0.73
        },
        {
            a: { name: "A Crocodile", detail: "Saltwater croc, adult male", emoji: "🐊", weight_lbs: 1000, fun_fact: "Saltwater crocodiles have the strongest bite ever measured — 3,700 PSI" },
            b: { name: "A Holstein Cow", detail: "Dairy cow", emoji: "🐄", weight_lbs: 1500, fun_fact: "Cows have best friends and get stressed when separated" },
            ratio: 0.67
        },
        {
            a: { name: "A Suit of Medieval Armor", detail: "Full plate armor", emoji: "⚔️", weight_lbs: 55, fun_fact: "Knights could do cartwheels and mount horses in full plate armor" },
            b: { name: "A Large Suitcase", detail: "Fully packed for vacation", emoji: "🧳", weight_lbs: 50, fun_fact: "Airlines lose about 25 million bags per year worldwide" },
            ratio: 0.91
        },
        {
            a: { name: "A Wrecking Ball", detail: "Standard demolition ball", emoji: "⚫", weight_lbs: 3000, fun_fact: "Wrecking balls are being replaced by hydraulic excavators in most demolition" },
            b: { name: "A Rhinoceros", detail: "White rhino, adult", emoji: "🦏", weight_lbs: 5000, fun_fact: "Rhino horns are made of keratin — the same protein as human fingernails" },
            ratio: 0.60
        },
        {
            a: { name: "A Hot Tub Full of Water", detail: "400-gallon spa", emoji: "🛁", weight_lbs: 3340, fun_fact: "The oldest known hot tubs were natural hot springs used 5,000 years ago" },
            b: { name: "A Ford F-150", detail: "2024 model, empty", emoji: "🛻", weight_lbs: 4700, fun_fact: "The F-150 has been America's best-selling truck for 47 years" },
            ratio: 0.71
        },
        {
            a: { name: "A Tiger", detail: "Adult male Bengal tiger", emoji: "🐅", weight_lbs: 500, fun_fact: "No two tigers have the same stripe pattern — they're like fingerprints" },
            b: { name: "A Grand Piano", detail: "Yamaha C7 concert grand", emoji: "🎹", weight_lbs: 849, fun_fact: "Yamaha started as an organ repair shop in 1887" },
            ratio: 0.59
        },
        {
            a: { name: "A Panda", detail: "Giant panda, adult", emoji: "🐼", weight_lbs: 250, fun_fact: "Pandas spend 10-16 hours a day eating bamboo" },
            b: { name: "A Vending Machine", detail: "Empty, no drinks", emoji: "🏧", weight_lbs: 400, fun_fact: "Japan has one vending machine for every 23 people" },
            ratio: 0.63
        },
        {
            a: { name: "An Olympic Barbell", detail: "Loaded for deadlift record", emoji: "🏋️", weight_lbs: 1105, fun_fact: "The world record deadlift is 1,104.5 lbs by Hafthor Björnsson" },
            b: { name: "A Grand Piano", detail: "Bösendorfer Imperial", emoji: "🎹", weight_lbs: 1320, fun_fact: "The Bösendorfer Imperial has 97 keys instead of the standard 88" },
            ratio: 0.84
        },
        {
            a: { name: "A Kayak", detail: "Tandem sea kayak", emoji: "🛶", weight_lbs: 65, fun_fact: "Kayaks were invented by the Inuit people over 4,000 years ago" },
            b: { name: "A Washing Machine", detail: "Front-load washer", emoji: "🧺", weight_lbs: 100, fun_fact: "The average American household does about 300 loads of laundry per year" },
            ratio: 0.65
        },
        {
            a: { name: "A Great Dane", detail: "Adult male", emoji: "🐕", weight_lbs: 170, fun_fact: "The tallest dog ever recorded was a Great Dane standing 44 inches at the shoulder" },
            b: { name: "A Reindeer", detail: "Adult male", emoji: "🦌", weight_lbs: 300, fun_fact: "Reindeer are the only deer species where both males and females grow antlers" },
            ratio: 0.57
        }
    ],

    // Round 4: VERY HARD — ratio 0.75-0.92
    [
        {
            a: { name: "A Blue Whale's Tongue", detail: "Yes, just the tongue", emoji: "👅", weight_lbs: 5400, fun_fact: "A blue whale's tongue weighs as much as an elephant" },
            b: { name: "A Ford F-150", detail: "2024 model, empty", emoji: "🛻", weight_lbs: 4700, fun_fact: "The F-150 has been America's best-selling truck for 47 years" },
            ratio: 0.87
        },
        {
            a: { name: "A Car Tire", detail: "Standard sedan tire", emoji: "🛞", weight_lbs: 25, fun_fact: "The average tire loses about 1/32 of an inch of tread per 8,000 miles" },
            b: { name: "A Watermelon", detail: "Big summer melon", emoji: "🍉", weight_lbs: 22, fun_fact: "Watermelons are 92% water and are technically berries" },
            ratio: 0.88
        },
        {
            a: { name: "A Grand Piano", detail: "Steinway Model D", emoji: "🎹", weight_lbs: 990, fun_fact: "A Steinway grand piano has over 12,000 individual parts" },
            b: { name: "A Horse", detail: "Average thoroughbred", emoji: "🐴", weight_lbs: 1100, fun_fact: "Horses can sleep both lying down and standing up" },
            ratio: 0.90
        },
        {
            a: { name: "A Liter of Mercury", detail: "Liquid metal", emoji: "🪩", weight_lbs: 29.8, fun_fact: "Mercury is the only metal that's liquid at room temperature" },
            b: { name: "A Liter of Lead (melted)", detail: "Molten lead", emoji: "🫠", weight_lbs: 24.9, fun_fact: "Ancient Romans used lead pipes for plumbing — the word 'plumbing' comes from 'plumbum' (Latin for lead)" },
            ratio: 0.84
        },
        // NEW entries below
        {
            a: { name: "A Human Skeleton", detail: "Adult, dried bones", emoji: "💀", weight_lbs: 21, fun_fact: "Your skeleton replaces itself completely about every 10 years" },
            b: { name: "A Full Carry-On Bag", detail: "Airline maximum", emoji: "🧳", weight_lbs: 22, fun_fact: "Carry-on size limits vary by airline — some allow only 15 lbs" },
            ratio: 0.95
        },
        {
            a: { name: "A Dolphin", detail: "Bottlenose, adult", emoji: "🐬", weight_lbs: 600, fun_fact: "Dolphins sleep with one eye open — half their brain stays awake" },
            b: { name: "A Grizzly Bear", detail: "Adult male", emoji: "🐻", weight_lbs: 600, fun_fact: "Grizzly bears can eat 90 lbs of food per day before hibernation" },
            ratio: 1.0
        },
        {
            a: { name: "A Llama", detail: "Adult male", emoji: "🦙", weight_lbs: 350, fun_fact: "Llamas are used as therapy animals in hospitals and nursing homes" },
            b: { name: "A Male Lion", detail: "Adult African lion", emoji: "🦁", weight_lbs: 420, fun_fact: "Lions spend about 20 hours a day resting" },
            ratio: 0.83
        },
        {
            a: { name: "A Tesla Model 3", detail: "Long Range version", emoji: "🚗", weight_lbs: 4034, fun_fact: "The Model 3's battery pack alone weighs about 1,060 lbs" },
            b: { name: "A Ford F-150", detail: "Standard gasoline model", emoji: "🛻", weight_lbs: 4700, fun_fact: "Over 40 million F-150s have been sold since 1948" },
            ratio: 0.86
        },
        {
            a: { name: "The Average American Man", detail: "5'9\", average weight", emoji: "🧑", weight_lbs: 200, fun_fact: "The average American man weighs 30 lbs more than in the 1960s" },
            b: { name: "A Baby Giraffe", detail: "Newborn", emoji: "🦒", weight_lbs: 150, fun_fact: "Baby giraffes drop 6 feet to the ground at birth and can stand within 30 minutes" },
            ratio: 0.75
        },
        {
            a: { name: "A Wine Barrel", detail: "Full, Bordeaux barrel", emoji: "🛢️", weight_lbs: 520, fun_fact: "A standard Bordeaux barrel holds about 60 gallons or 300 bottles of wine" },
            b: { name: "An Elk", detail: "Adult male (bull)", emoji: "🦌", weight_lbs: 700, fun_fact: "Elk antlers can grow up to 1 inch per day — the fastest-growing bone" },
            ratio: 0.74
        },
        {
            a: { name: "A Cello", detail: "Professional, with case", emoji: "🎻", weight_lbs: 15, fun_fact: "A fine cello by Stradivari sold for $20 million in 2012" },
            b: { name: "A Car Tire", detail: "Standard sedan tire", emoji: "🛞", weight_lbs: 25, fun_fact: "About 1 billion tires are produced worldwide every year" },
            ratio: 0.60
        },
        {
            a: { name: "A Dishwasher", detail: "Built-in, standard", emoji: "🍽️", weight_lbs: 77, fun_fact: "The first dishwasher was patented in 1886 by Josephine Cochrane" },
            b: { name: "A Clothes Dryer", detail: "Standard electric", emoji: "🧺", weight_lbs: 100, fun_fact: "Americans spend about $9 billion per year on energy for clothes dryers" },
            ratio: 0.77
        },
        {
            a: { name: "A Pig", detail: "Adult domestic pig", emoji: "🐷", weight_lbs: 250, fun_fact: "Pigs are smarter than dogs and can learn their name within the first 2 weeks of life" },
            b: { name: "A Reindeer", detail: "Adult male", emoji: "🦌", weight_lbs: 300, fun_fact: "Reindeer noses warm incoming cold air before it reaches the lungs" },
            ratio: 0.83
        },
        {
            a: { name: "A Snowmobile", detail: "Recreational model", emoji: "🏂", weight_lbs: 500, fun_fact: "The first snowmobile was patented in 1937 by Joseph-Armand Bombardier" },
            b: { name: "A Harley-Davidson", detail: "Street Glide", emoji: "🏍️", weight_lbs: 570, fun_fact: "Harley-Davidson motorcycles have a distinctive 'potato-potato' exhaust sound" },
            ratio: 0.88
        },
        {
            a: { name: "A Cubic Foot of Granite", detail: "Solid stone", emoji: "🪨", weight_lbs: 168, fun_fact: "Mount Rushmore is carved from granite that is about 1.5 billion years old" },
            b: { name: "A Cubic Foot of Steel", detail: "Solid block", emoji: "⬛", weight_lbs: 490, fun_fact: "Stainless steel was accidentally discovered in 1913 by Harry Brearley" },
            ratio: 0.34
        }
    ],

    // Round 5: NIGHTMARE — ratio 0.92-0.99
    [
        {
            a: { name: "All the Ants on Earth", detail: "~20 quadrillion ants", emoji: "🐜", weight_lbs: 176000000000, fun_fact: "There are about 2.5 million ants for every human on Earth" },
            b: { name: "All the Humans on Earth", detail: "~8 billion people", emoji: "👥", weight_lbs: 1100000000000, fun_fact: "Humans make up just 0.01% of all life on Earth by biomass" },
            ratio: 0.16
        },
        {
            a: { name: "The Moon", detail: "Earth's moon", emoji: "🌙", weight_lbs: 1.62e+23, fun_fact: "The Moon is slowly drifting away from Earth at 1.5 inches per year" },
            b: { name: "Pluto", detail: "Dwarf planet", emoji: "🪐", weight_lbs: 2.87e+22, fun_fact: "Pluto is smaller than Russia" },
            ratio: 0.18
        },
        // NEW entries below
        {
            a: { name: "A Gallon of Whole Milk", detail: "Fresh from the store", emoji: "🥛", weight_lbs: 8.6, fun_fact: "It takes about 12 lbs of whole milk to make 1 lb of cheddar cheese" },
            b: { name: "A Gallon of Seawater", detail: "Average ocean water", emoji: "🌊", weight_lbs: 8.56, fun_fact: "Seawater is about 3.5% salt by weight" },
            ratio: 0.995
        },
        {
            a: { name: "A Human Liver", detail: "Healthy adult", emoji: "🫀", weight_lbs: 3.3, fun_fact: "The liver can regenerate itself — it can regrow from as little as 25% remaining" },
            b: { name: "A Human Brain", detail: "Average adult", emoji: "🧠", weight_lbs: 3.0, fun_fact: "The brain generates about 20 watts of power — enough to run a dim light bulb" },
            ratio: 0.91
        },
        {
            a: { name: "A Golf Ball", detail: "Official USGA ball", emoji: "⛳", weight_lbs: 0.1014, fun_fact: "A golf ball has exactly 336 dimples on average" },
            b: { name: "A Tennis Ball", detail: "Official ITF ball", emoji: "🎾", weight_lbs: 0.129, fun_fact: "Tennis balls are stored in pressurized cans to keep them bouncy" },
            ratio: 0.79
        },
        {
            a: { name: "A Baseball", detail: "Official MLB ball", emoji: "⚾", weight_lbs: 0.32, fun_fact: "An MLB ball has exactly 108 hand-sewn stitches" },
            b: { name: "A Softball", detail: "Official ASA fastpitch", emoji: "🥎", weight_lbs: 0.44, fun_fact: "Softball was invented in 1887 at a Yale-Harvard football game" },
            ratio: 0.73
        },
        {
            a: { name: "A Liter of Olive Oil", detail: "Extra virgin", emoji: "🫒", weight_lbs: 2.02, fun_fact: "Some olive trees in the Mediterranean are over 2,000 years old" },
            b: { name: "A Liter of Water", detail: "Pure water at 68°F", emoji: "💧", weight_lbs: 2.20, fun_fact: "Hot water freezes faster than cold water — it's called the Mpemba effect" },
            ratio: 0.92
        },
        {
            a: { name: "A Hockey Puck", detail: "Official NHL puck", emoji: "🏒", weight_lbs: 0.375, fun_fact: "NHL pucks are frozen before games to reduce bouncing" },
            b: { name: "A Baseball", detail: "Official MLB ball", emoji: "⚾", weight_lbs: 0.32, fun_fact: "About 70 baseballs are used in an average MLB game" },
            ratio: 0.85
        },
        {
            a: { name: "An iPad Pro", detail: "12.9-inch model", emoji: "📱", weight_lbs: 1.5, fun_fact: "The iPad Pro has more computing power than most laptops from 2015" },
            b: { name: "A Hardcover Novel", detail: "400-page hardcover", emoji: "📕", weight_lbs: 1.4, fun_fact: "The longest novel ever published is over 13 million characters" },
            ratio: 0.93
        },
        {
            a: { name: "A Pumpkin", detail: "Average jack-o-lantern size", emoji: "🎃", weight_lbs: 14, fun_fact: "The heaviest pumpkin ever grown weighed 2,749 lbs" },
            b: { name: "A Bowling Ball", detail: "Standard 16 lb", emoji: "🎳", weight_lbs: 16, fun_fact: "Professional bowlers release the ball at up to 22 mph" },
            ratio: 0.88
        },
        {
            a: { name: "A Brick of Butter", detail: "1 pound package", emoji: "🧈", weight_lbs: 1.0, fun_fact: "It takes about 21 lbs of whole milk to make 1 lb of butter" },
            b: { name: "A Can of Soda", detail: "12 oz aluminum can", emoji: "🥤", weight_lbs: 0.81, fun_fact: "Americans drink about 38 gallons of soda per person per year" },
            ratio: 0.81
        },
        {
            a: { name: "A Soccer Ball", detail: "Official FIFA match ball", emoji: "⚽", weight_lbs: 0.94, fun_fact: "A FIFA match ball has exactly 32 panels in the classic design" },
            b: { name: "A Volleyball", detail: "Official FIVB ball", emoji: "🏐", weight_lbs: 0.62, fun_fact: "A volleyball game was originally called 'mintonette' when invented in 1895" },
            ratio: 0.66
        },
        {
            a: { name: "A King Cobra", detail: "Adult, 12-foot", emoji: "🐍", weight_lbs: 13, fun_fact: "King cobras can 'stand up' and look an adult human in the eye" },
            b: { name: "A Dachshund", detail: "Standard size", emoji: "🐕", weight_lbs: 16, fun_fact: "Dachshunds were originally bred to hunt badgers in their burrows" },
            ratio: 0.81
        },
        {
            a: { name: "Earth's Atmosphere", detail: "All of it", emoji: "🌍", weight_lbs: 1.14e+19, fun_fact: "Earth's atmosphere extends about 6,200 miles above the surface" },
            b: { name: "Earth's Oceans", detail: "All ocean water", emoji: "🌊", weight_lbs: 3.09e+21, fun_fact: "More than 80% of the ocean is unexplored" },
            ratio: 0.0037
        },
        {
            a: { name: "A Labrador Retriever", detail: "Adult male", emoji: "🐕", weight_lbs: 75, fun_fact: "Labs have been the most popular dog breed in the US for 31 consecutive years" },
            b: { name: "A German Shepherd", detail: "Adult male", emoji: "🐕‍🦺", weight_lbs: 80, fun_fact: "German Shepherds were the first guide dogs for the blind" },
            ratio: 0.94
        }
    ]
];


const WILDCARD_ROUNDS = [
    {
        a: { name: "20 Elephants", detail: "African elephants in a row", emoji: "🐘", weight_lbs: 280000, fun_fact: "An elephant herd is led by the oldest female, called the matriarch" },
        b: { name: "The Empire State Building's Steel", detail: "Just the structural steel", emoji: "🏙️", weight_lbs: 120000000, fun_fact: "The Empire State Building contains 60,000 tons of steel and was built in just 410 days" },
        ratio: 0.002
    },
    {
        a: { name: "All the Gold Ever Mined", detail: "In human history", emoji: "🥇", weight_lbs: 441000000, fun_fact: "All the gold ever mined would form a cube just 72 feet on each side" },
        b: { name: "The Titanic", detail: "RMS Titanic, fully loaded", emoji: "🚢", weight_lbs: 104000000, fun_fact: "The Titanic's anchor alone weighed 15.5 tons and needed 20 horses to haul it" },
        ratio: 0.24
    },
    {
        a: { name: "A Neutron Star Teaspoon", detail: "1 teaspoon of neutron star", emoji: "⭐", weight_lbs: 22000000000000, fun_fact: "A neutron star is so dense that a teaspoon weighs about 10 million tons" },
        b: { name: "Mount Everest", detail: "The entire mountain", emoji: "🏔️", weight_lbs: 357000000000000, fun_fact: "Everest has about 200 dead bodies still on it that are used as trail markers" },
        ratio: 0.062
    },
    {
        a: { name: "Saturn", detail: "The whole planet", emoji: "🪐", weight_lbs: 1.25e+27, fun_fact: "Saturn would float in a bathtub big enough — its density is less than water" },
        b: { name: "A Teaspoon of White Dwarf", detail: "Dead star material", emoji: "💫", weight_lbs: 11000000, fun_fact: "Our Sun will become a white dwarf in about 5 billion years" },
        ratio: 0.0
    },
    {
        a: { name: "The Great Pyramid", detail: "Great Pyramid of Giza", emoji: "🔺", weight_lbs: 13200000000, fun_fact: "The Great Pyramid was the tallest structure on Earth for 3,800 years" },
        b: { name: "All Cars in New York City", detail: "~2 million registered cars", emoji: "🚗", weight_lbs: 8000000000, fun_fact: "NYC has about 2 million registered vehicles but only 1.4 million parking spaces" },
        ratio: 0.61
    },
    {
        a: { name: "All the Water in Lake Superior", detail: "Largest Great Lake", emoji: "🌊", weight_lbs: 5.88e+15, fun_fact: "Lake Superior holds 10% of all the world's surface freshwater" },
        b: { name: "All Humans Who Ever Lived", detail: "~117 billion people", emoji: "💀", weight_lbs: 16380000000000, fun_fact: "About 117 billion humans have ever been born in the history of our species" },
        ratio: 0.003
    },
    {
        a: { name: "The International Space Station", detail: "Complete station", emoji: "🛸", weight_lbs: 925000, fun_fact: "The ISS orbits at 17,150 mph — you could fly from NYC to LA in 10 minutes" },
        b: { name: "50 Blue Whales", detail: "Fully grown adults", emoji: "🐋", weight_lbs: 15000000, fun_fact: "A blue whale's heartbeat can be detected from 2 miles away" },
        ratio: 0.062
    },
    {
        a: { name: "All the Pizza Eaten in the US Yearly", detail: "3 billion pizzas/year", emoji: "🍕", weight_lbs: 6000000000, fun_fact: "Americans eat about 100 acres of pizza every day" },
        b: { name: "The Golden Gate Bridge", detail: "Total weight", emoji: "🌉", weight_lbs: 1680000000, fun_fact: "The Golden Gate Bridge's cables contain 80,000 miles of wire" },
        ratio: 0.28
    },
    {
        a: { name: "All the Trash in the Pacific Garbage Patch", detail: "The Great Pacific one", emoji: "🗑️", weight_lbs: 176000000, fun_fact: "The Great Pacific Garbage Patch is 3x the size of France" },
        b: { name: "The Statue of Liberty", detail: "Including base", emoji: "🗽", weight_lbs: 450000000, fun_fact: "The Statue of Liberty was originally a dull copper color before it oxidized green" },
        ratio: 0.39
    },
    // NEW wildcard entries below
    {
        a: { name: "All the Blood in Your Body", detail: "Average adult, ~1.3 gallons", emoji: "🩸", weight_lbs: 11, fun_fact: "Your body makes about 2 million red blood cells every second" },
        b: { name: "A Watermelon", detail: "Large summer melon", emoji: "🍉", weight_lbs: 22, fun_fact: "China produces about 70% of the world's watermelons" },
        ratio: 0.50
    },
    {
        a: { name: "A Boeing 747", detail: "Fully loaded, max takeoff", emoji: "✈️", weight_lbs: 875000, fun_fact: "A 747 holds about 57,285 gallons of fuel — enough to drive a car around Earth 60 times" },
        b: { name: "10 Blue Whales", detail: "Fully grown adults", emoji: "🐋", weight_lbs: 3000000, fun_fact: "A blue whale's aorta is large enough for a human to crawl through" },
        ratio: 0.29
    },
    {
        a: { name: "All the Lego Bricks Ever Made", detail: "~400 billion bricks", emoji: "🧱", weight_lbs: 1760000000, fun_fact: "There are about 80 Lego bricks for every person on Earth" },
        b: { name: "The Eiffel Tower", detail: "Iron structure only", emoji: "🗼", weight_lbs: 16535000, fun_fact: "The Eiffel Tower grows about 6 inches taller in summer due to thermal expansion" },
        ratio: 0.009
    },
    {
        a: { name: "All the Spiders on Earth", detail: "~45,000 known species", emoji: "🕷️", weight_lbs: 55000000000, fun_fact: "Spiders eat 400-800 million tons of insects per year — more than humans eat in meat" },
        b: { name: "All the Fish in the Sea", detail: "Estimated total mass", emoji: "🐟", weight_lbs: 2200000000000, fun_fact: "There are more than 3.5 trillion fish in the ocean" },
        ratio: 0.025
    },
    {
        a: { name: "All the Sand on Earth", detail: "Every grain on every beach", emoji: "🏖️", weight_lbs: 1.65e+19, fun_fact: "There are roughly 7.5 quintillion grains of sand on Earth" },
        b: { name: "Earth's Oceans", detail: "All the ocean water", emoji: "🌊", weight_lbs: 3.09e+21, fun_fact: "The ocean contains about 20 million tons of gold dissolved in seawater" },
        ratio: 0.005
    },
    {
        a: { name: "All Gold in Fort Knox", detail: "US Bullion Depository", emoji: "🏦", weight_lbs: 9400000, fun_fact: "Fort Knox holds about 4,580 metric tons of gold worth over $300 billion" },
        b: { name: "The Statue of Liberty", detail: "Copper and steel only (no base)", emoji: "🗽", weight_lbs: 450000, fun_fact: "The Statue of Liberty's copper skin is only 3/32 of an inch thick — like two pennies" },
        ratio: 0.048
    },
    {
        a: { name: "A Cruise Ship", detail: "Royal Caribbean Wonder of the Seas", emoji: "🚢", weight_lbs: 474000000, fun_fact: "The Wonder of the Seas has 18 decks, 6,988 guests, and its own Central Park" },
        b: { name: "The Great Pyramid", detail: "All 2.3 million stone blocks", emoji: "🔺", weight_lbs: 13200000000, fun_fact: "Each limestone block in the Great Pyramid weighs about 2.5 tons" },
        ratio: 0.036
    },
    {
        a: { name: "All Humans Alive", detail: "8 billion people combined", emoji: "👥", weight_lbs: 1100000000000, fun_fact: "If all 8 billion humans stood shoulder to shoulder, they'd fit in Los Angeles" },
        b: { name: "Earth's Atmosphere", detail: "All the air", emoji: "🌍", weight_lbs: 1.14e+19, fun_fact: "The atmosphere weighs about 14.7 lbs per square inch at sea level" },
        ratio: 0.0001
    },
    {
        a: { name: "The Hoover Dam", detail: "Concrete + water behind it", emoji: "🏗️", weight_lbs: 89360000000000, fun_fact: "The Hoover Dam contains enough concrete to build a two-lane road from NYC to San Francisco" },
        b: { name: "A Teaspoon of Neutron Star", detail: "Ultra-dense stellar matter", emoji: "⭐", weight_lbs: 22000000000000, fun_fact: "Neutron stars spin up to 716 times per second" },
        ratio: 0.25
    },
    {
        a: { name: "The Amazon Rainforest's Trees", detail: "All ~400 billion trees", emoji: "🌳", weight_lbs: 4.4e+14, fun_fact: "The Amazon produces about 20% of the world's oxygen" },
        b: { name: "All the Water in the Amazon River", detail: "At any given moment", emoji: "🌊", weight_lbs: 1.58e+14, fun_fact: "The Amazon River discharges more water than the next 7 largest rivers combined" },
        ratio: 0.36
    },
    {
        a: { name: "Every Coin in US Circulation", detail: "~48.5 billion coins", emoji: "🪙", weight_lbs: 530000000, fun_fact: "There are more pennies in circulation than all other US coins combined" },
        b: { name: "The Brooklyn Bridge", detail: "Total weight", emoji: "🌉", weight_lbs: 29000000, fun_fact: "P.T. Barnum walked 21 elephants across the Brooklyn Bridge to prove it was safe" },
        ratio: 0.055
    },
    {
        a: { name: "The Hubble Space Telescope", detail: "In orbit", emoji: "🔭", weight_lbs: 24500, fun_fact: "Hubble travels at 17,000 mph but can lock onto a target with the precision of a laser on a dime 200 miles away" },
        b: { name: "A T. Rex", detail: "Adult Tyrannosaurus rex", emoji: "🦖", weight_lbs: 18500, fun_fact: "T. rex could bite with a force of 12,800 lbs — enough to crush a car" },
        ratio: 0.76
    }
];

// Format weight for display
function formatWeight(lbs) {
    if (lbs >= 1e+18) return (lbs / 2.205e+18).toExponential(1) + " × 10¹⁸ kg";
    if (lbs >= 1e+15) return (lbs / 2.205e+15).toFixed(1) + " quadrillion kg";
    if (lbs >= 1e+12) return (lbs / 2.205e+12).toFixed(1) + " trillion kg";
    if (lbs >= 1e+9) return (lbs / 2000).toLocaleString(undefined, {maximumFractionDigits: 0}) + " tons";
    if (lbs >= 2000) return (lbs / 2000).toLocaleString(undefined, {maximumFractionDigits: 0}) + " tons";
    if (lbs >= 1) return lbs.toLocaleString(undefined, {maximumFractionDigits: 1}) + " lbs";
    return (lbs * 16).toFixed(1) + " oz";
}
