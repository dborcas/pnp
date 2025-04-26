export const getStack = (error?: Nullable<unknown>): string => {
	
	if (error instanceof Error) {
		const stack = error.stack?.trim();
		if (stack) {
			return stack;
		}
	}
	
	const message = (error instanceof Error ? error.message : null)
	  ?? "An unknown error occurred";
	const theError: Error = new Error(message);
	const stack = theError.stack?.trim();
	
	if (!stack) {
		return "";
	}
	
	const theStack = stack.split("\n");
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		const line = theStack.shift();
		if (line == null) {
			break;
		}
		const contains = line.toLowerCase().includes("onerror");
		if (contains) {
			break;
		}
	}
	
	if (theStack.length < 1) {
		return stack;
	} else {
		return theStack.join("\n");
	}
};

const DEFAULT_ERROR_MESSAGE = "An unknown error has occurred.";

export const getErrorMessage = (error: Nullable<unknown>, defaultError: string = DEFAULT_ERROR_MESSAGE) => {
	
	if (error == null) {
		return defaultError;
	}
	
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	if (typeof error === "object") {
		const ob = error as Partial<{ message: string }>;
		if (typeof ob.message === "string") {
			return ob.message;
		} else {
			return defaultError;
		}
	}
	return defaultError;
	
};