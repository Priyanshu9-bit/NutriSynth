// 30-Day Nutrition & Healthy Habits Challenge
// Evidence-based daily tasks designed for long-term lifestyle transformation.

export interface ChallengeTask {
  day: number;
  title: string;
  category: 'hydration' | 'protein' | 'plants' | 'mindset' | 'energy';
  categoryLabel: string;
  badge?: string;
  action: string;
  explanation: string;
  scienceTip: string;
  targetKpi: string;
  todos: string[];
}

export interface MilestoneBadge {
  id: string;
  daysRequired: number;
  title: string;
  icon: string;
  color: string;
  description: string;
}

export const challengeMilestones: MilestoneBadge[] = [
  {
    id: 'bronze-7',
    daysRequired: 7,
    title: 'Week 1 Bronze',
    icon: '🥉',
    color: 'from-amber-600 to-amber-800',
    description: 'Completed your first 7 days of consistent nutrition habits!',
  },
  {
    id: 'silver-14',
    daysRequired: 14,
    title: 'Fortnight Silver',
    icon: '🥈',
    color: 'from-slate-400 to-zinc-600',
    description: '14 consecutive days of mindful dietary discipline.',
  },
  {
    id: 'gold-21',
    daysRequired: 21,
    title: 'Habit Master Gold',
    icon: '🥇',
    color: 'from-yellow-400 to-amber-600',
    description: '21 days! Behavioral science shows this marks a permanent habit.',
  },
  {
    id: 'diamond-30',
    daysRequired: 30,
    title: 'Nutrition Champion',
    icon: '🏆',
    color: 'from-emerald-400 via-teal-500 to-cyan-600',
    description: 'Conquered the complete 30-Day Challenge! You are a master of personal nutrition.',
  },
];

