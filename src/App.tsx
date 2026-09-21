import "./App.css";
import {useAppDispatch, useAppSelector} from "./app/hooks.ts";
import {
	clearCamera,
	hasMainCameraSelector,
	hasSwappableCamerasSelector,
	hasValidCameraSelector,
	mainCameraSelector,
	refreshLoadedCameras,
	setCamera,
	setShowControls,
	showControlsSelector,
	swapCameras,
	toggleCameraControls,
} from "./features/camera-view/cameraViewsSlice.ts";
import {useCallback, useEffect, useRef, useState} from "react";
import {onErrorToast} from "./features/error/onerror.ts";
import {SmallCameraView} from "./features/small-camera/SmallCameraView.tsx";
import {devicesSelector, refreshDevices, setDevices} from "./features/device-list-modal/devicesSlice.ts";
import DeviceListModal from "./features/device-list-modal/DeviceListModal.tsx";
import {isMultiCameraAllowed} from "./utils/allowMulticamera.ts";
import { MarkupCamera } from "./features/markup-camera/MarkupCamera.tsx";

let loaded = 0;

export const App = () => {

	const mainCamera: Nullable<DeviceInfo> = useAppSelector(mainCameraSelector);
	const hasMainCamera = useAppSelector(hasMainCameraSelector);
	const dispatch = useAppDispatch();
	const devices = useAppSelector(devicesSelector);
	const showControls = useAppSelector(showControlsSelector);
	const hasSwappableCameras = useAppSelector(hasSwappableCamerasSelector);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const hasValidCamera = useAppSelector(hasValidCameraSelector);
    const [drawingEnabled, setDrawingEnabled] = useState(false);
	const controlsHideTimer = useRef<number | null>(null);
	const canvasId = "main-canvas";

	const clearControlsHideTimer = useCallback(() => {
		if (controlsHideTimer.current == null) {
			return;
		}
		window.clearTimeout(controlsHideTimer.current);
		controlsHideTimer.current = null;
	}, []);

	const scheduleControlsHide = useCallback(() => {
		clearControlsHideTimer();
		controlsHideTimer.current = window.setTimeout(() => {
			dispatch(setShowControls(false));
			controlsHideTimer.current = null;
		}, 2400);
	}, [clearControlsHideTimer, dispatch]);

	const brieflyShowControls = useCallback(() => {
		dispatch(setShowControls(true));
		scheduleControlsHide();
	}, [dispatch, scheduleControlsHide]);

	useEffect(() => {
		console.log(`Loaded: ${(++loaded).toString()}`);
		const mediaDevices = navigator.mediaDevices as MediaDevices | undefined;
		const onLoadState = () => {
			if (mediaDevices == null) {
				return;
			}
			mediaDevices.getUserMedia({ audio: false, video: true })
			  .then((stream) => {
				  console.log(`"Device changed to: Stream[${stream.id}]`);
			  })
			  .catch((e: unknown) => {
				  console.error("Camera list not okay; ", e);
			  });
			dispatch(refreshDevices())
			  .then((devices) => {
				  dispatch(setDevices(devices.payload as DeviceInfo[]));
			  })
			  .catch((e: unknown) => {
				  console.error("Failed to load devices, ", e);
			  });
			dispatch(refreshLoadedCameras());
		};
		mediaDevices?.addEventListener("devicechange", onLoadState);
		window.addEventListener("load", onLoadState);
		document.addEventListener("load", onLoadState);
		onLoadState();
		return () => {
			mediaDevices?.removeEventListener("devicechange", onLoadState);
			window.removeEventListener("load", onLoadState);
			document.removeEventListener("load", onLoadState);
		};
	}, [dispatch]);

	useEffect(() => {
		scheduleControlsHide();
		return () => {
			clearControlsHideTimer();
		};
	}, [clearControlsHideTimer, scheduleControlsHide]);

	useEffect(() => {
		const revealOnEdgeHover = (e: PointerEvent) => {
			const revealHeight = window.innerHeight * 0.22;
			if (e.clientY <= revealHeight || e.clientY >= window.innerHeight - revealHeight) {
				brieflyShowControls();
			}
		};
		window.addEventListener("pointermove", revealOnEdgeHover);
		return () => {
			window.removeEventListener("pointermove", revealOnEdgeHover);
		};
	}, [brieflyShowControls]);

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
		document.body.addEventListener("keypress", (e) => {
			if (e.shiftKey && e.key.toLowerCase() === "f") {
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
		const click = (e: PointerEvent) => {
			const target = e.target as Nullable<HTMLElement>;
			if (
				target == null ||
				target.closest(".markup-camera-toolbar") != null ||
				target.closest(".device-buttons") != null ||
				target.closest(".DeviceListModal") != null
			) {
				return;
			}

			const app = target.closest(".App");
			if (app == null) {
				return;
			}
			if (!app.classList.contains("App")) {
				return;
			}
			brieflyShowControls();
		};
		window.addEventListener("keyup", keyup);
		window.addEventListener("pointerdown", click, true);
		return () => {
			window.removeEventListener("keyup", keyup);
			window.removeEventListener("pointerdown", click, true);
		};
	}, [brieflyShowControls, dispatch]);
	const multiCamera = isMultiCameraAllowed() && devices != null && devices.length > 1;
	const hasAnyDevice = devices != null && devices.length > 0;
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
		hasAnyDevice ?
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

    const drawButton = (
        hasAnyDevice ?
            <button
                className={`open-device-list-button app-icon-button icon-button hide-on-hide-controls ${drawingEnabled ? "active" : ""}`}
                onClick={() => {
                    setDrawingEnabled(!drawingEnabled);
                }}
            >
				<span className={`material-symbols-outlined button-icon`}>
				  draw
				</span>
            </button>
            : <></>
    );


	// const clearButton = (
	// 	hasAnyDevice ?
	// 		<button
	// 			className={`open-device-list-button app-icon-button icon-button hide-on-hide-controls`}
	// 			onClick={() => {
	// 				window.dispatchEvent(new CustomEvent("ClearCanvas", {default: {id: canvasId}))
	// 			}}
	// 		>
	// 			<span className={`material-symbols-outlined button-icon`}>
	// 			  edit_off
	// 			</span>
	// 		</button>
	// 		: <></>
	// );


	return <div className={`App ${showControls ? "" : "hide-controls"}`}>
		<div
			className={`device-buttons`}
			onPointerEnter={clearControlsHideTimer}
			onPointerLeave={scheduleControlsHide}
		>
			{devicesButton}
			{swapCameraButton}
			{drawButton}
			{/*{clearButton}*/}
		</div>

		<MarkupCamera
			mainCamera={mainCamera}
			setMainCamera={setMainCamera}
			hasMainCamera={hasMainCamera}
			showToolbars={showControls}
			drawingEnabled={drawingEnabled}
			setDrawingEnabled={setDrawingEnabled}
			canvasId={canvasId}
			onControlsPointerEnter={clearControlsHideTimer}
			onControlsPointerLeave={scheduleControlsHide}
		/>

		{multiCamera ?
		<SmallCameraView
		  hideCamera={!showControls && (devices.length < 2)}
		  onError={onErrorToast}
		  onCameraChange={setSmallCamera}
		></SmallCameraView> : <></>}

		  <DeviceListModal
			open={true}
			hasMultipleDevices={multiCamera}
			isModalOpen={isModalOpen || !hasValidCamera}
			setIsModalOpen={setIsModalOpen}
		  />
	</div>;
};
