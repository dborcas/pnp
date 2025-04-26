import Toastify from "toastify-js";
import { noOp } from "../../utils/noOp.ts";
import { getErrorMessage, getStack } from "../../utils/error.ts";

export const onErrorToast = (
  error: unknown,
  onClick: () => void = noOp) => {
	try {
		_onErrorToast(error, onClick);
	} catch {
		const message = getErrorMessage(error);
		alert(message);
		onClick();
	}
};

const _onErrorToast = (
  error: unknown,
  onClick: () => void = noOp) => {
	
	const message = getErrorMessage(error);
	const stack = getStack(error);
	
	console.log("Error: %s;\n %s", error, stack);
	
	const toast = Toastify({
		text: message,
		duration: 3000,
		close: true,
		gravity: "top", // `top` or `bottom`
		position: "right", // `left`, `center` or `right`
		stopOnFocus: true, // Prevents dismissing of toast on hover
		style: {
			color: "#FFFFFF",
			background: "linear-gradient(to right,rgb(208, 0, 0),rgb(139, 2, 2))",
		},
		onClick,
	});
	toast.showToast();
};

export const onError = onErrorToast;