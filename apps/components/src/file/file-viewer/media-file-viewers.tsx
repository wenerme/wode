'use client';

import { AlertTriangle, Download, ExternalLink, FileQuestion, ImageIcon } from 'lucide-react';
import type { ComponentPropsWithRef, SyntheticEvent } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FileViewerFileDescriptor, FileViewerMessages } from './file-viewer-types';
import { formatFileViewerBytes, formatFileViewerDate, mergeFileViewerMessages } from './file-viewer-types';

export type ImageFileViewerProps = Omit<ComponentPropsWithRef<'figure'>, 'children'> & {
	file: FileViewerFileDescriptor;
	src: string;
	alt?: string;
	imageProps?: Omit<ComponentPropsWithRef<'img'>, 'alt' | 'src'>;
	messages?: Partial<FileViewerMessages>;
	downloadHref?: string;
	onDownload?: (file: FileViewerFileDescriptor) => void;
};

export function ImageFileViewer({
	alt,
	className,
	downloadHref,
	file,
	imageProps,
	messages: messageOverrides,
	onDownload,
	src,
	...props
}: ImageFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const [dimensions, setDimensions] = useState<{ height: number; src: string; width: number }>();
	const [failedSrc, setFailedSrc] = useState<string>();
	const currentDimensions = dimensions?.src === src ? dimensions : undefined;
	const failed = failedSrc === src;
	const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
		const image = event.currentTarget;
		setDimensions({ height: image.naturalHeight, src, width: image.naturalWidth });
		setFailedSrc(undefined);
		imageProps?.onLoad?.(event);
	};
	const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
		setFailedSrc(src);
		imageProps?.onError?.(event);
	};
	return (
		<figure
			data-slot='image-file-viewer'
			className={cn('bg-base-200 flex min-h-64 min-w-0 flex-col', className)}
			{...props}
		>
			<div className='grid min-h-0 flex-1 place-items-center overflow-auto p-3'>
				{failed ? (
					<MediaErrorFallback
						downloadHref={downloadHref ?? src}
						file={file}
						messages={messages}
						onDownload={onDownload}
					/>
				) : (
					<img
						alt={alt ?? messages.imageAlt(file)}
						{...imageProps}
						className={cn('max-h-full max-w-full object-contain', imageProps?.className)}
						src={src}
						onError={handleError}
						onLoad={handleLoad}
					/>
				)}
			</div>
			<figcaption className='border-base-300 text-base-content/65 flex min-h-8 items-center gap-2 border-t px-3 text-xs'>
				<ImageIcon aria-hidden='true' className='size-4 shrink-0' />
				<span className='min-w-0 flex-1 truncate'>{file.name}</span>
				{currentDimensions ? (
					<span className='shrink-0'>{messages.dimensions(currentDimensions.width, currentDimensions.height)}</span>
				) : null}
			</figcaption>
		</figure>
	);
}

export type PdfFileViewerProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	file: FileViewerFileDescriptor;
	src: string;
	messages?: Partial<FileViewerMessages>;
	objectProps?: Omit<ComponentPropsWithRef<'object'>, 'children' | 'data' | 'type'>;
	downloadHref?: string;
	onDownload?: (file: FileViewerFileDescriptor) => void;
};

