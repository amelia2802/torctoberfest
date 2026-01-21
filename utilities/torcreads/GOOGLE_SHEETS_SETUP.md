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

### `genre_votes` tab headers:
| id | name | votes |
| :--- | :--- | :--- |

### `users` tab headers:
| email | name | is_admin | last_active |
| :--- | :--- | :--- | :--- |

### `user_genre_history` tab headers:
| email | genre_name | voted_at |
| :--- | :--- | :--- |

## 2. Deploy Google Apps Script
1. Open your Google Sheet.
2. Go to **Extensions** > **Apps Script**.
3. Replace all existing code with the following:

```javascript
/**
 * Google Apps Script for TorcReads
 * Handles GET (fetch) and POST (save/update)
 */

/**
 * Google Apps Script for TorcReads
 * Handles ALL operations via doGet for CORS compatibility
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload;
    
    // We expect writes to pass a 'payload' JSON string to stay under URL length limits
    if (e.parameter.payload) {
      payload = JSON.parse(e.parameter.payload);
    } else {
      payload = e.parameter;
    }
    
    var action = payload.action;
    
    // READS
    if (action === 'getBooks') return getSheetData(ss, 'books');
    if (action === 'getGuides') return getSheetData(ss, 'study_guides');
    if (action === 'getVotes') return getSheetData(ss, 'voting_options');
    if (action === 'getGenreVotes') return getSheetData(ss, 'genre_votes');
    if (action === 'getAdmins') return getAdmins(ss);
    if (action === 'getUserHistory') return getUserHistory(ss, payload.email);
    
    // WRITES
    if (action === 'saveBook') return appendToSheet(ss, 'books', payload.row);
    if (action === 'saveGuide') return appendToSheet(ss, 'study_guides', payload.row);
    if (action === 'saveVote') return appendToSheet(ss, 'voting_options', payload.row);
    if (action === 'vote') return incrementVote(ss, 'voting_options', payload.id);
    if (action === 'deleteBook') return deleteRow(ss, 'books', payload.id);
    if (action === 'deleteGuide') return deleteRow(ss, 'study_guides', payload.id);
    if (action === 'clearVotes') return clearAllExceptHeader(ss, 'voting_options');
    if (action === 'voteGenre') return voteGenre(ss, payload.name, payload.email);
    if (action === 'resetGenreVotes') return resetGenreVotes(ss);
    if (action === 'saveProfile') return saveProfile(ss, payload.row);
    
    return createJsonResponse({ status: "error", message: "Invalid Action: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  // Redirect POST to doGet to simplify CORS handling
  return doGet(e);
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]); 
  
  var headers = data.shift();
  var result = data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return createJsonResponse(result);
}

function getAdmins(ss) {
  var sheet = ss.getSheetByName('users');
  if (!sheet) return createJsonResponse([]);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  var adminCol = headers.indexOf('is_admin');
  
  var admins = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][adminCol] === true || data[i][adminCol] === 'TRUE') {
      admins.push({ email: data[i][emailCol] });
    }
  }
  return createJsonResponse(admins);
}

function getUserHistory(ss, email) {
  var sheet = ss.getSheetByName('user_genre_history');
  if (!sheet) return createJsonResponse([]);
  var data = sheet.getDataRange().getValues();
  var history = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == email) history.push(data[i][1]);
  }
  return createJsonResponse(history);
}

function appendToSheet(ss, sheetName, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = headers.map(function(h) { 
    if (h === 'id') return Utilities.getUuid();
    if (h === 'created_at' || h === 'uploaded_at' || h === 'last_active' || h === 'voted_at') return new Date();
    return rowData[h] !== undefined ? rowData[h] : ""; 
  });
  sheet.appendRow(newRow);
  return createJsonResponse({ status: "success" });
}

function saveProfile(ss, rowData) {
  var sheet = ss.getSheetByName('users');
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet 'users' not found" });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  var nameCol = headers.indexOf('name');
  var activeCol = headers.indexOf('last_active');

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] == rowData.email) {
      if (nameCol !== -1) sheet.getRange(i + 1, nameCol + 1).setValue(rowData.name);
      if (activeCol !== -1) sheet.getRange(i + 1, activeCol + 1).setValue(new Date());
      return createJsonResponse({ status: "success" });
    }
  }
  // Not found, append with default is_admin = FALSE
  var newRow = headers.map(function(h) {
    if (h === 'email') return rowData.email;
    if (h === 'name') return rowData.name;
    if (h === 'is_admin') return false;
    if (h === 'last_active') return new Date();
    return "";
  });
  sheet.appendRow(newRow);
  return createJsonResponse({ status: "success" });
}

function incrementVote(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ status: "error", message: "Sheet not found: " + sheetName });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var voteColIndex = headers.indexOf('votes');
  if (voteColIndex === -1) return createJsonResponse({ status: "error", message: "Votes column not found" });

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var currentVotes = parseInt(data[i][voteColIndex]) || 0;
      sheet.getRange(i + 1, voteColIndex + 1).setValue(currentVotes + 1);
      return createJsonResponse({ status: "success" });
    }
  }
  return createJsonResponse({ status: "error", message: "ID not found" });
}

function voteGenre(ss, genreName, email) {
  // 1. Update tally
  var sheet = ss.getSheetByName('genre_votes');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] == genreName) {
        sheet.getRange(i + 1, 3).setValue((parseInt(data[i][2]) || 0) + 1);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([genreName, genreName, 1]);
  }
  
  // 2. Record history
  if (email) {
    var historySheet = ss.getSheetByName('user_genre_history');
    if (historySheet) historySheet.appendRow([email, genreName, new Date()]);
  }
  
  return createJsonResponse({ status: "success" });
}

function resetGenreVotes(ss) {
  var sheet = ss.getSheetByName('genre_votes');
  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      for (var i = 2; i <= lastRow; i++) sheet.getRange(i, 3).setValue(0);
    }
  }
  var historySheet = ss.getSheetByName('user_genre_history');
  if (historySheet && historySheet.getLastRow() > 1) {
    historySheet.deleteRows(2, historySheet.getLastRow() - 1);
  }
  return createJsonResponse({ status: "success" });
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
