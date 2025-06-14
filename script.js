// JavaScript for Advanced Van de Graaff Simulator

document.addEventListener('DOMContentLoaded', () => {
    console.log("Advanced Van de Graaff Simulator script loaded.");

    // Element references
    const powerSwitch = document.getElementById('powerSwitch');
    const powerSwitchDisplay = document.getElementById('powerSwitchDisplay');
    const groundSwitch = document.getElementById('groundSwitch');
    const groundSwitchDisplay = document.getElementById('groundSwitchDisplay'); // Added for future use

    const mainDome = document.getElementById('mainDome'); // Used for radius
    const mainDomeCharges = document.getElementById('mainDomeCharges');
    const electrometerNeedle = document.getElementById('electrometerNeedle');
    const beltRect = document.getElementById('belt');
    const vanDeGraaffAssembly = document.getElementById('vanDeGraaffAssembly');
    const dischargeSphereAssembly = document.getElementById('dischargeSphereAssembly');
    const movableDischargeSphere = document.getElementById('movableDischargeSphere');
    const movableDischargeSphereCharges = document.getElementById('movableDischargeSphereCharges');
    const simulationCanvas = document.getElementById('simulationCanvas');
    const sparksContainer = document.getElementById('sparksContainer');
    const papersHolder = document.getElementById('papersHolder');
    const papersHolderCharges = document.getElementById('papersHolderCharges');
    const paperStrip1 = document.getElementById('paperStrip1');
    const paperStrip2 = document.getElementById('paperStrip2');
    const electrometerCase = document.getElementById('electrometerCase'); // Added
    const electrometerPivot = document.getElementById('electrometerPivot'); // Added

    // VdG Components for styling
    const topRoller = document.getElementById('topRoller');
    const bottomRoller = document.getElementById('bottomRoller');
    const supportColumn = document.getElementById('supportColumn');
    const basePlatform = document.getElementById('basePlatform');
    const motorHousing = document.getElementById('motorHousing');
    const motorAxle = document.getElementById('motorAxle');
    const topComb = document.getElementById('topComb');
    const bottomComb = document.getElementById('bottomComb');

    // Discharge Sphere Components for styling
    const movableSphereStandBase = document.getElementById('movableSphereStandBase');
    const movableSphereArm = document.getElementById('movableSphereArm');


    // Simulation state
    let isPowerOn = false;
    let isGrounded = false; // Added for ground switch
    let currentCharge = 0;
    const MAX_CHARGE = 100; // Max charge units
    let chargeIntervalId = null;
    const CHARGE_ACCUMULATION_RATE = 2; // Units per interval
    const CHARGE_INTERVAL_MS = 200; // Milliseconds

    const svgNS = "http://www.w3.org/2000/svg";

    // Belt Animation State
    let beltMarkings = [];
    const NUM_BELT_MARKINGS = 8;
    const BELT_SPEED = 1.0; // Adjusted speed
    let beltAnimationId = null;

    // Dragging State
    let isDraggingSphere = false;
    let dragOffsetX = 0;
    const DRAG_MIN_X = 355;
    const DRAG_MAX_X = 700;

    // Spark Constants
    const SPARK_THRESHOLD_DOME_CHARGE = 75;
    const SPARK_THRESHOLD_GAP = 40;
    const CHARGE_REDUCTION_PER_SPARK = 30;

    // Electric Papers State
    let papersHolderCharge = 0;
    const MAX_PAPERS_CHARGE = 50;


    // Event Listener for Power Switch
    powerSwitch.addEventListener('change', () => {
        isPowerOn = powerSwitch.checked;
        powerSwitchDisplay.textContent = isPowerOn ? "(On)" : "(Off)";

        if (isPowerOn) {
            if (!isGrounded) startChargeAccumulation(); // Only start if not grounded
            startBeltAnimation();
        } else {
            stopChargeAccumulation(); // Power off stops accumulation regardless of ground
            stopBeltAnimation();
        }
        updateVisuals();
    });

    // Ground Switch Listener
    groundSwitch.addEventListener('change', () => {
        isGrounded = groundSwitch.checked;
        groundSwitchDisplay.textContent = isGrounded ? "(Grounded)" : "(Not Grounded)";

        if (isGrounded) {
            currentCharge = 0; // Immediately discharge
            // If power is on, charge accumulation will be prevented by the check in setInterval
            // No need to explicitly stopChargeAccumulation here unless we want to clear an existing interval
            // for a different reason. The interval itself will just not increment currentCharge.
            // However, if the logic is that grounding *stops* the motor/process, then:
            // if (isPowerOn) {
            //     powerSwitch.checked = false;
            //     isPowerOn = false;
            //     powerSwitchDisplay.textContent = "(Off)";
            //     stopBeltAnimation();
            //     stopChargeAccumulation(); // Also stop interval
            // }
        } else {
            // Ungrounded
            if (isPowerOn) {
                startChargeAccumulation(); // Attempt to start if power is on
            }
        }
        updateVisuals();
    });


    function startChargeAccumulation() {
        if (chargeIntervalId !== null) return;

        chargeIntervalId = setInterval(() => {
            if (isGrounded) { // If grounded, ensure charge is 0 and don't accumulate
                if (currentCharge !== 0) {
                    currentCharge = 0;
                    updateVisuals(); // Update visuals if charge was forced to 0
                }
                return; // Don't accumulate if grounded
            }

            if (isPowerOn && currentCharge < MAX_CHARGE) { // Accumulate if power on and not grounded
                currentCharge += CHARGE_ACCUMULATION_RATE;
                if (currentCharge > MAX_CHARGE) {
                    currentCharge = MAX_CHARGE;
                }
            } else if (!isPowerOn && currentCharge > 0) {
                // Optional: natural dissipation if power is off
                // currentCharge -= 0.5; // Slow dissipation
                // if (currentCharge < 0) currentCharge = 0;
            }
             // If power is off, interval should ideally be stopped by powerSwitch listener.
            // This interval primarily handles accumulation.
            // If power is on but charge is max, or power is off, no need to call updateVisuals from here repeatedly.
            if(isPowerOn && currentCharge < MAX_CHARGE){
                 updateVisuals();
            } else if (!isPowerOn && currentCharge > 0) { // For dissipation if implemented
                 // updateVisuals();
            } else if (isPowerOn && currentCharge >= MAX_CHARGE){ // One final update if max charge reached
                 updateVisuals();
                 stopChargeAccumulation(); // Stop interval if max charge is reached and power is still on
            }

        }, CHARGE_INTERVAL_MS);
    }

    function stopChargeAccumulation() {
        clearInterval(chargeIntervalId);
        chargeIntervalId = null;
    }

    function renderDomeCharges() {
        mainDomeCharges.innerHTML = ''; // Clear existing charges

        const domeRadius = parseFloat(mainDome.getAttribute('r')) || 80; // Default if not found
        const domeCY = parseFloat(mainDome.getAttribute('cy')) || -245; // Default if not found

        // Max ~15-20 charges for visual clarity, scales with currentCharge
        const chargeCount = Math.floor((currentCharge / MAX_CHARGE) * 20);

        for (let i = 0; i < chargeCount; i++) {
            const textElement = document.createElementNS(svgNS, "text");

            const angle = Math.random() * 2 * Math.PI;
            const rFactor = 0.8 + Math.random() * 0.15; // Place charges slightly inside the dome's radius, with some depth
            const x = Math.cos(angle) * (domeRadius * rFactor);
            const y = domeCY + Math.sin(angle) * (domeRadius * rFactor);

            textElement.setAttribute('x', x.toFixed(2));
            textElement.setAttribute('y', y.toFixed(2));
            textElement.setAttribute('fill', '#e63946');
            textElement.setAttribute('font-size', '16px'); // Adjusted font size
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('pointer-events', 'none');
            textElement.setAttribute('filter', 'url(#subtleShadow)'); // Added filter
            textElement.textContent = '+';
            mainDomeCharges.appendChild(textElement);
        }
    }

    function updateElectrometer() {
        const chargePercent = currentCharge / MAX_CHARGE;
        // Needle rotates from -50 degrees (0 charge) to +50 degrees (max charge)
        // Pivot point is (30,80) as per SVG definition
        const angle = (chargePercent * 100) - 50;
        electrometerNeedle.setAttribute('transform', `rotate(${angle} 30 80)`);
    }

    function updateVisuals() {
        checkAndTriggerSpark(); // Call before rendering to reflect charge changes
        renderDomeCharges();
        updateElectrometer();
        renderMovableSphereCharges();
        checkPapersConnectionAndTransferCharge();
        renderPapersHolderCharges();
        updatePaperStrips(); // Added
    }

    // --- Spark Generation ---
    function checkAndTriggerSpark() {
        // Calculate current gap (similar to renderMovableSphereCharges)
        const vdgMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeGlobalX = vdgMatrix.e;
        const mainDomeGlobalY = vdgMatrix.f + parseFloat(mainDome.getAttribute('cy'));
        const mainDomeRadius = parseFloat(mainDome.getAttribute('r'));

        const sphereAssemblyMatrix = dischargeSphereAssembly.transform.baseVal[0].matrix;
        const movableSphereGlobalX = sphereAssemblyMatrix.e;
        const movableSphereGlobalY = sphereAssemblyMatrix.f + parseFloat(movableDischargeSphere.getAttribute('cy'));
        const movableSphereRadius = parseFloat(movableDischargeSphere.getAttribute('r'));

        const gap = (movableSphereGlobalX - movableSphereRadius) - (mainDomeGlobalX + mainDomeRadius);

        if (isPowerOn && !isGrounded && currentCharge >= SPARK_THRESHOLD_DOME_CHARGE && gap <= SPARK_THRESHOLD_GAP) {
            currentCharge -= CHARGE_REDUCTION_PER_SPARK;
            if (currentCharge < 0) currentCharge = 0;

            // Create Spark Visual
            const sparkX1 = mainDomeGlobalX + mainDomeRadius;
            const sparkY1 = mainDomeGlobalY;
            const sparkX2 = movableSphereGlobalX - movableSphereRadius;
            const sparkY2 = movableSphereGlobalY;

            const sparkLine = document.createElementNS(svgNS, "line");
            sparkLine.setAttribute('x1', sparkX1.toFixed(2));
            sparkLine.setAttribute('y1', sparkY1.toFixed(2));
            sparkLine.setAttribute('x2', sparkX2.toFixed(2));
            sparkLine.setAttribute('y2', sparkY2.toFixed(2));
            sparkLine.setAttribute('stroke', '#FFEB3B'); // Brighter yellow
            sparkLine.setAttribute('stroke-width', '4px');
            sparkLine.setAttribute('stroke-linecap', 'round');
            sparkLine.setAttribute('filter', 'url(#sparkGlow)');

            sparksContainer.appendChild(sparkLine);

            // Add white core line
            const sparkCore = document.createElementNS(svgNS, "line");
            sparkCore.setAttribute('x1', sparkX1.toFixed(2));
            sparkCore.setAttribute('y1', sparkY1.toFixed(2));
            sparkCore.setAttribute('x2', sparkX2.toFixed(2));
            sparkCore.setAttribute('y2', sparkY2.toFixed(2));
            sparkCore.setAttribute('stroke', '#FFFFFF');
            sparkCore.setAttribute('stroke-width', '1.5px');
            sparkCore.setAttribute('stroke-linecap', 'round');
            sparksContainer.appendChild(sparkCore);

            setTimeout(() => {
                if (sparkLine.parentNode === sparksContainer) {
                    sparksContainer.removeChild(sparkLine);
                }
                if (sparkCore.parentNode === sparksContainer) {
                    sparksContainer.removeChild(sparkCore);
                }
            }, 150);
        }
    }


    // --- Induced Charges on Movable Sphere ---
    function renderMovableSphereCharges() {
        movableDischargeSphereCharges.innerHTML = ''; // Clear previous charges

        // Get current positions and radii
        const vdgMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeGlobalX = vdgMatrix.e; // VdG assembly X (mainDome cx is 0 in its group)
        const mainDomeRadius = parseFloat(mainDome.getAttribute('r'));

        const sphereAssemblyMatrix = dischargeSphereAssembly.transform.baseVal[0].matrix;
        const movableSphereGlobalX = sphereAssemblyMatrix.e; // Movable sphere assembly X
        const movableSphereRadius = parseFloat(movableDischargeSphere.getAttribute('r'));
        const movableSphereCY = parseFloat(movableDischargeSphere.getAttribute('cy')); // cy of sphere within its group

        // Calculate gap between the right edge of main dome and left edge of movable sphere
        const gap = (movableSphereGlobalX - movableSphereRadius) - (mainDomeGlobalX + mainDomeRadius);

        const inductionThresholdGap = 150; // Max gap for induction to start (tune this value)
        const minChargeForInduction = 10;

        if (gap < inductionThresholdGap && currentCharge > minChargeForInduction) {
            // Calculate number of induced charge pairs
            // More charge & closer distance = more induced pairs
            let numInducedPairs = Math.floor(
                (currentCharge / MAX_CHARGE) * 8 * (1 - Math.max(0, gap) / inductionThresholdGap)
            ); // Max 8 pairs
            numInducedPairs = Math.max(0, Math.min(numInducedPairs, 8));

            if (numInducedPairs === 0 && gap < inductionThresholdGap * 0.3) { // If very close and main dome charged
                numInducedPairs = Math.max(1, Math.floor(currentCharge / MAX_CHARGE * 2)); // Show at least 1 or 2 pairs
            }

            const chargeRfactor = 0.8; // How far from center to place charges on sphere surface

            for (let i = 0; i < numInducedPairs; i++) {
                // Negative Charges (-) on the side facing the main dome (left side of movable sphere)
                const negText = document.createElementNS(svgNS, "text");
                const angleNeg = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9); // Left hemisphere spread
                const xNeg = Math.cos(angleNeg) * movableSphereRadius * chargeRfactor;
                const yNeg = movableSphereCY + Math.sin(angleNeg) * movableSphereRadius * chargeRfactor;

                negText.setAttribute('x', xNeg.toFixed(2));
                negText.setAttribute('y', yNeg.toFixed(2));
                negText.setAttribute('fill', '#4a90e2');
                negText.setAttribute('font-size', '14px'); // Adjusted font size
                negText.setAttribute('font-weight', 'bold');
                negText.setAttribute('text-anchor', 'middle');
                negText.setAttribute('dominant-baseline', 'middle');
                negText.setAttribute('pointer-events', 'none');
                negText.setAttribute('filter', 'url(#subtleShadow)'); // Added filter
                negText.textContent = '-';
                movableDischargeSphereCharges.appendChild(negText);

                // Positive Charges (+) on the opposite side (right side of movable sphere)
                const posText = document.createElementNS(svgNS, "text");
                const anglePos = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
                const xPos = Math.cos(anglePos) * movableSphereRadius * chargeRfactor;
                const yPos = movableSphereCY + Math.sin(anglePos) * movableSphereRadius * chargeRfactor;

                posText.setAttribute('x', xPos.toFixed(2));
                posText.setAttribute('y', yPos.toFixed(2));
                posText.setAttribute('fill', '#e63946');
                posText.setAttribute('font-size', '14px'); // Adjusted font size
                posText.setAttribute('font-weight', 'bold');
                posText.setAttribute('text-anchor', 'middle');
                posText.setAttribute('dominant-baseline', 'middle');
                posText.setAttribute('pointer-events', 'none');
                posText.setAttribute('filter', 'url(#subtleShadow)'); // Added filter
                posText.textContent = '+';
                movableDischargeSphereCharges.appendChild(posText);
            }
        }
    }


    // Initial setup
    powerSwitchDisplay.textContent = isPowerOn ? "(On)" : "(Off)";
    // groundSwitchDisplay.textContent = groundSwitch.checked ? "(Grounded)" : "(Not Grounded)";
    groundSwitch.disabled = false; // Enable the ground switch

    // --- Belt Animation Functions ---
    function createBeltMarkings() {
        if (beltMarkings.length > 0) return; // Create only once

        const beltX = parseFloat(beltRect.getAttribute('x'));
        const beltY = parseFloat(beltRect.getAttribute('y'));
        const beltWidth = parseFloat(beltRect.getAttribute('width'));
        const beltHeight = parseFloat(beltRect.getAttribute('height'));

        for (let i = 0; i < NUM_BELT_MARKINGS; i++) {
            const line = document.createElementNS(svgNS, "line");
            const yPos = beltY + (i * (beltHeight / NUM_BELT_MARKINGS));

            line.setAttribute('x1', (beltX + beltWidth * 0.15).toString());
            line.setAttribute('y1', yPos.toString());
            line.setAttribute('x2', (beltX + beltWidth * 0.85).toString());
            line.setAttribute('y2', yPos.toString());
            line.setAttribute('stroke', '#212529'); // Darker color for markings
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('stroke-dasharray', '2 2'); // Dashed lines for better effect

            vanDeGraaffAssembly.appendChild(line); // Add to the same group as the belt
            beltMarkings.push(line);
        }
    }

    function animateBelt() {
        if (!isPowerOn) return; // Stop if power is turned off during animation frame

        const beltTopY = parseFloat(beltRect.getAttribute('y'));
        const beltHeight = parseFloat(beltRect.getAttribute('height'));
        const beltBottomY = beltTopY + beltHeight;

        for (const line of beltMarkings) {
            let currentY = parseFloat(line.getAttribute('y1'));
            currentY += BELT_SPEED;

            if (currentY > beltBottomY) {
                // currentY = beltTopY + (currentY - beltBottomY); // Wrap around
                currentY = beltTopY; // Simpler wrap to top
            }

            line.setAttribute('y1', currentY.toString());
            line.setAttribute('y2', currentY.toString());
        }

        beltAnimationId = requestAnimationFrame(animateBelt);
    }

    function startBeltAnimation() {
        createBeltMarkings(); // Ensure markings are created
        // Make markings visible (if they were ever hidden)
        beltMarkings.forEach(line => line.style.display = '');

        if (beltAnimationId === null && isPowerOn) { // Check isPowerOn again before starting
            beltAnimationId = requestAnimationFrame(animateBelt);
        }
    }

    function stopBeltAnimation() {
        if (beltAnimationId !== null) {
            cancelAnimationFrame(beltAnimationId);
            beltAnimationId = null;
        }
        // Optional: hide or reset markings
        // beltMarkings.forEach(line => line.style.display = 'none');
    }

    // --- Drag and Drop for Discharge Sphere ---
    dischargeSphereAssembly.addEventListener('pointerdown', (event) => {
        isDraggingSphere = true;
        dischargeSphereAssembly.style.cursor = 'grabbing';
        // Get current translate values
        const currentTransform = dischargeSphereAssembly.transform.baseVal[0].matrix;
        dragOffsetX = event.clientX - currentTransform.e;
        event.preventDefault(); // Optional: prevent text selection, etc.
    });

    simulationCanvas.addEventListener('pointermove', (event) => {
        if (isDraggingSphere) {
            let newX = event.clientX - dragOffsetX;
            newX = Math.max(DRAG_MIN_X, Math.min(newX, DRAG_MAX_X)); // Constrain X

            const currentY = dischargeSphereAssembly.transform.baseVal[0].matrix.f; // Keep current Y
            dischargeSphereAssembly.setAttribute('transform', `translate(${newX}, ${currentY})`);
            // updateVisuals(); // For induction effects, sparks, etc. (call if needed during drag)
        }
    });

    const stopDragging = () => {
        if (isDraggingSphere) {
            isDraggingSphere = false;
            dischargeSphereAssembly.style.cursor = 'grab';
            updateVisuals(); // Final update after drag, for induction/sparks
        }
    };

    simulationCanvas.addEventListener('pointerup', stopDragging);
    simulationCanvas.addEventListener('pointerleave', stopDragging); // Stop if mouse leaves canvas

    // --- Electric Papers Logic ---
    function checkPapersConnectionAndTransferCharge() {
        if (isGrounded) { // If VDG is grounded, papers should also lose charge quickly
            if (papersHolderCharge !== 0) {
                papersHolderCharge = 0;
            }
            return; // No charge transfer or accumulation if VDG is grounded
        }

        if (currentCharge > 10 && papersHolderCharge < MAX_PAPERS_CHARGE) {
            let chargeToTransfer = Math.min(
                CHARGE_ACCUMULATION_RATE * 0.25, // Transfer a smaller portion
                MAX_PAPERS_CHARGE - papersHolderCharge,
                currentCharge * 0.02 // Smaller fraction from dome
            );
            chargeToTransfer = Math.max(0, chargeToTransfer);

            papersHolderCharge += chargeToTransfer;
            // currentCharge -= chargeToTransfer; // Decide if papers draw significant charge from dome
            papersHolderCharge = Math.min(papersHolderCharge, MAX_PAPERS_CHARGE);

        } else if (currentCharge <= 10 && papersHolderCharge > 0) {
            // If VdG loses charge (but not grounded), papers slowly lose charge
            papersHolderCharge -= 0.25; // Slower discharge
            papersHolderCharge = Math.max(0, papersHolderCharge);
        }
    }

    function renderPapersHolderCharges() {
        papersHolderCharges.innerHTML = '';
        const chargeCount = Math.floor((papersHolderCharge / MAX_PAPERS_CHARGE) * 8); // Max ~8 charges

        const holderWidth = parseFloat(papersHolder.getAttribute('width'));
        const holderHeight = parseFloat(papersHolder.getAttribute('height'));
        const holderX = parseFloat(papersHolder.getAttribute('x'));
        const holderY = parseFloat(papersHolder.getAttribute('y'));

        for (let i = 0; i < chargeCount; i++) {
            const textElement = document.createElementNS(svgNS, "text");
            // Position randomly on the papersHolder surface
            const x = holderX + (holderWidth * 0.1) + (Math.random() * holderWidth * 0.8);
            const y = holderY + (holderHeight * 0.2) + (Math.random() * holderHeight * 0.6);

            textElement.setAttribute('x', x.toFixed(2));
            textElement.setAttribute('y', y.toFixed(2));
            textElement.setAttribute('fill', '#e63946');
            textElement.setAttribute('font-size', '10px'); // Adjusted font size
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('pointer-events', 'none');
            textElement.setAttribute('filter', 'url(#subtleShadow)'); // Added filter
            textElement.textContent = '+';
            papersHolderCharges.appendChild(textElement);
        }
    }


    // --- Electric Papers Animation ---
    function updatePaperStrips() {
        if (!paperStrip1 || !paperStrip2) return; // Ensure elements exist

        const chargeRatio = papersHolderCharge / MAX_PAPERS_CHARGE;
        const maxDeflectionAngle = 60; // Max angle in degrees for each strip
        const deflectionAngle = chargeRatio * maxDeflectionAngle;

        // Pivot points based on their 'M' command in the 'd' attribute.
        // paperStrip1 starts at M -15 -5
        // paperStrip2 starts at M 5 -5
        const pivotX1 = -15;
        const pivotX2 = 5;
        const pivotY = -5; // Common Y pivot, bottom edge of papersHolder

        paperStrip1.setAttribute('transform', `rotate(${-deflectionAngle} ${pivotX1} ${pivotY})`);
        paperStrip2.setAttribute('transform', `rotate(${deflectionAngle} ${pivotX2} ${pivotY})`);
    }


    // --- Visual Initialization ---
    function initializeVisuals() {
        // Main Dome
        mainDome.setAttribute('fill', 'url(#metallicGradient)');
        // stroke and stroke-width are already set in HTML, but can be confirmed/overridden
        mainDome.setAttribute('stroke', '#778ca3'); // Slightly bluish dark gray
        mainDome.setAttribute('stroke-width', '2');

        // Movable Discharge Sphere
        movableDischargeSphere.setAttribute('fill', 'url(#metallicGradient)');
        movableDischargeSphere.setAttribute('stroke', '#778ca3');
        movableDischargeSphere.setAttribute('stroke-width', '1.5');

        // Rollers
        topRoller.setAttribute('fill', '#6c757d'); // Dark gray
        topRoller.setAttribute('stroke', '#495057');
        topRoller.setAttribute('stroke-width', '1');
        bottomRoller.setAttribute('fill', '#6c757d');
        bottomRoller.setAttribute('stroke', '#495057');
        bottomRoller.setAttribute('stroke-width', '1');

        // Belt
        beltRect.setAttribute('fill', '#343a40'); // Very dark gray/black

        // Support Column
        supportColumn.setAttribute('fill', 'rgba(110, 120, 150, 0.4)'); // More pronounced translucent blue-grey
        supportColumn.setAttribute('stroke', '#868e96'); // Keep existing stroke or adjust
        supportColumn.setAttribute('stroke-width', '1.5');

        // Base Unit
        basePlatform.setAttribute('fill', '#4a5568'); // Dark slate grey
        basePlatform.setAttribute('stroke', '#2d3748');
        basePlatform.setAttribute('stroke-width', '1');
        motorHousing.setAttribute('fill', '#718096'); // Slate grey
        motorHousing.setAttribute('stroke', '#4a5568');
        motorHousing.setAttribute('stroke-width', '1');
        motorAxle.setAttribute('fill', '#2d3748'); // Very dark

        // Combs
        topComb.setAttribute('stroke', '#2c3e50'); // Dark blue/grey
        topComb.setAttribute('stroke-width', '2');
        topComb.setAttribute('fill', 'none');
        bottomComb.setAttribute('stroke', '#2c3e50');
        bottomComb.setAttribute('stroke-width', '2');
        bottomComb.setAttribute('fill', 'none');

        // Movable Sphere Stand/Arm
        movableSphereStandBase.setAttribute('fill', '#a0aec0');
        movableSphereStandBase.setAttribute('stroke', '#718096');
        movableSphereStandBase.setAttribute('stroke-width', '1');
        movableSphereArm.setAttribute('fill', '#cbd5e0');
        movableSphereArm.setAttribute('stroke', '#a0aec0');
        movableSphereArm.setAttribute('stroke-width', '0.5');

        // Electrometer Case & Needle (already partially styled, confirm/enhance)
        electrometerCase.setAttribute('fill', '#e9ecef');
        electrometerCase.setAttribute('stroke', '#adb5bd');
        electrometerCase.setAttribute('stroke-width', '1.5');
        electrometerCase.setAttribute('rx', '3'); // Rounded corners

        electrometerNeedle.setAttribute('stroke', '#c92a2a'); // Strong red
        electrometerNeedle.setAttribute('stroke-width', '2.5');
        // stroke-linecap="round" is already in HTML

        // Electrometer Scale Markings
        const electrometerGroup = document.getElementById('electrometer');
        const emPivotX = 30, emPivotY = 80;
        const scaleRadius = 32; // Slightly smaller than needle length from pivot
        const scaleAngles = [-50, 0, 50]; // For 0, Mid, Max points of needle
        const scaleLabels = ["0", "50", "100"];

        scaleAngles.forEach((angle, i) => {
            const rad = (angle - 90) * Math.PI / 180; // Convert to SVG angle system (0 is right)

            // Line start point (slightly offset from pivot for cleaner look)
            const lineStartX = emPivotX + 3 * Math.cos(rad + Math.PI/2); // Perpendicular offset for line start
            const lineStartY = emPivotY + 3 * Math.sin(rad + Math.PI/2);

            const x2 = emPivotX + scaleRadius * Math.cos(rad);
            const y2 = emPivotY + scaleRadius * Math.sin(rad);

            const line = document.createElementNS(svgNS, "line");
            line.setAttribute('x1', lineStartX.toFixed(2));
            line.setAttribute('y1', lineStartY.toFixed(2));
            line.setAttribute('x2', x2.toFixed(2));
            line.setAttribute('y2', y2.toFixed(2));
            line.setAttribute('stroke', '#495057');
            line.setAttribute('stroke-width', '1');
            electrometerGroup.appendChild(line);

            const textX = emPivotX + (scaleRadius + 8) * Math.cos(rad); // Text further out
            const textY = emPivotY + (scaleRadius + 8) * Math.sin(rad) + 3; // Adjust baseline for text

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute('x', textX.toFixed(2));
            text.setAttribute('y', textY.toFixed(2));
            text.setAttribute('font-size', '9px');
            text.setAttribute('fill', '#343a40');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = scaleLabels[i];
            electrometerGroup.appendChild(text);
        });
        // Ensure needle and pivot are on top
        electrometerGroup.appendChild(electrometerNeedle);
        electrometerPivot.setAttribute('fill', '#343a40'); // Darker pivot
        electrometerPivot.setAttribute('stroke', '#555');
        electrometerPivot.setAttribute('stroke-width', '0.5');
        electrometerGroup.appendChild(electrometerPivot);


        // Electric Papers Apparatus Styling
        papersStandBase.setAttribute('fill', '#A0522D'); // Sienna
        papersStandBase.setAttribute('stroke', '#5F381A');
        papersStandBase.setAttribute('stroke-width', '1');
        papersStandRod.setAttribute('fill', '#D3D3D3'); // Light gray
        papersStandRod.setAttribute('stroke', '#888');
        papersStandRod.setAttribute('stroke-width', '0.5');
        papersHolder.setAttribute('fill', '#E8E8E8'); // Very light gray
        papersHolder.setAttribute('stroke', '#B0B0B0');
        papersHolder.setAttribute('stroke-width', '0.5');

        paperStrip1.setAttribute('fill', '#fdfdfd'); // Off-white
        paperStrip1.setAttribute('stroke', '#D0D0D0');
        paperStrip1.setAttribute('stroke-width', '0.5');
        paperStrip1.setAttribute('opacity', '0.95');
        paperStrip2.setAttribute('fill', '#fdfdfd');
        paperStrip2.setAttribute('stroke', '#D0D0D0');
        paperStrip2.setAttribute('stroke-width', '0.5');
        paperStrip2.setAttribute('opacity', '0.95');
    }


    // --- Initial Setup Calls ---
    initializeVisuals(); // Apply the styles

    const initialSphereX = DRAG_MAX_X - 50;
    const sphereY = 230;
    dischargeSphereAssembly.setAttribute('transform', `translate(${initialSphereX}, ${sphereY})`);

    updateVisuals(); // Set initial state of visuals
});
