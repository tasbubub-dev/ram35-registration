/**
 * Google Apps Script Backend Server for RAM35 LL.M. Public Law Form
 * มหาวิทยาลัยรามคำแหง รุ่น 35
 */

// 1. ให้บริการหน้า Web App เมื่อเปิดผ่าน Google Apps Script URL
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'students') {
    return getStudentsJson();
  }

  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('ลงทะเบียน ป.โท นิติศาสตร์ (กฎหมายมหาชน) ม.รามคำแหง รุ่น 35')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getOrCreateStudentSheet() {
  var sheetName = "ข้อมูลนักศึกษา ป.โท กฎหมายมหาชน รุ่น 35";
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = null;

  if (spreadsheet) {
    sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.getSheets()[0] || spreadsheet.insertSheet(sheetName);
    }
    return { spreadsheet: spreadsheet, sheet: sheet };
  }

  var files = DriveApp.getFilesByName(sheetName);
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(sheetName);
  }

  sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0] || spreadsheet.insertSheet(sheetName);
  }

  return { spreadsheet: spreadsheet, sheet: sheet };
}

function ensureHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "วัน-เวลาที่ลงทะเบียน",
      "1. คำนำหน้าชื่อ",
      "2. ชื่อ - นามสกุล",
      "3. ชื่อเล่น",
      "4. เพศ",
      "5. อายุ (ปี)",
      "6. ที่อยู่ปัจจุบัน",
      "7. เบอร์โทรศัพท์",
      "8. Line ID",
      "9. E-Mail",
      "10. ประวัติการศึกษา",
      "11. ตำแหน่งงานปัจจุบัน",
      "12. สถานที่ทำงาน",
      "13. ลิงก์รูปถ่ายใน Google Drive",
      "14. ตำแหน่งครอปรูป (คำนวณอัตโนมัติ)"
    ]);

    var headerRange = sheet.getRange(1, 1, 1, 15);
    headerRange.setBackground("#1e3a8a");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
  }
}

function getStudentsJson() {
  try {
    var sheetInfo = getOrCreateStudentSheet();
    var sheet = sheetInfo.sheet;
    var values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ result: 'success', students: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var students = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row || row.every(function (cell) {
        return cell === '' || cell === null || cell === undefined;
      })) {
        continue;
      }

      students.push({
        id: String(row[0] || '') + '-' + i,
        timestamp: row[0] || '',
        finalPrefix: row[1] || '',
        fullname: row[2] || '',
        nickname: row[3] || '',
        gender: row[4] || '',
        age: row[5] || '',
        address: row[6] || '',
        phone: row[7] || '',
        lineId: row[8] || '',
        email: row[9] || '',
        education: row[10] || '',
        position: row[11] || '',
        workplace: row[12] || '',
        photoBase64: row[13] || '',
        photoCropStyle: row[14] || ''
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ result: 'success', students: students }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getStudentsDataForClient() {
  try {
    var sheetInfo = getOrCreateStudentSheet();
    var sheet = sheetInfo.sheet;
    var values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return { result: 'success', students: [] };
    }

    var students = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row || row.every(function (cell) {
        return cell === '' || cell === null || cell === undefined;
      })) {
        continue;
      }

      students.push({
        id: String(row[0] || '') + '-' + i,
        timestamp: row[0] || '',
        finalPrefix: row[1] || '',
        fullname: row[2] || '',
        nickname: row[3] || '',
        gender: row[4] || '',
        age: row[5] || '',
        address: row[6] || '',
        phone: row[7] || '',
        lineId: row[8] || '',
        email: row[9] || '',
        education: row[10] || '',
        position: row[11] || '',
        workplace: row[12] || '',
        photoBase64: row[13] || '',
        photoCropStyle: row[14] || ''
      });
    }

    return { result: 'success', students: students };
  } catch (err) {
    return { result: 'error', error: err.toString() };
  }
}

// ฟังก์ชัน Helper สำหรับ Include ไฟล์ CSS / JS เพิ่มเติมใน Apps Script (ถ้ามี)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 2. บันทึกข้อมูลนักศึกษาลง Sheet (ใช้ร่วมกันทั้ง doPost และ google.script.run)
function saveStudentRecord(data) {
  var sheetInfo = getOrCreateStudentSheet();
  var sheet = sheetInfo.sheet;
  ensureHeaderRow(sheet);

  // บังคับคอลัมน์เบอร์โทรศัพท์ (H) ให้เป็นข้อความล้วน ป้องกัน Sheets ตัดเลข 0 นำหน้าออกเวลาแปลงเป็นตัวเลข
  sheet.getRange("H:H").setNumberFormat("@");

  // จัดการอัปโหลดไฟล์รูปภาพลง Google Drive
  var photoUrl = "ไม่มีรูปภาพ";
  if (data.photoBase64 && data.photoBase64.indexOf("data:image") !== -1) {
    photoUrl = savePhotoToDrive(data.photoBase64, data.finalPrefix + data.fullname);
  }

  // เพิ่มข้อมูลลงใน Sheet
  sheet.appendRow([
    data.timestamp || new Date().toLocaleString("th-TH"),
    data.finalPrefix || "",
    data.fullname || "",
    data.nickname || "",
    data.gender || "",
    data.age || "",
    data.address || "",
    data.phone || "",
    data.lineId || "",
    data.email || "",
    data.education || "",
    data.position || "",
    data.workplace || "",
    photoUrl,
    data.photoCropStyle || ""
  ]);

  return { result: "success", photoUrl: photoUrl };
}

// 2a. รับการ Submit จากฝั่ง client ผ่าน google.script.run (ทางหลัก)
function submitStudentForm(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    return saveStudentRecord(data || {});
  } catch (err) {
    return { result: "error", error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

// 2b. รับข้อมูลเมื่อมีการ Submit ฟอร์มแบบ POST (สำรองไว้กรณีเรียกจากภายนอก)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var result = saveStudentRecord(data);

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 3. ฟังก์ชันสร้าง/ค้นหาโฟลเดอร์ Google Drive และบันทึกไฟล์รูปภาพ
function savePhotoToDrive(base64Data, studentName) {
  try {
    var folderName = "รูปถ่ายนักศึกษา ป.โท กฎหมายมหาชน รุ่น 35";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // แปลง Base64 เป็น Blob
    var splitData = base64Data.split(",");
    var contentType = splitData[0].match(/:(.*?);/)[1];
    var bytes = Utilities.base64Decode(splitData[1]);
    var fileName = "Photo_" + studentName.replace(/\s+/g, "_") + "_" + new Date().getTime() + ".jpg";
    var blob = Utilities.newBlob(bytes, contentType, fileName);

    // บันทึกไฟล์เข้า Drive
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ใช้ลิงก์ thumbnail แสดงรูปภาพโดยตรง (ใช้กับ <img src> ได้ทันที)
    // หมายเหตุ: เดิมใช้ uc?export=view แต่ Google บล็อกการฝังรูปด้วยลิงก์รูปแบบนี้แล้ว
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  } catch (e) {
    Logger.log("Save Photo Error: " + e.toString());
    return "เกิดข้อผิดพลาดในการบันทึกรูปภาพ: " + e.toString();
  }
}
