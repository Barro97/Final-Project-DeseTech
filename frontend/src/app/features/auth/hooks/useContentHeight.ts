// This is a hook for dynamically changing the size of the form

import { RefObject, useEffect, useState } from "react";

export function useContentHeight(
  active: string, // This refers to the active tab
  refs: Record<string, RefObject<HTMLElement | null>> // This refers to the ref hook that is being passed
  // Record: meaning key and value
  // RefObject: the type that needs to be mentioned for a useRef hook object
) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      // The update function
      const element = refs[active]?.current; // Grab the ref
      if (element) setHeight(element.scrollHeight); // Set the desired height
    };
    const id = setTimeout(update, 10); // Measure the height 10 secs after the re-render to be more accurate
    return () => clearTimeout(id); //clear timeout to prevent unwanted behavior
  }, [active, refs]);

  return height;
}
