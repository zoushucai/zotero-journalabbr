#!/bin/bash
read -p "Enter version number: " version 
rm "zotero-journalabbr-pulgin-${version}.xpi"
zip -r zotero-journalabbr-pulgin-${version}.xpi chrome/* chrome.manifest install.rdf