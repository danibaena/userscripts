// ==UserScript==
// @name         Sesame Better Time UI
// @namespace    https://github.com/danibaena/userscripts/blob/master/userscripts/sesame_better_time_ui.js
// @version      1.0
// @description  Show elapsed time per week and other handy metrics
// @author       danibaena
// @include      https://panel.sesametime.com/admin/users/checks/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/danibaena/userscripts/master/userscripts/sesame_better_time_ui.js
// @updateUrl    https://raw.githubusercontent.com/danibaena/userscripts/master/userscripts/sesame_better_time_ui.js
// ==/UserScript==

(function() {
    'use strict';

    const formatMinutesForOutputString = unformattedMinutesInt => {
        const hourTimeString = Math.floor(unformattedMinutesInt / 60).toString();
        const minutesTimeString = (unformattedMinutesInt % 60).toString().padStart(2, 0);
        return `${hourTimeString}:${minutesTimeString}`
    }

    const parseMinutesFromInputString = formattedTimeString => {
        const splittedTimeString = formattedTimeString.split(':');
        const hourTime = parseInt(splittedTimeString[0]) * 60;
        const minutesTime = parseInt(splittedTimeString[1]);
        return (hourTime + minutesTime)
    }

    const totalWeekWorkMinutes = weekDaysMinutes => Object.values(weekDaysMinutes).reduce((accumulated, current) => {
        if(typeof current == 'number') {
            return accumulated + current
        }
        return accumulated
    });

    /* Change the minutes to fit your week work hours (i.e. reduced workweek) */
    const regularWeekDaysMinutes = {'lunes': 525,
                                    'martes': 525,
                                    'miércoles': 525,
                                    'jueves': 525,
                                    'viernes': 360};

    const expectedTotalWorkMinutes = weeklyCheckings => {
        const allowedDays = Object.keys(weeklyCheckings)
        const expectedWorkMinutes = Object.keys(regularWeekDaysMinutes).filter(key => allowedDays.includes(key)).reduce((obj, key) => {
            obj[key] = regularWeekDaysMinutes[key];
            return obj;
        }, {});
        return totalWeekWorkMinutes(expectedWorkMinutes)
    }

    const buildSummary = (missingWorkMinutes, isMonthlySummary, isCurrentDay) => {
        let content = '¡Todo bien!'
        if(missingWorkMinutes > 0) {
            content = `Falta/n ${formatMinutesForOutputString(missingWorkMinutes)} minuto/s`
            if(isCurrentDay) {
                const timeToStop = moment().add(missingWorkMinutes, 'm').format('HH:mm')
                content = `${content}. Deberías parar a las ${timeToStop}`
            }
        }
        if(missingWorkMinutes < 0) {
            content = `Sobra/n ${formatMinutesForOutputString(missingWorkMinutes * (-1))} minuto/s`
        }
        if(isMonthlySummary) {
            content = `${content} este mes`
        }
        const sesameLogo = '<img src="https://panel.sesametime.com/img/green-icon.png" width=20>';
        return `<li class="margin-top-10 text-right"><strong>${content}</strong> ${missingWorkMinutes ? '' : sesameLogo}</li>`
    }

    const isCurrentWorkingWeek = checkingDayDate => moment().isSame(checkingDayDate, 'week')
    const isCurrentWorkingDay = checkingDayDate => moment().isSame(checkingDayDate, 'day')

    const regularTotalWeekWorkHours = totalWeekWorkMinutes(regularWeekDaysMinutes)
    let weekNumber = 1
    let dailyCheckingsByWeek = {}

    const lastDayOfMonth = moment().endOf('month');
    const checkingTimes = $('.checks-text:not(.red-text)');

    const checkingDays = checkingTimes.parent('.bar').prev().each(function(index) {
        const weekDayText = $(this).text().split(', ')
        const weekDay = weekDayText[0]
        const checkingDayDate = moment(weekDayText[1], 'DD de MMM');
        const checkingTimeElement = $(checkingTimes[index])
        const checkingTimeString = checkingTimeElement.text().split('Horas registradas ')[1]
        const checkingTime = parseMinutesFromInputString(checkingTimeString)

        if(!(weekNumber in dailyCheckingsByWeek)) {
            dailyCheckingsByWeek[weekNumber] = {}
        }
        dailyCheckingsByWeek[weekNumber][weekDay] = checkingTime
        if(weekDay === 'viernes' || moment(checkingDayDate).isSame(lastDayOfMonth, 'day')) {
            const workedWeekMinutes = totalWeekWorkMinutes(dailyCheckingsByWeek[weekNumber])
            const expectedWorkMinutes = expectedTotalWorkMinutes(dailyCheckingsByWeek[weekNumber])
            dailyCheckingsByWeek[weekNumber]['workedWeekMinutes'] = workedWeekMinutes
            dailyCheckingsByWeek[weekNumber]['expectedWorkMinutes'] = expectedWorkMinutes
            dailyCheckingsByWeek[weekNumber]['missingWorkMinutes'] = expectedWorkMinutes - workedWeekMinutes
            dailyCheckingsByWeek[weekNumber]['last_work_weekday_selector'] = $(this)
            weekNumber++
        }
        if(isCurrentWorkingWeek(checkingDayDate) && isCurrentWorkingDay(checkingDayDate)) {
            const workedWeekMinutes = totalWeekWorkMinutes(dailyCheckingsByWeek[weekNumber])
            const expectedWorkMinutes = expectedTotalWorkMinutes(dailyCheckingsByWeek[weekNumber])
            dailyCheckingsByWeek[weekNumber]['workedWeekMinutes'] = workedWeekMinutes
            dailyCheckingsByWeek[weekNumber]['expectedWorkMinutes'] = expectedWorkMinutes
            dailyCheckingsByWeek[weekNumber]['currentMissingWorkMinutes'] = expectedWorkMinutes - workedWeekMinutes
            dailyCheckingsByWeek[weekNumber]['current_work_weekday_selector'] = $(this)
        }
    })

    let missingWorkingMinutes = 0;
    for (let [weekNumber, dailyCheckings] of Object.entries(dailyCheckingsByWeek)) {
        if(dailyCheckings.missingWorkMinutes || dailyCheckings.missingWorkMinutes === 0) {
            missingWorkingMinutes += dailyCheckings.missingWorkMinutes;
        }
        if(dailyCheckings.last_work_weekday_selector) {
            const nextBar = dailyCheckings.last_work_weekday_selector.next('.bar')
            nextBar.after(buildSummary(dailyCheckings.missingWorkMinutes))
        }
        if(dailyCheckings.current_work_weekday_selector) {
            const nextBar = dailyCheckings.current_work_weekday_selector.next('.bar')
            nextBar.after(buildSummary(dailyCheckings.currentMissingWorkMinutes + missingWorkingMinutes, false, true))
            missingWorkingMinutes = 0
        }
    }
    const isMonthly = true
    const accumulatedTimeStats = $('.ssm-content-title > small').text().split(' / ')
    const isMonthlyAccumulatedTimeStats = accumulatedTimeStats[0] === accumulatedTimeStats[1]

    if(isMonthlyAccumulatedTimeStats){
        missingWorkingMinutes = 0
    }
    $('.ssm-checks-list-days > ul').last().after(buildSummary(missingWorkingMinutes, isMonthly))
})();
