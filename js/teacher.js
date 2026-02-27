import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCq9JHvSmo66qow3AS-apdb5iaeRM0hpsg",
  authDomain: "phieutrial.firebaseapp.com",
  projectId: "phieutrial",
  storageBucket: "phieutrial.firebasestorage.app",
  messagingSenderId: "644397284177",
  appId: "1:644397284177:web:f3c0ea71e495672c5d7170",
  measurementId: "G-G69E1QY2V6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======== DOM ======== 
const teacherEmailEl = document.getElementById("teacherEmail");

const btnLogout = document.getElementById("btnLogout");

const searchInput = document.getElementById("searchInput");
const classesTbody = document.getElementById("classesTbody");

const btnToggleCreateClass = document.getElementById("btnToggleCreateClass");
const classForm = document.getElementById("classForm");
const className = document.getElementById("className");
const classStartDate = document.getElementById("classStartDate");
const btnSaveClass = document.getElementById("btnSaveClass");
const btnCancelClass = document.getElementById("btnCancelClass");

// ===== MODAL STUDENTS ===== 
const studentsModal = document.getElementById("studentsModal");
const btnCloseStudentsModal = document.getElementById("btnCloseStudentsModal");
const modalClassInfo = document.getElementById("modalClassInfo");

const studentSearchInput = document.getElementById("studentSearchInput");
const studentsTbody = document.getElementById("studentsTbody");

const btnToggleCreateStudent = document.getElementById("btnToggleCreateStudent");
const studentForm = document.getElementById("studentForm");
const studentName = document.getElementById("studentName");
const studentClass = document.getElementById("studentClass");
const studentSubject = document.getElementById("studentSubject");
const btnSaveStudent = document.getElementById("btnSaveStudent");
const btnCancelStudent = document.getElementById("btnCancelStudent");

// ====== STATE ====== 
let teacherId = null;

let allClasses = [];
let unsubscribeStudents = null;

let selectedClassId = null;
let selectedClassName = null;
let selectedClassStartDate = null;

let allStudentsInModal = [];

function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function yymmddNow() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function subjectLabel(subject) {
  if (subject === "scratch") return "Scratch";
  if (subject === "gm") return "GameMaker";
  if (subject === "unity") return "Unity";
  return subject || "";
}

function formatUpdatedAt(ts) {
  if (!ts) return "";
  if (ts.toDate) return ts.toDate().toLocaleString("vi-VN");
  return "";
}

async function getNextSequence(fieldName) {
  const counterRef = doc(db, "counters", "global");

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    if (!snap.exists()) {
      tx.set(counterRef, {
        classSeq: 0,
        studentSeq: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const data = snap.exists() ? snap.data() : { classSeq: 0, studentSeq: 0 };
    const current = Number(data[fieldName] || 0);
    const newValue = current + 1;

    tx.set(
      counterRef,
      { [fieldName]: newValue, updatedAt: serverTimestamp() },
      { merge: true }
    );

    return newValue;
  });

  return next;
}

async function generateClassId() {
  const seq = await getNextSequence("classSeq");
  const xxxx = String(seq).padStart(4, "0");
  return `Trial-${yymmddNow()}-${xxxx}`;
}

async function generateStudentId() {
  const seq = await getNextSequence("studentSeq");
  const xxxx = String(seq).padStart(4, "0");
  return `GG-${yymmddNow()}-${xxxx}`;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "google.html";
    return;
  }

  teacherId = user.uid;
  teacherEmailEl.textContent = `Giáo viên: ${user.email || ""}`;

  const teacherRef = doc(db, "teachers", teacherId);
  const teacherSnap = await getDoc(teacherRef);

  if (!teacherSnap.exists()) {
    await setDoc(teacherRef, {
      email: user.email || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  listenClassesRealtime();
});

// ======== LOGOUT ==========
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "google.html";
});

// ====== CLASSES ======= 
function listenClassesRealtime() {
  const classesRef = collection(db, "teachers", teacherId, "classes");
  const q = query(classesRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    const rows = [];
    snap.forEach((docSnap) => {
      rows.push({ id: docSnap.id, ...docSnap.data() });
    });

    allClasses = rows;
    renderClasses();
  });
}

// ======== CLASSES - RENDER + SEARCH ======= 
searchInput.addEventListener("input", renderClasses);

