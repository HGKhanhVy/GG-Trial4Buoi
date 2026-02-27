const M_MAP = { M1: 0.25, M2: 0.5, M3: 1.0 };

const SUMMARY_LABELS = [
  "Thái độ học tập",
  "Năng lực lập trình",
  "Khả năng hợp tác",
  "Sáng tạo & Trình bày",
];

const EXPECTED_PLUS = 0.75;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getCheckedValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
}

function calcTotalForSession(prefix) {
  const radios = document.querySelectorAll(
    `input[type="radio"][name^="${prefix}"]`
  );

  const criteriaNames = new Set();
  radios.forEach((r) => criteriaNames.add(r.name));

  let sum = 0;
  criteriaNames.forEach((name) => {
    const v = getCheckedValue(name);
    if (!v) return;
    sum += M_MAP[v] || 0;
  });

  return sum;
}

function countLevelsForSession(prefix) {
    const radios = document.querySelectorAll(
        `input[type="radio"][name^="${prefix}"]`
    );

    const criteriaNames = new Set();
    radios.forEach((r) => criteriaNames.add(r.name));

    let nM1 = 0;
    let nM2 = 0;

    criteriaNames.forEach((name) => {
        const v = getCheckedValue(name);
        if (v === "M1") nM1++;
        if (v === "M2") nM2++;
    });

    return { nM1, nM2 };
}

function buildSummaryData() {
    const subject =
    document.getElementById("monTraiNghiem")?.value || "Scratch";

    const k = subject === "Scratch" ? 0.6 : 0.5;
    const f = subject === "Scratch" ? 0.8 : 0.7;

    const prefixes = ["buoi1_", "buoi2_", "buoi3_", "buoi4_"];

    const current = prefixes.map((prefix) =>
        calcTotalForSession(prefix)
    );

    const expected = prefixes.map((prefix, index) => {

        const CurrentScore = current[index];

        const { nM1, nM2 } = countLevelsForSession(prefix);
        const PGI = (nM1 * 1.0 + nM2 * 0.6) / 10;

        const GrowthSpace = 10 - CurrentScore;

        const CoreGrowth = GrowthSpace * PGI * k;

        const FloorGrowth = f * (CurrentScore / 10);

        let TargetScore = CurrentScore + CoreGrowth + FloorGrowth;
        TargetScore = clamp(TargetScore, 0, 10);
        TargetScore = Math.round(TargetScore * 1000) / 1000;

        return TargetScore;
    });

    return { current, expected };
}

let summaryChart = null;

function renderSummaryChart() {
    const canvas = document.getElementById("summaryChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { current, expected } = buildSummaryData();

    if (summaryChart) summaryChart.destroy();

    // Gradient xéo theo đúng kích thước canvas
    const gradCurrent = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradCurrent.addColorStop(0, "#3c6294");
    gradCurrent.addColorStop(0.42, "#3c6294");
    gradCurrent.addColorStop(0.43, "#2e4f7c");
    gradCurrent.addColorStop(1, "#2e4f7c");

    const gradExpected = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradExpected.addColorStop(0, "#c5e0f0");
    gradExpected.addColorStop(0.42, "#c5e0f0");
    gradExpected.addColorStop(0.43, "#a9d0e7");
    gradExpected.addColorStop(1, "#a9d0e7");

    const splitDiagonalFillPlugin = {
        id: "splitDiagonalFillPlugin",
        afterDatasetsDraw(chart) {
            const { ctx } = chart;

            chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta || meta.hidden) return;

            meta.data.forEach((bar) => {
                const p = bar.getProps(["x", "y", "base", "width"], true);

                const left = p.x - p.width / 2;
                const right = p.x + p.width / 2;
                const top = p.y;
                const bottom = p.base;
                if (bottom <= top) return;

                const h = bottom - top;

                const baseColor = datasetIndex === 0 ? "#2e4f7c" : "#a9d0e7";
                const highlightColor = datasetIndex === 0 ? "#3c6294" : "#c5e0f0";

                // ===== 35% trên là bóng =====
                const splitY = top + h * 0.35;

                // độ xéo của đường chia (càng lớn càng xéo)
                const skew = p.width * 0.25;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(left, top, p.width, h, 8);
                ctx.clip();

                // ===== vẽ phần dưới (50%) màu gốc =====
                ctx.fillStyle = baseColor;
                ctx.fillRect(left, top, p.width, h, 8);

                // ===== vẽ phần trên (50%) màu bóng, đường chia xéo =====
                ctx.fillStyle = highlightColor;
                ctx.beginPath();
                ctx.moveTo(left, top);
                ctx.lineTo(right, top);
                ctx.lineTo(right, splitY - skew);  // xéo lên
                ctx.lineTo(left, splitY);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            });
            });
        }
    };

    summaryChart = new Chart(ctx, {
        type: "bar",
        data: {
        labels: SUMMARY_LABELS,
        datasets: [
            {
                label: "Năng lực hiện tại",
                data: current,
                backgroundColor: "#2e4f7c",  
                borderColor: "#2e4f7c",
                borderWidth: 2,
                borderRadius: 10
            },
            {
                label: "Năng lực đầu ra dự kiến",
                data: expected,
                backgroundColor: "#a9d0e7",   
                borderColor: "#a9d0e7",
                borderWidth: 2,
                borderRadius: 10
            }
        ]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
            position: "bottom",
            labels: {
                padding: 30,
                boxWidth: 15,
                boxHeight: 15
            }
            },
            tooltip: {
            callbacks: {
                label: (context) =>
                `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`
            }
            }
        },

        scales: {
            x: {
            ticks: {
                maxRotation: 0,
                minRotation: 0,
                autoSkip: false
            }
            },
            y: {
            min: 0,
            max: 10,
            ticks: {
                stepSize: 2.5,
                callback: function (value) {
                const map = {
                    0: "",
                    2.5: "Chưa thể hiện rõ",
                    5: "Đang hình thành",
                    7.5: "Thể hiện ổn định",
                    10: "Nổi bật"
                };
                const rounded = Math.round(value * 10) / 10;
                return map[rounded] ?? "";
                }
            }
            }
        }
        },
        plugins: [splitDiagonalFillPlugin],
    });
    }

    document.addEventListener("DOMContentLoaded", () => {
    renderSummaryChart();

    document.addEventListener("change", (e) => {
        if (e.target && e.target.matches('input[type="radio"]')) {
        renderSummaryChart();
        }
    });
});