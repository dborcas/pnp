import { getErrorMessage } from "./error.ts";

export const restoreState = <T, >(key: string): Nullable<T> => {
	const json = localStorage.getItem(key);
	if (!json) {
		return null;
	}
	try {
		return JSON.parse(json) as T;
	} catch (e) {
		const error = getErrorMessage(e);
		console.error("Failed to deserialize state for key: %s; Error: %s", key, error);
		return null;
	}
};

