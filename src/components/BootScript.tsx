"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// An inline script that has to run before the first paint. It belongs to the HTML the
// server sends, and only to that: when the page shell is rebuilt in the browser (on a
// language switch) the script has already run, and React rightly refuses to run one it
// creates itself, so nothing is rendered then.
export function BootScript({ code }: { code: string }) {
  const fromServer = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return fromServer ? <script dangerouslySetInnerHTML={{ __html: code }} /> : null;
}
