/**
 * script.js - ระบบการทำงานฟอร์มลงทะเบียนนักศึกษา ป.โท นิติศาสตร์ (กฎหมายมหาชน) ม.รามคำแหง รุ่น 35
 * เชื่อมต่อฐานข้อมูลที่อยู่ประเทศไทยครบทั้ง 77 จังหวัด (thailand-address-data.js)
 */

// URL สำหรับ Google Apps Script Web App (แก้ไขหลังจาก Deploy Apps Script)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8bxH4MgN8gKdHhrhw-oHBRMsIbHogLJPwoEEZTK8et1_yqQFEFvk-PvWjsK34eyUyQw/exec";
const GOOGLE_SHEETS_ENABLED = true;
const SHOW_DIRECTORY_TAB = true; // แสดงหน้าทำเนียบรุ่น

let photoBase64 = "";
let photoCropStyle = "";
let photoCropDetectionPromise = null;
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
  const formView = document.getElementById("view-form");
  const dirView = document.getElementById("view-directory");

  if (!SHOW_DIRECTORY_TAB) {
    tabName = "form";
  }

  if (tabName === "form") {
    formTab.classList.add("active");
    formView.style.display = "block";
    dirView.style.display = "none";
  } else {
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

// 10a. ตรวจจับใบหน้าอัตโนมัติในรูปที่อัปโหลด เพื่อคำนวณตำแหน่ง/ขนาดครอปให้หัว-อกอยู่ในกรอบเหมือนกันทุกคน
// โหลดไลบรารีแบบ lazy (โหลดเฉพาะตอนมีคนเลือกรูปจริง) เพื่อไม่ให้หน้าทำเนียบที่ไม่ได้ใช้ฟอร์มโหลดช้าลง
// ถ้าโหลดไม่สำเร็จหรือหาใบหน้าไม่เจอ จะไม่ครอป (ใช้ค่า default เดิม) ไม่มีผลกับการส่งฟอร์ม
const FACE_API_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const FACE_API_MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
// สัดส่วน (ความสูงใบหน้า/ภาพ) และ (ระยะขอบบนถึงหัวใบหน้า/ภาพ) ของกรอบที่ถือว่า "พอดี" อิงจากรูปต้นแบบที่ครอปสวยอยู่แล้ว
const FACE_CROP_TARGET_RATIO = 0.3197;
const FACE_CROP_TARGET_TOP_RATIO = 0.1760;
const FACE_CROP_MIN_SCORE = 0.6;

let faceApiLibraryPromise = null;
let faceApiModelPromise = null;

function ensureFaceApiLibraryLoaded() {
  if (typeof faceapi !== "undefined") {
    return Promise.resolve();
  }
  if (!faceApiLibraryPromise) {
    faceApiLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = FACE_API_SCRIPT_URL;
      script.onload = resolve;
      script.onerror = () => reject(new Error("โหลดไลบรารีตรวจจับใบหน้าไม่สำเร็จ"));
      document.head.appendChild(script);
    });
  }
  return faceApiLibraryPromise;
}

function ensureFaceApiModelLoaded() {
  if (!faceApiModelPromise) {
    faceApiModelPromise = ensureFaceApiLibraryLoaded().then(() =>
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL)
    );
  }
  return faceApiModelPromise;
}

// คำนวณ CSS style (width/height/left/top เป็น %) จากกรอบใบหน้าที่ตรวจพบ ให้ครอปได้สัดส่วนหัว-อกเหมือนรูปต้นแบบ
// คืนค่าว่างถ้ารูปมีขนาดพอดีอยู่แล้ว (ไม่ต้องครอปเพิ่ม) หรือกรอบครอปที่ต้องการเกินขอบเขตของรูปต้นฉบับ
function computeFaceCropStyle(faceBox, imgW, imgH) {
  const faceCx = faceBox.x + faceBox.width / 2;
  const cropH = faceBox.height / FACE_CROP_TARGET_RATIO;
  const cropW = cropH * 0.75;

  if (cropH >= imgH * 0.97 || cropW >= imgW * 0.97) {
    return "";
  }

  let topPx = faceBox.y - FACE_CROP_TARGET_TOP_RATIO * cropH;
  let leftPx = faceCx - cropW / 2;
  topPx = Math.max(0, Math.min(topPx, imgH - cropH));
  leftPx = Math.max(0, Math.min(leftPx, imgW - cropW));

  const widthPct = (imgW / cropW) * 100;
  const heightPct = (imgH / cropH) * 100;
  const leftPct = -(leftPx / cropW) * 100;
  const topPct = -(topPx / cropH) * 100;

  return `position:absolute; width:${widthPct.toFixed(1)}%; height:${heightPct.toFixed(1)}%; left:${leftPct.toFixed(1)}%; top:${topPct.toFixed(1)}%;`;
}

