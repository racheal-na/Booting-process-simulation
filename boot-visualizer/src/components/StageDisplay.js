import styles from './StageDisplay.module.css';
import { BOOT_STAGES } from '../hooks/useBootSequence';

export default function StageDisplay({ stage, progress, logs, onLogin, isLoggedIn }) {
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
                        {logs.filter(l => l.includes('POST')).map((log, i) => <p key={i}>{log}</p>)}
                    </div>
                )}

                {(stage === BOOT_STAGES.BOOT_DEVICE_DETECT || stage === BOOT_STAGES.BOOTLOADER) && (
                    <div className={styles.consoleScreen}>
                        <p>&gt; Scanning for boot devices...</p>
                        <p>&gt; Found: Virtual SSD</p>
                        <p>&gt; Loading Boot_Manager.efi...</p>
                        <div className={styles.loaderLine}></div>
                    </div>
                )}

                {stage === BOOT_STAGES.OS_INIT && (
                    <div className={styles.osLoading}>
                        <div className={styles.logo}>⊞</div>
                        <div className={styles.spinnerCircle}></div>
                        <p>Starting Windows...</p>
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
            <div className={styles.stand}></div>
        </div>
    );
}
