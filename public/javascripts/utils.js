function getMonthLabel(m, len) {
    if (!len)
        len = 100;
    var mm = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giungno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    return mm[m].substr(0,len);
}