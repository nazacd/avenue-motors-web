# Avenue Motors — catalogue photographs

This is a working brief for **Claude with the Higgsfield connector** (Claude chat or Cowork). It produces one consistent set of studio photographs of the dealer's cars for the catalogue of the Avenue Motors website, plus one picture for the home page.

## For the owner: how to run it

1. Open a new chat in Claude (claude.ai) or Cowork with the **Higgsfield** connector switched on.
2. Attach the whole zip (or this file and the `refs` folder) and send: `Run Stage 0 and Stage 1 from BRIEF.md.`
3. Stage 1 makes only four pictures, to settle the look. Reply `approved`, or say what to fix, for example `C01-a: the plate is misspelled`.
4. Continue with `Run Stage 2`, then `Run Stage 3`.
5. Each stage ends with a manifest table. Paste it into the Claude Code session that builds the site. The files are downloaded and placed there.

---

## For Claude: what we are making

Avenue Motors is a premium car showroom in Uzbekistan. Its catalogue is currently illustrated with phone photos, and four cars have nothing but a round phone video. We want every car photographed the same way: standing on the showroom's turntable in a dim hall under the illuminated Avenue Motors sign, lit like the garage screen of a racing game, wearing the dealer's own number plate.

The site already has a 3D garage with exactly this look. `refs/R41.png` is a capture of it. Match its mood and lighting.

**These are pictures of real cars that are for sale.** A buyer will compare the picture with the car. The picture may flatter the light. It may not change the car.

## Rules

- **Unlimited allowance only.** Pass `use_unlim: true` on every generation. Never spend credits; the owner has not agreed to buy any. If a call asks an `unlim_choice` question, answer it with `use_unlim: true`. If unlimited generations are not available here at all, stop and say so.
- **If the allowance refuses a configuration**, lower the resolution one step (4k, then 2k, then 1k) and tell the owner what you changed.
- With the allowance each request makes one result. For two takes, submit two requests (the batch tools take up to 12).
- **The car must match its references exactly:** make, model and generation, body shape, paint colour and finish, grille, lamps, wheel design and wheel colour, brake caliper colour, badges, roof, trim colour (chrome or black). Read these off the reference photos. Do not add or remove options, body kits, stripes or stickers. If the interior shows through the glass, it has the colour in the interior reference.
- **Only draw views you have a reference for.** The shot list below says which views each car gets. Do not invent the rear of a car you have only seen from the front.
- **Number plates:** every plate is the Avenue Motors dealer plate in `R40`, sharp and correctly spelled. Never invent a registration number.
- **Text:** the only words in a picture are the wall sign and the dealer plate, both spelled AVENUE MOTORS. No watermarks, captions or other logos. Badges that belong to the car stay.
- No people, no reflections of people, no other cars in the frame.
- Video frames (R42 to R61) are small, round and soft. Use them for what the car *is*, never for sharpness, framing or lighting.

## Settings

| | |
|---|---|
| Model | `nano_banana_pro` |
| Fallback | `gpt_image_2_6` with quality `high`. Switch to it for a picture whose sign or plate text fails twice |
| Aspect ratio | `4:5` (upright) for every picture |
| Resolution | `4k` if the allowance covers it, otherwise `2k` |
| References | role `image_references`: the car's own photos, plus `R01`, `R40`, `R41` and `R62` on every picture |

## The look

Put this paragraph at the end of every prompt, unchanged:

```
SETTING AND LOOK: a dark private showroom hall, lit like the garage screen of a racing game. The car stands on a low round grey turntable. Behind it a dark graphite panelled wall carries the illuminated sign from the logo reference: the yellow A mark on the left and the white AVENUE MOTORS wordmark, softly glowing and spelled correctly. A thin ring of warm white light hangs above the turntable and draws a clean highlight along the bonnet, roof and shoulders of the car. Rows of slim ceiling light tubes fade into the darkness. The polished dark stone floor reflects the car, the glow of its lamps and the sign. A thin red line runs along the foot of the wall. The edges of the frame fall away to black. The car's daytime running lights and tail lamps are on. Photorealistic automotive photography on a large-format camera with an 85 mm lens: deep true blacks, graphite greys, restrained highlights, soft bloom on the lamps, fine film grain. The paint is glossy with clean, physically correct reflections. The car matches its reference photos exactly and is not redesigned. Its number plate is the black Avenue Motors dealer plate from the plate reference. No people, no other cars, no text other than the sign and the plate, no watermark.
```

## The views

Each picture's prompt is one view sentence, then the car's line from the shot list, then the look paragraph.

