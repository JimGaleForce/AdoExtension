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
  window.setTimeout(addGenerateButton, 100);
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

    const iterationString = document.getElementsByClassName("ms-CommandBarItem-commandText itemCommandText_278ff396")[0].textContent;

    let table = `<h3>Sprint summary for ${iterationString}</h3>`;

    let completed =       `<p>Completed:</p>
                              <ul>`;
    let addedMovedIn =    `   </ul>
                           <p>Added and/or moved in:</p>
                              <ul>`;
    let movedOut =        `   </ul>
                           <p>Moved out:</p>
                              <ul>`;
    let movedOff =        `   </ul>
                           <p>Moved off:</p>
                              <ul>`;

    const summary: IterationSummary = request.summary;
    let item: ItemSummary<WorkItemTags & CompletedTag & IterationTrackerTag & ReassignedTag>;
    for (item of summary.workItems) {
      let formattedString = formatWorkItem(item.id.toString(), item.title);

      if (item.tags.completedByMe) {
        completed = completed.concat(formattedString);
      }
      if (item.tags.reassigned?.toMe || item.tags.moved?.intoIteration) {
        addedMovedIn = addedMovedIn.concat(formattedString);
      }
      if (item.tags.reassigned?.fromMe) {
        movedOff = movedOff.concat(formattedString);
      }
      if (item.tags.moved?.outOfIteration) {
        movedOut = movedOut.concat(formattedString);
      }
    }


    table = table.concat(completed)
                 .concat(addedMovedIn)
                 .concat(movedOut)
                 .concat(movedOff)
                 .concat("</ul>"); // closing tag


    const url = window.URL.createObjectURL(new Blob([table], {type: 'text/html'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
);

waitFirst();

export {}
