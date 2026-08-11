/**
 * script.js - ระบบการทำงานฟอร์มลงทะเบียนนักศึกษา ป.โท นิติศาสตร์ (กฎหมายมหาชน) ม.รามคำแหง รุ่น 35
 * เชื่อมต่อฐานข้อมูลที่อยู่ประเทศไทยครบทั้ง 77 จังหวัด (thailand-address-data.js)
 */

// URL สำหรับ Google Apps Script Web App (แก้ไขหลังจาก Deploy Apps Script)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8bxH4MgN8gKdHhrhw-oHBRMsIbHogLJPwoEEZTK8et1_yqQFEFvk-PvWjsK34eyUyQw/exec";
const GOOGLE_SHEETS_ENABLED = true;
const SHOW_DIRECTORY_TAB = true; // แสดงหน้าทำเนียบรุ่น

let photoBase64 = "";
let studentDatabase = [];
let currentRenderedList = [];

const THAI_ADMIN_KEY_FIXES = {
  "กรุงเทพ���หานคร": "กรุงเทพมหานคร",
  "กรุ���เทพมหานคร": "กรุงเทพมหานคร",
  "นครศรีธรรม���าช": "นครศรีธรรมราช",
  "นค��ราชสีมา": "นครราชสีมา",
  "ปัตตาน��": "ปัตตานี",
  "พิจิต��": "พิจิตร",
  "เพชร���ุรี": "เพชรบุรี",
  "แพร���": "แพร่",
  "ระ��อง": "ระยอง",
  "สมุท���ปราการ": "สมุทรปราการ",
  "สม��ทรสงคราม": "สมุทรสงคราม",
  "สุราษฎร์ธา���ี": "สุราษฎร์ธานี",
  "เ���ียงใหม่": "เชียงใหม่",
  "���าก": "อุบลราชธานี",
  "ถนนนครไชย��รี": "ถนนนครไชยศรี",
  "หนอ���ปรือ": "หนองปรือ",
  "เมืองกำ���พงเพชร": "เมืองกำแพงเพชร",
  "หนองสองห���อง": "หนองสองห้อง",
  "เมือง���ครปฐม": "เมืองนครปฐม",
  "เมื��งนาท": "เมืองนาท",
  "ประโคน��ัย": "ประโคนชัย",
  "ค่ายบางร��จัน": "ค่ายบางระจัน",
  "ฝายหล��ง": "ฝายหลวง",
  "ตะเคี��นปม": "ตะเคียนปม",
  "ขุ��หาญ": "ขุขันธ์",
  "ด��นมดแดง": "ดอนมดแดง",
  "���อนขวาง": "ดอนขวาง"
};

function normalizeThaiAdminKey(key) {
  return THAI_ADMIN_KEY_FIXES[key] || key;
}

function normalizeThaiAdminData(sourceData) {
  if (!sourceData || typeof sourceData !== "object") {
    return {};
  }

  const normalized = {};

  Object.entries(sourceData).forEach(([province, districts]) => {
    const cleanProvince = normalizeThaiAdminKey(province);

    if (!normalized[cleanProvince]) {
      normalized[cleanProvince] = {};
    }

    Object.entries(districts || {}).forEach(([district, subdistricts]) => {
      const cleanDistrict = normalizeThaiAdminKey(district);

      if (!normalized[cleanProvince][cleanDistrict]) {
        normalized[cleanProvince][cleanDistrict] = {};
      }

      Object.entries(subdistricts || {}).forEach(([subdistrict, zipcode]) => {
        const cleanSubdistrict = normalizeThaiAdminKey(subdistrict);
        normalized[cleanProvince][cleanDistrict][cleanSubdistrict] = zipcode;
      });
    });
  });

  return normalized;
}

const NORMALIZED_THAI_ADMIN_DATA = normalizeThaiAdminData(typeof THAI_ADMIN_DATA !== 'undefined' ? THAI_ADMIN_DATA : null);

