import {createAppSlice} from "../../app/createAppSlice.ts";
import type {PayloadAction, ReducerCreators} from "@reduxjs/toolkit";
import {getInitialState} from "./cameraViewUtil.ts";

export type CamerasSliceState = {
    mainCamera: Nullable<DeviceInfo>;
    smallCamera: Nullable<DeviceInfo>;
    showControls: boolean;
}


let _tick = 0;

// If you are not using async thunks you can use the standalone `createSlice`.
export const camerasSlice = createAppSlice({
    name: "cameraViews",
    initialState: getInitialState(),
    reducers: (create: ReducerCreators<CamerasSliceState>) => {
        return {
            setCamera: create.reducer(
                (state, action: PayloadAction<{
                    device: DeviceInfo,
                    devices: Nullable<DeviceInfo[]>,
                    camera: CameraKind
                }>) => {
                    const {
                        device,
                        devices,
                        camera,
                    } = action.payload;

                    const {
                        get: getMain,
                        set: setMain,
                        getOther,
                        setOther,
                    } = modifiers(camera);
                    const main = getMain(state);
                    const other = getOther(state);
                    if (devices?.length == 2 && main?.deviceId != null && other?.deviceId != null && main.deviceId !== other.deviceId) {
                        if (device.deviceId === other.deviceId) {
                            console.log("Swapping cameras; Camera: ", main);
                            state = setOther(state, main);
                        } else {
                            console.log({
                                main,
                                device,
                            });
                        }
                    }
                    state = setMain(state, device);
                    console.log({
                        ...state,
                    });
                    return state;
                }),

            refreshLoadedCameras: create.reducer((state) => {
                const tick = ++_tick;
                const smallCamera = state.smallCamera;
                if (smallCamera) {
                    smallCamera.tick = tick;
                    state.smallCamera = smallCamera;
                }
                const mainCamera = state.mainCamera;
                if (mainCamera) {
                    mainCamera.tick = tick;
                    state.mainCamera = mainCamera;
                }
                return state;
            }),

            clearCamera: create.reducer<CameraKind>((state, action) => {
                if (action.payload === "main") {
                    state.mainCamera = null;
                } else {
                    state.smallCamera = null;
                }
                return state;
            }),

            setCameras: create.reducer(
                (state, action: PayloadAction<{ small?: DeviceInfo, main?: DeviceInfo }>) => {
                    state.mainCamera = action.payload.main ?? state.mainCamera;
                    state.smallCamera = action.payload.small ?? state.smallCamera;
                    return state;
                },
            ),
            setShowControls: create.reducer<boolean>((state, action) => {
                state.showControls = action.payload;
                return state;
            }),
            toggleCameraControls: create.reducer((state) => {
                state.showControls = !state.showControls;
            }),
            swapCameras: create.reducer((state) => {
                const main = state.smallCamera;
                return {
                    ...state,
                    smallCamera: state.mainCamera,
                    mainCamera: main,
                }
            }),
        };
    },

    selectors: {
        mainCamera: (state: CamerasSliceState) => state.mainCamera,
        smallCamera: (state: CamerasSliceState) => state.smallCamera,
        showControls: (state: CamerasSliceState) => state.showControls,
        hasSwappableCameras: (state: CamerasSliceState) => state.mainCamera?.deviceId != null && state.mainCamera.deviceId !== state.smallCamera?.deviceId,
    },
});

// Action creators are generated for each case reducer function.
export const {
    mainCamera: mainCameraSelector,
    smallCamera: smallCameraSelector,
    showControls: showControlsSelector,
    hasSwappableCameras: hasSwappableCamerasSelector,
} = camerasSlice.selectors;


export const {
    setCamera,
    clearCamera,
    refreshLoadedCameras,
    toggleCameraControls,
    swapCameras,
} = camerasSlice.actions;

const modifiers = (camera: CameraKind) => {
    if (camera === "main") {
        return {
            get: (state: CamerasSliceState) => {
                return state.mainCamera ? {...state.mainCamera} : undefined;
            },
            set: (state: CamerasSliceState, camera: DeviceInfo): CamerasSliceState => {
                return {
                    ...state,
                    mainCamera: camera,
                };
            },
            getOther: (state: CamerasSliceState) => {
                return state.smallCamera ? {...state.smallCamera} : undefined;
            },
            setOther: (state: CamerasSliceState, camera: DeviceInfo): CamerasSliceState => {
                return {
                    ...state,
                    smallCamera: camera,
                };
            },
        };
    } else {
        return {
            get: (state: CamerasSliceState) => {
                return state.smallCamera ? {...state.smallCamera} : undefined;
            },
            set: (state: CamerasSliceState, camera: DeviceInfo): CamerasSliceState => {
                return {
                    ...state,
                    smallCamera: camera,
                };
            },
            getOther: (state: CamerasSliceState) => {
                return state.mainCamera ? {...state.mainCamera} : undefined;
            },
            setOther: (state: CamerasSliceState, camera: DeviceInfo): CamerasSliceState => {
                return {
                    ...state,
                    mainCamera: camera,
                };
            },
        };
    }
};