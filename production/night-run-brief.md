# Avenue Motors — "Night Run" production brief

This file is a working brief for **Claude with the Higgsfield connector** (Claude chat or Cowork). It produces the film and motion assets for the Avenue Motors website using the trial's unlimited generations.

## For the owner: how to run it

1. Open a new chat in Claude (claude.ai) or Cowork with the **Higgsfield** connector switched on.
2. Attach this file and send: `Run Stage 0 and Stage 1 from this brief.`
3. Look at the results. Reply `approved`, or say what to fix, for example `K4: the sign is misspelled`.
4. Continue with `Run Stage 2`, then 3, and so on. The stages are in order of importance, so if the trial ends early the most valuable assets already exist.
5. Each stage ends with a manifest table. Paste it into the Claude Code session that is building the site. The files are downloaded and edited there.

---

## For Claude: what we are making

Avenue Motors is a premium car showroom in Uzbekistan. Its new website opens with a short film, "Night Run": the dealer's real cars leave the showroom at night, run fast through the city, a tunnel and a mountain road, and come home. The film plays full-screen and muted behind the page header, in a landscape cut for desktop and a vertical cut for phones. A second set of short loops brings each car's listing photo to life on hover.

The work is done **stills first**. Each shot begins as a still key frame built from the dealer's own photos and logo. The owner approves the stills, and only then is each one animated. Stills are fast to judge and fix; video is slow. Do not skip ahead to video before the stills are approved.

Editing, colour grading, sound mixing and compression happen elsewhere. Your job ends at approved raw clips and the manifest.

## Rules

- **Unlimited allowance only.** Pass `use_unlim: true` on every generation. Never spend credits. The account has none, and the owner has not agreed to buy any. If a call asks an `unlim_choice` question, answer it with `use_unlim: true`.
- **If the allowance refuses a configuration**, lower the resolution first (4k to 1080p to 720p), then the duration, and tell the owner what you changed. If unlimited generations are not available at all in this surface, stop and say so.
- With the allowance each request makes one result. For two takes, submit two requests (the batch tools take up to 12).
- Pass references by ID from the table below (`medias: [{ role, value }]`). They are already uploaded to this workspace. If an ID is not found, ask the owner to attach the file named in the last column.
- No people, no on-screen text, no watermarks, and no brands other than the cars themselves and Avenue Motors.
- Do not invent registration numbers. Number plates are either the black Avenue Motors dealer plate or too small to read.

## References (already uploaded)