function populateSelectOptions(select, options, placeholder) {
  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function setPhotoPreviewState(base64) {
  const previewImg = document.getElementById("photo-img-preview");
  const placeholder = document.getElementById("photo-placeholder");
  const removeBtn = document.getElementById("btn-remove-photo");

  if (!previewImg || !placeholder || !removeBtn) {
    return;
  }

  if (base64) {
    previewImg.src = base64;
    previewImg.style.display = "block";
    placeholder.style.display = "none";
    removeBtn.style.display = "inline-block";
  } else {
    previewImg.src = "";
    previewImg.style.display = "none";
    placeholder.style.display = "flex";
    removeBtn.style.display = "none";
  }
}

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
  initProvinceDropdown();
  loadLocalDatabase();
  restoreDraft();
  setupDragAndDrop();
  renderDirectory();
  loadDirectoryFromSheet();
});

// 1. สลับหน้าแท็บ (Form <-> Directory)
function switchTab(tabName) {
  const formTab = document.getElementById("tab-form");
  const dirTab = document.getElementById("tab-directory");
  const formView = document.getElementById("view-form");
  const dirView = document.getElementById("view-directory");

  if (!SHOW_DIRECTORY_TAB) {
    tabName = "form";
  }

  if (tabName === "form") {
    formTab.classList.add("active");
    dirTab.classList.remove("active");
    formView.style.display = "block";
    dirView.style.display = "none";
  } else {
    dirTab.classList.add("active");
    formTab.classList.remove("active");
    dirView.style.display = "block";
    formView.style.display = "none";
    renderDirectory();
  }
}

// 2. เริ่มต้น Dropdown จังหวัด (โหลดทั้ง 77 จังหวัดจาก THAI_ADMIN_DATA)
function initProvinceDropdown() {
  const provSelect = document.getElementById("addr-province");
  const provinces = Object.keys(NORMALIZED_THAI_ADMIN_DATA || {}).sort((a, b) => a.localeCompare(b, 'th'));

  populateSelectOptions(provSelect, provinces, "-- เลือกจังหวัด --");
}

// 3. เมื่อเปลี่ยนจังหวัด -> กรองอำเภอ/เขตที่มีจริงในจังหวัดนั้น
function onProvinceChange(provinceVal) {
  const distSelect = document.getElementById("addr-district");
  const subdistSelect = document.getElementById("addr-subdistrict");
  const zipInput = document.getElementById("addr-zipcode");

  populateSelectOptions(distSelect, [], "-- เลือกอำเภอ/เขต --");
  populateSelectOptions(subdistSelect, [], "-- เลือกตำบล/แขวง --");
  subdistSelect.disabled = true;
  zipInput.value = "";

  if (!provinceVal) {
    distSelect.disabled = true;
    updateFullAddressSummary();
    return;
  }

  distSelect.disabled = false;

  if (NORMALIZED_THAI_ADMIN_DATA[provinceVal]) {
    const districts = Object.keys(NORMALIZED_THAI_ADMIN_DATA[provinceVal]).sort((a, b) => a.localeCompare(b, 'th'));
    populateSelectOptions(distSelect, districts, "-- เลือกอำเภอ/เขต --");
  } else {
    const defaultDists = ["เมือง" + provinceVal, "อำเภอเมือง", "อื่นๆ"];
    populateSelectOptions(distSelect, defaultDists, "-- เลือกอำเภอ/เขต --");
  }

  updateFullAddressSummary();
  saveDraft();
}

