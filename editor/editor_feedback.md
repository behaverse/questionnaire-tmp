



In the structure panel:
currently the items are represented by an index and the text of the prompt and below that text the id off the prompt. if there are other elements in that item it would be useful to list them as well (e.g., ref to option) as this would provide a good overview of the questionnaire and its consistency.







Maybe add a button in the start screen specially dedicated to translating. 

Not clear in the editor how content is assigned to pages. 
for the video gaming questionnaire, it looks like all the questions are on the same page; the preview should show all the content at once (scrollable as it is now) with a visual horizontal sepration between pages (as it is now too); by default if item is at root it means its on its own page; if there's a page with nested items that should be visible in the structure.



When clicking on translate in the top bar a new view is presented. The main page simply states "Pick a non-primary editing language in the top bar to translate." which is not very clear. Also if one clicks on the "Editing language" dropdown, and the the language to be translated in has not added yet, the user is stuck. Instead, the main page should offer instructrions on how to translate, including a options to create a new language for that questionnaire.


Currently only the preview panel visibility can be toggled; this should perhaps also apply to other elements; in particular the inspector.


It would be useful to have a "translate" button in the main page that would direct to a page that helps translate various elements of the database; for example one could select "option" and get a list of the options in the database that lack translations in a given language to then have the user fill in those translations.  




the search on the context does not work properly, only searches for elements in the id rather than everywhere.

The model page that appears when clicking on pick should disappear only if users close the window, not when they click outside of that model window



Currently there are buttons for "+ Add" and "Pick". We want to prevent the user from creating elements that already exist in the database. So instead of two buttons, there should be only one that says "+ Add" and which opens up a modal page that corresponds to the current "Pick" page. Only if there is no match, should the user be allowed to click a button that says "create"; this would open a new modal page prompting to enter that new information. If there's a match, the user could pick one of the matches and press "insert" as it is now.


-> it would be useful to have a means to check that the new item is not already in the database. Maybe after people entered information about the element there could be search for similar elemnts in the database and the user could then decide whether to use the version already in the database or instead use their own.


The way modifying existing elements is currently handled is neither clear nor consistent.
for example, if I select a questionnaire from a library and look at an item I may only see the refs not their actual content. It would be better to display the content of those elements (all greyed out and not editable). Also the ref to the option is prefixed with "Referenced option " while other refs (e.g, ref to prompt are not prefixed): don't use prefixes.


Instead of "Fork to edit" only say "edit"; when clicking on that button the mdoal page indicates that to edit a local copy needs to be created. 