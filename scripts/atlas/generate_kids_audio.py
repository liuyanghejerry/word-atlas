import argparse
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
ATLAS = ROOT / "public" / "atlas"
ZH_VOICE = "zh-CN-XiaoxiaoNeural"
EN_VOICES = {"en-us": "en-US-JennyNeural"}


async def save_audio(semaphore, path, text, voice, force):
    if path.exists() and path.stat().st_size > 1000 and not force:
        return
    async with semaphore:
        for attempt in range(3):
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                rate = "-12%" if voice.startswith("zh-") else "-8%"
                await edge_tts.Communicate(text, voice, rate=rate).save(str(path))
                if path.stat().st_size <= 1000:
                    raise RuntimeError(f"empty audio: {path}")
                return
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(1 + attempt)


async def generate(force):
    data = json.loads((ATLAS / "kids.json").read_text(encoding="utf-8"))
    jobs = [(ATLAS.parent / "sfx" / "voice-welcome-zh.mp3", "欢迎来到芽芽词光", ZH_VOICE)]
    for entry in data["entries"]:
        jobs.append((ATLAS / "audio" / "zh" / f"{entry['id']}.mp3", entry["hanzi"], ZH_VOICE))
        jobs.append((ATLAS / "audio" / "zh-ex" / f"{entry['id']}.mp3", entry["zhEx"], ZH_VOICE))
        for index, word in enumerate(entry["words"]):
            jobs.append((ATLAS / "audio" / "zh-word" / f"{entry['id']}-{index}.mp3", word, ZH_VOICE))
        for kind, voice in EN_VOICES.items():
            jobs.append((ATLAS / "audio" / kind / f"{entry['id']}.mp3", entry["enEx"], voice))
    semaphore = asyncio.Semaphore(4)
    total = len(jobs)
    completed = 0

    async def run(path, text, voice):
        nonlocal completed
        await save_audio(semaphore, path, text, voice, force)
        completed += 1
        if completed % 20 == 0 or completed == total:
            print(f"Kids audio: {completed}/{total}", flush=True)

    async with asyncio.TaskGroup() as group:
        for path, text, voice in jobs:
            group.create_task(run(path, text, voice))
    print(f"Generated {total} audio files")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    asyncio.run(generate(args.force))
