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

const KERNEL_LOGS = [
    "[    0.000000] Linux version 6.5.0-generic (buildd@lcy02-amd64-001) (gcc version 12.2.0)",
    "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.5.0-generic root=/dev/mapper/vg0-root ro quiet splash",
    "[    0.004000] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'",
    "[    0.004000] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'",
    "[    0.004000] x86/fpu: Enabled xstate features 0x2e7, context size is 2440 bytes, using 'compacted' format.",
    "[    0.006000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable",
    "[    0.006000] BIOS-e820: [mem 0x000000000009fc00-0x000000000009ffff] reserved",
    "[    0.012000] Console: colour VGA+ 80x25",
    "[    0.012000] console [tty0] enabled",
    "[    0.014000] ACPI: Core revision 20221020",
    "[    0.020000] APIC: Switch to symmetric I/O mode setup",
    "[    0.150000] Freeing SMP alternatives memory: 36K",
    "[    0.160000] smpboot: CPU0: Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz (family: 0x6, model: 0x8e, stepping: 0xa)",
    "[    0.200000] Performance Events: PEBS fmt4+, IvyBridge events, 32-deep LBR, full-width counters, Intel PMU driver.",
    "[    0.250000] NMI watchdog: Enabled. Permanently consumes one hw-PMU counter.",
    "[    0.300000] smp: Bringing up secondary CPUs ...",
    "[    0.310000] x86: Booting SMP configuration:",
    "[    0.320000] .... node  #0, CPUs:      #1 #2 #3",
    "[    0.400000] smp: Brought up 1 node, 4 CPUs",
    "[    0.450000] TCP: Hash tables configured (established 262144 bind 65536)",
    "[    0.500000] PCI: Using ACPI for IRQ routing",
    "[    0.550000] PCI: pci_cache_line_size set to 64 bytes",
    "[    0.600000] e1000e 0000:00:1f.6 eth0: (PCI Express:2.5GT/s:Width x1) 00:0c:29:4b:65:43",
    "[    0.650000] e1000e 0000:00:1f.6 eth0: Intel(R) PRO/1000 Network Connection",
    "[    0.660000] e1000e 0000:00:1f.6 eth0: MAC: 12, PHY: 12, PBA: No",
    "[    0.700000] input: AT Translated Set 2 keyboard as /devices/platform/i8042/serio0/input/input0",
    "[    0.750000] rtc_cmos 00:01: RTC can wake from S4",
    "[    0.800000] usb 1-1: new high-speed USB device number 2 using xhci_hcd",
    "[    0.900000] hub 1-1:1.0: USB hub found",
    "[    1.000000] EXT4-fs (dm-0): mounted filesystem with ordered data mode. Opts: (null)",
    "[    1.100000] systemd[1]: Inserted module 'autofs4'",
    "[    1.200000] systemd[1]: Detected architecture x86-64.",
    "[  OK  ] Started Dispatch Password Requests to Console Directory Watch.",
    "[  OK  ] Reached target Local Encrypted Volumes.",
    "[  OK  ] Reached target Paths.",
    "[  OK  ] Reached target Remote File Systems.",
    "[  OK  ] Reached target Slices.",
    "[  OK  ] Reached target Swap.",
    "[  OK  ] Listening on Journal Socket.",
    "[  OK  ] Listening on udev Control Socket.",
    "[  OK  ] Listening on udev Kernel Socket.",
    "[  OK  ] Mounted Huge Pages File System.",
    "[  OK  ] Mounted POSIX Message Queue File System.",
    "[  OK  ] Mounted Kernel Debug File System.",
    "[  OK  ] Started Remount Root and Kernel File Systems.",
    "[  OK  ] Started Apply Kernel Variables.",
    "[  OK  ] Started Create Static Device Nodes in /dev.",
    "[  OK  ] Started udev Kernel Device Manager.",
    "[  OK  ] Started Network Service.",
    "[  OK  ] Reached target Network.",
    "[  OK  ] Started Network Time Synchronization.",
    "[  OK  ] Reached target System Time Synchronized.",
];

