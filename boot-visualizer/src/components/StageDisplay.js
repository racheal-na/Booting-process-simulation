import styles from './StageDisplay.module.css';
import { useEffect, useRef } from 'react';
import { BOOT_STAGES } from '../hooks/useBootSequence';

export default function StageDisplay({ stage, progress, logs, onLogin, isLoggedIn }) {
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, stage]);

    const formatLog = (log) => {
        if (log.includes("[  OK  ]")) {
            const parts = log.split("]");
            return (
                <span>
                    <span className={styles.logSuccess}>{parts[0]}]</span>
                    <span className={styles.logInfo}>{parts.slice(1).join("]")}</span>
                </span>
            );
        }
        const timeMatch = log.match(/^\[\s*\d+\.\d+\]/);
        if (timeMatch) {
            const timestamp = timeMatch[0];
            const message = log.substring(timestamp.length);
            return (
                <span>
                    <span className={styles.logTime}>{timestamp}</span>
                    <span className={styles.logInfo}>{message}</span>
                </span>
            );
        }
        return <span className={styles.logInfo}>{log}</span>;
    };

    if (stage === BOOT_STAGES.POWER_OFF) {
        return (
            <div className={styles.screenOff}>
                <p>System is Powered Off</p>
            </div>
        );
    }

    return (
        <div className={styles.monitorFrame}>
            <div className={styles.screen}>
                <div className={styles.screenContent}>
                    {stage === BOOT_STAGES.BIOS && (
                        <div className={styles.biosScreen}>
                            <h2>BIOS SETUP UTILITY</h2>
                            <hr />
                            <p>CPU Model: Virtual CPU @ 3.5GHz</p>
                            <p>Memory: 16384 MB</p>
                            <p>Checking System Health...</p>
                            <div className={styles.spinner}>/</div>
                        </div>
                    )}

                    {stage === BOOT_STAGES.VGA_INIT && (
                        <div className={styles.vgaInit}>
                            <div className={styles.colorBars}></div>
                            <p style={{ position: 'absolute', bottom: '20px', left: '20px', fontFamily: 'monospace' }}>
                                VGA BIOS v1.0 <br />
                                NVIDIA Virtual Graphics Adapter <br />
                                64MB VRAM OK
                            </p>
                        </div>
                    )}

                    {stage === BOOT_STAGES.POST && (
                        <div className={styles.consoleScreen}>
                            {logs.filter(l => !l.includes('POST')).map((log, i) => <p key={i} className={styles.logLine}>{log}</p>)}
                            {/* Blinking Cursor at the end */}
                            <span className={styles.cursor}>_</span>
                        </div>
                    )}

                    {stage === BOOT_STAGES.BOOT_DEVICE_DETECT && (
                        <div className={styles.consoleScreen}>
                            <p>&gt; Scanning for boot devices...</p>
                            <p>&gt; Found: Virtual SSD</p>
                            <p>&gt; Loading Boot_Manager.efi...</p>
                            <div className={styles.loaderLine}></div>
                        </div>
                    )}

                    {stage === BOOT_STAGES.BOOTLOADER && (
                        <div className={styles.grubScreen}>
                            <div className={styles.grubTitle}>GNU GRUB  version 2.06</div>
                            <div className={styles.grubBox}>
                                <div className={styles.grubItemActive}>*Ubuntu</div>
                                <div className={styles.grubItem}>Advanced options for Ubuntu</div>
                                <div className={styles.grubItem}>Memory test (memtest86+)</div>
                                <div className={styles.grubItem}>Windows Boot Manager (on /dev/sda1)</div>
                            </div>
                            <div className={styles.grubFooter}>
                                <p>Use the &#8593; and &#8595; keys to select which entry is highlighted.</p>
                                <p>Press enter to boot the selected OS, 'e' to edit the commands before booting or 'c' for a command-line.</p>
                                <p>The highlighted entry will be executed automatically in 2s.</p>
                            </div>
                        </div>
                    )}

                    {stage === BOOT_STAGES.OS_INIT && (
                        <div className={styles.osLoading}>
                            {logs.map((log, i) => (
                                <div key={i} className={styles.logLine}>
                                    {formatLog(log)}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}

                    {stage === BOOT_STAGES.READY && !isLoggedIn && (
                        <div className={styles.loginScreen}>
                            <div className={styles.userAvatar}></div>
                            <h3>User</h3>
                            <form onSubmit={(e) => { e.preventDefault(); onLogin(e.target.password.value); }}>
                                <input name="password" type="password" placeholder="Password (admin)" autoFocus />
                                <button type="submit">→</button>
                            </form>
                        </div>
                    )}

                    {stage === BOOT_STAGES.LOGGING_IN && (
                        <div className={styles.loginScreen}>
                            <div className={styles.userAvatar}></div>
                            <h3>Verifying...</h3>
                            <div className={styles.spinnerCircle}></div>
                        </div>
                    )}

                    {stage === BOOT_STAGES.READY && isLoggedIn && (
                        <div className={styles.desktop}>
                            <h1>Welcome</h1>
                            <p>System Operational.</p>
                        </div>
                    )}

                    {stage === BOOT_STAGES.FAILURE && (
                        <div className={styles.bsod}>
                            <h1>:(</h1>
                            <p>Your PC ran into a problem.</p>
                            <p>Stop Code: CRITICAL_PROCESS_DIED</p>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.stand}></div>
        </div>
    );
}
