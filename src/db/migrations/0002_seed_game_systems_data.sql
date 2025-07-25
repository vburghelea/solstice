-- Custom SQL migration file, put your code below!

-- Seed Game Systems
INSERT INTO game_systems (name, slug, description, min_players, max_players, optimal_players, average_play_time, age_rating, complexity_rating) VALUES
    ('Dungeons & Dragons 5e', 'dnd-5e', 'High Fantasy', 2, 6, 4, 240, '12+', 'Medium'),
    ('Pathfinder 2e', 'pathfinder-2e', 'High Fantasy', 2, 5, 4, 240, '10+', 'Complex'),
    ('Vampire: The Masquerade 5th Edition', 'vampire-the-masquerade-5th-edition', 'Personal and Political Horror', 2, 5, 3, 240, '18+', 'Moderate'),
    ('Pathfinder 1e', 'pathfinder-1e', 'High Fantasy', 2, 6, 4, 300, '12+', 'High'),
    ('Call of Cthulhu', 'call-of-cthulhu', 'Horror, Investigation', 2, 6, 4, 240, '13+', 'Medium'),
    ('Cyberpunk Red', 'cyberpunk-red', 'Cyberpunk, Sci-Fi', 2, 10, 5, NULL, 'Mature', 'Medium'),
    ('Pokemon Tabletop United', 'pokemon-tabletop-united', 'Adventure', 2, 6, 4, 240, '10+', 'Medium'),
    ('Lancer', 'lancer', 'Sci-Fi, Mecha', 2, 6, 4, 210, 'Mature', 'Medium Crunch'),
    ('Powered by the Apocalypse RPG', 'powered-by-the-apocalypse-rpg', 'Varies (framework)', 2, 5, 3, 180, '13+', 'Low to Moderate'),
    ('Star Wars RPG by Fantasy Flight Games', 'star-wars-rpg-ffg', 'Space Opera, Sci-Fi', 2, 6, 4, 240, '10+', 'Medium'),
    ('Monster of the Week', 'monster-of-the-week', 'Urban Fantasy, Horror', 2, 5, 3, 180, '14+', 'Low to Moderate'),
    ('Fallout RPG', 'fallout-the-roleplaying-game', 'Post-Apocalyptic, Sci-Fi', 2, 6, 4, 360, 'Adults', 'High'),
    ('Starfinder', 'starfinder-rpg', 'Science Fantasy, Space Opera', 2, 6, 5, 240, '16+', 'Medium to High'),
    ('Blades in the Dark', 'blades-in-the-dark', 'Industrial Fantasy, Heist', 3, 6, 4, 240, '16+', 'Medium-heavy'),
    ('Star Wars 5e', 'star-wars-5e', 'Space Opera, Sci-Fi', 2, 6, 4, 240, '12+', 'Medium'),
    ('Savage Worlds', 'savage-worlds-adventure-edition', 'Generic, Pulp Action', 2, 12, 3, 240, '6+', 'Low to Medium'),
    ('Masks: A New Generation', 'masks-a-new-generation-rpg', 'Superhero, Teen Drama', 2, 5, 3, 210, 'Teenagers', 'Low'),
    ('World of Darkness', 'world-of-darkness', 'Horror, Urban Fantasy', 2, 6, 4, 240, '18+', 'Medium'),
    ('Indie TTRPG', 'indie-ttrpg', 'Varies', 1, NULL, NULL, NULL, 'Varies', 'Varies'),
    ('Fabula Ultima', 'fabula-ultima', 'JRPG-inspired Fantasy', 2, 6, 4, 240, '12+', 'Medium'),
    ('Level Up Advanced 5th Edition', 'level-up-advanced-5e', 'High Fantasy', 2, 6, 4, 240, '12+', 'Medium'),
    ('Shadowrun', 'shadowrun', 'Cyberpunk Fantasy', 2, 6, 4, 240, '16+', 'High'),
    ('Warhammer Fantasy Roleplay', 'warhammer-fantasy-roleplay', 'Dark Fantasy', 2, 6, 4, 240, '16+', 'High'),
    ('Shadowdark RPG', 'shadowdark-rpg', 'Dark Fantasy, OSR', 2, 6, 4, 240, '13+', 'Medium'),
    ('GURPS', 'gurps', 'Generic, Universal', 2, 10, 3, 360, '6+', 'High'),
    ('Alien RPG', 'alien-the-roleplaying-game', 'Sci-Fi Horror', 2, 6, 4, 240, '14+', 'Moderate'),
    ('Cypher Systems', 'cypher-system', 'Generic, Narrative-focused', 2, 6, 4, 240, '13+', 'Medium'),
    ('Dungeons & Dragons 3/3.5e', 'dnd-3-3-5e', 'High Fantasy', 2, 6, 4, 300, '12+', 'High'),
    ('City of Mist', 'city-of-mist-rpg', 'Neo-Noir, Urban Fantasy', 2, 6, 3, 180, '13+', 'Moderate to High'),
    ('Dragonbane', 'dragonbane-rpg', 'Fantasy', 1, 6, 4, 30, '12+', 'Low'),
    ('Flip 7', 'flip-7', NULL, 3, 8, NULL, 20, '8+', 'Low'),
    ('Vantage', 'vantage', NULL, 1, 6, 2, 180, '14+', 'Medium'),
    ('Bomb Busters', 'bomb-busters', NULL, 2, 5, 4, 30, '10+', 'Low'),
    ('Harmonies', 'harmonies', NULL, 1, 4, 2, 45, '10+', 'Light-Medium'),
    ('Sky Team', 'sky-team', NULL, 2, 2, 2, 20, '10+', 'Medium-Light'),
    ('Arcs', 'arcs', NULL, 2, 4, 3, 120, '14+', 'Heavy'),
    ('Sea Salt & Paper', 'sea-salt-and-paper', NULL, 2, 4, 2, 45, '8+', 'Moderate'),
    ('Faraway', 'faraway', NULL, 2, 6, 5, 30, '10+', 'Light-to-Medium'),
    ('Azul', 'azul', NULL, 2, 4, 2, 45, '8+', 'Low to Medium'),
    ('SETI: Search for Extraterrestrial Intelligence', 'seti-search-for-extraterrestrial-intelligence', NULL, 1, 4, 2, 160, '13+', 'Medium-Heavy'),
    ('CATAN', 'catan', NULL, 3, 4, 4, 90, '10+', 'Entry-level'),
    ('Forest Shuffle', 'forest-shuffle', NULL, 2, 5, 3, 60, '10+', 'Moderately complex'),
    ('The Lord of the Rings: Duel for Middle-earth', 'the-lord-of-the-rings-duel-for-middle-earth', NULL, 2, 2, 2, 45, '10+', 'Low'),
    ('Wingspan', 'wingspan', NULL, 1, 5, 2, 70, '10+', 'Medium'),
    ('Heat: Pedal to the Metal', 'heat-pedal-to-the-metal', NULL, 1, 6, 4, 60, '10+', 'Light to Medium'),
    ('Carcassonne', 'carcassonne', NULL, 2, 5, 3, 45, '8+', 'Simple'),
    ('SCOUT', 'scout', NULL, 2, 5, 4, 20, '9+', 'Low'),
    ('7 Wonders Duel', '7-wonders-duel', NULL, 2, 2, 2, 30, '10+', 'Light-Medium'),
    ('Micro Hero: Hercules', 'micro-hero-hercules', NULL, 1, 1, 1, 240, '10+', 'Minimalist'),
    ('Castle Combo', 'castle-combo', NULL, 2, 5, 2, 30, '10+', 'Light to Mid-Light'),
    ('Codenames', 'codenames', NULL, 2, 8, 6, 30, '10+', 'Low'),
    ('The White Castle', 'the-white-castle', NULL, 1, 4, NULL, 80, NULL, 'Medium'),
    ('Cascadia', 'cascadia', NULL, 1, 4, NULL, 45, '10+', 'Low'),
    ('Endeavor: Deep Sea', 'endeavor-deep-sea', NULL, 1, 4, 3, 120, '10+', 'Medium'),
    ('Ark Nova', 'ark-nova', NULL, 1, 4, 2, 150, '14+', 'High');