// 4. เมื่อเปลี่ยนอำเภอ -> กรองตำบล/แขวงในอำเอนั้น
function onDistrictChange(districtVal) {
  const provVal = document.getElementById("addr-province").value;
  const subdistSelect = document.getElementById("addr-subdistrict");
  const zipInput = document.getElementById("addr-zipcode");

  populateSelectOptions(subdistSelect, [], "-- เลือกตำบล/แขวง --");
  zipInput.value = "";

  if (!districtVal) {
    subdistSelect.disabled = true;
    updateFullAddressSummary();
    return;
  }

  subdistSelect.disabled = false;

  if (NORMALIZED_THAI_ADMIN_DATA[provVal] && NORMALIZED_THAI_ADMIN_DATA[provVal][districtVal]) {
    const subdistMap = NORMALIZED_THAI_ADMIN_DATA[provVal][districtVal];
    const subdistricts = Object.keys(subdistMap).sort((a, b) => a.localeCompare(b, 'th'));
    populateSelectOptions(subdistSelect, subdistricts, "-- เลือกตำบล/แขวง --");
  } else {
    const defaultSubdists = ["ในเมือง", "ตำบลเมือง", "อื่นๆ"];
    populateSelectOptions(subdistSelect, defaultSubdists, "-- เลือกตำบล/แขวง --");
  }

  updateFullAddressSummary();
  saveDraft();
}

// 5. เมื่อเปลี่ยนตำบล -> เติมรหัสไปรษณีย์ให้อัตโนมัติ
function onSubdistrictChange(subdistrictVal) {
  const provVal = document.getElementById("addr-province").value;
  const distVal = document.getElementById("addr-district").value;
  const zipInput = document.getElementById("addr-zipcode");

  if (NORMALIZED_THAI_ADMIN_DATA[provVal] && NORMALIZED_THAI_ADMIN_DATA[provVal][distVal] && NORMALIZED_THAI_ADMIN_DATA[provVal][distVal][subdistrictVal]) {
    zipInput.value = NORMALIZED_THAI_ADMIN_DATA[provVal][distVal][subdistrictVal];
  }

  updateFullAddressSummary();
  saveDraft();
}

// 6. เมื่อค้นหาด้วยรหัสไปรษณีย์ 5 หลัก -> เลือก จังหวัด-อำเภอ-ตำบล ให้อัตโนมัติ
function onZipcodeSearch(zipVal) {
  const cleanZip = zipVal.trim();
  if (cleanZip.length === 5 && typeof THAI_ADMIN_DATA !== 'undefined') {
    for (let p in THAI_ADMIN_DATA) {
      for (let d in THAI_ADMIN_DATA[p]) {
        for (let s in THAI_ADMIN_DATA[p][d]) {
          if (THAI_ADMIN_DATA[p][d][s] === cleanZip) {
            document.getElementById("addr-province").value = p;
            onProvinceChange(p);
            document.getElementById("addr-district").value = d;
            onDistrictChange(d);
            document.getElementById("addr-subdistrict").value = s;
            updateFullAddressSummary();
            return;
          }
        }
      }
    }
  }
  updateFullAddressSummary();
}

// 7. สรุปที่อยู่อัตโนมัติในช่อง address
function updateFullAddressSummary() {
  const detail = document.getElementById("addr-detail").value.trim();
  const subdist = document.getElementById("addr-subdistrict").value;
  const dist = document.getElementById("addr-district").value;
  const prov = document.getElementById("addr-province").value;
  const zip = document.getElementById("addr-zipcode").value.trim();

  let addressParts = [];
  if (detail) addressParts.push(detail);

  if (prov === "กรุงเทพมหานคร") {
    if (subdist) addressParts.push("แขวง" + subdist);
    if (dist) addressParts.push("เขต" + dist);
    if (prov) addressParts.push(prov);
  } else {
    if (subdist) addressParts.push("ต." + subdist);
    if (dist) addressParts.push("อ." + dist);
    if (prov) addressParts.push("จ." + prov);
  }
  if (zip) addressParts.push(zip);

  document.getElementById("address").value = addressParts.join(" ");
  saveDraft();
}

// 8. จัดการคำนำหน้าชื่อ (กรณีเลือก "อื่นๆ")
function toggleCustomPrefix(val) {
  const customGroup = document.getElementById("custom-prefix-group");
  const customInput = document.getElementById("custom-prefix");
  if (val === "อื่นๆ") {
    customGroup.style.display = "flex";
    customInput.required = true;
  } else {
    customGroup.style.display = "none";
    customInput.required = false;
    customInput.value = "";
  }
  saveDraft();
}