| Code | media_id | Shows | File in the repo |
|---|---|---|---|
| R01 | `dab7b141-043b-4608-abb6-a447a0a2ae47` | Official logo on black: yellow A mark and white AVENUE MOTORS wordmark | `brand/logo-lockup.png` |
| R02 | `273839ae-4126-4854-bef7-01333d6ee212` | Yellow A mark alone on black (clean render) | `brand/logo-mark.png` |
| R03 | `6e4e9d78-6d12-452b-a1aa-ba5feb73ff13` | Showroom sign wall, straight on, with the black G 63 seen from the front on the grey turntable. Best view of the sign | `source/photos/photo_3@01-10-2026_18-31-24.jpg` |
| R04 | `8810cc19-28b0-4550-b233-2310cbf38212` | Maybach S 680 from the front under the sign, turf turntable. Shows the dealer number plate | `source/photos/photo_26@18-10-2026_19-46-13.jpg` |
| R05 | `0fa07ab0-5162-45a1-8366-e80d31d69a8d` | Wide landscape view of the showroom hall: Range Rover side-on, linear ceiling lights, sign in the distance | `source/photos/photo_5@02-10-2026_21-35-12.jpg` |
| R06 | `34cd3026-d2e4-4e44-8791-b19f61b7bf83` | Building facade from outside with the Avenue sign; Range Rover parked in front | `source/photos/photo_30@30-10-2026_15-37-51.jpg` |
| R07 | `b312eb37-3727-4265-8aff-515f547a23a5` | Range Rover P530 LWB, front three-quarter, in the hall. Dealer plate close-up | `source/photos/photo_4@02-10-2026_21-35-12.jpg` |
| R08 | `7b6144e5-7bc1-414e-b68d-c642e9913735` | Mercedes-AMG G 63, front three-quarter | `source/photos/photo_1@01-10-2026_18-31-24.jpg` |
| R09 | `a261c8d1-e6d8-4718-b28a-3c93f3c6d156` | Mercedes-AMG G 63, rear three-quarter | `source/photos/photo_2@01-10-2026_18-31-24.jpg` |
| R10 | `09b03f63-0ed7-4e02-8dfe-71e7695286a0` | Mercedes-Maybach S 680, front three-quarter, with the sign | `source/photos/photo_25@18-10-2026_19-46-13.jpg` |
| R11 | `d4962230-9810-4491-89bc-1f89f9a7d69f` | Mercedes-Maybach S 680, rear three-quarter | `source/photos/photo_28@18-10-2026_19-46-13.jpg` |
| R12 | `63af1551-91a4-462f-9cc6-667e58fba64c` | Bentley Flying Spur Speed, front three-quarter, with the sign | `source/photos/photo_21@10-10-2026_19-24-24.jpg` |
| R13 | `6edffd4c-1406-4b01-bc75-58c285a46455` | Bentley Flying Spur Speed, front | `source/photos/photo_22@10-10-2026_19-24-24.jpg` |
| R14 | `2d6ae136-25f1-4ae6-9802-4f5d02aa2607` | Bentley Flying Spur Speed, rear three-quarter | `source/photos/photo_23@10-10-2026_19-24-24.jpg` |
| R15 | `6ba6406e-5ef0-450e-b96e-00ad4f0a5a27` | BMW M4 CS Riviera Blue, front three-quarter | `source/photos/photo_35@09-11-2026_22-13-46.jpg` |
| R16 | `4ebdab4f-2937-4f3a-a3b0-e40d1ce694a9` | BMW M4 CS Riviera Blue, front | `source/photos/photo_36@09-11-2026_22-13-46.jpg` |
| R17 | `fa057195-cc84-49e9-bd1c-290ee5e52758` | BMW M4 CS Riviera Blue, rear three-quarter | `source/photos/photo_37@09-11-2026_22-13-46.jpg` |
| R18 | `ccd5942f-7f77-4c64-865f-2b801d1f63ee` | Range Rover P530 LWB, rear | `source/photos/photo_6@02-10-2026_21-35-12.jpg` |
| R19 | `98b8c9dd-da76-4146-aad0-8942105c35f0` | Genesis G90 Long, front three-quarter, on the turntable with the sign | `source/photos/photo_10@02-10-2026_21-50-11.jpg` |
| R20 | `e1fda913-95d2-4814-9652-ca488d0bbb85` | Genesis G90 Long, rear three-quarter | `source/photos/photo_12@02-10-2026_21-50-11.jpg` |
| R21 | `63edd991-daf2-4b1f-bd87-59bababab413` | Cadillac Escalade, front three-quarter (car small in frame) | `source/photos/photo_17@09-10-2026_14-50-51.jpg` |
| R22 | `542b2804-5431-4dde-ab61-8ea52c394d22` | Cadillac Escalade, rear three-quarter | `source/photos/photo_18@09-10-2026_14-50-51.jpg` |
| R23 | `607a8818-05d4-44f1-8178-935b034a64fe` | BMW M2 matte blue, front three-quarter, outdoors | `source/photos/photo_31@01-11-2026_15-25-04.jpg` |
| R24 | `78f2f04a-bd3f-4797-bfb1-0bb54681fdba` | BMW M2 matte blue, rear three-quarter, outdoors | `source/photos/photo_34@01-11-2026_15-25-04.jpg` |
| R25 | `10f70dd1-c5fb-4810-85c3-32c2c399d33c` | Genesis G90 Long, side profile on the turntable | `source/photos/photo_11@02-10-2026_21-50-11.jpg` |
| R26 | `7066f937-0e7a-453c-9bd0-072edefc24d8` | Cadillac Escalade, front | `source/photos/photo_16@09-10-2026_14-50-51.jpg` |
| R27 | `7711be5c-1bf0-4573-acf0-c54c1afe6cb4` | Genesis G90 interior, dashboard, cognac leather | `source/photos/photo_14@02-10-2026_21-50-11.jpg` |
| R28 | `16ffa06d-0192-49eb-a7cd-28d647694812` | Bentley Flying Spur interior, orange leather | `source/photos/photo_24@10-10-2026_19-24-24.jpg` |
| R29 | `596d2e08-6a80-46bc-98ce-4f0b56e65e60` | Mercedes-Maybach S 680 rear cabin, white leather | `source/photos/photo_29@18-10-2026_19-46-13.jpg` |
| R30 | `2ad777f0-1961-4731-b9b3-fd813a8240e0` | Bentley Flying Spur Speed, front three-quarter, closer | `source/photos/photo_20@10-10-2026_19-24-24.jpg` |
| R31 | `9d68a0a9-5824-41ad-b661-a9e94c21c8f5` | BMW M2 matte blue, front, outdoors | `source/photos/photo_32@01-11-2026_15-25-04.jpg` |
| R32 | `07c2b058-fcdd-4bce-9253-425e3163da76` | BMW M2 matte blue, rear, outdoors | `source/photos/photo_33@01-11-2026_15-25-04.jpg` |
| R33 | `1d82225f-3ca7-4910-a57e-55227846f0ee` | Cadillac Escalade, rear | `source/photos/photo_19@09-10-2026_14-50-51.jpg` |
| R34 | `218267ce-28b3-47a9-861f-6ea9bd7a9080` | Range Rover interior, front seats and dashboard | `source/photos/photo_7@02-10-2026_21-35-12.jpg` |
| R35 | `8d92cae6-3d0f-4ec3-9296-2c409401bef4` | Range Rover interior, rear seats | `source/photos/photo_8@02-10-2026_21-35-12.jpg` |
| R36 | `d80e2e06-e833-4a7c-9db4-153d58320ce0` | Genesis G90 rear cabin | `source/photos/photo_13@02-10-2026_21-50-11.jpg` |
| R37 | `0ff6d8f3-fc9e-420a-9bbc-e65b6d5fecf4` | Mercedes-Maybach S 680 detail: V12 badge on the front wing | `source/photos/photo_27@18-10-2026_19-46-13.jpg` |
| R38 | `e11537f8-e8f2-4f65-8457-2a326ed57720` | BMW M4 CS detail: boot badge and tail light | `source/photos/photo_38@09-11-2026_22-13-46.jpg` |
| R39 | `643f0b39-761d-452d-ab0c-e7f160b43db1` | Genesis G90 rear seat | `source/photos/photo_15@02-10-2026_21-50-11.jpg` |

