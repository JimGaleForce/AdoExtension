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
  return `<li><a href="${url}">${itemId}</a>: ${title} </li>`
}

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    console.log("Got response");
    console.log(request);
    generateButton.textContent = "Generate summary"; // reset button text

    let table = '<h3>Sprint summary</h3>';

    let completed = "<p>Scheduled and completed:</p>\n";
    let addedMovedIn = "<p>Added and/or moved in:</p>\n";
    let movedOut = "<p>Moved out:</p>\n";
    let movedOff = "<p>Moved to someone else:</p>\n";

    const summary: IterationSummary = request.summary;
    let item: ItemSummary<WorkItemTags & CompletedTag & IterationTrackerTag & ReassignedTag>;
    for (item of summary.workItems) {
      let formattedString = formatWorkItem(item.id.toString(), item.title);

      if (item.tags.completedByMe) {
        completed.concat(formattedString);
      } else if (item.tags.reassigned?.toMe || item.tags.moved?.intoIteration) {
        addedMovedIn.concat(formattedString);
      } else if (item.tags.reassigned?.fromMe) {
        movedOff.concat(formattedString);
      } else if (item.tags.moved?.outOfIteration) {
        movedOut.concat(formattedString);
      }
    }


    table.concat(completed);
    table.concat(addedMovedIn);
    table.concat(movedOut);
    table.concat(movedOff);


<<<<<<< HEAD
    const url = window.URL.createObjectURL(new Blob([table], {type: 'text/html'}));
=======
    const url = window.URL.createObjectURL(new Blob([table, completed, addedMovedIn], {type: 'text/html'}));
>>>>>>> b40c860bc6383b60e3b1e35fe2031eedc72666c1
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
);

waitFirst();

export {}