// 9. จัดการ Radio Selection สำหรับเพศ
function updateRadioStyle() {
  const radios = document.querySelectorAll('input[name="gender"]');
  radios.forEach((radio) => {
    const parentLabel = radio.closest(".radio-card");
    if (radio.checked) {
      parentLabel.classList.add("selected");
    } else {
      parentLabel.classList.remove("selected");
    }
  });
  saveDraft();
}

// 10. ระบบ Drag & Drop และเลือกรูปภาพ
function setupDragAndDrop() {
  const dropZone = document.getElementById("drop-zone");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add("dragover"), false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove("dragover"), false);
  });

  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processPhotoFile(files[0]);
    }
  });
}

function handlePhotoSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processPhotoFile(files[0]);
  }
}

function processPhotoFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("กรุณาเลือกไฟล์ภาพถ่าย (JPG, PNG, WEBP) เท่านั้น", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("ขนาดไฟล์เกิน 5MB กรุณาเลือกรูปภาพที่มีขนาดเล็กกว่านี้", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      photoBase64 = canvas.toDataURL("image/jpeg", 0.85);
      setPhotoPreviewState(photoBase64);

      showToast("อัปโหลดรูปถ่ายเรียบร้อยแล้ว", "success");
      saveDraft();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  photoBase64 = "";
  document.getElementById("photo-input").value = "";
  setPhotoPreviewState("");
  saveDraft();
}

// 11. บันทึกและดึงข้อมูลร่าง (Draft Auto-Save)
function saveDraft() {
  const formData = getFormDataObject();
  localStorage.setItem("ram35_form_draft", JSON.stringify(formData));
}

function restoreDraft() {
  const draftStr = localStorage.getItem("ram35_form_draft");
  if (!draftStr) return;

  try {
    const draft = JSON.parse(draftStr);
    if (draft.prefix) {
      document.getElementById("prefix").value = draft.prefix;
      toggleCustomPrefix(draft.prefix);
    }
    if (draft.customPrefix) document.getElementById("custom-prefix").value = draft.customPrefix;
    if (draft.fullname) document.getElementById("fullname").value = draft.fullname;
    if (draft.nickname) document.getElementById("nickname").value = draft.nickname;
    if (draft.gender) {
      const rad = document.querySelector(`input[name="gender"][value="${draft.gender}"]`);
      if (rad) {
        rad.checked = true;
        updateRadioStyle();
      }
    }
    if (draft.age) document.getElementById("age").value = draft.age;
    if (draft.phone) document.getElementById("phone").value = draft.phone;
    if (draft.lineId) document.getElementById("lineId").value = draft.lineId;
    if (draft.email) document.getElementById("email").value = draft.email;
    if (draft.education) document.getElementById("education").value = draft.education;
    if (draft.position) document.getElementById("position").value = draft.position;
    if (draft.workplace) document.getElementById("workplace").value = draft.workplace;

    if (draft.addrProvince) {
      document.getElementById("addr-province").value = draft.addrProvince;
      onProvinceChange(draft.addrProvince);
    }
    if (draft.addrDistrict) {
      document.getElementById("addr-district").value = draft.addrDistrict;
      onDistrictChange(draft.addrDistrict);
    }
    if (draft.addrSubdistrict) {
      document.getElementById("addr-subdistrict").value = draft.addrSubdistrict;
    }
    if (draft.addrZipcode) document.getElementById("addr-zipcode").value = draft.addrZipcode;
    if (draft.addrDetail) document.getElementById("addr-detail").value = draft.addrDetail;
    if (draft.address) document.getElementById("address").value = draft.address;

    if (draft.photoBase64) {
      photoBase64 = draft.photoBase64;
      setPhotoPreviewState(photoBase64);
    }
  } catch (err) {
    console.error("Failed to restore draft:", err);
  }
}

// 12. อ่านค่าจากฟอร์มส่งออกเป็น Object
function getFormDataObject() {
  const prefixVal = document.getElementById("prefix").value;
  const customPrefixVal = document.getElementById("custom-prefix").value;
  const finalPrefix = prefixVal === "อื่นๆ" ? customPrefixVal : prefixVal;

  const genderRad = document.querySelector('input[name="gender"]:checked');

  return {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString("th-TH"),
    prefix: prefixVal,
    customPrefix: customPrefixVal,
    finalPrefix: finalPrefix,
    fullname: document.getElementById("fullname").value.trim(),
    nickname: document.getElementById("nickname").value.trim(),
    gender: genderRad ? genderRad.value : "",
    age: document.getElementById("age").value,
    addrProvince: document.getElementById("addr-province").value,
    addrDistrict: document.getElementById("addr-district").value,
    addrSubdistrict: document.getElementById("addr-subdistrict").value,
    addrZipcode: document.getElementById("addr-zipcode").value.trim(),
    addrDetail: document.getElementById("addr-detail").value.trim(),
    address: document.getElementById("address").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    lineId: document.getElementById("lineId").value.trim(),
    email: document.getElementById("email").value.trim(),
    education: document.getElementById("education").value.trim(),
    position: document.getElementById("position").value.trim(),
    workplace: document.getElementById("workplace").value.trim(),
    photoBase64: photoBase64,
  };
}

// 12b. ส่งข้อมูลฟอร์มขึ้น Google Sheet (ใช้ google.script.run เป็นหลัก เพราะเชื่อถือได้และอ่านผลลัพธ์ได้จริง)
async function submitToSheet(data) {
  if (typeof google !== "undefined" && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result) => resolve(result))
        .withFailureHandler((error) => reject(error))
        .submitStudentForm(data);
    });
  }

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
    throw new Error("ไม่ได้ตั้งค่า APPS_SCRIPT_URL");
  }

  // Fallback: ใช้กรณีเปิดหน้านี้นอกระบบ Apps Script (เช่นทดสอบบนเว็บโฮสต์อื่น)
  // ใช้ Content-Type: text/plain เพื่อเลี่ยง CORS preflight ที่ Apps Script Web App ไม่รองรับ
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// 13. จัดการส่งข้อมูลฟอร์ม (Form Submission)
async function handleFormSubmit(e) {
  e.preventDefault();

  const data = getFormDataObject();

  // Validate
  if (!data.photoBase64) {
    showToast("กรุณาอัปโหลดภาพถ่ายส่วนตัวก่อนส่งข้อมูล", "error");
    return;
  }
  if (!data.finalPrefix || !data.fullname || !data.nickname || !data.gender || !data.age) {
    showToast("กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน", "error");
    return;
  }
  if (!data.phone || !data.lineId || !data.email || !data.address) {
    showToast("กรุณากรอกข้อมูลการติดต่อและเลือกที่อยู่ให้ครบถ้วน", "error");
    return;
  }
  if (!data.education || !data.position || !data.workplace) {
    showToast("กรุณากรอกประวัติการศึกษาและการทำงานให้ครบถ้วน", "error");
    return;
  }

  const submitBtn = document.getElementById("btn-submit");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<div class="spinner"></div> กำลังบันทึกข้อมูล...`;

  try {
    saveToLocalDatabase(data);

    const shouldSendToGoogleSheets = typeof GOOGLE_SHEETS_ENABLED === "boolean"
      ? GOOGLE_SHEETS_ENABLED
      : true;

    if (shouldSendToGoogleSheets) {
      try {
        const sheetResult = await submitToSheet(data);
        if (!sheetResult || sheetResult.result !== "success") {
          throw new Error((sheetResult && sheetResult.error) || "ไม่ทราบสาเหตุ");
        }
      } catch (sheetError) {
        console.warn("Google Sheets submit warning:", sheetError);
        showToast("บันทึกในเครื่องแล้ว แต่ส่งขึ้น Google Sheet ไม่สำเร็จ: " + sheetError.message, "error");
      }
    }

    await loadDirectoryFromSheet();

    showToast("บันทึกข้อมูลเรียบร้อยแล้ว!", "success");
    localStorage.removeItem("ram35_form_draft");
    resetFormFields();

    setTimeout(() => {
      switchTab("directory");
    }, 1200);

  } catch (error) {
    console.error("Submission Error:", error);
    showToast("เกิดข้อผิดพลาดในการส่งข้อมูล: " + error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      บันทึกข้อมูลลงทะเบียน
    `;
  }
}

