/**
 * Golf Major Pool — Pick Submission Script
 *
 * Setup:
 * 1. In your Google Sheet: Extensions > Apps Script
 * 2. Paste this entire file into Code.gs (replace any existing content)
 * 3. Click Deploy > New deployment
 * 4. Type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Click Deploy, authorize when prompted
 * 8. Copy the Web app URL and add it to your Config tab as: submitUrl
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var name = (data.name || '').trim();
    var picks = data.picks || [];

    if (!name) {
      return jsonResponse({ ok: false, error: 'Name is required.' });
    }
    if (picks.length !== 5 || picks.some(function(p) { return !p || !p.trim(); })) {
      return jsonResponse({ ok: false, error: 'Exactly 5 picks are required.' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Entries');
    if (!sheet) {
      return jsonResponse({ ok: false, error: 'Entries tab not found in spreadsheet.' });
    }

    // Check for duplicate name
    var existingData = sheet.getDataRange().getValues();
    for (var i = 1; i < existingData.length; i++) {
      if (existingData[i][0] && existingData[i][0].toString().toLowerCase() === name.toLowerCase()) {
        return jsonResponse({ ok: false, error: 'Name "' + name + '" already exists. Use a different name.' });
      }
    }

    // Append the new entry
    sheet.appendRow([name, picks[0].trim(), picks[1].trim(), picks[2].trim(), picks[3].trim(), picks[4].trim()]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Server error: ' + err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
