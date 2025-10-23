/**
 * UI Controls Module
 * Handles the creation and management of all UI controls for the application
 */

export function createModelSelector(modelOptions) {
    const modelSelector = document.createElement('select');
    modelSelector.style.position = 'absolute';
    modelSelector.style.top = '20px';
    modelSelector.style.left = '20px';
    modelSelector.style.zIndex = '1000';

    Object.keys(modelOptions).forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.text = model.charAt(0).toUpperCase() + model.slice(1);
        modelSelector.appendChild(option);
    });

    document.body.appendChild(modelSelector);
    return modelSelector;
}

export function createEnvironmentMapControls() {
    // Metal environment map controls
    const metalEnvMapUploadButton = document.createElement('input');
    metalEnvMapUploadButton.type = 'file';
    metalEnvMapUploadButton.accept = '.exr, .hdr, .jpg, .jpeg, .png';
    metalEnvMapUploadButton.style.position = 'absolute';
    metalEnvMapUploadButton.style.top = '50px';
    metalEnvMapUploadButton.style.left = '20px';
    metalEnvMapUploadButton.style.zIndex = '1000';

    const metalEnvMapLabel = document.createElement('label');
    metalEnvMapLabel.innerHTML = 'Metal Env (HDR/EXR/JPG/PNG)';
    metalEnvMapLabel.style.position = 'absolute';
    metalEnvMapLabel.style.top = '20px';
    metalEnvMapLabel.style.left = '150px';
    metalEnvMapLabel.style.zIndex = '1000';
    metalEnvMapLabel.style.color = 'white';

    // Diamond environment map controls
    const diamondEnvMapUploadButton = document.createElement('input');
    diamondEnvMapUploadButton.type = 'file';
    diamondEnvMapUploadButton.accept = '.exr, .hdr, .jpg, .jpeg, .png';
    diamondEnvMapUploadButton.style.position = 'absolute';
    diamondEnvMapUploadButton.style.top = '80px';
    diamondEnvMapUploadButton.style.left = '20px';
    diamondEnvMapUploadButton.style.zIndex = '1000';

    const diamondEnvMapLabel = document.createElement('label');
    diamondEnvMapLabel.innerHTML = 'Diamond Env (HDR/EXR/JPG/PNG)';
    diamondEnvMapLabel.style.position = 'absolute';
    diamondEnvMapLabel.style.top = '80px';
    diamondEnvMapLabel.style.left = '150px';
    diamondEnvMapLabel.style.zIndex = '1000';
    diamondEnvMapLabel.style.color = 'white';

    // Add to DOM
    document.body.appendChild(metalEnvMapUploadButton);
    document.body.appendChild(metalEnvMapLabel);
    document.body.appendChild(diamondEnvMapUploadButton);
    document.body.appendChild(diamondEnvMapLabel);

    return {
        metalEnvMapUploadButton,
        metalEnvMapLabel,
        diamondEnvMapUploadButton,
        diamondEnvMapLabel
    };
}

export function createIntensitySliders() {
    // Metal environment intensity slider
    const metalEnvIntensitySlider = document.createElement('input');
    metalEnvIntensitySlider.type = 'range';
    metalEnvIntensitySlider.min = '0';
    metalEnvIntensitySlider.max = '5';
    metalEnvIntensitySlider.step = '0.1';
    metalEnvIntensitySlider.value = '1.7';
    metalEnvIntensitySlider.style.position = 'absolute';
    metalEnvIntensitySlider.style.top = '110px';
    metalEnvIntensitySlider.style.left = '20px';
    metalEnvIntensitySlider.style.zIndex = '1000';

    const metalEnvIntensityLabel = document.createElement('label');
    metalEnvIntensityLabel.innerHTML = 'Metal Env Intensity: 1.7';
    metalEnvIntensityLabel.style.position = 'absolute';
    metalEnvIntensityLabel.style.top = '110px';
    metalEnvIntensityLabel.style.left = '150px';
    metalEnvIntensityLabel.style.zIndex = '1000';
    metalEnvIntensityLabel.style.color = 'white';

    // Diamond environment intensity slider
    const diamondEnvIntensitySlider = document.createElement('input');
    diamondEnvIntensitySlider.type = 'range';
    diamondEnvIntensitySlider.min = '0';
    diamondEnvIntensitySlider.max = '5';
    diamondEnvIntensitySlider.step = '0.1';
    diamondEnvIntensitySlider.value = '2.0';
    diamondEnvIntensitySlider.style.position = 'absolute';
    diamondEnvIntensitySlider.style.top = '140px';
    diamondEnvIntensitySlider.style.left = '20px';
    diamondEnvIntensitySlider.style.zIndex = '1000';

    const diamondEnvIntensityLabel = document.createElement('label');
    diamondEnvIntensityLabel.innerHTML = 'Diamond Env Intensity: 2.0';
    diamondEnvIntensityLabel.style.position = 'absolute';
    diamondEnvIntensityLabel.style.top = '140px';
    diamondEnvIntensityLabel.style.left = '150px';
    diamondEnvIntensityLabel.style.zIndex = '1000';
    diamondEnvIntensityLabel.style.color = 'white';

    // Add to DOM
    document.body.appendChild(metalEnvIntensitySlider);
    document.body.appendChild(metalEnvIntensityLabel);
    document.body.appendChild(diamondEnvIntensitySlider);
    document.body.appendChild(diamondEnvIntensityLabel);

    return {
        metalEnvIntensitySlider,
        metalEnvIntensityLabel,
        diamondEnvIntensitySlider,
        diamondEnvIntensityLabel
    };
}