// 14. การจัดการกับ Local Storage Database
function loadLocalDatabase() {
  const dbStr = localStorage.getItem("ram35_student_db");
  if (dbStr) {
    try {
      studentDatabase = JSON.parse(dbStr);
    } catch (e) {
      studentDatabase = [];
    }
  } else {
    studentDatabase = [];
  }
}

function saveToLocalDatabase(newRecord) {
  const existingIdx = studentDatabase.findIndex(
    (item) => item.fullname.toLowerCase() === newRecord.fullname.toLowerCase()
  );

  if (existingIdx >= 0) {
    studentDatabase[existingIdx] = newRecord;
  } else {
    studentDatabase.unshift(newRecord);
  }

  localStorage.setItem("ram35_student_db", JSON.stringify(studentDatabase));
}

function updateDirectoryStatus(message, state = "loading") {
  const statusEl = document.getElementById("directory-status");
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  statusEl.className = `directory-status ${state}`;
}

function toggleDirectoryVisibility(hasData) {
  const tab = document.getElementById("tab-directory");
  const grid = document.getElementById("directory-grid");
  const placeholder = document.getElementById("directory-placeholder");

  if (!tab || !grid || !placeholder) {
    return;
  }

  if (!SHOW_DIRECTORY_TAB) {
    tab.style.display = "none";
    grid.style.display = "none";
    placeholder.style.display = "none";
    return;
  }

  if (hasData) {
    tab.style.display = "flex";
    grid.style.display = "grid";
    placeholder.style.display = "none";
  } else {
    tab.style.display = "none";
    grid.style.display = "none";
    placeholder.style.display = "block";
  }
}

