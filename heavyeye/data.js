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
        },
        // === NEW TIER 1 ENTRIES ===
        {
            a: { name: "A Redwood Tree", detail: "Giant sequoia, mature", emoji: "🌲", weight_lbs: 4000000, fun_fact: "The General Sherman tree is the largest living organism by volume on Earth" },
            b: { name: "A Goldfish", detail: "Common pet goldfish", emoji: "🐟", weight_lbs: 0.02, fun_fact: "Goldfish can live over 40 years with proper care" },
            ratio: 0.000000005
        },
        {
            a: { name: "The Liberty Bell", detail: "Philadelphia landmark", emoji: "🔔", weight_lbs: 2080, fun_fact: "The Liberty Bell cracked the first time it was rung after arrival in Philadelphia" },
            b: { name: "A Pencil", detail: "Standard #2 pencil", emoji: "✏️", weight_lbs: 0.025, fun_fact: "A single pencil can draw a line 35 miles long" },
            ratio: 0.00001
        },
        {
            a: { name: "A Wrecking Ball", detail: "Standard demolition ball", emoji: "⚫", weight_lbs: 3000, fun_fact: "Wrecking balls are being replaced by hydraulic excavators in most demolition" },
            b: { name: "A Guinea Pig", detail: "Adult pet", emoji: "🐹", weight_lbs: 2.2, fun_fact: "Guinea pigs 'popcorn' — they jump and twist when happy" },
            ratio: 0.0007
        },
        {
            a: { name: "A Cement Mixer Truck", detail: "Loaded with concrete", emoji: "🚛", weight_lbs: 66000, fun_fact: "A cement mixer drum rotates to keep concrete from hardening during transport" },
            b: { name: "A Frisbee", detail: "Official Ultimate disc", emoji: "🥏", weight_lbs: 0.39, fun_fact: "Frisbees were inspired by pie tins from the Frisbie Pie Company" },
            ratio: 0.000006
        },
        {
            a: { name: "An Anchor", detail: "Large ship anchor", emoji: "⚓", weight_lbs: 30000, fun_fact: "The Titanic's anchor required 20 horses to transport it to the shipyard" },
            b: { name: "A Rubber Duck", detail: "Classic bath toy", emoji: "🦆", weight_lbs: 0.15, fun_fact: "In 1992, 28,800 rubber ducks fell off a cargo ship and are still washing ashore" },
            ratio: 0.000005
        },
        {
            a: { name: "A Hippopotamus Tooth", detail: "Lower canine tusk", emoji: "🦷", weight_lbs: 6.6, fun_fact: "Hippo tusks can grow up to 20 inches long and were once used as ivory" },
            b: { name: "A Marble", detail: "Standard glass marble", emoji: "🔮", weight_lbs: 0.018, fun_fact: "The first marbles were made of clay and date back to ancient Rome" },
            ratio: 0.003
        },
        {
            a: { name: "A Server Rack", detail: "Fully loaded 42U rack", emoji: "🖥️", weight_lbs: 2500, fun_fact: "Google has over 4 million servers running at any given time" },
            b: { name: "A USB Flash Drive", detail: "Standard thumb drive", emoji: "💾", weight_lbs: 0.04, fun_fact: "The first USB flash drive held only 8 MB — today they hold 2 TB" },
            ratio: 0.00002
        },
        {
            a: { name: "A Grand Piano", detail: "Bösendorfer Imperial", emoji: "🎹", weight_lbs: 1320, fun_fact: "The Bösendorfer Imperial has 97 keys instead of the standard 88" },
            b: { name: "A Harmonica", detail: "Standard diatonic", emoji: "🎵", weight_lbs: 0.2, fun_fact: "The harmonica is the world's best-selling musical instrument" },
            ratio: 0.0002
        },
        {
            a: { name: "A Bulldozer", detail: "Caterpillar D9", emoji: "🚜", weight_lbs: 108000, fun_fact: "The Caterpillar D9 was originally designed for construction but has been used in military operations" },
            b: { name: "A Tennis Racket", detail: "Professional grade", emoji: "🎾", weight_lbs: 0.7, fun_fact: "Tennis racket strings were once made from cat intestines (called 'catgut')" },
            ratio: 0.000006
        },
        {
            a: { name: "A Saltwater Crocodile", detail: "Large adult male", emoji: "🐊", weight_lbs: 2200, fun_fact: "Saltwater crocodiles have the strongest bite ever measured at 3,700 PSI" },
            b: { name: "A Stick of Butter", detail: "Standard half-cup stick", emoji: "🧈", weight_lbs: 0.25, fun_fact: "Butter was first made about 10,000 years ago from sheep and goat milk" },
            ratio: 0.0001
        },
        {
            a: { name: "A Rosetta Stone", detail: "The actual artifact", emoji: "🪨", weight_lbs: 1680, fun_fact: "The Rosetta Stone was discovered by Napoleon's soldiers in 1799 in Egypt" },
            b: { name: "A Baseball Cap", detail: "Fitted wool cap", emoji: "🧢", weight_lbs: 0.22, fun_fact: "The Brooklyn Excelsiors were the first baseball team to wear caps in 1860" },
            ratio: 0.0001
        },
        {
            a: { name: "An African Elephant", detail: "Adult bull", emoji: "🐘", weight_lbs: 14000, fun_fact: "Elephants are the only animals that can't jump" },
            b: { name: "A Banana", detail: "Single ripe banana", emoji: "🍌", weight_lbs: 0.27, fun_fact: "Bananas are technically berries, but strawberries are not" },
            ratio: 0.00002
        },
        {
            a: { name: "A Tank", detail: "M1 Abrams battle tank", emoji: "🪖", weight_lbs: 136000, fun_fact: "The M1 Abrams gets about 0.6 miles per gallon and holds 500 gallons of fuel" },
            b: { name: "A Ping Pong Ball", detail: "Official 40mm ball", emoji: "🏓", weight_lbs: 0.006, fun_fact: "Table tennis balls travel at speeds over 60 mph in professional play" },
            ratio: 0.00000004
        },
        {
            a: { name: "A Monster Truck", detail: "Grave Digger", emoji: "🛻", weight_lbs: 10000, fun_fact: "Monster truck tires are over 5.5 feet tall and cost about $2,500 each" },
            b: { name: "A Coffee Mug", detail: "Ceramic mug, empty", emoji: "☕", weight_lbs: 0.75, fun_fact: "Americans drink about 400 million cups of coffee per day" },
            ratio: 0.00008
        },
        {
            a: { name: "A Subway Car", detail: "NYC R179 car", emoji: "🚇", weight_lbs: 84000, fun_fact: "The NYC subway runs 245 miles of routes and serves 3.5 million riders daily" },
            b: { name: "A Guinea Hen Egg", detail: "Single egg", emoji: "🥚", weight_lbs: 0.09, fun_fact: "Guinea hen eggs have a thicker shell than chicken eggs, making them harder to crack" },
            ratio: 0.000001
        },
        {
            a: { name: "A Locomotive", detail: "GE Evolution series", emoji: "🚂", weight_lbs: 432000, fun_fact: "A single freight locomotive can pull a train weighing 6,000 tons" },
            b: { name: "A Ladybug", detail: "Seven-spotted ladybug", emoji: "🐞", weight_lbs: 0.00077, fun_fact: "A ladybug can eat up to 5,000 aphids in its lifetime" },
            ratio: 0.000000002
        },
        {
            a: { name: "A Church Bell", detail: "Large bronze bell", emoji: "🔔", weight_lbs: 5000, fun_fact: "The largest church bell in the world is the Tsar Bell in Moscow, weighing 445,000 lbs" },
            b: { name: "A Paper Clip", detail: "Standard steel clip", emoji: "📎", weight_lbs: 0.0022, fun_fact: "The paper clip became a symbol of Norwegian resistance during WWII" },
            ratio: 0.0000004
        },
        {
            a: { name: "A Hot Air Balloon", detail: "Envelope + basket + burner", emoji: "🎈", weight_lbs: 550, fun_fact: "The first hot air balloon passengers were a sheep, a duck, and a rooster in 1783" },
            b: { name: "A Postage Stamp", detail: "Standard first-class", emoji: "📮", weight_lbs: 0.002, fun_fact: "The most expensive stamp ever sold was the British Guiana 1c Magenta for $9.5 million" },
            ratio: 0.000004
        },
        {
            a: { name: "A Walrus", detail: "Adult Pacific walrus", emoji: "🦭", weight_lbs: 2700, fun_fact: "Walruses can slow their heartbeat to withstand freezing Arctic water" },
            b: { name: "A Deck of Cards", detail: "Standard 52-card deck", emoji: "🃏", weight_lbs: 0.22, fun_fact: "There are more possible shuffled deck arrangements than atoms on Earth" },
            ratio: 0.00008
        },
        {
            a: { name: "A Shipping Container", detail: "40-foot, loaded", emoji: "📦", weight_lbs: 58000, fun_fact: "About 17 million shipping containers are in use worldwide at any given time" },
            b: { name: "A Canned Tuna", detail: "Standard 5 oz can", emoji: "🐟", weight_lbs: 0.35, fun_fact: "Americans eat about 1 billion pounds of canned tuna per year" },
            ratio: 0.000006
        },
        {
            a: { name: "A Wind Turbine Blade", detail: "Modern offshore blade", emoji: "💨", weight_lbs: 77000, fun_fact: "Offshore wind turbine blades can be longer than a football field" },
            b: { name: "A Parakeet", detail: "Budgerigar", emoji: "🦜", weight_lbs: 0.07, fun_fact: "Budgies can learn vocabularies of over 1,700 words" },
            ratio: 0.0000009
        },
        {
            a: { name: "A Blue Whale", detail: "Adult, largest animal ever", emoji: "🐋", weight_lbs: 300000, fun_fact: "Blue whales are the loudest animals on Earth at 188 decibels" },
            b: { name: "A Grape", detail: "Single table grape", emoji: "🍇", weight_lbs: 0.011, fun_fact: "Grapes explode when microwaved, producing plasma" },
            ratio: 0.00000004
        },
        {
            a: { name: "A Fire Truck", detail: "Ladder truck, fully equipped", emoji: "🚒", weight_lbs: 60000, fun_fact: "The first fire engine was invented by a Roman named Ctesibius around 200 BC" },
            b: { name: "A Pair of Sunglasses", detail: "Standard plastic frame", emoji: "🕶️", weight_lbs: 0.07, fun_fact: "Chinese judges wore smoky quartz sunglasses to hide their expressions in court" },
            ratio: 0.000001
        },
        {
            a: { name: "A Sperm Whale's Brain", detail: "Largest brain of any animal", emoji: "🧠", weight_lbs: 17, fun_fact: "The sperm whale has the largest brain of any animal that has ever lived on Earth" },
            b: { name: "A Housefly", detail: "Common housefly", emoji: "🪰", weight_lbs: 0.00003, fun_fact: "A housefly beats its wings about 200 times per second" },
            ratio: 0.000002
        },
        {
            a: { name: "A Pool Table", detail: "Regulation slate table", emoji: "🎱", weight_lbs: 1000, fun_fact: "Pool table slate is mined from specific quarries in Italy, Brazil, and China" },
            b: { name: "A Golf Tee", detail: "Wooden tee", emoji: "⛳", weight_lbs: 0.007, fun_fact: "The golf tee wasn't invented until 1899 — before that golfers used small sand mounds" },
            ratio: 0.000007
        },
        {
            a: { name: "A Pipe Organ", detail: "Large church organ", emoji: "🎵", weight_lbs: 40000, fun_fact: "The largest pipe organ in the world at Boardwalk Hall has over 33,000 pipes" },
            b: { name: "A Contact Lens", detail: "Single soft lens", emoji: "👁️", weight_lbs: 0.00009, fun_fact: "Leonardo da Vinci sketched the concept of contact lenses in 1508" },
            ratio: 0.000000002
        },
        {
            a: { name: "A Woolly Mammoth", detail: "Estimated adult weight", emoji: "🦣", weight_lbs: 13000, fun_fact: "Woolly mammoths were still alive when the Great Pyramid was being built" },
            b: { name: "A Matchstick", detail: "Wooden kitchen match", emoji: "🔥", weight_lbs: 0.0044, fun_fact: "The friction match was invented by accident in 1826 by John Walker" },
            ratio: 0.0000003
        },
        {
            a: { name: "A Combine Harvester", detail: "John Deere S780", emoji: "🚜", weight_lbs: 36000, fun_fact: "Modern combines can harvest 100 acres of wheat in a single day" },
            b: { name: "A Teaspoon of Sugar", detail: "Granulated white", emoji: "🍬", weight_lbs: 0.009, fun_fact: "The average American consumes about 17 teaspoons of added sugar per day" },
            ratio: 0.00000025
        },
        {
            a: { name: "An Orca", detail: "Adult male killer whale", emoji: "🐋", weight_lbs: 12000, fun_fact: "Orcas are actually the largest member of the dolphin family, not whales" },
            b: { name: "A Crayon", detail: "Standard Crayola crayon", emoji: "🖍️", weight_lbs: 0.016, fun_fact: "Crayola produces nearly 3 billion crayons per year" },
            ratio: 0.0000013
        },
        {
            a: { name: "A Forklift", detail: "Standard warehouse forklift", emoji: "🚜", weight_lbs: 9000, fun_fact: "The forklift was invented in 1917 to support the war effort in WWI" },
            b: { name: "A Chicken Wing", detail: "Single raw wing", emoji: "🍗", weight_lbs: 0.22, fun_fact: "Americans eat 1.4 billion chicken wings during the Super Bowl alone" },
            ratio: 0.00002
        },
        {
            a: { name: "A Colossal Squid", detail: "Largest specimen found", emoji: "🦑", weight_lbs: 1091, fun_fact: "Colossal squids have rotating hooks on their tentacles" },
            b: { name: "A Lightbulb", detail: "Standard LED bulb", emoji: "💡", weight_lbs: 0.18, fun_fact: "LED bulbs use 75% less energy than incandescent bulbs and last 25 times longer" },
            ratio: 0.0002
        },
        {
            a: { name: "A Shipping Container", detail: "20-foot, empty", emoji: "📦", weight_lbs: 5070, fun_fact: "The shipping container was invented in 1956 and revolutionized global trade" },
            b: { name: "A Strawberry", detail: "Single large strawberry", emoji: "🍓", weight_lbs: 0.044, fun_fact: "Strawberries are the only fruit with seeds on the outside — about 200 per berry" },
            ratio: 0.000009
        },
        {
            a: { name: "A Cement Truck", detail: "Empty mixer truck", emoji: "🚛", weight_lbs: 26000, fun_fact: "A cement mixer drum rotates about 1-2 times per minute" },
            b: { name: "A Stick of Gum", detail: "Single piece", emoji: "🍬", weight_lbs: 0.006, fun_fact: "Humans have been chewing gum for over 9,000 years — starting with birch bark tar" },
            ratio: 0.0000002
        },
        {
            a: { name: "A Tractor", detail: "John Deere 6M series", emoji: "🚜", weight_lbs: 15000, fun_fact: "The first gasoline-powered tractor was built in 1892 in Iowa" },
            b: { name: "An Apple", detail: "Medium Gala apple", emoji: "🍎", weight_lbs: 0.44, fun_fact: "There are over 7,500 varieties of apples grown worldwide" },
            ratio: 0.00003
        },
        {
            a: { name: "A Dump Truck Load of Gravel", detail: "Full 10-wheeler", emoji: "🚛", weight_lbs: 54000, fun_fact: "Gravel is the most mined material in the world after water" },
            b: { name: "A Butterfly", detail: "Monarch butterfly", emoji: "🦋", weight_lbs: 0.00055, fun_fact: "Monarch butterflies migrate up to 3,000 miles from Canada to Mexico" },
            ratio: 0.00000001
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
        },
        // === NEW TIER 2 ENTRIES ===
        {
            a: { name: "A Human Skin", detail: "All skin on one person", emoji: "🧑", weight_lbs: 8, fun_fact: "Your skin is the largest organ in the body and replaces itself every 27 days" },
            b: { name: "A Bowling Ball", detail: "16-pound regulation", emoji: "🎳", weight_lbs: 16, fun_fact: "The first bowling balls were made of hardwood" },
            ratio: 0.50
        },
        {
            a: { name: "A Chainsaw", detail: "Professional felling saw", emoji: "🪚", weight_lbs: 13, fun_fact: "The chainsaw was originally invented as a medical tool for childbirth" },
            b: { name: "A Car Tire", detail: "Standard sedan tire", emoji: "🛞", weight_lbs: 25, fun_fact: "About 1 billion tires are produced worldwide every year" },
            ratio: 0.52
        },
        {
            a: { name: "A Gallon of Gasoline", detail: "Regular unleaded", emoji: "⛽", weight_lbs: 6.3, fun_fact: "One gallon of gasoline contains the energy equivalent of 31,000 food calories" },
            b: { name: "A Gallon of Water", detail: "Pure water", emoji: "💧", weight_lbs: 8.34, fun_fact: "A person needs about half a gallon of water per day to survive" },
            ratio: 0.76
        },
        {
            a: { name: "The Hope Diamond", detail: "Famous cursed gem", emoji: "💎", weight_lbs: 0.020, fun_fact: "The Hope Diamond is valued at around $250 million and has a supposed curse" },
            b: { name: "A AA Battery", detail: "Alkaline AA cell", emoji: "🔋", weight_lbs: 0.051, fun_fact: "Americans buy nearly 3 billion batteries every year" },
            ratio: 0.39
        },
        {
            a: { name: "A Human Eyeball", detail: "Single adult eye", emoji: "👁️", weight_lbs: 0.017, fun_fact: "Your eyeball weighs about the same as 3 nickels" },
            b: { name: "A AAA Battery", detail: "Alkaline AAA cell", emoji: "🔋", weight_lbs: 0.026, fun_fact: "AAA batteries were introduced in 1911 for use in small flashlights" },
            ratio: 0.65
        },
        {
            a: { name: "A Tuba", detail: "Concert tuba", emoji: "🎺", weight_lbs: 25, fun_fact: "The tuba is the youngest brass instrument, invented in 1835" },
            b: { name: "A German Shepherd", detail: "Adult male", emoji: "🐕‍🦺", weight_lbs: 80, fun_fact: "German Shepherds were the first guide dogs for the blind" },
            ratio: 0.31
        },
        {
            a: { name: "A Propane Tank", detail: "Standard 20 lb BBQ tank", emoji: "🔥", weight_lbs: 37, fun_fact: "A full 20 lb propane tank actually contains about 4.7 gallons of propane" },
            b: { name: "A Hay Bale", detail: "Standard square bale", emoji: "🌾", weight_lbs: 75, fun_fact: "A dairy cow eats about 25-30 lbs of hay per day" },
            ratio: 0.49
        },
        {
            a: { name: "A Salmon", detail: "Adult Atlantic salmon", emoji: "🐟", weight_lbs: 12, fun_fact: "Salmon can jump up to 12 feet high to clear waterfalls during migration" },
            b: { name: "A Bowling Ball", detail: "Standard 12 lb ball", emoji: "🎳", weight_lbs: 12, fun_fact: "The first indoor bowling alley was built in New York City in 1840" },
            ratio: 1.0
        },
        {
            a: { name: "A Human Heart", detail: "Adult heart", emoji: "🫀", weight_lbs: 0.66, fun_fact: "Your heart beats about 100,000 times per day, pumping 2,000 gallons of blood" },
            b: { name: "A Baseball", detail: "Official MLB ball", emoji: "⚾", weight_lbs: 0.32, fun_fact: "About 70 baseballs are used in an average MLB game" },
            ratio: 0.48
        },
        {
            a: { name: "A Cinder Block", detail: "Standard 8-inch CMU", emoji: "🧱", weight_lbs: 35, fun_fact: "Cinder blocks were invented in 1882 by Harmon Palmer" },
            b: { name: "A Mountain Bike", detail: "Full suspension", emoji: "🚲", weight_lbs: 30, fun_fact: "Mountain biking became an Olympic sport in 1996" },
            ratio: 0.86
        },
        {
            a: { name: "A Trombone", detail: "Tenor trombone", emoji: "🎺", weight_lbs: 2.5, fun_fact: "The trombone is the only brass instrument that uses a slide instead of valves" },
            b: { name: "A Chihuahua", detail: "Tiny adult", emoji: "🐕", weight_lbs: 5, fun_fact: "Chihuahuas are the smallest recognized dog breed in the world" },
            ratio: 0.50
        },
        {
            a: { name: "A Human Femur", detail: "Thighbone", emoji: "🦴", weight_lbs: 0.55, fun_fact: "The femur is the longest and strongest bone in the human body" },
            b: { name: "A Can of Soup", detail: "Standard 15 oz can", emoji: "🥫", weight_lbs: 1.1, fun_fact: "Andy Warhol painted 32 Campbell's Soup Cans because that was the number of flavors" },
            ratio: 0.50
        },
        {
            a: { name: "A Bag of Sugar", detail: "5-pound bag", emoji: "🍬", weight_lbs: 5, fun_fact: "The average American consumes about 77 lbs of sugar per year" },
            b: { name: "A Bald Eagle", detail: "Adult male", emoji: "🦅", weight_lbs: 10, fun_fact: "Bald eagles can see fish in the water from several hundred feet above" },
            ratio: 0.50
        },
        {
            a: { name: "A Jack Russell Terrier", detail: "Adult", emoji: "🐕", weight_lbs: 15, fun_fact: "Jack Russell Terriers can jump up to 5 feet high from a standing position" },
            b: { name: "A Microwave Oven", detail: "Countertop model", emoji: "📻", weight_lbs: 30, fun_fact: "The first commercial microwave, the Radarange, was 6 feet tall" },
            ratio: 0.50
        },
        {
            a: { name: "A Snapping Turtle", detail: "Common snapper, adult", emoji: "🐢", weight_lbs: 35, fun_fact: "Snapping turtles can bite with a force of about 210 newtons" },
            b: { name: "A Toilet", detail: "Standard one-piece", emoji: "🚽", weight_lbs: 100, fun_fact: "Thomas Crapper didn't invent the toilet, but he did improve the ballcock mechanism" },
            ratio: 0.35
        },
        {
            a: { name: "A Kettlebell", detail: "Competition 32 kg", emoji: "🏋️", weight_lbs: 70, fun_fact: "Kettlebells originated in Russia in the 1700s as counterweights for market scales" },
            b: { name: "An Anvil", detail: "Farrier's anvil", emoji: "⚒️", weight_lbs: 150, fun_fact: "Anvils have been used for metalworking for over 6,000 years" },
            ratio: 0.47
        },
        {
            a: { name: "A Watermelon", detail: "Large summer melon", emoji: "🍉", weight_lbs: 22, fun_fact: "Every part of a watermelon is edible, including the rind and seeds" },
            b: { name: "A Car Tire", detail: "Standard sedan tire", emoji: "🛞", weight_lbs: 25, fun_fact: "The world's largest tire is a Ferris wheel in Detroit, standing 80 feet tall" },
            ratio: 0.88
        },
        {
            a: { name: "A Corgi", detail: "Pembroke Welsh Corgi", emoji: "🐕", weight_lbs: 28, fun_fact: "Queen Elizabeth II owned more than 30 corgis during her reign" },
            b: { name: "A Dalmatian", detail: "Adult male", emoji: "🐕‍🦺", weight_lbs: 55, fun_fact: "Dalmatians ran alongside horse-drawn fire engines to guard the horses" },
            ratio: 0.51
        },
        {
            a: { name: "A Concrete Birdbath", detail: "Standard pedestal style", emoji: "🐦", weight_lbs: 75, fun_fact: "The oldest known birdbath was found in a Roman garden dating to 100 AD" },
            b: { name: "A Kangaroo", detail: "Adult female", emoji: "🦘", weight_lbs: 130, fun_fact: "Baby kangaroos (joeys) are born the size of a grape" },
            ratio: 0.58
        },
        {
            a: { name: "A Standard Door", detail: "Interior wood door", emoji: "🚪", weight_lbs: 35, fun_fact: "The average person walks through about 8-10 doors per day" },
            b: { name: "A Couch Cushion Set", detail: "3-seat sofa cushions", emoji: "🛋️", weight_lbs: 25, fun_fact: "Americans spend an average of 4 hours per day sitting on the couch" },
            ratio: 0.71
        },
        {
            a: { name: "A Beaver", detail: "North American beaver", emoji: "🦫", weight_lbs: 55, fun_fact: "Beaver dams can be seen from space — the largest is half a mile long" },
            b: { name: "A Golden Eagle", detail: "Adult", emoji: "🦅", weight_lbs: 12, fun_fact: "Golden eagles can dive at speeds over 150 mph" },
            ratio: 0.22
        },
        {
            a: { name: "A Keg of Beer", detail: "Full half-barrel", emoji: "🍺", weight_lbs: 161, fun_fact: "A half-barrel keg holds about 165 twelve-ounce servings of beer" },
            b: { name: "A Reindeer", detail: "Adult female", emoji: "🦌", weight_lbs: 260, fun_fact: "Female reindeer keep their antlers through winter — males shed theirs in fall" },
            ratio: 0.62
        },
        {
            a: { name: "A Cello", detail: "Professional, with case", emoji: "🎻", weight_lbs: 15, fun_fact: "The most expensive cello ever sold was a Stradivarius for $20 million" },
            b: { name: "A Snowboard", detail: "All-mountain board", emoji: "🏂", weight_lbs: 6.5, fun_fact: "Snowboarding became an Olympic sport in 1998 in Nagano, Japan" },
            ratio: 0.43
        },
        {
            a: { name: "A Manatee", detail: "Adult Florida manatee", emoji: "🦭", weight_lbs: 1200, fun_fact: "Manatees are the closest living relatives of elephants among marine mammals" },
            b: { name: "A Smart Car", detail: "Smart ForTwo", emoji: "🚗", weight_lbs: 2050, fun_fact: "Smart cars were originally a collaboration between Swatch and Mercedes-Benz" },
            ratio: 0.59
        },
        {
            a: { name: "A Cast Iron Bathtub", detail: "Clawfoot tub, empty", emoji: "🛁", weight_lbs: 350, fun_fact: "President Taft once got stuck in the White House bathtub due to his 335-lb frame" },
            b: { name: "A Grizzly Bear", detail: "Adult female", emoji: "🐻", weight_lbs: 400, fun_fact: "Female grizzlies give birth during hibernation and don't wake up" },
            ratio: 0.88
        },
        {
            a: { name: "A Raccoon", detail: "Adult male", emoji: "🦝", weight_lbs: 23, fun_fact: "Raccoons can remember the solution to tasks for up to 3 years" },
            b: { name: "A Turkey", detail: "Wild adult male", emoji: "🦃", weight_lbs: 24, fun_fact: "Wild turkeys can fly at speeds up to 55 mph in short bursts" },
            ratio: 0.96
        },
        {
            a: { name: "A Wheelbarrow of Dirt", detail: "3 cubic feet of topsoil", emoji: "🪴", weight_lbs: 120, fun_fact: "One tablespoon of soil contains more organisms than people on Earth" },
            b: { name: "A Kangaroo", detail: "Adult female", emoji: "🦘", weight_lbs: 130, fun_fact: "Kangaroos use their tail as a fifth leg when walking slowly" },
            ratio: 0.92
        },
        {
            a: { name: "A Barrel of Crude Oil", detail: "42 US gallons", emoji: "🛢️", weight_lbs: 300, fun_fact: "A barrel of crude oil produces about 19 gallons of gasoline" },
            b: { name: "A Pig", detail: "Adult domestic pig", emoji: "🐷", weight_lbs: 250, fun_fact: "Pigs can't sweat — they roll in mud to cool off" },
            ratio: 0.83
        },
        {
            a: { name: "A Surfboard", detail: "Longboard, 9 feet", emoji: "🏄", weight_lbs: 15, fun_fact: "The oldest known surfboard is about 230 years old and is housed in a Hawaiian museum" },
            b: { name: "A Snowboard", detail: "All-mountain board", emoji: "🏂", weight_lbs: 6.5, fun_fact: "Snowboarding was banned at most ski resorts until the late 1980s" },
            ratio: 0.43
        },
        {
            a: { name: "A Slot Machine", detail: "Casino floor model", emoji: "🎰", weight_lbs: 200, fun_fact: "The Liberty Bell, the first slot machine, was invented in 1895 in San Francisco" },
            b: { name: "An Arcade Cabinet", detail: "Classic upright arcade", emoji: "🕹️", weight_lbs: 300, fun_fact: "The original Pac-Man arcade machine earned $1 billion in quarters by the 1990s" },
            ratio: 0.67
        },
        {
            a: { name: "A Koala", detail: "Adult male", emoji: "🐨", weight_lbs: 26, fun_fact: "Koalas sleep 18-22 hours per day because eucalyptus provides so little energy" },
            b: { name: "A Microwave Oven", detail: "Full-size countertop", emoji: "📻", weight_lbs: 55, fun_fact: "Percy Spencer discovered microwave cooking when a candy bar melted in his pocket" },
            ratio: 0.47
        },
        {
            a: { name: "A Dumbbell Set", detail: "Pair of 50 lb dumbbells", emoji: "🏋️", weight_lbs: 100, fun_fact: "Dumbbells were named because they resembled church bells with the clappers removed" },
            b: { name: "A Saint Bernard", detail: "Adult male", emoji: "🐕", weight_lbs: 180, fun_fact: "Saint Bernards never actually carried brandy barrels — that's a myth from a painting" },
            ratio: 0.56
        },
        {
            a: { name: "A Saxophone", detail: "Alto saxophone", emoji: "🎷", weight_lbs: 5.5, fun_fact: "The saxophone was invented by Adolphe Sax in 1846 in Belgium" },
            b: { name: "A House Cat", detail: "Maine Coon, large male", emoji: "🐱", weight_lbs: 18, fun_fact: "Maine Coons are the largest domestic cat breed and can weigh over 25 lbs" },
            ratio: 0.31
        },
        {
            a: { name: "A Mountain Lion", detail: "Adult male cougar", emoji: "🐈", weight_lbs: 200, fun_fact: "Mountain lions can leap 40 feet horizontally and 15 feet vertically" },
            b: { name: "A Panda", detail: "Giant panda, adult male", emoji: "🐼", weight_lbs: 300, fun_fact: "Pandas evolved to eat bamboo about 2 million years ago" },
            ratio: 0.67
        },
        {
            a: { name: "A Penguin", detail: "Emperor penguin, adult", emoji: "🐧", weight_lbs: 88, fun_fact: "Emperor penguins can dive to depths of 1,800 feet — deeper than any other bird" },
            b: { name: "A German Shepherd", detail: "Adult male", emoji: "🐕‍🦺", weight_lbs: 80, fun_fact: "Rin Tin Tin, a German Shepherd, was one of Hollywood's biggest stars in the 1920s" },
            ratio: 0.91
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
        },
        // === NEW TIER 3 ENTRIES ===
        {
            a: { name: "A Flat-Screen TV", detail: "75-inch OLED", emoji: "📺", weight_lbs: 72, fun_fact: "The first flat-screen TV was demonstrated by Fujitsu in 1997" },
            b: { name: "An Adult Male Orangutan", detail: "Bornean orangutan", emoji: "🦧", weight_lbs: 130, fun_fact: "Orangutans share 97% of their DNA with humans" },
            ratio: 0.55
        },
        {
            a: { name: "A Coffin", detail: "Standard wooden casket", emoji: "⚰️", weight_lbs: 200, fun_fact: "Coffins are hexagonal while caskets are rectangular — most people use the terms interchangeably" },
            b: { name: "A Zebra", detail: "Adult plains zebra", emoji: "🦓", weight_lbs: 350, fun_fact: "Every zebra has a unique stripe pattern, like human fingerprints" },
            ratio: 0.57
        },
        {
            a: { name: "An Electric Scooter", detail: "Vespa Elettrica", emoji: "🛵", weight_lbs: 260, fun_fact: "The original Vespa was designed in 1946 using aircraft parts" },
            b: { name: "A Lion", detail: "Adult male African lion", emoji: "🦁", weight_lbs: 420, fun_fact: "Male lions sleep up to 20 hours a day" },
            ratio: 0.62
        },
        {
            a: { name: "An Oak Barrel", detail: "53-gallon bourbon barrel, full", emoji: "🛢️", weight_lbs: 500, fun_fact: "Bourbon must be aged in new charred oak barrels by law" },
            b: { name: "A Harley-Davidson", detail: "Road Glide", emoji: "🏍️", weight_lbs: 770, fun_fact: "The Harley-Davidson V-twin engine design has remained fundamentally the same since 1909" },
            ratio: 0.65
        },
        {
            a: { name: "A Leatherback Sea Turtle", detail: "Adult female", emoji: "🐢", weight_lbs: 700, fun_fact: "Leatherback sea turtles can dive deeper than 4,000 feet" },
            b: { name: "A Holstein Cow", detail: "Average dairy cow", emoji: "🐄", weight_lbs: 1500, fun_fact: "The average dairy cow produces about 6.3 gallons of milk per day" },
            ratio: 0.47
        },
        {
            a: { name: "A Porta-Potty", detail: "Standard portable toilet", emoji: "🚽", weight_lbs: 170, fun_fact: "About 3 million porta-potties are in use across the US at any given time" },
            b: { name: "A Giant Tortoise", detail: "Galápagos tortoise", emoji: "🐢", weight_lbs: 250, fun_fact: "Galápagos tortoises can live over 175 years" },
            ratio: 0.68
        },
        {
            a: { name: "A Riding Lawn Mower", detail: "42-inch deck", emoji: "🚜", weight_lbs: 450, fun_fact: "The fastest riding lawn mower reached 150 mph — modified by Honda" },
            b: { name: "A Polar Bear", detail: "Adult female", emoji: "🐻‍❄️", weight_lbs: 650, fun_fact: "Polar bears can swim for days at a time, covering over 60 miles" },
            ratio: 0.69
        },
        {
            a: { name: "A Pinball Machine", detail: "Standard arcade size", emoji: "🕹️", weight_lbs: 250, fun_fact: "Pinball was banned in New York City from 1942 to 1976 because it was considered gambling" },
            b: { name: "A Tiger", detail: "Adult female Bengal tiger", emoji: "🐅", weight_lbs: 350, fun_fact: "Tigers are the largest of all wild cat species" },
            ratio: 0.71
        },
        {
            a: { name: "A Bathtub of Mercury", detail: "60 gallons of mercury", emoji: "🪩", weight_lbs: 6768, fun_fact: "Mercury is so dense that a cannonball would float on its surface" },
            b: { name: "A Ford Mustang", detail: "2024 GT model", emoji: "🚗", weight_lbs: 3800, fun_fact: "The Ford Mustang was named after the P-51 Mustang WWII fighter plane" },
            ratio: 0.56
        },
        {
            a: { name: "A Drum Kit", detail: "5-piece with hardware", emoji: "🥁", weight_lbs: 60, fun_fact: "The modern drum kit was invented in New Orleans in the early 1900s for jazz" },
            b: { name: "A Dishwasher", detail: "Built-in standard", emoji: "🍽️", weight_lbs: 77, fun_fact: "A dishwasher uses less water than hand washing — about 3-5 gallons per load" },
            ratio: 0.78
        },
        {
            a: { name: "A Cubic Meter of Air", detail: "At sea level, room temp", emoji: "💨", weight_lbs: 2.7, fun_fact: "Air has mass — the total atmosphere weighs 5.5 quadrillion tons" },
            b: { name: "A Loaf of Bread", detail: "Standard sliced bread", emoji: "🍞", weight_lbs: 1.3, fun_fact: "The phrase 'best thing since sliced bread' dates to 1928" },
            ratio: 0.48
        },
        {
            a: { name: "A Jukebox", detail: "Classic Wurlitzer", emoji: "🎵", weight_lbs: 300, fun_fact: "The word 'jukebox' comes from 'jook joints' — African American slang for a dance hall" },
            b: { name: "A Dolphin", detail: "Bottlenose, adult", emoji: "🐬", weight_lbs: 600, fun_fact: "Dolphins have names for each other and respond when called" },
            ratio: 0.50
        },
        {
            a: { name: "A Suit of Samurai Armor", detail: "Full ō-yoroi", emoji: "⚔️", weight_lbs: 45, fun_fact: "Samurai armor was designed to allow horseback archery and was lighter than European plate" },
            b: { name: "A Suit of Medieval Armor", detail: "Full Gothic plate", emoji: "🛡️", weight_lbs: 60, fun_fact: "Gothic plate armor from the 15th century was the most protective personal armor ever made" },
            ratio: 0.75
        },
        {
            a: { name: "An ATM Machine", detail: "Freestanding unit", emoji: "🏧", weight_lbs: 275, fun_fact: "The first ATM was installed in London in 1967 by Barclays Bank" },
            b: { name: "A Gorilla", detail: "Adult male silverback", emoji: "🦍", weight_lbs: 400, fun_fact: "Silverback gorillas can lift about 1,800 lbs — 10 times their body weight" },
            ratio: 0.69
        },
        {
            a: { name: "A Bathtub of Maple Syrup", detail: "60 gallons", emoji: "🍁", weight_lbs: 685, fun_fact: "It takes about 40 gallons of maple sap to make 1 gallon of maple syrup" },
            b: { name: "A Horse", detail: "Quarter horse", emoji: "🐴", weight_lbs: 1100, fun_fact: "Quarter horses are named for their speed in quarter-mile races" },
            ratio: 0.62
        },
        {
            a: { name: "A Phone Booth", detail: "Classic red British booth", emoji: "📞", weight_lbs: 1500, fun_fact: "The red K6 telephone box was designed by Sir Giles Gilbert Scott in 1935" },
            b: { name: "A Walrus", detail: "Adult Pacific walrus", emoji: "🦭", weight_lbs: 2700, fun_fact: "Walrus tusks can grow up to 3 feet long" },
            ratio: 0.56
        },
        {
            a: { name: "A Golf Cart", detail: "Standard 2-seater, electric", emoji: "🏌️", weight_lbs: 900, fun_fact: "Golf carts were originally designed for people with disabilities, not golfers" },
            b: { name: "A Holstein Cow", detail: "Dairy cow", emoji: "🐄", weight_lbs: 1500, fun_fact: "Cows can recognize and remember over 100 individual faces" },
            ratio: 0.60
        },
        {
            a: { name: "A Snow Leopard", detail: "Adult male", emoji: "🐆", weight_lbs: 120, fun_fact: "Snow leopards can jump up to 50 feet horizontally in a single leap" },
            b: { name: "A Great Dane", detail: "Adult male", emoji: "🐕", weight_lbs: 170, fun_fact: "Scooby-Doo is a Great Dane" },
            ratio: 0.71
        },
        {
            a: { name: "A Slot Machine", detail: "Casino floor model", emoji: "🎰", weight_lbs: 200, fun_fact: "The first slot machine was invented in 1891 in Brooklyn, New York" },
            b: { name: "A Giant Panda", detail: "Adult male", emoji: "🐼", weight_lbs: 300, fun_fact: "Giant pandas have an extra 'thumb' — an enlarged wrist bone for gripping bamboo" },
            ratio: 0.67
        },
        {
            a: { name: "A Cannonball", detail: "Civil War 12-pounder", emoji: "⚫", weight_lbs: 12, fun_fact: "Civil War cannons could fire a 12-pound ball about 1 mile" },
            b: { name: "A Bowling Ball", detail: "Maximum weight", emoji: "🎳", weight_lbs: 16, fun_fact: "The US has more bowling alleys than any other country" },
            ratio: 0.75
        },
        {
            a: { name: "A Water Heater", detail: "40-gallon tank, full", emoji: "🔥", weight_lbs: 410, fun_fact: "Water heaters are the second-largest energy consumer in most US homes" },
            b: { name: "A Harley-Davidson", detail: "Electra Glide Ultra", emoji: "🏍️", weight_lbs: 580, fun_fact: "The Electra Glide was the first Harley with an electric starter, in 1965" },
            ratio: 0.71
        },
        {
            a: { name: "A Komodo Dragon", detail: "Adult male", emoji: "🦎", weight_lbs: 150, fun_fact: "Komodo dragons have venom glands and bacteria-laden saliva for hunting" },
            b: { name: "An Adult Man", detail: "Global average", emoji: "🧑", weight_lbs: 170, fun_fact: "The average adult male worldwide weighs about 170 lbs" },
            ratio: 0.88
        },
        {
            a: { name: "A Cheetah", detail: "Adult male", emoji: "🐆", weight_lbs: 125, fun_fact: "Cheetahs can accelerate from 0 to 60 mph in just 3 seconds" },
            b: { name: "A Deer", detail: "White-tailed deer, adult buck", emoji: "🦌", weight_lbs: 150, fun_fact: "White-tailed deer can jump 8 feet high from a standing position" },
            ratio: 0.83
        },
        {
            a: { name: "A Jet Ski", detail: "Yamaha WaveRunner", emoji: "🚤", weight_lbs: 770, fun_fact: "The first personal watercraft was the Kawasaki Jet Ski, introduced in 1972" },
            b: { name: "A Moose", detail: "Adult cow moose", emoji: "🫎", weight_lbs: 900, fun_fact: "Moose cause more vehicle collisions in North America than any other large animal" },
            ratio: 0.86
        },
        {
            a: { name: "A Claw-Foot Bathtub", detail: "Cast iron, empty", emoji: "🛁", weight_lbs: 350, fun_fact: "Clawfoot bathtubs were first made in the 1700s based on Chinese furniture" },
            b: { name: "A Llama", detail: "Adult male", emoji: "🦙", weight_lbs: 400, fun_fact: "Llamas were first domesticated about 6,000 years ago in Peru" },
            ratio: 0.88
        },
        {
            a: { name: "A Welding Tank", detail: "Full acetylene tank", emoji: "🔥", weight_lbs: 240, fun_fact: "Oxyacetylene welding can reach temperatures of 6,300°F" },
            b: { name: "A Panda", detail: "Adult female", emoji: "🐼", weight_lbs: 220, fun_fact: "Female pandas are fertile for only 24-36 hours per year" },
            ratio: 0.92
        },
        {
            a: { name: "A Grandfather Clock", detail: "Traditional pendulum clock", emoji: "🕰️", weight_lbs: 150, fun_fact: "Grandfather clocks are called that because of an 1876 song by Henry Clay Work" },
            b: { name: "A Leopard", detail: "Adult male", emoji: "🐆", weight_lbs: 130, fun_fact: "Leopards are the strongest climbers among big cats, dragging prey up trees" },
            ratio: 0.87
        },
        {
            a: { name: "A Dumpster", detail: "2-yard commercial, empty", emoji: "🗑️", weight_lbs: 400, fun_fact: "The dumpster was invented by George Dempster of Knoxville, Tennessee in 1935" },
            b: { name: "A Bison", detail: "Adult female", emoji: "🦬", weight_lbs: 1000, fun_fact: "Yellowstone is the only place in the US where bison have lived continuously since prehistoric times" },
            ratio: 0.40
        },
        {
            a: { name: "A Pelican", detail: "American white pelican", emoji: "🐦", weight_lbs: 16, fun_fact: "A pelican's bill can hold up to 3 gallons of water" },
            b: { name: "A Bowling Ball", detail: "Maximum weight", emoji: "🎳", weight_lbs: 16, fun_fact: "There are 10 pins in bowling because 9-pin bowling was banned and a 10th pin was added to get around the law" },
            ratio: 1.0
        },
        {
            a: { name: "A Wood Chipper", detail: "Towable residential model", emoji: "🌲", weight_lbs: 1800, fun_fact: "Industrial wood chippers can shred trees up to 24 inches in diameter" },
            b: { name: "A Walrus", detail: "Adult male", emoji: "🦭", weight_lbs: 2700, fun_fact: "Male walruses use their tusks to haul themselves onto ice — 'odobenus' means 'tooth-walker'" },
            ratio: 0.67
        },
        {
            a: { name: "An Ostriches Egg", detail: "Single ostrich egg", emoji: "🥚", weight_lbs: 3.1, fun_fact: "An ostrich egg's shell is so strong a 220-lb person can stand on it" },
            b: { name: "A Human Brain", detail: "Average adult", emoji: "🧠", weight_lbs: 3.0, fun_fact: "Your brain has about 86 billion neurons" },
            ratio: 0.97
        },
        {
            a: { name: "A Porta-Potty", detail: "Standard unit, empty", emoji: "🚽", weight_lbs: 170, fun_fact: "About 2 million porta-potties are rented in the US during summer" },
            b: { name: "A Baby Grand Piano", detail: "5-foot model", emoji: "🎹", weight_lbs: 550, fun_fact: "Baby grand pianos produce a warmer tone than uprights due to longer strings" },
            ratio: 0.31
        },
        {
            a: { name: "A Blacksmith's Anvil", detail: "200-pound London pattern", emoji: "⚒️", weight_lbs: 200, fun_fact: "The sound of an anvil being struck is called 'ringing' and can be heard a mile away" },
            b: { name: "A Zebra", detail: "Adult Grevy's zebra", emoji: "🦓", weight_lbs: 900, fun_fact: "Grevy's zebras are the largest wild equines and are endangered" },
            ratio: 0.22
        },
        {
            a: { name: "An Espresso Machine", detail: "Commercial La Marzocca", emoji: "☕", weight_lbs: 140, fun_fact: "Espresso was invented in Italy in 1884 to speed up coffee making for workers" },
            b: { name: "A Leopard Seal", detail: "Adult female", emoji: "🦭", weight_lbs: 840, fun_fact: "Leopard seals are the only seals known to actively hunt warm-blooded prey" },
            ratio: 0.17
        },
        {
            a: { name: "A Cannonball", detail: "32-pounder naval shot", emoji: "⚫", weight_lbs: 32, fun_fact: "Naval cannons in the 1800s could fire a 32-pound ball over a mile" },
            b: { name: "An Otter", detail: "Sea otter, adult male", emoji: "🦦", weight_lbs: 65, fun_fact: "Sea otters hold hands while sleeping so they don't drift apart" },
            ratio: 0.49
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
        },
        // === NEW TIER 4 ENTRIES ===
        {
            a: { name: "A Bison", detail: "Adult male", emoji: "🦬", weight_lbs: 2000, fun_fact: "Bison can run up to 35 mph and jump 6 feet vertically" },
            b: { name: "A Honda Civic", detail: "2024 sedan, empty", emoji: "🚗", weight_lbs: 2900, fun_fact: "The Honda Civic has been sold in over 160 countries" },
            ratio: 0.69
        },
        {
            a: { name: "A Leopard", detail: "Adult male African leopard", emoji: "🐆", weight_lbs: 130, fun_fact: "Leopards can carry prey twice their body weight up a tree" },
            b: { name: "An Adult Woman", detail: "Average American woman", emoji: "👩", weight_lbs: 170, fun_fact: "The average American woman today weighs the same as the average man in the 1960s" },
            ratio: 0.76
        },
        {
            a: { name: "A Treadmill", detail: "Commercial gym model", emoji: "🏃", weight_lbs: 300, fun_fact: "Treadmills were invented in 1818 as a prison punishment device" },
            b: { name: "A Llama", detail: "Adult male", emoji: "🦙", weight_lbs: 350, fun_fact: "Llamas hum when they're curious, happy, or worried" },
            ratio: 0.86
        },
        {
            a: { name: "A Couch", detail: "3-seat sofa", emoji: "🛋️", weight_lbs: 150, fun_fact: "The average American couch has about 18 cents in lost change in it" },
            b: { name: "An Adult Male Gorilla", detail: "Silverback", emoji: "🦍", weight_lbs: 400, fun_fact: "Gorillas make new nests to sleep in every single night" },
            ratio: 0.38
        },
        {
            a: { name: "A Dalmatian", detail: "Adult, 55 lbs", emoji: "🐕‍🦺", weight_lbs: 55, fun_fact: "Dalmatians are the only dog breed with true spots" },
            b: { name: "An Australian Shepherd", detail: "Adult male", emoji: "🐕", weight_lbs: 65, fun_fact: "Australian Shepherds were actually developed in the western US, not Australia" },
            ratio: 0.85
        },
        {
            a: { name: "A Harp", detail: "Concert grand harp", emoji: "🎵", weight_lbs: 80, fun_fact: "A concert harp has 47 strings and 7 foot pedals" },
            b: { name: "A Dishwasher", detail: "Standard built-in", emoji: "🍽️", weight_lbs: 90, fun_fact: "Dishwashers save about 230 hours per year compared to hand washing" },
            ratio: 0.89
        },
        {
            a: { name: "A Mountain Gorilla", detail: "Adult male silverback", emoji: "🦍", weight_lbs: 430, fun_fact: "Fewer than 1,000 mountain gorillas remain in the wild" },
            b: { name: "A Motorcycle", detail: "Yamaha MT-07", emoji: "🏍️", weight_lbs: 400, fun_fact: "The Yamaha MT series was designed as the 'Masters of Torque'" },
            ratio: 0.93
        },
        {
            a: { name: "A Recliner", detail: "Leather La-Z-Boy", emoji: "🪑", weight_lbs: 100, fun_fact: "La-Z-Boy was founded in 1927 by two cousins in Monroe, Michigan" },
            b: { name: "A Washing Machine", detail: "Top-load washer", emoji: "🧺", weight_lbs: 120, fun_fact: "The first electric-powered washing machine was invented in 1908" },
            ratio: 0.83
        },
        {
            a: { name: "A Siberian Husky", detail: "Adult male", emoji: "🐕", weight_lbs: 55, fun_fact: "Huskies can run 100 miles per day during the Iditarod sled race" },
            b: { name: "A Labrador Retriever", detail: "Adult male", emoji: "🐕", weight_lbs: 75, fun_fact: "Labs are the most popular dog breed in the US for over 30 years" },
            ratio: 0.73
        },
        {
            a: { name: "A Swordfish", detail: "Adult Atlantic swordfish", emoji: "🐟", weight_lbs: 400, fun_fact: "Swordfish can swim at speeds up to 60 mph — one of the fastest fish" },
            b: { name: "A Grizzly Bear", detail: "Adult female", emoji: "🐻", weight_lbs: 450, fun_fact: "Grizzly bears have a bite force of about 1,200 PSI" },
            ratio: 0.89
        },
        {
            a: { name: "A Jacuzzi Pump", detail: "Commercial spa pump", emoji: "🛁", weight_lbs: 70, fun_fact: "The Jacuzzi brand was started by an Italian immigrant family in California in 1915" },
            b: { name: "A Large Dog", detail: "Rottweiler, adult male", emoji: "🐕", weight_lbs: 95, fun_fact: "Rottweilers were used to pull carts for butchers in Germany" },
            ratio: 0.74
        },
        {
            a: { name: "A Stingray", detail: "Southern stingray", emoji: "🐟", weight_lbs: 200, fun_fact: "Stingrays don't use their barb to hunt — only for self-defense" },
            b: { name: "A Panda", detail: "Giant panda, adult", emoji: "🐼", weight_lbs: 250, fun_fact: "A panda's diet is 99% bamboo, but they have the digestive system of a carnivore" },
            ratio: 0.80
        },
        {
            a: { name: "A Queen-Size Mattress", detail: "Innerspring", emoji: "🛏️", weight_lbs: 100, fun_fact: "The average mattress doubles in weight over 10 years due to dust mites and dead skin" },
            b: { name: "A Refrigerator", detail: "Standard top-freezer", emoji: "🧊", weight_lbs: 120, fun_fact: "Albert Einstein co-invented a type of refrigerator in 1926" },
            ratio: 0.83
        },
        {
            a: { name: "A Marimba", detail: "Concert 5-octave", emoji: "🎵", weight_lbs: 200, fun_fact: "The marimba originated in Central America and is Guatemala's national instrument" },
            b: { name: "A Tiger", detail: "Adult female Bengal", emoji: "🐅", weight_lbs: 250, fun_fact: "Tigers are the only cat species that enjoy swimming" },
            ratio: 0.80
        },
        {
            a: { name: "A Clothes Washer", detail: "Front-load, commercial", emoji: "🧺", weight_lbs: 200, fun_fact: "Commercial washers spin at up to 1,200 RPM during the spin cycle" },
            b: { name: "An Adult Male Cougar", detail: "Mountain lion", emoji: "🐈", weight_lbs: 220, fun_fact: "Cougars hold the Guinness record for the animal with the most names — over 40" },
            ratio: 0.91
        },
        {
            a: { name: "A Wheelchair", detail: "Power wheelchair", emoji: "🦽", weight_lbs: 250, fun_fact: "The first known wheelchair was made for King Philip II of Spain in 1595" },
            b: { name: "A Pig", detail: "Adult domestic pig", emoji: "🐷", weight_lbs: 300, fun_fact: "Pigs can be trained to play video games using joysticks" },
            ratio: 0.83
        },
        {
            a: { name: "A Wine Refrigerator", detail: "46-bottle capacity", emoji: "🍷", weight_lbs: 65, fun_fact: "Wine has been made for at least 8,000 years, originating in Georgia (the country)" },
            b: { name: "A Dishwasher", detail: "Full-size built-in", emoji: "🍽️", weight_lbs: 77, fun_fact: "Modern dishwashers use about 3 gallons of water per cycle" },
            ratio: 0.84
        },
        {
            a: { name: "A Drum Kit", detail: "5-piece with cymbals", emoji: "🥁", weight_lbs: 60, fun_fact: "The modern drum kit was born in New Orleans when jazz drummers combined multiple instruments" },
            b: { name: "An Alpaca", detail: "Adult male", emoji: "🦙", weight_lbs: 175, fun_fact: "Alpaca fiber is warmer, lighter, and softer than sheep's wool" },
            ratio: 0.34
        },
        {
            a: { name: "A Punching Bag", detail: "Heavy bag, 100 lb", emoji: "🥊", weight_lbs: 100, fun_fact: "Muhammad Ali could punch with a force of about 700 lbs" },
            b: { name: "A Giant Tortoise", detail: "Aldabra giant tortoise", emoji: "🐢", weight_lbs: 550, fun_fact: "The oldest known tortoise, Jonathan, was born around 1832 and is still alive" },
            ratio: 0.18
        },
        {
            a: { name: "An Upright Piano", detail: "Standard 48-inch", emoji: "🎹", weight_lbs: 500, fun_fact: "An upright piano has over 7,500 parts — almost as many as a grand" },
            b: { name: "A Moose", detail: "Adult cow moose", emoji: "🫎", weight_lbs: 600, fun_fact: "Female moose aggressively protect their calves and cause more injuries than bears in Alaska" },
            ratio: 0.83
        },
        {
            a: { name: "A Foosball Table", detail: "Tournament model", emoji: "⚽", weight_lbs: 160, fun_fact: "Foosball was patented in 1923 by Harold Searles Thornton in the UK" },
            b: { name: "A Kangaroo", detail: "Adult male red kangaroo", emoji: "🦘", weight_lbs: 200, fun_fact: "Red kangaroos can cover 25 feet in a single leap" },
            ratio: 0.80
        },
        {
            a: { name: "A Wooden Canoe", detail: "16-foot cedar strip", emoji: "🛶", weight_lbs: 55, fun_fact: "Cedar strip canoes can take over 200 hours of labor to build by hand" },
            b: { name: "A Kayak", detail: "Whitewater kayak", emoji: "🛶", weight_lbs: 65, fun_fact: "Olympic whitewater kayaking courses are man-made with pumped water" },
            ratio: 0.85
        },
        {
            a: { name: "A Safe", detail: "Home gun safe", emoji: "🔒", weight_lbs: 600, fun_fact: "The vault door at Fort Knox weighs over 20 tons and is blast-proof" },
            b: { name: "A Horse", detail: "Arabian horse", emoji: "🐴", weight_lbs: 900, fun_fact: "Arabian horses have one fewer vertebra, rib, and tail bone than other breeds" },
            ratio: 0.67
        },
        {
            a: { name: "A Stand-Up Paddleboard", detail: "Inflatable SUP", emoji: "🏄", weight_lbs: 20, fun_fact: "Stand-up paddleboarding originated in Hawaii in the 1940s" },
            b: { name: "A Large Suitcase", detail: "Fully packed", emoji: "🧳", weight_lbs: 50, fun_fact: "The first rolling suitcase was invented in 1970 but didn't catch on until 1987" },
            ratio: 0.40
        },
        {
            a: { name: "A Wombat", detail: "Common wombat, adult", emoji: "🐻", weight_lbs: 55, fun_fact: "Wombats are the only animals whose poop is cube-shaped" },
            b: { name: "A Dalmatian", detail: "Adult male", emoji: "🐕‍🦺", weight_lbs: 55, fun_fact: "About 30% of Dalmatians are deaf in one or both ears" },
            ratio: 1.0
        },
        {
            a: { name: "A Hay Bale", detail: "Round bale", emoji: "🌾", weight_lbs: 1200, fun_fact: "Round bales were invented in the 1960s and shed water better than square bales" },
            b: { name: "A Polar Bear", detail: "Adult male", emoji: "🐻‍❄️", weight_lbs: 1200, fun_fact: "Polar bears have black skin under their transparent fur" },
            ratio: 1.0
        },
        {
            a: { name: "A Window AC Unit", detail: "Standard 12,000 BTU", emoji: "❄️", weight_lbs: 55, fun_fact: "Willis Carrier invented modern air conditioning in 1902 for a printing company" },
            b: { name: "A Beaver", detail: "North American beaver", emoji: "🦫", weight_lbs: 55, fun_fact: "Beavers' teeth never stop growing — they must chew wood to keep them filed" },
            ratio: 1.0
        },
        {
            a: { name: "A Mattress", detail: "Twin-size innerspring", emoji: "🛏️", weight_lbs: 60, fun_fact: "The most expensive mattress in the world costs $4.2 million and is made with horsehair" },
            b: { name: "A Cheetah", detail: "Adult male", emoji: "🐆", weight_lbs: 125, fun_fact: "Cheetahs are the only big cats that can't roar — they chirp and purr instead" },
            ratio: 0.48
        },
        {
            a: { name: "An Orangutan", detail: "Adult male Bornean", emoji: "🦧", weight_lbs: 180, fun_fact: "Orangutans use tools and have been observed using sticks to fish for insects" },
            b: { name: "A Gorilla", detail: "Adult female", emoji: "🦍", weight_lbs: 200, fun_fact: "Female gorillas are about half the size of silverback males" },
            ratio: 0.90
        },
        {
            a: { name: "A Dishwasher", detail: "Portable countertop", emoji: "🍽️", weight_lbs: 50, fun_fact: "Countertop dishwashers use as little as 2 gallons of water per cycle" },
            b: { name: "A Siberian Husky", detail: "Adult male", emoji: "🐕", weight_lbs: 55, fun_fact: "Huskies' eyes can be brown, blue, or one of each (heterochromia)" },
            ratio: 0.91
        },
        {
            a: { name: "A Manatee Calf", detail: "Newborn Florida manatee", emoji: "🦭", weight_lbs: 60, fun_fact: "Manatee calves can swim to the surface on their own within minutes of birth" },
            b: { name: "A Bulldog", detail: "English Bulldog, adult", emoji: "🐕", weight_lbs: 50, fun_fact: "Bulldogs were originally bred for bull-baiting in 13th-century England" },
            ratio: 0.83
        },
        {
            a: { name: "A Pygmy Hippo", detail: "Adult", emoji: "🦛", weight_lbs: 600, fun_fact: "Pygmy hippos are 10 times lighter than their common hippo cousins" },
            b: { name: "An Elk", detail: "Adult female (cow)", emoji: "🦌", weight_lbs: 500, fun_fact: "Elk are one of the largest land mammals in North America" },
            ratio: 0.83
        },
        {
            a: { name: "A Tuba", detail: "Concert tuba, BBb", emoji: "🎺", weight_lbs: 25, fun_fact: "The largest tuba in the world stands over 7 feet tall" },
            b: { name: "A Microwave Oven", detail: "Full-size, 2.2 cu ft", emoji: "📻", weight_lbs: 30, fun_fact: "About 90% of American households own a microwave" },
            ratio: 0.83
        },
        {
            a: { name: "An Electric Guitar", detail: "Fender Stratocaster", emoji: "🎸", weight_lbs: 8, fun_fact: "The Fender Stratocaster was introduced in 1954 and is the most copied guitar design" },
            b: { name: "A Salmon", detail: "King salmon, adult", emoji: "🐟", weight_lbs: 25, fun_fact: "King salmon is the largest Pacific salmon species, sometimes exceeding 100 lbs" },
            ratio: 0.32
        },
        {
            a: { name: "A Badger", detail: "European badger, adult", emoji: "🦡", weight_lbs: 26, fun_fact: "Badgers can run at 19 mph and are related to weasels and otters" },
            b: { name: "A Corgi", detail: "Pembroke Welsh Corgi", emoji: "🐕", weight_lbs: 28, fun_fact: "The word 'corgi' may mean 'dwarf dog' in Welsh" },
            ratio: 0.93
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
        },
        // === NEW TIER 5 ENTRIES ===
        {
            a: { name: "A Nickel", detail: "US 5-cent coin", emoji: "🪙", weight_lbs: 0.011, fun_fact: "US nickels are actually 75% copper and only 25% nickel" },
            b: { name: "A Quarter", detail: "US 25-cent coin", emoji: "🪙", weight_lbs: 0.013, fun_fact: "George Washington has been on the quarter since 1932" },
            ratio: 0.85
        },
        {
            a: { name: "A Liter of Honey", detail: "Raw wildflower honey", emoji: "🍯", weight_lbs: 3.13, fun_fact: "A single bee produces only 1/12 of a teaspoon of honey in its lifetime" },
            b: { name: "A Liter of Maple Syrup", detail: "Pure Grade A", emoji: "🍁", weight_lbs: 2.93, fun_fact: "Canada produces about 71% of the world's maple syrup" },
            ratio: 0.94
        },
        {
            a: { name: "A Regulation Football", detail: "Official NFL ball", emoji: "🏈", weight_lbs: 0.91, fun_fact: "Every NFL ball is handmade at Wilson's factory in Ada, Ohio" },
            b: { name: "A Soccer Ball", detail: "FIFA match ball", emoji: "⚽", weight_lbs: 0.94, fun_fact: "The original World Cup trophy was stolen in 1983 and never recovered" },
            ratio: 0.97
        },
        {
            a: { name: "A Cubic Foot of Oak", detail: "White oak, dried", emoji: "🌳", weight_lbs: 47, fun_fact: "White oak was used to build the USS Constitution — 'Old Ironsides'" },
            b: { name: "A Cubic Foot of Maple", detail: "Sugar maple, dried", emoji: "🌳", weight_lbs: 44, fun_fact: "Sugar maples can live for over 400 years" },
            ratio: 0.94
        },
        {
            a: { name: "A Gallon of Diesel", detail: "Ultra-low sulfur", emoji: "⛽", weight_lbs: 7.1, fun_fact: "Diesel engines are about 45% efficient vs 30% for gasoline engines" },
            b: { name: "A Gallon of Water", detail: "At room temperature", emoji: "💧", weight_lbs: 8.34, fun_fact: "A person can survive about 3 days without water" },
            ratio: 0.85
        },
        {
            a: { name: "A Pug", detail: "Adult, healthy weight", emoji: "🐕", weight_lbs: 16, fun_fact: "Pugs were bred to be lap dogs for Chinese emperors" },
            b: { name: "A Beagle", detail: "Adult male", emoji: "🐕", weight_lbs: 22, fun_fact: "Beagles have about 220 million scent receptors — 44× more than humans" },
            ratio: 0.73
        },
        {
            a: { name: "A Box of Copy Paper", detail: "5,000 sheets, letter size", emoji: "📄", weight_lbs: 50, fun_fact: "A single tree can produce about 8,333 sheets of paper" },
            b: { name: "A Siberian Husky", detail: "Adult male", emoji: "🐕", weight_lbs: 55, fun_fact: "Huskies have a double coat that keeps them warm at -60°F" },
            ratio: 0.91
        },
        {
            a: { name: "A Gallon of Orange Juice", detail: "Fresh-squeezed", emoji: "🍊", weight_lbs: 8.7, fun_fact: "It takes about 13 oranges to make one gallon of orange juice" },
            b: { name: "A Gallon of Whole Milk", detail: "3.25% fat", emoji: "🥛", weight_lbs: 8.6, fun_fact: "Humans are the only species that drinks milk from another species" },
            ratio: 0.99
        },
        {
            a: { name: "Mars", detail: "The entire planet", emoji: "🪐", weight_lbs: 1.41e+24, fun_fact: "A day on Mars is only 37 minutes longer than a day on Earth" },
            b: { name: "Venus", detail: "The entire planet", emoji: "🪐", weight_lbs: 1.07e+25, fun_fact: "Venus rotates so slowly that a day is longer than its year" },
            ratio: 0.13
        },
        {
            a: { name: "A Cricket Ball", detail: "Official ICC ball", emoji: "🏏", weight_lbs: 0.36, fun_fact: "Cricket balls are handmade from cork, leather, and string" },
            b: { name: "A Baseball", detail: "Official MLB ball", emoji: "⚾", weight_lbs: 0.32, fun_fact: "MLB baseballs are rubbed with special mud from a secret New Jersey location" },
            ratio: 0.89
        },
        {
            a: { name: "A Liter of Corn Oil", detail: "Pure corn oil", emoji: "🌽", weight_lbs: 2.03, fun_fact: "Corn oil was first extracted commercially in 1898" },
            b: { name: "A Liter of Olive Oil", detail: "Extra virgin", emoji: "🫒", weight_lbs: 2.02, fun_fact: "The oldest olive tree is estimated to be over 3,000 years old in Crete" },
            ratio: 0.995
        },
        {
            a: { name: "A Liter of Beer", detail: "Standard lager", emoji: "🍺", weight_lbs: 2.23, fun_fact: "The oldest known beer recipe is from a 3,900-year-old Sumerian poem" },
            b: { name: "A Liter of Whole Milk", detail: "Fresh", emoji: "🥛", weight_lbs: 2.28, fun_fact: "Milk is slightly heavier than water due to dissolved sugars, fats, and proteins" },
            ratio: 0.98
        },
        {
            a: { name: "A Chicken", detail: "Laying hen", emoji: "🐔", weight_lbs: 5.5, fun_fact: "A chicken can run at about 9 mph — faster than most humans think" },
            b: { name: "A Rabbit", detail: "Flemish Giant", emoji: "🐰", weight_lbs: 15, fun_fact: "Flemish Giant rabbits can grow to be over 2.5 feet long" },
            ratio: 0.37
        },
        {
            a: { name: "A Javelin", detail: "Men's competition javelin", emoji: "🏅", weight_lbs: 1.76, fun_fact: "The men's javelin weighs exactly 800 grams — unchanged since 1986" },
            b: { name: "A Shot Put", detail: "Men's competition shot", emoji: "🏅", weight_lbs: 16, fun_fact: "The men's shot put has weighed 16 lbs since the first modern Olympics" },
            ratio: 0.11
        },
        {
            a: { name: "A Pomelo", detail: "Large citrus fruit", emoji: "🍊", weight_lbs: 2.2, fun_fact: "The pomelo is the largest citrus fruit and ancestor of the grapefruit" },
            b: { name: "A Coconut", detail: "Mature, with husk", emoji: "🥥", weight_lbs: 3.3, fun_fact: "Falling coconuts kill about 150 people worldwide each year" },
            ratio: 0.67
        },
        {
            a: { name: "A Horseshoe", detail: "Standard steel horseshoe", emoji: "🐴", weight_lbs: 1.5, fun_fact: "Horseshoes are traditionally considered lucky because they're made of iron, which repels fairies" },
            b: { name: "A Hammer", detail: "Standard claw hammer", emoji: "🔨", weight_lbs: 1.25, fun_fact: "The oldest known hammer is about 3.3 million years old from Ethiopia" },
            ratio: 0.83
        },
        {
            a: { name: "An Avocado", detail: "Large Hass avocado", emoji: "🥑", weight_lbs: 0.5, fun_fact: "Avocados are technically berries and are toxic to most birds" },
            b: { name: "A Mango", detail: "Large Alphonso mango", emoji: "🥭", weight_lbs: 0.55, fun_fact: "The mango is the national fruit of India, Pakistan, and the Philippines" },
            ratio: 0.91
        },
        {
            a: { name: "A Liter of Seawater", detail: "Average salinity", emoji: "🌊", weight_lbs: 2.27, fun_fact: "If you extracted all the salt from the ocean, it would cover the land 5 feet deep" },
            b: { name: "A Liter of Freshwater", detail: "Pure H₂O at 4°C", emoji: "💧", weight_lbs: 2.20, fun_fact: "Water is densest at 4°C (39°F), which is why lakes freeze from the top" },
            ratio: 0.97
        },
        {
            a: { name: "A Dozen Eggs", detail: "Large chicken eggs", emoji: "🥚", weight_lbs: 1.68, fun_fact: "The US produces about 100 billion eggs per year" },
            b: { name: "A Dozen Donuts", detail: "Glazed donuts", emoji: "🍩", weight_lbs: 2.25, fun_fact: "Americans consume about 10 billion donuts every year" },
            ratio: 0.75
        },
        {
            a: { name: "A Violin", detail: "Professional instrument", emoji: "🎻", weight_lbs: 1.0, fun_fact: "The most expensive violin ever sold was a Stradivarius for $15.9 million" },
            b: { name: "A Ukulele", detail: "Concert size", emoji: "🎸", weight_lbs: 1.1, fun_fact: "The ukulele was invented in Hawaii by Portuguese immigrants in the 1880s" },
            ratio: 0.91
        },
        {
            a: { name: "A Human Kidney", detail: "Single adult kidney", emoji: "🫘", weight_lbs: 0.31, fun_fact: "Your kidneys filter about 50 gallons of blood every day" },
            b: { name: "A Human Heart", detail: "Adult heart", emoji: "🫀", weight_lbs: 0.66, fun_fact: "Your heart pumps about 2,000 gallons of blood every day" },
            ratio: 0.47
        },
        {
            a: { name: "A Croquet Ball", detail: "Regulation 16 oz ball", emoji: "⚽", weight_lbs: 1.0, fun_fact: "Croquet was an Olympic sport in 1900 — only one non-French spectator attended" },
            b: { name: "A Bocce Ball", detail: "Official 920g ball", emoji: "⚽", weight_lbs: 2.0, fun_fact: "Bocce ball dates back to ancient Egypt around 5000 BC" },
            ratio: 0.50
        },
        {
            a: { name: "A Badminton Shuttlecock", detail: "Feathered competition", emoji: "🏸", weight_lbs: 0.011, fun_fact: "Shuttlecocks can be hit at over 300 mph — the fastest racket sport shot" },
            b: { name: "A Table Tennis Ball", detail: "Official 40mm ball", emoji: "🏓", weight_lbs: 0.006, fun_fact: "Table tennis was banned in the Soviet Union from 1930-1950 for being bad for eyesight" },
            ratio: 0.55
        },
        {
            a: { name: "A Human Lung", detail: "Single lung", emoji: "🫁", weight_lbs: 1.3, fun_fact: "Your left lung is about 10% smaller than your right to make room for your heart" },
            b: { name: "A Human Liver", detail: "Healthy adult", emoji: "🫀", weight_lbs: 3.3, fun_fact: "The liver performs over 500 different functions" },
            ratio: 0.39
        },
        {
            a: { name: "A Tungsten Ring", detail: "Men's wedding band", emoji: "💍", weight_lbs: 0.053, fun_fact: "Tungsten rings are so hard they must be cracked off in emergencies, not cut" },
            b: { name: "A Gold Ring", detail: "14K men's band", emoji: "💍", weight_lbs: 0.044, fun_fact: "The tradition of wedding rings dates back to ancient Egypt over 4,800 years ago" },
            ratio: 0.83
        },
        {
            a: { name: "A Liter of Rubbing Alcohol", detail: "Isopropyl 70%", emoji: "🧴", weight_lbs: 1.74, fun_fact: "Isopropyl alcohol evaporates 3× faster than water" },
            b: { name: "A Liter of Vinegar", detail: "White distilled", emoji: "🫙", weight_lbs: 2.22, fun_fact: "Vinegar was discovered by accident about 10,000 years ago from wine left out too long" },
            ratio: 0.78
        },
        {
            a: { name: "A Lacrosse Ball", detail: "Official ball", emoji: "🥍", weight_lbs: 0.32, fun_fact: "Lacrosse is North America's oldest organized sport, played by Native Americans for centuries" },
            b: { name: "A Baseball", detail: "Official MLB ball", emoji: "⚾", weight_lbs: 0.32, fun_fact: "A baseball's core is made of cork and rubber wound with 369 yards of yarn" },
            ratio: 1.0
        },
        {
            a: { name: "A Bottle of Wine", detail: "Standard 750ml bottle", emoji: "🍷", weight_lbs: 2.65, fun_fact: "The world's oldest unopened bottle of wine dates to 325 AD" },
            b: { name: "A Bottle of Champagne", detail: "Standard 750ml", emoji: "🍾", weight_lbs: 3.3, fun_fact: "Champagne bottles use thicker glass because the pressure inside is 3× that of a car tire" },
            ratio: 0.80
        },
        {
            a: { name: "An Orange", detail: "Large navel orange", emoji: "🍊", weight_lbs: 0.44, fun_fact: "The color orange was named after the fruit, not the other way around" },
            b: { name: "An Apple", detail: "Large Honeycrisp", emoji: "🍎", weight_lbs: 0.5, fun_fact: "The Honeycrisp apple was developed at the University of Minnesota in 1991" },
            ratio: 0.88
        },
        {
            a: { name: "Earth", detail: "Our planet", emoji: "🌍", weight_lbs: 1.32e+25, fun_fact: "Earth gains about 100 tons of cosmic dust every day" },
            b: { name: "Neptune", detail: "The ice giant", emoji: "🪐", weight_lbs: 2.26e+26, fun_fact: "Neptune has the fastest winds in the solar system — over 1,200 mph" },
            ratio: 0.058
        },
        {
            a: { name: "A Grapefruit", detail: "Large Ruby Red", emoji: "🍊", weight_lbs: 0.75, fun_fact: "Grapefruit can interfere with over 85 medications" },
            b: { name: "A Pomegranate", detail: "Large fruit", emoji: "🍎", weight_lbs: 0.77, fun_fact: "A single pomegranate contains about 600-1,400 seeds" },
            ratio: 0.97
        },
        {
            a: { name: "A Rugby Ball", detail: "Official World Rugby ball", emoji: "🏉", weight_lbs: 0.95, fun_fact: "Early rugby balls were made from pig bladders, giving them their oval shape" },
            b: { name: "A Football", detail: "Official NFL ball", emoji: "🏈", weight_lbs: 0.91, fun_fact: "NFL footballs are still made from cowhide, not pigskin" },
            ratio: 0.96
        },
        {
            a: { name: "A Cup of Coffee", detail: "12 oz with ceramic mug", emoji: "☕", weight_lbs: 1.5, fun_fact: "Coffee is the most popular beverage in the world after water" },
            b: { name: "A Pint of Beer", detail: "16 oz in a glass", emoji: "🍺", weight_lbs: 1.6, fun_fact: "The oldest brewery still operating is Weihenstephan in Germany, founded in 1040" },
            ratio: 0.94
        },
        {
            a: { name: "A Cucumber", detail: "Standard English cucumber", emoji: "🥒", weight_lbs: 0.75, fun_fact: "Cucumbers are 96% water — the highest of any food" },
            b: { name: "A Zucchini", detail: "Medium zucchini", emoji: "🥒", weight_lbs: 0.5, fun_fact: "The largest zucchini ever grown was over 8 feet long" },
            ratio: 0.67
        },
        {
            a: { name: "A Bowling Pin", detail: "Official USBC pin", emoji: "🎳", weight_lbs: 3.5, fun_fact: "Bowling pins are made from hard maple wood and coated with plastic" },
            b: { name: "A Chihuahua", detail: "Small adult", emoji: "🐕", weight_lbs: 4, fun_fact: "The smallest dog ever recorded was a Chihuahua named Miracle Milly at 3.8 inches tall" },
            ratio: 0.88
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
    },
    // === NEW WILDCARD ENTRIES ===
    {
        a: { name: "The Rosetta Stone", detail: "British Museum artifact", emoji: "🪨", weight_lbs: 1680, fun_fact: "The Rosetta Stone unlocked the ability to read Egyptian hieroglyphs after 1,400 years" },
        b: { name: "A Grand Piano", detail: "Steinway Model D", emoji: "🎹", weight_lbs: 990, fun_fact: "Steinway pianos take about a year to build" },
        ratio: 0.59
    },
    {
        a: { name: "All the Rubber Ducks Ever Made", detail: "~500 million ducks", emoji: "🦆", weight_lbs: 165000000, fun_fact: "Eric Carle popularized rubber ducks with his book '10 Little Rubber Ducks'" },
        b: { name: "The Eiffel Tower", detail: "Total structure", emoji: "🗼", weight_lbs: 16535000, fun_fact: "The Eiffel Tower was originally intended to be demolished after 20 years" },
        ratio: 0.10
    },
    {
        a: { name: "The Curiosity Mars Rover", detail: "On Mars right now", emoji: "🤖", weight_lbs: 1982, fun_fact: "Curiosity sings 'Happy Birthday' to itself on Mars every year on August 5th" },
        b: { name: "A Hippo", detail: "Adult male", emoji: "🦛", weight_lbs: 4000, fun_fact: "Hippos secrete a red substance called 'blood sweat' that acts as sunscreen" },
        ratio: 0.50
    },
    {
        a: { name: "All the Baseballs Used in an MLB Season", detail: "~900,000 balls", emoji: "⚾", weight_lbs: 288000, fun_fact: "Each MLB ball is used for an average of only 6 pitches before being replaced" },
        b: { name: "A Blue Whale", detail: "Adult, fully grown", emoji: "🐋", weight_lbs: 300000, fun_fact: "A blue whale's blood vessels are wide enough to swim through" },
        ratio: 0.96
    },
    {
        a: { name: "The Leaning Tower of Pisa", detail: "Marble and stone", emoji: "🏛️", weight_lbs: 32000000, fun_fact: "The Leaning Tower of Pisa took 177 years to build and started leaning during construction" },
        b: { name: "The Eiffel Tower", detail: "Iron structure", emoji: "🗼", weight_lbs: 16535000, fun_fact: "The Eiffel Tower has been repainted 19 times in its history" },
        ratio: 0.52
    },
    {
        a: { name: "An Olympic Swimming Pool of Water", detail: "660,000 gallons", emoji: "🏊", weight_lbs: 5500000, fun_fact: "An Olympic pool must be exactly 50 meters long, 25 meters wide, and at least 2 meters deep" },
        b: { name: "A Fully Loaded Boeing 777", detail: "Max takeoff weight", emoji: "✈️", weight_lbs: 775000, fun_fact: "The 777 was the first Boeing aircraft designed entirely on computers" },
        ratio: 0.14
    },
    {
        a: { name: "All the Cheese Eaten in the US Yearly", detail: "~14 billion lbs", emoji: "🧀", weight_lbs: 14000000000, fun_fact: "The US produces more cheese than any other country — about 13 billion lbs per year" },
        b: { name: "The Great Wall of China", detail: "Total estimated mass", emoji: "🏯", weight_lbs: 1.16e+13, fun_fact: "The Great Wall stretches over 13,000 miles and took over 2,000 years to build" },
        ratio: 0.001
    },
    {
        a: { name: "The Hindenburg Airship", detail: "Fully loaded", emoji: "🎈", weight_lbs: 462000, fun_fact: "The Hindenburg was as long as the Titanic and could cross the Atlantic in 2.5 days" },
        b: { name: "The International Space Station", detail: "Complete station", emoji: "🛸", weight_lbs: 925000, fun_fact: "The ISS has been continuously inhabited since November 2000" },
        ratio: 0.50
    },
    {
        a: { name: "A Transatlantic Submarine Cable", detail: "TAT-14, full length", emoji: "🔌", weight_lbs: 12000000, fun_fact: "Over 95% of all international data travels through undersea cables, not satellites" },
        b: { name: "The Titanic", detail: "Empty displacement", emoji: "🚢", weight_lbs: 104000000, fun_fact: "The Titanic used 600 tons of coal per day at full speed" },
        ratio: 0.12
    },
    {
        a: { name: "A Thunderstorm Cloud", detail: "Typical cumulonimbus", emoji: "⛈️", weight_lbs: 2200000000, fun_fact: "A single cumulonimbus cloud can contain 300,000 tons of water" },
        b: { name: "The Golden Gate Bridge", detail: "Total weight", emoji: "🌉", weight_lbs: 1680000000, fun_fact: "The Golden Gate Bridge was painted International Orange so it would be visible in fog" },
        ratio: 0.76
    },
    {
        a: { name: "All the Pennies in the US", detail: "~150 billion pennies", emoji: "🪙", weight_lbs: 825000000, fun_fact: "It costs 2.72 cents to make a single penny" },
        b: { name: "A Cruise Ship", detail: "Symphony of the Seas", emoji: "🚢", weight_lbs: 500000000, fun_fact: "The Symphony of the Seas burns 250 tons of fuel per day" },
        ratio: 0.61
    },
    {
        a: { name: "Jupiter", detail: "The gas giant", emoji: "🪐", weight_lbs: 4.19e+27, fun_fact: "Jupiter has at least 95 known moons and could fit all other planets inside it" },
        b: { name: "The Sun", detail: "Our star", emoji: "☀️", weight_lbs: 4.38e+30, fun_fact: "The Sun makes up 99.86% of all mass in the solar system" },
        ratio: 0.001
    },
    {
        a: { name: "An Iceberg", detail: "Average North Atlantic iceberg", emoji: "🧊", weight_lbs: 440000000, fun_fact: "Only about 10% of an iceberg is visible above water" },
        b: { name: "The Great Pyramid", detail: "Of Giza", emoji: "🔺", weight_lbs: 13200000000, fun_fact: "The Great Pyramid's base is level to within 2.1 centimeters" },
        ratio: 0.033
    },
    {
        a: { name: "All the Coffee Consumed Daily", detail: "Worldwide, ~3 billion cups", emoji: "☕", weight_lbs: 1650000000, fun_fact: "Coffee is the second most traded commodity on Earth after crude oil" },
        b: { name: "All the Beer Consumed Daily", detail: "Worldwide, ~500 million liters", emoji: "🍺", weight_lbs: 1100000000, fun_fact: "The Czech Republic has the highest beer consumption per capita in the world" },
        ratio: 0.67
    },
    {
        a: { name: "A Colossal Squid", detail: "Largest known specimen", emoji: "🦑", weight_lbs: 1091, fun_fact: "Colossal squids have the largest eyes in the animal kingdom — the size of dinner plates" },
        b: { name: "A Grand Piano", detail: "Steinway Model D", emoji: "🎹", weight_lbs: 990, fun_fact: "Steinway makes only about 1,000 pianos per year" },
        ratio: 0.91
    },
    {
        a: { name: "The Curiosity Rover + Perseverance Rover", detail: "Both Mars rovers combined", emoji: "🤖", weight_lbs: 4300, fun_fact: "Perseverance carried the first helicopter to fly on another planet — Ingenuity" },
        b: { name: "A Rhinoceros", detail: "Adult white rhino", emoji: "🦏", weight_lbs: 5000, fun_fact: "White rhinos aren't white — the name comes from the Dutch word 'wijd' meaning wide" },
        ratio: 0.86
    },
    {
        a: { name: "All iPhones Sold in 2023", detail: "~230 million units", emoji: "📱", weight_lbs: 101200000, fun_fact: "Apple has sold over 2.3 billion iPhones since the original launched in 2007" },
        b: { name: "A Nuclear Submarine", detail: "Ohio-class submarine", emoji: "🚢", weight_lbs: 37000000, fun_fact: "Ohio-class submarines can stay submerged for over 90 days at a time" },
        ratio: 0.37
    },
    {
        a: { name: "The Colosseum", detail: "Roman amphitheater, estimated", emoji: "🏟️", weight_lbs: 440000000, fun_fact: "The Colosseum could hold 50,000-80,000 spectators and had a retractable awning" },
        b: { name: "The Empire State Building", detail: "Complete structure", emoji: "🏙️", weight_lbs: 730000000, fun_fact: "The Empire State Building has its own zip code: 10118" },
        ratio: 0.60
    },
    {
        a: { name: "A Year's Supply of Toilet Paper", detail: "For the average American (~100 rolls)", emoji: "🧻", weight_lbs: 37, fun_fact: "Americans use about 141 rolls of toilet paper per person per year" },
        b: { name: "A Golden Retriever", detail: "Adult male", emoji: "🐕", weight_lbs: 70, fun_fact: "Golden Retrievers have been the third most popular dog breed in the US for decades" },
        ratio: 0.53
    },
    {
        a: { name: "The Largest Diamond Ever Found", detail: "Cullinan diamond, uncut", emoji: "💎", weight_lbs: 1.37, fun_fact: "The Cullinan diamond was 3,106 carats and was cut into 9 major stones for the British Crown Jewels" },
        b: { name: "A Human Brain", detail: "Average adult", emoji: "🧠", weight_lbs: 3.0, fun_fact: "The brain is 60% fat, making it the fattiest organ in the body" },
        ratio: 0.46
    },
    {
        a: { name: "All the Ink Used by All Printers in the US Yearly", detail: "~400 million cartridges", emoji: "🖨️", weight_lbs: 88000000, fun_fact: "Printer ink is one of the most expensive liquids on Earth per gallon — more than human blood" },
        b: { name: "The Statue of Liberty", detail: "Including pedestal and foundation", emoji: "🗽", weight_lbs: 450000000, fun_fact: "The seven rays on Liberty's crown represent the seven continents" },
        ratio: 0.20
    },
    {
        a: { name: "A Redwood Tree", detail: "Coast redwood, mature", emoji: "🌲", weight_lbs: 1600000, fun_fact: "Coast redwoods are the tallest trees on Earth, reaching over 380 feet" },
        b: { name: "A Boeing 747", detail: "Empty weight", emoji: "✈️", weight_lbs: 412000, fun_fact: "The 747's upper deck was originally a lounge — some airlines had piano bars up there" },
        ratio: 0.26
    },
    {
        a: { name: "All the Plastic in the Ocean", detail: "Estimated 165 million tons", emoji: "🗑️", weight_lbs: 330000000000, fun_fact: "By 2050, there could be more plastic than fish in the ocean by weight" },
        b: { name: "All the Fish in the Ocean", detail: "Estimated total biomass", emoji: "🐟", weight_lbs: 2200000000000, fun_fact: "The biomass of all fish in the ocean is declining by about 1% per year" },
        ratio: 0.15
    },
    {
        a: { name: "The Christ the Redeemer Statue", detail: "In Rio de Janeiro", emoji: "🗽", weight_lbs: 1400000, fun_fact: "Christ the Redeemer is struck by lightning an average of 3-5 times per year" },
        b: { name: "The Statue of Liberty", detail: "Copper + iron only", emoji: "🗽", weight_lbs: 450000, fun_fact: "The Statue of Liberty was a gift from France delivered in 350 pieces" },
        ratio: 0.32
    },
    {
        a: { name: "All the Rice Eaten in China Daily", detail: "~1.3 billion lbs per day", emoji: "🍚", weight_lbs: 1300000000, fun_fact: "China consumes about 30% of the world's total rice production" },
        b: { name: "The Golden Gate Bridge", detail: "Total weight", emoji: "🌉", weight_lbs: 1680000000, fun_fact: "The Golden Gate Bridge takes 4 years to repaint from end to end" },
        ratio: 0.77
    },
    {
        a: { name: "A Tyrannosaurus Rex", detail: "Adult estimate", emoji: "🦖", weight_lbs: 18500, fun_fact: "T. rex had tiny arms but they could each curl about 430 lbs" },
        b: { name: "A School Bus", detail: "Loaded with students", emoji: "🚌", weight_lbs: 36000, fun_fact: "School buses are painted yellow because it's the most visible color in peripheral vision" },
        ratio: 0.51
    },
    {
        a: { name: "The Entire Bitcoin Network's Hardware", detail: "All mining rigs worldwide", emoji: "💰", weight_lbs: 200000000, fun_fact: "Bitcoin mining uses more electricity than many entire countries" },
        b: { name: "The Empire State Building", detail: "Complete structure", emoji: "🏙️", weight_lbs: 730000000, fun_fact: "The Empire State Building was built in just 410 days during the Great Depression" },
        ratio: 0.27
    },
    {
        a: { name: "All the Bananas Eaten Yearly", detail: "~100 billion bananas/year", emoji: "🍌", weight_lbs: 27000000000, fun_fact: "Bananas are radioactive due to potassium-40 — but you'd need 10 million at once to be dangerous" },
        b: { name: "The Great Pyramid", detail: "Of Giza", emoji: "🔺", weight_lbs: 13200000000, fun_fact: "The pyramid's internal temperature stays constant at 68°F" },
        ratio: 0.49
    },
    {
        a: { name: "The Liberty Bell", detail: "Philadelphia icon", emoji: "🔔", weight_lbs: 2080, fun_fact: "The Liberty Bell was originally called the State House Bell" },
        b: { name: "A Rhinoceros", detail: "Adult white rhino", emoji: "🦏", weight_lbs: 5000, fun_fact: "Rhinos can run at 30 mph despite weighing over 2 tons" },
        ratio: 0.42
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