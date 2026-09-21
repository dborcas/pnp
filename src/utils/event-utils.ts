export const closestTarget = (
  { target }: { target: Nullable<EventTarget> },
  selector: string,
): HTMLElement | null => {
  if (target == null) {
    return null;
  }
  const element = target as Partial<HTMLElement>;
  if (element.closest == undefined) {
    return null;
  }
  const closest = element.closest(selector);
  return closest instanceof HTMLElement ? closest : null;
};