export function useBootSequence() {
    const [stage, setStage] = useState(BOOT_STAGES.POWER_OFF);
    const [logs, setLogs] = useState([]);
    const [activeComponent, setActiveComponent] = useState(HARDWARE.NONE);
    const [currentOperation, setCurrentOperation] = useState('IDLE');
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1.0); // 1.0 = Normal, >1.0 = Slower, <1.0 = Faster

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
        }, 500 * speedMultiplier);

        setTimeout(() => {
            setCurrentOperation(SYSTEM_OPS.AUTH_CHECK);
            setActiveComponent(HARDWARE.RAM);
            addLog("Reading stored hash from SAM...");
        }, 1500 * speedMultiplier);

        setTimeout(() => {
            if (password === 'admin') {
                addLog("Password Verified. Access Granted.");
                setIsLoggedIn(true);
                setStage(BOOT_STAGES.READY);
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
        }, 3000 * speedMultiplier);
    };

    useEffect(() => {
        const getDelay = (baseDelay) => baseDelay * speedMultiplier;

        const runStage = () => {
            switch (stage) {
                case BOOT_STAGES.POWER_ON:
                    setActiveComponent(HARDWARE.CPU);
                    setCurrentOperation(SYSTEM_OPS.BIOS_CHECK);
                    addLog("System Power ON. CPU Reset.");
                    setProgress(10);
                    timerRef.current = setTimeout(() => setStage(BOOT_STAGES.BIOS), getDelay(STAGE_DELAYS[BOOT_STAGES.POWER_ON]));
                    break;

                case BOOT_STAGES.BIOS:
                    setActiveComponent(HARDWARE.CPU);
                    setCurrentOperation(SYSTEM_OPS.BIOS_CHECK);
                    addLog("BIOS Initializing...");
                    addLog("Checking CPU registers...");
                    setProgress(20);
                    timerRef.current = setTimeout(() => setStage(BOOT_STAGES.VGA_INIT), getDelay(STAGE_DELAYS[BOOT_STAGES.BIOS]));
                    break;

                case BOOT_STAGES.VGA_INIT:
                    setActiveComponent(HARDWARE.GPU);
                    setCurrentOperation(SYSTEM_OPS.VGA_BIOS_INIT);
                    addLog("Initializing Video Adapter (VGA BIOS)...");
                    setProgress(25);
                    timerRef.current = setTimeout(() => {
                        addLog("Video Output Enabled.");
                        setStage(BOOT_STAGES.POST);
                    }, getDelay(STAGE_DELAYS[BOOT_STAGES.VGA_INIT]));
                    break;

                case BOOT_STAGES.POST:
                    setActiveComponent(HARDWARE.RAM);
                    setCurrentOperation(SYSTEM_OPS.RAM_CHECK);
                    
                    const POST_LOGS = [
                        "AMIBIOS(C)2026 American Megatrends, Inc.",
                        "ASUS PRIME Z790-P ACPI BIOS Revision 1604",
                        "CPU: Intel(R) Core(TM) i9-13900K CPU @ 3.00GHz",
                        "Speed: 3000MHz",
                        "DRAM Clock: 6000MHz",
                        "USB Devices total: 0 Drive, 1 Keyboard, 1 Mouse, 0 Hub",
                        "Detected ATA/ATAPI Devices...",
                        "SATA Port 1: Samsung SSD 980 PRO 1TB",
                        "SATA Port 2: Empty"
                    ];

                    let postLogIndex = 0;
                    const postInterval = 400; // Slower than kernel logs for readability

                    const pushPostLog = () => {
                         if (postLogIndex < POST_LOGS.length) {
                             addLog(POST_LOGS[postLogIndex]);
                             setProgress(30 + Math.floor((postLogIndex / POST_LOGS.length) * 20));
                             postLogIndex++;
                             
                             // Play beep on first log to simulate POST beep
                             if (postLogIndex === 1) playPostBeep();

                             timerRef.current = setTimeout(pushPostLog, postInterval * speedMultiplier);
                         } else {
                             addLog("POST: System Healthy.");
                             setStage(BOOT_STAGES.BOOT_DEVICE_DETECT);
                         }
                    };
                    
                    pushPostLog();
                    break;

                case BOOT_STAGES.BOOT_DEVICE_DETECT:
                    setActiveComponent(HARDWARE.STORAGE);
                    setCurrentOperation(SYSTEM_OPS.DISK_READ);
                    addLog("Scanning for boot devices...");
                    setProgress(50);
                    timerRef.current = setTimeout(() => {
                        addLog("Boot device found: Virtual SSD (512GB).");
                        setStage(BOOT_STAGES.BOOTLOADER);
                    }, getDelay(STAGE_DELAYS[BOOT_STAGES.BOOT_DEVICE_DETECT]));
                    break;

                case BOOT_STAGES.BOOTLOADER:
                    setActiveComponent(HARDWARE.RAM);
                    setCurrentOperation(SYSTEM_OPS.KERNEL_LOAD);
                    addLog("Loading Bootloader...");
                    setProgress(65);
                    timerRef.current = setTimeout(() => {
                        addLog("GRUB Loading kernel...");
                        setStage(BOOT_STAGES.OS_INIT);
                    }, getDelay(STAGE_DELAYS[BOOT_STAGES.BOOTLOADER]));
                    break;

                case BOOT_STAGES.OS_INIT:
                    setActiveComponent(HARDWARE.CPU);
                    setCurrentOperation(SYSTEM_OPS.KERNEL_LOAD);
                    // Clear previous logs for fresh kernel boot look
                    setLogs([]);

                    let logIndex = 0;
                    const totalLogs = KERNEL_LOGS.length;
                    const baseInterval = 100; // ms per log, adjusting this changes speed

                    const pushLog = () => {
                        if (logIndex < totalLogs) {
                            addLog(KERNEL_LOGS[logIndex]);
                            setProgress(70 + Math.floor((logIndex / totalLogs) * 30));
                            logIndex++;
                            timerRef.current = setTimeout(pushLog, baseInterval * speedMultiplier);
                        } else {
                            addLog("System Services started.");
                            setStage(BOOT_STAGES.READY);
                            setProgress(100);
                        }
                    };

                    pushLog();
                    break;

                case BOOT_STAGES.READY:
                    setActiveComponent(HARDWARE.NONE);
                    setCurrentOperation(SYSTEM_OPS.IDLE);
                    if (!isLoggedIn) {
                        addLog("System Ready. Login required.");
                    }
                    break;

                case BOOT_STAGES.FAILURE:
                    setActiveComponent(HARDWARE.NONE);
                    break;

                default:
                    break;
            }
        };

        if (stage !== BOOT_STAGES.POWER_OFF) {
            runStage();
        }

        return () => clearTimeout(timerRef.current);
    }, [stage]); // Note: speedMultiplier is captured at effect start. Changes apply to NEXT stage.

    return {
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
    };
}