| View | Sentence |
|---|---|
| **a** Cover | `Front three-quarter view from headlight height, the whole car in frame and filling about two-thirds of the width, the sign fully visible in the upper third of the frame.` |
| **b** Rear | `Rear three-quarter view from tail-lamp height, the whole car in frame, tail lamps glowing, the sign visible behind and above it.` |
| **s** Side | `Exact side profile from door-handle height, the whole car in frame from bumper to bumper, the sign above it.` |
| **d** Detail | `Close view of the front corner: one headlamp, half of the grille and the dealer plate, shallow depth of field, the sign a soft glow in the background.` |

## The shot list

The car line names the car and its references. Pass the listed references, in that order, before the four that go on every picture.

| Code | Car | Paint | Car references | Views |
|---|---|---|---|---|
| C01 | BMW M4 CS (2024) | Riviera Blue, with the carbon-fibre bonnet stripes and roof of the CS | R15, R16, R17, R38 | a, b, d |
| C02 | Genesis GV80 (2026) | Black | R58, R59, R60 (interior R61) | a, s, d |
| C03 | Mercedes-AMG G 63 Manufaktur (2025) | Black | R54, R57, R56, R55 | a, b, d |
| C04 | Mercedes-Maybach GLS 600 Night Series | Black | R50, R53, R51 (interior R52) | a, s, d |
| C05 | BMW X7 xDrive40i (2020) | Black | R46, R47, R49 (interior R48) | a, b, d |
| C06 | BMW M2 | Matte blue | R23, R31, R24, R32 | a, b, d |
| C07 | Range Rover | Black | R45, R42, R43 (interior R44) | a, b, d |
| C08 | Mercedes-Maybach S 680 | Black | R10, R04, R11, R37 | a, b, d |
| C09 | Bentley Flying Spur Speed (2023) | Black, with black grille and wheels and orange brake calipers | R12, R30, R13, R14 (interior R28) | a, b, d |
| C10 | Cadillac Escalade (2023) | Black | R21, R26, R22, R33 | a, b, d |
| C11 | Genesis G90 Long (2024) | Black | R19, R25, R20 | a, b, s |
| C12 | Range Rover P530 LWB (2026) | Black | R07, R05, R18 | a, b, d |
| C13 | Mercedes-AMG G 63 | Black | R08, R03, R09 | a, b, d |

A picture's code is the car code and the view letter: `C03-a`, `C03-b`, `C03-d`.

Example, the full prompt for `C01-a`:

```
Front three-quarter view from headlight height, the whole car in frame and filling about two-thirds of the width, the sign fully visible in the upper third of the frame. The car is a BMW M4 CS (2024) in Riviera Blue, with the carbon-fibre bonnet stripes and roof of the CS, exactly as in the car references. SETTING AND LOOK: ...
```

## The home page picture

One more picture, code `S1`, for the showroom section of the home page. Same settings. References: R15, R16, R17, then R01, R40, R41, R62.

```
A BMW M4 CS in Riviera Blue stands on a low round grey turntable, seen front three-quarter from headlight height. The whole car is in frame, in the lower half of the picture and a little right of centre, filling about two-thirds of the width. It is exactly the car in the reference photos: the same body, kidney grille, carbon-fibre bonnet stripes and roof, bronze wheels, red brake calipers and yellow daytime running lights, which are switched on. The illuminated Avenue Motors sign fills the upper half of the picture, complete and uncropped. SETTING AND LOOK: ...
```

## Stages

**Stage 0 — Preflight.**
1. List models with the unlimited filter and confirm the settings above are covered here. Adjust to the best covered option and tell the owner in one line.
2. Upload the new reference files R40 to R63 from the `refs` folder and note their media IDs. R01 to R39 are already in this workspace under the IDs in the table at the end; if one is not found, upload it from the `refs` folder too.
3. Create a Higgsfield project named `Avenue Motors - Catalogue` and save every generation in this brief to it.

**Stage 1 — Settle the look.** Four pictures, two takes each: `S1`, `C01-a`, `C03-a`, `C02-a`. Show them and wait for the owner's approval. If the owner asks for a change to the look, change the look paragraph once and use the new one from then on.

**Stage 2 — The covers.** View **a** for the other ten cars, two takes each.

**Stage 3 — The second and third views.** The remaining views in the shot list, one take each. Pass the car's approved cover as an extra reference so the three pictures show the same car.

## Checking each picture

Before showing a picture, compare it with its references and reject it yourself if any of these is wrong:

- the car is another model, generation or colour, or has different wheels, grille or lamps
- the sign or the plate is misspelled, mirrored or missing
- extra text, a watermark, a person or a second car
- the car is cut off by the frame in view a, b or s

Up to three attempts per picture. Change one thing per attempt and say what you changed. After a second failure on text, switch that picture to the fallback model. If a car cannot be made to match, say so and leave it out. A missing picture is better than a wrong car.