export function PdfFileViewer({
	className,
	downloadHref,
	file,
	messages: messageOverrides,
	objectProps,
	onDownload,
	src,
	...props
}: PdfFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const [failedSrc, setFailedSrc] = useState<string>();
	const failed = failedSrc === src;
	const resolvedDownloadHref = downloadHref ?? src;
	return (
		<div data-slot='pdf-file-viewer' className={cn('bg-base-100 flex min-h-96 min-w-0 flex-col', className)} {...props}>
			{failed ? (
				<MediaErrorFallback
					className='flex-1'
					downloadHref={resolvedDownloadHref}
					file={file}
					messages={messages}
					onDownload={onDownload}
				/>
			) : (
				<object
					aria-label={objectProps?.['aria-label'] ?? messages.pdfLabel(file)}
					{...objectProps}
					className={cn('min-h-96 w-full flex-1', objectProps?.className)}
					data={src}
					onError={(event) => {
						setFailedSrc(src);
						objectProps?.onError?.(event);
					}}
					type='application/pdf'
				>
					<div className='grid min-h-64 place-items-center p-6 text-center text-sm'>
						<div>
							<p>{messages.pdfFallback}</p>
							<FileViewerDownloadAction
								className='mt-3'
								downloadHref={resolvedDownloadHref}
								file={file}
								messages={messages}
								onDownload={onDownload}
							/>
						</div>
					</div>
				</object>
			)}
			<div className='border-base-300 flex min-h-10 shrink-0 items-center justify-end gap-2 border-t px-3 py-1.5'>
				<a className='btn btn-ghost btn-sm' href={src} target='_blank' rel='noreferrer'>
					<ExternalLink aria-hidden='true' className='size-4' />
					{messages.openInNewWindow}
				</a>
				<FileViewerDownloadAction
					downloadHref={resolvedDownloadHref}
					file={file}
					messages={messages}
					onDownload={onDownload}
				/>
			</div>
		</div>
	);
}

export type AudioFileViewerProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	file: FileViewerFileDescriptor;
	src: string;
	audioProps?: Omit<ComponentPropsWithRef<'audio'>, 'children' | 'src'>;
	messages?: Partial<FileViewerMessages>;
	downloadHref?: string;
	onDownload?: (file: FileViewerFileDescriptor) => void;
};

export function AudioFileViewer({
	audioProps,
	className,
	downloadHref,
	file,
	messages: messageOverrides,
	onDownload,
	src,
	...props
}: AudioFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const [failedSrc, setFailedSrc] = useState<string>();
	if (failedSrc === src) {
		return (
			<div data-slot='audio-file-viewer' className={cn('bg-base-100 min-h-40 min-w-0', className)} {...props}>
				<MediaErrorFallback
					downloadHref={downloadHref ?? src}
					file={file}
					messages={messages}
					onDownload={onDownload}
				/>
			</div>
		);
	}
	return (
		<div
			data-slot='audio-file-viewer'
			className={cn('bg-base-100 grid min-h-40 min-w-0 place-items-center p-5', className)}
			{...props}
		>
			<audio
				aria-label={audioProps?.['aria-label'] ?? messages.audioLabel(file)}
				preload='metadata'
				{...audioProps}
				controls
				className={cn('w-full max-w-2xl', audioProps?.className)}
				onError={(event) => {
					setFailedSrc(src);
					audioProps?.onError?.(event);
				}}
				src={src}
			/>
		</div>
	);
}

export type VideoFileViewerProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	file: FileViewerFileDescriptor;
	src: string;
	messages?: Partial<FileViewerMessages>;
	videoProps?: Omit<ComponentPropsWithRef<'video'>, 'children' | 'src'>;
	downloadHref?: string;
	onDownload?: (file: FileViewerFileDescriptor) => void;
};

export function VideoFileViewer({
	className,
	downloadHref,
	file,
	messages: messageOverrides,
	onDownload,
	src,
	videoProps,
	...props
}: VideoFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const [failedSrc, setFailedSrc] = useState<string>();
	if (failedSrc === src) {
		return (
			<div data-slot='video-file-viewer' className={cn('bg-neutral min-h-64 min-w-0', className)} {...props}>
				<MediaErrorFallback
					className='text-neutral-content'
					downloadHref={downloadHref ?? src}
					file={file}
					messages={messages}
					onDownload={onDownload}
				/>
			</div>
		);
	}
	return (
		<div
			data-slot='video-file-viewer'
			className={cn('bg-neutral grid min-h-64 min-w-0 place-items-center overflow-hidden', className)}
			{...props}
		>
			<video
				aria-label={videoProps?.['aria-label'] ?? messages.videoLabel(file)}
				preload='metadata'
				{...videoProps}
				controls
				className={cn('max-h-[70vh] w-full object-contain', videoProps?.className)}
				onError={(event) => {
					setFailedSrc(src);
					videoProps?.onError?.(event);
				}}
				src={src}
			/>
		</div>
	);
}

