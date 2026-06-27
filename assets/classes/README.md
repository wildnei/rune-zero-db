# Class sprites (wiki Skill Changes tab)

The Skill Changes tab shows a per-class icon. By default it renders an **emoji** fallback.
To upgrade to **real RO class sprites**, drop a PNG here named exactly `<class-key>.png` and it
auto-replaces the emoji (no code change — the wiki tries the PNG first, falls back to emoji on 404).

Recommended: small square PNGs (~64×64 or 128×128), transparent background, the job's character sprite.
You can export these from your client GRF (GRF Editor → find the job sprite `.spr` → export frame to PNG)
or use any RO class art you have rights to.

## Exact filenames the wiki looks for
```
novice.png            swordman.png          merchant.png          thief.png
knight.png            crusader.png          blacksmith.png        whitesmith.png
alchemist.png         creator.png           assassin.png          assassin-cross.png
rogue.png             stalker.png           mage.png              wizard.png
high-wizard.png       sage.png              professor.png         acolyte.png
priest.png            high-priest.png       monk.png              champion.png
archer.png            hunter.png            sniper.png            bard-clown.png
dancer-gypsy.png      clown-gypsy.png       lord-knight.png       paladin.png
gunslinger.png        ninja.png             taekwon.png           star-gladiator.png
soul-linker.png       super-novice.png
```
(Key rule: class name lowercased, spaces and `/` replaced with `-`.)

Only the classes that actually appear on the Skill Changes tab need art; the rest are optional.
