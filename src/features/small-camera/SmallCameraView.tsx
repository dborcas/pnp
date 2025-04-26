import { Rnd } from "react-rnd";
import type { DraggableEvent } from "react-draggable";
import { useAppDispatch, useAppSelector } from "../../app/hooks.ts";
import {
	setShowSmallCamera,
	setSmallCameraPositionAndSize,
	setSmallCameraScreenPosition, showSmallCameraSelector,
	smallCameraOffsetPositionSelector,
	smallCameraPositionSelector,
	smallCameraShapeSelector,
	smallCameraSizeSelector,
} from "./smallCameraViewSlice.ts";

import { mainCameraSelector, showControlsSelector, smallCameraSelector } from "../camera-view/cameraViewsSlice.ts";
import { SMALL_CAMERA_MIN_HEIGHT, SMALL_CAMERA_MIN_WIDTH } from "../../utils/constants.ts";
import { CameraView } from "../camera-view/CameraView.tsx";
import { useEffect } from "react";
import { getActualPosition } from "./smallCameraViewUtil.ts";

export type SmallCameraOpts = {
	onError: (e: Nullable<unknown>) => void;
	onCameraChange?: (device: Nullable<DeviceInfo>) => void;
	hideCamera?: boolean,
}

export const SmallCameraView = (opts: SmallCameraOpts) => {
	
	const { onError } = opts;
	const dispatch = useAppDispatch();
	const size = useAppSelector(smallCameraSizeSelector);
	const shape = useAppSelector(smallCameraShapeSelector);
	const position = useAppSelector(smallCameraPositionSelector);
	const offsetPosition = useAppSelector(smallCameraOffsetPositionSelector);
	const hideControls = !useAppSelector(showControlsSelector);
	const camera: Nullable<DeviceInfo> = useAppSelector(smallCameraSelector);
	const isSameAsMain = useAppSelector(mainCameraSelector)?.deviceId === camera?.deviceId;
	const hasSmall = camera != null;
	const showSmallCamera = useAppSelector(showSmallCameraSelector)
	
	const hide = hideControls && (!hasSmall || isSameAsMain || !showSmallCamera);
	console.log("SHowSmallCamera: " + showSmallCamera.toString()  + "; Hide: " + hide.toString());
	
	useEffect(() => {
		const onResize = () => {
			if (position) {
				// const { x: offsetX, y: offsetY } = offsetPosition;
				// const x = offsetX;
				// const y = offsetY;
				// const rawNewPos = { x, y } satisfies Position;
				// const { position: newPosition, size: newSize } = getActualPosition(rawNewPos, size);
				// console.log({
				// 	position,
				// 	statePos: {x, y},
				// 	rawNewPos,
				// 	newPosition,
				// 	size,
				// 	newSize
				// })
				console.log("position", position);
				const { position: newPosition, size: newSize } = getActualPosition(offsetPosition, size);
				dispatch(setSmallCameraPositionAndSize({ position: newPosition, size: newSize }));
			}
		};
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, [dispatch, offsetPosition, position, size]);
	
	
	const shouldDrag = (/*e: { target: Nullable<EventTarget> }*/): boolean => {
		// const target = (e.target as Nullable<HTMLElement>);
		// if (target == null) {
		// 	return false;
		// }
		// return (target.tagName !== "video" && target.closest("video") == null);
		return true;
	};
	
	const toggleSmallCamera = () => {
		dispatch(setShowSmallCamera(!showSmallCamera));
	}
	
	return (
	  <Rnd
		onDragStart={(e: DraggableEvent) => {
			if (!shouldDrag()) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		}}
		size={size}
		position={position}
		onDragStop={(_e, data) => {
			if (!shouldDrag()) {
				return;
			}
			dispatch(setSmallCameraScreenPosition({ x: data.x, y: data.y }));
		}}
		data-shape={shape}
		className={`${hide ? "hidden" : ""} small-camera-container`}
		minWidth={SMALL_CAMERA_MIN_WIDTH}
		minHeight={SMALL_CAMERA_MIN_HEIGHT}
		onResizeStop={(e, _direction, _ref, delta, position) => {
			const target = e.target as Nullable<HTMLElement>;
			if (target != null && target.tagName.toLowerCase() !== "video" && target.closest("video") === null) {
				console.log(target);
			}
			const newSize = {
				width: size.width + delta.width,
				height: size.height + delta.height,
			};
			dispatch(setSmallCameraPositionAndSize({ position, size: newSize }));
			console.log({ delta, position, size: newSize });
		}}
	  >
		  <div className={`small-camera-inner-container`}>
		  <button className={`hide-on-hide-controls hide-small-camera-button icon-button`} onClick={toggleSmallCamera}>
			  <span className={`material-symbols-outlined button-icon`}>{showSmallCamera ? "visibility" : "visibility_off"}</span>
		  </button>
		  <CameraView
			kind="small"
			onError={onError}
			camera={camera}
			onCameraChange={opts.onCameraChange}
		  ></CameraView>
		  </div>
	  </Rnd>
	)
	  ;
};