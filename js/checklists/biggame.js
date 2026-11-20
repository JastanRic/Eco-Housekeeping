/* Big Game inspection list: edit items here.
   "icons" = one icon name per item, in the SAME ORDER as "items". */
window.CHECKLISTS = window.CHECKLISTS || {};
CHECKLISTS.biggame = {
  name: "Big Game",
  title: "BIG GAME GUEST ROOM HOUSEKEEPING CHECKLIST",
  pdf: "table",
  sections: [
    {name:"Outside",
     items:[
       "Surroundings clean",
       "Chair",
       "Fly sheets",
       "Door mat",
       "Door lock"
     ],
     icons:["ground","chair","tent","mat","lock"]},
    {name:"General",
     items:[
       "Room is clean",
       "Clean and dust free",
       "Curtains",
       "Power supply",
       "Fan",
       "Light lamp",
       "Mosquito vaporizer",
       "Safety booklet",
       "ECO cream hung",
       "Binoculars",
       "Umbrellas",
       "Raincoats",
       "Luggage table",
       "Water bottles",
       "Glasses & covers"
     ],
     icons:["sparkle","broom","curtains","power","fan","bulb","vapor","book","cream","bino","umb","coat","luggage","bottle","glass"]},
    {name:"Bedroom",
     items:[
       "Beds made",
       "Bedsheet / cover",
       "Pillows",
       "Bed throw pillows",
       "Bed runner"
     ],
     icons:["bed","sheet","pillow","throw","runner"]},
    {name:"Bathroom",
     items:[
       "Clean and dust free",
       "Shower area",
       "No leaks / no water",
       "Carpets (commode, shower, sink, outside)",
       "Towel",
       "Hangers",
       "Soap",
       "Toilet roll"
     ],
     icons:["broom","shower","droplet","carpet","towel","hanger","soap","roll"]}
  ]
};