async function loadDirectoryFromSheet() {
  updateDirectoryStatus("กำลังโหลดข้อมูลจากระบบ...", "loading");

  const readLocalFallback = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("ram35_student_db") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        studentDatabase = saved;
        renderDirectory();
        updateDirectoryStatus("ใช้ข้อมูลที่บันทึกไว้ในเครื่อง", "ready");
      } else {
        updateDirectoryStatus("ยังไม่มีข้อมูลในระบบ", "ready");
      }
    } catch (error) {
      updateDirectoryStatus("ไม่สามารถโหลดข้อมูลจากระบบได้", "error");
    }
  };

  try {
    if (typeof google !== "undefined" && google.script && google.script.run) {
      const payload = await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((result) => resolve(result))
          .withFailureHandler((error) => reject(error))
          .getStudentsDataForClient();
      });

      const sheetStudents = Array.isArray(payload && payload.students) ? payload.students : [];
      if (sheetStudents.length > 0) {
        studentDatabase = sheetStudents;
        localStorage.setItem("ram35_student_db", JSON.stringify(studentDatabase));
        renderDirectory();
        updateDirectoryStatus(`โหลดข้อมูลจากระบบแล้ว (${sheetStudents.length} คน)`, "ready");
        return;
      }

      readLocalFallback();
      return;
    }

    if (APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL")) {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=students`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const sheetStudents = Array.isArray(payload.students) ? payload.students : [];

      if (sheetStudents.length > 0) {
        studentDatabase = sheetStudents;
        localStorage.setItem("ram35_student_db", JSON.stringify(studentDatabase));
        renderDirectory();
        toggleDirectoryVisibility(true);
        updateDirectoryStatus(`โหลดข้อมูลจากระบบแล้ว (${sheetStudents.length} คน)`, "ready");
        return;
      }
    }

    toggleDirectoryVisibility(false);
    readLocalFallback();
  } catch (error) {
    console.warn("Unable to load registered students from Google Sheets:", error);
    toggleDirectoryVisibility(false);
    readLocalFallback();
  }
}