Codes that no stage names are spare angles. Use them when a car comes out wrong and needs another view.

## The look

Append this block to **every still prompt**:

```
LOOK: photorealistic cinematic automotive photography, as if shot on a large-format cinema camera with an anamorphic lens. Deep true blacks and graphite greys, restrained highlights, a little fine film grain. The only strong colour is warm signal yellow from practical lights; the blue car is the single exception. Glossy paint with clean, physically correct reflections. Every car matches its reference photos exactly: same model, body shape, grille, lights, wheels and colour, not redesigned. No people, no text overlays, no watermarks, no other logos.
```

Whenever the sign appears, it must match R01 and R03: a yellow three-dimensional letter A with a long diagonal swoosh pointing up to the right, and to its right the white word AVENUE with the smaller word MOTORS beneath it. The spelling is exactly `AVENUE MOTORS`.

## Settings

| | Stills | Video |
|---|---|---|
| Model | `nano_banana_pro` | `seedance_2_5`, mode `omni_reference` |
| Fallback | `gpt_image_2_6` with quality `high` (better when the sign text keeps failing) | `seedance_2_0` |
| Size | `2k`; use `4k` for K1 and K1v, which double as poster images | `1080p`, bitrate `high` if the allowance covers it |
| References | role `image_references` | key frame as `start_image`; `end_image` where a stage says so |
| Audio | not applicable | `generate_audio: true` on film shots, `false` on loops |

When a later step needs an earlier result, pass that result's **job ID** as the reference value.

---

## Stage 0 — Preflight

1. List models with the unlimited filter and read which configurations the allowance covers. Confirm it is available here. Adjust the settings above to the best covered option and tell the owner in one line.
2. Create a Higgsfield project named `Avenue Motors - Night Run` and save every generation in this brief to it.