-- Seed Categories
INSERT INTO game_system_categories (name) VALUES
    ('Abstract'), ('Puzzle'), ('Strategy'), ('Deduction'), ('Spies/Secret Agents'), ('Nature'), ('Cooperative'), ('Aviation'), ('Space Opera'), ('Card Game'), ('Set Collection'), ('Exploration'), ('Tile Placement'), ('Science Fiction'), ('Space Exploration'), ('Eurogame'), ('Fantasy'), ('Engine Building'), ('Racing'), ('Sports'), ('Tile-based game'), ('Climbing'), ('Civilization'), ('Adventure'), ('Ancient'), ('Humor'), ('Mythology'), ('Tableau-Building'), ('Party Game'), ('Word Game'), ('Economic'), ('Animals'), ('Zoo'), ('Nautical');

-- Seed Mechanics
INSERT INTO game_system_mechanics (name) VALUES
    ('Tile Placement'), ('Pattern Building'), ('Area Control'), ('Set Collection'), ('Communication Limits'), ('Cooperative Game'), ('Deduction'), ('Memory'), ('Once-Per-Game Abilities'), ('Real-Time'), ('Scenario / Mission / Campaign Game'), ('Sudden Death Ending'), ('Dice Rolling'), ('Variable Player Powers'), ('Trick-taking'), ('Hand Management'), ('Push Your Luck'), ('Route/Network Building'), ('Tile Drafting'), ('End Game Bonuses'), ('Income'), ('Multi-Use Cards'), ('Resource to Move'), ('Solo / Solitaire Game'), ('Turn Order: Progressive'), ('Variable Set-up'), ('Resource Management'), ('Trading'), ('Engine Building'), ('Tableau Building'), ('Deck, Bag, and Pool Building'), ('Climbing'), ('Card Drafting'), ('Deckbuilding'), ('Roguelike'), ('Solo'), ('Evolving Cards'), ('Partnerships'), ('Pattern Recognition'), ('Press Your Luck'), ('Worker Placement'), ('Dice Placement'), ('Hexagon Grid');

