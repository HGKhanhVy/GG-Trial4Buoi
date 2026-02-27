import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCq9JHvSmo66qow3AS-apdb5iaeRM0hpsg",
  authDomain: "phieutrial.firebaseapp.com",
  projectId: "phieutrial",
  storageBucket: "phieutrial.firebasestorage.app",
  messagingSenderId: "644397284177",
  appId: "1:644397284177:web:f3c0ea71e495672c5d7170",
  measurementId: "G-G69E1QY2V6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let CURRENT_TEACHER_ID = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.error("Chưa đăng nhập.");
    return;
  }

  CURRENT_TEACHER_ID = user.uid;

  const params = new URLSearchParams(window.location.search);
  const classId = params.get("classId");
  const studentId = params.get("studentId");

  if (!classId || !studentId) {
    console.error("Thiếu classId hoặc studentId trên URL.");
    return;
  }

  await loadStudentDetail(classId, studentId);
});

async function loadStudentDetail(classId, studentId) {
  try {
    const studentRef = doc(
      db,
      "teachers",
      CURRENT_TEACHER_ID,
      "classes",
      classId,
      "students",
      studentId
    );

    const snapshot = await getDoc(studentRef);

    if (!snapshot.exists()) {
      alert("Không tìm thấy học sinh.");
      return;
    }

    const studentData = snapshot.data();

    loadProfile(studentData);
    loadAllSessions(studentData);

    window.detailDataLoaded = true;

  } catch (error) {
    console.error("Lỗi load student:", error);
  }
}

// ================= PROFILE ================= 
function loadProfile(studentData) {
  const profile = studentData.profile || {};

  const nameEl = document.getElementById("hocVien");
  const teacherEl = document.getElementById("giaoVien");
  const classEl = document.getElementById("lop");

  if (nameEl) nameEl.textContent = profile.name || "";
  if (teacherEl) teacherEl.textContent = profile.teacher_name || "";
  if (classEl) classEl.textContent = profile.class || "";
}

// ================= SESSIONS ================= 
function loadAllSessions(studentData) {
  for (let i = 1; i <= 4; i++) {
    loadSession(studentData, i);
  }
}

function loadSession(studentData, sessionNumber) {
  const sessionKey = `session_${sessionNumber}`;
  const sessionData = studentData[sessionKey];

  if (!sessionData || !sessionData.criteria) {
    return; 
  }

  loadCriteria(sessionData.criteria, sessionNumber);
  loadComments(sessionData, sessionNumber);
  loadTotalScore(sessionData, sessionNumber);
}

// ================= CRITERIA (CHECKBOX) ================= 
function loadCriteria(criteriaObj, sessionNumber) {
  Object.keys(criteriaObj).forEach(blockKey => {
    const level = criteriaObj[blockKey]?.level;
    if (!level) return;

    const selector =
      `input.readonly-checkbox[data-session="${sessionNumber}"]` +
      `[data-block="${blockKey}"]` +
      `[data-level="${level}"]`;

    const checkbox = document.querySelector(selector);
    if (checkbox) {
      checkbox.checked = true;
    }
  });
}

// ================= COMMENTS ================= 
function loadComments(sessionData, sessionNumber) {
  const generalEl = document.getElementById(`session${sessionNumber}-general`);
  const highlightEl = document.getElementById(`session${sessionNumber}-highlight`);

  if (generalEl) {
    generalEl.textContent = sessionData?.teacher_comment?.general || "";
  }

  if (highlightEl) {
    highlightEl.textContent = sessionData?.teacher_comment?.highlight || "";
  }
}

// ================= TOTAL SCORE ================= 
function loadTotalScore(sessionData, sessionNumber) {
  const totalScoreEl = document.getElementById(`session${sessionNumber}-total`);
  if (totalScoreEl) {
    totalScoreEl.textContent = sessionData?.total_score ?? 0;
  }
}

// ================= READONLY CHECKBOX ================= 
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("readonly-checkbox")) {
    e.preventDefault();
  }
});