function renderClasses() {
  const keyword = (searchInput.value || "").trim().toLowerCase();

  const filtered = allClasses.filter((c) => {
    const id = (c.id || "").toLowerCase();
    const name = (c.name || "").toLowerCase();
    return id.includes(keyword) || name.includes(keyword);
  });

  if (!filtered.length) {
    classesTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-td">Không có lớp phù hợp.</td>
      </tr>
    `;
    return;
  }

  classesTbody.innerHTML = filtered
    .map((c) => {
      return `
        <tr data-classid="${escapeHTML(c.id)}">
          <td><span class="pill-id">${escapeHTML(c.id)}</span></td>
          <td><b>${escapeHTML(c.name || "")}</b></td>
          <td>${escapeHTML(c.startDate || "")}</td>
          <td>
            <div class="row-actions">
              <button class="btn-shadow btn-small btn-link" data-action="open" data-id="${escapeHTML(c.id)}">
                Xem học sinh
              </button>
              <button class="btn-shadow btn-small btn-danger" data-action="delete" data-id="${escapeHTML(c.id)}">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  classesTbody.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const action = btn.dataset.action;
      const classId = btn.dataset.id;

      if (action === "open") {
        console.log("OPEN CLASS:", classId);
        openStudentsModal(classId);
        return;
        }

      if (action === "delete") {
        const ok = confirm(
          `Xóa lớp ${classId}?\n\nLưu ý: Nếu lớp có students subcollection thì dữ liệu có thể bị "mồ côi".`
        );
        if (!ok) return;

        try {
          await deleteDoc(doc(db, "teachers", teacherId, "classes", classId));
        } catch (err) {
          console.error(err);
          alert("Xóa lớp thất bại.");
        }
      }
    });
  });
}

// ===== CLASSES - CREATE FORM ===== 
btnToggleCreateClass.addEventListener("click", () => {
  classForm.style.display = classForm.style.display === "none" ? "block" : "none";
  if (classForm.style.display === "block") {
    className.value = "";
    classStartDate.value = "";
    className.focus();
  }
});

btnCancelClass.addEventListener("click", () => {
  classForm.style.display = "none";
});

btnSaveClass.addEventListener("click", async () => {
  const name = className.value.trim();
  const startDate = classStartDate.value;

  if (!name) {
    alert("Vui lòng nhập tên lớp.");
    return;
  }
  if (!startDate) {
    alert("Vui lòng chọn ngày bắt đầu.");
    return;
  }

  try {
    btnSaveClass.disabled = true;

    const classId = await generateClassId();
    const classRef = doc(db, "teachers", teacherId, "classes", classId);

    await setDoc(classRef, {
      name,
      startDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    classForm.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Tạo lớp thất bại.");
  } finally {
    btnSaveClass.disabled = false;
  }
});

// ====== MODAL STUDENTS - OPEN/CLOSE =======
btnCloseStudentsModal.addEventListener("click", closeStudentsModal);

// click outside
studentsModal.addEventListener("click", (e) => {
  if (e.target === studentsModal) closeStudentsModal();
});

function closeStudentsModal() {
  studentsModal.style.display = "none";
  studentForm.style.display = "none";
  studentSearchInput.value = "";
  studentsTbody.innerHTML = `<tr><td colspan="6" class="empty-td">Chưa chọn lớp.</td></tr>`;

  allStudentsInModal = [];

  if (unsubscribeStudents) {
    unsubscribeStudents();
    unsubscribeStudents = null;
  }

  selectedClassId = null;
  selectedClassName = null;
  selectedClassStartDate = null;
}

function openStudentsModal(classId) {
    if (!studentsModal) {
    console.error("studentsModal not found in DOM");
    return;
  }

  const cls = allClasses.find((x) => x.id === classId);

  selectedClassId = classId;
  selectedClassName = cls?.name || "";
  selectedClassStartDate = cls?.startDate || "";

  modalClassInfo.innerHTML = `
    <b>${escapeHTML(selectedClassName)}</b> · ID: <span class="pill-id">${escapeHTML(selectedClassId)}</span> · Bắt đầu: <b>${escapeHTML(selectedClassStartDate)}</b>
  `;

  studentsModal.style.display = "flex";

  if (unsubscribeStudents) unsubscribeStudents();

  const studentsRef = collection(db, "teachers", teacherId, "classes", classId, "students");
  const q = query(studentsRef, orderBy("updatedAt", "desc"));

  unsubscribeStudents = onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach((docSnap) => {
      arr.push({ id: docSnap.id, ...docSnap.data() });
    });

    allStudentsInModal = arr;
    renderStudentsInModal();
  });
}

