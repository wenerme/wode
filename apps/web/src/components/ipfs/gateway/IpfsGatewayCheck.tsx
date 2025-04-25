'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@wener/console/daisy';
import { useSnapshot } from 'valtio';
import { FootNote } from '@/components/FootNote';
import { FootNoteLink } from '@/components/FootNoteLink';
import { useIpfsGatewayState } from '../gateway';
import { checkGateways, compareCheckState, OnScriptloaded, type GatewayCheckNodeState } from './checker';
import { getIpfsPublicGateways } from './getIpfsPublicGateways';

const gateways = getIpfsPublicGateways();

export const IpfsGatewayCheck = () => {
	const abortRef = useRef<AbortController>();
	const [checks, setChecks] = useState<GatewayCheckNodeState[]>([]);
	const gatewayState = useIpfsGatewayState();
	const { prefer } = useSnapshot(gatewayState);
	useEffect(() => {
		(window as any).OnScriptloaded = OnScriptloaded;
	}, []);

	useEffect(() => {
		abortRef.current?.abort();
		let abort: AbortController | undefined;
		try {
			abort = new AbortController();
		} catch (e) {
			// ignore
		}
		abortRef.current = abort;

		abort?.signal?.addEventListener('abort', () => {
			console.log(`Abort checking`);
		});

		void checkGateways(gateways, setChecks, { signal: abort?.signal }).then((v) => {
			if (!abort?.signal?.aborted) {
				gatewayState.prefer = v[0].gateway;
			}
		});

		return () => {
			abort?.abort();
		};
	}, [gateways]);

	return (
		<div className={'flex flex-col gap-2 p-2'}>
			<h2 className={'text-xl font-bold'}>IPFS 公共网关检测</h2>
			<div className={'flex items-center gap-2'}>
				<div className='badge badge-info badge-lg'>
					{checks.filter((v) => v.endTime).length}/{checks.length} 测试
				</div>
				<div className='badge badge-success badge-lg'>
					{checks.filter((v) => v.status.status === 'success').length} 在线
				</div>
				<div>{stateEmoji(checks.find((v) => !v.endTime) ? 'running' : 'success')}</div>
				<div>当前偏好网关 {prefer}</div>
			</div>

			<table className={'monospace hover table-zebra table'}>
				<thead>
					<tr>
						<th>Online</th>
						<th>CORS</th>
						<th>Origin</th>
						<th>Hostname / 主机名</th>
						<th>ΔT</th>
					</tr>
				</thead>
				<tbody>
					{Array.from(checks)
						.sort(compareCheckState)
						.map(({ gateway, hostname, status, cors, origin }) => (
							<tr key={gateway}>
								<td title={latency(cors)}>{stateEmoji(status.status)}</td>
								<td title={latency(cors)}>{stateEmoji(cors.status)}</td>
								<td>{stateEmoji(origin.status)}</td>
								<td>
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<div>{hostname}</div>
										<div>
											<span>{gateway}</span>
											<span>
												<Button
													ghost
													intent={'primary'}
													size={'sm'}
													disabled={prefer === gateway}
													onClick={() => (gatewayState.prefer = gateway)}
												>
													使用
												</Button>
											</span>
										</div>
									</div>
								</td>
								<td>{latency(status)}</td>
							</tr>
						))}
				</tbody>
			</table>

			<FootNote>
				基础检测逻辑和网关列表来源于
				<FootNoteLink href='https://github.com/ipfs/public-gateway-checker'>ipfs/public-gateway-checker</FootNoteLink>。
				扩展了部分额外的异常检测。
			</FootNote>
		</div>
	);
};

function latency({ startTime, endTime }: { startTime: number; endTime: number }) {
	if (isFinite(endTime)) {
		return ((endTime - startTime) / 1000).toFixed(2) + ' s';
	}
	return '';
}

function stateEmoji(s: string) {
	switch (s) {
		case 'new':
			return '🆕';
		case 'running':
			return '🕑';
		case 'error':
			return '❌';
		case 'success':
			return '✅';
		default:
			return s;
	}
}

export default IpfsGatewayCheck;