## Manifest

End each stage with this table, one row per take, and mark the take you recommend:

```
STAGE 2
code   | job_id                               | model           | status        | note
C04-a  | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | nano_banana_pro | recommended   | 4:5, 2k
C04-a  | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | nano_banana_pro | alternative   | wheels slightly darker than the reference
```

Use `failed` or `rejected` in the status column for takes that should not be used, with the reason in the note.

## References

### New, in the `refs` folder of this pack (upload in Stage 0)

| Code | File | Shows |
|---|---|---|
| R40 | `refs/R40.png` | The Avenue Motors dealer plate: black, yellow A mark, white AVENUE MOTORS. This is the only number plate any car may carry |
| R41 | `refs/R41.png` | The look to match: the site's 3D garage. Dark hall, glowing sign wall, ring of light over a round turntable, ceiling tubes, red line at the foot of the wall, reflective floor. Use it for mood and lighting, not for the car |
| R42 | `refs/R42.jpg` | Range Rover (black), front three-quarter, close. Frame from a phone video |
| R43 | `refs/R43.jpg` | Range Rover (black), rear, close. Video frame |
| R44 | `refs/R44.jpg` | Range Rover interior, tan leather. Video frame |
| R45 | `refs/R45.jpg` | Range Rover (black), front three-quarter, whole car, with the dealer plate. Video frame |
| R46 | `refs/R46.jpg` | BMW X7 xDrive40i 2020 (black), front three-quarter. Video frame |
| R47 | `refs/R47.jpg` | BMW X7 (black), front, close on grille and headlamp. Video frame |
| R48 | `refs/R48.jpg` | BMW X7 interior, brown leather. Video frame |
| R49 | `refs/R49.jpg` | BMW X7 (black), rear. Video frame |
| R50 | `refs/R50.jpg` | Mercedes-Maybach GLS 600 Night Series (black), front three-quarter, outdoors. Video frame |
| R51 | `refs/R51.jpg` | Mercedes-Maybach GLS 600 (black), side, with wheel. Video frame |
| R52 | `refs/R52.jpg` | Mercedes-Maybach GLS 600 interior, black. Video frame |
| R53 | `refs/R53.jpg` | Mercedes-Maybach GLS 600 (black), front, close on the grille. Video frame |
| R54 | `refs/R54.jpg` | Mercedes-AMG G 63 Manufaktur 2025 (black), front three-quarter, with the dealer plate. Video frame |
| R55 | `refs/R55.jpg` | Mercedes-AMG G 63 Manufaktur (black), rear corner with spare wheel cover and tail lamp. Video frame |
| R56 | `refs/R56.jpg` | Mercedes-AMG G 63 Manufaktur (black), side, with wheel and red caliper. Video frame |
| R57 | `refs/R57.jpg` | Mercedes-AMG G 63 Manufaktur (black), front, with the dealer plate. Video frame |
| R58 | `refs/R58.jpg` | Genesis GV80 2026 (black), front three-quarter, close on grille and lamps, under the sign. Video frame |
| R59 | `refs/R59.jpg` | Genesis GV80 (black), front three-quarter, whole car. Video frame |
| R60 | `refs/R60.jpg` | Genesis GV80 (black), side profile. Video frame |
| R61 | `refs/R61.jpg` | Genesis GV80 interior, cognac leather (seats still in delivery wrap). Video frame |
| R62 | `refs/R62.jpg` | The showroom stage with no car on it: sign wall, lit ceiling panel, round turntable. A clean view of the place |
| R63 | `refs/R63.jpg` | The site's opening still: a black G 63 on the turntable under the sign, lights coming on. Shows the grade the site already uses |

### Already uploaded to the workspace

The same files are in the `refs` folder under their codes, in case an ID is not found.