-- Seed Game System to Category Relations
INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Flip 7' AND gsc.name IN ('Abstract', 'Puzzle');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Vantage' AND gsc.name IN ('Abstract', 'Strategy');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Bomb Busters' AND gsc.name IN ('Deduction', 'Spies/Secret Agents');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Harmonies' AND gsc.name IN ('Abstract', 'Nature');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Sky Team' AND gsc.name IN ('Cooperative', 'Aviation');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Arcs' AND gsc.name IN ('Space Opera');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Sea Salt & Paper' AND gsc.name IN ('Card Game', 'Set Collection');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Faraway' AND gsc.name IN ('Abstract', 'Exploration');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Azul' AND gsc.name IN ('Abstract', 'Tile Placement');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'SETI: Search for Extraterrestrial Intelligence' AND gsc.name IN ('Science Fiction', 'Space Exploration');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'CATAN' AND gsc.name IN ('Eurogame');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Forest Shuffle' AND gsc.name IN ('Card Game', 'Nature');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'The Lord of the Rings: Duel for Middle-earth' AND gsc.name IN ('Card Game', 'Fantasy');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Wingspan' AND gsc.name IN ('Card Game', 'Engine Building');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Heat: Pedal to the Metal' AND gsc.name IN ('Racing', 'Sports');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Carcassonne' AND gsc.name IN ('Tile-based game', 'Eurogame');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'SCOUT' AND gsc.name IN ('Card Game', 'Climbing');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = '7 Wonders Duel' AND gsc.name IN ('Card Game', 'Civilization');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Micro Hero: Hercules' AND gsc.name IN ('Adventure', 'Ancient', 'Card Game', 'Fantasy', 'Humor', 'Mythology');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Castle Combo' AND gsc.name IN ('Tableau-Building');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Codenames' AND gsc.name IN ('Deduction', 'Party Game', 'Spies/Secret Agents', 'Word Game');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'The White Castle' AND gsc.name IN ('Eurogame');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Cascadia' AND gsc.name IN ('Abstract', 'Puzzle', 'Nature');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Endeavor: Deep Sea' AND gsc.name IN ('Exploration', 'Nautical');

