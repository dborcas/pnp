
export const closestTarget = <T>({target}: {target: Nullable<EventTarget>}, selector: string): T|undefined => {
	if (target == null) {
		return undefined;
	}
	const element = target as Partial<HTMLElement>;
	if (element.closest == undefined) {
		return undefined;
	}
	return element.closest(selector) as T;
	
}