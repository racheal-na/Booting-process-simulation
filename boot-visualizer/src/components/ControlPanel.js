import styles from './ControlPanel.module.css';
import { BOOT_STAGES } from '../hooks/useBootSequence';

export default function ControlPanel({ startBoot, shutdown, stage, speedMultiplier, setSpeedMultiplier }) {
    const isPowered = stage !== BOOT_STAGES.POWER_OFF && stage !== BOOT_STAGES.FAILURE;

    return (
        <div className={styles.panel}>
            <button
                className={styles.powerBtn}
                onClick={stage === BOOT_STAGES.POWER_OFF || stage === BOOT_STAGES.FAILURE ? startBoot : shutdown}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
                {isPowered ? 'Power OFF' : 'Power ON'}
            </button>

            <div className={styles.controls}>
                <label className={styles.label}>
                    Boot Speed: {speedMultiplier}x
                    <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.5"
                        value={speedMultiplier}
                        onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                </label>
                <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '5px' }}>
                    (Higher = Slower)
                </span>
            </div>

            {stage === BOOT_STAGES.FAILURE && (
                <span className={styles.errorText}>System Halted. Please Restart.</span>
            )}

            <div className={styles.statusIndicator}>
                Status: <strong>{stage}</strong>
            </div>
        </div>
    );
}
