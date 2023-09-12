declare var dataProviders: any;
let generateButton;

type Iteration = {
  id: string
  friendlyPath: string
}

const getSelectedIteration: () => Iteration = () => {
  return {
    id: dataProviders.data["ms.vss-work-web.new-sprints-hub-taskboard-data-provider"].iterationId,
    friendlyPath: dataProviders.data["ms.vss-work-web.new-sprints-hub-taskboard-data-provider"].iterationPath
  };
}

async function createSummary() {
  const iteration = getSelectedIteration();
  console.log(`Creating summary for ${iteration.id}...`);
  document.dispatchEvent(new CustomEvent('getSummaryForIteration',
    {
      detail: iteration
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