## Stage 1 — Landscape key frames (16:9)

Generate K1 through K7 in one batch. Then make K1D and K0 from the finished K1. Show all nine to the owner and wait for approval.

**K1 "Ignition"** — references R03, R01, R08, R04

```
Wide cinematic interior of a luxury car showroom at night, 16:9. In the centre a black Mercedes-AMG G 63, the exact car in the reference photos, stands on a low round dark-grey turntable, facing the camera head-on, its ring-shaped LED running lights switched on. Directly behind and above it, on a matte graphite wall, hangs the dealership sign exactly as in the references: a large yellow three-dimensional letter A with a long diagonal swoosh pointing up to the right, and to its right the white backlit word AVENUE with the smaller word MOTORS beneath it. The whole sign is visible, sharp and correctly spelled. A soft luminous ceiling panel glows above. The floor is dark polished stone and mirrors the sign and the headlights. Camera at headlight height, symmetrical composition, 40mm anamorphic lens. The car fills about one third of the frame width, with dark empty space to its left and right and dark reflective floor across the bottom fifth of the frame. Low-key lighting: the sign, the ceiling glow and the car's lights are the only light sources. The front number plate is the black dealer plate from the reference, with the small yellow A mark and the words AVENUE MOTORS.
```

**K2 "Line-up"** — references R05, R10, R12, R07, R01

```
Low-angle view along a diagonal row of three black cars parked side by side with their noses toward the camera, in a large dark showroom hall at night, 16:9. Nearest the camera a black Mercedes-Maybach S 680, then a black Bentley Flying Spur, then a black Range Rover, the exact cars in the reference photos, all with headlights on. The row recedes from the right foreground to the left background. Rows of long linear ceiling lights, as in the hall reference, reflect as bright streaks along the bonnets and roofs. On the far wall, small and softly out of focus, glows the yellow A and white AVENUE MOTORS sign. Camera half a metre above the polished floor, 35mm anamorphic lens.
```

**K3 "Roll-out"** — references R06, R08, R15, R01

```
Exterior at night, 16:9. The glass-fronted car showroom from the reference photo, lit from inside, seen from the street. On the fascia above the glass, the illuminated sign: the yellow A with its diagonal swoosh and the words AVENUE MOTORS. No other brand names or logos anywhere on the building. A black Mercedes-AMG G 63 is pulling out of the forecourt toward the camera, front three-quarter view, headlights on. Behind it a BMW M4 CS in Riviera Blue waits with its yellow running lights on. Wet asphalt after rain mirrors the sign and the headlights. Camera low at the kerb, 28mm anamorphic lens. Deep blue-black night sky, no people, no other cars.
```

**K4 "The Avenue"** — references R08, R03, R10, R04, R12, R13

```
Night, 16:9. A perfectly straight, empty six-lane city avenue just after rain, lined on both sides with tall street lamps that glow warm yellow and recede to a vanishing point in the centre of the frame. The wet asphalt mirrors every lamp. Three black cars drive toward the camera at speed in an arrowhead formation, all headlights on: a Mercedes-AMG G 63 leading in the centre, a Mercedes-Maybach S 680 behind it to the left, a Bentley Flying Spur behind it to the right, the exact cars in the reference photos. Camera very low, just above the road surface, with long-lens compression like a 135mm lens: the cars are sharp, the lamps behind them are soft glowing discs, and fine spray lifts from the tyres. Motion blur on the road surface. The lead car sits in the lower centre and the lamps fill the upper half.
```

**K5 "Tunnel"** — references R15, R17, R16, R08, R09

```
Inside a long modern road tunnel at night, lit by one continuous line of warm yellow strip lights along the ceiling. Side-on rolling shot, 16:9. A BMW M4 CS in Riviera Blue, exactly the car in the reference photos, with bright light-blue paint, an exposed-carbon bonnet, yellow daytime running lights, a red outline on the kidney grille and bronze wheels, drives from left to right in the near lane. One lane beyond it and half a car length behind, a black Mercedes-AMG G 63 keeps pace. Both cars are tack sharp. The tunnel walls and the road streak into horizontal motion blur and the wheels blur with rotation. The strip lights reflect as long yellow lines sliding along the blue and black paint. Camera at door-handle height, 50mm anamorphic lens.
```

