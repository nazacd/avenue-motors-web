"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type SelectOption<T extends string> = { value: T; label: string };

type SelectProps<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** The id of the visible label this picker answers to. */
  labelledBy: string;
  className?: string;
  /** Keeps the button as wide as its longest choice, so it does not jump on change. */
  steady?: boolean;
};

const TYPING_PAUSE = 700;

// A browser's own <select> opens a list the page cannot style, so this draws its own.
// Focus stays on the button throughout; the list is pointed at with aria-activedescendant.
export function Select<T extends string>({ value, options, onChange, labelledBy, className, steady }: SelectProps<T>) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);

  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const last = options.length - 1;

  function show(index = selected) {
    const box = root.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      const wanted = Math.min(options.length * 46 + 16, 336);
      setUp(below < wanted && box.top > below);
    }
    setActive(index);
    setOpen(true);
  }

  function pick(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setOpen(false);
  }

  // Typing a name jumps to it, as it does in a browser's own list.
  function search(key: string) {
    const now = Date.now();
    const text = (now - typed.current.at > TYPING_PAUSE ? "" : typed.current.text) + key.toLowerCase();
    typed.current = { text, at: now };
    const from = open ? active : selected;
    const order = options.map((_, index) => (from + index + (text.length === 1 ? 1 : 0)) % options.length);
    const found = order.find((index) => options[index].label.toLowerCase().startsWith(text));
    if (found === undefined) return;
    if (open) setActive(found);
    else pick(found);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const { key } = event;
    const typing = Date.now() - typed.current.at <= TYPING_PAUSE;

    if (key.length === 1 && (key !== " " || typing)) {
      event.preventDefault();
      search(key);
      return;
    }

    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        show();
      } else if (key === "Home" || key === "End") {
        event.preventDefault();
        show(key === "Home" ? 0 : last);
      }
      return;
    }

    if (key === "Tab") {
      setOpen(false);
      return;
    }

    event.preventDefault();
    if (key === "ArrowDown") setActive(Math.min(active + 1, last));
    else if (key === "ArrowUp") setActive(Math.max(active - 1, 0));
    else if (key === "Home" || key === "PageUp") setActive(0);
    else if (key === "End" || key === "PageDown") setActive(last);
    else if (key === "Enter" || key === " ") pick(active);
    else if (key === "Escape") setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // Keeps the pointed-at choice in sight without moving the page itself.
  useEffect(() => {
    const box = list.current;
    const item = box?.children[active] as HTMLElement | undefined;
    if (!open || !box || !item) return;
    if (item.offsetTop < box.scrollTop) box.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = item.offsetTop + item.offsetHeight - box.clientHeight;
    }
  }, [open, active]);

  return (
    <div
      ref={root}
      className={className ? `select ${className}` : "select"}
      data-open={open || undefined}
      data-up={up || undefined}
    >
      <button
        type="button"
        role="combobox"
        className="select__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${labelledBy} ${id}-value`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (event.relatedTarget && !root.current?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <span className="select__value" id={`${id}-value`}>
          {steady ? (
            options.map((option, index) => (
              <span key={option.value} aria-hidden={index !== selected} data-current={index === selected || undefined}>
                {option.label}
              </span>
            ))
          ) : (
            <span data-current>{options[selected]?.label}</span>
          )}
        </span>
        <svg className="select__chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <ul
        ref={list}
        role="listbox"
        id={`${id}-list`}
        className="select__list"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        hidden={!open}
        // Holds focus on the button, so the keys go on working after a click.
        onMouseDown={(event) => event.preventDefault()}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            role="option"
            id={`${id}-${index}`}
            className="select__option"
            aria-selected={index === selected}
            data-active={index === active || undefined}
            onPointerMove={() => index !== active && setActive(index)}
            onClick={() => pick(index)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
