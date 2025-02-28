declare var dataProviders: any;
let generateIterationSummaryButton;
let generateCycleSummaryButton;

function parseURL(): { organization: string, project: string, team: string, cycle: string, iteration: string } {
  // Grab the current page's url
  const url = new URL(window.location.href);

  // Parse the URL and split by '/'
  const pathParts = url.pathname.split('/').filter(part => part);

  if (pathParts.length < 7) {
    throw new Error('Unexpected URL format!');
  }

  // Extract parts of the URL
  const organization = url.hostname.split('.')[0];
  const project = pathParts[0];
  const team = decodeURIComponent(pathParts[3]);
  const cycle = decodeURIComponent(pathParts[5]);
  const iteration = decodeURIComponent(pathParts[6]);

  return {
    organization,
    project,
    team,
    cycle,
    iteration
  };
}

async function createCycleSummary() {
  const data = parseURL();
  console.log(`Creating cycle summary for: ${data.cycle}.`);
  document.dispatchEvent(new CustomEvent('getSummaryForCycle',
    {
      detail: data
    }));
}

async function createIterationSummary() {
  const data = parseURL();
  console.log(`Creating iteration summary for: ${data.iteration}.`);
  document.dispatchEvent(new CustomEvent('getSummaryForIteration',
    {
      detail: data
    }));
}

async function addGenerateButtons() {
  if (!dataProviders?.sharedData?._features) {
    window.setTimeout(waitFirst, 100);
    return;
  }

  const isNewAdoHub = dataProviders.sharedData._features["ms.vss-work-web.new-boards-hub-feature"] === true;

  let topBar = isNewAdoHub ? 
    document.getElementsByClassName("sprints-tabbar-header-commandbar")[1] :
    document.getElementsByClassName("vss-HubTileRegion")[0];

  if (topBar) {
    // Cycle summary
    generateCycleSummaryButton = document.createElement("button");
    generateCycleSummaryButton.textContent = "Cycle summary";

    // copy styling from ADO button
    generateCycleSummaryButton.id = "generate-summary-button"
    generateCycleSummaryButton.className = isNewAdoHub ?
      "vss-PivotBar--button bolt-button enabled bolt-focus-treatment" :
      "vss-PivotBar--button bolt-button enabled bolt-focus-treatment";
      generateCycleSummaryButton.onclick = createCycleSummary;
    topBar.prepend(generateCycleSummaryButton);

    // Iteration summary
    generateIterationSummaryButton = document.createElement("button");
    generateIterationSummaryButton.textContent = "Iteration summary";

    // copy styling from ADO button
    generateIterationSummaryButton.id = "generate-summary-button"
    generateIterationSummaryButton.className = isNewAdoHub ?
      "vss-PivotBar--button bolt-button enabled bolt-focus-treatment" :
      "vss-PivotBar--button bolt-button enabled bolt-focus-treatment";
    generateIterationSummaryButton.onclick = createIterationSummary;
    topBar.prepend(generateIterationSummaryButton);
  } else {
    waitFirst();
  }
}

function waitFirst() {
  window.setTimeout(addGenerateButtons, 100);
}

waitFirst();

export { }