| Code | media_id | Shows |
|---|---|---|
| R01 | `dab7b141-043b-4608-abb6-a447a0a2ae47` | Official logo on black: yellow A mark and white AVENUE MOTORS wordmark |
| R02 | `273839ae-4126-4854-bef7-01333d6ee212` | Yellow A mark alone on black (clean render) |
| R03 | `6e4e9d78-6d12-452b-a1aa-ba5feb73ff13` | Showroom sign wall, straight on, with the black G 63 seen from the front on the grey turntable. Best view of the sign |
| R04 | `8810cc19-28b0-4550-b233-2310cbf38212` | Maybach S 680 from the front under the sign, turf turntable. Shows the dealer number plate |
| R05 | `0fa07ab0-5162-45a1-8366-e80d31d69a8d` | Wide landscape view of the showroom hall: Range Rover side-on, linear ceiling lights, sign in the distance |
| R06 | `34cd3026-d2e4-4e44-8791-b19f61b7bf83` | Building facade from outside with the Avenue sign; Range Rover parked in front |
| R07 | `b312eb37-3727-4265-8aff-515f547a23a5` | Range Rover P530 LWB, front three-quarter, in the hall. Dealer plate close-up |
| R08 | `7b6144e5-7bc1-414e-b68d-c642e9913735` | Mercedes-AMG G 63, front three-quarter |
| R09 | `a261c8d1-e6d8-4718-b28a-3c93f3c6d156` | Mercedes-AMG G 63, rear three-quarter |
| R10 | `09b03f63-0ed7-4e02-8dfe-71e7695286a0` | Mercedes-Maybach S 680, front three-quarter, with the sign |
| R11 | `d4962230-9810-4491-89bc-1f89f9a7d69f` | Mercedes-Maybach S 680, rear three-quarter |
| R12 | `63af1551-91a4-462f-9cc6-667e58fba64c` | Bentley Flying Spur Speed, front three-quarter, with the sign |
| R13 | `6edffd4c-1406-4b01-bc75-58c285a46455` | Bentley Flying Spur Speed, front |
| R14 | `2d6ae136-25f1-4ae6-9802-4f5d02aa2607` | Bentley Flying Spur Speed, rear three-quarter |
| R15 | `6ba6406e-5ef0-450e-b96e-00ad4f0a5a27` | BMW M4 CS Riviera Blue, front three-quarter |
| R16 | `4ebdab4f-2937-4f3a-a3b0-e40d1ce694a9` | BMW M4 CS Riviera Blue, front |
| R17 | `fa057195-cc84-49e9-bd1c-290ee5e52758` | BMW M4 CS Riviera Blue, rear three-quarter |
| R18 | `ccd5942f-7f77-4c64-865f-2b801d1f63ee` | Range Rover P530 LWB, rear |
| R19 | `98b8c9dd-da76-4146-aad0-8942105c35f0` | Genesis G90 Long, front three-quarter, on the turntable with the sign |
| R20 | `e1fda913-95d2-4814-9652-ca488d0bbb85` | Genesis G90 Long, rear three-quarter |
| R21 | `63edd991-daf2-4b1f-bd87-59bababab413` | Cadillac Escalade, front three-quarter (car small in frame) |
| R22 | `542b2804-5431-4dde-ab61-8ea52c394d22` | Cadillac Escalade, rear three-quarter |
| R23 | `607a8818-05d4-44f1-8178-935b034a64fe` | BMW M2 matte blue, front three-quarter, outdoors |
| R24 | `78f2f04a-bd3f-4797-bfb1-0bb54681fdba` | BMW M2 matte blue, rear three-quarter, outdoors |
| R25 | `10f70dd1-c5fb-4810-85c3-32c2c399d33c` | Genesis G90 Long, side profile on the turntable |
| R26 | `7066f937-0e7a-453c-9bd0-072edefc24d8` | Cadillac Escalade, front |
| R27 | `7711be5c-1bf0-4573-acf0-c54c1afe6cb4` | Genesis G90 interior, dashboard, cognac leather |
| R28 | `16ffa06d-0192-49eb-a7cd-28d647694812` | Bentley Flying Spur interior, orange leather |
| R29 | `596d2e08-6a80-46bc-98ce-4f0b56e65e60` | Mercedes-Maybach S 680 rear cabin, white leather |
| R30 | `2ad777f0-1961-4731-b9b3-fd813a8240e0` | Bentley Flying Spur Speed, front three-quarter, closer |
| R31 | `9d68a0a9-5824-41ad-b661-a9e94c21c8f5` | BMW M2 matte blue, front, outdoors |
| R32 | `07c2b058-fcdd-4bce-9253-425e3163da76` | BMW M2 matte blue, rear, outdoors |
| R33 | `1d82225f-3ca7-4910-a57e-55227846f0ee` | Cadillac Escalade, rear |
| R34 | `218267ce-28b3-47a9-861f-6ea9bd7a9080` | Range Rover interior, front seats and dashboard |
| R35 | `8d92cae6-3d0f-4ec3-9296-2c409401bef4` | Range Rover interior, rear seats |
| R36 | `d80e2e06-e833-4a7c-9db4-153d58320ce0` | Genesis G90 rear cabin |
| R37 | `0ff6d8f3-fc9e-420a-9bbc-e65b6d5fecf4` | Mercedes-Maybach S 680 detail: V12 badge on the front wing |
| R38 | `e11537f8-e8f2-4f65-8457-2a326ed57720` | BMW M4 CS detail: boot badge and tail light |
| R39 | `643f0b39-761d-452d-ab0c-e7f160b43db1` | Genesis G90 rear seat |
