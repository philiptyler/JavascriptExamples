function CloseAndSave() {
    var uploadDashboardSelector = window.$find(window.uploadDashboardSelectorID);
    var inputs = uploadDashboardSelector.getFileInputs();

    if (inputs[0].value.length == 0) {
        window.radalert('Select a dashboard to upload.', 275, 125, 'Error uploading dashboard.');
        return;
    }

    if( !window.radUpload.isExtensionValid(inputs[0].value) ) {
        window.radalert('Please select an XML file.', 250, 100, 'Error uploading dashboard.');
        uploadDashboardSelector.clearFileInputAt(0);
        return;
    }

    window.oWindow = null;
    window.__doPostBack(window.submitUploadDashboardButtonID);
}

function UploadDashboardClosed() {
    window.oWindow = null;
}