export function createPostProcessingControls() {
    // Bloom strength slider
    const bloomStrengthSlider = document.createElement('input');
    bloomStrengthSlider.type = 'range';
    bloomStrengthSlider.min = '0';
    bloomStrengthSlider.max = '3';
    bloomStrengthSlider.step = '0.1';
    bloomStrengthSlider.value = '0.0';
    bloomStrengthSlider.style.position = 'absolute';
    bloomStrengthSlider.style.top = '170px';
    bloomStrengthSlider.style.left = '20px';
    bloomStrengthSlider.style.zIndex = '1000';

    const bloomStrengthLabel = document.createElement('label');
    bloomStrengthLabel.innerHTML = 'Bloom Strength: 0.0';
    bloomStrengthLabel.style.position = 'absolute';
    bloomStrengthLabel.style.top = '170px';
    bloomStrengthLabel.style.left = '150px';
    bloomStrengthLabel.style.zIndex = '1000';
    bloomStrengthLabel.style.color = 'white';

    // Dispersion slider
    const dispersionSlider = document.createElement('input');
    dispersionSlider.type = 'range';
    dispersionSlider.min = '0';
    dispersionSlider.max = '0.01';
    dispersionSlider.step = '0.0001';
    dispersionSlider.value = '0';
    dispersionSlider.style.position = 'absolute';
    dispersionSlider.style.top = '200px';
    dispersionSlider.style.left = '20px';
    dispersionSlider.style.zIndex = '1000';

    const dispersionLabel = document.createElement('label');
    dispersionLabel.innerHTML = 'Dispersion: 0.0000';
    dispersionLabel.style.position = 'absolute';
    dispersionLabel.style.top = '200px';
    dispersionLabel.style.left = '150px';
    dispersionLabel.style.zIndex = '1000';
    dispersionLabel.style.color = 'white';

    // Add to DOM
    document.body.appendChild(bloomStrengthSlider);
    document.body.appendChild(bloomStrengthLabel);
    document.body.appendChild(dispersionSlider);
    document.body.appendChild(dispersionLabel);

    return {
        bloomStrengthSlider,
        bloomStrengthLabel,
        dispersionSlider,
        dispersionLabel
    };
}

export function createDebugControls() {
    const debugModeSelect = document.createElement('select');
    debugModeSelect.style.position = 'absolute';
    debugModeSelect.style.top = '230px';
    debugModeSelect.style.left = '20px';
    debugModeSelect.style.zIndex = '1000';

    const debugOptions = [
        { value: 'normal', text: 'Normal Rendering' },
        { value: 'vertex', text: 'Vertex Debug' },
        { value: 'eyevector', text: 'Eye Vector' },
        { value: 'reflection_dir', text: 'Reflection Direction' },
        { value: 'reflection', text: 'Reflection Only' },
        { value: 'fresnel', text: 'Fresnel Only' },
        { value: 'refraction', text: 'Refraction Only' }
    ];

    debugOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        debugModeSelect.appendChild(optionElement);
    });

    const debugModeLabel = document.createElement('label');
    debugModeLabel.innerHTML = 'Debug Mode: Normal';
    debugModeLabel.style.position = 'absolute';
    debugModeLabel.style.top = '230px';
    debugModeLabel.style.left = '150px';
    debugModeLabel.style.zIndex = '1000';
    debugModeLabel.style.color = 'white';

    document.body.appendChild(debugModeSelect);
    document.body.appendChild(debugModeLabel);

    return {
        debugModeSelect,
        debugModeLabel,
        debugOptions
    };
}

export function createDiamondPreview() {
    const diamondEnvPreviewContainer = document.createElement('div');
    diamondEnvPreviewContainer.style.position = 'absolute';
    diamondEnvPreviewContainer.style.top = '20px';
    diamondEnvPreviewContainer.style.right = '20px';
    diamondEnvPreviewContainer.style.width = '160px';
    diamondEnvPreviewContainer.style.zIndex = '1000';
    diamondEnvPreviewContainer.style.display = 'flex';
    diamondEnvPreviewContainer.style.flexDirection = 'column';
    diamondEnvPreviewContainer.style.alignItems = 'center';
    diamondEnvPreviewContainer.style.gap = '6px';

    const diamondEnvPreviewTitle = document.createElement('div');
    diamondEnvPreviewTitle.textContent = 'Diamond HDR';
    diamondEnvPreviewTitle.style.color = 'white';
    diamondEnvPreviewTitle.style.fontFamily = 'sans-serif';
    diamondEnvPreviewTitle.style.fontSize = '12px';
    diamondEnvPreviewTitle.style.opacity = '0.9';

    const diamondEnvPreview = document.createElement('img');
    diamondEnvPreview.alt = 'Diamond Env Preview';
    diamondEnvPreview.style.width = '160px';
    diamondEnvPreview.style.height = '90px';
    diamondEnvPreview.style.objectFit = 'cover';
    diamondEnvPreview.style.border = '1px solid rgba(255,255,255,0.3)';
    diamondEnvPreview.style.borderRadius = '4px';
    diamondEnvPreview.style.background = 'rgba(0,0,0,0.2)';

    const diamondEnvCaption = document.createElement('div');
    diamondEnvCaption.style.color = 'white';
    diamondEnvCaption.style.fontFamily = 'sans-serif';
    diamondEnvCaption.style.fontSize = '11px';
    diamondEnvCaption.style.textAlign = 'center';
    diamondEnvCaption.style.opacity = '0.8';
    diamondEnvCaption.textContent = '';

    diamondEnvPreviewContainer.appendChild(diamondEnvPreviewTitle);
    diamondEnvPreviewContainer.appendChild(diamondEnvPreview);
    diamondEnvPreviewContainer.appendChild(diamondEnvCaption);
    document.body.appendChild(diamondEnvPreviewContainer);

    return {
        diamondEnvPreviewContainer,
        diamondEnvPreview,
        diamondEnvCaption
    };
}
