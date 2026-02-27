import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  getDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

let CURRENT_STUDENT_DATA = null;
let CURRENT_TEACHER_ID = null;

const urlParams = new URLSearchParams(window.location.search);
const classIdFromUrl = urlParams.get("classId");
const studentIdFromUrl = urlParams.get("studentId");
const mode = urlParams.get("mode"); // create | edit

// Quy ước điểm
const M_MAP = {
  M1: 0.25,
  M2: 0.5,
  M3: 1
};

function getCheckedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || null;
}

// ================== SUBJECT CONFIG ==================
const SUBJECT_CONFIG = {
  Scratch: {
    tabs: ["buoi1", "buoi2", "buoi3", "buoi4", "tongket"],
    tabLabels: {
      buoi1: "BUỔI 1",
      buoi2: "BUỔI 2",
      buoi3: "BUỔI 3",
      buoi4: "BUỔI 4",
      tongket: "TỔNG KẾT"
    },
    sessions: {
      buoi1: [
        {
          title: "VỀ THÁI ĐỘ HỌC TẬP",
          criteria: [
            "Sẵn sàng tham gia hoạt động làm quen với lập trình",
            "Không e ngại khi thử thao tác với giao diện Scratch",
            "Thể hiện sự tò mò với nhân vật, khối lệnh, sân khấu"
          ]
        },
        {
          title: "VỀ KỸ NĂNG GIAO TIẾP",
          criteria: [
            "Dám mô tả điều mình muốn nhân vật làm",
            "Biết đặt câu hỏi khi chưa hiểu thao tác",
            "Lắng nghe hướng dẫn về cách kéo – ghép khối lệnh"
          ]
        },
        {
          title: "VỀ NĂNG LỰC CÔNG NGHỆ",
          criteria: [
            "Nhận biết khu vực chính trong Scratch (nhân vật, sân khấu, khối lệnh)",
            "Chủ động lập trình các nhân vật khi xem sản phẩm mẫu",
            "Biết thử nghiệm ghép nhiều khối lệnh để tạo hiệu ứng theo ý tưởng cá nhân",
            "Biết chạy thử chương trình - quan sát kết quả và cải tiến chương trình"
          ]
        }
      ],
      buoi2: [
        {
          title: "VỀ TƯ DUY LOGIC",
          criteria: [
            "Hiểu mối quan hệ giữa khối lệnh và hành động nhân vật",
            "Biết sắp xếp lệnh theo trình tự hợp lý",
            "Nhận ra nếu đổi thứ tự lệnh thì kết quả thay đổi"
          ]
        },
        {
          title: "VỀ KHẢ NĂNG GIẢI QUYẾT VẤN ĐỀ",
          criteria: [
            "Thử nhiều cách khác nhau để đạt cùng mục tiêu",
            "Nhận biết lỗi khi chương trình không chạy đúng",
            "Biết kiểm tra lại chương trình sau mỗi lần chỉnh sửa",
            "Không lặp lại cùng một lỗi sau khi được gợi ý"
          ]
        },
        {
          title: "VỀ THÁI ĐỘ KHI LẬP TRÌNH",
          criteria: [
            "Kiên trì thử lại khi chương trình chưa đúng",
            "Không bỏ cuộc khi gặp lỗi",
            "Giữ bình tĩnh và tiếp tục tìm cách sửa"
          ]
        }
      ],
      buoi3: [
        {
          title: "VỀ KHẢ NĂNG HỢP TÁC",
          criteria: [
            "Cùng bạn thống nhất ý tưởng cho sản phẩm",
            "Chia vai: người lên ý tưởng – người thao tác – người kiểm tra",
            "Phối hợp để hoàn thành sản phẩm chung"
          ]
        },
        {
          title: "VỀ KỸ NĂNG GIAO TIẾP",
          criteria: [
            "Trao đổi rõ ràng về cách nhân vật hoạt động",
            "Biết giải thích khối lệnh mình đang dùng",
            "Biết hỏi lại khi chưa hiểu yêu cầu hoặc khối lệnh",
            "Lắng nghe và điều chỉnh theo góp ý của bạn"
          ]
        },
        {
          title: "VỀ THÁI ĐỘ ỨNG XỬ",
          criteria: [
            "Phản hồi tích cực khi chương trình bị góp ý",
            "Chấp nhận thay đổi ý tưởng khi cần",
            "Tôn trọng ý kiến của người khác"
          ]
        }
      ],
      buoi4: [
        {
          title: "VỀ KHẢ NĂNG SÁNG TẠO",
          criteria: [
            "Có ý tưởng riêng cho sản phẩm Scratch",
            "Biết kết hợp nhiều khối lệnh đã học",
            "Thử thêm hiệu ứng, hành động để chương trình sinh động hơn",
            "Sáng tạo lập trình theo ý tưởng cá nhân"
          ]
        },
        {
          title: "VỀ NĂNG LỰC TỰ CHỦ",
          criteria: [
            "Chủ động xây dựng chương trình theo ý tưởng",
            "Tự kiểm tra và chỉnh sửa chương trình",
            "Ít phụ thuộc vào hướng dẫn trực tiếp"
          ]
        },
        {
          title: "VỀ KHẢ NĂNG TRÌNH BÀY",
          criteria: [
            "Giải thích được chương trình mình",
            "Mô tả logic hoạt động của nhân vật",
            "Tự tin giới thiệu sản phẩm trước lớp"
          ]
        }
      ]
    }
  },

  GameMaker: {
    tabs: ["buoi1", "buoi2", "buoi3", "buoi4", "tongket"],
    tabLabels: {
      buoi1: "BUỔI 1",
      buoi2: "BUỔI 2",
      buoi3: "BUỔI 3",
      buoi4: "BUỔI 4",
      tongket: "TỔNG KẾT"
    },
    sessions: {
      buoi1: [
        {
          title: "VỀ THÁI ĐỘ HỌC TẬP",
          criteria: [
            "Sẵn sàng tham gia hoạt động làm quen môi trường phát triển game GameMaker",
            "Thể hiện sự tò mò với việc tạo nhân vật, không gian game và cơ chế hoạt động",
            "Chủ động khám phá các tài nguyên có sẵn trong dự án mẫu"
          ]
        },
        {
          title: "VỀ KỸ NĂNG GIAO TIẾP",
          criteria: [
            "Đặt câu hỏi khi chưa hiểu về Object, Event hoặc Room",
            "Lắng nghe hướng dẫn về quy trình tạo tài nguyên game",
            "Giải thích được ý tưởng game đơn giản bằng lời nói"
          ]
        },
        {
          title: "VỀ NĂNG LỰC CÔNG NGHỆ",
          criteria: [
            "Tạo được tài nguyên cơ bản: Sprite – Object – Room",
            "Bước đầu hiểu mối liên hệ giữa Sprite → Object → Room → Gameplay",
            "Thử nghiệm chỉnh sửa thông số để thay đổi hành vi nhân vật",
            "Chạy thử game – quan sát lỗi – chỉnh sửa lại tài nguyên để phù hợp hơn"
          ]
        }
      ],
      buoi2: [
        {
          title: "VỀ TƯ DUY LOGIC",
          criteria: [
            "Hiểu mối liên hệ giữa Event và hành vi của Object trong game",
            "Biết sắp xếp logic hành động nhân vật theo trình tự hợp lý",
            "Thử nhiều cách thiết lập Event khác nhau để đạt cùng mục tiêu gameplay"
          ]
        },
        {
          title: "VỀ KHẢ NĂNG GIẢI QUYẾT VẤN ĐỀ",
          criteria: [
            "Nhận biết khi nhân vật hoặc game hoạt động không đúng mong muốn",
            "Kiểm tra lại Event, Room hoặc Object sau mỗi lần chỉnh sửa",
            "Điều chỉnh tài nguyên hoặc logic khi phát hiện lỗi trong game",
            "Không lặp lại cùng lỗi sau khi đã được gợi ý cách sửa"
          ]
        },
        {
          title: "VỀ THÁI ĐỘ KHI LẬP TRÌNH",
          criteria: [
            "Kiên trì thử lại khi cơ chế game chưa hoạt động đúng",
            "Không bỏ cuộc khi gặp lỗi trong quá trình tạo game",
            "Sẵn sàng thử nghiệm ý tưởng mới trong quá trình làm game"
          ]
        }
      ],
      buoi3: [
        {
          title: "VỀ KHẢ NĂNG HỢP TÁC",
          criteria: [
            "Cùng bạn thống nhất ý tưởng",
            "Phân công nhiệm vụ khi tham gia hoạt động nhóm",
            "Chủ động phối hợp với bạn để cùng thực hiện nhiệm vụ"
          ]
        },
        {
          title: "VỀ KỸ NĂNG GIAO TIẾP",
          criteria: [
            "Trao đổi/thảo luận rõ ràng về các hoạt động trong buổi học",
            "Giải thích hành động/thao tác/sự lựa chọn .....",
            "Chủ động hỏi lại khi chưa hiểu yêu cầu",
            "Lắng nghe và điều chỉnh theo góp ý từ mọi người"
          ]
        },
        {
          title: "VỀ THÁI ĐỘ ỨNG XỬ",
          criteria: [
            "Phản hồi tích cực khi sản phẩm nhóm được đóng góp ý kiến",
            "Chấp nhận thay đổi ý tưởng khi cần",
            "Tôn trọng ý kiến của người khác"
          ]
        }
      ],
      buoi4: [
        {
          title: "VỀ KHẢ NĂNG SÁNG TẠO",
          criteria: [
            "Có ý tưởng riêng cho gameplay hoặc cơ chế hoạt động của game",
            "Biết kết hợp nhiều Event hoặc hành vi để tạo cơ chế mới",
            "Thử thêm hiệu ứng chuyển động, va chạm hoặc âm thanh để game sinh động hơn",
            "Tùy chỉnh nhân vật, bối cảnh hoặc cách chơi theo ý tưởng cá nhân"
          ]
        },
        {
          title: "VỀ NĂNG LỰC TỰ CHỦ",
          criteria: [
            "Chủ động xây dựng gameplay dựa trên ý tưởng của mình",
            "Tự kiểm tra và chỉnh sửa Object, Event khi game chạy chưa đúng",
            "Thử nghiệm nhiều cách khác nhau để hoàn thiện cơ chế game"
          ]
        },
        {
          title: "VỀ KHẢ NĂNG TRÌNH BÀY",
          criteria: [
            "Giải thích được cơ chế hoạt động chính của game",
            "Mô tả được vai trò của Object hoặc Event trong sản phẩm",
            "Trình bày ý tưởng thiết kế hoặc hướng phát triển tiếp theo"
          ]
        }
      ]
    }
  }
};

