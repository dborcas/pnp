import type { CamerasSliceState } from "./cameraViewsSlice.ts";
import { camerasSlice } from "./cameraViewsSlice.ts";
import type { Action, Dispatch, Middleware } from "@reduxjs/toolkit";
import { appStreamDeviceId, DevicesSliceState } from "../device-list-modal/devicesSlice.ts";


const _localStorageKey = "picture-in-picture.state";


const initialState = (): CamerasSliceState => {
	return {
		mainCamera: null,
		smallCamera: null,
		showControls: true,
	};
};

export const getInitialState = (): CamerasSliceState => {
	
	const stateString = localStorage.getItem(_localStorageKey);
	let state: Nullable<CamerasSliceState> = null;
	
	if (stateString != null) {
		try {
			state = JSON.parse(stateString) as CamerasSliceState;
		} catch {
			//ignore
		}
	}
	
	if (state != null) {
		if (state.smallCamera?.deviceId === appStreamDeviceId) {
			state.smallCamera = null;
		}
		if (state.mainCamera?.deviceId === appStreamDeviceId) {
			state.mainCamera = null;
		}
		console.log(state);
		return {
			...initialState(),
			...state,
		};
	}
	return initialState();
};


let sliceActions: Nullable<string[]> = null;


export const saveCameraSliceMiddleware:Middleware<Dispatch<Action>, {
	devices: DevicesSliceState;
	cameraViews: CamerasSliceState;
	smallCameraView: SmallCameraSlice;
}, Dispatch<Action>> = store => next => action => {
	sliceActions ??= Object.values(camerasSlice.actions).map (a => a.type);
	if (sliceActions.includes((action as Action).type)) {
		const slice = store.getState().cameraViews;
		localStorage.setItem(_localStorageKey, JSON.stringify(slice));
	}
	return next(action);
}