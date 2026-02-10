import { HARDWARE } from '../hooks/useBootSequence';
import styles from './MotherboardDiagram.module.css';

export default function MotherboardDiagram({ activeComponent, currentOperation }) {
    const isActive = (component) => activeComponent === component ? styles.active : '';

    return (
        <div className={styles.motherboardContainer}>
            <div className={styles.operationDisplay}>
                <span className={styles.opLabel}>OP:</span> {currentOperation || 'IDLE'}
            </div>

            <div className={styles.motherboard}>
                <div className={`${styles.bus} ${styles.busCpuRam} ${activeComponent === 'RAM' || activeComponent === 'CPU' ? styles.busActive : ''}`}></div>
                <div className={`${styles.bus} ${styles.busCpuGpu} ${activeComponent === 'GPU' ? styles.busActive : ''}`}></div>
                <div className={`${styles.bus} ${styles.busRamStorage} ${activeComponent === 'STORAGE' ? styles.busActive : ''}`}></div>

                {/* Video Output Cable */}
                <div className={`${styles.videoCable} ${activeComponent === 'GPU' ? styles.videoActive : ''}`}></div>

                <div className={`${styles.component} ${styles.cpu} ${isActive(HARDWARE.CPU)}`}>
                    <span>CPU</span>
                </div>
                <div className={`${styles.component} ${styles.ram} ${isActive(HARDWARE.RAM)}`}>
                    <span>RAM</span>
                </div>
                <div className={`${styles.component} ${styles.gpu} ${isActive(HARDWARE.GPU)}`}>
                    <span>GPU</span>
                </div>
                <div className={`${styles.component} ${styles.storage} ${isActive(HARDWARE.STORAGE)}`}>
                    <span>SSD/HDD</span>
                </div>
            </div>
        </div>
    );
}