// ================== UI: TABS + CONTENT ==================
const subjectSelect = document.getElementById("monTraiNghiem");
const tabsWrap = document.getElementById("sessionTabs");
const tabContentsWrap = document.getElementById("tabContents");

function renderTabs(subjectKey) {
  const config = SUBJECT_CONFIG[subjectKey];
  if (!config) return;

  tabsWrap.innerHTML = "";

  config.tabs.forEach((tabId, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn" + (idx === 0 ? " active" : "");
    btn.dataset.tab = tabId;
    btn.textContent = config.tabLabels[tabId] || tabId.toUpperCase();

    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      const target = document.getElementById(tabId);
      if (target) target.classList.add("active");

      if (tabId === "tongket") {
        setTimeout(() => {
          if (typeof renderSummaryChart === "function") renderSummaryChart();

          // Tính tổng điểm hiện tại theo radio
          const payload = buildStudentPayload();
          const totalScore = payload?.summary?.total_score || 0;
          updateOrientationCourseByScore(totalScore);
        }, 50);
      }
    });

    tabsWrap.appendChild(btn);
  });
}

function renderSessionContent(subjectKey) {
  const config = SUBJECT_CONFIG[subjectKey];
  if (!config) return;

  tabContentsWrap.innerHTML = "";

  config.tabs.forEach((tabId, idx) => {
    const tabDiv = document.createElement("div");
    tabDiv.className = "tab-content" + (idx === 0 ? " active" : "");
    tabDiv.id = tabId;

    if (tabId === "tongket") {
      const orientationSection = document.createElement("div");
      orientationSection.className = "section orientation-section";

      tabDiv.innerHTML = `
        <div class="section-title">TỔNG KẾT</div>
        <div class="summary-chart-wrap">
          <h3>TỔNG KẾT NĂNG LỰC HỌC TẬP <br>SAU 4 BUỔI TRẢI NGHIỆM</h3>
          <div class="chart-wrap">
            <canvas id="summaryChart"></canvas>
          </div>
          <div class="summary-note">
            Biểu đồ thể hiện mức độ năng lực hiện tại của học sinh sau 4 buổi trải nghiệm
            và mức phát triển dự kiến sau khi hoàn thành khóa học lập trình tại GearGen.
          </div>
          <div class="detail-btn-wrap pdf-hide">
            <button id="btnDetail" class="detail-btn">
                Xem chi tiết
            </button>
          </div>
        </div>

        <br>
        <div id="commentSection">
          <div class="section">
            <h2>B. CHIA SẺ CỦA GIÁO VIÊN</h2>
            <div class="teacher-comment">
              <h3>Nhận xét chung từ giáo viên</h3>
              <textarea id="commentGeneral_summary" rows="5"></textarea>
            </div>
            <div class="teacher-comment">
              <h3>Điểm nổi bật của học sinh</h3>
              <textarea id="commentHighlight_summary" rows="5"></textarea>
            </div>
            <div class="teacher-comment">
              <h3>Đề xuất hướng phát triển</h3>
              <textarea id="commentDev_summary" rows="5"></textarea>
            </div>
          </div>

          <h2 class="orientation-title">ĐỊNH HƯỚNG CỦA GEARGEN</h2>

          <div class="orientation-row">
            <div class="orientation-text">
              Sau khóa học trải nghiệm, học sinh phù hợp đầu vào khóa học:
            </div>

            <select id="orientationCourseSelect" class="orientation-select">
              <option value="Scratch Advanced">Scratch Advanced</option>
              <option value="Scratch Basic">Scratch Basic</option>
              <option value="GameMaker Basic">GameMaker Basic</option>
              <option value="Trial Level thấp hơn">Trial Level thấp hơn</option>
            </select>
          </div>
        </div>
      `;
      tabContentsWrap.appendChild(tabDiv);
      tabContentsWrap.appendChild(orientationSection);

      document.getElementById("btnDetail").addEventListener("click", function () {

        const params = new URLSearchParams(window.location.search);
        const classIdFromUrl = params.get("classId");
        const studentIdFromUrl = params.get("studentId");

        if (!classIdFromUrl || !studentIdFromUrl) {
          alert("Thiếu classId hoặc studentId.");
          return;
        }

        const mon = document.getElementById("monTraiNghiem")?.value || "Scratch";

        let targetPage = "";

        if (mon === "Scratch") {
          targetPage = "detailScratch.html";
        } else if (mon === "GameMaker") {
          targetPage = "detailGameMaker.html";
        } else {
          alert("Môn không hợp lệ.");
          return;
        }

        window.location.href =
          `${targetPage}?classId=${encodeURIComponent(classIdFromUrl)}&studentId=${encodeURIComponent(studentIdFromUrl)}`;

      });

      bindOrientationSelectEvents();

      const savedOrientation = CURRENT_STUDENT_DATA?.summary?.orientationCourse;
      const savedTotalScore = CURRENT_STUDENT_DATA?.summary?.total_score;

      if (savedOrientation) {
        const selectEl = document.getElementById("orientationCourseSelect");
        if (selectEl) {
          selectEl.value = savedOrientation;
          selectEl.dataset.userEdited = "true";
        }
      } else if (typeof savedTotalScore === "number") {
        updateOrientationCourseByScore(savedTotalScore);
      }

      return;
    }

    const sessionBlocks = config.sessions?.[tabId] || [];

    sessionBlocks.forEach((block, blockIndex) => {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = block.title;
      tabDiv.appendChild(title);

      block.criteria.forEach((criteriaText, cIndex) => {
        const criteriaNumber = cIndex + 1;
        const criteriaDiv = document.createElement("div");
        criteriaDiv.className = "criteria-text";
        criteriaDiv.textContent = `Tiêu chí ${criteriaNumber}: ${criteriaText}`;
        tabDiv.appendChild(criteriaDiv);

        const cKey = `block${blockIndex + 1}_tc${criteriaNumber}`;
        const groupName = `${tabId}_${cKey}`;

        const mLevel = document.createElement("div");
        mLevel.className = "m-level";
        mLevel.innerHTML = `
          <label class="m-item">
            <input type="radio" name="${groupName}" value="M1" checked />
            <span>M1</span>
          </label>
          <label class="m-item">
            <input type="radio" name="${groupName}" value="M2" />
            <span>M2</span>
          </label>
          <label class="m-item">
            <input type="radio" name="${groupName}" value="M3" />
            <span>M3</span>
          </label>
        `;
        tabDiv.appendChild(mLevel);

        const note = document.createElement("textarea");
        note.className = "note-box";
        note.name = `${tabId}_note_${cKey}`;
        tabDiv.appendChild(note);
      });

      tabDiv.appendChild(document.createElement("br"));
      tabDiv.appendChild(document.createElement("br"));
    });

    const teacherBlock = document.createElement("div");
    teacherBlock.className = "section";
    teacherBlock.innerHTML = `
      <br>
      <div class="section">
        <h2>B. CHIA SẺ CỦA GIÁO VIÊN</h2>
        <div class="teacher-comment">
          <h3>Nhận xét chung từ giáo viên</h3>
          <textarea id="commentGeneral_${tabId}" rows="5"></textarea>
        </div>
        <div class="teacher-comment">
          <h3>Điểm nổi bật của học sinh</h3>
          <textarea id="commentHighlight_${tabId}" rows="5"></textarea>
        </div>
        <div class="teacher-comment">
          <h3>Đề xuất hướng phát triển</h3>
          <textarea id="commentDev_${tabId}" rows="5"></textarea>
        </div>
      </div>
    `;
    tabDiv.appendChild(teacherBlock);

    tabContentsWrap.appendChild(tabDiv);
  });
}

function loadSubject(subjectKey) {
  renderTabs(subjectKey);
  renderSessionContent(subjectKey);
}

