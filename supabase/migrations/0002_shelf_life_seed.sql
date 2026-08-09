-- Seed the curated shelf-life table.
--
-- These durations are the reason the app never asks a model how long food
-- lasts. Values are conservative "still good if stored properly" estimates
-- from USDA FoodKeeper guidance, rounded to whole days.
--
-- `aliases` carries the words people actually type or that appear on receipts,
-- so the matcher has something to hit beyond the display label.

alter table public.shelf_life
  add column if not exists aliases text[] not null default '{}';

-- Trigram index for fuzzy lookups later; harmless if the extension is present.
create extension if not exists pg_trgm;
create index if not exists shelf_life_label_trgm_idx
  on public.shelf_life using gin (label gin_trgm_ops);

insert into public.shelf_life
  (id, label, category, default_storage, days_fridge, days_pantry, days_freezer, aliases)
values
  -- Dairy -------------------------------------------------------------------
  ('milk_whole',      'Whole milk',      'dairy',   'fridge',   7, null,  90, '{milk,whole milk,vitamin d milk,mlk}'),
  ('milk_skim',       'Skim milk',       'dairy',   'fridge',   7, null,  90, '{skim milk,nonfat milk,fat free milk}'),
  ('milk_two_pct',    '2% milk',         'dairy',   'fridge',   7, null,  90, '{2% milk,two percent milk,reduced fat milk}'),
  ('cream_heavy',     'Heavy cream',     'dairy',   'fridge',  10, null,  60, '{heavy cream,whipping cream,double cream}'),
  ('half_and_half',   'Half and half',   'dairy',   'fridge',   7, null,  60, '{half and half,half & half}'),
  ('butter',          'Butter',          'dairy',   'fridge',  30, null, 270, '{butter,unsalted butter,salted butter}'),
  ('yogurt',          'Yogurt',          'dairy',   'fridge',  14, null,  60, '{yogurt,yoghurt,greek yogurt}'),
  ('cheese_hard',     'Hard cheese',     'dairy',   'fridge',  42, null, 180, '{cheddar,parmesan,gouda,swiss,hard cheese,cheese}'),
  ('cheese_soft',     'Soft cheese',     'dairy',   'fridge',  10, null,  60, '{brie,camembert,ricotta,soft cheese,goat cheese}'),
  ('cream_cheese',    'Cream cheese',    'dairy',   'fridge',  14, null,  60, '{cream cheese}'),
  ('cottage_cheese',  'Cottage cheese',  'dairy',   'fridge',  10, null,  30, '{cottage cheese}'),
  ('sour_cream',      'Sour cream',      'dairy',   'fridge',  14, null,  30, '{sour cream,creme fraiche}'),
  ('eggs',            'Eggs',            'dairy',   'fridge',  28, null, null, '{eggs,egg,large eggs,dozen eggs}'),

  -- Meat & poultry ----------------------------------------------------------
  ('chicken_raw',     'Raw chicken',     'meat',    'fridge',   2, null, 270, '{chicken,chicken breast,chicken thighs,chicken wings,whole chicken}'),
  ('turkey_raw',      'Raw turkey',      'meat',    'fridge',   2, null, 270, '{turkey,ground turkey,turkey breast}'),
  ('beef_ground',     'Ground beef',     'meat',    'fridge',   2, null, 120, '{ground beef,mince,hamburger,minced beef}'),
  ('beef_steak',      'Beef steak',      'meat',    'fridge',   4, null, 270, '{steak,sirloin,ribeye,beef}'),
  ('pork_chops',      'Pork chops',      'meat',    'fridge',   4, null, 180, '{pork,pork chops,pork loin}'),
  ('bacon',           'Bacon',           'meat',    'fridge',   7, null,  30, '{bacon}'),
  ('sausage_raw',     'Raw sausage',     'meat',    'fridge',   2, null,  60, '{sausage,sausages,bratwurst}'),
  ('deli_meat',       'Deli meat',       'meat',    'fridge',   5, null,  60, '{deli meat,ham,salami,turkey slices,lunch meat}'),
  ('hot_dogs',        'Hot dogs',        'meat',    'fridge',   7, null,  60, '{hot dogs,frankfurters,wieners}'),

  -- Seafood -----------------------------------------------------------------
  ('fish_fresh',      'Fresh fish',      'seafood', 'fridge',   2, null, 180, '{fish,salmon,cod,tilapia,halibut,tuna steak}'),
  ('shrimp_raw',      'Raw shrimp',      'seafood', 'fridge',   2, null, 180, '{shrimp,prawns}'),

  -- Vegetables --------------------------------------------------------------
  ('spinach',         'Spinach',         'produce', 'fridge',   5, null, 300, '{spinach,baby spinach}'),
  ('lettuce',         'Lettuce',         'produce', 'fridge',   7, null, null, '{lettuce,romaine,iceberg,salad mix,mixed greens}'),
  ('kale',            'Kale',            'produce', 'fridge',   7, null, 300, '{kale}'),
  ('broccoli',        'Broccoli',        'produce', 'fridge',   7, null, 300, '{broccoli}'),
  ('cauliflower',     'Cauliflower',     'produce', 'fridge',   7, null, 300, '{cauliflower}'),
  ('carrots',         'Carrots',         'produce', 'fridge',  28, null, 300, '{carrots,carrot,baby carrots}'),
  ('celery',          'Celery',          'produce', 'fridge',  14, null, 300, '{celery}'),
  ('bell_pepper',     'Bell pepper',     'produce', 'fridge',  10, null, 240, '{bell pepper,peppers,red pepper,green pepper,capsicum}'),
  ('cucumber',        'Cucumber',        'produce', 'fridge',   7, null, null, '{cucumber,cucumbers}'),
  ('tomatoes',        'Tomatoes',        'produce', 'pantry',   7,    5, 240, '{tomato,tomatoes,roma tomatoes,cherry tomatoes}'),
  ('zucchini',        'Zucchini',        'produce', 'fridge',   7, null, 300, '{zucchini,courgette,squash}'),
  ('mushrooms',       'Mushrooms',       'produce', 'fridge',   7, null, 300, '{mushrooms,mushroom,button mushrooms}'),
  ('green_beans',     'Green beans',     'produce', 'fridge',   7, null, 300, '{green beans,string beans}'),
  ('asparagus',       'Asparagus',       'produce', 'fridge',   4, null, 240, '{asparagus}'),
  ('onions',          'Onions',          'produce', 'pantry',  60,   30, 240, '{onion,onions,yellow onion,red onion}'),
  ('garlic',          'Garlic',          'produce', 'pantry',  90,   90, 300, '{garlic}'),
  ('potatoes',        'Potatoes',        'produce', 'pantry',  90,   30, 300, '{potato,potatoes,russet,yukon gold}'),
  ('sweet_potatoes',  'Sweet potatoes',  'produce', 'pantry',  60,   21, 300, '{sweet potato,sweet potatoes,yam}'),
  ('cabbage',         'Cabbage',         'produce', 'fridge',  30, null, 300, '{cabbage}'),
  ('corn_cob',        'Corn on the cob', 'produce', 'fridge',   3, null, 240, '{corn,corn on the cob,sweetcorn}'),
  ('herbs_fresh',     'Fresh herbs',     'produce', 'fridge',   7, null,  90, '{cilantro,parsley,basil,mint,dill,fresh herbs}'),

  -- Fruit -------------------------------------------------------------------
  ('bananas',         'Bananas',         'produce', 'pantry',   7,    5, 90,  '{banana,bananas}'),
  ('apples',          'Apples',          'produce', 'fridge',  30,    7, 240, '{apple,apples,gala,fuji,honeycrisp}'),
  ('oranges',         'Oranges',         'produce', 'fridge',  21,    7, 240, '{orange,oranges,clementines,mandarins}'),
  ('lemons',          'Lemons',          'produce', 'fridge',  28,    7, 120, '{lemon,lemons}'),
  ('limes',           'Limes',           'produce', 'fridge',  28,    7, 120, '{lime,limes}'),
  ('grapes',          'Grapes',          'produce', 'fridge',   7, null, 300, '{grapes}'),
  ('strawberries',    'Strawberries',    'produce', 'fridge',   5, null, 240, '{strawberries,strawberry}'),
  ('blueberries',     'Blueberries',     'produce', 'fridge',  10, null, 300, '{blueberries,blueberry}'),
  ('raspberries',     'Raspberries',     'produce', 'fridge',   3, null, 300, '{raspberries,raspberry}'),
  ('avocado',         'Avocado',         'produce', 'pantry',   5,    4, 150, '{avocado,avocados}'),
  ('melon',           'Melon',           'produce', 'fridge',   7, null, 300, '{melon,cantaloupe,honeydew,watermelon}'),
  ('peaches',         'Peaches',         'produce', 'fridge',   5,    3, 300, '{peach,peaches,nectarine}'),
  ('pears',           'Pears',           'produce', 'fridge',   7,    4, 300, '{pear,pears}'),

  -- Bakery ------------------------------------------------------------------
  ('bread_sliced',    'Sliced bread',    'bakery',  'pantry',  14,    6,  90, '{bread,white bread,wheat bread,sandwich bread}'),
  ('bread_artisan',   'Artisan bread',   'bakery',  'pantry',   7,    3,  90, '{sourdough,baguette,artisan bread,ciabatta}'),
  ('bagels',          'Bagels',          'bakery',  'pantry',   7,    5,  90, '{bagel,bagels}'),
  ('tortillas',       'Tortillas',       'bakery',  'fridge',  21,    7, 180, '{tortilla,tortillas,wraps}'),
  ('muffins',         'Muffins',         'bakery',  'pantry',   7,    4,  90, '{muffin,muffins,pastry,croissant}'),

  -- Pantry staples ----------------------------------------------------------
  ('rice_dry',        'Dry rice',        'pantry',  'pantry', null,  730, null, '{rice,white rice,basmati,jasmine rice}'),
  ('pasta_dry',       'Dry pasta',       'pantry',  'pantry', null,  730, null, '{pasta,spaghetti,penne,macaroni,noodles}'),
  ('flour',           'Flour',           'pantry',  'pantry', null,  365, null, '{flour,all purpose flour}'),
  ('sugar',           'Sugar',           'pantry',  'pantry', null,  730, null, '{sugar,granulated sugar,brown sugar}'),
  ('cereal',          'Cereal',          'pantry',  'pantry', null,  180, null, '{cereal,granola,oats,oatmeal}'),
  ('canned_goods',    'Canned goods',    'pantry',  'pantry', null,  730, null, '{canned beans,canned tomatoes,canned soup,can}'),
  ('peanut_butter',   'Peanut butter',   'pantry',  'pantry',  90,  180, null, '{peanut butter,almond butter,nut butter}'),
  ('jam',             'Jam',             'pantry',  'pantry',  180, 365, null, '{jam,jelly,preserves}'),
  ('olive_oil',       'Olive oil',       'pantry',  'pantry', null,  540, null, '{olive oil,cooking oil,vegetable oil}'),
  ('coffee_ground',   'Ground coffee',   'pantry',  'pantry',  30,  150, 365, '{coffee,ground coffee,coffee beans}'),
  ('tea',             'Tea',             'pantry',  'pantry', null,  540, null, '{tea,tea bags}'),
  ('honey',           'Honey',           'pantry',  'pantry', null,  730, null, '{honey}'),
  ('nuts',            'Nuts',            'pantry',  'pantry',  180,  90, 365, '{almonds,walnuts,cashews,peanuts,nuts}'),
  ('chips',           'Chips',           'pantry',  'pantry', null,   60, null, '{chips,crisps,tortilla chips,pretzels}'),
  ('crackers',        'Crackers',        'pantry',  'pantry', null,   90, null, '{crackers}'),

  -- Prepared & other --------------------------------------------------------
  ('leftovers',       'Leftovers',       'prepared','fridge',   4, null,  90, '{leftovers,leftover}'),
  ('hummus',          'Hummus',          'prepared','fridge',   7, null,  30, '{hummus}'),
  ('salsa',           'Salsa',           'prepared','fridge',  14, null,  60, '{salsa,pico de gallo}'),
  ('juice',           'Juice',           'drinks',  'fridge',  10, null, 240, '{juice,orange juice,apple juice}'),
  ('tofu',            'Tofu',            'protein', 'fridge',   7, null, 150, '{tofu}'),
  ('frozen_veg',      'Frozen vegetables','frozen', 'freezer', null, null, 300, '{frozen vegetables,frozen peas,frozen corn}'),
  ('ice_cream',       'Ice cream',       'frozen',  'freezer', null, null,  60, '{ice cream,gelato,frozen yogurt}')
on conflict (id) do update set
  label           = excluded.label,
  category        = excluded.category,
  default_storage = excluded.default_storage,
  days_fridge     = excluded.days_fridge,
  days_pantry     = excluded.days_pantry,
  days_freezer    = excluded.days_freezer,
  aliases         = excluded.aliases;
