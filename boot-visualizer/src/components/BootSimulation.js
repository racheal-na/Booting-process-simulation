"use client";

import { useBootSequence } from '../hooks/useBootSequence';
import MotherboardDiagram from './MotherboardDiagram';
import StageDisplay from './StageDisplay';
import ControlPanel from './ControlPanel';

export default function BootSimulation() {
    const {
        stage,
        logs,
        activeComponent,
        error,
        progress,
        currentOperation,
        isLoggedIn,
        speedMultiplier,
        setSpeedMultiplier,
        login,
        startBoot,
        shutdown
    } = useBootSequence();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <h1>Boot Process Visualizer</h1>

            <ControlPanel
                startBoot={startBoot}
                shutdown={shutdown}
                stage={stage}
                speedMultiplier={speedMultiplier}
                setSpeedMultiplier={setSpeedMultiplier}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h3>Hardware Monitor</h3>
                    <MotherboardDiagram activeComponent={activeComponent} currentOperation={currentOperation} />

                    <div style={{ marginTop: '20px', background: 'rgba(0, 0, 0, 0.6)', padding: '10px', borderRadius: '5px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #444', color: '#ccc' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>System Log</h4>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', fontFamily: 'Consolas, monospace' }}>
                            {logs.map((log, i) => <li key={i} style={{ borderBottom: '1px solid #333', padding: '2px 0' }}>{log}</li>)}
                        </ul>
                    </div>
                </div>

                <div>
                    <h3>Display Output</h3>
                    <StageDisplay stage={stage} progress={progress} logs={logs} onLogin={login} isLoggedIn={isLoggedIn} />
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '30px' }}>
                <div style={{ background: '#ddd', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, background: '#2ecc71', height: '100%', transition: 'width 0.5s ease' }}></div>
                </div>
                <p style={{ textAlign: 'right', fontSize: '12px', color: '#777' }}>System Progress: {progress}%</p>
            </div>
        </div>
    );
}
