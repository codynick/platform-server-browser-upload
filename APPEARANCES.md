# Sprite appearances

One sprite can look like Rocket, Ball, Bee, Bird, Dog, Athlete, Cactus, Apple,
Apartment, Bike or Diamond. The original SVG artwork is bundled locally; it
requires no external image service. Choose Appearance above the stage. Changing
appearance preserves the sprite's current position. It also saves that choice as
the starting appearance for future runs. Program-driven changes affect current
state; Reset/Run returns to the saved starting settings.

Blocks: Sprites > Looks > set appearance / sprite appearance.

```python
from codynick import stage
await stage.set_appearance("bee")
print(await stage.appearance())
await stage.configure(backdrop="sky", appearance="dog")
```

configure() preserves the current appearance when appearance is omitted.

## Add another appearance later

1. Add a trusted, self-contained SVG in blocks/sprites/appearances, using a
   64-by-64 viewBox. Keep drawing inside that square, centered at (32,32).
   Avoid scripts, external resources, fonts and embedded web content.
2. Add an entry in blocks/sprite-looks.js, for example:

   {id:'fish',label:'Fish',file:'sprites/appearances/fish.svg',heading:90}

3. Use heading:90 when the drawing should be upright at direction 90 (the default),
   or heading:0 when the drawing points upward at direction 0, like Rocket.
4. Include the new asset in installer required-file lists, bump the revision,
   update release history and rebuild the checked update ZIP. Refresh the editor.

The stage dropdown and Blocks dropdown populate from this catalogue; Python uses
the same ID. Choose a permanent lower-case ID because projects store it. SVGs stay
in the platform installation rather than being copied into each project archive.
A receiving installation must contain that appearance. User image uploads,
multiple sprites and animated costumes are outside this revision.
