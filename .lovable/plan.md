## Plan to fix the avatar background customization

I understand the intended behavior now:

- The avatar should look like the reference: a character sitting in front of a solid circular background.
- The blue circle in the reference is not supposed to be removed visually; it should become a customizable color area.
- When a user selects a color, that color should fill the full circular background behind the character.
- The selected color should not appear as only a ring or border.
- The bear is still broken and needs to be fixed first before adding the next avatars.

## What I will change

1. Rework the bear avatar asset
   - Re-process the bear so the character itself is transparent around the edges.
   - Remove the baked-in blue/background color from the asset if present.
   - Preserve the bear and crown artwork cleanly, including its 3D shading.
   - The saved PNG should contain only the bear/crown character on transparent pixels.

2. Rework the avatar rendering component
   - Make `DiagAvatar` draw the circular background itself.
   - The background circle will use the selected color from the color picker.
   - The bear PNG will be layered on top of that circle.
   - The color will fill the whole circle behind the bear, not just the rim.

3. Fix avatar picker thumbnails
   - Update the avatar selection grid so each thumbnail also shows the selected/customizable background circle correctly.
   - Avoid showing transparent checkerboard-looking or border-only behavior.
   - Keep the active selection styling separate from the avatar background color, so the selected state does not get confused with the user’s chosen color.

4. Check responsive sizing
   - Make sure the large preview on `/diagnostic/avatar` looks good.
   - Make sure the small thumbnails still fit in the grid.
   - Ensure the character remains centered and naturally scaled inside the color circle.

## Technical details

- `src/components/DiagAvatar.tsx` will remain the central rendering component.
- It will render a circular container with `background: color` and `overflow: hidden`.
- The transparent character PNG will be placed on top with `object-fit: contain`.
- `src/routes/diagnostic.avatar.tsx` will use `DiagAvatar` for the grid thumbnails instead of raw `<img>` tags, so thumbnails match the main preview.
- The bear asset at `src/assets/avatars/bear.png` will be corrected so it does not include its own fixed-color background.

## After this

Once the bear behaves correctly, we can apply the same pattern to the next uploaded avatar: isolate the character, remove any fixed background, and let the app-provided circular background be customizable.