// ================== BUILD PAYLOAD ==================
function buildStudentPayload() {
  const name = document.getElementById("hoTen")?.value?.trim() || "";
  const className = document.getElementById("tuoiLop")?.value?.trim() || "";
  const subject = document.getElementById("monTraiNghiem")?.value || "";
  const teacher_name = document.getElementById("giaoVien")?.value || "";
  const experienceDateEl = document.getElementById("ngayTraiNghiem");

  let experienceDate = experienceDateEl?.value || "";

  const oldDate = CURRENT_STUDENT_DATA?.profile?.experienceDate;
  if (oldDate) experienceDate = oldDate;

  if (!experienceDate) {
    const today = new Date();
    experienceDate = today.toISOString().slice(0, 10);
  }

  const profile = {
    name,
    class: className,
    subject,
    teacher_name,
    experienceDate
  };

  function buildSession(sessionIndex) {
    const tabId = `buoi${sessionIndex}`;

    const radios = document.querySelectorAll(`input[type="radio"][name^="${tabId}_"]`);
    const groupNames = new Set();
    radios.forEach((r) => groupNames.add(r.name));

    const criteria = {};
    let total = 0;

    groupNames.forEach((groupName) => {
      const v = getCheckedValue(groupName);
      if (!v) return;

      const score = M_MAP[v] || 0;
      total += score;

      const cKey = groupName.replace(`${tabId}_`, "");
      criteria[cKey] = { level: v, score };
    });

    let date = "";
    const oldDate = CURRENT_STUDENT_DATA?.[`session_${sessionIndex}`]?.date;
    if (oldDate) date = oldDate;
    if (!date) date = new Date().toLocaleDateString("vi-VN");

    const general = document.getElementById(`commentGeneral_${tabId}`)?.value?.trim() || "";
    const highlight = document.getElementById(`commentHighlight_${tabId}`)?.value?.trim() || "";
    const suggestion = document.getElementById(`commentDev_${tabId}`)?.value?.trim() || "";

    return {
      date,
      criteria,
      total_score: Math.round(total * 100) / 100,
      teacher_comment: {
        general,
        highlight,
        suggestion
      }
    };
  }

  const session_1 = buildSession(1);
  const session_2 = buildSession(2);
  const session_3 = buildSession(3);
  const session_4 = buildSession(4);

  const general_sum = document.getElementById(`commentGeneral_summary`)?.value?.trim() || "";
  const highlight_sum = document.getElementById(`commentHighlight_summary`)?.value?.trim() || "";
  const suggestion_sum = document.getElementById(`commentDev_summary`)?.value?.trim() || "";
  const orientationCourse = document.getElementById("orientationCourseSelect")?.value || "";

  const summary = {
    teacher_comment: {
      general: general_sum,
      highlight: highlight_sum,
      suggestion: suggestion_sum
    },
    total_score:
      Math.round(
        (session_1.total_score + session_2.total_score + session_3.total_score + session_4.total_score) * 100
      ) / 100,
    orientationCourse
  };

  return {
    profile,
    session_1,
    session_2,
    session_3,
    session_4,
    summary
  };
}

// ================== FIRESTORE PATH ==================
function getStudentRef(teacherId, classId, studentId) {
  return doc(db, "teachers", teacherId, "classes", classId, "students", studentId);
}


// ================== ID GENERATION (GLOBAL COUNTER) ==================
async function generateStudentId(db) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePart = `${yy}${mm}${dd}`;

  const counterRef = doc(db, "counters", `student_${datePart}`);

  const newId = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    let last = 0;
    if (snap.exists()) last = snap.data().last || 0;

    const next = last + 1;
    transaction.set(counterRef, { last: next }, { merge: true });

    const xxxx = String(next).padStart(4, "0");
    return `GG-${datePart}-${xxxx}`;
  });

  return newId;
}

