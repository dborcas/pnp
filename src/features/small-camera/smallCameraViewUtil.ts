import { SMALL_CAMERA_MIN_HEIGHT, SMALL_CAMERA_MIN_WIDTH } from "../../utils/constants.ts";
import { restoreState } from "../../utils/saveState.ts";

const _smallCameraSettingsKey = "picture-in-picture.small_settings";

export const getInFramePosition = (position: Position, size: Size): Position => {
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;
	let { x, y } = position;
	if (x < 0) {
		x = 0;
	}
	if (y < 0) {
		y = 0;
	}
	const { width, height } = size;
	if (x + width > windowWidth) {
		x = windowWidth - width - 10;
	}
	if (y + height > windowHeight) {
		console.log({
			y, height, windowHeight
		})
		y = windowHeight - height - 10;
	}
	return {
		x,
		y,
	};
};

export const getActualPosition = (position: Position, size: Size): { size: Size, position: Position } => {
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;
	let { width, height } = size;
	const ratio = height / width;
	let { x, y } = position;
	x = windowWidth - width - x;
	y = windowHeight - height - y;
	if (x < 0) {
		x = 10;
		width = Math.min(windowWidth - x, SMALL_CAMERA_MIN_WIDTH);
		height = Math.min(width * ratio, SMALL_CAMERA_MIN_HEIGHT);
	}
	if (y < 0) {
		y = 10;
		height = Math.min(windowHeight - y, SMALL_CAMERA_MIN_HEIGHT);
		width = Math.min(height / ratio, width, SMALL_CAMERA_MIN_WIDTH);
	}
	return {
		size: { width, height },
		position: { x, y },
	};
};


export const getStatePosition = (position: Position, size: Size) => {
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;
	let { x, y } = position;
	x = Math.max(windowWidth - x - size.width, 10);
	y = Math.max(windowHeight - y - size.height, 10);
	console.log({ x, y });
	return {
		x,
		y,
	};
};


export const getSmallCameraInitialState = (): SmallCameraSlice => {
	const basePosition = { x: 10, y: 10 };
	const baseSize = {
		width: SMALL_CAMERA_MIN_WIDTH,
		height: SMALL_CAMERA_MIN_HEIGHT,
	};
	const baseState = {
		smallCameraShape: "rect",
		showSmallCamera: true,
		smallCameraSize: baseSize,
		smallCameraOffsetPosition: basePosition,
		smallCameraScreenPosition: getInFramePosition(basePosition, baseSize),
	} satisfies SmallCameraSlice;
	
	const restored = restoreState<SmallCameraSlice>(_smallCameraSettingsKey);
	let state: SmallCameraSlice = baseState;
	if (restored) {
		state = {
			...state,
			...restored,
		};
	}
	const {
		position: smallCameraScreenPosition,
		size: smallCameraSize
	} = getActualPosition(state.smallCameraOffsetPosition, state.smallCameraSize);
	state =  {
		...state,
		smallCameraScreenPosition,
		smallCameraSize,
	} satisfies SmallCameraSlice;
	
	return state;
};


export const getStateUpdatedWithScreenPosition = (state: SmallCameraSlice, rawPosition: Position, size: Size = state.smallCameraSize): SmallCameraSlice => {
	const position = getInFramePosition(rawPosition, size);
	return {
		...state,
		smallCameraScreenPosition: position,
		smallCameraOffsetPosition: getStatePosition(position, size),
		smallCameraSize: size,
	};
}

export const getStateUpdatedWithSize = (state: SmallCameraSlice, size: Size): SmallCameraSlice => {
	let width = size.width;
	if (width < SMALL_CAMERA_MIN_WIDTH) {
		width = SMALL_CAMERA_MIN_WIDTH;
	}
	
	let height = size.height;
	if (height < SMALL_CAMERA_MIN_HEIGHT) {
		height = SMALL_CAMERA_MIN_HEIGHT;
	}
	
	return {
		...state,
		smallCameraSize: { width, height },
	}
}