import {
	getSmallCameraInitialState,
	getStateUpdatedWithScreenPosition,
	getStateUpdatedWithSize,
} from "./smallCameraViewUtil.ts";

import type { PayloadAction, ReducerCreators } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";


export const smallCameraViewSlice = createSlice({
	name: "smallCameraView",
	initialState: getSmallCameraInitialState(),
	reducers: (create: ReducerCreators<SmallCameraSlice>) => {
		return {
			setSmallCameraShape: create.reducer((state, action: PayloadAction<CameraShape>) => {
				state.smallCameraShape = action.payload;
				return state;
			}),
			setSmallCameraPositionAndSize: create.reducer<{ size: Size, position: Position }>((state, action) => {
				const { position, size } = action.payload;
				let newState = getStateUpdatedWithScreenPosition(state, position, size);
				const intermediaryPosition = newState.smallCameraScreenPosition;
				newState = getStateUpdatedWithSize(newState, newState.smallCameraSize);
				console.log({
					pos_new: newState.smallCameraScreenPosition,
					pos_intermediary: intermediaryPosition,
					size_new: newState.smallCameraSize,
				});
				return newState;
			}),
			setShowSmallCamera: create.reducer<boolean>((state, action) => {
				state.showSmallCamera = action.payload;
				return state;
			}),
			setSmallCameraScreenPosition: create.reducer((state, action: PayloadAction<Position>) => {
				return getStateUpdatedWithScreenPosition(state, action.payload);
			}),
			setSmallCameraSize: create.reducer<Size>((state, action) => {
				state.smallCameraSize = action.payload;
				return state;
			}),
		};
	},
	selectors: {
		smallCameraSize: (state) => state.smallCameraSize,
		smallCameraShape: (state) => state.smallCameraShape,
		smallCameraPosition: (state) => state.smallCameraScreenPosition,
		smallCameraOffsetPosition: (state) => state.smallCameraOffsetPosition,
		showSmallCamera: (state) => state.showSmallCamera,
		hideSmallCamera: (state) => !state.showSmallCamera,
	},
});

export const {
	smallCameraShape: smallCameraShapeSelector,
	smallCameraSize: smallCameraSizeSelector,
	smallCameraPosition: smallCameraPositionSelector,
	smallCameraOffsetPosition: smallCameraOffsetPositionSelector,
	showSmallCamera: showSmallCameraSelector,
} = smallCameraViewSlice.selectors;


export const {
	setSmallCameraScreenPosition,
	setSmallCameraPositionAndSize,
	setShowSmallCamera,
} = smallCameraViewSlice.actions;






