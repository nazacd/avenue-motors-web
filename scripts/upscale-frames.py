"""Doubles the size of a folder of film frames with Real-ESRGAN's small general model.

    python scripts/upscale-frames.py <weights.pth> <frames-in> <frames-out> [first] [step]

Needs torch, numpy and pillow. The model works at four times the size; the result is
brought back down to twice the source, which keeps its edges and loses its excesses.
Frames already written are skipped, so a stopped run picks up where it left off, and
`first`/`step` let several runs share one folder.
"""

import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.nn import functional as F


class Compact(nn.Module):
    """SRVGGNetCompact, as published with Real-ESRGAN (realesr-general-x4v3)."""

    def __init__(self, feat=64, convs=32, scale=4):
        super().__init__()
        self.scale = scale
        body = [nn.Conv2d(3, feat, 3, 1, 1), nn.PReLU(num_parameters=feat)]
        for _ in range(convs):
            body += [nn.Conv2d(feat, feat, 3, 1, 1), nn.PReLU(num_parameters=feat)]
        body.append(nn.Conv2d(feat, 3 * scale * scale, 3, 1, 1))
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(scale)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.scale, mode="nearest")


def main():
    weights, source, target = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    first = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    step = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    target.mkdir(parents=True, exist_ok=True)

    model = Compact()
    model.load_state_dict(torch.load(weights, map_location="cpu", weights_only=True)["params"])
    model.eval()

    frames = sorted(source.glob("*.png"))[first::step]
    for index, path in enumerate(frames):
        out = target / path.name
        if out.exists():
            continue
        picture = Image.open(path).convert("RGB")
        x = torch.from_numpy(np.asarray(picture)).permute(2, 0, 1).float().div(255).unsqueeze(0)
        with torch.inference_mode():
            y = model(x).clamp(0, 1)
        big = Image.fromarray((y[0].permute(1, 2, 0).numpy() * 255).round().astype(np.uint8))
        big.resize((picture.width * 2, picture.height * 2), Image.LANCZOS).save(out.with_suffix(".tmp.png"))
        out.with_suffix(".tmp.png").rename(out)
        print(f"{index + 1}/{len(frames)} {path.name}", flush=True)


if __name__ == "__main__":
    main()
