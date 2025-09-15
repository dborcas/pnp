import { createAppSlice } from "../../app/createAppSlice.ts";
import type { PayloadAction } from "@reduxjs/toolkit";

export type DevicesSliceState = {
	devices: Nullable<DeviceInfo[]>;
	status: "loaded" | "loading" | "failed" | "initializing";
	appStreamIndex: number;
}

const initialState: DevicesSliceState = {
	devices: [],
	appStreamIndex: 0,
	status: "initializing",
};

const deviceLabelRegex = /^(.*?)(\([a-fA-F0-9]{4,}:[a-fA-F0-9]{4,}\))?$/;

export const appStreamDeviceId = "@@@_APP+STREAM_@@@";
export const appStreamDeviceInfo = {
	deviceId: appStreamDeviceId,
	label: "App Window",
	flipped: false,
	tick: 0,
} satisfies DeviceInfo

let streamIndex = 0;
let appStream: Nullable<AppStream> = null;

export const getAppStream = (): Nullable<AppStream> => {
	return appStream;
};

// If you are not using async thunks you can use the standalone `createSlice`.
export const devicesSlice = createAppSlice({
	name: "devices",
	initialState,
	reducers: (create) => {
		return {
			setDevices: create.reducer(
			  (state, action: PayloadAction<Nullable<DeviceInfo[]>>) => {
				  return {
					  ...state,
					  devices: action.payload,
					  status: action.payload != null ? "loaded" : "failed",
				  };
			  },
			),
			incrementAppStream: create.reducer((state) => {
				state.appStreamIndex = ++streamIndex;
			}),
			selectDeviceWindow: create.asyncThunk(async (): Promise<number> => {
				const stream = await navigator.mediaDevices.getDisplayMedia({
					video: { displaySurface: "window" },
				});
				
				const newAppStream = {
					stream,
					name: stream.id,
					index: ++streamIndex,
				} satisfies AppStream;
				appStream = newAppStream;
				return newAppStream.index;
			}, {
				rejected: (e: unknown) => {
					console.error("Failed to select app window", e);
				},
				fulfilled: (state, action) => {
					state.appStreamIndex = action.payload;
				},
			}),
			refreshDevices: create.asyncThunk(
			  async (): Promise<DeviceInfo[]> => {
				  // get list of devices
				  try {
					  await navigator.mediaDevices.getUserMedia({
						  audio: false,
						  video: true,
					  });
				  } catch (e) {
					  console.error("Failed to get video media; ", e);
					  return [
						  appStreamDeviceInfo
					  ];
				  }

				  const theDevices = await navigator.mediaDevices.enumerateDevices();
				  const out = theDevices
					.filter(info => info.kind == "videoinput")
					.map((d) => {
						let label = d.label;
						const labelParts = deviceLabelRegex.exec(label);
						if (typeof labelParts?.[1] !== "undefined") {
							label = labelParts[1];
						}
						
						return {
							deviceId: d.deviceId,
							label: label,
						} satisfies DeviceInfo;
					});
				  out.push(appStreamDeviceInfo);
				  return out;
			  },
			  {
				  pending: state => {
					  state.status = "loading";
				  },
				  fulfilled: (state, action) => {
					  state.status = "loaded";
					  state.devices = action.payload;
				  },
				  rejected: (state: DevicesSliceState, e) => {
					  console.error("Fetch device failed; Payload: ", e.payload);
					  state.status = "failed";
					  state.devices = [
						  appStreamDeviceInfo
					  ];
				  },
			  },
			),
		};
	},
	selectors: {
		devices: (state: DevicesSliceState) => state.devices,
		deviceListStatus: (state: DevicesSliceState) => state.status,
		deviceListLoadFailed: (state: DevicesSliceState) => state.status === "failed",
		deviceListLoading: (state: DevicesSliceState) => state.status === "loading",
		deviceListLoaded: (state: DevicesSliceState) => state.status === "loaded",
		deviceListInitializing: (state: DevicesSliceState) => state.status === "initializing",
		appStreamDeviceIndex: (state: DevicesSliceState) => state.appStreamIndex,
	},
});

// Action creators are generated for each case reducer function.
export const {
	devices: devicesSelector,
	deviceListStatus: deviceListStatusSelector,
	deviceListLoadFailed: deviceListLoadFailedSelector,
	deviceListLoading: deviceListLoadingSelector,
	deviceListInitializing: deviceListInitializingSelector,
	deviceListLoaded: deviceListLoadedSelector,
  	appStreamDeviceIndex: appStreamDeviceIndexSelector,
} = devicesSlice.selectors;

export const { refreshDevices, setDevices, selectDeviceWindow } = devicesSlice.actions;