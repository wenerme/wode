import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export const TimeParserTool: React.FC = () => {
    const [input, setInput] = useState('');
    const [parsed, setParsed] = useState<dayjs.Dayjs | null>(null);
    const [now, setNow] = useState(dayjs());

    useEffect(() => {
        const timer = setInterval(() => setNow(dayjs()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!input) {
            setParsed(null);
            return;
        }

        let d = dayjs(input);
        // Handle unix timestamp (seconds or ms)
        if (/^\d+$/.test(input)) {
            const num = parseInt(input, 10);
            // Guess if seconds or ms based on length (10 digits usually seconds, 13 ms)
            if (input.length === 10) {
                d = dayjs.unix(num);
            } else {
                d = dayjs(num);
            }
        }

        if (d.isValid()) {
            setParsed(d);
        } else {
            setParsed(null);
        }
    }, [input]);

    const displayDate = parsed || now;
    const isCurrent = !parsed;

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            <div className="prose">
                <h2>Time Parser</h2>
                <p>Parse timestamps, dates, and view current time information.</p>
            </div>

            <div className="form-control w-full max-w-lg">
                <label className="label">
                    <span className="label-text">Input Date/Time/Timestamp (Empty for Now)</span>
                </label>
                <input
                    type="text"
                    placeholder="e.g. 2023-01-01, 1672531200, or empty"
                    className="input input-bordered w-full"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="stats shadow bg-base-200 vertical">
                    <div className="stat">
                        <div className="stat-title">ISO 8601</div>
                        <div className="stat-value text-lg font-mono break-all">{displayDate.toISOString()}</div>
                        <div className="stat-desc">Standard format</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Local Time</div>
                        <div className="stat-value text-lg font-mono break-all">{displayDate.format('YYYY-MM-DD HH:mm:ss Z')}</div>
                        <div className="stat-desc">Your browser's timezone</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-200 vertical">
                    <div className="stat">
                        <div className="stat-title">Unix Timestamp (Seconds)</div>
                        <div className="stat-value text-lg font-mono">{displayDate.unix()}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Unix Timestamp (Milliseconds)</div>
                        <div className="stat-value text-lg font-mono">{displayDate.valueOf()}</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-200 vertical">
                    <div className="stat">
                        <div className="stat-title">Relative</div>
                        <div className="stat-value text-lg">{displayDate.fromNow()}</div>
                        <div className="stat-desc">From current time</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">UTC</div>
                        <div className="stat-value text-lg font-mono break-all">{displayDate.utc().format('YYYY-MM-DD HH:mm:ss')} UTC</div>
                    </div>
                </div>
            </div>

            {isCurrent && (
                <div className="alert alert-info shadow-sm">
                    <span>Showing current time (updates live). Enter a value to parse specific time.</span>
                </div>
            )}
        </div>
    );
};
