import "./App.css";
import { CameraView } from "./features/camera-view/CameraView.tsx";
import { useAppDispatch, useAppSelector } from "./app/hooks.ts";
import {
	clearCamera,
	hasSwappableCamerasSelector,
	mainCameraSelector,
	refreshLoadedCameras,
	setCamera,
	showControlsSelector,
	swapCameras,
	toggleCameraControls,
} from "./features/camera-view/cameraViewsSlice.ts";
import { useEffect, useState } from "react";
import { onErrorToast } from "./features/error/onerror.ts";
import { SmallCameraView } from "./features/small-camera/SmallCameraView.tsx";
import { noOp } from "./utils/noOp.ts";
import { devicesSelector, refreshDevices, setDevices } from "./features/device-list-modal/devicesSlice.ts";
import DeviceListModal from "./features/device-list-modal/DeviceListModal.tsx";

let loaded = 0;
export const App = () => {
	
	const mainCamera: Nullable<DeviceInfo> = useAppSelector(mainCameraSelector);
	const dispatch = useAppDispatch();
	const devices = useAppSelector(devicesSelector);
	const showControls = useAppSelector(showControlsSelector);
	const hasSwappableCameras = useAppSelector(hasSwappableCamerasSelector);
	const [isModalOpen, setIsModalOpen] = useState(false);
	
	
	useEffect(() => {
		let onLoadState = noOp;
		console.log(`Loaded: ${(++loaded).toString()}`);
		onLoadState = () => {
			navigator.mediaDevices.getUserMedia({ audio: false, video: true })
			  .then((stream) => {
				  console.log("Device changed to: " + stream.id);
			  })
			  .catch(() => {
				  console.log("Camera list not okay");
			  });
			dispatch(refreshDevices())
			  .then((devices) => {
				  console.log("Device thunk loaded", devices);
				  dispatch(setDevices(devices.payload as DeviceInfo[]));
			  })
			  .catch((e: unknown) => {
				  console.error("Failed to load devices, ", e);
			  });
			dispatch(refreshLoadedCameras());
		};
		navigator.mediaDevices.addEventListener("devicechange", onLoadState);
		window.addEventListener("load", onLoadState);
		document.addEventListener("load", onLoadState);
		onLoadState();
		return () => {
			navigator.mediaDevices.removeEventListener("devicechange", onLoadState);
			window.removeEventListener("load", onLoadState);
			document.removeEventListener("load", onLoadState);
		};
	}, [dispatch]);
	
	const setMainCamera = (device: Nullable<DeviceInfo>) => {
		if (device == null) {
			dispatch(clearCamera("main"));
			return;
		}
		const action = setCamera({ camera: "main", device: device, devices });
		dispatch(action);
	};
	
	const setSmallCamera = (device: Nullable<DeviceInfo>) => {
		if (device == null) {
			dispatch(clearCamera("small"));
			return;
		}
		const action = setCamera({ camera: "small", device: device, devices });
		dispatch(action);
	};

	useEffect(() => {
		window.addEventListener("keyup", (e) => {
			if (e.shiftKey && e.key === "f") {
				document.querySelector(".App")
					?.requestFullscreen()
					.then(() => {
						// ignore
					})
					.catch(() => {
						console.error("Failed to request full screen")
					})

				return false;
			}
			if (e.key.toLowerCase() === "escape") {
				document.exitFullscreen()
					.then( () =>{
						// ignore
					})
					.catch(() => {
						//ignore
					});
			}
		})
	}, [])
	
	
	useEffect(() => {
		const keyup = (e: KeyboardEvent) => {
			if (e.key === " ") {
				dispatch(toggleCameraControls());
			}
		};
		const click = (e: MouseEvent) => {
			const video = (e.target as Nullable<HTMLElement>)?.closest("video");
			if (video == null) {
				return;
			}
			
			const app = video.parentElement?.parentElement as Nullable<HTMLElement>;
			if (app == null) {
				return;
			}
			if (!app.classList.contains("App")) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			dispatch(toggleCameraControls());
		};
		window.addEventListener("keyup", keyup);
		window.addEventListener("click", click);
		return () => {
			window.removeEventListener("keyup", keyup);
			window.removeEventListener("click", click);
		};
	}, [dispatch]);
	
	const multiCamera = (devices ?? []).length > 1;
	const swapCameraButton = (
	  hasSwappableCameras && multiCamera ?
		<button className={`icon-button app-icon-button swap-camera-button hide-on-hide-controls`} onClick={() => {
			dispatch(swapCameras());
		}}>
			<span className={`material-symbols-outlined button-icon`}>cameraswitch</span>
		</button>
		: <></>
	);
	
	
	const devicesButton = (
		multiCamera ?
			<button
				className={`open-device-list-button app-icon-button icon-button hide-on-hide-controls`}
				onClick={() => {
					setIsModalOpen(true);
				}}
			>
				<span className={`material-symbols-outlined button-icon`}>
				  photo_camera
				</span>
			</button>
			: <></>
	);

	return <div className={`App ${showControls ? "" : "hide-controls"}`}>
		<div className={`device-buttons`}>
			{devicesButton}
			{swapCameraButton}
		</div>

		<CameraView
		  camera={mainCamera}
		  kind={"main"}
		  onError={onErrorToast}
		  onCameraChange={setMainCamera}
		/>
		<SmallCameraView
		  hideCamera={!showControls && ((devices?.length ?? 0) < 2)}
		  onError={onErrorToast}
		  onCameraChange={setSmallCamera}
		></SmallCameraView>
		
		{isModalOpen ?
		  <DeviceListModal
			open={true}
			setIsModalOpen={setIsModalOpen}
		  /> :
		  <></>
		}
	</div>;
};