// ตรวจจับใบหน้าในภาพที่เพิ่งอัปโหลด (canvas ที่ resize แล้ว) แล้วคืนค่า crop style ที่จะบันทึกคู่กับข้อมูลนักศึกษา
async function detectPhotoCropStyle(canvas) {
  try {
    await ensureFaceApiModelLoaded();
    const detections = await faceapi.detectAllFaces(
      canvas,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: FACE_CROP_MIN_SCORE })
    );
    if (!detections || detections.length === 0) {
      return "";
    }
    const best = detections.reduce((a, b) => (b.score > a.score ? b : a));
    if (best.score < FACE_CROP_MIN_SCORE) {
      return "";
    }
    const box = { x: best.box.x, y: best.box.y, width: best.box.width, height: best.box.height };
    return computeFaceCropStyle(box, canvas.width, canvas.height);
  } catch (err) {
    console.warn("ตรวจจับใบหน้าอัตโนมัติไม่สำเร็จ (จะใช้ตำแหน่งครอปปกติแทน):", err);
    return "";
  }
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

      photoCropStyle = "";
      photoCropDetectionPromise = detectPhotoCropStyle(canvas).then((style) => {
        photoCropStyle = style;
        saveDraft();
        return style;
      });
      saveDraft();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  photoBase64 = "";
  photoCropStyle = "";
  photoCropDetectionPromise = null;
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
      photoCropStyle = draft.photoCropStyle || "";
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
    photoCropStyle: photoCropStyle,
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

  if (photoCropDetectionPromise) {
    try {
      await photoCropDetectionPromise;
    } catch (err) {
      // เพิกเฉยได้ ถ้าตรวจจับใบหน้าไม่สำเร็จก็แค่ไม่ครอปพิเศษ ไม่กระทบการส่งฟอร์ม
    }
  }

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
  const grid = document.getElementById("directory-grid");
  const placeholder = document.getElementById("directory-placeholder");

  if (!grid || !placeholder) {
    return;
  }

  if (!SHOW_DIRECTORY_TAB) {
    grid.style.display = "none";
    placeholder.style.display = "none";
    return;
  }

  if (hasData) {
    grid.style.display = "grid";
    placeholder.style.display = "none";
  } else {
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

// ดึง Drive file ID จากลิงก์รูป ใช้เป็นคีย์ระบุรูปแต่ละใบ (กันชื่อซ้ำ เช่นคนชื่อเดียวกันสองคน)
function extractDriveFileId(url) {
  if (!url) {
    return null;
  }
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  return match ? match[1] : null;
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
    ? `<a class="btn-call btn-call-lg" href="tel:${phoneDigits}" onclick="event.stopPropagation()" aria-label="โทรหา ${st.finalPrefix}${st.fullname}">📞</a>`
    : "";

  return `
    <h4 class="student-card-name">${st.finalPrefix}${st.fullname}</h4>
    <span class="student-card-nickname">ชื่อเล่น: ${st.nickname || '-'}</span>
    <div class="student-card-info">
      <p><strong>อายุ:</strong> ${st.age} ปี (${st.gender})</p>
      <p><strong>ตำแหน่ง:</strong> ${st.position}</p>
      <p><strong>หน่วยงาน:</strong> ${st.workplace}</p>
      <p class="student-card-phone"><strong>โทรศัพท์:</strong> ${formatPhoneDisplay(st.phone)} ${callBtn}</p>
      <p><strong>Line ID:</strong> ${st.lineId}</p>
      <p><strong>E-Mail:</strong> ${st.email}</p>
      <p style="margin-top: 4px;"><strong>ที่อยู่:</strong> ${st.address}</p>
      <p style="margin-top: 4px; font-size: 0.8rem; color: var(--text-muted);"><strong>การศึกษา:</strong> ${st.education}</p>
    </div>
  `;
}

// 14e. สร้าง HTML ส่วนข้อมูลย่อสำหรับการ์ดในหน้าทำเนียบ (รายละเอียดเต็มดูได้จากการคลิกเปิด Modal)
function buildStudentCardHtml(st) {
  const phoneDigits = normalizePhoneDigits(st.phone);
  const callBtn = phoneDigits
    ? `<a class="btn-call btn-call-lg" href="tel:${phoneDigits}" onclick="event.stopPropagation()" aria-label="โทรหา ${st.finalPrefix}${st.fullname}">📞</a>`
    : "";

  return `
    <h4 class="student-card-name">${st.finalPrefix}${st.fullname}</h4>
    <span class="student-card-nickname">ชื่อเล่น: ${st.nickname || '-'}</span>
    <div class="student-card-info">
      <p><strong>ตำแหน่ง:</strong> ${st.position}</p>
      <p><strong>หน่วยงาน:</strong> ${st.workplace}</p>
      <p class="student-card-phone"><strong>โทร:</strong> ${formatPhoneDisplay(st.phone)} ${callBtn}</p>
    </div>
    <span class="student-card-hint">คลิกดูรายละเอียด</span>
  `;
}

// 14f. ปรับซูม/ตำแหน่งรูปภาพเฉพาะราย เมื่อรูปต้นฉบับเป็นภาพเต็มตัวหรือคนมีขนาดเล็กมองไม่ชัด
// (การครอปปกติแค่ object-fit/object-position ไม่พอ ต้องซูมเข้าเฉพาะจุดเพื่อให้ได้ขนาดหัว-อกใกล้เคียงคนอื่น)
// คีย์เป็น Drive file ID ของรูป (ไม่ใช้ชื่อ เพราะมีบางคนชื่อซ้ำกัน) คำนวณจากตำแหน่งใบหน้าจริงเทียบกับรูปต้นแบบ
const PHOTO_CROP_OVERRIDES = {
  "1cyB2nSjLTaOPj9o45tacZKcOAnBhCMOi": "position:absolute; width:109.2%; height:103.4%; left:-0.0%; top:-1.7%;", // ธนายุทธ ภูมิงาม
  "13kjcBneHLpjGNLqWLRRBv5vpd0vS6wzp": "position:absolute; width:192.2%; height:256.2%; left:-62.8%; top:-84.1%;", // อชิราวุฒิ หอมละออ
  "1lhx0Av3RE5tYh9vG-FFOi_VgJ6KsJvp4": "position:absolute; width:276.4%; height:276.4%; left:-111.9%; top:-72.1%;", // ตรีทศ แก้วไทรเกิด
  "1FjEOBJSTrl_V_7EQKM4vAsg1ckAksrL-": "position:absolute; width:341.7%; height:256.2%; left:-66.6%; top:-83.1%;", // วสันต์ อุบลสะอาด
  "1l2CR2J38dRgtetrZ3ufaNxaoEAej0GWM": "position:absolute; width:502.1%; height:502.2%; left:-171.3%; top:-194.8%;", // สุนันทา พลรักษา
  "1Q0dZ7oTB-VXZi7og0CEfP9DdNYLDyCuJ": "position:absolute; width:126.8%; height:133.0%; left:-0.0%; top:-16.8%;", // เอกสิทธิ์ จันทราภัย
  "1HGJPDA__oJXKA-Ku4r1IMa2x3hH9LGmy": "position:absolute; width:114.3%; height:116.6%; left:-6.4%; top:-6.0%;", // วรรณสิริ มณีรัตนโชติ
  "1WFBIJAOF9wQdw7cIm29NlfswPjXSAsWL": "position:absolute; width:107.9%; height:115.0%; left:-3.3%; top:-5.8%;", // พัชริยา เอมดิษฐ์
  "1dZvAkbAGwsXTwcZEWbjYC9EAiPpppVC3": "position:absolute; width:353.8%; height:396.8%; left:-115.3%; top:-165.9%;", // กมลทิพย์ พลากร
  "1Py75DDyYN_kmdyx-H2ZLzYnGFqomf1os": "position:absolute; width:175.4%; height:162.9%; left:-47.9%; top:-39.5%;", // ปุญญิศา พรอำนวยทรัพย์
  "1254Y1FPULmzJvSnO9yACItx3JepK-aLI": "position:absolute; width:341.7%; height:341.7%; left:-139.1%; top:-106.0%;", // ตรีทศ แก้วไทรเกิด (คนละรูปกับด้านบน)
  "1QTEG7g_SL-jYkl8dIYUFYsCKFMZhu0gZ": "position:absolute; width:296.4%; height:296.4%; left:-97.9%; top:-143.5%;", // ธันยาภรณ์ สุขศรี
  "14fY1ar91IBxZ-NJdSSp9oM11lCLg4doD": "position:absolute; width:482.3%; height:482.2%; left:-135.3%; top:-182.3%;", // กัญภัคนัฐ สีดาบุญ
  "18ts7rwux9S3dmIfZWlZ6MP6yQ6oTbixD": "position:absolute; width:167.7%; height:223.6%; left:-33.5%; top:-91.5%;", // นทสรวง จันทศรีราช
  "1sPCISEaoHUN-cnLhsH6OpP_jNcH1pEbK": "position:absolute; width:236.5%; height:315.4%; left:-66.2%; top:-166.9%;", // ปัทมา เดชเล
  "1z7EOTXmiotoL2UInzmH4QrhOC_mb9bkD": "position:absolute; width:130.8%; height:117.7%; left:-16.4%; top:-9.6%;", // รุซลัน หัวแหลม
  "1zt80yv_b2pFL-sYHN0oQgdkMc_yntjRI": "position:absolute; width:226.2%; height:127.2%; left:-63.5%; top:-27.2%;", // นภมณฑล สิบหมื่นเปี่ยม
  "1jC20dso-ZPYIaq-bsVVJP2c45uS3xD6a": "position:absolute; width:147.9%; height:148.2%; left:-24.8%; top:-22.3%;", // สุณิสา โตะวี
  "1rxBFB4KRK8XlMcgHvsnQzIGtIqkqghe2": "position:absolute; width:208.9%; height:104.6%; left:-55.4%; top:-4.6%;", // อนุศรา เศรษฐานุสรณ์
  "1lKP1w90g912PK68NakLaXUupkCVq8ZGj": "position:absolute; width:455.6%; height:455.6%; left:-157.3%; top:-190.8%;" // นันทพงษ์ ลือกำลัง
};

// ลำดับความสำคัญ: ค่าที่คำนวณตอนอัปโหลดแล้วบันทึกลง Sheet (st.photoCropStyle) มาก่อน
// ถ้าไม่มี (เช่นข้อมูลเก่าก่อนมีระบบนี้) จึงย้อนไปดูตาราง PHOTO_CROP_OVERRIDES ที่คำนวณไว้ล่วงหน้า
function getPhotoCropStyle(st) {
  if (st && st.photoCropStyle) {
    return st.photoCropStyle;
  }
  const fileId = extractDriveFileId(st && st.photoBase64);
  return (fileId && PHOTO_CROP_OVERRIDES[fileId]) || "";
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
    const cropStyle = getPhotoCropStyle(st);
    return `
      <div class="student-card" onclick="openStudentDetail(${idx})">
        <div class="student-card-img-wrap">
          <img src="${avatar}" alt="${st.fullname}" class="student-card-img"${cropStyle ? ` style="${cropStyle}"` : ""}>
        </div>
        <div class="student-card-body">
          ${buildStudentCardHtml(st)}
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
  const modalImg = document.getElementById("modal-student-img");
  modalImg.src = avatar;
  modalImg.alt = st.fullname;
  modalImg.style.cssText = getPhotoCropStyle(st);
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

// 16. ค้นหาใน ทำเนียบ Directory: ค้นจากคำ/วลี/ส่วนหนึ่งของคำ ในข้อมูลทุกส่วนของแต่ละคน
const DIRECTORY_SEARCH_FIELDS = [
  "finalPrefix", "fullname", "nickname", "gender", "age",
  "phone", "lineId", "email", "address", "education",
  "position", "workplace"
];

function filterDirectory(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderDirectory();
    return;
  }

  const filtered = studentDatabase.filter((st) => {
    return DIRECTORY_SEARCH_FIELDS.some((field) => String(st[field] || "").toLowerCase().includes(q))
      || formatPhoneDisplay(st.phone).toLowerCase().includes(q);
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