INSERT INTO game_system_to_category (game_system_id, category_id)
SELECT gs.id, gsc.id
FROM game_systems gs, game_system_categories gsc
WHERE gs.name = 'Ark Nova' AND gsc.name IN ('Economic', 'Animals', 'Zoo');

-- Seed Game System to Mechanic Relations
INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Flip 7' AND gsm.name IN ('Tile Placement', 'Pattern Building');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Vantage' AND gsm.name IN ('Area Control', 'Set Collection');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Bomb Busters' AND gsm.name IN ('Communication Limits', 'Cooperative Game', 'Deduction', 'Memory', 'Once-Per-Game Abilities', 'Real-Time', 'Scenario / Mission / Campaign Game', 'Sudden Death Ending');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Harmonies' AND gsm.name IN ('Pattern Building', 'Set Collection', 'Tile Placement');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Sky Team' AND gsm.name IN ('Dice Rolling', 'Communication Limits', 'Variable Player Powers');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Arcs' AND gsm.name IN ('Trick-taking', 'Variable Player Powers', 'Dice Rolling');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Sea Salt & Paper' AND gsm.name IN ('Hand Management', 'Push Your Luck');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Faraway' AND gsm.name IN ('Route/Network Building', 'Set Collection');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Azul' AND gsm.name IN ('Pattern Building', 'Set Collection', 'Tile Drafting');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'SETI: Search for Extraterrestrial Intelligence' AND gsm.name IN ('End Game Bonuses', 'Income', 'Multi-Use Cards', 'Resource to Move', 'Solo / Solitaire Game', 'Turn Order: Progressive', 'Variable Set-up');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'CATAN' AND gsm.name IN ('Resource Management', 'Trading', 'Route/Network Building', 'Dice Rolling');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Forest Shuffle' AND gsm.name IN ('Engine Building', 'Set Collection', 'Tableau Building');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'The Lord of the Rings: Duel for Middle-earth' AND gsm.name IN ('Area Control', 'Hand Management');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Wingspan' AND gsm.name IN ('Card Drafting', 'Dice Rolling', 'Hand Management', 'Set Collection');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Heat: Pedal to the Metal' AND gsm.name IN ('Hand Management', 'Deck, Bag, and Pool Building');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Carcassonne' AND gsm.name IN ('Tile Placement', 'Area Control');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'SCOUT' AND gsm.name IN ('Hand Management', 'Trick-taking');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = '7 Wonders Duel' AND gsm.name IN ('Card Drafting', 'Set Collection', 'Tableau Building');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Micro Hero: Hercules' AND gsm.name IN ('Deckbuilding', 'Roguelike', 'Solo', 'Hand Management', 'Evolving Cards');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Castle Combo' AND gsm.name IN ('Card Drafting', 'Set Collection', 'Tableau Building');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Codenames' AND gsm.name IN ('Memory', 'Partnerships', 'Pattern Recognition', 'Press Your Luck');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'The White Castle' AND gsm.name IN ('Resource Management', 'Worker Placement', 'Dice Placement');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Cascadia' AND gsm.name IN ('Hexagon Grid', 'Tile Placement', 'End Game Bonuses', 'Set Collection');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Endeavor: Deep Sea' AND gsm.name IN ('Area Control', 'Engine Building', 'Variable Player Powers');

INSERT INTO game_system_to_mechanics (game_system_id, mechanics_id)
SELECT gs.id, gsm.id
FROM game_systems gs, game_system_mechanics gsm
WHERE gs.name = 'Ark Nova' AND gsm.name IN ('Card Drafting', 'End Game Bonuses', 'Hand Management', 'Hexagon Grid', 'Income', 'Set Collection', 'Solo / Solitaire Game', 'Tile Placement', 'Variable Player Powers');
