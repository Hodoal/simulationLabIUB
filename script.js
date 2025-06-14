// JavaScript for Vascak-like Simulator

document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const powerSwitch = document.getElementById('powerSwitch');
    const groundSwitch = document.getElementById('groundSwitch');
    const moveSphereCloserBtn = document.getElementById('moveSphereCloser');
    const moveSphereFurtherBtn = document.getElementById('moveSphereFurther');

    const electrometerNeedle = document.getElementById('electrometerNeedle');
    const electrometerCase = document.getElementById('electrometerCase'); // Added
    const mainDome = document.getElementById('mainDome');
    const mainDomeCharges = document.getElementById('mainDomeCharges');
    const generatorBase = document.getElementById('generatorBase'); // Added
    const generatorColumn = document.getElementById('generatorColumn'); // Added

    const dischargeSphereAssembly = document.getElementById('dischargeSphereAssembly');
    const dischargeSphere = document.getElementById('dischargeSphere');
    const dischargeSphereCharges = document.getElementById('dischargeSphereCharges');
    const dischargeSphereBase = document.getElementById('dischargeSphereBase'); // Added
    const dischargeSphereArm = document.getElementById('dischargeSphereArm'); // Added

    const sparksContainer = document.getElementById('sparksContainer');
    const vanDeGraaffGenerator = document.getElementById('vanDeGraaffGenerator'); // Added for VDG transform

    // Initial Simulation State Variables
    let isPowerOn = false;
    let isGrounded = false;
    let mainDomeCharge = 0;
    const MAX_DOME_CHARGE = 100;
    let chargeAccumulationRate = 2;
    let chargeAccumulationIntervalId = null;

    let dischargeSpherePositionIndex = 0;
    const DISCHARGE_SPHERE_POSITIONS_X = [400, 350, 300, 250];
    const DISCHARGE_SPHERE_ASSEMBLY_Y_POS = 175;

    // Spark State Variables
    const SPARK_THRESHOLD_CHARGE = 70;
    const SPARK_POSITION_THRESHOLD = DISCHARGE_SPHERE_POSITIONS_X.length - 1;
    const CHARGE_REDUCTION_PER_SPARK = 35;

    // SVG Namespace
    const svgNS = "http://www.w3.org/2000/svg";

    // --- Initial Styling and Setup ---
    function initializeVisuals() {
        // Main Dome
        mainDome.setAttribute('fill', 'url(#metallicGradient)');
        mainDome.setAttribute('stroke', '#888');
        mainDome.setAttribute('stroke-width', '2');

        // Discharge Sphere
        dischargeSphere.setAttribute('fill', 'url(#metallicGradient)');
        dischargeSphere.setAttribute('stroke', '#888');
        dischargeSphere.setAttribute('stroke-width', '1');

        // Generator Parts
        generatorBase.setAttribute('fill', '#b0b0b0');
        generatorBase.setAttribute('stroke', '#777');
        generatorBase.setAttribute('stroke-width', '1');
        generatorColumn.setAttribute('fill', '#c0c0c0');
        generatorColumn.setAttribute('stroke', '#777');
        generatorColumn.setAttribute('stroke-width', '1');

        // Discharge Sphere Stand/Arm
        dischargeSphereBase.setAttribute('fill', '#b0b0b0');
        dischargeSphereBase.setAttribute('stroke', '#777');
        dischargeSphereBase.setAttribute('stroke-width', '1');
        dischargeSphereArm.setAttribute('fill', '#c0c0c0');
        dischargeSphereArm.setAttribute('stroke', '#777');
        dischargeSphereArm.setAttribute('stroke-width', '1');

        // Electrometer
        electrometerCase.setAttribute('fill', '#f0f0f0');
        electrometerCase.setAttribute('stroke', '#bababa');
        electrometerCase.setAttribute('stroke-width', '1');
        electrometerNeedle.setAttribute('stroke', '#e60000');
        electrometerNeedle.setAttribute('stroke-width', '2px');
        electrometerNeedle.setAttribute('stroke-linecap', 'round');

        // Add Electrometer Scale Markings
        const emGroup = document.getElementById('electrometer');
        const createEmText = (text, xPos, yPos, anchor) => {
            const t = document.createElementNS(svgNS, "text");
            t.setAttribute('x', xPos);
            t.setAttribute('y', yPos);
            t.setAttribute('font-size', '10px');
            t.setAttribute('fill', '#333');
            t.setAttribute('text-anchor', anchor || 'start');
            t.textContent = text;
            emGroup.appendChild(t);
        };
        // Adjusted positions for clarity, assuming needle pivot at (40,70)
        // Case: x="10" y="10" width="60" height="80"
        createEmText("0", 15, 78, 'middle');    // Bottom for needle start (y=70 is pivot)
        createEmText("Max", 15, 22, 'middle'); // Top mark (needle points up to y=30)
        // For a -45 to +45 sweep, 0 is horizontal left, mid is vertical, max is horizontal right
        // Let's adjust based on rotation: 0 charge is -45 deg (points left-up)
        // Max charge is +45 deg (points right-up)
        // So, "0" should be near where needle points at -45 deg.
        // "Max" should be near where needle points at +45 deg.
        // Let's simplify and use the text "0" and "Max" near the bottom and top of the scale.
        // The visual representation is more important than exact calibration for this sim.
    }


    // --- Event Listeners for Controls ---
    powerSwitch.addEventListener('change', (event) => {
        isPowerOn = event.target.checked;
        if (isPowerOn && !isGrounded) {
            startChargeAccumulation();
        } else {
            stopChargeAccumulation();
        }
        updateSimulation();
    });

    groundSwitch.addEventListener('change', (event) => {
        isGrounded = event.target.checked;
        if (isGrounded) {
            stopChargeAccumulation();
            mainDomeCharge = 0;
        } else {
            if (isPowerOn) {
                startChargeAccumulation();
            }
        }
        updateSimulation();
    });

    moveSphereCloserBtn.addEventListener('click', () => {
        if (dischargeSpherePositionIndex < DISCHARGE_SPHERE_POSITIONS_X.length - 1) {
            dischargeSpherePositionIndex++;
            dischargeSphereAssembly.setAttribute('transform', `translate(${DISCHARGE_SPHERE_POSITIONS_X[dischargeSpherePositionIndex]}, ${DISCHARGE_SPHERE_ASSEMBLY_Y_POS})`);
            updateSimulation();
        }
    });

    moveSphereFurtherBtn.addEventListener('click', () => {
        if (dischargeSpherePositionIndex > 0) {
            dischargeSpherePositionIndex--;
            dischargeSphereAssembly.setAttribute('transform', `translate(${DISCHARGE_SPHERE_POSITIONS_X[dischargeSpherePositionIndex]}, ${DISCHARGE_SPHERE_ASSEMBLY_Y_POS})`);
            updateSimulation();
        }
    });

    // --- Charge Accumulation Logic ---
    function startChargeAccumulation() {
        if (chargeAccumulationIntervalId === null) {
            chargeAccumulationIntervalId = setInterval(() => {
                if (isPowerOn && !isGrounded && mainDomeCharge < MAX_DOME_CHARGE) {
                    mainDomeCharge += chargeAccumulationRate;
                    if (mainDomeCharge > MAX_DOME_CHARGE) {
                        mainDomeCharge = MAX_DOME_CHARGE;
                    }
                }
                if (mainDomeCharge < 0) {
                    mainDomeCharge = 0;
                }
                updateSimulation();
            }, 200);
        }
    }

    function stopChargeAccumulation() {
        if (chargeAccumulationIntervalId !== null) {
            clearInterval(chargeAccumulationIntervalId);
            chargeAccumulationIntervalId = null;
        }
    }

    // --- Spark Logic ---
    function checkAndTriggerSpark() {
        if (isPowerOn &&
            !isGrounded &&
            mainDomeCharge >= SPARK_THRESHOLD_CHARGE &&
            dischargeSpherePositionIndex === SPARK_POSITION_THRESHOLD) {

            mainDomeCharge -= CHARGE_REDUCTION_PER_SPARK;
            if (mainDomeCharge < 0) mainDomeCharge = 0;

            const vdgTrans = vanDeGraaffGenerator.transform.baseVal[0].matrix;
            const mainDomeR = mainDome.r.baseVal.value;
            const x1 = vdgTrans.e + mainDomeR;
            const y1 = vdgTrans.f + mainDome.cy.baseVal.value;

            const dsTrans = dischargeSphereAssembly.transform.baseVal[0].matrix;
            const dsR = dischargeSphere.r.baseVal.value;
            const x2 = dsTrans.e - dsR;
            const y2 = dsTrans.f + dischargeSphere.cy.baseVal.value;

            const sparkLine = document.createElementNS(svgNS, "line");
            sparkLine.setAttribute('x1', x1);
            sparkLine.setAttribute('y1', y1);
            sparkLine.setAttribute('x2', x2);
            sparkLine.setAttribute('y2', y2);
            sparkLine.setAttribute('stroke', '#ffff00'); // Bright yellow
            sparkLine.setAttribute('stroke-width', '4px'); // Thicker
            sparkLine.setAttribute('stroke-linecap', 'round');
            sparkLine.setAttribute('filter', 'url(#sparkGlow)'); // Apply glow

            sparksContainer.appendChild(sparkLine);

            setTimeout(() => {
                if (sparkLine.parentNode === sparksContainer) {
                    sparksContainer.removeChild(sparkLine);
                }
            }, 150);
        }
    }

    // --- Update Simulation & Rendering ---
    function updateSimulation() {
        moveSphereCloserBtn.disabled = dischargeSpherePositionIndex >= DISCHARGE_SPHERE_POSITIONS_X.length - 1;
        moveSphereFurtherBtn.disabled = dischargeSpherePositionIndex <= 0;

        checkAndTriggerSpark();

        const needleBaseRotation = -45;
        const rotationRange = 90;
        const chargePercentage = mainDomeCharge / MAX_DOME_CHARGE;
        const electrometerRotation = needleBaseRotation + (chargePercentage * rotationRange);
        electrometerNeedle.setAttribute('transform', `rotate(${electrometerRotation} 40 70)`);

        renderMainDomeCharges();
        renderInducedCharges();
    }

    function renderMainDomeCharges() {
        mainDomeCharges.innerHTML = '';
        if (mainDomeCharge <= 0) return;

        const numChargesToDraw = Math.floor(mainDomeCharge / 10);
        const domeRadius = mainDome.r.baseVal.value;
        const rFactor = 0.85;

        for (let i = 0; i < numChargesToDraw; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const x = Math.cos(angle) * (domeRadius * rFactor);
            const y = -75 + (Math.sin(angle) * (domeRadius * rFactor));

            const textElement = document.createElementNS(svgNS, "text");
            textElement.setAttribute('x', x);
            textElement.setAttribute('y', y);
            textElement.setAttribute('fill', '#ff4d4d'); // Bright red
            textElement.setAttribute('font-size', '14px'); // Larger
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            // textElement.setAttribute('filter', 'url(#subtleShadow)'); // Optional
            textElement.textContent = '+';
            mainDomeCharges.appendChild(textElement);
        }
    }

    function renderInducedCharges() {
        dischargeSphereCharges.innerHTML = '';

        const showInducedThresholdIndex = DISCHARGE_SPHERE_POSITIONS_X.length - 2;
        if (mainDomeCharge < 20 || dischargeSpherePositionIndex < showInducedThresholdIndex) {
            return;
        }

        let numInducedChargePairs = Math.floor(
            (mainDomeCharge / MAX_DOME_CHARGE) * 5 * ((dischargeSpherePositionIndex + 1) / DISCHARGE_SPHERE_POSITIONS_X.length)
        );
        if (numInducedChargePairs === 0 && mainDomeCharge >=20) {
             numInducedChargePairs = Math.max(1, Math.floor((dischargeSpherePositionIndex - showInducedThresholdIndex +1)/2));
        }

        const sphereRadius = dischargeSphere.r.baseVal.value;
        const rFactor = 0.7;
        const sphereCY = dischargeSphere.cy.baseVal.value;

        for (let i = 0; i < numInducedChargePairs; i++) {
            let angleNeg = Math.PI + (Math.random() - 0.5) * (Math.PI / 1.5);
            const xNeg = Math.cos(angleNeg) * (sphereRadius * rFactor);
            const yNeg = sphereCY + Math.sin(angleNeg) * (sphereRadius * rFactor);

            const negText = document.createElementNS(svgNS, "text");
            negText.setAttribute('x', xNeg);
            negText.setAttribute('y', yNeg);
            negText.setAttribute('fill', '#4d4dff'); // Bright blue
            negText.setAttribute('font-size', '14px');
            negText.setAttribute('font-weight', 'bold');
            negText.setAttribute('text-anchor', 'middle');
            negText.setAttribute('dominant-baseline', 'middle');
            // negText.setAttribute('filter', 'url(#subtleShadow)'); // Optional
            negText.textContent = '-';
            dischargeSphereCharges.appendChild(negText);

            let anglePos = (Math.random() - 0.5) * (Math.PI / 1.5);
            const xPos = Math.cos(anglePos) * (sphereRadius * rFactor);
            const yPos = sphereCY + Math.sin(anglePos) * (sphereRadius * rFactor);

            const posText = document.createElementNS(svgNS, "text");
            posText.setAttribute('x', xPos);
            posText.setAttribute('y', yPos);
            posText.setAttribute('fill', '#ff4d4d'); // Bright red (same as main dome)
            posText.setAttribute('font-size', '14px');
            posText.setAttribute('font-weight', 'bold');
            posText.setAttribute('text-anchor', 'middle');
            posText.setAttribute('dominant-baseline', 'middle');
            // posText.setAttribute('filter', 'url(#subtleShadow)'); // Optional
            posText.textContent = '+';
            dischargeSphereCharges.appendChild(posText);
        }
    }

    // --- Initial Setup Calls ---
    initializeVisuals(); // Apply styles to SVG elements
    dischargeSphereAssembly.setAttribute('transform', `translate(${DISCHARGE_SPHERE_POSITIONS_X[dischargeSpherePositionIndex]}, ${DISCHARGE_SPHERE_ASSEMBLY_Y_POS})`);
    updateSimulation(); // Initial visual state
});
