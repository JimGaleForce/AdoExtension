// (async () => {
//   const src = chrome.runtime.getURL("ado/summary");
//   const contentMain = await import(src);
//   // contentMain.main();
// })();

import { SummaryForIteration } from "./summary";


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
  // contentMain.SummaryForIteration('f35df25f-e9d5-46da-9c92-e100da93cf3f');
  const iterationId = 'f35df25f-e9d5-46da-9c92-e100da93cf3f'
  await chrome.storage.local.set({generate: iterationId});
  await chrome.runtime.sendMessage('generate', (response) => {
    const url = window.URL.createObjectURL(new Blob([response], {type: 'text/plain'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.click();
    window.URL.revokeObjectURL(url);
  });


}

waitFirst();