export const thirtyDayTasks: ChallengeTask[] = [
  {
    day: 1,
    title: 'Hydration Foundation',
    category: 'hydration',
    categoryLabel: 'Hydration',
    action: 'Drink at least 2.5 to 3 liters (8–10 glasses) of pure water throughout the day.',
    explanation: 'Water is the primary catalyst for enzymatic reactions, cellular nutrient transport, and metabolic detoxification. When well-hydrated, your resting metabolic rate increases and false hunger signals caused by thirst are eliminated.',
    scienceTip: 'Mild dehydration of just 1-2% impairs cognitive performance, metabolic rate, and causes false hunger cues.',
    targetKpi: '2.5L+ Water',
    todos: [
      'Drink 500ml of room temperature water immediately upon waking',
      'Carry a 1L water bottle and finish at least 1.5L before 2:00 PM',
      'Reach your 2.5L–3.0L total hydration target before dinner'
    ],
  },
  {
    day: 2,
    title: 'Protein Benchmark',
    category: 'protein',
    categoryLabel: 'Macronutrients',
    action: 'Meet your daily protein goal by including a dedicated protein source with every meal.',
    explanation: 'Protein preserves muscle mass, stabilizes post-meal glucose, and stimulates satiety hormones like Peptide YY and GLP-1. Pacing protein evenly throughout the day ensures continuous muscle protein synthesis.',
    scienceTip: 'Protein has the highest thermic effect of food (20-30%) and stimulates peptide YY for prolonged satiety.',
    targetKpi: 'Hit 90%+ Protein Goal',
    todos: [
      'Include a protein anchor (eggs, paneer, tofu, Greek yogurt, or shake) at breakfast',
      'Add at least 25-30g of protein to your lunch plate (chicken, fish, dal, or sprouts)',
      'Ensure dinner has a solid protein portion to support overnight recovery'
    ],
  },
  {
    day: 3,
    title: 'Eat the Rainbow',
    category: 'plants',
    categoryLabel: 'Micronutrients',
    action: 'Incorporate vegetables of at least 3 distinct colors across lunch and dinner.',
    explanation: 'Plant colors are biological signatures for distinct phytonutrients: lycopene and anthocyanins in reds/purples, carotenoids in orange, and sulforaphane in greens. Diverse pigments fight oxidative stress at the cellular level.',
    scienceTip: 'Different plant pigments represent different phytochemicals (carotenoids in orange, anthocyanins in purple, lutein in green).',
    targetKpi: '3+ Color Veggies',
    todos: [
      'Add deep green vegetables (spinach, broccoli, or methi) to a meal',
      'Include an orange or red vegetable (carrots, bell peppers, tomatoes)',
      'Add a purple or yellow veggie (beetroot, purple cabbage, or corn)'
    ],
  },
  {
    day: 4,
    title: 'Zero Liquid Calories',
    category: 'energy',
    categoryLabel: 'Sugar Control',
    action: 'Avoid all sodas, packaged juices, sweetened coffees, and commercial energy drinks today.',
    explanation: 'Liquid sugars deliver a flood of rapidly absorbed fructose and glucose straight to the liver without triggering normal satiety stretch receptors in the stomach. Cutting liquid sugar is the fastest way to stabilize daily energy.',
    scienceTip: 'Liquid sugars produce steep insulin spikes without triggering the brain’s stretch-receptor fullness signaling.',
    targetKpi: '0g Added Liquid Sugar',
    todos: [
      'Swap packaged sodas and fruit juices for plain water or lemon water',
      'Take your morning tea or coffee with zero added sugar or syrups',
      'Keep unsweetened sparkling water or green tea on hand if cravings strike'
    ],
  },
  {
    day: 5,
    title: 'Whole Grain Upgrade',
    category: 'energy',
    categoryLabel: 'Complex Carbs',
    action: 'Replace refined grains (maida/white bread) with whole grains like oats, brown rice, ragi, or whole wheat.',
    explanation: 'Whole grains retain their fibrous bran outer layer and nutrient-dense germ, providing sustained glucose release, magnesium, and essential B-vitamins for prolonged physical stamina without crashes.',
    scienceTip: 'Whole grains retain their bran and germ, delivering B-vitamins, magnesium, and slower glucose release.',
    targetKpi: '100% Whole Grains',
    todos: [
      'Choose rolled oats or whole wheat flatbread/toast for breakfast',
      'Replace polished white rice or refined pasta with brown rice, quinoa, or millets',
      'Check ingredients to ensure 100% whole grain with no hidden refined flour'
    ],
  },
  {
    day: 6,
    title: 'Fiber Acceleration',
    category: 'plants',
    categoryLabel: 'Gut Health',
    action: 'Add 1 serving of legumes, sprouts, chia seeds, or flaxseeds to your daily intake.',
    explanation: 'Soluble and insoluble prebiotic fibers feed healthy gut bacteria in the colon, which ferment them into short-chain fatty acids (SCFAs) like butyrate, reinforcing the intestinal wall and boosting immune defenses.',
    scienceTip: 'Dietary prebiotic fibers ferment into short-chain fatty acids (acetate, butyrate) that support gut barrier integrity.',
    targetKpi: '28g+ Fiber',
    todos: [
      'Add 1 tablespoon of chia seeds or ground flaxseeds to water or yogurt',
      'Include a hearty bowl of sprouted moong, rajma, or lentils with lunch',
      'Check your daily fiber count in NutriSynth to aim for 28g+'
    ],
  },
  {
    day: 7,
    title: 'Week 1 Review & Streak Celebration',
    category: 'mindset',
    categoryLabel: 'Milestone',
    badge: '🥉 Bronze Milestone',
    action: 'Log all meals in your dashboard, check today’s intake against targets, and celebrate your first week!',
    explanation: 'You have reached Day 7 and unlocked your Week 1 Bronze Milestone! Consistent self-monitoring provides the feedback loop needed to adjust portion sizes and build lifelong nutritional intuition.',
    scienceTip: 'Consistent self-monitoring is scientifically identified as the single strongest predictor of dietary success.',
    targetKpi: 'Log All 3 Meals',
    todos: [
      'Log your breakfast, lunch, and dinner using the Log Food scanner',
      'Compare your actual calorie and macro intake against your NutriSynth targets',
      'Celebrate unlocking your Week 1 Bronze Milestone badge!'
    ],
  },
  {
    day: 8,
    title: 'Mindful Eating Practice',
    category: 'mindset',
    categoryLabel: 'Behavior',
    action: 'Eat at least one full meal without phone, television, or computer screens, chewing each bite thoroughly.',
    explanation: 'Distracted eating disrupts the vagus nerve signaling between stomach mechanoreceptors and the hypothalamus, leading to delayed fullness and automatic overeating. Mindful chewing optimizes digestive enzyme mixing.',
    scienceTip: 'Distracted eating delays fullness signals by up to 20 minutes and increases late-afternoon snacking by 25%.',
    targetKpi: '1 Screen-Free Meal',
    todos: [
      'Put all phones, tablets, and laptops away during at least one meal',
      'Chew each bite of food 15 to 20 times before swallowing',
      'Pause midway through the meal to check your internal fullness level'
    ],
  },
  {
    day: 9,
    title: 'Healthy Fats Fuel',
    category: 'energy',
    categoryLabel: 'Lipids',
    action: 'Consume an optimal serving of healthy fats: walnuts, almonds, olive oil, chia seeds, or avocado.',
    explanation: 'Unsaturated essential fatty acids (Omega-3 and Omega-9) are structural components of brain cell membranes and steroid hormone precursors. They slow gastric emptying to keep you satisfied for hours.',
    scienceTip: 'Monounsaturated and omega-3 fatty acids optimize cell membrane fluidity and facilitate fat-soluble vitamin (A, D, E, K) absorption.',
    targetKpi: '1 Serving Omega Fats',
    todos: [
      'Eat a palm-sized portion (20-30g) of raw walnuts or soaked almonds',
      'Drizzle extra virgin olive oil or cold-pressed oil over your salad or veggies',
      'Verify that your daily fat intake stays within your personalized target'
    ],
  },
  {
    day: 10,
    title: '24-Hour Sugar Reset',
    category: 'energy',
    categoryLabel: 'Metabolism',
    action: 'Avoid all refined white sugars, sweets, candies, and syrups for 24 hours.',
    explanation: 'Refined sugar floods dopamine pathways, promoting cravings and reactive hypoglycemia. A 24-hour reset recalibrates your palate receptors so natural foods like berries and apples taste delightfully sweet again.',
    scienceTip: 'A single day without refined sugar resets dopamine taste thresholds, making natural fruits taste significantly sweeter.',
    targetKpi: '0 Refined Sweets',
    todos: [
      'Say no to desserts, candies, and packaged cookies today',
      'Check ingredient labels for hidden sugars (maltodextrin, high-fructose corn syrup)',
      'Satisfy sweet cravings naturally with an apple, orange, or handful of berries'
    ],
  },
  {
    day: 11,
    title: 'Plate Proportion Mastery',
    category: 'plants',
    categoryLabel: 'Portion Control',
    action: 'Build your plate: 50% non-starchy veggies & salad, 25% quality protein, and 25% complex carbohydrates.',
    explanation: 'The 50/25/25 visual plate method guarantees high volume and fiber while naturally keeping caloric density in check. It removes the stress of calorie counting while ensuring micronutrient density.',
    scienceTip: 'Visual plate proportioning eliminates calorie-counting anxiety while guaranteeing high nutrient density.',
    targetKpi: '1:2:1 Plate Ratio',
    todos: [
      'Fill half of your main plate with crisp salad and non-starchy vegetables',
      'Fill one quarter of the plate with a lean protein source',
      'Fill the final quarter with complex whole-grain carbohydrates'
    ],
  },
  {
    day: 12,
    title: 'Probiotic Fermentation Boost',
    category: 'plants',
    categoryLabel: 'Microbiome',
    action: 'Eat at least 1 serving of fermented food: curd (dahi), plain Greek yogurt, kefir, kimchi, or fermented idli/dosa.',
    explanation: 'Fermented foods introduce billions of live beneficial bacteria (Lactobacillus and Bifidobacterium) directly into your gut, suppressing opportunistic pathogens and synthesizing essential vitamin K and B12.',
    scienceTip: 'Live lactic acid bacteria introduce beneficial microbial diversity that strengthens immune defense.',
    targetKpi: '1 Fermented Serving',
    todos: [
      'Add 1 bowl of fresh curd (dahi) or unsweetened Greek yogurt to lunch',
      'Try fermented foods like kimchi, sauerkraut, kefir, or naturally fermented batters',
      'Avoid high-sugar commercial fruit yogurts that contain artificial flavors'
    ],
  },
  {
    day: 13,
    title: 'Early Dinner Digestive Window',
    category: 'mindset',
    categoryLabel: 'Circadian Rhythm',
    action: 'Finish dinner at least 2.5 to 3 hours before going to sleep.',
    explanation: 'Eating close to sleep elevates nocturnal body temperature and forces gastrointestinal blood flow when your body should be shifting into cellular repair and deep slow-wave sleep. An early dinner improves fasting insulin levels.',
    scienceTip: 'Digestive enzyme secretion declines sharply as melatonin rises; early dinners improve REM sleep and morning fasting glucose.',
    targetKpi: 'Dinner > 3h Pre-Sleep',
    todos: [
      'Complete your dinner meal by 8:00 PM (or 3 hours before bedtime)',
      'Drink warm water or herbal chamomile tea if you experience late evening cravings',
      'Notice how much lighter and more refreshed you feel when waking up tomorrow'
    ],
  },
  {
    day: 14,
    title: 'Halfway Mark: 2-Week Silver Badge',
    category: 'mindset',
    categoryLabel: 'Milestone',
    badge: '🥈 Silver Milestone',
    action: 'You are 50% through the challenge! Run a Deficiency Check on your profile to verify your micronutrient status.',
    explanation: '14 consecutive days of consistent dietary habits creates verifiable physiological adaptations. Blood pressure stabilizes, resting energy increases, and nutritional biomarkers begin to peak.',
    scienceTip: 'Two weeks of consistent nutrition elevates plasma levels of folate, magnesium, and vitamin C noticeably.',
    targetKpi: 'Run Deficiency Check',
    todos: [
      'Navigate to the Deficiency Check tab in NutriSynth',
      'Review your current vitamin and mineral status against recommended RDIs',
      'Celebrate earning your 14-Day Silver Fortnight Milestone badge!'
    ],
  },
  {
    day: 15,
    title: 'Anti-Inflammatory Spices',
    category: 'plants',
    categoryLabel: 'Antioxidants',
    action: 'Cook or drink with turmeric + black pepper, ginger, garlic, or cinnamon today.',
    explanation: 'Natural culinary spices contain potent bioactive polyphenols. Curcumin in turmeric works synergistically with piperine in black pepper to downregulate systemic inflammation markers like CRP and TNF-alpha.',
    scienceTip: 'Curcumin combined with piperine increases bioavailability by 2000%, downregulating inflammatory cytokines (NF-kB).',
    targetKpi: 'Add 2 Healing Spices',
    todos: [
      'Add turmeric and a pinch of black pepper to your dal, soup, or warm milk',
      'Incorporate freshly grated ginger or cinnamon into your morning tea or oats',
      'Use fresh garlic or rosemary when sauteing your evening vegetables'
    ],
  },
  {
    day: 16,
    title: 'Raw Crunchy Salad Starter',
    category: 'plants',
    categoryLabel: 'Fiber Pre-load',
    action: 'Eat a fresh cucumber, carrot, or tomato salad 10 minutes before lunch or dinner.',
    explanation: 'Eating fiber-rich raw salad before a cooked meal creates a viscous gel matrix in the stomach. This pre-load slows the absorption of subsequent carbohydrates, flattening blood sugar curves by up to 35%.',
    scienceTip: 'Pre-meal fiber slows gastric emptying and blunt postprandial blood sugar spikes by up to 35%.',
    targetKpi: '1 Raw Salad Starter',
    todos: [
      'Chop a bowl of fresh cucumber, carrots, tomatoes, or radish',
      'Eat the raw salad 10 minutes before taking your main cooked course',
      'Season with fresh lemon juice and herbs instead of heavy creamy dressings'
    ],
  },
  {
    day: 17,
    title: 'Smart Advance Meal Prep',
    category: 'mindset',
    categoryLabel: 'Planning',
    action: 'Plan or prepare tomorrow’s meals today so healthy eating requires zero willpower tomorrow.',
    explanation: 'Decision fatigue at 7:00 PM is the number one cause of unhealthy takeout orders. Pre-portioning foods and deciding menus in advance eliminates cognitive friction and guarantees compliance.',
    scienceTip: 'Decision fatigue in the evening strongly correlates with impulsive high-calorie takeout orders.',
    targetKpi: 'Prep Tomorrow’s Meals',
    todos: [
      'Pre-cut vegetables or soak beans/lentils tonight for tomorrow’s meals',
      'Decide your breakfast and lunch menu in advance',
      'Pack a healthy snack (nuts, fruit, or roasted chana) in your bag for tomorrow'
    ],
  },
  {
    day: 18,
    title: 'Calcium & Bone Nourishment',
    category: 'plants',
    categoryLabel: 'Bone Health',
    action: 'Include calcium-dense foods today: curd, paneer, ragi, tofu, or dark leafy greens.',
    explanation: 'Calcium is essential for muscle contraction, nerve signal propagation, and bone remodeling. When daily intake is sufficient, your body never needs to draw calcium from skeletal bone tissue.',
    scienceTip: 'Adequate daily dietary calcium prevents parathyroid hormone from leaching calcium from skeletal stores.',
    targetKpi: 'Hit Calcium Target',
    todos: [
      'Include a serving of paneer, curd, or calcium-fortified plant milk',
      'Incorporate dark leafy greens (spinach, methi, or kale) into your lunch',
      'Sprinkle roasted sesame seeds (til) or use ragi flour for a calcium boost'
    ],
  },
  {
    day: 19,
    title: 'Iron & Vitamin C Synergy',
    category: 'plants',
    categoryLabel: 'Absorption',
    action: 'Pair plant-based iron (dal, lentils, spinach) with vitamin C (lemon squeeze, amla, bell pepper).',
    explanation: 'Non-heme iron from plant sources is normally difficult for the human intestine to absorb. Ascorbic acid (Vitamin C) acts as a reducing agent, converting ferric iron to ferrous iron and increasing absorption up to 300%.',
    scienceTip: 'Vitamin C reduces non-heme iron (ferric to ferrous state), multiplying intestinal absorption by up to 3-fold.',
    targetKpi: 'Iron + Citrus Pairing',
    todos: [
      'Prepare an iron-rich dish: lentils, chickpeas, or dark leafy vegetables',
      'Squeeze generous fresh lemon juice over the hot dish right before eating',
      'Avoid drinking black tea or coffee within 60 minutes of this meal'
    ],
  },
  {
    day: 20,
    title: 'Nutritious Snack Swap',
    category: 'energy',
    categoryLabel: 'Smart Snacks',
    action: 'Swap ultra-processed snacks (chips, biscuits) for roasted chana, makhana, or a handful of raw nuts.',
    explanation: 'Ultra-processed snacks are chemically engineered to hit the "bliss point" of fat, salt, and sugar, hijacking satiety mechanisms. Swapping to whole-food snacks gives sustained satiety and micronutrients.',
    scienceTip: 'Protein and fiber combinations prevent the mid-afternoon energy crash caused by refined carbohydrate snacks.',
    targetKpi: 'Zero Processed Snacks',
    todos: [
      'Discard or move packaged chips, cookies, and fried farsan out of arm’s reach',
      'Snack on roasted makhana (foxnuts), roasted chana, or edamame',
      'Drink a glass of water with your snack to maximize fiber expansion'
    ],
  },
  {
    day: 21,
    title: 'Habit Formation Gold Milestone',
    category: 'mindset',
    categoryLabel: 'Milestone',
    badge: '🥇 Gold Milestone',
    action: '21 Days completed! Your brain has created new neural pathways for healthy eating. Celebrate this huge milestone!',
    explanation: 'Behavioral neurobiology demonstrates that 21 consecutive days of conscious habit execution hardwires automatic basal ganglia motor programs. Choosing healthy foods is now becoming your default nature!',
    scienceTip: 'Psychological studies indicate 21 consecutive days of repetition is the tipping point where effort converts into automaticity.',
    targetKpi: '21 Days Consecutive',
    todos: [
      'Review your 21-day check-in streak and acknowledge your consistency',
      'Notice how your food choices now happen naturally without intense willpower',
      'Celebrate unlocking your Habit Master Gold Milestone badge!'
    ],
  },
  {
    day: 22,
    title: 'Herbs & Sodium Moderation',
    category: 'energy',
    categoryLabel: 'Cardio Health',
    action: 'Avoid adding extra table salt; flavor your dishes using lemon, coriander, mint, oregano, or roasted cumin.',
    explanation: 'Excess refined sodium increases intravascular fluid volume and arterial stiffness. Relying on aromatic herbs and spices enhances sensory pleasure while supporting healthy endothelial blood pressure.',
    scienceTip: 'Balancing sodium and potassium intake reduces vascular resistance and optimizes blood pressure within 48 hours.',
    targetKpi: '< 2g Added Sodium',
    todos: [
      'Remove the table salt shaker from the dining table during meals',
      'Season your cooked meals using lemon, mint, coriander, roasted jeera, or black pepper',
      'Rinse any canned beans or pickled items thoroughly before cooking'
    ],
  },
  {
    day: 23,
    title: 'Plant-Powered Protein Feast',
    category: 'protein',
    categoryLabel: 'Plant Power',
    action: 'Feature an all-plant protein powerhouse meal: dal makhani, chana masala, tofu bowl, or sprouted pulses.',
    explanation: 'Plant proteins are pre-packaged with soluble fiber, plant sterols, and zero dietary cholesterol. Combining legumes with whole grains delivers all 9 essential amino acids with maximum cardiovascular protection.',
    scienceTip: 'Plant proteins contain no saturated cholesterol and are naturally pre-packaged with dietary fiber and isoflavones.',
    targetKpi: '1 High-Protein Plant Meal',
    todos: [
      'Prepare a hearty plant protein dish: chickpeas, black beans, tofu, or mixed dal',
      'Pair it with brown rice or whole wheat roti for complete amino acid balance',
      'Log the meal in your NutriSynth tracker to see your plant protein totals'
    ],
  },
  {
    day: 24,
    title: 'Post-Meal Walking Habit',
    category: 'mindset',
    categoryLabel: 'Glucose Disposal',
    action: 'Take a relaxed 10-15 minute walk right after your biggest meal of the day.',
    explanation: 'Even gentle ambulation causes leg muscle contractions that translocate GLUT-4 glucose transporters to cell surfaces without requiring insulin, shuttling blood glucose directly into glycogen stores.',
    scienceTip: 'Light muscle contractions activate GLUT-4 glucose transporters independent of insulin, clearing circulating glucose.',
    targetKpi: '10 Min Post-Meal Walk',
    todos: [
      'Finish your main meal (lunch or dinner) and step away from work/screens',
      'Take a gentle 10 to 15 minute stroll around your neighborhood, garden, or room',
      'Notice how walking eliminates that heavy, sleepy post-meal fatigue'
    ],
  },
  {
    day: 25,
    title: 'Clean Label Inspection',
    category: 'mindset',
    categoryLabel: 'Food Literacy',
    action: 'Inspect the ingredient labels of everything packaged you eat today. Aim for foods with 5 or fewer simple ingredients.',
    explanation: 'Reading food labels transforms you from a passive consumer to an empowered dietary manager. If you cannot recognize or pronounce ingredients, your gut microbiome struggles to metabolize them as well.',
    scienceTip: 'Artificial emulsifiers and modified starches can disrupt the mucosal lining of the gastrointestinal tract.',
    targetKpi: 'Only Clean Foods',
    todos: [
      'Flip over any packaged item you pick up today to inspect the ingredients',
      'Check for hidden palm oils, artificial sweeteners, and synthetic food colors',
      'Prioritize whole foods with 1 to 5 recognizable whole-food ingredients'
    ],
  },
  {
    day: 26,
    title: 'Magnesium Sleep Optimizer',
    category: 'plants',
    categoryLabel: 'Recovery',
    action: 'Eat magnesium-rich foods today: pumpkin seeds, almonds, dark chocolate (70%+), or spinach.',
    explanation: 'Magnesium is the master mineral for cellular relaxation. It regulates parasympathetic neurotransmitters, acts as a GABA agonist, and regulates melatonin for deep, recuperative stage-3 sleep.',
    scienceTip: 'Magnesium binds to GABA receptors, calming the central nervous system and promoting restorative deep delta-wave sleep.',
    targetKpi: '300mg+ Magnesium',
    todos: [
      'Snack on 2 tablespoons of roasted pumpkin seeds or sunflower seeds',
      'Add a large serving of steamed spinach or dark greens to your dinner',
      'Enjoy 1-2 small squares of 70%+ dark chocolate as a healthy evening treat'
    ],
  },
  {
    day: 27,
    title: 'Circadian Meal Regularity',
    category: 'mindset',
    categoryLabel: 'Bio-Rhythm',
    action: 'Eat your breakfast, lunch, and dinner at consistent, structured times today.',
    explanation: 'Your liver, pancreas, and stomach operate on intrinsic peripheral circadian clocks. When meal times are predictable, digestive enzymes and metabolic hormones synchronize for effortless nutrient partitioning.',
    scienceTip: 'Peripheral organs have metabolic circadian clocks that optimize digestive secretions when meal times are predictable.',
    targetKpi: 'Consistent Meal Times',
    todos: [
      'Eat breakfast within 90 minutes of waking',
      'Have lunch at your scheduled lunchtime window without delaying by hours',
      'Complete dinner at your set evening time'
    ],
  },
  {
    day: 28,
    title: 'Pantry & Kitchen Reset',
    category: 'mindset',
    categoryLabel: 'Environment',
    action: 'Organize your kitchen, discard junk foods, and put healthy fruits, nuts, and water bottles front and center.',
    explanation: 'Willpower is an exhaustible resource, but environment design is permanent. When nutrient-dense whole foods are visually prominent and junk foods are absent, healthy eating becomes effortless.',
    scienceTip: 'Environment design outperforms willpower: people consume 3x more of whichever snacks are placed in clear line-of-sight.',
    targetKpi: 'Healthy Food Front & Center',
    todos: [
      'Clear high-calorie processed snacks from kitchen countertops and tables',
      'Place a vibrant bowl of fresh seasonal fruits in direct eye view',
      'Keep pre-filled clean water bottles ready in the fridge or on your desk'
    ],
  },
  {
    day: 29,
    title: 'Vitality & Body Gratitude',
    category: 'mindset',
    categoryLabel: 'Mind-Body',
    action: 'Take 2 minutes to reflect on how your energy, digestion, mood, and sleep have improved over the past 29 days.',
    explanation: 'Positive emotional reflection cements behavioral patterns in the brain by releasing dopamine and neurotrophic factors. Acknowledging your transformation guarantees long-term sustainability.',
    scienceTip: 'Positive self-reflection triggers dopamine and serotonin release, reinforcing healthy behaviors indefinitely.',
    targetKpi: 'Self-Reflection Complete',
    todos: [
      'Take 2 quiet minutes to observe your energy, digestion, and physical wellbeing',
      'Note down 3 tangible ways your lifestyle feels better now than 29 days ago',
      'Appreciate yourself for your dedication, discipline, and daily consistency'
    ],
  },
  {
    day: 30,
    title: 'Nutrition Champion Grand Finale!',
    category: 'mindset',
    categoryLabel: 'Grand Milestone',
    badge: '🏆 Diamond Champion',
    action: 'You completed the entire 30-Day Nutrition Challenge! Claim your Champion Trophy and download your completion report.',
    explanation: 'Congratulations! You have conquered the complete 30-Day NutriSynth Challenge. You are no longer just dieting; you have built permanent, evidence-based habits that will fuel your health for a lifetime.',
    scienceTip: 'You have permanently transformed your relationship with food, health, and vitality. Incredible accomplishment!',
    targetKpi: '30 / 30 Days Mastered',
    todos: [
      'Check in for your final Day 30 mission',
      'Review your 30-day streak and full completion road-map',
      'Celebrate unlocking the ultimate NutriSynth Diamond Champion Trophy!'
    ],
  },
];
