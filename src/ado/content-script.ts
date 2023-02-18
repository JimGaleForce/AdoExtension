import { IterationSummary, ItemSummary } from "../models/adoSummary";
import { WorkItemTags, CompletedTag, IterationTrackerTag } from "../models/ItemTag";
import { ReassignedTag } from "../models/ItemTag/ReassignedTag";

// @ts-ignore: valid import
import mainWorld from "./content-script-main-world?script&module";

const script = document.createElement("script");
script.src = chrome.runtime.getURL(mainWorld);
script.type = "module";
script.addEventListener("load", () => {
    console.log("script loaded");
});
script.addEventListener("error", (err) => {
    console.log("script error");
    console.error(err);
});

console.log("starting script");
document.head.append(script);

function updateGenerateButtonText(text: string) {
    const button = document.getElementById("generate-summary-button")
    if (button) {
        button.textContent = text;
    }
}

function formatWorkItem(itemId: string, title: string) {
    let url = `(https://microsoft.visualstudio.com/Edge/_workitems/edit/${itemId})`;
    return `<li><a href="${url}">${itemId}</a>: ${title} </li>`
}

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {

        updateGenerateButtonText("Generate summary");
        console.log("Got response");
        console.log(request);
        const summary = request.summary as IterationSummary;

        let table = `<h3>Sprint summary for ${summary.iteration.name}</h3>`;

        let completed = `<p>Completed:</p>
                                <ul>`;
        let addedMovedIn = `   </ul>
                             <p>Added and/or moved in:</p>
                                <ul>`;
        let movedOut = `   </ul>
                             <p>Moved out:</p>
                                <ul>`;
        let movedOff = `   </ul>
                             <p>Moved off:</p>
                                <ul>`;

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


        const url = window.URL.createObjectURL(new Blob([table], { type: 'text/html' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.click();
        window.URL.revokeObjectURL(url);
    }
);



document.addEventListener('getSummaryForIteration', function (e: any) {
    const iteration = e.detail;

    if (iteration) {
        updateGenerateButtonText("Generating...");
        chrome.runtime.sendMessage({
            action: 'iterationSummary',
            iteration: iteration
        });
    }
});
