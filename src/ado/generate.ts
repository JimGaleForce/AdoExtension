import { ItemSummary, IterationSummary } from "../models/adoSummary";
import { BugTag, CompletedTag, IterationTrackerTag, WorkItemTags } from "../models/ItemTag";
import { ReassignedTag } from "../models/ItemTag/ReassignedTag";

let generateButton: HTMLButtonElement;

async function addGenerateButton() {
  generateButton = document.createElement("button");
  generateButton.textContent = "Generate summary";
  // copy styling from ADO button
  generateButton.className = "vss-PivotBar--button bolt-button enabled bolt-focus-treatment";
  generateButton.onclick = createSummary;

  //TODO: check that we're on an iteration view first
  let topBar = document.getElementsByClassName("vss-HubTileRegion")[0];
  if (topBar) {
    topBar.prepend(generateButton);
  }
}

function waitFirst() {
  window.setTimeout(addGenerateButton, 1000);
}


async function createSummary() {
  console.log(`Creating summary for f35df25f-e9d5-46da-9c92-e100da93cf3f...`);
  let resp = await chrome.runtime.sendMessage({
    action: 'iterationSummary',
    iterationId: 'f35df25f-e9d5-46da-9c92-e100da93cf3f'
  });
  generateButton.textContent = "Creating..."
}

function formatWorkItem(itemId: string, title: string) {
  let url = `(https://microsoft.visualstudio.com/Edge/_workitems/edit/${itemId})`;
  return `- [${itemId}](${url}): ${title}\n`;
}

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    console.log("Got response");
    console.log(request);
    generateButton.textContent = "Generate summary";

    let table = '## Sprint summary';

    let completed = "### Scheduled and completed\n";
    let addedMovedIn = "### Added and/or moved in\n";
    let movedOut = "### Moved out\n";
    let movedOff = "### Moved to someone else\n";

    const summary: IterationSummary = request.summary;
    let item: ItemSummary<WorkItemTags & CompletedTag & IterationTrackerTag & ReassignedTag>;
    for (item of summary.workItems) {
      let mdString = formatWorkItem(item.id.toString(), item.title);

      if (item.tags.completedByMe) {
        completed.concat(mdString);
      } else if (item.tags.reassigned?.toMe || item.tags.moved?.intoIteration) {
        addedMovedIn.concat(mdString);
      } else if (item.tags.reassigned?.fromMe) {
        movedOff.concat(mdString);
      } else if (item.tags.moved?.outOfIteration) {
        movedOut.concat(mdString);
      }
    }


    table.concat(completed);
    table.concat(addedMovedIn);
    table.concat(movedOut);
    table.concat(movedOff);


    const url = window.URL.createObjectURL(new Blob([table], {type: 'text/markdown'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
);

waitFirst();

export {}
