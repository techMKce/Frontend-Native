import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList 
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { COLORS, FONT, SIZES, SPACING } from '@/constants/theme';

type DatePickerProps = {
  value: string;
  onChange: (dateTime: string) => void;
  placeholder?: string;
};

const DatePicker = ({ value, onChange, placeholder = 'YYYY-MM-DD HH:mm' }: DatePickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : new Date());
  const [selectedHour, setSelectedHour] = useState<number>(selectedDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(selectedDate.getMinutes());
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthData = getMonthData(currentDate);

  const formatDateTime = (date: Date, hour: number, minute: number) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(hour).padStart(2, '0');
    const min = String(minute).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  const handleApply = () => {
    if (isMounted.current) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(selectedHour);
      finalDate.setMinutes(selectedMinute);
      onChange(formatDateTime(finalDate, selectedHour, selectedMinute));
      setModalVisible(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const renderTimePicker = (data: number[], selected: number, setSelected: React.Dispatch<React.SetStateAction<number>>) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.toString()}
      style={{ maxHeight: 100 }}
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({ length: 40, offset: 40 * index, index })}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setSelected(item)} style={[styles.timeItem, selected === item && styles.timeItemSelected]}>
          <Text style={[styles.timeText, selected === item && styles.timeTextSelected]}>
            {String(item).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <>
      <TouchableOpacity style={styles.dateInput} onPress={() => setModalVisible(true)}>
        <Calendar size={20} color={COLORS.gray} />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              
              {/* Calendar */}
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.monthText}>
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                  </Text>
                </View>

                <View style={styles.weekdayContainer}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <Text key={i} style={styles.weekdayText}>{day}</Text>
                  ))}
                </View>

                <View style={styles.daysContainer}>
                  {monthData.map((day, index) => (
                    day ? (
                      <TouchableOpacity
                        key={index}
                        style={[styles.day, day.getDate() === selectedDate.getDate() && styles.selectedDay]}
                        onPress={() => setSelectedDate(day)}
                      >
                        <Text style={day.getDate() === selectedDate.getDate() ? styles.selectedDayText : styles.dayText}>
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View key={`empty-${index}`} style={styles.emptyDay} />
                    )
                  ))}
                </View>
              </View>

              {/* Time Picker */}
              <View style={styles.timePickerContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  {renderTimePicker(hours, selectedHour, setSelectedHour)}
                </View>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Minute</Text>
                  {renderTimePicker(minutes, selectedMinute, setSelectedMinute)}
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>

            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateText: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  placeholderText: {
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarContainer: {
    padding: SPACING.md,
  },
  calendarHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  monthText: {
    fontSize: SIZES.lg,
    fontFamily: FONT.bold,
    color: COLORS.text,
  },
  weekdayContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
  },
  todayDayText: {
    color: COLORS.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.lightGray,
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderLeftWidth: 0.5,
    borderLeftColor: COLORS.lightGray,
  },
  cancelButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  applyButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  timeItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  timeItemSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  timeText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  timeTextSelected: {
    color: COLORS.white,
  },
});

export default DatePicker;