"use client";

import { useState, useEffect, useRef } from 'react';
import { playPostBeep, playErrorBeep } from '../utils/audio';

export const BOOT_STAGES = {
    POWER_OFF: 'POWER_OFF',
    POWER_ON: 'POWER_ON',
    BIOS: 'BIOS',
    VGA_INIT: 'VGA_INIT', // New VGA BIOS Init phase
    POST: 'POST',
    BOOT_DEVICE_DETECT: 'BOOT_DEVICE_DETECT',
    BOOTLOADER: 'BOOTLOADER',
    OS_INIT: 'OS_INIT',
    READY: 'READY',
    FAILURE: 'FAILURE',
    LOGGING_IN: 'LOGGING_IN', // New stage for password verification
};

export const HARDWARE = {
    NONE: 'NONE',
    CPU: 'CPU',
    RAM: 'RAM',
    GPU: 'GPU',
    STORAGE: 'STORAGE',
    NETWORK: 'NETWORK',
};

const STAGE_DELAYS = {
    [BOOT_STAGES.POWER_ON]: 1500, // +0.5s
    [BOOT_STAGES.BIOS]: 4000, // +2s (More time to read BIOS text)
    [BOOT_STAGES.VGA_INIT]: 3000, // +1.5s (See VGA info)
    [BOOT_STAGES.POST]: 5000, // +2s (Read RAM/Disk checks)
    [BOOT_STAGES.BOOT_DEVICE_DETECT]: 3000, // +1s
    [BOOT_STAGES.BOOTLOADER]: 2500, // +1s
    [BOOT_STAGES.OS_INIT]: 5000, // +1s
    [BOOT_STAGES.LOGGING_IN]: 3000,
};

const SYSTEM_OPS = {
    IDLE: 'IDLE',
    BIOS_CHECK: 'MOV AX, 0x1 (CHECK_CPU)',
    VGA_BIOS_INIT: 'INT 10h (INIT VIDEO)',
    RAM_CHECK: 'TEST MEM [0x0000-0xFFFF]',
    DISK_READ: 'INT 13h (READ SECTOR)',
    KERNEL_LOAD: 'JMP KERNEL_ENTRY',
    HASHING: 'SHA-256 (COMPUTING)',
    AUTH_CHECK: 'CMP HASH, STORED_HASH',
};