// 14b. แปลงลิงก์รูป Google Drive รูปแบบเก่า (uc?export=view) ที่ Google บล็อกการฝังรูปแล้ว
// ให้เป็นลิงก์ thumbnail ที่ใช้กับ <img src> ได้จริง
function normalizeDriveImageUrl(url) {
  if (!url || url.indexOf("drive.google.com") === -1) {
    return url;
  }

  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  if (!match) {
    return url;
  }

  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
}

// 14c. แก้เบอร์โทรศัพท์ที่ Google Sheet ตัดเลข 0 หน้าออก (เพราะแปลงเป็นตัวเลข) ให้กลับมาขึ้นต้นด้วย 0
function normalizePhoneDigits(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 9 && !digits.startsWith("0")) {
    digits = "0" + digits;
  }
  return digits;
}

function formatPhoneDisplay(raw) {
  const digits = normalizePhoneDigits(raw);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits || (raw || "-");
}

// 14d. สร้าง HTML ส่วนข้อมูล (ชื่อ + รายละเอียด) ใช้ร่วมกันทั้งการ์ดย่อและหน้าต่างขยาย
function buildStudentBodyHtml(st) {
  const phoneDigits = normalizePhoneDigits(st.phone);
  const callBtn = phoneDigits
    ? `<a class="btn-call" href="tel:${phoneDigits}" onclick="event.stopPropagation()">📞 โทร</a>`
    : "";

  return `
    <h4 class="student-card-name">${st.finalPrefix}${st.fullname}</h4>
    <span class="student-card-nickname">ชื่อเล่น: ${st.nickname || '-'}</span>
    <div class="student-card-info">
      <p><strong>อายุ:</strong> ${st.age} ปี (${st.gender})</p>
      <p><strong>ตำแหน่ง:</strong> ${st.position}</p>
      <p><strong>หน่วยงาน:</strong> ${st.workplace}</p>
      <p><strong>โทรศัพท์:</strong> ${formatPhoneDisplay(st.phone)} ${callBtn}</p>
      <p><strong>Line ID:</strong> ${st.lineId}</p>
      <p><strong>E-Mail:</strong> ${st.email}</p>
      <p style="margin-top: 4px;"><strong>ที่อยู่:</strong> ${st.address}</p>
      <p style="margin-top: 4px; font-size: 0.8rem; color: var(--text-muted);"><strong>การศึกษา:</strong> ${st.education}</p>
    </div>
  `;
}

// 15. แสดงผลรายชื่อทำเนียบนิสิต (Directory Renderer)
function renderDirectory(filteredList = null) {
  const grid = document.getElementById("directory-grid");
  const countSpan = document.getElementById("directory-count");
  const list = filteredList !== null ? filteredList : studentDatabase;
  currentRenderedList = list;

  if (!grid) {
    return;
  }

  toggleDirectoryVisibility(list.length > 0);

  if (countSpan) {
    countSpan.textContent = studentDatabase.length;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-directory">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>ยังไม่มีข้อมูลนักศึกษาในระบบ หรือไม่พบข้อมูลตามคำค้นหา</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map((st, idx) => {
    const avatar = normalizeDriveImageUrl(st.photoBase64) || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.fullname)}&background=1e3a8a&color=ffffff&size=128`;
    return `
      <div class="student-card" onclick="openStudentDetail(${idx})">
        <img src="${avatar}" alt="${st.fullname}" class="student-card-img">
        <div class="student-card-body">
          ${buildStudentBodyHtml(st)}
        </div>
      </div>
    `;
  }).join('');
}

// 15b. คลิ๊กที่ภาพเพื่อขยายดูข้อมูลทั้งหมดของแต่ละคน
function openStudentDetail(idx) {
  const st = currentRenderedList[idx];
  const modal = document.getElementById("student-detail-modal");
  if (!st || !modal) {
    return;
  }

  const avatar = normalizeDriveImageUrl(st.photoBase64) || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.fullname)}&background=1e3a8a&color=ffffff&size=256`;
  document.getElementById("modal-student-img").src = avatar;
  document.getElementById("modal-student-img").alt = st.fullname;
  document.getElementById("modal-student-body").innerHTML = buildStudentBodyHtml(st);

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeStudentDetail() {
  const modal = document.getElementById("student-detail-modal");
  if (!modal) {
    return;
  }
  modal.style.display = "none";
  document.body.style.overflow = "";
}