**K6 "The Pass"** — references R15, R17, R09, R11, R14

```
Aerial drone photograph at first light, 16:9. A smooth two-lane mountain road winds in wide S-curves along arid golden-brown mountainsides with sparse vegetation. No other traffic and no buildings. Four cars travel in a well-spaced convoy away from the camera with their lights on: a BMW M4 CS in Riviera Blue in the lead, then a black Mercedes-AMG G 63, a black Mercedes-Maybach S 680 and a black Bentley Flying Spur, the cars in the reference photos seen from above and behind. The sun is just breaking over the ridge: warm rim light on the peaks, cool blue shadow in the valley, long shadows across the road. High three-quarter angle from about sixty metres up. The convoy runs diagonally from lower left to upper right and each car is small in the frame.
```

**K7 "Home"** — references R06, R01, R08, R15, R10, R12

```
Exterior at night, 16:9, symmetrical wide shot. The glass-fronted showroom from the reference, lit from inside, with its illuminated sign, the yellow A and the words AVENUE MOTORS, centred on the fascia. No other brand names or logos on the building. Parked in a shallow arc on the wet forecourt with their noses toward the camera and their lights on: a black Mercedes-Maybach S 680, a black Mercedes-AMG G 63, a BMW M4 CS in Riviera Blue and a black Bentley Flying Spur, the exact cars in the references. The wet ground mirrors the sign and the headlights. Camera low and central, 24mm anamorphic lens. Deep blue-black sky, no people.
```

**K1D "Ignition, lights off"** — reference: the K1 result. This is the start frame of the first shot.

```
Edit the reference image. Keep the composition, the car, the wall, the turntable and the camera exactly the same. Switch everything off: the sign is unlit, so the A and the letters are dark shapes barely visible on the wall; the ceiling panel is off; the car's lights are off. The room is almost black. Only a faint cool glow from the right picks out the edges of the car's roof, bonnet and wheel arches as a silhouette. Do not move or change anything else.
```

**K0 "Empty stage"** — reference: the K1 result. The website uses it behind the 3D garage.

```
Edit the reference image. Remove the car completely. Keep the wall, the sign, the ceiling glow, the round turntable and the polished floor exactly the same, with the sign reflected in the empty floor. Do not change the lighting or the camera.
```

**What the owner checks on each still**

- The sign reads AVENUE MOTORS and the A looks like the logo.
- Each car looks like the real one: grille, lights, wheels, colour.
- Nothing is warped or doubled (wheels, mirrors, extra cars).
- The dark empty areas described in the prompt are there. Text sits on them later.

## Stage 2 — Animate the four main shots (16:9)

Two takes each of V1, V4, V5 and V6, from the approved key frames. Show them and wait for the owner to pick one take per shot.

**V1** — `start_image` K1D, `end_image` K1, 8 seconds

```
Single continuous shot, no cuts. Locked-off camera with a barely perceptible slow push-in. The showroom is dark and still. The sign on the wall switches on: the yellow A flickers once and then glows steadily, and the white letters light up one after another from left to right. A second later the ceiling panel fades up and the car's ring-shaped headlights fade on, and their light spreads across the polished floor. The car does not move. Nothing else changes. Sound: quiet room tone, the electrical click and hum of the sign, then a deep engine start.
```

**V4** — `start_image` K4, 6 seconds

```
Single continuous shot, no cuts. The camera tracks backward at the same speed as the cars, staying very low above the wet road. The three cars hold their arrowhead formation and drive fast toward the camera, slowly gaining on it. Street lamps rush past and their reflections streak across bonnets and windscreens. Spray trails from the tyres and the wheels spin. The cars keep their exact shape, grilles and lights throughout. Sound: engines at speed, the hiss of a wet road.
```

**V5** — `start_image` K5, plus R15 and R17 as `image_references`, 6 seconds

```
Single continuous shot, no cuts. Side-on tracking shot moving at the cars' speed through the tunnel. The blue M4 CS accelerates and pulls ahead of the black G 63, overtaking it completely by the end of the shot. Tunnel lights strobe rhythmically over the paintwork, the walls streak past, the wheels spin, and the camera vibrates slightly. Both cars keep their exact shape and details. Sound: a high-revving straight-six echoing in the tunnel with a deeper V8 underneath.
```