// ================== SAVE / UPDATE ==================
async function createStudentAndSave() {
  if (!classIdFromUrl) {
    alert("Thiếu classId.");
    return;
  }

  const payload = buildStudentPayload();

  if (!payload.profile.name) {
    alert("Bạn cần nhập tên học sinh trước khi lưu.");
    return;
  }

  const studentId = await generateStudentId(db);
  const studentRef = doc(
    db,
    "teachers",
    CURRENT_TEACHER_ID,
    "classes",
    classIdFromUrl,
    "students",
    studentId
  );

  await setDoc(studentRef, {
    ...payload,
    classId: classIdFromUrl,
    studentId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  alert("Đã lưu học sinh!");

  window.location.href = `index.html`;
}

async function updateStudentAndSave(studentId) {
  if (!classIdFromUrl) {
    alert("Thiếu classId.");
    return;
  }

  const payload = buildStudentPayload();

  if (!payload.profile.name) {
    alert("Bạn cần nhập tên học sinh trước khi lưu.");
    return;
  }

  const studentRef = getStudentRef(CURRENT_TEACHER_ID, classIdFromUrl, studentId);

  await updateDoc(studentRef, {
    ...payload,
    updatedAt: serverTimestamp()
  });

  alert("Đã cập nhật tiến trình học sinh!");
  window.location.href = `index.html`;
}

// ================== LOAD STUDENT ==================
async function loadStudentProgress(classIdFromUrl, studentId) {
  if (!classIdFromUrl) return;

  const studentRef = doc(
    db,
    "teachers",
    CURRENT_TEACHER_ID,
    "classes",
    classIdFromUrl,
    "students",
    studentId
  );

  const snap = await getDoc(studentRef);

  if (!snap.exists()) {
    alert("Không tìm thấy học sinh.");
    return;
  }

  const data = snap.data();
  CURRENT_STUDENT_DATA = data;

  // profile
  document.getElementById("hoTen").value = data?.profile?.name || "";
  document.getElementById("tuoiLop").value = data?.profile?.class || "";
  document.getElementById("giaoVien").value = data?.profile?.teacher_name || "";

  const dateEl = document.getElementById("ngayTraiNghiem");
  if (dateEl) {
    const savedDate = data?.profile?.experienceDate;
    if (savedDate) {
      dateEl.value = savedDate;
      dateEl.disabled = true;
    } else {
      dateEl.disabled = false;
    }
  }

  // subject
  const subjectKey = data?.profile?.subject || "Scratch";
  subjectSelect.value = subjectKey;
  loadSubject(subjectKey);

  function applySession(sessionIndex) {
    const tabId = `buoi${sessionIndex}`;
    const sessionData = data?.[`session_${sessionIndex}`];
    if (!sessionData) return;

    // criteria
    const criteriaObj = sessionData.criteria || {};
    
    Object.keys(criteriaObj).forEach((cKey) => {
      // cKey = block1_tc1
      const groupName = `${tabId}_${cKey}`;
      const level = criteriaObj[cKey]?.level;
      if (!level) return;

      const radio = document.querySelector(
        `input[type="radio"][name="${groupName}"][value="${level}"]`
      );
      if (radio) radio.checked = true;
    });

    Object.keys(criteriaObj).forEach((cKey) => {
      const groupName = `${tabId}_${cKey}`;
      const level = criteriaObj[cKey]?.level;
      if (!level) return;

      const radio = document.querySelector(
        `input[type="radio"][name="${groupName}"][value="${level}"]`
      );
      if (radio) applyAutoCommentByRadio(radio);
    });

    // comments
    const generalEl = document.getElementById(`commentGeneral_${tabId}`);
    const highlightEl = document.getElementById(`commentHighlight_${tabId}`);
    const devEl = document.getElementById(`commentDev_${tabId}`);

    if (generalEl) generalEl.value = sessionData?.teacher_comment?.general || "";
    if (highlightEl) highlightEl.value = sessionData?.teacher_comment?.highlight || "";
    if (devEl) devEl.value = sessionData?.teacher_comment?.suggestion || "";

    // summary comments
    const generalSumEl = document.getElementById(`commentGeneral_summary`);
    const highlightSumEl = document.getElementById(`commentHighlight_summary`);
    const devSumEl = document.getElementById(`commentDev_summary`);
    if (generalSumEl) generalSumEl.value = data?.summary?.teacher_comment?.general || "";
    if (highlightSumEl) highlightSumEl.value = data?.summary?.teacher_comment?.highlight || "";
    if (devSumEl) devSumEl.value = data?.summary?.teacher_comment?.suggestion || "";

  }

  applySession(1);
  applySession(2);
  applySession(3);
  applySession(4);

  renderAutoCommentForSession("buoi1");
  renderAutoCommentForSession("buoi2");
  renderAutoCommentForSession("buoi3");
  renderAutoCommentForSession("buoi4");

  setTimeout(() => {
    if (typeof renderSummaryChart === "function") renderSummaryChart();

    bindOrientationSelectEvents();

    const selectEl = document.getElementById("orientationCourseSelect");
    if (!selectEl) return;

    const savedOrientation = data?.summary?.orientationCourse;
    const totalScore = data?.summary?.total_score || 0;

    if (savedOrientation && savedOrientation.trim() !== "") {
      selectEl.value = savedOrientation;
      selectEl.dataset.userEdited = "true";
    } else {
      updateOrientationCourseByScore(totalScore);
    }
  }, 50);
}

// ================== EVENTS ==================
subjectSelect.addEventListener("change", (e) => {
  const subjectKey = e.target.value;
  loadSubject(subjectKey);

  setTimeout(() => {
    const activeTab = document.querySelector(".tab-btn.active")?.dataset?.tab;
    if (activeTab === "tongket" && typeof renderSummaryChart === "function") {
      renderSummaryChart();
    }
  }, 50);
});

window.addEventListener("DOMContentLoaded", () => {
  subjectSelect.value = "Scratch";
  loadSubject("Scratch");
  bindAutoCommentEvents();
});

document.addEventListener("DOMContentLoaded", () => {
  const btnSave = document.getElementById("btnSaveStudent");

  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      try {
        if (mode === "create" || !studentIdFromUrl) {
          await createStudentAndSave();
        } else {
          await updateStudentAndSave(studentIdFromUrl);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi lưu học sinh. Kiểm tra console để xem chi tiết.");
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("btnDetail");

  if (btn) {
    btn.addEventListener("click", function () {
      window.location.href = "detail.html";
    });
  }
});

// ================== AUTH LOAD ==================
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  CURRENT_TEACHER_ID = user.uid;

  if (classIdFromUrl && studentIdFromUrl) {
    await loadStudentProgress(classIdFromUrl, studentIdFromUrl);
  }
});

// ======= Auto text nhận xét =======
const AUTO_COMMENT_MAP = {
  Scratch: {
    buoi1: {
      block1_tc1: { 
        M1: "Học sinh đang trong giai đoạn thích nghi với môi trường lập trình; cần thêm thời gian quan sát và sự khích lệ để tham gia đầy đủ các hoạt động thực hành trên lớp.", 
        M2: "Học sinh tham gia hoạt động khi có định hướng rõ ràng từ giáo viên; duy trì sự tập trung và hoàn thành các nhiệm vụ cơ bản theo tiến trình của buổi học.", 
        M3: "Học sinh tích cực tham gia ngay từ đầu buổi học, thể hiện sự hứng thú với nội dung mới và sẵn sàng trải nghiệm các thử thách lập trình cơ bản." 
      },
      block1_tc2: { 
        M1: "Học sinh còn dè dặt khi sử dụng giao diện; cần được hỗ trợ từng bước để làm quen với khu vực làm việc và các công cụ cơ bản.", 
        M2: "Học sinh thao tác được trên giao diện khi có hướng dẫn; thực hiện các chức năng quen thuộc và dần hình thành sự tự tin trong quá trình sử dụng phần mềm.", 
        M3: "Học sinh sử dụng giao diện một cách tự nhiên, chủ động mở dự án, điều chỉnh khu vực làm việc và thao tác độc lập trong quá trình lập trình." 
      },
      block1_tc3: { 
        M1: "Học sinh chủ yếu quan sát theo hướng dẫn; cần gợi mở thêm để chú ý đến vai trò của nhân vật, sân khấu và các nhóm lệnh.", 
        M2: "Học sinh thể hiện sự quan tâm khi được gợi mở; chủ động quan sát và thử một số thay đổi đơn giản để hiểu vai trò của từng thành phần.", 
        M3: "Học sinh chủ động khám phá các yếu tố trong môi trường lập trình, thử thay đổi và quan sát kết quả nhằm hiểu cách hệ thống vận hành." 
      },

      block2_tc1: { 
        M1: "Học sinh còn ngập ngừng khi diễn đạt ý tưởng; cần câu hỏi định hướng để trình bày mong muốn về hành động của nhân vật.", 
        M2: "Học sinh trình bày được mong muốn của mình khi có câu hỏi dẫn dắt; diễn đạt được hành động cơ bản mà nhân vật cần thực hiện trong chương trình.", 
        M3: "Học sinh chủ động chia sẻ ý tưởng, diễn đạt rõ ràng mục tiêu hoạt động của nhân vật và định hướng cho chương trình của mình." 
      },
      block2_tc2: { 
        M1: "Học sinh thường im lặng khi gặp khó khăn; cần nhắc nhở để chia sẻ vướng mắc và nhận hỗ trợ kịp thời.", 
        M2: "Học sinh đặt câu hỏi sau khi được khuyến khích; nhận diện được khó khăn và trao đổi với giáo viên để tiếp tục thực hiện nhiệm vụ.", 
        M3: "Học sinh chủ động trao đổi khi gặp trở ngại, diễn đạt thắc mắc cụ thể nhằm hiểu đúng thao tác và hoàn thành nhiệm vụ hiệu quả." 
      },
      block2_tc3: { 
        M1: "Học sinh đôi lúc mất tập trung khi giáo viên hướng dẫn; cần nhắc lại để nắm được các bước thao tác cơ bản.", 
        M2: "Học sinh theo dõi hướng dẫn và làm theo các bước khi được nhắc lại; hoàn thành thao tác kéo – ghép khối lệnh đúng yêu cầu của hoạt động.", 
        M3: "Học sinh chú ý quan sát hướng dẫn, ghi nhớ trình tự kéo – ghép khối lệnh và vận dụng chính xác trong dự án cá nhân." 
      },

      block3_tc1: { 
        M1: "Học sinh cần giáo viên chỉ dẫn để phân biệt khu vực nhân vật, sân khấu và bảng lệnh; đôi lúc còn nhầm lẫn vị trí.", 
        M2: "Học sinh xác định được các khu vực khi có định hướng; sử dụng đúng khu vực nhân vật, sân khấu và bảng lệnh trong quá trình làm bài.", 
        M3: "Học sinh nhận diện chính xác và sử dụng linh hoạt các khu vực làm việc, biết chuyển đổi giữa chúng trong khi xây dựng chương trình." 
      },
      block3_tc2: { 
        M1: "Học sinh chủ yếu làm theo từng bước; cần hỗ trợ để hiểu cách chuyển từ quan sát mẫu sang thực hành độc lập.", 
        M2: "Học sinh thực hiện được chương trình tương tự khi có ví dụ minh họa; biết áp dụng cấu trúc mẫu vào sản phẩm cá nhân theo hướng dẫn.", 
        M3: "Học sinh quan sát sản phẩm mẫu và chủ động xây dựng chương trình tương ứng, đồng thời thử điều chỉnh thêm theo ý tưởng riêng." 
      },
      block3_tc3: { 
        M1: "Học sinh còn giới hạn trong ví dụ có sẵn; cần gợi ý để mạnh dạn kết hợp nhiều khối lệnh khác nhau.", 
        M2: "Học sinh thử kết hợp thêm khối lệnh khi được gợi ý; tạo được một số hiệu ứng đơn giản dựa trên ý tưởng đã trao đổi với giáo viên.", 
        M3: "Học sinh linh hoạt kết hợp nhiều khối lệnh để tạo hành vi mới, thể hiện khả năng thử nghiệm và phát triển ý tưởng cá nhân." 
      },
      block3_tc4: { 
        M1: "Học sinh chưa hình thành thói quen chạy thử thường xuyên; cần nhắc để quan sát kết quả sau mỗi lần thay đổi.", 
        M2: "Học sinh kiểm tra chương trình khi được yêu cầu; nhận ra sự khác biệt giữa kết quả thực tế và mục tiêu, sau đó điều chỉnh theo hướng dẫn.", 
        M3: "Học sinh chủ động chạy thử, quan sát phản hồi của nhân vật và điều chỉnh khối lệnh nhằm cải thiện hiệu quả hoạt động của chương trình." 
      }
    },

    buoi2: {
      block1_tc1: { 
        M1: "Học sinh đang trong giai đoạn nhận diện vai trò từng khối lệnh; cần minh họa trực quan để hiểu cách lệnh tác động đến chuyển động và phản hồi của nhân vật.", 
        M2: "Học sinh bước đầu liên hệ được lệnh với hành vi khi được hướng dẫn; có thể giải thích đơn giản sự thay đổi của nhân vật sau khi thêm lệnh.",
        M3: "Học sinh hiểu rõ nguyên lý hoạt động, chủ động phân tích vì sao nhân vật thực hiện hành động cụ thể dựa trên cấu trúc chương trình đã xây dựng."
      },
      block1_tc2: { 
        M1: "Học sinh còn lúng túng khi tổ chức lệnh; đôi khi đặt sai vị trí khiến hoạt động của nhân vật thiếu liên kết hoặc chưa đạt mục tiêu đề ra.", 
        M2: "Học sinh bắt đầu xây dựng được trình tự cơ bản khi có hướng dẫn; chương trình hoạt động tương đối đúng nhưng vẫn cần điều chỉnh thêm.",
        M3: "Học sinh xây dựng chuỗi lệnh mạch lạc, biết cân nhắc thứ tự để đảm bảo hành động diễn ra hợp lý và đúng ý tưởng ban đầu."
      },
      block1_tc3: { 
        M1: "Học sinh cần quan sát ví dụ minh họa để nhận ra sự khác biệt giữa các cách sắp xếp lệnh; chưa chủ động thử thay đổi cấu trúc.", 
        M2: "Học sinh nhận biết được sự thay đổi kết quả khi có gợi mở; bắt đầu so sánh hai cách thực hiện khác nhau trong cùng một nhiệm vụ.",
        M3: "Học sinh chủ động điều chỉnh vị trí khối lệnh để kiểm chứng giả thuyết và tối ưu hành vi nhân vật theo mục tiêu lập trình."
      },

      block2_tc1: { 
        M1: "Học sinh thường làm theo một phương án quen thuộc; cần định hướng thêm để khám phá các cách giải quyết khác trong Scratch.", 
        M2: "Học sinh thử thêm phương án mới khi được gợi ý; bắt đầu nhận ra có nhiều con đường để hoàn thành một nhiệm vụ lập trình.",
        M3: "Học sinh linh hoạt lựa chọn nhiều cách tiếp cận, đánh giá hiệu quả từng phương án và điều chỉnh giải pháp phù hợp với ý tưởng cá nhân."
      },
      block2_tc2: { 
        M1: "Học sinh đôi khi chưa nhận ra sự khác biệt giữa kết quả mong muốn và thực tế; cần hỗ trợ để xác định chương trình đang gặp vấn đề ở đâu.", 
        M2: "Học sinh phát hiện được lỗi khi được hướng dẫn quan sát; bước đầu xác định vị trí khối lệnh gây ra hành vi chưa đúng.",
        M3: "Học sinh nhanh chóng nhận diện sai lệch, phân tích nguyên nhân và đề xuất hướng điều chỉnh phù hợp nhằm cải thiện chương trình."
      },
      block2_tc3: { 
        M1: "Học sinh chưa hình thành thói quen chạy thử thường xuyên; cần nhắc nhở để kiểm tra kết quả sau khi thay đổi khối lệnh.", 
        M2: "Học sinh thực hiện kiểm tra khi có yêu cầu; bắt đầu hiểu vai trò của việc quan sát kết quả sau mỗi lần điều chỉnh.",
        M3: "Học sinh duy trì thói quen kiểm tra liên tục, chủ động theo dõi tác động của từng thay đổi để đảm bảo chương trình ổn định."
      },
      block2_tc4: { 
        M1: "Học sinh vẫn có thể gặp lại lỗi cũ do chưa ghi nhớ cách sửa; cần nhắc lại để củng cố hiểu biết về nguyên nhân sai sót.", 
        M2: "Học sinh hạn chế mắc lại lỗi khi được nhắc; bắt đầu áp dụng kinh nghiệm sửa lỗi trong các hoạt động tiếp theo.",
        M3: "Học sinh rút kinh nghiệm hiệu quả, vận dụng kiến thức đã học để tránh lặp lại sai sót tương tự trong những dự án sau."
      },

      block3_tc1: { 
        M1: "Học sinh đôi lúc mất kiên nhẫn khi kết quả chưa như mong muốn; cần động viên để tiếp tục hoàn thiện chương trình.", 
        M2: "Học sinh tiếp tục thử lại khi được khích lệ; bước đầu duy trì nỗ lực để đạt mục tiêu lập trình đã đặt ra.",
        M3: "Học sinh thể hiện tinh thần bền bỉ, sẵn sàng điều chỉnh và thử nhiều lần cho đến khi chương trình hoạt động đúng ý tưởng."
      },
      block3_tc2: { 
        M1: "Học sinh có xu hướng dừng lại khi gặp khó khăn; cần giáo viên hỗ trợ định hướng để tiếp tục quá trình học tập và lập trình.", 
        M2: "Học sinh duy trì nhiệm vụ khi có sự khuyến khích; bước đầu vượt qua trở ngại và tiếp tục hoàn thiện sản phẩm cá nhân.",
        M3: "Học sinh chủ động tìm giải pháp thay thế, kiên trì hoàn thành nhiệm vụ ngay cả khi chương trình phát sinh lỗi phức tạp."
      },
      block3_tc3: { 
        M1: "Học sinh đôi khi căng thẳng khi chương trình chưa đúng; cần hướng dẫn để tập trung lại và thực hiện từng bước sửa lỗi.", 
        M2: "Học sinh giữ được sự bình tĩnh khi có nhắc nhở; bắt đầu tiếp cận việc sửa lỗi một cách có trình tự và rõ ràng hơn.",
        M3: "Học sinh xử lý tình huống một cách điềm tĩnh, phân tích nguyên nhân logic và lựa chọn phương án sửa lỗi phù hợp với mục tiêu."
      }
    },
    buoi3: {
      block1_tc1: { 
        M1: "Học sinh còn phụ thuộc vào gợi ý từ giáo viên hoặc bạn; đôi khi chưa chủ động chia sẻ suy nghĩ khi thảo luận ý tưởng chung.", 
        M2: "Học sinh tham gia trao đổi khi có định hướng; đóng góp ý kiến đơn giản và cùng nhóm lựa chọn phương án phù hợp với nhiệm vụ.",
        M3: "Học sinh chủ động đề xuất và lắng nghe ý tưởng, cùng nhóm thảo luận để thống nhất hướng phát triển sản phẩm một cách tích cực."
      },
      block1_tc2: { 
        M1: "Học sinh cần hỗ trợ để hiểu vai trò trong nhóm; đôi lúc chưa rõ trách nhiệm hoặc cần nhắc nhở khi thực hiện nhiệm vụ.", 
        M2: "Học sinh đảm nhận vai trò khi được phân công; thực hiện nhiệm vụ tương ứng với vị trí đã nhận trong hoạt động nhóm.",
        M3: "Học sinh chủ động nhận và điều chỉnh vai trò phù hợp, phối hợp linh hoạt với các thành viên để tối ưu hiệu quả làm việc nhóm."
      },
      block1_tc3: { 
        M1: "Học sinh còn làm việc rời rạc; cần hướng dẫn để chia sẻ tiến độ và kết nối phần việc với các thành viên khác.", 
        M2: "Học sinh phối hợp với bạn khi có kế hoạch rõ ràng; hoàn thành phần việc cá nhân theo yêu cầu của nhóm.",
        M3: "Học sinh chủ động hỗ trợ các thành viên, phối hợp nhịp nhàng để hoàn thiện sản phẩm chung đúng mục tiêu đề ra."
      },

      block2_tc1: { 
        M1: "Học sinh diễn đạt còn ngắn gọn hoặc chưa rõ ý; cần câu hỏi dẫn dắt để trình bày cách nhân vật hoạt động trong chương trình.", 
        M2: "Học sinh trao đổi được khi có định hướng; mô tả được hành động cơ bản của nhân vật trong quá trình làm việc nhóm.",
        M3: "Học sinh trình bày rõ ràng cơ chế hoạt động của nhân vật, giúp nhóm hiểu và thống nhất cách lập trình trong dự án."
      },
      block2_tc2: { 
        M1: "Học sinh cần hỗ trợ để mô tả chức năng khối lệnh; đôi khi chỉ làm theo mẫu mà chưa hiểu rõ ý nghĩa.", 
        M2: "Học sinh giải thích được khi có câu hỏi gợi mở; nêu được vai trò cơ bản của khối lệnh trong chương trình.",
        M3: "Học sinh chủ động giải thích mục đích sử dụng khối lệnh và cách chúng ảnh hưởng đến hành vi của nhân vật."
      },
      block2_tc3: { 
        M1: "Học sinh còn ngại trao đổi khi chưa hiểu; cần khuyến khích để đặt câu hỏi và làm rõ nhiệm vụ.", 
        M2: "Học sinh đặt câu hỏi khi được nhắc; chủ động hơn trong việc xác nhận yêu cầu trước khi thực hiện.",
        M3: "Học sinh thường xuyên trao đổi để hiểu đúng nhiệm vụ, đặt câu hỏi cụ thể nhằm đảm bảo chương trình được xây dựng chính xác."
      },
      block2_tc4: { 
        M1: "Học sinh đôi khi chưa chú ý đến góp ý; cần hướng dẫn để xem xét và điều chỉnh chương trình theo phản hồi từ nhóm.", 
        M2: "Học sinh tiếp nhận góp ý khi được nhắc; thực hiện thay đổi phù hợp sau khi thảo luận với các thành viên.",
        M3: "Học sinh lắng nghe tích cực, đánh giá góp ý và chủ động điều chỉnh chương trình nhằm nâng cao chất lượng sản phẩm chung."
      },

      block3_tc1: { 
        M1: "Học sinh đôi lúc còn e ngại hoặc chưa quen với phản hồi; cần hỗ trợ để tiếp nhận ý kiến một cách cởi mở.", 
        M2: "Học sinh phản hồi lịch sự khi được nhắc; tham gia trao đổi nhằm cải thiện chương trình theo góp ý từ nhóm.",
        M3: "Học sinh thể hiện thái độ tích cực trước phản hồi, chủ động trao đổi giải pháp và cùng nhóm hoàn thiện sản phẩm."
      },
      block3_tc2: { 
        M1: "Học sinh còn gắn bó với ý tưởng ban đầu; cần hỗ trợ để xem xét phương án khác phù hợp hơn với mục tiêu chung.", 
        M2: "Học sinh đồng ý điều chỉnh khi có giải thích rõ ràng; sẵn sàng thử phương án mới sau khi thảo luận với nhóm.",
        M3: "Học sinh linh hoạt thay đổi hướng tiếp cận khi cần thiết, ưu tiên hiệu quả chung của sản phẩm thay vì ý tưởng cá nhân."
      },
      block3_tc3: { 
        M1: "Học sinh đôi lúc tập trung vào quan điểm cá nhân; cần nhắc nhở để lắng nghe đầy đủ ý kiến của bạn trong nhóm.", 
        M2: "Học sinh lắng nghe khi được định hướng; phản hồi lịch sự và ghi nhận quan điểm của các thành viên khác.",
        M3: "Học sinh thể hiện thái độ tôn trọng, khuyến khích các bạn chia sẻ ý tưởng và xây dựng môi trường hợp tác tích cực."
      }
    },
    buoi4: {
      block1_tc1: { 
        M1: "Học sinh cần gợi ý để hình thành ý tưởng; nội dung còn đơn giản và thường dựa vào ví dụ có sẵn, chưa thể hiện rõ dấu ấn cá nhân trong chương trình.", 
        M2: "Học sinh đưa ra ý tưởng khi được định hướng; bước đầu biết điều chỉnh nội dung theo sở thích cá nhân và bắt đầu thể hiện góc nhìn riêng trong sản phẩm.",
        M3: "Học sinh chủ động đề xuất ý tưởng độc lập; nội dung rõ ràng, có định hướng phát triển và thể hiện phong cách cá nhân thông qua cách xây dựng nhân vật và hoạt động."
      },
      block1_tc2: { 
        M1: "Học sinh sử dụng từng khối lệnh riêng lẻ; cần hỗ trợ khi kết hợp nhiều chức năng để tạo hành vi phức tạp cho nhân vật.", 
        M2: "Học sinh kết hợp được nhiều khối lệnh quen thuộc khi có ví dụ tham khảo; bắt đầu hiểu cách liên kết lệnh nhằm tạo chuyển động hoặc tương tác.",
        M3: "Học sinh linh hoạt phối hợp nhiều nhóm lệnh khác nhau; biết xây dựng chuỗi hành động logic giúp chương trình hoạt động mạch lạc và hiệu quả."
      },
      block1_tc3: { 
        M1: "Học sinh thêm hiệu ứng khi có hướng dẫn trực tiếp; việc lựa chọn còn đơn giản và đôi lúc chưa phù hợp với nội dung chương trình.", 
        M2: "Học sinh chủ động bổ sung một số hiệu ứng chuyển động hoặc âm thanh khi được gợi mở; bắt đầu chú ý đến trải nghiệm người xem.",
        M3: "Học sinh sáng tạo nhiều hiệu ứng phù hợp; biết điều chỉnh chuyển động, âm thanh hoặc phản hồi nhằm tăng tính hấp dẫn và sinh động cho sản phẩm."
      },
      block1_tc4: { 
        M1: "Học sinh thực hiện theo mẫu là chính; việc sáng tạo còn hạn chế và cần hỗ trợ để biến ý tưởng thành hành động cụ thể.", 
        M2: "Học sinh thử áp dụng ý tưởng cá nhân vào một phần chương trình; biết thay đổi chi tiết nhỏ để phù hợp mong muốn của mình.",
        M3: "Học sinh tự xây dựng chương trình dựa trên ý tưởng riêng; biết điều chỉnh cấu trúc lệnh nhằm hiện thực hóa nội dung sáng tạo một cách rõ ràng."
      },

      block2_tc1: { 
        M1: "Học sinh chờ hướng dẫn từng bước trước khi thao tác; cần nhắc nhở để bắt đầu hoặc tiếp tục thực hiện chương trình.", 
        M2: "Học sinh triển khai chương trình khi có mục tiêu rõ ràng; biết tự thực hiện một số phần quen thuộc mà không cần hỗ trợ liên tục.",
        M3: "Học sinh tự lập kế hoạch xây dựng chương trình; chủ động thực hiện các bước cần thiết để hoàn thiện sản phẩm theo định hướng ban đầu."
      },
      block2_tc2: { 
        M1: "Học sinh cần giáo viên nhắc chạy thử và phát hiện lỗi; còn phụ thuộc vào hướng dẫn khi chỉnh sửa chương trình.", 
        M2: "Học sinh kiểm tra sản phẩm sau khi hoàn thành từng phần; biết điều chỉnh lỗi cơ bản khi được gợi ý hướng xử lý.",
        M3: "Học sinh thường xuyên chạy thử và tự đánh giá chương trình; chủ động phát hiện vấn đề và chỉnh sửa để cải thiện chất lượng sản phẩm."
      },
      block2_tc3: { 
        M1: "Học sinh cần chỉ dẫn chi tiết trong phần lớn hoạt động; đôi lúc gặp khó khăn khi làm việc độc lập.", 
        M2: "Học sinh tự thực hiện được các thao tác quen thuộc; chỉ cần hỗ trợ khi gặp nội dung mới hoặc tình huống phức tạp hơn.",
        M3: "Học sinh làm việc độc lập trong phần lớn thời gian; chủ động tìm hiểu và thử nghiệm trước khi nhờ đến sự hỗ trợ từ giáo viên."
      },

      block3_tc1: { 
        M1: "Học sinh mô tả chương trình còn rời rạc; cần câu hỏi gợi mở để trình bày được quá trình xây dựng và chức năng chính.", 
        M2: "Học sinh giải thích được các phần quen thuộc của chương trình; bước đầu trình bày được mục tiêu và cách hoạt động cơ bản.",
        M3: "Học sinh trình bày rõ ràng cấu trúc và chức năng chương trình; diễn đạt mạch lạc quá trình xây dựng và ý nghĩa từng phần."
      },
      block3_tc2: { 
        M1: "Học sinh nêu được hành động đơn lẻ của nhân vật; còn khó khăn khi giải thích mối liên hệ giữa các lệnh.", 
        M2: "Học sinh mô tả được chuỗi hành động cơ bản; hiểu sự liên kết giữa một số khối lệnh quen thuộc trong chương trình.",
        M3: "Học sinh trình bày rõ logic hoạt động; giải thích được cách các lệnh phối hợp để tạo nên hành vi hoàn chỉnh của nhân vật."
      },
      block3_tc3: { 
        M1: "Học sinh còn e dè khi trình bày; cần sự hỗ trợ hoặc câu hỏi định hướng để chia sẻ về sản phẩm của mình.", 
        M2: "Học sinh trình bày được nội dung chính khi có chuẩn bị; bắt đầu thể hiện sự tự tin khi giới thiệu quá trình thực hiện.",
        M3: "Học sinh giới thiệu sản phẩm rõ ràng, mạch lạc; thể hiện sự tự tin khi chia sẻ ý tưởng, cách xây dựng và định hướng phát triển tiếp theo."
      }
    }
  },

  GameMaker: {
    buoi1: { 
      block1_tc1: { 
        M1: "Học sinh đang trong giai đoạn làm quen môi trường phát triển game, cần thêm sự động viên và hướng dẫn trực tiếp từ giáo viên để tự tin tham gia các hoạt động thực hành trong lớp.", 
        M2: "Học sinh tham gia các hoạt động khi có sự hướng dẫn rõ ràng từ giáo viên, bước đầu hình thành sự tự tin trong việc sử dụng công cụ và làm quen với quy trình phát triển game.",
        M3: "Học sinh chủ động tham gia hoạt động, thể hiện sự hứng thú và sẵn sàng khám phá các chức năng trong môi trường GameMaker thông qua các nhiệm vụ thực hành được giao."
      },
      block1_tc2: { 
        M1: "Học sinh cần được gợi ý và định hướng để quan sát, tìm hiểu các thành phần cơ bản của trò chơi như nhân vật, bối cảnh và cơ chế hoạt động.", 
        M2: "Học sinh thể hiện sự quan tâm khi giáo viên đặt câu hỏi hoặc hướng dẫn, bắt đầu chú ý đến cấu trúc và cách vận hành của trò chơi trong quá trình học.",
        M3: "Học sinh chủ động đặt câu hỏi, tìm hiểu cách trò chơi vận hành và thể hiện sự tò mò tích cực đối với các thành phần cấu thành gameplay."
      },
      block1_tc3: { 
        M1: "Học sinh cần được hướng dẫn từng bước để nhận biết và sử dụng các tài nguyên có sẵn trong dự án mẫu như hình ảnh, đối tượng hoặc không gian game.", 
        M2: "Học sinh có thể khám phá tài nguyên khi có ví dụ minh họa hoặc hướng dẫn cụ thể, bắt đầu hiểu vai trò của từng thành phần trong sản phẩm.",
        M3: "Học sinh chủ động mở, thử nghiệm và quan sát các tài nguyên có sẵn nhằm hiểu rõ hơn cấu trúc dự án và cách xây dựng trò chơi."
      },

      block2_tc1: { 
        M1: "Học sinh còn e dè trong việc đặt câu hỏi khi chưa hiểu khái niệm mới, cần giáo viên nhắc nhở và tạo cơ hội để bày tỏ thắc mắc trong quá trình học.", 
        M2: "Học sinh đặt câu hỏi khi được khuyến khích, bước đầu hình thành thói quen trao đổi nhằm hiểu rõ hơn các khái niệm quan trọng trong GameMaker.",
        M3: "Học sinh chủ động đặt câu hỏi khi chưa hiểu Object, Event hoặc Room, thể hiện tinh thần học tập tích cực và mong muốn nắm chắc kiến thức nền tảng."
      },
      block2_tc2: { 
        M1: "Học sinh cần được nhắc nhở để tập trung lắng nghe hướng dẫn và theo dõi quy trình tạo tài nguyên game một cách đầy đủ và chính xác.", 
        M2: "Học sinh lắng nghe và thực hiện theo hướng dẫn khi giáo viên nhắc lại các bước, bước đầu hình thành sự tuân thủ quy trình làm việc.",
        M3: "Học sinh tập trung theo dõi hướng dẫn, ghi nhớ quy trình và thực hiện tương đối chính xác các bước tạo tài nguyên trong quá trình thực hành."
      },
      block2_tc3: { 
        M1: "Học sinh cần được gợi ý bằng câu hỏi hoặc ví dụ để diễn đạt ý tưởng trò chơi một cách rõ ràng và mạch lạc hơn.", 
        M2: "Học sinh có thể mô tả ý tưởng game khi được giáo viên đặt câu hỏi định hướng, bước đầu hình thành khả năng trình bày suy nghĩ cá nhân.",
        M3: "Học sinh tự tin trình bày ý tưởng trò chơi bằng lời nói, thể hiện khả năng diễn đạt và tư duy thiết kế sản phẩm ở mức phù hợp với độ tuổi."
      },

      block3_tc1: { 
        M1: "Học sinh cần hỗ trợ chi tiết từng bước khi tạo tài nguyên cơ bản, đặc biệt trong việc phân biệt vai trò của từng thành phần trong hệ thống.", 
        M2: "Học sinh tạo được tài nguyên khi có hướng dẫn trực tiếp, bước đầu hiểu quy trình xây dựng cấu trúc trò chơi cơ bản trong GameMaker.",
        M3: "Học sinh có thể tự tạo Sprite, Object và Room cơ bản, vận dụng được kiến thức đã học vào sản phẩm thực hành trong lớp."
      },
      block3_tc2: { 
        M1: "Học sinh đang trong giai đoạn làm quen khái niệm, cần ví dụ trực quan để hiểu mối liên hệ giữa các thành phần trong quá trình xây dựng gameplay.", 
        M2: "Học sinh bước đầu hiểu mối liên hệ khi được hướng dẫn trực quan và giải thích cụ thể thông qua sản phẩm mẫu hoặc hoạt động minh họa.",
        M3: "Học sinh hiểu và có thể vận dụng mối liên hệ giữa Sprite, Object, Room và gameplay vào sản phẩm game của mình."
      },
      block3_tc3: { 
        M1: "Học sinh cần gợi ý để thử thay đổi thông số và quan sát kết quả, bước đầu làm quen với việc điều chỉnh hành vi nhân vật trong game.", 
        M2: "Học sinh thử nghiệm thay đổi thông số khi có hướng dẫn cụ thể, nhận ra sự khác biệt trong hành vi nhân vật sau mỗi lần chỉnh sửa.",
        M3: "Học sinh chủ động điều chỉnh thông số nhằm đạt hiệu ứng mong muốn, thể hiện sự hiểu biết về cách thiết lập hành vi trong game."
      },
      block3_tc4: { 
        M1: "Học sinh cần được nhắc để chạy thử game và kiểm tra kết quả, bước đầu hình thành thói quen quan sát lỗi trong quá trình phát triển sản phẩm.", 
        M2: "Học sinh biết chỉnh sửa tài nguyên khi có hướng dẫn từ giáo viên, bắt đầu hiểu quy trình kiểm tra và cải tiến sản phẩm game.",
        M3: "Học sinh chủ động chạy thử, quan sát lỗi và điều chỉnh tài nguyên phù hợp nhằm hoàn thiện sản phẩm và nâng cao chất lượng gameplay."
      }
     },
    buoi2: { 
      block1_tc1: { 
        M1: "Học sinh đang làm quen khái niệm Event và hành vi của Object, cần ví dụ minh họa và hướng dẫn trực quan để hiểu rõ cách các sự kiện ảnh hưởng đến hoạt động trong game.", 
        M2: "Học sinh hiểu mối liên hệ khi được hướng dẫn cụ thể và có thể nhận biết vai trò của Event thông qua các hoạt động thực hành cơ bản.",
        M3: "Học sinh hiểu rõ mối liên hệ giữa Event và hành vi Object, biết vận dụng để thiết kế cơ chế hoạt động phù hợp trong sản phẩm game."
      },
      block1_tc2: { 
        M1: "Học sinh cần hỗ trợ để xây dựng trình tự hành động cho nhân vật, đặc biệt khi thiết lập nhiều bước liên tiếp trong quá trình tạo gameplay.", 
        M2: "Học sinh sắp xếp logic khi có gợi ý từ giáo viên, bước đầu hình thành tư duy tổ chức hành động theo trình tự rõ ràng.",
        M3: "Học sinh chủ động thiết kế trình tự hành động hợp lý, đảm bảo nhân vật hoạt động đúng mục tiêu và logic trong sản phẩm."
      },
      block1_tc3: { 
        M1: "Học sinh cần gợi ý để thử các cách thiết lập Event khác nhau và quan sát sự thay đổi trong hành vi hoặc cơ chế gameplay.", 
        M2: "Học sinh thử nghiệm các phương án khi có ví dụ minh họa, bước đầu hiểu rằng có nhiều cách để đạt cùng mục tiêu trong game.",
        M3: "Học sinh chủ động tìm nhiều cách thiết lập Event nhằm tối ưu cơ chế game và tạo trải nghiệm đa dạng cho người chơi."
      },

      block2_tc1: { 
        M1: "Học sinh cần giáo viên chỉ ra điểm chưa đúng trong hoạt động của nhân vật hoặc gameplay để hiểu vấn đề đang xảy ra.", 
        M2: "Học sinh nhận biết lỗi khi được hướng dẫn quan sát kết quả và so sánh với mục tiêu ban đầu của sản phẩm.",
        M3: "Học sinh chủ động phát hiện khi game hoạt động chưa đúng mong muốn và xác định được vị trí cần kiểm tra hoặc chỉnh sửa."
      },
      block2_tc2: { 
        M1: "Học sinh cần được nhắc để kiểm tra lại các thành phần sau khi chỉnh sửa nhằm đảm bảo hoạt động của game không bị ảnh hưởng.", 
        M2: "Học sinh kiểm tra khi có yêu cầu từ giáo viên, bước đầu hình thành thói quen rà soát sản phẩm sau mỗi lần thay đổi.",
        M3: "Học sinh chủ động kiểm tra Event, Room và Object sau chỉnh sửa để đảm bảo tính ổn định và logic của gameplay."
      },
      block2_tc3: { 
        M1: "Học sinh cần hướng dẫn để thực hiện các bước chỉnh sửa tài nguyên hoặc logic sau khi được chỉ ra lỗi trong game.", 
        M2: "Học sinh chỉnh sửa khi có gợi ý cụ thể từ giáo viên, bước đầu hiểu cách cải thiện sản phẩm thông qua việc sửa lỗi.",
        M3: "Học sinh chủ động điều chỉnh tài nguyên và logic nhằm khắc phục lỗi và nâng cao chất lượng trải nghiệm game."
      },
      block2_tc4: { 
        M1: "Học sinh vẫn cần nhắc lại để tránh lặp lại lỗi cũ, đặc biệt khi thao tác với các thiết lập quen thuộc trong quá trình làm game.", 
        M2: "Học sinh hạn chế lặp lại lỗi khi được nhắc nhở và có thể áp dụng lại hướng dẫn trong các tình huống tương tự.",
        M3: "Học sinh ghi nhớ kinh nghiệm sửa lỗi trước đó và chủ động tránh lặp lại, thể hiện sự tiến bộ trong quá trình học tập."
      },

      block3_tc1: { 
        M1: "Học sinh cần động viên để tiếp tục thử nghiệm khi cơ chế game chưa hoạt động đúng, đôi lúc còn nản khi gặp khó khăn.", 
        M2: "Học sinh thử lại khi được khuyến khích, bước đầu hình thành thái độ kiên trì trong quá trình xây dựng gameplay.",
        M3: "Học sinh chủ động thử nhiều lần và tìm hướng cải thiện khi cơ chế game chưa hoàn thiện, thể hiện tinh thần học tập tích cực."
      },
      block3_tc2: { 
        M1: "Học sinh cần hỗ trợ tinh thần khi gặp lỗi, đôi khi có xu hướng dừng lại nếu gặp khó khăn kéo dài trong quá trình thực hành.", 
        M2: "Học sinh tiếp tục thực hiện khi có sự động viên từ giáo viên hoặc bạn học, duy trì tiến độ hoàn thành nhiệm vụ.",
        M3: "Học sinh kiên trì vượt qua khó khăn, chủ động tìm giải pháp và tiếp tục phát triển sản phẩm ngay cả khi gặp lỗi phức tạp."
      },
      block3_tc3: { 
        M1: "Học sinh cần gợi ý để thử nghiệm ý tưởng mới, thường lựa chọn giải pháp quen thuộc trong quá trình phát triển sản phẩm.", 
        M2: "Học sinh thử nghiệm khi có định hướng rõ ràng từ giáo viên, bước đầu hình thành tư duy sáng tạo trong thiết kế gameplay.",
        M3: "Học sinh chủ động thử nghiệm ý tưởng mới, thể hiện tinh thần sáng tạo và sẵn sàng khám phá các cách tiếp cận khác nhau trong phát triển game."
      }
     },
    buoi3: {
      block1_tc1: { 
        M1: "Học sinh cần giáo viên hỗ trợ để trao đổi và thống nhất ý tưởng chung, đôi lúc còn giữ quan điểm cá nhân và chưa quen thảo luận để đi đến lựa chọn phù hợp cho nhóm.", 
        M2: "Học sinh tham gia trao đổi khi được gợi mở, biết lắng nghe và cùng bạn lựa chọn ý tưởng khi có định hướng rõ ràng từ giáo viên.",
        M3: "Học sinh chủ động thảo luận, đề xuất phương án và cùng nhóm thống nhất ý tưởng phù hợp với mục tiêu sản phẩm và khả năng thực hiện."
      },
      block1_tc2: { 
        M1: "Học sinh cần hướng dẫn để hiểu vai trò cá nhân và cách chia nhiệm vụ, đôi khi còn chờ chỉ định từ giáo viên trước khi bắt đầu công việc.", 
        M2: "Học sinh tham gia phân công khi có hỗ trợ, biết nhận nhiệm vụ và hoàn thành phần việc được giao trong nhóm.",
        M3: "Học sinh chủ động đề xuất phân công hợp lý dựa trên năng lực từng thành viên, góp phần giúp nhóm làm việc hiệu quả và rõ ràng hơn."
      },
      block1_tc3: { 
        M1: "Học sinh cần nhắc để phối hợp với bạn, đôi khi tập trung vào phần việc cá nhân mà chưa chú ý đến tiến độ chung của nhóm.", 
        M2: "Học sinh phối hợp khi được hướng dẫn, biết trao đổi với bạn để hoàn thành nhiệm vụ chung theo yêu cầu của hoạt động.",
        M3: "Học sinh chủ động phối hợp, hỗ trợ thành viên khác và cùng nhóm hoàn thành nhiệm vụ đúng tiến độ và mục tiêu đề ra."
      },

      block2_tc1: { 
        M1: "Học sinh cần gợi ý để trình bày ý kiến rõ ràng, đôi khi diễn đạt còn ngắn hoặc chưa đủ thông tin để nhóm hiểu đầy đủ nội dung.", 
        M2: "Học sinh trao đổi khi được hỏi hoặc được khuyến khích, bước đầu diễn đạt rõ ràng các ý tưởng và hoạt động đang thực hiện.",
        M3: "Học sinh chủ động thảo luận, trình bày rõ ràng quan điểm và tiến độ công việc, giúp nhóm phối hợp hiệu quả trong suốt buổi học."
      },
      block2_tc2: { 
        M1: "Học sinh cần hỗ trợ để diễn đạt lý do thực hiện thao tác hoặc lựa chọn giải pháp, đôi khi chỉ làm theo hướng dẫn mà chưa giải thích được.", 
        M2: "Học sinh giải thích khi có câu hỏi gợi mở, bước đầu trình bày được nguyên nhân và mục tiêu của thao tác trong sản phẩm.",
        M3: "Học sinh chủ động giải thích rõ ràng các hành động, thao tác và lựa chọn giải pháp khi làm game, thể hiện sự hiểu và tư duy logic."
      },
      block2_tc3: { 
        M1: "Học sinh còn ngại hỏi lại, thường chờ giáo viên kiểm tra trước khi tiếp tục khi gặp nội dung chưa rõ trong nhiệm vụ.", 
        M2: "Học sinh đặt câu hỏi khi được khuyến khích, bước đầu thể hiện mong muốn hiểu rõ yêu cầu để hoàn thành đúng hoạt động.",
        M3: "Học sinh chủ động hỏi lại khi chưa hiểu, đảm bảo nắm rõ yêu cầu trước khi thực hiện và hạn chế sai sót trong quá trình làm việc."
      },
      block2_tc4: { 
        M1: "Học sinh cần nhắc để lắng nghe trọn vẹn góp ý từ bạn và giáo viên, đôi khi còn giữ cách làm ban đầu dù đã có hướng dẫn điều chỉnh.", 
        M2: "Học sinh tiếp nhận góp ý khi được hướng dẫn, biết điều chỉnh sản phẩm theo các đề xuất cụ thể từ nhóm hoặc giáo viên.",
        M3: "Học sinh chủ động lắng nghe, phân tích góp ý và điều chỉnh sản phẩm phù hợp nhằm nâng cao chất lượng và hiệu quả hoạt động nhóm."
      },

      block3_tc1: { 
        M1: "Học sinh cần hỗ trợ để tiếp nhận góp ý với thái độ tích cực, đôi khi còn e ngại hoặc chưa quen với việc nhận phản hồi.", 
        M2: "Học sinh phản hồi khi được định hướng, biết tiếp nhận ý kiến đóng góp và trao đổi lại với nhóm để cải thiện sản phẩm.",
        M3: "Học sinh thể hiện thái độ tích cực, cảm ơn góp ý và chủ động trao đổi giải pháp nhằm cải thiện sản phẩm chung của nhóm."
      },
      block3_tc2: { 
        M1: "Học sinh cần hỗ trợ để chấp nhận thay đổi ý tưởng ban đầu, đôi lúc còn muốn giữ phương án cá nhân dù chưa phù hợp với nhóm.", 
        M2: "Học sinh đồng ý thay đổi khi có giải thích rõ ràng từ giáo viên hoặc nhóm về lợi ích của phương án mới.",
        M3: "Học sinh linh hoạt thay đổi ý tưởng khi cần, ưu tiên mục tiêu chung và hiệu quả sản phẩm thay vì quan điểm cá nhân."
      },
      block3_tc3: { 
        M1: "Học sinh cần nhắc để lắng nghe đầy đủ ý kiến từ bạn, đôi khi còn ngắt lời hoặc chưa phản hồi phù hợp trong thảo luận nhóm.", 
        M2: "Học sinh lắng nghe và phản hồi khi được hướng dẫn, bước đầu thể hiện sự tôn trọng quan điểm khác biệt trong nhóm.",
        M3: "Học sinh luôn lắng nghe tích cực, phản hồi lịch sự và tôn trọng ý kiến của mọi thành viên, góp phần xây dựng môi trường học tập tích cực."
      }
     },
    buoi4: { 
      block1_tc1: { 
        M1: "Học sinh cần gợi ý để hình thành ý tưởng gameplay, thường dựa trên ví dụ có sẵn và chưa quen phát triển cơ chế riêng cho sản phẩm.", 
        M2: "Học sinh đề xuất ý tưởng khi có định hướng, bước đầu hình thành cơ chế chơi đơn giản dựa trên kiến thức đã học.",
        M3: "Học sinh chủ động đề xuất gameplay hoặc cơ chế mới, thể hiện tư duy sáng tạo và khả năng áp dụng kiến thức vào sản phẩm cá nhân."
      },
      block1_tc2: { 
        M1: "Học sinh cần hướng dẫn khi kết hợp nhiều Event, đôi lúc còn thực hiện rời rạc và chưa hiểu rõ mối liên hệ giữa các hành vi.", 
        M2: "Học sinh kết hợp được các Event quen thuộc khi có ví dụ minh họa hoặc hướng dẫn cụ thể từ giáo viên.",
        M3: "Học sinh chủ động kết hợp nhiều Event và hành vi để xây dựng cơ chế gameplay mới phù hợp với mục tiêu thiết kế."
      },
      block1_tc3: { 
        M1: "Học sinh cần gợi ý để thêm hiệu ứng, thường chỉ sử dụng các thiết lập cơ bản và chưa chủ động làm game sinh động hơn.", 
        M2: "Học sinh thêm hiệu ứng khi có hướng dẫn, bước đầu hiểu vai trò của chuyển động, va chạm và âm thanh trong gameplay.",
        M3: "Học sinh chủ động bổ sung hiệu ứng phù hợp nhằm tăng trải nghiệm người chơi và nâng cao tính hấp dẫn của sản phẩm."
      },
      block1_tc4: { 
        M1: "Học sinh cần hỗ trợ khi thay đổi thiết kế game, đôi lúc còn phụ thuộc vào tài nguyên và cấu hình mặc định.", 
        M2: "Học sinh tùy chỉnh được một số yếu tố khi có hướng dẫn hoặc ví dụ minh họa từ giáo viên.",
        M3: "Học sinh chủ động tùy chỉnh nhân vật, bối cảnh và luật chơi theo ý tưởng cá nhân, tạo dấu ấn riêng cho sản phẩm."
      },

      block2_tc1: { 
        M1: "Học sinh cần hướng dẫn từng bước để triển khai gameplay, đôi khi chưa rõ cách biến ý tưởng thành cơ chế cụ thể trong game.", 
        M2: "Học sinh xây dựng gameplay khi có khung hướng dẫn, bước đầu chuyển hóa ý tưởng thành hành động trong sản phẩm.",
        M3: "Học sinh chủ động thiết kế và triển khai gameplay hoàn chỉnh dựa trên ý tưởng riêng, thể hiện khả năng tư duy thiết kế game."
      },
      block2_tc2: { 
        M1: "Học sinh cần nhắc để kiểm tra khi game hoạt động chưa đúng, thường chờ giáo viên hỗ trợ trước khi điều chỉnh.", 
        M2: "Học sinh chỉnh sửa khi có hướng dẫn, bước đầu biết rà soát Object và Event để tìm nguyên nhân lỗi.",
        M3: "Học sinh chủ động kiểm tra, phân tích và chỉnh sửa Object hoặc Event nhằm cải thiện hoạt động của game."
      },
      block2_tc3: { 
        M1: "Học sinh còn ngại thử phương án mới, thường dừng lại khi cách làm đầu tiên chưa đạt kết quả mong muốn.", 
        M2: "Học sinh thử phương án khác khi có gợi ý, bước đầu hiểu việc thử nghiệm giúp tối ưu cơ chế gameplay.",
        M3: "Học sinh chủ động thử nhiều giải pháp khác nhau, so sánh hiệu quả và lựa chọn phương án phù hợp nhất cho game."
      },

      block3_tc1: { 
        M1: "Học sinh cần câu hỏi gợi mở để trình bày cơ chế game, đôi khi mô tả chưa rõ trình tự hoạt động.", 
        M2: "Học sinh giải thích được khi có hướng dẫn, bước đầu mô tả được cách game vận hành.",
        M3: "Học sinh chủ động giải thích rõ ràng cơ chế hoạt động chính, thể hiện sự hiểu logic thiết kế gameplay."
      },
      block3_tc2: { 
        M1: "Học sinh cần hỗ trợ để nhận diện vai trò từng thành phần, đôi lúc còn nhầm lẫn chức năng giữa Object và Event.", 
        M2: "Học sinh mô tả được vai trò cơ bản khi có câu hỏi định hướng từ giáo viên.",
        M3: "Học sinh chủ động phân tích vai trò của Object và Event trong sản phẩm, thể hiện sự hiểu cấu trúc hệ thống game."
      },
      block3_tc3: { 
        M1: "Học sinh cần gợi ý để chia sẻ định hướng phát triển, thường chỉ mô tả những gì đã làm mà chưa nghĩ đến bước tiếp theo.", 
        M2: "Học sinh trình bày được ý tưởng mở rộng khi có câu hỏi định hướng từ giáo viên hoặc bạn học.",
        M3: "Học sinh chủ động đề xuất hướng phát triển, cải tiến gameplay hoặc nội dung mới cho sản phẩm trong tương lai."
      }
     }
  }
};

function applyAutoCommentByRadio(radioEl) {
  if (!radioEl) return;

  const groupName = radioEl.name; 
  const level = radioEl.value;    
  const subjectKey = subjectSelect.value;

  const firstUnderscoreIndex = groupName.indexOf("_");
  if (firstUnderscoreIndex === -1) return;

  const tabId = groupName.slice(0, firstUnderscoreIndex); 
  const cKey = groupName.slice(firstUnderscoreIndex + 1); 

  const noteName = `${tabId}_note_${cKey}`;
  const noteEl = document.querySelector(`textarea[name="${noteName}"]`);
  if (!noteEl) return;

  const autoText = AUTO_COMMENT_MAP?.[subjectKey]?.[tabId]?.[cKey]?.[level];

  if (typeof autoText !== "string") return;

  noteEl.value = autoText;
}


function bindAutoCommentEvents() {
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el) return;

    // chỉ bắt radio M1/M2/M3 của tiêu chí
    if (el.matches('input[type="radio"][name^="buoi"][value^="M"]')) {
      applyAutoCommentByRadio(el);
    }
  });
}

// Điều kiện xét level
function getSuggestedOrientationCourse(subjectKey, totalScore) {
  if (subjectKey === "Scratch") {
    return totalScore >= 32 ? "Scratch Advanced" : "Scratch Basic";
  }

  if (subjectKey === "GameMaker") {
    return totalScore >= 20 ? "GameMaker Basic" : "Trial Level thấp hơn";
  }

  return "Trial Level thấp hơn";
}

function updateOrientationCourseByScore(totalScore) {
  const selectEl = document.getElementById("orientationCourseSelect");
  if (!selectEl) return;

  // Nếu user đã chỉnh tay -> không tự đổi nữa
  // if (selectEl.dataset.userEdited === "true") return;

  const subjectKey = subjectSelect.value;
  const suggested = getSuggestedOrientationCourse(subjectKey, totalScore);

  selectEl.value = suggested;
}


function bindOrientationSelectEvents() {
  const selectEl = document.getElementById("orientationCourseSelect");
  if (!selectEl) return;

  // Nếu user đổi tay -> đánh dấu để không auto override nữa
  // selectEl.addEventListener("change", () => {
  //   selectEl.dataset.userEdited = "true";
  // });
}
