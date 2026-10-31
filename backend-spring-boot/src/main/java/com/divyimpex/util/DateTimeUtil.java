package com.divyimpex.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class DateTimeUtil {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static class FormattedTime {
        private final String dateStr;
        private final String timeStr;
        private final String isoDate;

        public FormattedTime(String dateStr, String timeStr, String isoDate) {
            this.dateStr = dateStr;
            this.timeStr = timeStr;
            this.isoDate = isoDate;
        }

        public String getDateStr() { return dateStr; }
        public String getTimeStr() { return timeStr; }
        public String getIsoDate() { return isoDate; }
    }

    public static FormattedTime getFormattedTime() {
        LocalDateTime now = LocalDateTime.now();
        return new FormattedTime(
            now.format(DATE_FORMATTER),
            now.format(TIME_FORMATTER),
            now.format(ISO_FORMATTER)
        );
    }
}