**V6** — `start_image` K6, 6 seconds

```
Single continuous shot, no cuts. The drone follows the convoy from above and behind, descending slowly and banking with the road as the four cars sweep through the S-curve one after another, keeping even gaps. Sunlight creeps down the mountainside. The cars stay on the road and keep their order and colours. Sound: wind and distant engines.
```

**What the owner checks on each clip**

- The cars keep their shape. No melting, no changing grille or wheels.
- Wheels turn the right way and the cars do not slide sideways.
- Where the sign is visible it stays readable.
- No sudden cut, flash or invented text.

## Stage 3 — Vertical key frames (9:16)

For every approved landscape key frame make a vertical version. Use the approved landscape result as the first reference, followed by the same car references as before, with this prompt and the note for that shot. Then make K1Dv from K1v exactly as K1D was made from K1.

```
Recompose the first reference image as a vertical 9:16 frame. Same cars, same location, same lighting, same colours and mood. Do not redesign anything. NOTE
```

| Frame | NOTE |
|---|---|
| K1v | The sign sits in the upper third and the car below it in the middle, facing the camera. The polished floor with its reflections fills the bottom quarter. Leave the top tenth of the frame as plain dark wall. |
| K2v | Low angle along the row. The nearest car's headlight and grille fill the lower half, the other cars recede upward, and ceiling light streaks run above. |
| K3v | The lit facade and sign are in the upper third. The G 63 is large in the lower half, front three-quarter, turning out toward the camera, with the blue M4 CS smaller behind it. |
| K4v | The lamps converge in the upper third. The lead G 63 is large in the lower centre and the other two cars are staggered behind and above it. Wet-road reflections fill the bottom quarter. |
| K5v | Change the camera to a front three-quarter tracking view from ahead of the cars. The blue M4 CS is large in the lower half, the black G 63 is behind and above it, and the line of ceiling lights converges at the top. |
| K6v | A steeper, almost top-down view. The road snakes vertically through the frame from bottom to top with the four cars spaced along it and the blue car highest. |
| K7v | The facade and sign fill the upper half. The four cars are grouped tightly in the lower half with their lights on. |

## Stage 4 — Animate the four main shots (9:16)

Two takes each of V1v, V4v, V5v and V6v from the vertical key frames, with the Stage 2 prompts and durations. V1v uses K1Dv as the start and K1v as the end. V5v needs this prompt instead, because its camera changed:

```
Single continuous shot, no cuts. The camera tracks backward ahead of the two cars through the tunnel, at their speed. The blue M4 CS accelerates, swings out and surges past the camera on one side while the black G 63 holds its lane behind. Tunnel lights strobe over the paintwork and the walls streak past. Both cars keep their exact shape and details. Sound: a high-revving straight-six echoing in the tunnel with a deeper V8 underneath.
```

## Stage 5 — The three supporting shots (both formats)

Two takes each, 6 seconds, first 16:9 and then 9:16.

**V2** — `start_image` K2

```
Single continuous shot, no cuts. The camera glides slowly sideways, low above the polished floor, along the row of parked cars from the nearest to the farthest. As it passes, each car's headlights flare gently into the lens. Ceiling-light reflections slide along the bonnets. The cars do not move. The sign in the background stays steady and legible. Sound: soft room tone and a low cinematic pulse.
```

**V3** — `start_image` K3, plus R09 as `image_references`

```
Single continuous shot, no cuts. The black G 63 pulls out of the forecourt, rolls toward the camera and turns onto the road, passing close on the left of the frame. The blue M4 CS follows it out. The camera stays low at the kerb and pans slightly to follow. The wheels rotate correctly and the headlight beams sweep across the wet asphalt. The building and its sign stay still and legible. Sound: a deep V8 burble and tyres on a wet road.
```

**V7** — `start_image` K7

```
Single continuous shot, no cuts. The camera rises slowly and pushes toward the glowing sign above the showroom. The cars stay parked. One after another their headlights fade off, until only the sign and the interior lights remain. The sign stays sharp and correctly spelled. Sound: engines switching off, then quiet night ambience.
```

