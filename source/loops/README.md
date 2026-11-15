# Living photos

Short loops made from the listing photos: the same picture, with the car's lights and the
room's light moving a little. `photo-<n>.mp4` belongs to source photo number `n`.
`loops.json` lists them with their Higgsfield jobs, and `npm run media -- loops` turns
them into the small files the site plays.

A loop is only used if the car and the framing stay exactly as in the photo. Six of the
fourteen that were generated were left out:

| Loop | Photo | Why it is not used |
|---|---|---|
| L01 | 1 | The G 63 gains a strip of light under its bumper that the car does not have |
| L05 | 21 | The Bentley is framed differently from its photo, so the two do not line up |
| L11 | 29 | The Maybach's white leather turns peach in the middle of the loop |
| L12 | 7 | The Range Rover's black seats and wheel turn brown |
| L13 | 27 | The framing differs from the photo and the window changes |
| L14 | 38 | White scribbles appear on the M4's paint and tail lamp |

In `loops.json`, `from` and `to` keep only part of a take, and `thereAndBack` plays that
part forward and then backward so that it ends where it began.
