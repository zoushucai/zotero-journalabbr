	zoteroifinitPreferences = function() {
		var journalabbrbyzsc_url = Zotero.journalabbrbyzsc.journalabbrbyzsc_url();
		var automatic_updateif_zsc_bool = Zotero.journalabbrbyzsc.automatic_updateif_zsc();

		// Apply setting to
		document.getElementById('id-journalabbrbyzsc-automatic-pdf-download').checked = automatic_updateif_zsc_bool
		document.getElementById('id-journalabbrbyzsc-journalabbrbyzsc-url').value = journalabbrbyzsc_url
	}
