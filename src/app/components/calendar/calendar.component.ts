import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { MonthMapping } from '../../enums/month.mapping.enum';
import { eventTypes } from '../../enums/event.types.enum';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { editIcon } from 'src/assets';
import { v4 as uuidv4 } from 'uuid';
import { MessageService } from 'primeng/api';
import { CommonService } from 'src/app/service/common.service';

interface IEachDay {
  label: number;
  value: number;
  isToday: boolean;
  currentMonth: number;
  year: number;
}

interface IEventData {
  event_name: string;
  event_type: string;
  email: string;
  bg_color: string;
  start_date: Date;
  end_date: Date;
  event_id: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  @ViewChild('op') op!: OverlayPanel;
  @ViewChild('event') eventOp!: OverlayPanel;
  @ViewChild('moreEvents') moreEvents!: OverlayPanel;
  currentDate = new Date();
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  calenderData: IEachDay[][] = [];

  readonly monthMapping = MonthMapping;
  readonly defaultDateFormat: string = 'dd-MMM-yyyy';
  readonly days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly eventTypes = eventTypes;

  isOverlayOpen: boolean = false;
  eventCreationForm: FormGroup;
  isNextClicked = true;
  isSelecting = false;
  selectedDays: Set<number> = new Set();
  selectionStart: IEachDay | null = null;
  selectionStartEvent: MouseEvent | null = null;
  selectionIndex: number | null = null;
  dateMapToIndex: any = {};
  dateIndexToMap: any = {};
  eventMappedToIdx: { [key: number]: IEventData[] } = {};
  editIcon = editIcon;
  eventDataToDisplay: IEventData | null = null;
  eventOpenedEvent: any = null;
  formType: 'Add' | 'Edit' = 'Add';
  selectedAllEvents: IEventData[] = [];
  selectedDate = new Date();
  filterOptions = [
    { label: 'All', value: 'All' },
    { label: 'Task', value: 'Task' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Reminder', value: 'Reminder' }
  ]
  selectedFilter = 'All';

  constructor(
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService,
    private commonService: CommonService
  ) {
    this.eventCreationForm = this.fb.group({
      event_start_date: [null, Validators.required],
      event_end_date: [null, Validators.required],
      event_type: [null, Validators.required],
      event_name: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      bg_color: ['#ff0088' , Validators.required],
    });

  };

  ngOnInit(): void {
    this.generateCalender();
    document.addEventListener('mouseup', () => this.handleMouseUp());
  };

  ngOnDestroy() {
    document.removeEventListener('mouseup', () => this.handleMouseUp());
  }

  generateCalender() {

    this.dateMapToIndex = {};
    this.dateIndexToMap = {};
    this.eventMappedToIdx = {};
    this.calenderData = [];

    // get the number of days in the month
    const daysInMonth = this.getDaysInMonth(this.currentMonth, this.currentYear);

    // get the first day of the month
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();

    // get the number of days in the previous month
    const previousMonthDays = this.getDaysInMonth(this.currentMonth - 1, this.currentYear);

    let week: IEachDay[] = [];

    const addDayToWeek = (day: number, month: number, year: number) => {
      const today = new Date();
      const isToday = day === today.getDate() && this.currentMonth === today.getMonth() && this.currentYear === today.getFullYear();
      const index = this.calenderData.length * 7 + week.length;

      week.push({
        label: day,
        value: index,
        isToday,
        currentMonth: month,
        year
      });

      this.dateMapToIndex[`${day}-${month}-${this.currentYear}`] = index;
      this.dateIndexToMap[index] = `${day}-${month}-${this.currentYear}`;

      if (week.length === 7) {
        this.calenderData.push([...week]);
        week = [];
      };
    };

    // add the days of the previous month
    const previousMonth = this.calcMonthAndYear(this.currentMonth - 1, this.currentYear);
    for (let i = firstDay - 1; i >= 0; i--) {
      addDayToWeek(previousMonthDays - i, previousMonth.month, previousMonth.year);
    };

    // add the days of the current month
    const currentMonth = this.calcMonthAndYear(this.currentMonth, this.currentYear);
    for (let i = 1; i <= daysInMonth; i++) {
      addDayToWeek(i, currentMonth.month, currentMonth.year);
    };

    // add the days of the next month
    const currentWeek = week.length;
    const nextMonth = this.calcMonthAndYear(this.currentMonth + 1, this.currentYear);
    if (currentWeek) {
      for (let i = 1; i <= 7 - currentWeek; i++) {
        addDayToWeek(i, nextMonth.month, nextMonth.year);
      };
    };

    this.getEvents();
  };

  getEvents() {
    this.eventMappedToIdx = this.commonService.getEvents().reduce((acc: any, event: IEventData) => {
      if (event.event_type !== this.selectedFilter && this.selectedFilter !== 'All') {
        return acc;
      }

      const { start_date, end_date } = event;
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      for (let i = startDate.getDate(); i <= endDate.getDate(); i++) {
        const index = this.dateMapToIndex[`${i}-${startDate.getMonth()}-${startDate.getFullYear()}`];
        if (!acc[index]) {
          acc[index] = [];
        };
        acc[index].push(event);
      };
      return acc;
    }, {});
  }

  calcMonthAndYear(month: number, year: number) {
    if (month < 0) {
      month = 11;
      year = year - 1;
    }
    else if (month > 11) {
      month = 0;
      year = year + 1;
    }

    return { month, year };
  }

  getDaysInMonth(month: number, year: number) {
    const monthAndYear = this.calcMonthAndYear(month, year);
    return new Date(monthAndYear.month, monthAndYear.year + 1, 0).getDate();
  };

  prevMonth() {
    this.isNextClicked = false;
    if (this.currentMonth === 0) {
      this.currentMonth = 12;
      this.currentYear = this.currentYear - 1;
    }
    this.currentMonth -= 1;

    this.generateCalender();
  };

  nextMonth() {
    this.isNextClicked = true;
    if (this.currentMonth === 11) {
      this.currentMonth = -1;
      this.currentYear = this.currentYear + 1;
    }
    this.currentMonth += 1;

    this.generateCalender();
  };

  moveToToday() {
    if (this.currentMonth === new Date().getMonth() && this.currentYear === new Date().getFullYear()) return;

    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();

    this.generateCalender();
  };

  filterOnChange() {
    this.getEvents();
  }

  handleClickDay(event: MouseEvent, day: IEachDay) {
    if (this.op && event) {
      this.closeOverlay();

      setTimeout(() => {
        this.formType = 'Add';
        this.op.toggle(event);
        this.cd.detectChanges();
        if (!this.op.overlayVisible) return;

        this.selectedDays.add(day.value);
        this.selectionStart = day;
        this.isOverlayOpen = true;
        this.patchEventCreationForm();
      }, 10);
    }
  };

  patchEventCreationForm() {
    this.eventCreationForm.reset();
    const [startDay, endDay] = this.calcStartAndEndDates();
    this.eventCreationForm.patchValue({
      event_start_date: new Date(startDay.year, startDay.currentMonth, startDay.label),
      event_end_date: new Date(endDay.year, endDay.currentMonth, endDay.label),
      event_name: null,
      email: null,
      event_type: 'Task',
      bg_color: '#ff0088'
    });
  }

  calcStartAndEndDates() {
    const selectedDays = Array.from(this.selectedDays);
    const minValue = Math.min(...selectedDays);
    const maxValue = Math.max(...selectedDays);
    return [this.calenderData[Math.floor(minValue / 7)][minValue % 7], this.calenderData[Math.floor(maxValue / 7)][maxValue % 7]];
  };

  clearEmptyForm() {
    this.eventCreationForm.patchValue({
      event_start_date: null,
      event_end_date: null,
      event_name: null,
      email: null,
      event_type: null,
      bg_color: '#ff0088'
    });

    this.eventCreationForm.reset();
  };

  closeOverlay() {
    if (this.op) {
      this.op.hide();
      if (this.isOverlayOpen) {
        this.selectedDays.clear();
        this.clearEmptyForm();
        this.isOverlayOpen = false;
      }
    }
  };

  saveEvent() {
    if(this.eventCreationForm.invalid) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'Please fill all the required fields'});
      return;
    }

    if (this.formType === 'Edit') {
      this.deleteEvent(this.eventDataToDisplay!);
    }

    const { event_start_date, event_end_date, event_id, event_type, event_name, bg_color, email } = this.eventCreationForm.value;
    const eventId = this.formType === 'Add' ? uuidv4() : event_id;

    const newEvent = {
      event_name,
      event_type,
      bg_color,
      email,
      start_date: event_start_date,
      end_date: event_end_date,
      event_id: eventId
    }

    for (let day of this.selectedDays) {
      if (!this.eventMappedToIdx[day]) {
        this.eventMappedToIdx[day] = [];
      };

      this.eventMappedToIdx[day].push(newEvent);
    };

    this.commonService.storeEvents([newEvent]);
    this.messageService.add({severity: 'success', summary: 'Success', detail: `Event ${this.formType === 'Add' ? 'Added' : 'Updated'} Successfully`});
    this.closeOverlay();
  };

  handleMouseDown(day: IEachDay, event: MouseEvent) {
    this.isSelecting = true;
    this.selectionStart = day;
    this.selectionStartEvent = event;
    this.selectedDays.add(day.value);
  };

  handleMouseUp() {
    if (this.isSelecting && this.selectionStart && this.selectionStartEvent) {
      this.handleClickDay(this.selectionStartEvent as MouseEvent, this.selectionStart as IEachDay);
      this.isSelecting = false;
      this.selectionStart = null;
      this.selectionStartEvent = null
    }
  };

  handleMouseEnter(day: number) {
    if (this.isSelecting && this.selectionStart !== null && this.selectionStartEvent) {
      this.calcStartAndEndValues(this.selectionStart.value, day);
    }
  };

  calcStartAndEndValues(startValue: number, endValue: number) {
    const start = Math.min(startValue, endValue);
    const end = Math.max(startValue, endValue);
    this.selectedDays = new Set(Array.from({ length: end - start + 1 }, (_, i) => i + start));
  };

  handleStartEndDateChange() {
    let { event_start_date, event_end_date } = this.eventCreationForm.value;

    if (event_start_date.getTime() > event_end_date.getTime()) {
      this.eventCreationForm.patchValue({
        event_end_date: event_start_date
      });
      event_end_date = event_start_date;
    };

    if (event_start_date.getMonth() !== this.currentMonth || event_start_date.getFullYear() !== this.currentYear) {
      this.currentMonth = event_start_date.getMonth();
      this.currentYear = event_start_date.getFullYear();
      this.generateCalender();
    };

    const startValue = this.dateMapToIndex[`${event_start_date.getDate()}-${event_start_date.getMonth()}-${event_start_date.getFullYear()}`] || 0;
    const endValue = this.dateMapToIndex[`${event_end_date.getDate()}-${event_end_date.getMonth()}-${event_end_date.getFullYear()}`] || (this.calenderData.length * 7);

    this.calcStartAndEndValues(startValue, endValue);
  };

  openEvent(event: any, eventDetails: IEventData) {
    if (this.eventOp) {
      event.preventDefault();
      event.stopPropagation();
      this.closeEventOverlay();

      setTimeout(() => {
        this.op.hide();
      }, 20);

      setTimeout(() => {
        this.eventOp.toggle(event);
        this.eventDataToDisplay = eventDetails;
        this.eventOpenedEvent = event;
        this.cd.detectChanges();
      }, 10)
    }
  }

  closeEventOverlay() {
    if (this.eventOp) {
      this.eventOp.hide();
    }
  };

  deleteEvent(eventDetails: IEventData) {
    const { start_date, end_date } = eventDetails;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    for (let i = startDate.getDate(); i <= endDate.getDate(); i++) {
      const index = this.dateMapToIndex[`${i}-${startDate.getMonth()}-${startDate.getFullYear()}`];
      this.eventMappedToIdx[index] = (this.eventMappedToIdx[index] || []).filter((each) => each.event_id !== eventDetails.event_id);
    };

    this.commonService.deleteEvent(eventDetails.event_id);

    this.closeEventOverlay();
    this.closeEventListOverlay();
  };

  openEditEvent(eventDetails: IEventData) {
    const { start_date, end_date, event_type, event_name, bg_color, email } = eventDetails;

    this.eventCreationForm.patchValue({
      event_start_date: start_date,
      event_end_date: end_date,
      event_type,
      event_name,
      bg_color,
      email
    });

    this.closeEventOverlay();
    this.openEditForm(this.eventOpenedEvent);
  }

  openEditForm(event: any) {
    if (this.op) {
      this.closeOverlay();
      setTimeout(() => {
        this.formType = 'Edit';
        this.handleStartEndDateChange();
        this.op.toggle(event);
        this.cd.detectChanges();
        if (!this.op.overlayVisible) return;

        this.isOverlayOpen = true;
      }, 10);
    }
  };

  showAllEvents(events: IEventData[], event: any, day: IEachDay) {
    this.selectedAllEvents = events;
    this.selectedDate = new Date(day.year, day.currentMonth, day.label);

    if (this.moreEvents) {
      event.preventDefault();
      event.stopPropagation();
      this.moreEvents.hide();

      setTimeout(() => {
        this.op.hide();
      }, 20);

      setTimeout(() => {
        this.moreEvents.toggle(event);
      }, 20);
    }
  };

  closeEventListOverlay() {
    if (this.moreEvents) {
      this.moreEvents.hide();
    }
  }
}
