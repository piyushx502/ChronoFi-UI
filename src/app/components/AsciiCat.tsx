"use client";

import { useState, useEffect } from "react";

export default function AsciiCat() {
  const [blink, setBlink] = useState(false);
  const [tailState, setTailState] = useState(0);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      }
    }, 3000);

    const tailInterval = setInterval(() => {
      setTailState((prev) => (prev + 1) % 4);
    }, 500);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(tailInterval);
    };
  }, []);

  const eyes = blink ? "-.-" : "o.o";
  const tailChars = ["\\\\", "|", "/", "|"];
  const tail = tailChars[tailState];

  return (
    <pre aria-hidden="true" className="font-mono text-zinc-500 text-sm leading-tight select-none m-0">
{`   /\\_/\\ 
  ( ${eyes} )
   > ^ < ${tail}`}
    </pre>
  );
}
