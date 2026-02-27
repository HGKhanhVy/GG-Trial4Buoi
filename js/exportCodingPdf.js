function waitForDetailData(iframe, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      try {
        const doc = iframe.contentDocument;
        const table = doc.querySelector("table");

        if (table && table.rows.length > 1) {
          resolve();
          return;
        }

        if (Date.now() - start > timeout) {
          reject("Timeout load detail data");
          return;
        }

        requestAnimationFrame(check);
      } catch (err) {
        reject(err);
      }
    };

    check();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const exportBtn = document.getElementById("exportPdfBtn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", async function () {
    await exportCodingPdf();
  });
});

async function exportCodingPdf() {
  const { jsPDF } = window.jspdf;

  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) loadingOverlay.style.display = "flex";

  try {
    const pdf = new jsPDF("p", "mm", "a4");

    await exportCodingPage(pdf);
    await exportDetailPage(pdf);

    const studentName = document.getElementById("hoTen")?.value?.trim() || "Hoc_Sinh";

    const dateInput = document.querySelector('input[type="date"]');
    let formattedDate = "Ngay";

    if (dateInput && dateInput.value) {
      const [year, month, day] = dateInput.value.split("-");
      formattedDate = `${day}/${month}/${year}`;
    }

    const safeStudentName = studentName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, "");

    const fileName = `${safeStudentName}_${formattedDate}.pdf`;

    pdf.save(fileName);
  } catch (err) {
    console.error(err);
    alert("Lỗi khi xuất PDF. Kiểm tra console.");
  } finally {
    if (loadingOverlay) loadingOverlay.style.display = "none";
  }
}

async function exportCodingPage(pdf) {
  // ===== LƯU TAB ĐANG ACTIVE =====
  const currentActiveBtn = document.querySelector(".session-tabs button.active");

  // ===== CLICK TAB TỔNG KẾT =====
  const summaryBtn = document.querySelector('.session-tabs button[data-tab="tongket"]');

  if (summaryBtn) {
    summaryBtn.click();
  }

  // ===== ĐỢI CHART RENDER =====
  await new Promise(r => setTimeout(r, 300));

  const formEl = document.getElementById("codingK12Form");
  if (!formEl) return;

  // Clone DOM
  const clone = formEl.cloneNode(true);

  // ===== CAPTURE TOÀN BỘ CHART WRAPPER (giữ legend + spacing) =====
  const originalChart = document.getElementById("summaryChart");

  if (originalChart) {

    const originalWrapper = originalChart.parentNode;

    const chartCanvas = await html2canvas(originalWrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const chartImageData = chartCanvas.toDataURL("image/jpeg", 0.95);

    const clonedChart = clone.querySelector("#summaryChart");

    if (clonedChart) {

      const clonedWrapper = clonedChart.parentNode;

      const img = document.createElement("img");
      img.src = chartImageData;
      img.style.width = "100%";
      img.style.display = "block";

      clonedWrapper.parentNode.replaceChild(img, clonedWrapper);
    }
  }

  const originalSelect = document.getElementById("monTraiNghiem");
  const clonedSelect = clone.querySelector("#monTraiNghiem");

  if (originalSelect && clonedSelect) {
    clonedSelect.value = originalSelect.value;
  }

  clone.querySelectorAll(".session-tabs").forEach(el => el.remove());
  const allTabs = clone.querySelectorAll(".tab-content");

  allTabs.forEach(tab => {
    if (tab.id !== "tongket") {
      tab.remove();
    }
  });

  const summaryTab = clone.querySelector("#tongket");

  if (summaryTab) {
    summaryTab.style.display = "block";
    summaryTab.classList.add("active");
  }

  clone.querySelectorAll(".actions").forEach(el => el.remove());
  clone.querySelectorAll(".pdf-hide").forEach(el => {
    el.style.display = "none";
  });

  clone.style.width = "800px";
  clone.style.background = "#ffffff";

  document.body.appendChild(clone);

  // TEXTAREA 
  clone.querySelectorAll("textarea").forEach(textarea => {
    const div = document.createElement("div");
    div.style.whiteSpace = "pre-wrap";
    div.style.wordBreak = "break-word";
    div.style.border = "1px solid #ccc";
    div.style.padding = "8px";
    div.style.minHeight = textarea.offsetHeight + "px";
    div.style.fontFamily = getComputedStyle(textarea).fontFamily;
    div.style.fontSize = getComputedStyle(textarea).fontSize;
    div.style.lineHeight = getComputedStyle(textarea).lineHeight;

    div.textContent = textarea.value;

    textarea.parentNode.replaceChild(div, textarea);
  });

  // INPUT DATE
  clone.querySelectorAll('input[type="date"]').forEach(input => {

    if (!input.value) return;

    const [year, month, day] = input.value.split("-");

    const formatted = `${day}-${month}-${year}`;

    const div = document.createElement("div");
    div.textContent = formatted;

    div.style.padding = "4px 0";
    div.style.minHeight = input.offsetHeight + "px";
    div.style.fontFamily = getComputedStyle(input).fontFamily;
    div.style.fontSize = getComputedStyle(input).fontSize;

    input.parentNode.replaceChild(div, input);
  });

  // RENDER
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  let y = margin;

  // ===== RENDER HEADER =====
  const header = clone.querySelector(".pdf-header, .form-header, .header");

  if (header) {
    const canvas = await html2canvas(header, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight);

    y += imgHeight + 8;
  }

  // Lấy các section chính
  const sections = [
    clone.querySelector('#studentInfoSection'),
    clone.querySelector('#tongket .section-title'),
    clone.querySelector('.summary-chart-wrap'),
    clone.querySelector('#commentSection')
  ].filter(Boolean);

  for (let section of sections) {

    if (!section.offsetHeight || section.offsetHeight < 5) continue;

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) continue;

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (!imgHeight || isNaN(imgHeight)) continue;

    const imgData = canvas.toDataURL("image/jpeg", 0.95); 

    if (y + imgHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight);

    y += imgHeight + 5;
  }

  if (currentActiveBtn) {
    currentActiveBtn.click();
  }
  clone.remove();
}

