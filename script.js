// JavaScript for Advanced Van de Graaff Simulator

document.addEventListener('DOMContentLoaded', () => {
    console.log("Advanced Van de Graaff Simulator script loaded.");

    // Element references
    const powerSwitch = document.getElementById('powerSwitch');
    const powerSwitchDisplay = document.getElementById('powerSwitchDisplay');
    const groundSwitch = document.getElementById('groundSwitch');
    const groundSwitchDisplay = document.getElementById('groundSwitchDisplay');

    const mainDome = document.getElementById('mainDome');
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
    const electrometerCase = document.getElementById('electrometerCase');
    const electrometerPivot = document.getElementById('electrometerPivot');

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
    const electricPapersApparatus = document.getElementById('electricPapersApparatus');

    // Two Spheres Apparatus elements
    const twoSpheresApparatus = document.getElementById('twoSpheresApparatus');
    const sphereA_assembly = document.getElementById('sphereA_assembly');
    const sphereA = document.getElementById('sphereA');
    const sphereA_charges = document.getElementById('sphereA_charges');
    const sphereA_strip = document.getElementById('sphereA_strip');
    const sphereB_assembly = document.getElementById('sphereB_assembly');
    const sphereB = document.getElementById('sphereB');
    const sphereB_charges = document.getElementById('sphereB_charges');
    const sphereB_strip = document.getElementById('sphereB_strip');
    const connectionToSphereA = document.getElementById('connectionToSphereA');
    const connectionToSphereB = document.getElementById('connectionToSphereB');


    // Simulation state
    let isPowerOn = false;
    let isGrounded = false;
    let currentCharge = 0;
    const MAX_CHARGE = 100;
    let chargeIntervalId = null;
    const CHARGE_ACCUMULATION_RATE = 2;
    const CHARGE_INTERVAL_MS = 200;

    const svgNS = "http://www.w3.org/2000/svg";

    // Belt Animation State
    let beltMarkings = [];
    const NUM_BELT_MARKINGS = 8;
    const BELT_SPEED = 1.0;
    let beltAnimationId = null;

    // Dragging State
    let isDraggingSphere = false; // For main discharge sphere
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
    let currentPaperStrip1Angle = 0;
    let currentPaperStrip2Angle = 0;

    // Two Spheres State
    let sphereA_charge = 0;
    let sphereB_charge = 0;
    const MAX_TWO_SPHERES_CHARGE = 30;
    const MAX_STRIP_DEFLECTION_SPHERES = 30;
    let currentSphereAStripAngle = 0;
    let currentSphereBStripAngle = 0;

    // Animation Constants
    const STRIP_ANIMATION_SPEED = 0.1;


    // Simulation State Management
    const Experiments = {
        NONE: 'none',
        VDG_PRIMARY: 'vdg_primary',
        ELECTRIC_PAPERS: 'electric_papers',
        TWO_SPHERES: 'two_spheres'
    };
    let currentExperiment = Experiments.NONE;

    const initialDischargeSphereY = 230;

    let isDraggingSphereB = false;
    let dragOffsetXB_relative = 0;
    let sphereB_current_relative_X = 60;
    const SPHERE_B_DRAG_MIN_X_RELATIVE = 35;
    const SPHERE_B_DRAG_MAX_X_RELATIVE = 200;
    const ATTRACTION_FORCE_FACTOR = 0.05;
    const ATTRACTION_SNAP_DISTANCE_MARGIN = 10;
    const SPHERE_REPULSION_ADJUST = 3;


    // Experiment Selection Buttons
    const btnExpVdgPrimary = document.getElementById('btnExpVdgPrimary');
    const btnExpElectricPapers = document.getElementById('btnExpElectricPapers');
    const btnExpNone = document.getElementById('btnExpNone');
    const btnExpTwoSpheres = document.getElementById('btnExpTwoSpheres');


    // Event Listener for Power Switch
    powerSwitch.addEventListener('change', () => {
        isPowerOn = powerSwitch.checked;
        powerSwitchDisplay.textContent = isPowerOn ? "(On)" : "(Off)";

        if (isPowerOn) {
            if (!isGrounded) startChargeAccumulation();
            startBeltAnimation();
        } else {
            stopChargeAccumulation();
            stopBeltAnimation();
        }
        updateVisuals();
    });

    groundSwitch.addEventListener('change', () => {
        isGrounded = groundSwitch.checked;
        groundSwitchDisplay.textContent = isGrounded ? "(Grounded)" : "(Not Grounded)";

        if (isGrounded) {
            currentCharge = 0;
        } else {
            if (isPowerOn) {
                startChargeAccumulation();
            }
        }
        updateVisuals();
    });


    function startChargeAccumulation() {
        if (chargeIntervalId !== null) return;

        chargeIntervalId = setInterval(() => {
            if (isGrounded) {
                if (currentCharge !== 0) {
                    currentCharge = 0;
                    updateVisuals();
                }
                return;
            }

            if (isPowerOn && currentCharge < MAX_CHARGE) {
                currentCharge += CHARGE_ACCUMULATION_RATE;
                if (currentCharge > MAX_CHARGE) {
                    currentCharge = MAX_CHARGE;
                }
            }
            if(isPowerOn && currentCharge < MAX_CHARGE){
                 updateVisuals();
            } else if (isPowerOn && currentCharge >= MAX_CHARGE){
                 updateVisuals();
                 stopChargeAccumulation();
            }

        }, CHARGE_INTERVAL_MS);
    }

    function stopChargeAccumulation() {
        clearInterval(chargeIntervalId);
        chargeIntervalId = null;
    }

    function renderDomeCharges() {
        mainDomeCharges.innerHTML = '';

        const domeRadius = parseFloat(mainDome.getAttribute('r')) || 80;
        const domeCY = parseFloat(mainDome.getAttribute('cy')) || -245;

        const chargeCount = Math.floor((currentCharge / MAX_CHARGE) * 20);

        for (let i = 0; i < chargeCount; i++) {
            const textElement = document.createElementNS(svgNS, "text");

            const angle = Math.random() * 2 * Math.PI;
            const rFactor = 0.8 + Math.random() * 0.15;
            const x = Math.cos(angle) * (domeRadius * rFactor);
            const y = domeCY + Math.sin(angle) * (domeRadius * rFactor);

            textElement.setAttribute('x', x.toFixed(2));
            textElement.setAttribute('y', y.toFixed(2));
            textElement.setAttribute('fill', '#e63946');
            textElement.setAttribute('font-size', '16px');
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('pointer-events', 'none');
            textElement.setAttribute('filter', 'url(#subtleShadow)');
            textElement.textContent = '+';
            mainDomeCharges.appendChild(textElement);
        }
    }

    function updateElectrometer() {
        const chargePercent = currentCharge / MAX_CHARGE;
        const angle = (chargePercent * 100) - 50;
        electrometerNeedle.setAttribute('transform', `rotate(${angle} 30 80)`);
    }

    function updateVisuals() {
        checkAndTriggerSpark();
        renderDomeCharges();
        updateElectrometer();
        renderMovableSphereCharges();
        checkPapersConnectionAndTransferCharge();
        renderPapersHolderCharges();
        updatePaperStrips();

        if (currentExperiment === Experiments.TWO_SPHERES) {
            if (!isDraggingSphereB) {
                applyAttractionOrRepulsionBetweenSpheres();
            }
            transferChargeToTwoSpheres();
            renderTwoSpheresCharges();
            updateTwoSpheresStrips();
            updateTwoSpheresConnections();
        }
    }

    function checkAndTriggerSpark() {
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

            const sparkX1 = mainDomeGlobalX + mainDomeRadius;
            const sparkY1 = mainDomeGlobalY;
            const sparkX2 = movableSphereGlobalX - movableSphereRadius;
            const sparkY2 = movableSphereGlobalY;

            const sparkLine = document.createElementNS(svgNS, "line");
            sparkLine.setAttribute('x1', sparkX1.toFixed(2));
            sparkLine.setAttribute('y1', sparkY1.toFixed(2));
            sparkLine.setAttribute('x2', sparkX2.toFixed(2));
            sparkLine.setAttribute('y2', sparkY2.toFixed(2));
            sparkLine.setAttribute('stroke', '#FFEB3B');
            sparkLine.setAttribute('stroke-width', '4px');
            sparkLine.setAttribute('stroke-linecap', 'round');
            sparkLine.setAttribute('filter', 'url(#sparkGlow)');
            sparksContainer.appendChild(sparkLine);

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

    function renderMovableSphereCharges() {
        movableDischargeSphereCharges.innerHTML = '';
        const vdgMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeGlobalX = vdgMatrix.e;
        const mainDomeRadius = parseFloat(mainDome.getAttribute('r'));
        const sphereAssemblyMatrix = dischargeSphereAssembly.transform.baseVal[0].matrix;
        const movableSphereGlobalX = sphereAssemblyMatrix.e;
        const movableSphereRadius = parseFloat(movableDischargeSphere.getAttribute('r'));
        const movableSphereCY = parseFloat(movableDischargeSphere.getAttribute('cy'));
        const gap = (movableSphereGlobalX - movableSphereRadius) - (mainDomeGlobalX + mainDomeRadius);
        const inductionThresholdGap = 150;
        const minChargeForInduction = 10;

        if (gap < inductionThresholdGap && currentCharge > minChargeForInduction) {
            let numInducedPairs = Math.floor(
                (currentCharge / MAX_CHARGE) * 8 * (1 - Math.max(0, gap) / inductionThresholdGap)
            );
            numInducedPairs = Math.max(0, Math.min(numInducedPairs, 8));
            if (numInducedPairs === 0 && gap < inductionThresholdGap * 0.3) {
                numInducedPairs = Math.max(1, Math.floor(currentCharge / MAX_CHARGE * 2));
            }
            const chargeRfactor = 0.8;
            for (let i = 0; i < numInducedPairs; i++) {
                const negText = document.createElementNS(svgNS, "text");
                const angleNeg = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
                const xNeg = Math.cos(angleNeg) * movableSphereRadius * chargeRfactor;
                const yNeg = movableSphereCY + Math.sin(angleNeg) * movableSphereRadius * chargeRfactor;
                negText.setAttribute('x', xNeg.toFixed(2));
                negText.setAttribute('y', yNeg.toFixed(2));
                negText.setAttribute('fill', '#4a90e2');
                negText.setAttribute('font-size', '14px');
                negText.setAttribute('font-weight', 'bold');
                negText.setAttribute('text-anchor', 'middle');
                negText.setAttribute('dominant-baseline', 'middle');
                negText.setAttribute('pointer-events', 'none');
                negText.setAttribute('filter', 'url(#subtleShadow)');
                negText.textContent = '-';
                movableDischargeSphereCharges.appendChild(negText);

                const posText = document.createElementNS(svgNS, "text");
                const anglePos = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
                const xPos = Math.cos(anglePos) * movableSphereRadius * chargeRfactor;
                const yPos = movableSphereCY + Math.sin(anglePos) * movableSphereRadius * chargeRfactor;
                posText.setAttribute('x', xPos.toFixed(2));
                posText.setAttribute('y', yPos.toFixed(2));
                posText.setAttribute('fill', '#e63946');
                posText.setAttribute('font-size', '14px');
                posText.setAttribute('font-weight', 'bold');
                posText.setAttribute('text-anchor', 'middle');
                posText.setAttribute('dominant-baseline', 'middle');
                posText.setAttribute('pointer-events', 'none');
                posText.setAttribute('filter', 'url(#subtleShadow)');
                posText.textContent = '+';
                movableDischargeSphereCharges.appendChild(posText);
            }
        }
    }

    groundSwitch.disabled = false;

    function createBeltMarkings() {
        if (beltMarkings.length > 0) return;
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
            line.setAttribute('stroke', '#212529');
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('stroke-dasharray', '2 2');
            vanDeGraaffAssembly.appendChild(line);
            beltMarkings.push(line);
        }
    }

    function animateBelt() {
        if (!isPowerOn) return;
        const beltTopY = parseFloat(beltRect.getAttribute('y'));
        const beltHeight = parseFloat(beltRect.getAttribute('height'));
        const beltBottomY = beltTopY + beltHeight;
        for (const line of beltMarkings) {
            let currentY = parseFloat(line.getAttribute('y1'));
            currentY += BELT_SPEED;
            if (currentY > beltBottomY) {
                currentY = beltTopY;
            }
            line.setAttribute('y1', currentY.toString());
            line.setAttribute('y2', currentY.toString());
        }
        beltAnimationId = requestAnimationFrame(animateBelt);
    }

    function startBeltAnimation() {
        createBeltMarkings();
        beltMarkings.forEach(line => line.style.display = '');
        if (beltAnimationId === null && isPowerOn) {
            beltAnimationId = requestAnimationFrame(animateBelt);
        }
    }

    function stopBeltAnimation() {
        if (beltAnimationId !== null) {
            cancelAnimationFrame(beltAnimationId);
            beltAnimationId = null;
        }
    }

    dischargeSphereAssembly.addEventListener('pointerdown', (event) => {
        if (currentExperiment !== Experiments.VDG_PRIMARY && currentExperiment !== Experiments.NONE) {
            if (currentExperiment === Experiments.ELECTRIC_PAPERS || currentExperiment === Experiments.TWO_SPHERES) { // Also disable for TWO_SPHERES
                return;
            }
        }
        isDraggingSphere = true;
        dischargeSphereAssembly.style.cursor = 'grabbing';
        const currentTransform = dischargeSphereAssembly.transform.baseVal[0].matrix;
        dragOffsetX = event.clientX - currentTransform.e;
        event.preventDefault();
    });

    simulationCanvas.addEventListener('pointermove', (event) => {
        if (isDraggingSphere) {
            let newX = event.clientX - dragOffsetX;
            newX = Math.max(DRAG_MIN_X, Math.min(newX, DRAG_MAX_X));
            const currentY = dischargeSphereAssembly.transform.baseVal[0].matrix.f;
            dischargeSphereAssembly.setAttribute('transform', `translate(${newX}, ${currentY})`);
        }
    });

    const stopDragging = () => {
        if (isDraggingSphere) {
            isDraggingSphere = false;
            dischargeSphereAssembly.style.cursor = 'grab';
            updateVisuals();
        }
    };
    simulationCanvas.addEventListener('pointerup', stopDragging);
    simulationCanvas.addEventListener('pointerleave', stopDragging);

    function checkPapersConnectionAndTransferCharge() {
        if (isGrounded) {
            if (papersHolderCharge !== 0) {
                papersHolderCharge = 0;
            }
            return;
        }
        if (currentCharge > 10 && papersHolderCharge < MAX_PAPERS_CHARGE) {
            let chargeToTransfer = Math.min(
                CHARGE_ACCUMULATION_RATE * 0.25,
                MAX_PAPERS_CHARGE - papersHolderCharge,
                currentCharge * 0.02
            );
            chargeToTransfer = Math.max(0, chargeToTransfer);
            papersHolderCharge += chargeToTransfer;
            papersHolderCharge = Math.min(papersHolderCharge, MAX_PAPERS_CHARGE);
        } else if (currentCharge <= 10 && papersHolderCharge > 0) {
            papersHolderCharge -= 0.25;
            papersHolderCharge = Math.max(0, papersHolderCharge);
        }
    }

    function renderPapersHolderCharges() {
        papersHolderCharges.innerHTML = '';
        const chargeCount = Math.floor((papersHolderCharge / MAX_PAPERS_CHARGE) * 8);
        const holderWidth = parseFloat(papersHolder.getAttribute('width'));
        const holderHeight = parseFloat(papersHolder.getAttribute('height'));
        const holderX = parseFloat(papersHolder.getAttribute('x'));
        const holderY = parseFloat(papersHolder.getAttribute('y'));
        for (let i = 0; i < chargeCount; i++) {
            const textElement = document.createElementNS(svgNS, "text");
            const x = holderX + (holderWidth * 0.1) + (Math.random() * holderWidth * 0.8);
            const y = holderY + (holderHeight * 0.2) + (Math.random() * holderHeight * 0.6);
            textElement.setAttribute('x', x.toFixed(2));
            textElement.setAttribute('y', y.toFixed(2));
            textElement.setAttribute('fill', '#e63946');
            textElement.setAttribute('font-size', '10px');
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('pointer-events', 'none');
            textElement.setAttribute('filter', 'url(#subtleShadow)');
            textElement.textContent = '+';
            papersHolderCharges.appendChild(textElement);
        }
    }

    function updatePaperStrips() {
        if (!paperStrip1 || !paperStrip2) return;

        const chargeRatio = papersHolderCharge / MAX_PAPERS_CHARGE;
        const maxDeflectionAngle = 50;

        const targetAngle1 = -(chargeRatio * maxDeflectionAngle);
        const targetAngle2 = chargeRatio * maxDeflectionAngle;

        currentPaperStrip1Angle += (targetAngle1 - currentPaperStrip1Angle) * STRIP_ANIMATION_SPEED;
        currentPaperStrip2Angle += (targetAngle2 - currentPaperStrip2Angle) * STRIP_ANIMATION_SPEED;

        if (Math.abs(currentPaperStrip1Angle - targetAngle1) < 0.01) currentPaperStrip1Angle = targetAngle1;
        if (Math.abs(currentPaperStrip2Angle - targetAngle2) < 0.01) currentPaperStrip2Angle = targetAngle2;

        const pivotX1 = -15;
        const pivotX2 = 5;
        const pivotY = -5;

        paperStrip1.setAttribute('transform', `rotate(${currentPaperStrip1Angle.toFixed(2)} ${pivotX1} ${pivotY})`);
        paperStrip2.setAttribute('transform', `rotate(${currentPaperStrip2Angle.toFixed(2)} ${pivotX2} ${pivotY})`);
    }

    function initializeVisuals() {
        mainDome.setAttribute('fill', 'url(#metallicGradient)');
        mainDome.setAttribute('stroke', '#778ca3');
        mainDome.setAttribute('stroke-width', '2');
        movableDischargeSphere.setAttribute('fill', 'url(#metallicGradient)');
        movableDischargeSphere.setAttribute('stroke', '#778ca3');
        movableDischargeSphere.setAttribute('stroke-width', '1.5');
        topRoller.setAttribute('fill', '#6c757d');
        topRoller.setAttribute('stroke', '#495057');
        topRoller.setAttribute('stroke-width', '1');
        bottomRoller.setAttribute('fill', '#6c757d');
        bottomRoller.setAttribute('stroke', '#495057');
        bottomRoller.setAttribute('stroke-width', '1');
        beltRect.setAttribute('fill', '#343a40');
        supportColumn.setAttribute('fill', 'rgba(110, 120, 150, 0.4)');
        supportColumn.setAttribute('stroke', '#868e96');
        supportColumn.setAttribute('stroke-width', '1.5');
        basePlatform.setAttribute('fill', '#4a5568');
        basePlatform.setAttribute('stroke', '#2d3748');
        basePlatform.setAttribute('stroke-width', '1');
        motorHousing.setAttribute('fill', '#718096');
        motorHousing.setAttribute('stroke', '#4a5568');
        motorHousing.setAttribute('stroke-width', '1');
        motorAxle.setAttribute('fill', '#2d3748');
        topComb.setAttribute('stroke', '#2c3e50');
        topComb.setAttribute('stroke-width', '2');
        topComb.setAttribute('fill', 'none');
        bottomComb.setAttribute('stroke', '#2c3e50');
        bottomComb.setAttribute('stroke-width', '2');
        bottomComb.setAttribute('fill', 'none');
        movableSphereStandBase.setAttribute('fill', '#a0aec0');
        movableSphereStandBase.setAttribute('stroke', '#718096');
        movableSphereStandBase.setAttribute('stroke-width', '1');
        movableSphereArm.setAttribute('fill', '#cbd5e0');
        movableSphereArm.setAttribute('stroke', '#a0aec0');
        movableSphereArm.setAttribute('stroke-width', '0.5');
        electrometerCase.setAttribute('fill', '#e9ecef');
        electrometerCase.setAttribute('stroke', '#adb5bd');
        electrometerCase.setAttribute('stroke-width', '1.5');
        electrometerCase.setAttribute('rx', '3');
        electrometerNeedle.setAttribute('stroke', '#c92a2a');
        electrometerNeedle.setAttribute('stroke-width', '2.5');
        const electrometerGroup = document.getElementById('electrometer');
        const emPivotX = 30, emPivotY = 80;
        const scaleRadius = 32;
        const scaleAngles = [-50, 0, 50];
        const scaleLabels = ["0", "50", "100"];
        scaleAngles.forEach((angle, i) => {
            const rad = (angle - 90) * Math.PI / 180;
            const lineStartX = emPivotX + 3 * Math.cos(rad + Math.PI/2);
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
            const textX = emPivotX + (scaleRadius + 8) * Math.cos(rad);
            const textY = emPivotY + (scaleRadius + 8) * Math.sin(rad) + 3;
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute('x', textX.toFixed(2));
            text.setAttribute('y', textY.toFixed(2));
            text.setAttribute('font-size', '9px');
            text.setAttribute('fill', '#343a40');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = scaleLabels[i];
            electrometerGroup.appendChild(text);
        });
        electrometerGroup.appendChild(electrometerNeedle);
        electrometerPivot.setAttribute('fill', '#343a40');
        electrometerPivot.setAttribute('stroke', '#555');
        electrometerPivot.setAttribute('stroke-width', '0.5');
        electrometerGroup.appendChild(electrometerPivot);
        papersStandBase.setAttribute('fill', '#A0522D');
        papersStandBase.setAttribute('stroke', '#5F381A');
        papersStandBase.setAttribute('stroke-width', '1');
        papersStandRod.setAttribute('fill', '#D3D3D3');
        papersStandRod.setAttribute('stroke', '#888');
        papersStandRod.setAttribute('stroke-width', '0.5');
        papersHolder.setAttribute('fill', '#E8E8E8');
        papersHolder.setAttribute('stroke', '#B0B0B0');
        papersHolder.setAttribute('stroke-width', '0.5');
        paperStrip1.setAttribute('fill', '#fdfdfd');
        paperStrip1.setAttribute('stroke', '#D0D0D0');
        paperStrip1.setAttribute('stroke-width', '0.5');
        paperStrip1.setAttribute('opacity', '0.95');
        paperStrip2.setAttribute('fill', '#fdfdfd');
        paperStrip2.setAttribute('stroke', '#D0D0D0');
        paperStrip2.setAttribute('stroke-width', '0.5');
        paperStrip2.setAttribute('opacity', '0.95');
    }

    function setActiveExperiment(experimentType) {
        currentExperiment = experimentType;
        console.log("Current experiment set to:", currentExperiment);
        document.querySelectorAll('.sim-button').forEach(btn => btn.classList.remove('active'));
        if (experimentType === Experiments.VDG_PRIMARY) {
            btnExpVdgPrimary.classList.add('active');
        } else if (experimentType === Experiments.ELECTRIC_PAPERS) {
            btnExpElectricPapers.classList.add('active');
        } else if (experimentType === Experiments.TWO_SPHERES) {
            const btnTwoSpheres = document.getElementById('btnExpTwoSpheres');
            if (btnTwoSpheres) btnTwoSpheres.classList.add('active');
        } else if (experimentType === Experiments.NONE) {
            btnExpNone.classList.add('active');
        }
        updateApparatusVisibilityAndInteractivity();
    }

    function updateApparatusVisibilityAndInteractivity() {
        powerSwitch.disabled = (currentExperiment === Experiments.NONE);
        groundSwitch.disabled = (currentExperiment === Experiments.NONE);
        vanDeGraaffAssembly.style.opacity = '1';
        dischargeSphereAssembly.style.opacity = '0.3';
        dischargeSphereAssembly.style.pointerEvents = 'none';
        electricPapersApparatus.style.opacity = '0.3';
        twoSpheresApparatus.style.visibility = 'hidden';
        twoSpheresApparatus.style.opacity = '0.3';
        sphereA_assembly.style.pointerEvents = 'none';
        sphereB_assembly.style.pointerEvents = 'none';
        sphereB_assembly.style.cursor = 'default';

        switch (currentExperiment) {
            case Experiments.VDG_PRIMARY:
                dischargeSphereAssembly.style.opacity = '1';
                dischargeSphereAssembly.style.pointerEvents = 'auto';
                break;
            case Experiments.ELECTRIC_PAPERS:
                electricPapersApparatus.style.opacity = '1';
                currentPaperStrip1Angle = 0;
                currentPaperStrip2Angle = 0;
                updatePaperStrips();
                break;
            case Experiments.TWO_SPHERES:
                twoSpheresApparatus.style.visibility = 'visible';
                twoSpheresApparatus.style.opacity = '1';
                sphereA_assembly.style.pointerEvents = 'none';
                sphereB_assembly.style.pointerEvents = 'auto';
                sphereB_assembly.style.cursor = 'grab';
                sphereB_current_relative_X = 60;
                sphereB_assembly.setAttribute('transform', `translate(${sphereB_current_relative_X}, 0)`);
                updateTwoSpheresConnections();
                sphereA_charge = 0;
                sphereB_charge = 0;
                currentSphereAStripAngle = 0;
                currentSphereBStripAngle = 0;
                updateTwoSpheresStrips();
                break;
            case Experiments.NONE:
                vanDeGraaffAssembly.style.opacity = '0.7';
                if(isPowerOn) {
                    powerSwitch.checked = false;
                    powerSwitch.dispatchEvent(new Event('change'));
                }
                currentCharge = 0;
                papersHolderCharge = 0;
                sphereA_charge = 0;
                sphereB_charge = 0;
                currentPaperStrip1Angle = 0;
                currentPaperStrip2Angle = 0;
                currentSphereAStripAngle = 0;
                currentSphereBStripAngle = 0;
                break;
        }
        updateVisuals();
    }

    function applyAttractionOrRepulsionBetweenSpheres() {
        if (currentExperiment !== Experiments.TWO_SPHERES) return;
        const rA = parseFloat(sphereA.getAttribute('r'));
        const rB = parseFloat(sphereB.getAttribute('r'));
        const idealTouchingDistance = rA + rB + SPHERE_REPULSION_ADJUST;
        let force = 0;
        if (sphereA_charge > 5 && sphereB_charge < -5) {
            const chargeProductFactor = (sphereA_charge / MAX_TWO_SPHERES_CHARGE) * (Math.abs(sphereB_charge) / MAX_TWO_SPHERES_CHARGE);
            const distanceFactor = Math.max(1, (sphereB_current_relative_X - idealTouchingDistance) / 50);
            force = -ATTRACTION_FORCE_FACTOR * chargeProductFactor * (1 / Math.pow(distanceFactor, 1.5));
            if (sphereB_current_relative_X < idealTouchingDistance + ATTRACTION_SNAP_DISTANCE_MARGIN && sphereB_current_relative_X > idealTouchingDistance) {
                 sphereB_current_relative_X = idealTouchingDistance;
                 force = 0;
            }
        } else if ((sphereA_charge > 5 && sphereB_charge > 5) || (sphereA_charge < -5 && sphereB_charge < -5)) {
            const chargeProductFactor = (Math.abs(sphereA_charge) / MAX_TWO_SPHERES_CHARGE) * (Math.abs(sphereB_charge) / MAX_TWO_SPHERES_CHARGE);
            if (sphereB_current_relative_X < idealTouchingDistance + 50) {
                 const distanceFactor = Math.max(1, (sphereB_current_relative_X - idealTouchingDistance) / 50);
                 force = ATTRACTION_FORCE_FACTOR * chargeProductFactor * (1 / Math.pow(distanceFactor, 2)) * 2;
            }
        }
        if (Math.abs(force) > 0.01) {
            sphereB_current_relative_X += force;
        }
        sphereB_current_relative_X = Math.max(SPHERE_B_DRAG_MIN_X_RELATIVE, Math.min(sphereB_current_relative_X, SPHERE_B_DRAG_MAX_X_RELATIVE));
        sphereB_assembly.setAttribute('transform', `translate(${sphereB_current_relative_X.toFixed(2)}, 0)`);
    }

    function updateTwoSpheresConnections() {
        const vdgMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeGlobalX = vdgMatrix.e + parseFloat(mainDome.getAttribute('cx'));
        const mainDomeGlobalY = vdgMatrix.f + parseFloat(mainDome.getAttribute('cy'));
        const mainDomeRadius = parseFloat(mainDome.getAttribute('r'));
        const basePlatformGlobalX = vdgMatrix.e + parseFloat(basePlatform.getAttribute('x')) + parseFloat(basePlatform.getAttribute('width')) / 2;
        const basePlatformGlobalY = vdgMatrix.f + parseFloat(basePlatform.getAttribute('y'));
        const twoSpheresMatrix = twoSpheresApparatus.transform.baseVal[0].matrix;
        const sphereAGlobalX = twoSpheresMatrix.e + parseFloat(sphereA.getAttribute('cx'));
        const sphereAGlobalY = twoSpheresMatrix.f + parseFloat(sphereA.getAttribute('cy'));
        const sphereARadius = parseFloat(sphereA.getAttribute('r'));
        const sphereBAssemblyMatrix = sphereB_assembly.transform.baseVal[0].matrix;
        const sphereBGlobalX = twoSpheresMatrix.e + sphereBAssemblyMatrix.e + parseFloat(sphereB.getAttribute('cx'));
        const sphereBGlobalY = twoSpheresMatrix.f + sphereBAssemblyMatrix.f + parseFloat(sphereB.getAttribute('cy'));
        const sphereBRadius = parseFloat(sphereB.getAttribute('r'));
        const connAX1 = mainDomeGlobalX + mainDomeRadius;
        const connAY1 = mainDomeGlobalY;
        const connAX2 = sphereAGlobalX - sphereARadius * 0.707;
        const connAY2 = sphereAGlobalY - sphereARadius * 0.707;
        connectionToSphereA.setAttribute('d', `M ${connAX1} ${connAY1} Q ${(connAX1 + connAX2)/2} ${connAY1 - 50} ${connAX2} ${connAY2}`);
        const connBX1 = basePlatformGlobalX;
        const connBY1 = basePlatformGlobalY;
        const connBX2 = sphereBGlobalX - sphereBRadius * 0.707;
        const connBY2 = sphereBGlobalY - sphereBRadius * 0.707;
        connectionToSphereB.setAttribute('d', `M ${connBX1} ${connBY1} Q ${(connBX1 + connBX2)/2} ${connBY1 - 50} ${connBX2} ${connBY2}`);
    }

    function transferChargeToTwoSpheres() {
        if (currentExperiment !== Experiments.TWO_SPHERES || !isPowerOn || isGrounded) {
            if (sphereA_charge > 0) sphereA_charge -= 1;
            sphereA_charge = Math.max(0, sphereA_charge);
            if (sphereB_charge < 0) sphereB_charge += 1;
            sphereB_charge = Math.min(0, sphereB_charge);
            return;
        }
        if (currentCharge > 10 && sphereA_charge < MAX_TWO_SPHERES_CHARGE) {
            let chargeTransferA = Math.min(
                CHARGE_ACCUMULATION_RATE * 0.05,
                MAX_TWO_SPHERES_CHARGE - sphereA_charge,
                currentCharge * 0.005
            );
            chargeTransferA = Math.max(0, chargeTransferA);
            sphereA_charge += chargeTransferA;
            sphereA_charge = Math.min(sphereA_charge, MAX_TWO_SPHERES_CHARGE);
        } else if (currentCharge <= 10 && sphereA_charge > 0) {
             sphereA_charge -= 0.5;
             sphereA_charge = Math.max(0, sphereA_charge);
        }
        if (currentCharge > 10 && Math.abs(sphereB_charge) < MAX_TWO_SPHERES_CHARGE) {
            let chargeTransferB = Math.min(
                CHARGE_ACCUMULATION_RATE * 0.05,
                MAX_TWO_SPHERES_CHARGE - Math.abs(sphereB_charge)
            );
            chargeTransferB = Math.max(0, chargeTransferB);
            sphereB_charge -= chargeTransferB;
            sphereB_charge = Math.max(-MAX_TWO_SPHERES_CHARGE, sphereB_charge);
        } else if (currentCharge <= 10 && sphereB_charge < 0) {
            sphereB_charge += 0.5;
            sphereB_charge = Math.min(0, sphereB_charge);
        }
        if (isGrounded) {
            sphereA_charge = 0;
            sphereB_charge = 0;
        }
    }

    function renderTwoSpheresCharges() {
        sphereA_charges.innerHTML = '';
        sphereB_charges.innerHTML = '';
        const chargeCountA = Math.floor((sphereA_charge / MAX_TWO_SPHERES_CHARGE) * 10);
        const radiusA = parseFloat(sphereA.getAttribute('r'));
        const cxA = parseFloat(sphereA.getAttribute('cx'));
        const cyA = parseFloat(sphereA.getAttribute('cy'));
        for (let i = 0; i < chargeCountA; i++) {
            const textEl = document.createElementNS(svgNS, "text");
            const angle = Math.random() * 2 * Math.PI;
            const rFactor = 0.7;
            const x = cxA + Math.cos(angle) * radiusA * rFactor;
            const y = cyA + Math.sin(angle) * radiusA * rFactor;
            textEl.setAttribute('x', x.toFixed(2));
            textEl.setAttribute('y', y.toFixed(2));
            textEl.setAttribute('fill', '#e63946');
            textEl.setAttribute('font-size', '10px');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'middle');
            textEl.setAttribute('filter', 'url(#subtleShadow)');
            textEl.textContent = '+';
            sphereA_charges.appendChild(textEl);
        }
        const chargeCountB = Math.floor((Math.abs(sphereB_charge) / MAX_TWO_SPHERES_CHARGE) * 10);
        const radiusB = parseFloat(sphereB.getAttribute('r'));
        const cxB = parseFloat(sphereB.getAttribute('cx'));
        const cyB = parseFloat(sphereB.getAttribute('cy'));
        for (let i = 0; i < chargeCountB; i++) {
            const textEl = document.createElementNS(svgNS, "text");
            const angle = Math.random() * 2 * Math.PI;
            const rFactor = 0.7;
            const x = cxB + Math.cos(angle) * radiusB * rFactor;
            const y = cyB + Math.sin(angle) * radiusB * rFactor;
            textEl.setAttribute('x', x.toFixed(2));
            textEl.setAttribute('y', y.toFixed(2));
            textEl.setAttribute('fill', '#4a90e2');
            textEl.setAttribute('font-size', '10px');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'middle');
            textEl.setAttribute('filter', 'url(#subtleShadow)');
            textEl.textContent = '-';
            sphereB_charges.appendChild(textEl);
        }
    }

    function updateTwoSpheresStrips() {
        if(!sphereA_strip || !sphereB_strip) return;

        const deflectionA = (sphereA_charge / MAX_TWO_SPHERES_CHARGE) * MAX_STRIP_DEFLECTION_SPHERES;
        sphereA_strip.setAttribute('transform', `rotate(${deflectionA} 0 15)`);

        const deflectionB_abs = (Math.abs(sphereB_charge) / MAX_TWO_SPHERES_CHARGE) * MAX_STRIP_DEFLECTION_SPHERES;
        sphereB_strip.setAttribute('transform', `rotate(${deflectionB_abs} 0 15)`);
    }


    // --- Initial Setup Calls ---
    initializeVisuals(); // Apply the styles

    const initialSphereX = DRAG_MAX_X - 50;
    dischargeSphereAssembly.setAttribute('transform', `translate(${initialSphereX}, ${initialDischargeSphereY})`);

    // Setup Experiment Button Listeners
    btnExpVdgPrimary.addEventListener('click', () => setActiveExperiment(Experiments.VDG_PRIMARY));
    btnExpElectricPapers.addEventListener('click', () => setActiveExperiment(Experiments.ELECTRIC_PAPERS));
    const btnExpTwoSpheres = document.getElementById('btnExpTwoSpheres');
    if (btnExpTwoSpheres) {
         btnExpTwoSpheres.addEventListener('click', () => setActiveExperiment(Experiments.TWO_SPHERES));
    } else {
        console.warn("Button #btnExpTwoSpheres not found. UI for switching to this experiment is missing.");
    }
    btnExpNone.addEventListener('click', () => setActiveExperiment(Experiments.NONE));

    setActiveExperiment(Experiments.VDG_PRIMARY); // Set default experiment
});

[end of script.js]
