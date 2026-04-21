(function () {
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"']/g, function (ch) {
      if (ch === "&") return "&amp;";
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
      if (ch === "\"") return "&quot;";
      return "&#39;";
    });
  }

  function readReports() {
    try {
      var raw = localStorage.getItem("userReports");
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(function (report) {
        var entry = report && typeof report === "object" ? report : {};
        var reporterObj = entry.reporter && typeof entry.reporter === "object" ? entry.reporter : {};
        return {
          id: entry.id || entry.object_id || "",
          name: entry.name || entry.object_name || "Objet non precise",
          type: entry.type || entry.problem_type || "Non specifie",
          description: entry.description || "Description non fournie",
          reportedAt: entry.reportedAt || entry.created_at || "",
          status: entry.status || "En attente",
          reporterName: entry.reporterName || entry.reported_by_name || entry.user_name || entry.display_name || entry.author_name || reporterObj.name || "",
          reporterEmail: entry.reporterEmail || entry.reported_by_email || entry.user_email || entry.email || entry.author_email || reporterObj.email || "",
          reporterId: entry.reporterId || entry.user_id || entry.reported_by_id || entry.author_id || reporterObj.id || "",
          adminResponse: entry.adminResponse || entry.response || "",
          reviewedAt: entry.reviewedAt || "",
          reviewedBy: entry.reviewedBy || "admin"
        };
      });
    } catch (error) {
      return [];
    }
  }

  function writeReports(reports) {
    localStorage.setItem("userReports", JSON.stringify(reports));
  }

  function getStatusBadgeStyle(status) {
    var s = String(status || "").toLowerCase();
    if (s.indexOf("accept") >= 0 || s.indexOf("resolu") >= 0 || s.indexOf("trait") >= 0) {
      return "background:#dcfce7;color:#166534;";
    }
    if (s.indexOf("refus") >= 0 || s.indexOf("rej") >= 0) {
      return "background:#fee2e2;color:#b91c1c;";
    }
    return "background:#e2e8f0;color:#334155;";
  }

  function formatDateTime(dateValue) {
    var raw = String(dateValue || "").trim();
    if (!raw) return "-";
    var d = new Date(raw);
    if (Number.isNaN(d.getTime())) return escapeHtml(raw);
    return escapeHtml(d.toLocaleString("fr-FR"));
  }

  function formatDateOnly(dateValue) {
    var raw = String(dateValue || "").trim();
    if (!raw) return "-";
    var d = new Date(raw);
    if (Number.isNaN(d.getTime())) return escapeHtml(raw);
    return escapeHtml(d.toLocaleDateString("fr-FR"));
  }

  function buildReporterLabel(report) {
    var name = String(report && report.reporterName ? report.reporterName : "").trim();
    var email = String(report && report.reporterEmail ? report.reporterEmail : "").trim();
    var uid = String(report && report.reporterId ? report.reporterId : "").trim();

    if (name && email) return escapeHtml(name + " (" + email + ")");
    if (email) return escapeHtml(email);
    if (name) return escapeHtml(name);
    if (uid) return "ID: " + escapeHtml(uid);
    return "Non renseigne";
  }

  function buildObjectLabel(report) {
    var name = String(report && report.name ? report.name : "").trim();
    var id = String(report && report.id ? report.id : "").trim();
    if (name) return escapeHtml(name);
    if (id) return "ID: " + escapeHtml(id);
    return "Objet non precise";
  }

  function renderReportsTableHtml() {
    var reports = readReports();
    if (!reports.length) {
      return "<div class='p-2'><p style='margin:0;color:#475569;font-weight:600;'>Aucun signalement pour le moment.</p></div>";
    }

    var rows = reports.map(function (report, idx) {
      var objectLabel = buildObjectLabel(report);
      var problemType = escapeHtml(report && report.type ? report.type : "Non specifie");
      var status = escapeHtml(report && report.status ? report.status : "En attente");

      return "" +
        "<tr style='border-bottom:1px solid #e2e8f0;'>" +
          "<td style='padding:10px;color:#0f172a;font-weight:600;max-width:280px;'>" + buildReporterLabel(report) + "</td>" +
          "<td style='padding:10px;color:#0f172a;font-weight:700;'>" + objectLabel + "</td>" +
          "<td style='padding:10px;color:#475569;'>" + problemType + "</td>" +
          "<td style='padding:10px;'><span style='display:inline-block;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700;" + getStatusBadgeStyle(status) + "'>" + status + "</span></td>" +
          "<td style='padding:10px;color:#64748b;white-space:nowrap;'>" + formatDateOnly(report && report.reportedAt) + "</td>" +
          "<td style='padding:10px;'>" +
            "<div style='display:flex;gap:6px;flex-wrap:wrap;'>" +
              "<button type='button' onclick='window.adminOpenReportDetails(" + idx + ")' style='background:#0f172a;color:#fff;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;'>Details</button>" +
            "</div>" +
          "</td>" +
        "</tr>";
    }).join("");

    return "" +
      "<div class='p-2'>" +
        "<p style='margin:0 0 10px 0;color:#334155;font-weight:700;'>Demandes de signalement utilisateur</p>" +
        "<div style='overflow-x:auto;'>" +
          "<table style='width:100%;border-collapse:collapse;'>" +
            "<thead>" +
              "<tr style='border-bottom:1px solid #cbd5e1;'>" +
                "<th style='text-align:left;padding:10px;font-size:12px;color:#64748b;text-transform:uppercase;'>Auteur</th>" +
                "<th style='text-align:left;padding:10px;font-size:12px;color:#64748b;text-transform:uppercase;'>Objet concerne</th>" +
                "<th style='text-align:left;padding:10px;font-size:12px;color:#64748b;text-transform:uppercase;'>Type signalement</th>" +
                "<th style='text-align:left;padding:10px;font-size:12px;color:#64748b;text-transform:uppercase;'>Etat</th>" +
                "<th style='text-align:left;padding:10px;font-size:12px;color:#64748b;text-transform:uppercase;'>Date</th>" +
                "<th style='text-align:left;padding:10px;font-size:12px;color:#64748b;text-transform:uppercase;'>Action</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" + rows + "</tbody>" +
          "</table>" +
        "</div>" +
      "</div>";
  }

  function renderReportDetailHtml(index) {
    var reports = readReports();
    var idx = Number(index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= reports.length) {
      return "<div class='p-2'><p style='margin:0;color:#b91c1c;font-weight:700;'>Signalement introuvable.</p></div>";
    }

    var report = reports[idx];
    var status = escapeHtml(report.status || "En attente");
    var description = escapeHtml(report.description || "Description non fournie");
    var adminResponse = escapeHtml(report.adminResponse || "");
    var statusStyle = getStatusBadgeStyle(status);

    return "" +
      "<div class='p-2'>" +
        "<h4 style='margin:0 0 12px 0;color:#0f172a;font-size:20px;'>Detail signalement</h4>" +
        "<div style='display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px 0;'>" +
          "<span style='font-size:12px;color:#64748b;font-weight:700;'>Date et heure:</span>" +
          "<span style='font-size:13px;color:#0f172a;font-weight:700;'>" + formatDateTime(report.reportedAt) + "</span>" +
          "<span style='font-size:12px;color:#64748b;font-weight:700;margin-left:8px;'>Etat:</span>" +
          "<span style='display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;" + statusStyle + "'>" + status + "</span>" +
        "</div>" +
        "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:12px;'>" +
          "<div style='background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;'><div style='font-size:12px;color:#64748b;font-weight:700;margin-bottom:4px;'>Auteur</div><div style='font-size:14px;color:#0f172a;font-weight:700;'>" + buildReporterLabel(report) + "</div></div>" +
          "<div style='background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;'><div style='font-size:12px;color:#64748b;font-weight:700;margin-bottom:4px;'>Objet concerne</div><div style='font-size:14px;color:#0f172a;font-weight:700;'>" + buildObjectLabel(report) + "</div></div>" +
          "<div style='background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;'><div style='font-size:12px;color:#64748b;font-weight:700;margin-bottom:4px;'>Type signalement</div><div style='font-size:14px;color:#0f172a;font-weight:700;'>" + escapeHtml(report.type || "Non specifie") + "</div></div>" +
        "</div>" +
        "<div style='background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-bottom:10px;'>" +
          "<div style='font-size:12px;color:#64748b;font-weight:700;margin-bottom:6px;'>Description</div>" +
          "<div style='font-size:13px;color:#334155;line-height:1.45;white-space:pre-wrap;max-height:140px;overflow:auto;'>" + description + "</div>" +
        "</div>" +
        "<div style='background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-bottom:12px;'>" +
          "<label for='adminReportResponseInput' style='display:block;font-size:12px;color:#64748b;font-weight:700;margin-bottom:6px;'>Reponse admin</label>" +
          "<textarea id='adminReportResponseInput' rows='4' style='width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font-size:13px;resize:vertical;'>" + adminResponse + "</textarea>" +
        "</div>" +
        "<div style='display:flex;gap:8px;flex-wrap:wrap;'>" +
          "<button type='button' onclick='window.adminReviewReport(" + idx + ", \"Accepte\", true)' style='background:#dcfce7;color:#166534;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;'>Accepter</button>" +
          "<button type='button' onclick='window.adminReviewReport(" + idx + ", \"Refuse\", true)' style='background:#fee2e2;color:#b91c1c;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;'>Refuser</button>" +
          "<button type='button' onclick='window.adminSaveReportResponse(" + idx + ")' style='background:#0f766e;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;'>Enregistrer reponse</button>" +
          "<button type='button' onclick='window.adminOpenReportsList()' style='background:#e2e8f0;color:#0f172a;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;'>Retour liste</button>" +
        "</div>" +
      "</div>";
  }

  function openReportsOverlay(title, html) {
    var overlayTitleText = title || "Signalements";
    var overlayHtml = html || renderReportsTableHtml();

    if (typeof window.openOverlay === "function") {
      window.openOverlay(overlayTitleText, overlayHtml);
      return;
    }

    var infoOverlay = document.getElementById("infoOverlay");
    var overlayTitle = document.getElementById("overlayTitle");
    var overlayBody = document.getElementById("overlayBody");
    if (!infoOverlay || !overlayTitle || !overlayBody) return;

    overlayTitle.textContent = overlayTitleText;
    overlayBody.innerHTML = overlayHtml;
    infoOverlay.hidden = false;
    infoOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  window.adminOpenReportsList = function () {
    openReportsOverlay("Signalements", renderReportsTableHtml());
  };

  window.adminOpenReportDetails = function (index) {
    openReportsOverlay("Detail signalement", renderReportDetailHtml(index));
  };

  window.adminSaveReportResponse = function (index) {
    var reports = readReports();
    var idx = Number(index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= reports.length) return;

    var responseInput = document.getElementById("adminReportResponseInput");
    var responseText = responseInput ? String(responseInput.value || "").trim() : "";
    reports[idx].adminResponse = responseText;
    reports[idx].reviewedAt = new Date().toISOString();
    reports[idx].reviewedBy = "admin";
    writeReports(reports);
    openReportsOverlay("Detail signalement", renderReportDetailHtml(idx));
  };

  window.adminReviewReport = function (index, decision, stayOnDetail) {
    var reports = readReports();
    var idx = Number(index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= reports.length) return;

    reports[idx].status = decision;
    reports[idx].reviewedAt = new Date().toISOString();
    reports[idx].reviewedBy = "admin";
    writeReports(reports);

    if (stayOnDetail) {
      openReportsOverlay("Detail signalement", renderReportDetailHtml(idx));
      return;
    }
    openReportsOverlay("Signalements", renderReportsTableHtml());
  };

  var trigger = document.getElementById("openAdminReportsOverlay");
  if (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      openReportsOverlay("Signalements", renderReportsTableHtml());
    });
  }
})();
