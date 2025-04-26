declare type Nullable<T> = T | undefined | null;


declare type Size = {
	width: number;
	height: number;
}

declare type Position = {
	x: number;
	y: number;
}

declare type CameraKind = "main" | "small"

declare type CameraShape = "rect" | "circle";

declare type SmallCameraSlice = {
	showSmallCamera: boolean;
	smallCameraShape: CameraShape;
	smallCameraSize: Size;
	smallCameraScreenPosition?: Position;
	smallCameraOffsetPosition: Position;
}

declare type DeviceInfo = {
	deviceId: string;
	label: string;
	tick?: number;
	flipped?: boolean;
}

declare type AppStream = {
	stream: MediaStream;
	name: string;
	index: number;
}