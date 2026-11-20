/* Mahoora inspection list: edit items here.
   "icons" = one icon name per item, in the SAME ORDER as "items".
   pdf:"table" = table-style PDF (same as Big Game) */
window.CHECKLISTS = window.CHECKLISTS || {};
CHECKLISTS.mahoora = {
  name: "Mahoora",
  title: "MAHOORA GUEST ROOM HOUSEKEEPING CHECKLIST",
  pdf: "table",
  sections: [
    {name:"Outside",
     items:[
       "Chair",
       "Door mat",
       "Door lock",
       "Fly sheets",
       "Surroundings clean"
     ],
     icons:["chair","mat","lock","tent","ground"]},
    {name:"Living room",
     items:[
       "Fan",
       "Clean - walls / floor",
       "Side table",
       "Cushions",
       "Bed throw cushions",
       "Oil canter / oil lamp"
     ],
     icons:["fan","sparkle","stable","cush","throw","lamp"]},
    {name:"General",
     items:[
       "Fan",
       "Power supply",
       "Room is clean",
       "Curtains",
       "Clean and dust free",
       "Safety booklet",
       "ECO cream hung",
       "Light lamp",
       "Mosquito vaporizer",
       "Binoculars",
       "Umbrellas",
       "Raincoats",
       "Luggage table",
       "Water bottles",
       "Glasses & covers"
     ],
     icons:["fan","power","sparkle","curtains","broom","book","cream","bulb","vapor","bino","umb","coat","luggage","bottle","glass"]},
    {name:"Bedroom",
     items:[
       "Beds made",
       "Pillows",
       "Bed throw pillows",
       "Bedsheet / cover",
       "Bed runner",
       "Linen clean and neat"
     ],
     icons:["bed","pillow","throw","sheet","runner","layers"]},
    {name:"Bathroom",
     items:[
       "Clean and dust free",
       "Shower area clean",
       "Carpets (commode, shower, sink, outside)",
       "Soap",
       "Toilet roll",
       "No water leak",
       "Hangers"
     ],
     icons:["broom","shower","carpet","soap","roll","droplet","hanger"]}
  ]
};
