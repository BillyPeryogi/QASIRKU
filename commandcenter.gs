function setupKukamiCommandCenterV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. SETUP SHEET PENGATURAN (CMD_CONTROL)
  // Kita pakai nama CMD_CONTROL agar tidak menabrak data Finansial Bos
  let cmdSheet = ss.getSheetByName("CMD_CONTROL");
  if (!cmdSheet) {
    cmdSheet = ss.insertSheet("CMD_CONTROL");
    const headers = [
      ["ID_CONFIG", "STATUS_NILAI", "PARAMETER_PESAN", "KETERANGAN", "BERAKHIR_PADA"],
      ["BROADCAST_LIVE", "NON-AKTIF", "🚨 Isi pesan siaran di sini...", "Pesan incidental/info jalan", ""],
      ["TARGET_GROWTH_PCT", "10", "", "Kenaikan target harian (%)", ""],
      ["REWARD_OFFLINE_TOP10", "15000", "", "Bonus saldo TOP 10 Offline", ""]
    ];
    cmdSheet.getRange(1, 1, headers.length, headers[0].length).setValues(headers);
    cmdSheet.getRange("A1:E1").setBackground("#800000").setFontColor("#FFD700").setFontWeight("bold");
    
    // Auto-resize kolom agar rapi
    cmdSheet.autoResizeColumns(1, 5);
  }

  // 2. SETUP SHEET RAPOR (RAPOR_RIDER)
  let raporSheet = ss.getSheetByName("RAPOR_RIDER");
  if (!raporSheet) {
    raporSheet = ss.insertSheet("RAPOR_RIDER");
    const headers = [
      ["ID_RIDER", "NAMA_RIDER", "BEST_DAY_90H", "TARGET_H", "TARGET_B", "SALDO_HEALTH", "ENDURANCE", "FOCUS_SCORE", "RANK_OFFLINE", "INSIGHT_MSG"]
    ];
    raporSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
    raporSheet.getRange("A1:J1").setBackground("#800000").setFontColor("#FFD700").setFontWeight("bold");
    
    raporSheet.autoResizeColumns(1, 10);
  }
  
  SpreadsheetApp.getUi().alert("KUKAMI Command Center: Berhasil dipisahkan dari data Finansial!");
}
