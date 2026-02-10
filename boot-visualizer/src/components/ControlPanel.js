import styles from './ControlPanel.module.css';
import { BOOT_STAGES } from '../hooks/useBootSequence';

export default function ControlPanel({ startBoot, shutdown, stage }) {
    const isPowered = stage !== BOOT_STAGES.POWER_OFF && stage !== BOOT_STAGES.FAILURE;

    return (
        <div className={styles.panel}>
            <button
                className={styles.powerBtn}
                onClick={stage === BOOT_STAGES.POWER_OFF || stage === BOOT_STAGES.FAILURE ? startBoot : shutdown}
            >
                {isPowered ? 'Power OFF' : 'Power ON'}
            </button>

            {stage === BOOT_STAGES.FAILURE && (
                <span className={styles.errorText}>System Halted. Please Restart.</span>
            )}

            <div className={styles.statusIndicator}>
                Status: <strong>{stage}</strong>
            </div>
        </div>
    );
}
