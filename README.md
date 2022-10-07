ADO line highlighter : Jim Gale

In the Search box, type in the words you want to have rows highlighted when present, but do not press Enter.
Separate (or) words with commas, separate (and) words with '+'.

Example: [bracket indicates inside the search box]

[Jim,FY23Q2] 
   would search for Jim and highlight the line with the first color (yellow)
   would search for FY23Q2 and highlight the line with the second color (green) (overwriting the first color, if present).

[Jim+FY23Q2]
   would search for lines that include both Jim and FY23Q2 on the same line, then highlight.

You can combine up to 5 'or' words: [Jim,Tammy,Marc+Q2,Irene,Jack]

Tricks:
   To find exclusionary phrases, be more specific on the 2nd term and only look for the first.
   Example:
   [FY23Q2,>FY23Q2]
     FY23Q2 would be highlighted in yellow,
     >FY23Q2 would be highlighted in green. Only look for the yellow to skip the >FY23Q2 ones.
