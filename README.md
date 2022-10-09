# ADO Extension

ADO Extension / ADO Highlighter has 2 power tools:
* Highlights lines based on text in the search box in a Backlog/Sprint
![Search box](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/search.png "Search box")
![Colored lines in ADO](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/colors.png "Colored lines")
* Shows Proposed items in yellow in the Work details
![Proposed in yellow](https://raw.githubusercontent.com/JimGaleForce/AdoExtension/main/proposed.png "Proposed")

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

For Proposed Work details:
* For a current backlog/sprint, use the [...] menu to Create a Query
* Go to and get the GUID Id from the query (in the URL)
* Go back to your backlog/sprint, click on the extension's icon, add the query id and save
* Refresh the whole page to see the Proposed-as-yellow colors in the Work details after a few seconds

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Created By

Jim Gale