-- Update Chutney names and prices for Parathas
UPDATE menu_items
SET extras = '[
    {"id": "dhaniya-chutney", "name": "Dhaniya Chutney", "price": 10},
    {"id": "schezwan-chutney", "name": "Schezwan Chutney", "price": 10}
]'::jsonb
WHERE category_id = 'parathas';
-- Update Add-ons for Pav Bhaji dishes (adding Butter/Masala/Plain Pav)
UPDATE menu_items
SET add_ons = '[
    {"id": "cheese-pav", "name": "Cheese", "price": 25},
    {"id": "butter-pav", "name": "Butter", "price": 10},
    {"id": "extra-pav", "name": "Pav", "price": 10},
    {"id": "butter-pav-full", "name": "Butter Pav", "price": 20},
    {"id": "masala-pav", "name": "Masala Pav", "price": 20},
    {"id": "plain-pav-full", "name": "Plain Pav", "price": 10}
]'::jsonb
WHERE category_id = 'pav-bhaji';