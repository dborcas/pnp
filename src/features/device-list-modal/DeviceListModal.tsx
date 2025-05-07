import type { JSX, SyntheticEvent } from "react";
import { useRef, useState } from "react";
import "./DeviceListModal.css";
import type { CameraKind } from "../camera-view/CameraView.tsx";
import { useAppDispatch, useAppSelector } from "../../app/hooks.ts";
import {
	appStreamDeviceId,
	appStreamDeviceInfo,
	devicesSelector,
	selectDeviceWindow,
} from "./devicesSlice.ts";
import { mainCameraSelector, setCamera, smallCameraSelector } from "../camera-view/cameraViewsSlice.ts";
import { closestTarget } from "../../utils/event-utils.ts";

export type Props = {
	// readonly onChange: (payload: Nullable<{camera: CameraKind, device: DeviceInfo}>) => Promise<void> | void;
	readonly open: boolean;
	readonly setIsModalOpen: (open: boolean) => void;
	readonly className?: Nullable<string>;
};

const DeviceListModal = (opts: Props): JSX.Element => {
	
	const firstFocus = useRef<HTMLButtonElement>(null);
	const [lastFocus, setLastFocus] = useState<Nullable<HTMLElement>>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const devices = useAppSelector(devicesSelector) ?? [];
	const smallCameraDevice = useAppSelector(smallCameraSelector);
	const mainCameraDevice = useAppSelector(mainCameraSelector);
	const dispatch = useAppDispatch();
	
	const requestAppWindow = (e: SyntheticEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(selectDeviceWindow())
		  .then(() => {
			  console.log("got app window");
			  if (mainCameraDevice == null) {
				  dispatch(setCamera({ camera: "main", device: appStreamDeviceInfo, devices}))
			  } else if (smallCameraDevice == null) {
				  dispatch(setCamera({ camera: "small", device: appStreamDeviceInfo, devices}))
			  }
		  })
		  .catch(() => {
			  console.log("App window request rejected");
		  })
	}
	
	const {
		className,
		open: isModalOpen,
		setIsModalOpen: setIsModalOpenParent,
	} = opts;
	
	const setIsModalOpen = (v: boolean) => {
		const dialog = dialogRef.current;
		if (dialog == null) {
			return;
		}
		if (v) {
			dialog.open = true;
		} else {
			dialog.close("");
		}
		setIsModalOpenParent(v);
	};
	
	const clearFocusOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const target = e.target as HTMLElement;
		const closest = target.closest("[data-focusble]");
		if (closest == null) {
			setLastFocus(null);
		}
		if (closest == lastFocus) {
			setLastFocus(null);
		}
	};
	
	const onFocus = (e: SyntheticEvent) => {
		const theFocus = closestTarget<HTMLElement>(e, "[data-focusable]");
		if (theFocus == null) {
			return;
		}
		setLastFocus(theFocus);
	};
	
	setIsModalOpen(isModalOpen);
	
	const onCameraSelect = (camera: CameraKind, device: DeviceInfo) => {
		dispatch(setCamera({
			device,
			devices,
			camera,
		}));
	};
	
	const getOption = (i: number, camera: CameraKind, device: DeviceInfo) => {
		return <input
		  className={"device-option"}
		  aria-labelledby={`device-select-device-row-${i.toString()}-name device-select-${camera}-camera-label`}
		  type="radio"
		  name={`device-select-${camera}-camera`}
		  value={device.deviceId}
		  data-for-camera={camera}
		  checked={device.deviceId == (camera === "main" ? mainCameraDevice : smallCameraDevice)?.deviceId}
		  data-focusable="true"
		  onInput={() => {
			  onCameraSelect(camera, device);
		  }}
		  onChange={() => {
			  onCameraSelect(camera, device);
		  }}
		  onSelect={() => {
			  onCameraSelect(camera, device);
		  }}
		  
		  onFocus={onFocus}
		  onBlur={clearFocusOnBlur}
		></input>;
	};
	
	const closeModal = (e: SyntheticEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsModalOpen(false);
	}
	
	const onSubmit = (e: Nullable<SyntheticEvent>) => {
		if (e != null && closestTarget(e, "[type='submit']") == null) {
			return
		}
		setIsModalOpen(false);
	};
	
	
	const onKey = (e: React.KeyboardEvent<HTMLElement>) => {
		if (e.key === "Escape") {
			setIsModalOpen(false);
		}
	};
	
	const onDialogBlur = (e: SyntheticEvent) => {
		if (closestTarget(e, "dialog") == null) {
			return;
		}
		// setIsModalOpen(false);
	};
	
	return (
	  <>
		  <dialog
			ref={dialogRef}
			className={`DeviceListModal ${className ?? ""} ${isModalOpen ? "" : "display-hidden"}`}
			onFocus={() => {
				(lastFocus ?? firstFocus.current as Nullable<HTMLElement>)?.focus();
			}}
			onBlur={onDialogBlur}
			onKeyUp={onKey}
			onKeyDown={onKey}
		  >
			  <div className={`container`}>
				  <button className={`close-button`} ref={firstFocus} onClick={closeModal}>
					  <span className={`material-symbols-outlined`}>
						  close
					  </span>
				  </button>
				  <form onSubmit={onSubmit} ref={formRef}>
					  <table>
						  <thead>
						  <tr>
							  <th data-for="device">Device</th>
							  <th data-for="camera" id="device-select-main-camera-label">Main Camera</th>
							  <th data-for="camera" id="device-select-small-camera-label">Small Camera</th>
						  </tr>
						  </thead>
						  <tbody>
						  {devices.map((device: DeviceInfo, i: number) => {
							  return <tr key={`device-select-device-row-${i.toString()}`}>
								  <td data-for="device" id={`device-select-device-row-${i.toString()}-name`}>
									  { device.deviceId === appStreamDeviceId ?
										<button
										  className={`request-app-window-stream-button`}
										  onClick={requestAppWindow}
										>
											App Window
										</button>
									  : device.label
								  }</td>
								  <td data-for="camera">
									  {getOption(i, "main", device)}
								  </td>
								  <td data-for="camera">
									  {getOption(i, "small", device)}
								  </td>
							  </tr>;
						  })}
						  </tbody>
					  </table>
					  <div className={`footer-buttons`}>
						  <button className="button" onClick={closeModal}>Done</button>
					  </div>
				  </form>
			  </div>
		  </dialog>
		  <div className={`modal-background`} onClick={closeModal}></div>
	  </>
	);
};


export default DeviceListModal;