## Stage 6 — Living photos for the catalogue

Each real listing photo becomes a short seamless loop for the car's card. These must stay truthful: the car and the place in the photo do not change.

Use the same photo as both `start_image` and `end_image`. Duration 5 seconds, `720p`, aspect ratio `auto` (or the nearest portrait ratio to the photo), no audio. One take each; redo only the ones that fail.

| Loop | Photo | Car |
|---|---|---|
| L01 | R08 | Mercedes-AMG G 63 |
| L02 | R07 | Range Rover P530 LWB |
| L03 | R19 | Genesis G90 Long |
| L04 | R26 | Cadillac Escalade |
| L05 | R12 | Bentley Flying Spur Speed |
| L06 | R10 | Mercedes-Maybach S 680 |
| L07 | R23 | BMW M2 |
| L08 | R15 | BMW M4 CS |

```
Locked-off camera, exactly the scene in the start image. The car's lights brighten gently and then settle back, and one slow highlight glides across the bonnet and roof as if a light passed overhead. Reflections shimmer very slightly. Nothing else changes: the car, its wheels and badges, the sign and the background stay exactly as in the image. No camera movement, no people, no new objects. The last frame is identical to the first so the clip loops.
```

If time allows, make the same kind of loop for the detail and interior photos, with this prompt:

```
Locked-off camera, exactly the scene in the start image. The ambient lighting breathes very slowly, brightening and dimming once, and a soft highlight travels across the leather and trim. Nothing else changes and nothing moves. The last frame is identical to the first so the clip loops.
```

Photos for these: R27, R28, R29, R34, R37, R38.

## Stage 7 — Section stills and the reveal

**X1 "Under cover"** — reference: the K1 result, plus R02

```
Edit the reference image. Keep the room, the sign, the turntable and the camera exactly the same. The car is now hidden under a fitted black satin car cover that follows its boxy shape, with the small yellow A mark from the second reference printed on the bonnet area. Soft light from the sign rakes across the folds of the satin.
```

**XV1 "Reveal"** — `start_image` X1, `end_image` K1, 6 seconds, 16:9, no audio. The website plays this as the visitor scrolls.

```
Single continuous shot, locked-off camera. The black satin cover slides smoothly backward off the car, as if pulled from behind, and reveals the black G 63. As the cover clears the bonnet the ring-shaped headlights fade on. The sign and the room do not change.
```

**X2 "On order"** — references R07, R18. Backdrop for the import-to-order section.

```
Night on an airport apron, 16:9. A black Range Rover, the car in the reference photos, drives slowly down the rear cargo ramp of a large freight aircraft with its headlights on. Warm yellow floodlights, wet concrete reflecting them, a blue-black sky and a thin ground mist. No airline names, no logos, no people. Camera low, 35mm anamorphic lens. The car is in the right half of the frame and the left half is dark empty space.
```

**X3 "Trade-in"** — no references. Backdrop for the trade-in section.

```
Top-down macro photograph, 16:9. Two car key fobs without any brand logos lie side by side on polished black stone, crossed by one narrow diagonal bar of warm yellow light. Shallow depth of field and deep blacks. The keys are in the right half of the frame and the left half is empty dark stone.
```

Make X2 and X3 in 9:16 as well, with the empty space at the top instead of the left.

---

## Retakes

- **Stills:** up to three attempts per frame. Change one thing per attempt, and say what you changed. If the sign is wrong twice, switch that frame to `gpt_image_2_6`.
- **Video:** if both takes fail a check, simplify the motion in the prompt (slower, less camera movement) and try twice more. After four takes, move on and mark the shot `needs review` in the manifest.
- Do not hold a whole stage for one stubborn shot. The trial is short; breadth matters more than a perfect single clip.

## Manifest

End every stage with a table like this in a code block, so the owner can paste it to the site build. Include rejected takes too, marked as such.

```
STAGE 2
code  | job_id                               | model        | status   | note
V1-a  | 00000000-0000-0000-0000-000000000000 | seedance_2_5 | approved |
V1-b  | 00000000-0000-0000-0000-000000000000 | seedance_2_5 | rejected | sign flickers
```
