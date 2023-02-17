async function addGenerateButton() {
  //TODO: check that we're on an iteration view first
  let topBar = document.getElementsByClassName("vss-HubTileRegion")[0];

  let generateButton = document.createElement("button");
  generateButton.textContent = "Generate summary";
  // copy styling from ADO button
  generateButton.className = "vss-PivotBar--button bolt-button enabled bolt-focus-treatment";
  generateButton.onclick = createSummaryAndOpen;

  topBar.prepend(generateButton);

}

function waitFirst() {
  window.setTimeout(addGenerateButton, 1000);
}


async function createSummaryAndOpen() {
  console.log(`Summary for f35df25f-e9d5-46da-9c92-e100da93cf3f`);
  let resp = await chrome.runtime.sendMessage({
    action: 'iterationSummary',
    iterationId: 'f35df25f-e9d5-46da-9c92-e100da93cf3f'
  });
  console.log(resp);
}

waitFirst();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Got response");
    console.log(request);
  }
);

export {}