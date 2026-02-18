// HeavyEye — Comparison Data
// Each entry: { a: {name, detail, emoji, weight_lbs, fun_fact}, b: {...}, ratio }
// ratio = lighter / heavier (0.05 = very easy, 0.95 = nearly impossible)

const CAMPAIGN_ROUNDS = [
    // Round 1: EASY — ratio ~0.05 (one is 20x heavier)
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
            a: { name: "A Car Tire", detail: "Standard sedan tire", emoji: "🛞", weight_lbs: 25, fun_fact: "The average tire loses about 1/32 of an inch of tread per 8,000 miles" },
            b: { name: "A Watermelon", detail: "Big summer melon", emoji: "🍉", weight_lbs: 22, fun_fact: "Watermelons are 92% water and are technically berries" },
            ratio: 0.88
        }
    ],

    // Round 2: MODERATE — ratio ~0.35-0.45
    [
        {
            a: { name: "A Grand Piano", detail: "Steinway Model D", emoji: "🎹", weight_lbs: 990, fun_fact: "A Steinway grand piano has over 12,000 individual parts" },
            b: { name: "A Horse", detail: "Average thoroughbred", emoji: "🐴", weight_lbs: 1100, fun_fact: "Horses can sleep both lying down and standing up" },
            ratio: 0.90
        },
        {
            a: { name: "10,000 Pennies", detail: "Stacked in towers", emoji: "🪙", weight_lbs: 55, fun_fact: "10,000 pennies = $100, and would stack about 50 feet high" },
            b: { name: "A Dalmatian", detail: "Fully grown, spotted", emoji: "🐕‍🦺", weight_lbs: 55, fun_fact: "Dalmatian puppies are born completely white — spots appear later" },
            ratio: 1.0
        },
        {
            a: { name: "100 Bricks", detail: "Standard red clay", emoji: "🧱", weight_lbs: 500, fun_fact: "The Great Wall of China used approximately 3.8 billion bricks" },
            b: { name: "A Grand Piano", detail: "Baby grand", emoji: "🎹", weight_lbs: 600, fun_fact: "A baby grand piano has about 230 strings inside" },
            ratio: 0.83
        },
        {
            a: { name: "A Cubic Foot of Gold", detail: "Pure 24K gold", emoji: "🥇", weight_lbs: 1206, fun_fact: "All the gold ever mined would fit in about 3.5 Olympic swimming pools" },
            b: { name: "A Grizzly Bear", detail: "Adult male", emoji: "🐻", weight_lbs: 600, fun_fact: "Grizzlies can run up to 35 mph — faster than a racehorse in short sprints" },
            ratio: 0.50
        }
    ],

    // Round 3: HARD — ratio ~0.55-0.70
    [
        {
            a: { name: "A Blue Whale's Tongue", detail: "Yes, just the tongue", emoji: "👅", weight_lbs: 5400, fun_fact: "A blue whale's tongue weighs as much as an elephant" },
            b: { name: "A Ford F-150", detail: "2024 model, empty", emoji: "🛻", weight_lbs: 4700, fun_fact: "The F-150 has been America's best-selling truck for 47 years" },
            ratio: 0.87
        },
        {
            a: { name: "20 Tungsten Cubes", detail: "4 inch × 4 inch × 4 inch each", emoji: "🔲", weight_lbs: 230, fun_fact: "Tungsten has the highest melting point of any element: 6,192°F" },
            b: { name: "An Adult Male Lion", detail: "King of the jungle", emoji: "🦁", weight_lbs: 420, fun_fact: "A lion's roar can be heard from 5 miles away" },
            ratio: 0.55
        },
        {
            a: { name: "The Statue of Liberty's Nose", detail: "Just the nose", emoji: "🗽", weight_lbs: 150, fun_fact: "Lady Liberty's nose is 4 feet 6 inches long" },
            b: { name: "A Baby Grand Piano", detail: "With bench", emoji: "🎹", weight_lbs: 650, fun_fact: "The first piano was invented in Italy around 1700" },
            ratio: 0.23
        },
        {
            a: { name: "A Cloud", detail: "Average cumulus cloud", emoji: "☁️", weight_lbs: 1100000, fun_fact: "An average cloud weighs 1.1 million lbs — the water is just very spread out" },
            b: { name: "100 Elephants", detail: "African elephants", emoji: "🐘", weight_lbs: 1400000, fun_fact: "An African elephant weighs about 14,000 lbs" },
            ratio: 0.79
        }
    ],

    // Round 4: VERY HARD — ratio ~0.75-0.90
    [
        {
            a: { name: "The Eiffel Tower", detail: "Iron structure only", emoji: "🗼", weight_lbs: 16535000, fun_fact: "The Eiffel Tower was supposed to be torn down after 20 years" },
            b: { name: "3 Blue Whales", detail: "Fully grown adults", emoji: "🐋", weight_lbs: 900000, fun_fact: "Blue whales are the largest animals to ever exist on Earth" },
            ratio: 0.054
        },
        {
            a: { name: "ISS Solar Panels", detail: "All 8 arrays", emoji: "☀️", weight_lbs: 55000, fun_fact: "The ISS solar arrays could cover half a football field" },
            b: { name: "A Semi Truck", detail: "Fully loaded 18-wheeler", emoji: "🚛", weight_lbs: 80000, fun_fact: "A loaded semi can take the length of 2 football fields to stop from 65 mph" },
            ratio: 0.69
        },
        {
            a: { name: "All Humans on Earth", detail: "8 billion people", emoji: "👥", weight_lbs: 1100000000000, fun_fact: "All humans combined weigh about 550 million tons" },
            b: { name: "Mount Everest", detail: "The whole mountain", emoji: "🏔️", weight_lbs: 357000000000000, fun_fact: "Everest grows about 0.16 inches taller every year due to tectonic forces" },
            ratio: 0.003
        },
        {
            a: { name: "An Aircraft Carrier", detail: "USS Gerald Ford", emoji: "🚢", weight_lbs: 200000000, fun_fact: "The USS Gerald Ford cost $13 billion — the most expensive warship ever" },
            b: { name: "20,000 Elephants", detail: "African elephants", emoji: "🐘", weight_lbs: 280000000, fun_fact: "There are only about 415,000 African elephants left in the wild" },
            ratio: 0.71
        }
    ],

    // Round 5: NIGHTMARE — ratio ~0.90-0.99
    [
        {
            a: { name: "A Liter of Mercury", detail: "Liquid metal", emoji: "🪩", weight_lbs: 29.8, fun_fact: "Mercury is the only metal that's liquid at room temperature" },
            b: { name: "A Liter of Lead (melted)", detail: "Molten lead", emoji: "🫠", weight_lbs: 24.9, fun_fact: "Ancient Romans used lead pipes for plumbing — the word 'plumbing' comes from 'plumbum' (Latin for lead)" },
            ratio: 0.84
        },
        {
            a: { name: "The Moon", detail: "Earth's moon", emoji: "🌙", weight_lbs: 1.62e+23, fun_fact: "The Moon is slowly drifting away from Earth at 1.5 inches per year" },
            b: { name: "Pluto", detail: "Dwarf planet", emoji: "🪐", weight_lbs: 2.87e+22, fun_fact: "Pluto is smaller than Russia" },
            ratio: 0.18
        },
        {
            a: { name: "A Yard of Concrete", detail: "1 cubic yard", emoji: "🏗️", weight_lbs: 3915, fun_fact: "The Romans invented concrete — the Pantheon's dome is still the largest unreinforced concrete dome" },
            b: { name: "A Yard of Water", detail: "1 cubic yard", emoji: "💧", weight_lbs: 1685, fun_fact: "A cubic yard of water is about 202 gallons" },
            ratio: 0.43
        },
        {
            a: { name: "All the Ants on Earth", detail: "~20 quadrillion ants", emoji: "🐜", weight_lbs: 176000000000, fun_fact: "There are about 2.5 million ants for every human on Earth" },
            b: { name: "All the Humans on Earth", detail: "~8 billion people", emoji: "👥", weight_lbs: 1100000000000, fun_fact: "Humans make up just 0.01% of all life on Earth by biomass" },
            ratio: 0.16
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
