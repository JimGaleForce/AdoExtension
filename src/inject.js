
let generateButton;

function getIterationId() {
    document.dispatchEvent(new CustomEvent('getSummaryForIteration', { detail: dataProviders.data["ms.vss-work-web.sprints-hub-content-header-data-provider"].selectedIteration.id }));
}

async function addGenerateButton() {
    generateButton = document.createElement("button");
    generateButton.textContent = "Generate summary";
    // copy styling from ADO button
    generateButton.className = "vss-PivotBar--button bolt-button enabled bolt-focus-treatment";
    // generateButton.onclick = createSummary;

    generateButton.addEventListener("click", getIterationId);

    //TODO: check that we're on an iteration view first
    let topBar = document.getElementsByClassName("vss-HubTileRegion")[0];
    if (topBar) {
        topBar.prepend(generateButton);
    }
}

function waitFirst() {
    window.setTimeout(addGenerateButton, 1000);
}


waitFirst();