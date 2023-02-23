# ADO Extension

ADO Extension / ADO Highlighter has 3 power tools:
* Highlights lines based on text in the search box in a Backlog/Sprint
![Search box](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/search.png "Search box")
![Colored lines in ADO](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/colors.png "Colored lines")

* Shows Proposed items in yellow in the Work details
![Proposed in yellow](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/proposed.png "Proposed")

* Generate sprint summaries for your team
![Generate Summary](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/generateSummary.png "Generate Summary")
![Sprint Summary](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/sprintSummary.png "Sprint Summary")

## Installation

Download this code (unzip if zipped), go to Extensions in your Edge browser, enable Developer Mode, and 'Load Unpacked' this directory.

## Usage

For Highlighting:
* Load a backlog list
* Type some text in the Search box, but do not press Enter
* The lines which have that text should be highlighted
* To search different items, separate by comma: "This,That" shows in different colors
* To search a combination of (and'd) items, separate by a plus (+): "This+that,other+that"
* To change colors, click the extension's icon, change colors and Save
![Popup](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/popup.png "Popup")

For Proposed Work details:
* For a current backlog/sprint, use the [...] menu to Create a Query
* Go to and get the GUID Id from the query (in the URL)
* Go back to your backlog/sprint, click on the extension's icon, add the query id and save
* Refresh the whole page to see the Proposed-as-yellow colors in the Work details after a few seconds

For Sprint Summaries:
* Set your organization, project, team, and email in the extension (click the extensions icon)
* Go to your desired sprint
* Click "Generate Summary" 

## Setting up Development Environment

This extension requires NPM to be installed. It uses Vite to compile the extension.

To build this extension, perform the following:
* Download the repository locally
* Open the repository in VSCode
* Run `npm install` to grab all the necessary packaages
* If developing:
  * Run `npm run dev`
  * This will create a `dist` folder with the extensions distribution files
  * In your Edge browser, go to the extension page, and click `Load Unpacked`. Select the `Dist` folder that was created
  * Any changes you make will be live updated to the extension
* If distributing:
  * Run `npm run build`
  * This will create a `dist` folder with the minified, and compressed extensions distribution files
  * Zip the contents of the dist folder, and distribute that in the extension marketplace
  * **Note:** If the extension is loaded unpacked in Edge when the production build is made, ensure you go back to the extensions page and select `Reload` on the extension

## Testing

Testing infrastructure is currently not in place at this time. Right now the best way to test is to run the development environment and check the extensions page for any errors.

Due to the way hotswappable modules work, you may encounter errors that point to Vite. Whenever you make a change, please ensure to `Reload` the extension, and clear all errors.
If you proceed to get an error after performing these steps, then the error is likely valid.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Created By

Jim Gale