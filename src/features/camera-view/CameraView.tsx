import { clearCamera as _clearCamera, setCamera as _setCamera } from "./cameraViewsSlice.ts";
import { useEffect, useRef, useState } from "react";
import {
	appStreamDeviceId,
	appStreamDeviceIndexSelector,
	devicesSelector,
	getAppStream,
} from "../device-list-modal/devicesSlice.ts";
import { useAppDispatch, useAppSelector } from "../../app/hooks.ts";
import { noOp } from "../../utils/noOp.ts";
import "./CameraView.css";


export type CameraKind = "main" | "small";

export type CameraProps = {
	className?: Nullable<string>;
	camera: Nullable<DeviceInfo>;
	kind: CameraKind;
	onError: (error: string) => void;
	onCameraChange?: (deviceInfo: DeviceInfo) => void;
	isFallbackCamera: boolean;
}

export const CameraView = (opts: CameraProps) => {
	const dispatch = useAppDispatch();
	const {
		className,
		camera,
		kind,
		onError,
		isFallbackCamera
	} = opts;
	
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [hasSource, setHasSource] = useState<boolean>(false);
	const hasStream = camera != null;
	const devices = useAppSelector(devicesSelector);
	const appStreamIndex = useAppSelector(appStreamDeviceIndexSelector);


	
	const clearCamera = () => {
		dispatch(_clearCamera(kind));
		setHasSource(false);
		
		const video = videoRef.current;
		if (!video) {
			return;
		}
		video.classList.add("display-hidden");
		video.pause();
		video.onerror = noOp;
		video.removeAttribute("src");
		video.removeAttribute("srcObject");
	};
	
	const changeSource = (camera: Nullable<MediaProvider>) => {
		if (camera == null) {
			clearCamera();
			return;
		}
		const video = videoRef.current;
		if (video == null) {
			return;
		}
		video.classList.remove("display-hidden");
		video.srcObject = camera;
		setHasSource(true);
	};

	const setCamera = async (newCamera: Nullable<DeviceInfo>) => {
		if (newCamera == null) {
			clearCamera()
			return;
		}
		// if (newCamera.deviceId == camera?.deviceId && videoRef.current?.srcObject != null && videoRef.current.isConnected) {
		// 	console.log(`Camara[${kind}] is already set to ${newCamera.label}`);
		// 	return;
		// }
		console.log(`Setting camera to ${newCamera.label}`);
		dispatch(_setCamera({
			devices,
			device: newCamera,
			camera: kind,
		}));

		try {
			await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
		} catch /*(e)*/ {
			if (isFallbackCamera) {
				return;
			}
			if (newCamera.deviceId !== appStreamDeviceId) {
				// 	if (e instanceof Error) {
				// 		if (e.name === "NotFoundError") {
				// 			onError(`Camera ${kind} not found for device ${newCamera.label}`);
				// 		}
				// 		console.error(`Camera ${kind} not found`, e);
				// 	} else {
				// 		onError(`Failed to ask for camera permission for ${kind} camera`);
				// 	}
				//
				// 	clearCamera();
				// 	return;

				clearCamera();
				return;
			}
		}

		// request user permission on media stream
		// note: normally, you can call this multiple times w/o needing to
		//       request permission again

		let mediaStreamRef: MediaProvider | undefined | MediaStream;
		try {

			if (newCamera.deviceId === appStreamDeviceId) {
				mediaStreamRef = getAppStream()?.stream;
			} else {
				mediaStreamRef = await navigator.mediaDevices.getUserMedia({
					audio: false,
					preferCurrentTab: true,
					video: {
						deviceId: newCamera.deviceId,
					},
				});
			}
		} catch (e) {
			let error: string;
			if (e instanceof Error) {
				error = e.message;
				console.error(`${e.message}\n${e.stack ?? ""}`.trim());
			} else if (typeof e === "string") {
				error = e;
			} else {
				error = "Failed to get camera stream";
			}
			clearCamera();
			onError(error);
			return;
		}
		const video = videoRef.current;
		if (video == null) {
			return;
		}
		video.classList.remove("display-hidden");
		video.onerror = (event: Event | string) => {
			clearCamera();
			if (typeof event === "string") {
				onError(event);
			} else if (event instanceof Event) {
				onError("An unknown error occurred");
			}
		};
		changeSource(mediaStreamRef);
	};
	
	
	useEffect(() => {
		if (camera != null && (camera as Partial<DeviceInfo>).deviceId != null) {
			setCamera(camera)
			  .then(() => {
				  // ignore
			  })
			  .catch((e: unknown) => {
				  console.error("Failed to set camera on init: ", e);
			  });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [camera, appStreamIndex]);
	
	
	return (
	  <div className={`Camera ${className ?? ""}`}
		   data-camera={kind}
		   data-has-source={hasSource}
		   data-has-stream={hasStream}
	  >
		  <video ref={videoRef} autoPlay={true}></video>
	  
	  </div>
	);
};