export function useBootSequence() {
    const [stage, setStage] = useState(BOOT_STAGES.POWER_OFF);
    const [logs, setLogs] = useState([]);
    const [activeComponent, setActiveComponent] = useState(HARDWARE.NONE);
    const [currentOperation, setCurrentOperation] = useState('IDLE'); // New detailed operation state
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const timerRef = useRef(null);

    const addLog = (message) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const startBoot = () => {
        if (stage !== BOOT_STAGES.POWER_OFF && stage !== BOOT_STAGES.FAILURE && stage !== BOOT_STAGES.READY) return;

        setStage(BOOT_STAGES.POWER_ON);
        setLogs([]);
        setError(null);
        setProgress(0);
        setIsLoggedIn(false);
        setCurrentOperation(SYSTEM_OPS.IDLE);
        addLog("Power Button Pressed.");
    };

    const shutdown = () => {
        clearTimeout(timerRef.current);
        setStage(BOOT_STAGES.POWER_OFF);
        setActiveComponent(HARDWARE.NONE);
        setCurrentOperation(SYSTEM_OPS.IDLE);
        setLogs([]);
        setProgress(0);
        setIsLoggedIn(false);
    };

    const login = (password) => {
        if (stage !== BOOT_STAGES.READY) return;

        addLog(`User input received. Length: ${password.length}`);
        setStage(BOOT_STAGES.LOGGING_IN);
        setCurrentOperation(SYSTEM_OPS.HASHING);
        setActiveComponent(HARDWARE.CPU);

        setTimeout(() => {
            addLog("Hashing password (SHA-256)...");
        }, 500);

        setTimeout(() => {
            setCurrentOperation(SYSTEM_OPS.AUTH_CHECK);
            setActiveComponent(HARDWARE.RAM);
            addLog("Reading stored hash from SAM...");
        }, 1500);

        setTimeout(() => {
            if (password === 'admin') { // Simple hardcoded password for demo
                addLog("Password Verified. Access Granted.");
                setIsLoggedIn(true);
                setStage(BOOT_STAGES.READY); // Go back to ready but logged in state (or new DESKTOP stage)
                setCurrentOperation(SYSTEM_OPS.IDLE);
                setActiveComponent(HARDWARE.NONE);
            } else {
                addLog("Error: Password Mismatch.");
                setError("Incorrect Password");
                setStage(BOOT_STAGES.READY);
                setCurrentOperation(SYSTEM_OPS.IDLE);
                setActiveComponent(HARDWARE.NONE);
                setTimeout(() => setError(null), 2000);
            }
        }, 3000);
    };

    useEffect(() => {
        const runStage = () => {
            switch (stage) {
                case BOOT_STAGES.POWER_ON:
                case BOOT_STAGES.POWER_ON:
                    setActiveComponent(HARDWARE.CPU);
                    setCurrentOperation(SYSTEM_OPS.BIOS_CHECK);
                    addLog("System Power ON. CPU Reset.");
                    setProgress(10);
                    timerRef.current = setTimeout(() => setStage(BOOT_STAGES.BIOS), STAGE_DELAYS[BOOT_STAGES.POWER_ON]);
                    break;

                case BOOT_STAGES.BIOS:
                    setActiveComponent(HARDWARE.CPU); // BIOS runs on CPU
                    setCurrentOperation(SYSTEM_OPS.BIOS_CHECK);
                    addLog("BIOS Initializing...");
                    addLog("Checking CPU registers...");
                    setProgress(20);
                    addLog("Checking CPU registers...");
                    setProgress(20);
                    timerRef.current = setTimeout(() => setStage(BOOT_STAGES.VGA_INIT), STAGE_DELAYS[BOOT_STAGES.BIOS]);
                    break;

                case BOOT_STAGES.VGA_INIT:
                    setActiveComponent(HARDWARE.GPU);
                    setCurrentOperation(SYSTEM_OPS.VGA_BIOS_INIT);
                    addLog("Initializing Video Adapter (VGA BIOS)...");
                    setProgress(25);
                    timerRef.current = setTimeout(() => {
                        addLog("Video Output Enagled.");
                        setStage(BOOT_STAGES.POST);
                    }, STAGE_DELAYS[BOOT_STAGES.VGA_INIT]);
                    break;

                case BOOT_STAGES.POST:
                    setActiveComponent(HARDWARE.RAM);
                    setCurrentOperation(SYSTEM_OPS.RAM_CHECK);
                    addLog("POST: Checking Memory (RAM)...");
                    setProgress(30);

                    // Simulate random failure (10% chance)
                    // For now, let's keep it successful mostly, maybe add a toggle later
                    const isFailure = Math.random() < 0.1;

                    timerRef.current = setTimeout(() => {
                        if (isFailure) {
                            setStage(BOOT_STAGES.FAILURE);
                            setError("POST Error: Memory Check Failed!");
                            addLog("ERROR: POST Failure detected.");
                            playErrorBeep();
                        } else {
                            addLog("POST: Memory OK.");
                            playPostBeep();
                            addLog("POST: Checking Peripherals...");
                            setStage(BOOT_STAGES.BOOT_DEVICE_DETECT);
                        }
                    }, STAGE_DELAYS[BOOT_STAGES.POST]);
                    break;

                case BOOT_STAGES.BOOT_DEVICE_DETECT:
                    setActiveComponent(HARDWARE.STORAGE);
                    setCurrentOperation(SYSTEM_OPS.DISK_READ);
                    addLog("Scanning for boot devices...");
                    setProgress(50);
                    timerRef.current = setTimeout(() => {
                        addLog("Boot device found: Virtual SSD (512GB).");
                        setStage(BOOT_STAGES.BOOTLOADER);
                    }, STAGE_DELAYS[BOOT_STAGES.BOOT_DEVICE_DETECT]);
                    break;

                case BOOT_STAGES.BOOTLOADER:
                    setActiveComponent(HARDWARE.RAM); // Loading into RAM
                    setCurrentOperation(SYSTEM_OPS.KERNEL_LOAD);
                    addLog("Loading Bootloader...");
                    setProgress(65);
                    timerRef.current = setTimeout(() => {
                        addLog("GRUB Loading kernel...");
                        setStage(BOOT_STAGES.OS_INIT);
                    }, STAGE_DELAYS[BOOT_STAGES.BOOTLOADER]);
                    break;

                case BOOT_STAGES.OS_INIT:
                    setActiveComponent(HARDWARE.CPU); // heavy processing
                    setCurrentOperation(SYSTEM_OPS.KERNEL_LOAD);
                    addLog("Initializing Operating System...");
                    addLog("Loading drivers...");
                    setProgress(85);
                    timerRef.current = setTimeout(() => {
                        addLog("System Services started.");
                        setStage(BOOT_STAGES.READY);
                        setProgress(100);
                    }, STAGE_DELAYS[BOOT_STAGES.OS_INIT]);
                    break;

                case BOOT_STAGES.READY:
                case BOOT_STAGES.READY:
                    setActiveComponent(HARDWARE.NONE);
                    setCurrentOperation(SYSTEM_OPS.IDLE);
                    if (!isLoggedIn) {
                        addLog("System Ready. Login required.");
                    }
                    break;

                case BOOT_STAGES.FAILURE:
                    setActiveComponent(HARDWARE.NONE);
                    // Stay in failure until reset
                    break;

                default:
                    break;
            }
        };

        if (stage !== BOOT_STAGES.POWER_OFF) {
            runStage();
        }

        return () => clearTimeout(timerRef.current);
    }, [stage]);

    return {
        stage,
        logs,
        activeComponent,
        error,
        progress,
        currentOperation,
        isLoggedIn,
        login,
        startBoot,
        shutdown
    };
}
