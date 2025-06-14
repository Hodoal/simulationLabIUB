// JavaScript for Advanced Van de Graaff Simulator & Vascak Model

document.addEventListener('DOMContentLoaded', () => {
    console.log("Simulator script loaded.");

    // --- MODEL SELECTION (Conceptual - Vascak vs. Advanced) ---
    // For now, we assume one underlying HTML structure (Advanced) and adapt Vascak elements if needed.
    // The `currentExperiment` will primarily dictate what's shown and how it behaves.

    // --- Element References ---
    const powerSwitch = document.getElementById('powerSwitch');
    const powerSwitchDisplay = document.getElementById('powerSwitchDisplay');
    const groundSwitch = document.getElementById('groundSwitch');
    const groundSwitchDisplay = document.getElementById('groundSwitchDisplay');
    const simulationCanvas = document.getElementById('simulationCanvas');
    const svgNS = "http://www.w3.org/2000/svg";

    // VdG Generator Elements (shared concepts, but IDs might differ if models were truly separate HTML)
    const mainDome = document.getElementById('mainDome'); // Advanced model dome
    const mainDomeCharges = document.getElementById('mainDomeCharges'); // Advanced model
    const vdgAssemblyAdvanced = document.getElementById('vanDeGraaffAssembly'); // Advanced model group

    const vdgGeneratorVascak = document.getElementById('vdgGenerator'); // Vascak model group
    const mainDomeVascak = vdgGeneratorVascak ? vdgGeneratorVascak.querySelector('#mainDome') : null; // Vascak dome
    const domeChargesVascak = vdgGeneratorVascak ? vdgGeneratorVascak.querySelector('#domeCharges') : null; // Vascak charges

    // Electrometer Elements
    const electrometer = document.getElementById('electrometer');
    const electrometerNeedle = document.getElementById('electrometerNeedle');
    const electrometerPivot = document.getElementById('electrometerPivot');
    const electrometerCase = document.getElementById('electrometerCase');

    // Discharge Sphere (Advanced Model)
    const dischargeSphereApparatus = document.getElementById('dischargeSphereAssembly');
    const movableDischargeSphere = document.getElementById('movableDischargeSphere');
    const movableDischargeSphereCharges = document.getElementById('movableDischargeSphereCharges');

    // Sparks Container
    let sparksContainer = document.getElementById('sparksContainer');
    if (!sparksContainer && simulationCanvas) {
        sparksContainer = document.createElementNS(svgNS, "g");
        sparksContainer.id = "sparksContainer";
        simulationCanvas.appendChild(sparksContainer);
    }

    // Electric Papers Apparatus (Original single apparatus)
    const electricPapersApparatus = document.getElementById('electricPapersApparatus');
    const papersHolder = document.getElementById('papersHolder');
    const papersHolderCharges = document.getElementById('papersHolderCharges');
    const paperStrip1 = document.getElementById('paperStrip1');
    const paperStrip2 = document.getElementById('paperStrip2');

    // Two Bunches of Papers Apparatus
    const twoBunchesApparatus = document.getElementById('twoBunchesApparatus');
    const bunchA_assembly = document.getElementById('bunchA_assembly');
    const bunchA_holder = document.getElementById('bunchA_holder');
    const bunchA_charges = document.getElementById('bunchA_charges');
    const bunchA_strip1 = document.getElementById('bunchA_strip1');
    const bunchA_strip2 = document.getElementById('bunchA_strip2');
    const bunchA_strip3 = document.getElementById('bunchA_strip3');
    const bunchB_assembly = document.getElementById('bunchB_assembly');
    const bunchB_holder = document.getElementById('bunchB_holder');
    const bunchB_charges = document.getElementById('bunchB_charges');
    const bunchB_strip1 = document.getElementById('bunchB_strip1');
    const bunchB_strip2 = document.getElementById('bunchB_strip2');
    const bunchB_strip3 = document.getElementById('bunchB_strip3');
    const connectionToBunchA = document.getElementById('connectionToBunchA');
    const connectionToBunchB = document.getElementById('connectionToBunchB');

    // VdG Styling Components (Advanced Model)
    const topRoller = document.getElementById('topRoller');
    const bottomRoller = document.getElementById('bottomRoller');
    const supportColumn = document.getElementById('supportColumn');
    const basePlatform = document.getElementById('basePlatform') || document.getElementById('vdgStandBase'); // Prioritize advanced
    const motorHousing = document.getElementById('motorHousing');
    const motorAxle = document.getElementById('motorAxle');
    const topComb = document.getElementById('topComb');
    const bottomComb = document.getElementById('bottomComb');
    const beltRect = document.getElementById('belt'); // Shared by advanced

    // Discharge Sphere Styling Components (Advanced Model)
    const movableSphereStandBase = document.getElementById('movableSphereStandBase');
    const movableSphereArm = document.getElementById('movableSphereArm');


    // --- Simulation State Variables ---
    let isPowerOn = false;
    let isGrounded = false;
    let currentCharge = 0; // Generic dome charge, used by current active VdG model
    const MAX_DOME_CHARGE = 100;
    const CHARGE_ACCUMULATION_RATE = 2;
    let chargeIntervalId = null;
    const CHARGE_INTERVAL_MS = 150;

    // Belt Animation
    let beltMarkings = [];
    const NUM_BELT_MARKINGS = 8;
    const BELT_SPEED = 1.0;
    let beltAnimationId = null;

    // Main Discharge Sphere (Advanced Model)
    let isDraggingDischargeSphere = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    const initialDischargeSphereX = 550; // From HTML
    const initialDischargeSphereY = 230; // From HTML
    let dischargeSphereInducedCharge = 0;
    const MAX_INDUCED_CHARGE_DS = 30; // Increased capacity
    const INDUCTION_MAX_GAP_DS = 100; // Increased gap for induction
    const SPARK_THRESHOLD_DOME_CHARGE_MAIN = 70;
    const SPARK_THRESHOLD_GAP_MAIN = 30; // Adjusted gap for sparks
    const CHARGE_REDUCTION_PER_SPARK_MAIN = 35;

    // Electric Papers (Original single apparatus)
    let papersHolderCharge = 0;
    const MAX_PAPERS_CHARGE = 50;
    let currentPaperStrip1Angle = 0;
    let currentPaperStrip2Angle = 0;

    // Two Bunches of Papers
    let bunchA_charge = 0;
    let bunchB_charge = 0;
    const MAX_BUNCH_CHARGE = 30;
    const MAX_STRIP_DEFLECTION_BUNCHES = 50; // Increased deflection
    let currentBunchAStripAngles = [0, 0, 0];
    let currentBunchBStripAngles = [0, 0, 0];
    let draggingBunchId = null;
    let bunchDragOffsetX = 0, bunchDragOffsetY = 0;
    let bunchA_posX = 0, bunchA_posY = 0;
    let bunchB_posX = 60, bunchB_posY = 0; // Initial relative offset
    const BUNCH_DRAG_MIN_X = -100; // Boundaries relative to twoBunchesApparatus origin
    const BUNCH_DRAG_MAX_X = 100;  // for bunchA_posX
    const BUNCH_DRAG_MIN_Y = -50;
    const BUNCH_DRAG_MAX_Y = 50;
    const ATTRACTION_FORCE_FACTOR_BUNCHES = 0.1;
    const ATTRACTION_SNAP_DISTANCE_MARGIN_BUNCHES = 5;
    const BUNCH_REPULSION_ADJUST = 2;


    // Animation Constants
    const STRIP_ANIMATION_SPEED = 0.1;

    // Simulation State Management
    const Experiments = {
        NONE: 'none',
        VDG_ADVANCED_DISCHARGE: 'vdg_advanced_discharge', // Advanced VdG + Draggable Discharge Sphere
        ELECTRIC_PAPERS: 'electric_papers',
        TWO_BUNCHES: 'two_bunches'
    };
    let currentExperiment = Experiments.NONE;

    // Experiment Selection Buttons
    const btnExpVdgPrimary = document.getElementById('btnExpVdgPrimary');
    const btnExpElectricPapers = document.getElementById('btnExpElectricPapers');
    const btnExpTwoSpheres = document.getElementById('btnExpTwoSpheres');
    const btnExpNone = document.getElementById('btnExpNone');

    // --- Event Listeners ---
    powerSwitch.addEventListener('change', () => {
        isPowerOn = powerSwitch.checked;
        if(powerSwitchDisplay) powerSwitchDisplay.textContent = isPowerOn ? "(On)" : "(Off)";
        if (isPowerOn && !isGrounded) {
            startChargeAccumulation();
            if (beltRect) startBeltAnimation();
        } else {
            stopChargeAccumulation();
            if (beltRect) stopBeltAnimation();
        }
        if (!isPowerOn && isGrounded) currentCharge = 0;
        updateVisuals();
    });

    groundSwitch.addEventListener('change', () => {
        isGrounded = groundSwitch.checked;
        if(groundSwitchDisplay) groundSwitchDisplay.textContent = isGrounded ? "(Grounded)" : "(Not Grounded)";
        currentCharge = 0; // Always discharge main dome when ground state changes
        if (isGrounded) {
            dischargeSphereInducedCharge = 0;
            papersHolderCharge = 0;
            bunchA_charge = 0;
            bunchB_charge = 0;
            stopChargeAccumulation();
        } else {
            if (isPowerOn) startChargeAccumulation();
        }
        updateVisuals();
    });

    // --- Charge Accumulation ---
    function startChargeAccumulation() {
        if (chargeIntervalId !== null) return;
        chargeIntervalId = setInterval(() => {
            if (isGrounded) {
                if (currentCharge !== 0) { currentCharge = 0; updateVisuals(); }
                return;
            }
            if (isPowerOn && currentCharge < MAX_DOME_CHARGE) {
                currentCharge += CHARGE_ACCUMULATION_RATE;
                currentCharge = Math.min(currentCharge, MAX_DOME_CHARGE);
                updateVisuals();
            }
            if (currentCharge >= MAX_DOME_CHARGE && isPowerOn && !isGrounded) {
                stopChargeAccumulation(); // Stop if max charge reached
                updateVisuals(); // Final update
            }
        }, CHARGE_INTERVAL_MS);
    }

    function stopChargeAccumulation() {
        clearInterval(chargeIntervalId);
        chargeIntervalId = null;
    }

    // --- Rendering Functions ---
    function renderDomeCharges() {
        const displayDomeCharges = mainDomeCharges; // Using advanced model's charge group
        if (!displayDomeCharges || !mainDome) return;
        displayDomeCharges.innerHTML = '';
        const numChargesToShow = Math.floor((currentCharge / MAX_DOME_CHARGE) * 20);
        const domeRadius = parseFloat(mainDome.getAttribute('r'));
        const domeCy = parseFloat(mainDome.getAttribute('cy'));

        for (let i = 0; i < numChargesToShow; i++) {
            const chargeText = document.createElementNS(svgNS, "text");
            chargeText.textContent = '+';
            chargeText.setAttribute('fill', '#e63946');
            chargeText.setAttribute('font-size', '16px');
            chargeText.setAttribute('font-weight', 'bold');
            chargeText.setAttribute('text-anchor', 'middle');
            chargeText.setAttribute('dominant-baseline', 'middle');
            chargeText.setAttribute('pointer-events', 'none');
            chargeText.setAttribute('filter', 'url(#subtleShadow)');
            const angle = Math.random() * 2 * Math.PI;
            const rFactor = Math.random() * 0.85;
            const x = Math.cos(angle) * domeRadius * rFactor;
            const y = domeCy + Math.sin(angle) * domeRadius * rFactor;
            chargeText.setAttribute('x', x.toFixed(2));
            chargeText.setAttribute('y', y.toFixed(2));
            displayDomeCharges.appendChild(chargeText);
        }
    }

    function updateElectrometer() {
        if (!electrometerNeedle || !electrometerPivot) return;
        const chargePercent = currentCharge / MAX_DOME_CHARGE;
        const needleAngle = (chargePercent * 100) - 50; // Range -50 to +50
        const pivotX = parseFloat(electrometerPivot.getAttribute('cx'));
        const pivotY = parseFloat(electrometerPivot.getAttribute('cy'));
        electrometerNeedle.setAttribute('transform', `rotate(${needleAngle.toFixed(2)} ${pivotX} ${pivotY})`);
    }

    function updateVisuals() {
        renderDomeCharges();
        updateElectrometer();

        // Experiment-specific updates
        if (currentExperiment === Experiments.VDG_DISCHARGE_SPHERE) {
            calculateInducedChargeOnMainDischargeSphere();
            renderMainDischargeSphereCharges();
            checkAndTriggerMainSpark();
        } else {
            if (movableDischargeSphereCharges) movableDischargeSphereCharges.innerHTML = ''; // Clear if not active
        }

        if (currentExperiment === Experiments.ELECTRIC_PAPERS) {
            checkPapersConnectionAndTransferCharge();
            renderPapersHolderCharges();
            updatePaperStripsAnimation();
        } else {
             if(papersHolderCharges) papersHolderCharges.innerHTML = '';
             if(paperStrip1) paperStrip1.setAttribute('transform', `rotate(0 -15 -5)`);
             if(paperStrip2) paperStrip2.setAttribute('transform', `rotate(0 5 -5)`);
        }

        if (currentExperiment === Experiments.TWO_BUNCHES) {
            if (!draggingBunchId) {
                applyAttractionOrRepulsionBetweenBunches();
            }
            transferChargeToTwoBunches();
            renderTwoBunchesCharges();
            updateTwoBunchesStripsAnimation();
            updateTwoBunchesConnections();
        } else {
             if(bunchA_charges) bunchA_charges.innerHTML = '';
             if(bunchB_charges) bunchB_charges.innerHTML = '';
             const defaultAngle = 0;
             if(bunchA_strip1) bunchA_strip1.setAttribute('transform', `rotate(${defaultAngle} 0 8)`);
             if(bunchA_strip2) bunchA_strip2.setAttribute('transform', `rotate(${-defaultAngle} -3 8)`); // Assuming side strips deflect opposite initially
             if(bunchA_strip3) bunchA_strip3.setAttribute('transform', `rotate(${defaultAngle} 3 8)`);
             if(bunchB_strip1) bunchB_strip1.setAttribute('transform', `rotate(${defaultAngle} 0 8)`);
             if(bunchB_strip2) bunchB_strip2.setAttribute('transform', `rotate(${-defaultAngle} -3 8)`);
             if(bunchB_strip3) bunchB_strip3.setAttribute('transform', `rotate(${defaultAngle} 3 8)`);
        }
    }

    // --- Main Discharge Sphere Logic (Advanced Model) ---
    if (dischargeSphereApparatus && movableDischargeSphere) { // Ensure these are for advanced model
        dischargeSphereApparatus.addEventListener('pointerdown', (event) => {
            if (currentExperiment !== Experiments.VDG_DISCHARGE_SPHERE) return;
            isDraggingSphere = true;
            dischargeSphereApparatus.style.cursor = 'grabbing';
            const currentTransform = dischargeSphereApparatus.transform.baseVal[0].matrix;
            dragOffsetX = event.clientX - currentTransform.e;
            dragOffsetY = event.clientY - currentTransform.f;
            event.preventDefault();
        });
    }

    simulationCanvas.addEventListener('pointermove', (event) => { // General listener for dragging active element
        if (isDraggingSphere && currentExperiment === Experiments.VDG_DISCHARGE_SPHERE) {
            let newX = event.clientX - dragOffsetX;
            let newY = event.clientY - dragOffsetY;
            // Add constraints for X, Y for advanced discharge sphere if needed
            const canvasRect = simulationCanvas.getBoundingClientRect();
            const sphereRadius = parseFloat(movableDischargeSphere.getAttribute('r'));
            newX = Math.max(sphereRadius, Math.min(newX, canvasRect.width - sphereRadius));
            newY = Math.max(sphereRadius, Math.min(newY, canvasRect.height - sphereRadius));

            dischargeSphereApparatus.setAttribute('transform', `translate(${newX}, ${newY})`);
            updateVisuals();
        } else if (draggingBunchId && currentExperiment === Experiments.TWO_BUNCHES) {
            const parentMatrix = twoBunchesApparatus.transform.baseVal[0].matrix;
            let newX = event.clientX - parentMatrix.e - bunchDragOffsetX;
            let newY = event.clientY - parentMatrix.f - bunchDragOffsetY;

            const holderRadius = parseFloat(bunchA_holder.getAttribute('r')); // Assuming same for B
            const minSeparation = 2 * holderRadius + SPHERE_REPULSION_ADJUST;

            if (draggingBunchId === 'A') {
                newX = Math.max(BUNCH_DRAG_MIN_X, Math.min(newX, bunchB_posX - minSeparation));
                bunchA_posX = newX;
                bunchA_posY = newY;
                bunchA_assembly.setAttribute('transform', `translate(${newX.toFixed(2)}, ${newY.toFixed(2)})`);
            } else if (draggingBunchId === 'B') {
                newX = Math.max(bunchA_posX + minSeparation, Math.min(newX, BUNCH_DRAG_MAX_X));
                bunchB_posX = newX;
                bunchB_posY = newY;
                bunchB_assembly.setAttribute('transform', `translate(${newX.toFixed(2)}, ${newY.toFixed(2)})`);
            }
            bunchA_posX = Math.max(BUNCH_DRAG_MIN_X, Math.min(bunchA_posX, BUNCH_DRAG_MAX_X)); // General bounds
            bunchA_posY = Math.max(BUNCH_DRAG_MIN_Y, Math.min(bunchA_posY, BUNCH_DRAG_MAX_Y));
            bunchB_posX = Math.max(BUNCH_DRAG_MIN_X, Math.min(bunchB_posX, BUNCH_DRAG_MAX_X));
            bunchB_posY = Math.max(BUNCH_DRAG_MIN_Y, Math.min(bunchB_posY, BUNCH_DRAG_MAX_Y));

            if (draggingBunchId === 'A') bunchA_assembly.setAttribute('transform', `translate(${bunchA_posX.toFixed(2)}, ${bunchA_posY.toFixed(2)})`);
            else if (draggingBunchId === 'B') bunchB_assembly.setAttribute('transform', `translate(${bunchB_posX.toFixed(2)}, ${bunchB_posY.toFixed(2)})`);

            updateVisuals();
        }
    });

    const stopMainSphereDrag = () => {
        if (isDraggingSphere) {
            isDraggingSphere = false;
            if(dischargeSphereApparatus) dischargeSphereApparatus.style.cursor = 'grab';
            updateVisuals();
        }
    };
    simulationCanvas.addEventListener('pointerup', stopMainSphereDrag);
    simulationCanvas.addEventListener('pointerleave', stopMainSphereDrag);

    function calculateInducedChargeOnMainDischargeSphere() { // Renamed
        if (currentExperiment !== Experiments.VDG_DISCHARGE_SPHERE || !vanDeGraaffAssembly || !mainDome || !dischargeSphereApparatus || !movableDischargeSphere) {
            dischargeSphereInducedCharge = 0; return;
        }
        const vdgMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeCX = vdgMatrix.e + parseFloat(mainDome.getAttribute('cx'));
        const mainDomeCY = vdgMatrix.f + parseFloat(mainDome.getAttribute('cy'));
        const mainDomeR = parseFloat(mainDome.getAttribute('r'));
        const dsMatrix = dischargeSphereApparatus.transform.baseVal[0].matrix;
        const dsCX = dsMatrix.e + parseFloat(movableDischargeSphere.getAttribute('cx'));
        const dsCY = dsMatrix.f + parseFloat(movableDischargeSphere.getAttribute('cy'));
        const dsR = parseFloat(movableDischargeSphere.getAttribute('r'));
        const dX = dsCX - mainDomeCX;
        const dY = dsCY - mainDomeCY;
        const distanceCenterToCenter = Math.sqrt(dX * dX + dY * dY);
        const gap = distanceCenterToCenter - mainDomeR - dsR;

        if (currentCharge > 10 && gap < INDUCTION_MAX_GAP_DS) {
            let inducedMag = (1 - (gap / INDUCTION_MAX_GAP_DS)) * (currentCharge / MAX_DOME_CHARGE) * MAX_INDUCED_CHARGE_DS;
            inducedMag = Math.max(0, Math.min(inducedMag, MAX_INDUCED_CHARGE_DS));
            dischargeSphereInducedCharge = currentCharge > 0 ? -inducedMag : inducedMag;
        } else {
            dischargeSphereInducedCharge = 0;
        }
    }

    function renderMainDischargeSphereCharges() { // Renamed
        if (!movableDischargeSphereCharges || !movableDischargeSphere) return;
        movableDischargeSphereCharges.innerHTML = '';
        if (currentExperiment !== Experiments.VDG_DISCHARGE_SPHERE || Math.abs(dischargeSphereInducedCharge) < 1) return;

        const numCharges = Math.floor((Math.abs(dischargeSphereInducedCharge) / MAX_INDUCED_CHARGE_DS) * 15); // Max 15
        const sphereR = parseFloat(movableDischargeSphere.getAttribute('r'));
        const sphereCX = parseFloat(movableDischargeSphere.getAttribute('cx'));
        const sphereCY = parseFloat(movableDischargeSphere.getAttribute('cy'));
        const chargeSymbol = dischargeSphereInducedCharge > 0 ? '+' : '-';
        const chargeColor = dischargeSphereInducedCharge > 0 ? '#e63946' : '#4a90e2';

        for (let i = 0; i < numCharges; i++) {
            const chargeText = document.createElementNS(svgNS, "text");
            chargeText.textContent = chargeSymbol;
            chargeText.setAttribute('fill', chargeColor);
            chargeText.setAttribute('font-size', '14px');
            chargeText.setAttribute('font-weight', 'bold');
            chargeText.setAttribute('text-anchor', 'middle');
            chargeText.setAttribute('dominant-baseline', 'middle');
            chargeText.setAttribute('pointer-events', 'none');
            chargeText.setAttribute('filter', 'url(#subtleShadow)');
            const angle = Math.random() * 2 * Math.PI;
            const rFactor = Math.random() * 0.8;
            const x = sphereCX + Math.cos(angle) * sphereR * rFactor;
            const y = sphereCY + Math.sin(angle) * sphereR * rFactor;
            chargeText.setAttribute('x', x.toFixed(2));
            chargeText.setAttribute('y', y.toFixed(2));
            movableDischargeSphereCharges.appendChild(chargeText);
        }
    }

    function checkAndTriggerMainSpark() { // Renamed
        if (currentExperiment !== Experiments.VDG_DISCHARGE_SPHERE || !vanDeGraaffAssembly || !mainDome || !dischargeSphereApparatus || !movableDischargeSphere || !sparksContainer) return;

        const vdgMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeGlobalX = vdgMatrix.e + parseFloat(mainDome.getAttribute('cx'));
        const mainDomeGlobalY = vdgMatrix.f + parseFloat(mainDome.getAttribute('cy'));
        const mainDomeRadius = parseFloat(mainDome.getAttribute('r'));
        const dsMatrix = dischargeSphereApparatus.transform.baseVal[0].matrix;
        const dsGlobalX = dsMatrix.e + parseFloat(movableDischargeSphere.getAttribute('cx'));
        const dsGlobalY = dsMatrix.f + parseFloat(movableDischargeSphere.getAttribute('cy'));
        const dsRadius = parseFloat(movableDischargeSphere.getAttribute('r'));
        const dx = dsGlobalX - mainDomeGlobalX;
        const dy = dsGlobalY - mainDomeGlobalY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const gap = distance - mainDomeRadius - dsRadius;

        if (isPowerOn && !isGrounded && currentCharge >= SPARK_THRESHOLD_DOME_CHARGE_MAIN && gap <= SPARK_THRESHOLD_GAP_MAIN) {
            currentCharge -= CHARGE_REDUCTION_PER_SPARK_MAIN;
            if (currentCharge < 0) currentCharge = 0;
            dischargeSphereInducedCharge = 0;
            const sparkX1 = mainDomeGlobalX + mainDomeRadius * (dx / distance);
            const sparkY1 = mainDomeGlobalY + mainDomeRadius * (dy / distance);
            const sparkX2 = dsGlobalX - dsRadius * (dx / distance);
            const sparkY2 = dsGlobalY - dsRadius * (dy / distance);
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
                if (sparkLine.parentNode) sparkLine.remove();
                if (sparkCore.parentNode) sparkCore.remove();
            }, 150);
        }
    }

    // --- Electric Papers Logic ---
    function checkPapersConnectionAndTransferCharge() {
        if (currentExperiment !== Experiments.ELECTRIC_PAPERS) {
            if(papersHolderCharge !== 0) papersHolderCharge = 0; // Reset if not active
            return;
        }
        if (isGrounded) {
            if (papersHolderCharge !== 0) papersHolderCharge = 0;
            return;
        }
        if (currentCharge > 10 && papersHolderCharge < MAX_PAPERS_CHARGE) {
            let chargeToTransfer = Math.min(CHARGE_ACCUMULATION_RATE * 0.25, MAX_PAPERS_CHARGE - papersHolderCharge, currentCharge * 0.02);
            papersHolderCharge += Math.max(0, chargeToTransfer);
            papersHolderCharge = Math.min(papersHolderCharge, MAX_PAPERS_CHARGE);
        } else if (currentCharge <= 10 && papersHolderCharge > 0) {
            papersHolderCharge = Math.max(0, papersHolderCharge - 0.25);
        }
    }

    function renderPapersHolderCharges() {
        if (!papersHolderCharges || !papersHolder) return;
        papersHolderCharges.innerHTML = '';
        if (currentExperiment !== Experiments.ELECTRIC_PAPERS || papersHolderCharge < 1) return;

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

    function updatePaperStripsAnimation() { // Renamed from updatePaperStrips
        if (!paperStrip1 || !paperStrip2) return;
        if (currentExperiment !== Experiments.ELECTRIC_PAPERS && currentExperiment !== Experiments.NONE) {
             // Only animate/reset if it's the current experiment or global reset
            if(currentPaperStrip1Angle !== 0 || currentPaperStrip2Angle !== 0) { // If not already reset by NONE
                currentPaperStrip1Angle = 0; currentPaperStrip2Angle = 0;
                paperStrip1.setAttribute('transform', `rotate(0 -15 -5)`);
                paperStrip2.setAttribute('transform', `rotate(0 5 -5)`);
            }
            return;
        }
        const chargeRatio = papersHolderCharge / MAX_PAPERS_CHARGE;
        const maxDeflectionAngle = 50;
        const targetAngle1 = -(chargeRatio * maxDeflectionAngle);
        const targetAngle2 = chargeRatio * maxDeflectionAngle;
        currentPaperStrip1Angle += (targetAngle1 - currentPaperStrip1Angle) * STRIP_ANIMATION_SPEED;
        currentPaperStrip2Angle += (targetAngle2 - currentPaperStrip2Angle) * STRIP_ANIMATION_SPEED;
        if (Math.abs(currentPaperStrip1Angle - targetAngle1) < 0.01) currentPaperStrip1Angle = targetAngle1;
        if (Math.abs(currentPaperStrip2Angle - targetAngle2) < 0.01) currentPaperStrip2Angle = targetAngle2;
        const pivotX1 = -15, pivotX2 = 5, pivotY = -5;
        paperStrip1.setAttribute('transform', `rotate(${currentPaperStrip1Angle.toFixed(2)} ${pivotX1} ${pivotY})`);
        paperStrip2.setAttribute('transform', `rotate(${currentPaperStrip2Angle.toFixed(2)} ${pivotX2} ${pivotY})`);
    }

    // --- Two Bunches Logic ---
    function applyAttractionOrRepulsionBetweenBunches() {
        if (currentExperiment !== Experiments.TWO_BUNCHES || draggingBunchId) return;
        if (!bunchA_holder || !bunchB_holder || !bunchA_assembly || !bunchB_assembly) return;

        const rA = parseFloat(bunchA_holder.getAttribute('r'));
        const rB = parseFloat(bunchB_holder.getAttribute('r'));
        const idealTouchingDistance = rA + rB + SPHERE_REPULSION_ADJUST;
        const dx = bunchB_posX - bunchA_posX;
        let force = 0;

        if (bunchA_charge > 0 && bunchB_charge < 0) { // Attraction
            const chargeProductFactor = (bunchA_charge / MAX_BUNCH_CHARGE) * (Math.abs(bunchB_charge) / MAX_BUNCH_CHARGE);
            const distanceFactor = Math.max(0.1, (Math.abs(dx) - idealTouchingDistance) / 50);
            force = -ATTRACTION_FORCE_FACTOR_BUNCHES * chargeProductFactor * (1 / Math.pow(distanceFactor, 1.5));
            if (Math.abs(dx) < idealTouchingDistance + ATTRACTION_SNAP_DISTANCE_MARGIN && Math.abs(dx) > idealTouchingDistance) {
                force = (idealTouchingDistance - Math.abs(dx)) * (dx > 0 ? 1 : -1) * 0.5; // Snap force, ensure it pulls in correct direction
            }
        } else if ((bunchA_charge > 0 && bunchB_charge > 0) || (bunchA_charge < 0 && bunchB_charge < 0)) { // Repulsion
             if(Math.abs(bunchA_charge) > 0 && Math.abs(bunchB_charge) > 0 && Math.abs(dx) < idealTouchingDistance + 50 && Math.abs(dx) > 0.1){
                const chargeProductFactor = (Math.abs(bunchA_charge) / MAX_BUNCH_CHARGE) * (Math.abs(bunchB_charge) / MAX_BUNCH_CHARGE);
                const distanceFactor = Math.max(0.1, Math.abs(dx) / 50);
                force = (1 / distanceFactor) * ATTRACTION_FORCE_FACTOR_BUNCHES * chargeProductFactor * 5 * (dx > 0 ? 1 : -1);
            }
        }

        if (Math.abs(force) > 0.01) {
            // Move Bunch B in response to force from Bunch A (Bunch A is static anchor in this interaction)
            bunchB_posX += force;
            // Constrain Bunch B relative to Bunch A and general boundaries
            bunchB_posX = Math.max(bunchA_posX + idealTouchingDistance, Math.min(bunchB_posX, BUNCH_DRAG_MAX_X)); // Prevent overlap with A
            bunchB_posX = Math.max(BUNCH_DRAG_MIN_X, Math.min(bunchB_posX, BUNCH_DRAG_MAX_X)); // General bounds for B
            bunchB_assembly.setAttribute('transform', `translate(${bunchB_posX.toFixed(2)}, ${bunchB_posY.toFixed(2)})`);
        }
    }

    function updateTwoBunchesConnections() {
        if (currentExperiment !== Experiments.TWO_BUNCHES || !connectionToBunchA || !connectionToBunchB || !vanDeGraaffAssembly || !mainDome || !basePlatform || !twoBunchesApparatus || !bunchA_holder || !bunchB_holder) return;

        const vdgAssemblyMatrix = vanDeGraaffAssembly.transform.baseVal[0].matrix;
        const mainDomeGlobalX = vdgAssemblyMatrix.e + parseFloat(mainDome.getAttribute('cx'));
        const mainDomeGlobalY = vdgAssemblyMatrix.f + parseFloat(mainDome.getAttribute('cy'));
        const mainDomeRadius = parseFloat(mainDome.getAttribute('r'));

        const basePlatformGlobalX = vdgAssemblyMatrix.e + (parseFloat(basePlatform.getAttribute('x')) || 0) + (parseFloat(basePlatform.getAttribute('width')) || 0) / 2;
        const basePlatformGlobalY = vdgAssemblyMatrix.f + (parseFloat(basePlatform.getAttribute('y')) || 0);

        const twoBunchesMatrix = twoBunchesApparatus.transform.baseVal[0].matrix;

        const bunchAmatrix = bunchA_assembly.transform.baseVal[0].matrix;
        const holderAGlobalX = twoBunchesMatrix.e + bunchAmatrix.e + parseFloat(bunchA_holder.getAttribute('cx'));
        const holderAGlobalY = twoBunchesMatrix.f + bunchAmatrix.f + parseFloat(bunchA_holder.getAttribute('cy'));

        const bunchBmatrix = bunchB_assembly.transform.baseVal[0].matrix;
        const holderBGlobalX = twoBunchesMatrix.e + bunchBmatrix.e + parseFloat(bunchB_holder.getAttribute('cx'));
        const holderBGlobalY = twoBunchesMatrix.f + bunchBmatrix.f + parseFloat(bunchB_holder.getAttribute('cy'));

        const holderRadius = parseFloat(bunchA_holder.getAttribute('r'));

        connectionToBunchA.setAttribute('d', `M ${(mainDomeGlobalX + mainDomeRadius).toFixed(2)} ${mainDomeGlobalY.toFixed(2)} Q ${((mainDomeGlobalX + mainDomeRadius + holderAGlobalX)/2).toFixed(2)} ${(mainDomeGlobalY - 50).toFixed(2)} ${holderAGlobalX.toFixed(2)} ${(holderAGlobalY - holderRadius).toFixed(2)}`);
        connectionToBunchB.setAttribute('d', `M ${basePlatformGlobalX.toFixed(2)} ${basePlatformGlobalY.toFixed(2)} Q ${((basePlatformGlobalX + holderBGlobalX)/2).toFixed(2)} ${(basePlatformGlobalY - 50).toFixed(2)} ${holderBGlobalX.toFixed(2)} ${(holderBGlobalY - holderRadius).toFixed(2)}`);
    }

    function transferChargeToTwoBunches() {
        if (currentExperiment !== Experiments.TWO_BUNCHES) return;
        let vdgCharge = currentCharge; // Use the advanced model's charge

        if (isGrounded) {
            bunchA_charge = 0; bunchB_charge = 0; return;
        }
        if (!isPowerOn) {
            if(bunchA_charge > 0) bunchA_charge = Math.max(0, bunchA_charge - 0.2); // Slower discharge
            if(bunchB_charge < 0) bunchB_charge = Math.min(0, bunchB_charge + 0.2);
            return;
        }

        if (vdgCharge > 10 && bunchA_charge < MAX_BUNCH_CHARGE) {
            let chargeTransferA = Math.min(CHARGE_ACCUMULATION_RATE * 0.02, MAX_BUNCH_CHARGE - bunchA_charge, vdgCharge * 0.002);
            bunchA_charge += Math.max(0, chargeTransferA);
            bunchA_charge = Math.min(bunchA_charge, MAX_BUNCH_CHARGE);
        }
        if (vdgCharge > 10 && Math.abs(bunchB_charge) < MAX_BUNCH_CHARGE) {
            let chargeTransferB = Math.min(CHARGE_ACCUMULATION_RATE * 0.02, MAX_BUNCH_CHARGE - Math.abs(bunchB_charge));
            bunchB_charge -= Math.max(0, chargeTransferB);
            bunchB_charge = Math.max(-MAX_BUNCH_CHARGE, bunchB_charge);
        }
    }

    function renderTwoBunchesCharges() {
        if (currentExperiment !== Experiments.TWO_BUNCHES || !bunchA_charges || !bunchB_charges) return;
        bunchA_charges.innerHTML = ''; bunchB_charges.innerHTML = '';
        const chargeCountA = Math.floor((bunchA_charge / MAX_BUNCH_CHARGE) * 8);
        const radiusA = parseFloat(bunchA_holder.getAttribute('r'));
        const cxA = parseFloat(bunchA_holder.getAttribute('cx'));
        const cyA = parseFloat(bunchA_holder.getAttribute('cy'));
        for (let i = 0; i < chargeCountA; i++) { /* ... render + for A ... */
            const textEl = document.createElementNS(svgNS, "text");
            const angle = Math.random() * 2 * Math.PI; const rFactor = 0.6;
            const x = cxA + Math.cos(angle) * radiusA * rFactor;
            const y = cyA + Math.sin(angle) * radiusA * rFactor;
            textEl.setAttribute('x', x.toFixed(2)); textEl.setAttribute('y', y.toFixed(2));
            textEl.setAttribute('fill', 'red'); textEl.setAttribute('font-size', '8px');
            textEl.setAttribute('font-weight', 'bold'); textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'middle'); textEl.setAttribute('filter', 'url(#subtleShadow)');
            textEl.textContent = '+'; bunchA_charges.appendChild(textEl);
        }
        const chargeCountB = Math.floor((Math.abs(bunchB_charge) / MAX_BUNCH_CHARGE) * 8);
        const radiusB = parseFloat(bunchB_holder.getAttribute('r'));
        const cxB = parseFloat(bunchB_holder.getAttribute('cx'));
        const cyB = parseFloat(bunchB_holder.getAttribute('cy'));
        for (let i = 0; i < chargeCountB; i++) { /* ... render - for B ... */
            const textEl = document.createElementNS(svgNS, "text");
            const angle = Math.random() * 2 * Math.PI; const rFactor = 0.6;
            const x = cxB + Math.cos(angle) * radiusB * rFactor;
            const y = cyB + Math.sin(angle) * radiusB * rFactor;
            textEl.setAttribute('x', x.toFixed(2)); textEl.setAttribute('y', y.toFixed(2));
            textEl.setAttribute('fill', 'blue'); textEl.setAttribute('font-size', '8px');
            textEl.setAttribute('font-weight', 'bold'); textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'middle'); textEl.setAttribute('filter', 'url(#subtleShadow)');
            textEl.textContent = '-'; bunchB_charges.appendChild(textEl);
        }
    }

    function updateTwoBunchesStripsAnimation() {
        if (currentExperiment !== Experiments.TWO_BUNCHES) return;
        const stripsDeflection = (targetCharge, maxCharge, stripElements, currentAngles) => {
            if (!stripElements.every(s => s)) return;
            const targetAngle = (targetCharge / maxCharge) * MAX_STRIP_DEFLECTION_BUNCHES;
            stripElements.forEach((strip, i) => {
                currentAngles[i] += (targetAngle - currentAngles[i]) * STRIP_ANIMATION_SPEED;
                if (Math.abs(currentAngles[i] - targetAngle) < 0.01) currentAngles[i] = targetAngle;
                let actualDeflection = currentAngles[i];
                const pivotX = (i === 0) ? 0 : (i === 1 ? -3 : 3);
                const pivotY = 8; // All strips hang from y=8 on their holder
                if (i === 1) actualDeflection = -currentAngles[i]; // Left strip deflects left
                else if (i === 2) actualDeflection = currentAngles[i]; // Right strip deflects right
                else actualDeflection = 0; // Center strip, ideally, would not rotate or only slightly
                if (Math.abs(targetCharge) < 0.1) actualDeflection = 0; // Ensure straight if no charge
                strip.setAttribute('transform', `rotate(${actualDeflection.toFixed(2)} ${pivotX} ${pivotY})`);
            });
        };
        stripsDeflection(bunchA_charge, MAX_BUNCH_CHARGE, [bunchA_strip1, bunchA_strip2, bunchA_strip3], currentBunchAStripAngles);
        stripsDeflection(Math.abs(bunchB_charge), MAX_BUNCH_CHARGE, [bunchB_strip1, bunchB_strip2, bunchB_strip3], currentBunchBStripAngles);
    }

    // --- Drag and Drop for Bunches ---
    function startBunchDrag(event, bunchId) {
        if (currentExperiment !== Experiments.TWO_BUNCHES) return;
        draggingBunchId = bunchId;
        const targetAssembly = (bunchId === 'A') ? bunchA_assembly : bunchB_assembly;
        targetAssembly.style.cursor = 'grabbing';
        const parentMatrix = twoBunchesApparatus.transform.baseVal[0].matrix;
        const bunchMatrix = targetAssembly.transform.baseVal[0].matrix;
        bunchDragOffsetX = event.clientX - (parentMatrix.e + bunchMatrix.e);
        bunchDragOffsetY = event.clientY - (parentMatrix.f + bunchMatrix.f);
        event.preventDefault();
    }

    if(bunchA_assembly) bunchA_assembly.addEventListener('pointerdown', (e) => startBunchDrag(e, 'A'));
    if(bunchB_assembly) bunchB_assembly.addEventListener('pointerdown', (e) => startBunchDrag(e, 'B'));

    const stopBunchDrag = () => {
        if (draggingBunchId) {
            const targetAssembly = (draggingBunchId === 'A') ? bunchA_assembly : bunchB_assembly;
            if(targetAssembly) targetAssembly.style.cursor = 'grab';
            draggingBunchId = null;
            updateVisuals();
        }
    };
    simulationCanvas.addEventListener('pointerup', stopBunchDrag);
    simulationCanvas.addEventListener('pointerleave', stopBunchDrag);

    // --- Visual Initialization ---
    function initializeVisuals() {
        if(mainDome) mainDome.setAttribute('fill', 'url(#metallicGradient)');
        if(mainDome) mainDome.setAttribute('stroke', '#778ca3');
        if(mainDome) mainDome.setAttribute('stroke-width', '2');
        if(movableDischargeSphere) movableDischargeSphere.setAttribute('fill', 'url(#metallicGradient)');
        if(movableDischargeSphere) movableDischargeSphere.setAttribute('stroke', '#778ca3');
        if(movableDischargeSphere) movableDischargeSphere.setAttribute('stroke-width', '1.5');
        if(topRoller) topRoller.setAttribute('fill', '#6c757d');
        if(topRoller) topRoller.setAttribute('stroke', '#495057');
        if(topRoller) topRoller.setAttribute('stroke-width', '1');
        if(bottomRoller) bottomRoller.setAttribute('fill', '#6c757d');
        if(bottomRoller) bottomRoller.setAttribute('stroke', '#495057');
        if(bottomRoller) bottomRoller.setAttribute('stroke-width', '1');
        if(beltRect) beltRect.setAttribute('fill', '#343a40');
        if(supportColumn) supportColumn.setAttribute('fill', 'rgba(110, 120, 150, 0.4)');
        if(supportColumn) supportColumn.setAttribute('stroke', '#868e96');
        if(supportColumn) supportColumn.setAttribute('stroke-width', '1.5');
        if(basePlatform) basePlatform.setAttribute('fill', '#4a5568');
        if(basePlatform) basePlatform.setAttribute('stroke', '#2d3748');
        if(basePlatform) basePlatform.setAttribute('stroke-width', '1');
        if(motorHousing) motorHousing.setAttribute('fill', '#718096');
        if(motorHousing) motorHousing.setAttribute('stroke', '#4a5568');
        if(motorHousing) motorHousing.setAttribute('stroke-width', '1');
        if(motorAxle) motorAxle.setAttribute('fill', '#2d3748');
        if(topComb) { topComb.setAttribute('stroke', '#2c3e50'); topComb.setAttribute('stroke-width', '2'); topComb.setAttribute('fill', 'none');}
        if(bottomComb) { bottomComb.setAttribute('stroke', '#2c3e50'); bottomComb.setAttribute('stroke-width', '2'); bottomComb.setAttribute('fill', 'none');}
        if(movableSphereStandBase) movableSphereStandBase.setAttribute('fill', '#a0aec0');
        if(movableSphereStandBase) movableSphereStandBase.setAttribute('stroke', '#718096');
        if(movableSphereStandBase) movableSphereStandBase.setAttribute('stroke-width', '1');
        if(movableSphereArm) movableSphereArm.setAttribute('fill', '#cbd5e0');
        if(movableSphereArm) movableSphereArm.setAttribute('stroke', '#a0aec0');
        if(movableSphereArm) movableSphereArm.setAttribute('stroke-width', '0.5');
        if(electrometerCase) { electrometerCase.setAttribute('fill', '#e9ecef'); electrometerCase.setAttribute('stroke', '#adb5bd'); electrometerCase.setAttribute('stroke-width', '1.5'); electrometerCase.setAttribute('rx', '3'); }
        if(electrometerNeedle) { electrometerNeedle.setAttribute('stroke', '#c92a2a'); electrometerNeedle.setAttribute('stroke-width', '2.5');}

        const electrometerGroup = document.getElementById('electrometer');
        if (electrometerGroup) {
            // Clear old static texts if any (e.g. "0", "Max" from HTML)
            const oldTexts = electrometerGroup.querySelectorAll('text[font-size="10px"]');
            oldTexts.forEach(t => t.remove());

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
                line.setAttribute('x1', lineStartX.toFixed(2)); line.setAttribute('y1', lineStartY.toFixed(2));
                line.setAttribute('x2', x2.toFixed(2)); line.setAttribute('y2', y2.toFixed(2));
                line.setAttribute('stroke', '#495057'); line.setAttribute('stroke-width', '1');
                electrometerGroup.appendChild(line);
                const textX = emPivotX + (scaleRadius + 8) * Math.cos(rad);
                const textY = emPivotY + (scaleRadius + 8) * Math.sin(rad) + 3;
                const text = document.createElementNS(svgNS, "text");
                text.setAttribute('x', textX.toFixed(2)); text.setAttribute('y', textY.toFixed(2));
                text.setAttribute('font-size', '9px'); text.setAttribute('fill', '#343a40');
                text.setAttribute('text-anchor', 'middle'); text.textContent = scaleLabels[i];
                electrometerGroup.appendChild(text);
            });
            if(electrometerNeedle) electrometerGroup.appendChild(electrometerNeedle);
            if(electrometerPivot) {
                electrometerPivot.setAttribute('fill', '#343a40');
                electrometerPivot.setAttribute('stroke', '#555');
                electrometerPivot.setAttribute('stroke-width', '0.5');
                electrometerGroup.appendChild(electrometerPivot);
            }
        }

        if(papersStandBase) { papersStandBase.setAttribute('fill', '#A0522D'); papersStandBase.setAttribute('stroke', '#5F381A'); papersStandBase.setAttribute('stroke-width', '1');}
        if(papersStandRod) { papersStandRod.setAttribute('fill', '#D3D3D3'); papersStandRod.setAttribute('stroke', '#888'); papersStandRod.setAttribute('stroke-width', '0.5');}
        if(papersHolder) { papersHolder.setAttribute('fill', '#E8E8E8'); papersHolder.setAttribute('stroke', '#B0B0B0'); papersHolder.setAttribute('stroke-width', '0.5');}
        if(paperStrip1) { paperStrip1.setAttribute('fill', '#fdfdfd'); paperStrip1.setAttribute('stroke', '#D0D0D0'); paperStrip1.setAttribute('stroke-width', '0.5'); paperStrip1.setAttribute('opacity', '0.95');}
        if(paperStrip2) { paperStrip2.setAttribute('fill', '#fdfdfd'); paperStrip2.setAttribute('stroke', '#D0D0D0'); paperStrip2.setAttribute('stroke-width', '0.5'); paperStrip2.setAttribute('opacity', '0.95');}
    }

    function setActiveExperiment(experimentType) {
        currentExperiment = experimentType;
        console.log("Current experiment set to:", currentExperiment);
        document.querySelectorAll('.sim-button').forEach(btn => btn.classList.remove('active'));
        if (experimentType === Experiments.VDG_DISCHARGE_SPHERE) { // Changed VDG_PRIMARY
            if(btnExpVdgPrimary) btnExpVdgPrimary.classList.add('active');
        } else if (experimentType === Experiments.ELECTRIC_PAPERS) {
            if(btnExpElectricPapers) btnExpElectricPapers.classList.add('active');
        } else if (experimentType === Experiments.TWO_BUNCHES) {
            if(btnExpTwoSpheres) btnExpTwoSpheres.classList.add('active');
        } else if (experimentType === Experiments.NONE) {
            if(btnExpNone) btnExpNone.classList.add('active');
        }
        updateApparatusStates(); // Changed from updateApparatusVisibilityAndInteractivity
    }

    function updateApparatusStates() { // Renamed
        powerSwitch.disabled = (currentExperiment === Experiments.NONE);
        groundSwitch.disabled = (currentExperiment === Experiments.NONE);

        // Default styles for all apparatus (hidden/dimmed)
        if(dischargeSphereApparatus) { dischargeSphereApparatus.style.visibility = 'hidden'; dischargeSphereApparatus.style.opacity = '0.3'; dischargeSphereApparatus.style.pointerEvents = 'none';}
        if(electricPapersApparatus) { electricPapersApparatus.style.visibility = 'hidden'; electricPapersApparatus.style.opacity = '0.3'; }
        if(twoBunchesApparatus) { twoBunchesApparatus.style.visibility = 'hidden'; twoBunchesApparatus.style.opacity = '0.3'; }
        if(bunchA_assembly) {bunchA_assembly.style.pointerEvents = 'none'; bunchA_assembly.style.cursor = 'default';}
        if(bunchB_assembly) {bunchB_assembly.style.pointerEvents = 'none'; bunchB_assembly.style.cursor = 'default';}


        switch (currentExperiment) {
            case Experiments.VDG_DISCHARGE_SPHERE: // Advanced VDG + Main Discharge Sphere
                if(vanDeGraaffAssembly) vanDeGraaffAssembly.style.opacity = '1'; // Ensure main VDG is visible
                if(dischargeSphereApparatus) {
                    dischargeSphereApparatus.style.visibility = 'visible';
                    dischargeSphereApparatus.style.opacity = '1';
                    dischargeSphereApparatus.style.pointerEvents = 'auto';
                }
                break;
            case Experiments.ELECTRIC_PAPERS:
                if(vanDeGraaffAssembly) vanDeGraaffAssembly.style.opacity = '1';
                if(electricPapersApparatus) {
                    electricPapersApparatus.style.visibility = 'visible';
                    electricPapersApparatus.style.opacity = '1';
                }
                currentPaperStrip1Angle = 0;
                currentPaperStrip2Angle = 0;
                updatePaperStripsAnimation();
                break;
            case Experiments.TWO_BUNCHES:
                if(vanDeGraaffAssembly) vanDeGraaffAssembly.style.opacity = '1';
                if(twoBunchesApparatus) {
                    twoBunchesApparatus.style.visibility = 'visible';
                    twoBunchesApparatus.style.opacity = '1';
                }
                if(bunchA_assembly) {bunchA_assembly.style.pointerEvents = 'auto'; bunchA_assembly.style.cursor = 'grab';}
                if(bunchB_assembly) {bunchB_assembly.style.pointerEvents = 'auto'; bunchB_assembly.style.cursor = 'grab';}
                bunchA_posX = 0; bunchA_posY = 0;
                bunchB_posX = 60; bunchB_posY = 0;
                if(bunchA_assembly) bunchA_assembly.setAttribute('transform', `translate(${bunchA_posX}, ${bunchA_posY})`);
                if(bunchB_assembly) bunchB_assembly.setAttribute('transform', `translate(${bunchB_posX}, ${bunchB_posY})`);
                updateTwoBunchesConnections();
                sphereA_charge = 0;
                sphereB_charge = 0;
                currentBunchAStripAngles = [0,0,0];
                currentBunchBStripAngles = [0,0,0];
                updateTwoBunchesStripsAnimation();
                break;
            case Experiments.NONE:
                if(vanDeGraaffAssembly) vanDeGraaffAssembly.style.opacity = '0.7'; // Dim main VDG
                if(isPowerOn) {
                    powerSwitch.checked = false;
                    powerSwitch.dispatchEvent(new Event('change'));
                }
                currentCharge = 0; domeCharge = 0; // Reset both charge models
                papersHolderCharge = 0;
                sphereA_charge = 0; sphereB_charge = 0;
                currentPaperStrip1Angle = 0; currentPaperStrip2Angle = 0;
                currentBunchAStripAngles = [0,0,0]; currentBunchBStripAngles = [0,0,0];
                break;
        }
        updateVisuals();
    }

    // --- Initial Setup Calls ---
    initializeVisuals();

    // Ensure this matches the HTML for the advanced model discharge sphere
    if(dischargeSphereApparatus) dischargeSphereApparatus.setAttribute('transform', `translate(${initialDischargeSphereX}, ${initialDischargeSphereY})`);

    // Setup Experiment Button Listeners
    btnExpVdgPrimary.addEventListener('click', () => setActiveExperiment(Experiments.VDG_PRIMARY));
    btnExpElectricPapers.addEventListener('click', () => setActiveExperiment(Experiments.ELECTRIC_PAPERS));
    const btnExpTwoSpheres = document.getElementById('btnExpTwoSpheres');
    if (btnExpTwoSpheres) {
         btnExpTwoSpheres.addEventListener('click', () => setActiveExperiment(Experiments.TWO_BUNCHES));
    }
    if(btnExpNone) btnExpNone.addEventListener('click', () => setActiveExperiment(Experiments.NONE));

    setActiveExperiment(Experiments.VDG_DISCHARGE_SPHERE); // Default to advanced VDG sphere
});

[end of script.js]
