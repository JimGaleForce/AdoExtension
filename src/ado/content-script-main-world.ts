let generateButton;

function parseURL(): { organization: string, project: string, team: string, iteration: string } {
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
  const iteration = decodeURIComponent(pathParts[6]);

  return {
      organization,
      project,
      team,
      iteration
  };
}

async function createSummary() {
  const data = parseURL();
  console.log(`Creating summary for ${data.iteration}...`);
  document.dispatchEvent(new CustomEvent('getSummaryForIteration',
    {
      detail: data
    }));
}

async function addGenerateButton() {
  generateButton = document.createElement("button");
  generateButton.textContent = "Generate summary";

  // copy styling from ADO button
  generateButton.id = "generate-summary-button"
  generateButton.className = "vss-PivotBar--button bolt-button enabled bolt-focus-treatment";
  generateButton.onclick = createSummary;

  //TODO: check that we're on an iteration view first
  let topBar = document.getElementsByClassName("sprints-tabbar-header-commandbar")[1];
  if (topBar) {
    topBar.prepend(generateButton);
  } else {
    waitFirst();
  }
}

function waitFirst() {
  window.setTimeout(addGenerateButton, 100);
}

waitFirst();

export { }