// 16. ค้นหาใน ทำเนียบ Directory
function filterDirectory(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderDirectory();
    return;
  }

  const filtered = studentDatabase.filter((st) => {
    return (
      st.fullname.toLowerCase().includes(q) ||
      st.nickname.toLowerCase().includes(q) ||
      st.position.toLowerCase().includes(q) ||
      st.workplace.toLowerCase().includes(q) ||
      st.phone.includes(q) ||
      st.address.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q)
    );
  });

  renderDirectory(filtered);
}

// 17. ล้างฟอร์ม
function resetFormFields() {
  document.getElementById("student-form").reset();
  removePhoto();
  toggleCustomPrefix("");
  updateRadioStyle();
  initProvinceDropdown();
  document.getElementById("addr-district").disabled = true;
  document.getElementById("addr-subdistrict").disabled = true;
}

function resetForm() {
  if (confirm("คุณต้องการล้างข้อมูลในฟอร์มทั้งหมดใช่หรือไม่?")) {
    resetFormFields();
    localStorage.removeItem("ram35_form_draft");
    showToast("ล้างข้อมูลเรียบร้อยแล้ว", "success");
  }
}

// 18. ดาวน์โหลด PDF
function exportPDF() {
  if (studentDatabase.length === 0) {
    showToast("ยังไม่มีข้อมูลสำหรับดาวน์โหลดเป็น PDF", "error");
    return;
  }

  document.getElementById("print-date").textContent = new Date().toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  window.print();
}

// 19. ดาวน์โหลด Excel / CSV (พร้อม UTF-8 BOM)
function exportExcel() {
  if (studentDatabase.length === 0) {
    showToast("ยังไม่มีข้อมูลสำหรับดาวน์โหลดเป็น Excel", "error");
    return;
  }

  const headers = [
    "ลำดับ", "วันเวลาที่ลงทะเบียน", "คำนำหน้าชื่อ", "ชื่อ-นามสกุล", "ชื่อเล่น",
    "เพศ", "อายุ (ปี)", "เบอร์โทรศัพท์", "Line ID", "E-Mail",
    "ที่อยู่ปัจจุบัน", "ประวัติการศึกษา", "ตำแหน่งงานปัจจุบัน", "สถานที่ทำงาน"
  ];

  const rows = studentDatabase.map((st, idx) => [
    idx + 1,
    `"${st.timestamp || ''}"`,
    `"${st.finalPrefix || ''}"`,
    `"${st.fullname || ''}"`,
    `"${st.nickname || ''}"`,
    `"${st.gender || ''}"`,
    `"${st.age || ''}"`,
    `"${st.phone || ''}"`,
    `"${st.lineId || ''}"`,
    `"${st.email || ''}"`,
    `"${(st.address || '').replace(/"/g, '""')}"`,
    `"${(st.education || '').replace(/"/g, '""')}"`,
    `"${(st.position || '').replace(/"/g, '""')}"`,
    `"${(st.workplace || '').replace(/"/g, '""')}"`
  ]);

  let csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
  
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `RAM35_PublicLaw_Students_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("ดาวน์โหลดไฟล์ Excel (.csv) เรียบร้อยแล้ว", "success");
}

// 21. ระบบการแจ้งเตือน Toast Alert
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast-alert ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
