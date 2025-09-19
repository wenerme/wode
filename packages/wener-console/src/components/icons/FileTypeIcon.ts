import type { ComponentType } from 'react';
import {
	PiBinary,
	PiDatabase,
	PiFileArchive,
	PiFileAudio,
	PiFileCode,
	PiFileImage,
	PiFileLight,
	PiFileLock,
	PiFileText,
	PiFileVideo,
	PiFolderLight,
	PiPresentation,
	PiTable,
	PiTextAa,
} from 'react-icons/pi';

export const FileTypeIcon = {
	//
	lock: PiFileLock,
	text: PiFileText,
	code: PiFileCode,
	//
	audio: PiFileAudio,
	video: PiFileVideo,
	archive: PiFileArchive,
	image: PiFileImage,
	file: PiFileLight,
	directory: PiFolderLight,
	pdf: PiFileText,
	sheet: PiTable,
	doc: PiFileText,
	slide: PiPresentation,
	database: PiDatabase,
	font: PiTextAa,
	executable: PiBinary,
} as const satisfies Record<string, ComponentType<any>>;
