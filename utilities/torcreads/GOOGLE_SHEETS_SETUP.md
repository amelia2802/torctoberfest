# Google Sheets Setup Guide

To use Google Sheets as your database, follow these steps:

> [!CAUTION]
> **CORS ERROR?** If you see a CORS error in your browser console, it usually means the script is crashing (e.g., a sheet name is wrong) or you didn't set access to **"Anyone"**. 
> Follow the troubleshooting steps below if this happens.

## 1. Create a Google Sheet
1. Create a new Google Sheet. (The file name doesn't matter, e.g., "torcReads Database" is fine).
2. **IMPORTANT**: Look at the tabs at the bottom. You must rename them or add new ones named exactly:
   - `books`
   - `study_guides`
   - `voting_options`
3. Add headers in the FIRST row (Row 1) of each tab:

### `books` tab headers:
| id | title | author | cover_url | date_read | rating | notes | added_by | is_member | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

### `study_guides` tab headers:
| id | title | book_title | file_url | file_name | file_size | uploaded_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

### `voting_options` tab headers:
| id | book_title | author | suggested_by | is_member | votes | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

## 2. Deploy Google Apps Script
1. Open your Google Sheet.
2. Go to **Extensions** > **Apps Script**.
3. Replace all existing code with the following:

```javascript
/**
 * Google Apps Script for TorcReads
 * Handles GET (fetch) and POST (save/update)
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action;
    
    if (action === 'getBooks') return getSheetData(ss, 'books');
    if (action === 'getGuides') return getSheetData(ss, 'study_guides');
    if (action === 'getVotes') return getSheetData(ss, 'voting_options');
    
    return createJsonResponse({ status: "error", message: "Invalid Action: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'saveBook') return appendToSheet(ss, 'books', data.row);
    if (action === 'saveGuide') return appendToSheet(ss, 'study_guides', data.row);
    if (action === 'saveVote') return appendToSheet(ss, 'voting_options', data.row);
    if (action === 'vote') return incrementVote(ss, 'voting_options', data.id);
    if (action === 'deleteBook') return deleteRow(ss, 'books', data.id);
    if (action === 'deleteGuide') return deleteRow(ss, 'study_guides', data.id);
    if (action === 'clearVotes') return clearAllExceptHeader(ss, 'voting_options');
    
    return createJsonResponse({ status: "error", message: "Invalid Action: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]); // Only header or empty
  
  var headers = data.shift();
  var result = data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return createJsonResponse(result);
}

function appendToSheet(ss, sheetName, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = headers.map(function(h) { 
    if (h === 'id') return Utilities.getUuid();
    if (h === 'created_at' || h === 'uploaded_at') return new Date();
    return rowData[h] !== undefined ? rowData[h] : ""; 
  });
  sheet.appendRow(newRow);
  return createJsonResponse({ status: "success" });
}

function incrementVote(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var currentVotes = parseInt(data[i][4]) || 0;
      sheet.getRange(i + 1, 5).setValue(currentVotes + 1);
      return createJsonResponse({ status: "success" });
    }
  }
  return createJsonResponse({ status: "error", message: "ID not found" });
}

function deleteRow(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ status: "success" });
    }
  }
  return createJsonResponse({ status: "error", message: "ID not found" });
}

function clearAllExceptHeader(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  return createJsonResponse({ status: "success" });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy** > **New Deployment**.
5. Select Type: **Web App**.
6. Description: `TorcReads API`.
7. Execute as: **Me**.
8. Who has access: **Anyone** (CRITICAL: Do not select "Anyone with a Google Account").
9. Copy the **Web App URL**.

> [!IMPORTANT]
> **Every time you change the script code**, you MUST create a **New Deployment** (or a new version) for the changes to take effect at that URL.

### 💡 Authorization Prompt
When you click "Deploy", Google will ask for permission:
1. Click **Authorize Access**.
2. Select your Google Account.
3. You might see a screen saying "Google hasn't verified this app". Click **Advanced**.
4. Click **Go to TorcReads API (unsafe)** at the bottom.
5. Click **Allow**.

## 3. Update Environment Variables
1. Open `.env.local` in this project.
2. Add the following line:
   ```env
   VITE_GOOGLE_SCRIPT_URL=YOUR_COPIED_URL_HERE
   ```