studentSearchInput.addEventListener("input", renderStudentsInModal);

function renderStudentsInModal() {
  if (!selectedClassId) {
    studentsTbody.innerHTML = `<tr><td colspan="6" class="empty-td">Chưa chọn lớp.</td></tr>`;
    return;
  }

  const keyword = (studentSearchInput.value || "").trim().toLowerCase();

  const filtered = allStudentsInModal.filter((s) => {
    const id = (s.id || "").toLowerCase();
    const name = (s.profile?.name || "").toLowerCase();
    return id.includes(keyword) || name.includes(keyword);
  });

  if (!filtered.length) {
    studentsTbody.innerHTML = `<tr><td colspan="6" class="empty-td">Chưa có học sinh phù hợp.</td></tr>`;
    return;
  }

  studentsTbody.innerHTML = filtered
    .map((s) => {
      const profile = s.profile || {};
      const updatedAt = formatUpdatedAt(s.updatedAt);

      return `
        <tr class="row-click-student" data-studentid="${escapeHTML(s.id)}">
          <td><span class="pill-id">${escapeHTML(s.id)}</span></td>
          <td><b>${escapeHTML(profile.name || "")}</b></td>
          <td>${escapeHTML(profile.class || "")}</td>
          <td><span class="pill-subject">${escapeHTML(subjectLabel(profile.subject))}</span></td>
          <td>${escapeHTML(updatedAt)}</td>
          <td>
            <div class="row-actions">
              <button class="btn-shadow btn-small btn-link" data-action="open" data-id="${escapeHTML(s.id)}">
                Đánh giá
              </button>
              <button class="btn-shadow btn-small btn-danger" data-action="delete" data-id="${escapeHTML(s.id)}">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  studentsTbody.querySelectorAll("tr.row-click-student").forEach((tr) => {
    tr.addEventListener("click", () => {
      const studentId = tr.dataset.studentid;
      if (!studentId) return;
      openCoding(selectedClassId, studentId);
    });
  });

  studentsTbody.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const action = btn.dataset.action;
      const studentId = btn.dataset.id;

      if (action === "open") {
        openCoding(selectedClassId, studentId);
        return;
      }

      if (action === "delete") {
        const ok = confirm(`Xóa học sinh ${studentId}?`);
        if (!ok) return;

        try {
          await deleteDoc(
            doc(db, "teachers", teacherId, "classes", selectedClassId, "students", studentId)
          );
        } catch (err) {
          console.error(err);
          alert("Xóa học sinh thất bại.");
        }
      }
    });
  });
}

function openCoding(classId, studentId) {
  window.location.href =
    `coding.html?classId=${encodeURIComponent(classId)}&studentId=${encodeURIComponent(studentId)}`;
}

btnToggleCreateStudent.addEventListener("click", () => {
  if (!selectedClassId) return;

  studentForm.style.display = studentForm.style.display === "none" ? "block" : "none";
  if (studentForm.style.display === "block") {
    studentName.value = "";
    studentClass.value = "";
    studentSubject.value = "scratch";
    studentName.focus();
  }
});

btnCancelStudent.addEventListener("click", () => {
  studentForm.style.display = "none";
});

btnSaveStudent.addEventListener("click", async () => {
  if (!selectedClassId) return;

  const name = studentName.value.trim();
  const classText = studentClass.value.trim();
  const subject = studentSubject.value;

  if (!name) {
    alert("Vui lòng nhập tên học sinh.");
    return;
  }
  if (!classText) {
    alert("Vui lòng nhập lớp (ví dụ: 8A).");
    return;
  }

  try {
    btnSaveStudent.disabled = true;

    const studentId = await generateStudentId();

    const studentRef = doc(
      db,
      "teachers",
      teacherId,
      "classes",
      selectedClassId,
      "students",
      studentId
    );

    await setDoc(studentRef, {
      profile: {
        name,
        class: classText,
        subject,
        teacherName: "",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    studentForm.style.display = "none";

    openCoding(selectedClassId, studentId);
  } catch (err) {
    console.error(err);
    alert("Tạo học sinh thất bại.");
  } finally {
    btnSaveStudent.disabled = false;
  }
});
