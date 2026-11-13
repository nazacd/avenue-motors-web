"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fill } from "@/i18n/format";
import { ArrowIcon, CloseIcon, PlayIcon, SoundIcon } from "./icons";
import { lockScroll } from "./SiteEffects";

export type NoteItem = {
  slug: string;
  name: string;
  video: string;
  poster: string;
  // Where "view the car" leads. Left out on the car's own page.
  href?: string;
};

type Labels = { play: string; soundOn: string; soundOff: string; close: string; view: string };

type VideoNotesProps = {
  items: NoteItem[];
  labels: Labels;
  showNames?: boolean;
};

// The showroom's round Telegram video notes. Each disc opens the clip, with sound, in a
// player over the page.
export function VideoNotes({ items, labels, showNames = true }: VideoNotesProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<NoteItem | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (current && !element.open) element.showModal();
    lockScroll(Boolean(current));
    return () => lockScroll(false);
  }, [current]);

  return (
    <>
      {items.map((item) => (
        <button
          key={item.slug}
          type="button"
          className="note"
          aria-label={fill(labels.play, { name: item.name })}
          onClick={() => setCurrent(item)}
        >
          <span className="note__disc">
            <span className="note__img">
              <img src={item.poster} alt="" width={400} height={400} loading="lazy" decoding="async" />
            </span>
            <span className="note__play">
              <PlayIcon />
            </span>
          </span>
          {showNames && <span className="note__name">{item.name}</span>}
        </button>
      ))}

      <dialog
        ref={dialog}
        className="player"
        onClose={() => setCurrent(null)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        {current && (
          <div className="player__body">
            <RoundVideo video={current.video} poster={current.poster} labels={labels} withSound />
            <p className="player__name">{current.name}</p>
            <div className="player__actions">
              {current.href && (
                <Link className="btn btn--primary" href={current.href}>
                  {labels.view}
                  <ArrowIcon />
                </Link>
              )}
              <button type="button" className="btn btn--ghost" onClick={() => dialog.current?.close()}>
                <CloseIcon />
                {labels.close}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

type RoundVideoProps = {
  video: string;
  poster: string;
  labels: Pick<Labels, "soundOn" | "soundOff">;
  // Start with sound. Only possible right after the visitor has pressed something.
  withSound?: boolean;
};

export function RoundVideo({ video, poster, labels, withSound = false }: RoundVideoProps) {
  const element = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(!withSound);

  useEffect(() => {
    const player = element.current;
    if (!player) return;
    player.muted = !withSound;
    // A browser may refuse sound it thinks the visitor did not ask for; fall back to silent.
    player.play().catch(() => {
      player.muted = true;
      setMuted(true);
      player.play().catch(() => {});
    });
  }, [video, withSound]);

  const toggle = () => {
    const player = element.current;
    if (!player) return;
    player.muted = !player.muted;
    setMuted(player.muted);
  };

  return (
    <div className="round">
      <div className="round-video">
        <video ref={element} src={video} poster={poster} loop playsInline preload="metadata" />
      </div>
      <button type="button" className="round__sound" aria-label={muted ? labels.soundOn : labels.soundOff} onClick={toggle}>
        <SoundIcon muted={muted} />
      </button>
    </div>
  );
}