const subject = document.getElementById("monTraiNghiem").value;
// ======== TRANG CHI TIẾT ========
async function exportDetailPage(pdf) {
  const subject = document.getElementById("monTraiNghiem").value;

  let detailUrl = "";

  if (subject === "Scratch") {
    detailUrl = "./detailScratch.html";
  } else if (subject === "GameMaker") {
    detailUrl = "./detailGameMaker.html";
  } else {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const classId = params.get("classId");
  const studentId = params.get("studentId");

  if (!classId || !studentId) {
    alert("Thiếu classId hoặc studentId.");
    return;
  }

  detailUrl += `?classId=${classId}&studentId=${studentId}`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.width = "1200px";
  iframe.style.height = "2000px";
  iframe.src = detailUrl;

  document.body.appendChild(iframe);

  await new Promise(resolve => {
    iframe.onload = resolve;
  });

  await waitForDetailReady(iframe);

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  const doc = iframe.contentDocument;

  const header = doc.querySelector(".header");
  const topSection = doc.querySelector(".top-section");
  const sessions = doc.querySelectorAll(".session-block");

  for (let i = 0; i < sessions.length; i++) {

    pdf.addPage("a4", "l");

    let y = margin;
    const contentWidth = pageWidth - margin * 2;

    // ===== HEADER =====
    const headerCanvas = await html2canvas(header, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;

    pdf.addImage(
      headerCanvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      margin,
      y,
      contentWidth,
      headerHeight
    );

    y += headerHeight - 4;

    // ===== INFO =====
    const infoCanvas = await html2canvas(topSection, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const infoHeight = (infoCanvas.height * contentWidth) / infoCanvas.width;

    pdf.addImage(
      infoCanvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      margin,
      y,
      contentWidth,
      infoHeight
    );

    y += infoHeight - 2;

    // ===== SESSION =====
    const sessionCanvas = await html2canvas(sessions[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const baseCanvas = await html2canvas(header, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const baseWidth = baseCanvas.width;   
    const sessionRatio = (pageWidth - margin * 2) / baseWidth;

    const finalWidth = sessionCanvas.width * sessionRatio;
    const finalHeight = sessionCanvas.height * sessionRatio;

    pdf.addImage(
      sessionCanvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      margin,
      y,
      finalWidth,
      finalHeight
    );
  }
}

function waitForDetailReady(iframe, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      try {
        if (iframe.contentWindow.detailDataLoaded === true) {
          resolve();
          return;
        }

        if (Date.now() - start > timeout) {
          reject("Timeout đợi Firebase load");
          return;
        }

        requestAnimationFrame(check);
      } catch (err) {
        reject(err);
      }
    };

    check();
  });
}