type FileViewerDownloadProps = {
	className?: string;
	downloadHref?: string;
	file: FileViewerFileDescriptor;
	messages: FileViewerMessages;
	onDownload?: (file: FileViewerFileDescriptor) => void;
};

function MediaErrorFallback({ className, ...props }: FileViewerDownloadProps) {
	return (
		<div role='alert' className={cn('grid min-h-40 place-items-center p-5 text-center text-sm', className)}>
			<div>
				<AlertTriangle aria-hidden='true' className='mx-auto mb-2 size-5' />
				<p>{props.messages.mediaLoadFailed(props.file)}</p>
				<FileViewerDownloadAction className='mt-3' {...props} />
			</div>
		</div>
	);
}

function FileViewerDownloadAction({ className, downloadHref, file, messages, onDownload }: FileViewerDownloadProps) {
	if (onDownload) {
		return (
			<button type='button' className={cn('btn btn-primary btn-sm', className)} onClick={() => onDownload(file)}>
				<Download aria-hidden='true' className='size-4' />
				{messages.download}
			</button>
		);
	}
	if (!downloadHref) return null;
	return (
		<a className={cn('btn btn-primary btn-sm', className)} href={downloadHref} download={file.name}>
			<Download aria-hidden='true' className='size-4' />
			{messages.download}
		</a>
	);
}

export type UnsupportedFileViewerProps = Omit<ComponentPropsWithRef<'section'>, 'children'> & {
	file: FileViewerFileDescriptor;
	downloadHref?: string;
	messages?: Partial<FileViewerMessages>;
	onDownload?: (file: FileViewerFileDescriptor) => void;
};

export function UnsupportedFileViewer({
	className,
	downloadHref,
	file,
	messages: messageOverrides,
	onDownload,
	...props
}: UnsupportedFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const metadata = [
		[messages.fileName, file.name],
		[messages.mimeType, file.mimeType || '—'],
		[messages.fileSize, formatFileViewerBytes(file.size)],
		[messages.lastModified, formatFileViewerDate(file.lastModified)],
	] as const;
	return (
		<section
			data-slot='unsupported-file-viewer'
			className={cn('bg-base-100 grid min-h-64 min-w-0 place-items-center p-5', className)}
			{...props}
		>
			<div className='w-full max-w-lg text-center'>
				<div className='bg-base-200 mx-auto grid size-11 place-items-center rounded-full'>
					<FileQuestion aria-hidden='true' className='size-5' />
				</div>
				<h2 className='mt-3 text-sm font-semibold'>{messages.unsupportedTitle}</h2>
				<p className='text-base-content/65 mt-1 text-xs leading-5'>{messages.unsupportedDescription}</p>
				<dl className='border-base-300 mt-4 border-y text-left text-xs'>
					{metadata.map(([label, value]) => (
						<div
							key={label}
							className='border-base-300 grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-b py-2 last:border-b-0'
						>
							<dt className='text-base-content/60'>{label}</dt>
							<dd className='min-w-0 text-right break-words'>{value}</dd>
						</div>
					))}
				</dl>
				{downloadHref ? (
					<a className='btn btn-primary btn-sm mt-4' href={downloadHref} download={file.name}>
						<Download aria-hidden='true' className='size-4' />
						{messages.download}
					</a>
				) : onDownload ? (
					<button type='button' className='btn btn-primary btn-sm mt-4' onClick={() => onDownload(file)}>
						<Download aria-hidden='true' className='size-4' />
						{messages.download}
					</button>
				) : null}
			</div>
		</section>
	);
}
