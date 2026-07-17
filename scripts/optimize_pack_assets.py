from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAMES_DIR = ROOT / "public" / "frames"
CARD_BACK_SOURCE = ROOT / "public" / "verso-card.png"
CARD_BACK_OUTPUT = ROOT / "public" / "verso-card.webp"


def convert_webp(source: Path, output: Path, width: int, quality: int) -> None:
    with Image.open(source) as image:
        image.load()
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        if "A" in resized.getbands():
            resized = resized.convert("RGBA")
        else:
            resized = resized.convert("RGB")
        resized.save(
            output,
            format="WEBP",
            quality=quality,
            method=6,
            exact=True,
        )

    print(
        f"{source.name}: {source.stat().st_size / 1024:.1f} KB -> "
        f"{output.name}: {output.stat().st_size / 1024:.1f} KB"
    )


def main() -> None:
    # The frames render inside a 260x360 CSS box. A 640 px source remains
    # sharp on high-density mobile displays without shipping the 1182 px PNG.
    for frame_number in range(1, 10):
        source = FRAMES_DIR / f"{frame_number}.png"
        output = FRAMES_DIR / f"{frame_number}.webp"
        convert_webp(source, output, width=640, quality=86)

    # The card back renders at no more than 160 CSS px wide.
    convert_webp(CARD_BACK_SOURCE, CARD_BACK_OUTPUT, width=480, quality=88)


if __name__ == "__main__":
    main()
