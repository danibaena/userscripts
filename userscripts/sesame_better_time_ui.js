// ==UserScript==
// @name         Sesame Better Time UI
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Show elapsed time per week and other handy metrics
// @author       danibaena
// @include      https://panel.sesametime.com/admin/users/checks*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    moment.locale('es')

    const formatMinutesForOutputString = unformattedMinutesInt => {
        const hourTimeString = Math.floor(unformattedMinutesInt/60).toString();
        const minutesTimeString = (unformattedMinutesInt%60).toString().padStart(2, 0);
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
    /* Change the minutes to fit your week work hours (i.e. reduced workweek, 7h = 420m, 6h = 360m) */
    //const regularWeekDaysMinutes = {'lunes': 420,
    //                                'martes': 420,
    //                                'miércoles': 420,
    //                                'jueves': 420,
    //                                'viernes': 420};

    const expectedTotalWorkMinutes = weeklyCheckings => {
        const allowedDays = Object.keys(weeklyCheckings['weekdays'])
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
        return `<p class="margin-top-10 text-right"><strong>${content}</strong> ${missingWorkMinutes ? '' : sesameLogo}</p>`
    }

    const isCurrentWorkingWeek = checkingDayDate => {
        const currentDate = new Date()
        const currentMoment = moment(currentDate)
        return currentMoment.isSame(checkingDayDate, 'week')
    }
    const isCurrentWorkingDay = checkingDayDate => {
        const currentDate = new Date()
        const currentMoment = moment(currentDate)
        return currentMoment.isSame(checkingDayDate, 'day')
    }

    const regularTotalWeekWorkHours = totalWeekWorkMinutes(regularWeekDaysMinutes)
    let weekNumber = 1
    let dailyCheckingsByWeek = {}

    const lastDayOfMonth = moment().endOf('month');

    let filteredDays = $('.ssm-checks-list-days').find('.bar:not(.holiday)').filter((index, element) => {
        const $element = $(element)
        const weekDayText = $element.prev('li.margin-top-10').text()
        if(weekDayText.includes('sábado') || weekDayText.includes('domingo')) {
            return false}
        return true
    }).filter((index, element) => {
        if($(element).find('.checks-text:not(.red-text)').length) {
            return true
        }
        return false
    })
    .map((index, element) => {
        const check = $(element).find('.checks-text')
        return check[0]
    })

    const checkingDays = filteredDays.each(function(index) {
        const weekDayText = $(this).parent().prev('li.margin-top-10').text().split(', ')
        const weekDay = weekDayText[0]
        const checkingDayDate = moment(weekDayText[1], 'DD de MMM');

        const checkingTimeElement = $(filteredDays[index])
        const checkingTimeString = checkingTimeElement.text().split('Horas registradas ')[1]
        const checkingTime = parseMinutesFromInputString(checkingTimeString)
        if(!(weekNumber in dailyCheckingsByWeek)) {
            dailyCheckingsByWeek[weekNumber] = {}
            dailyCheckingsByWeek[weekNumber]['weekdays'] = {}
        }
        dailyCheckingsByWeek[weekNumber]['weekdays'][weekDay] = checkingTime

        const workedWeekMinutes = totalWeekWorkMinutes(dailyCheckingsByWeek[weekNumber]['weekdays'])
        const expectedWorkMinutes = expectedTotalWorkMinutes(dailyCheckingsByWeek[weekNumber])
        dailyCheckingsByWeek[weekNumber]['workedWeekMinutes'] = workedWeekMinutes
        dailyCheckingsByWeek[weekNumber]['expectedWorkMinutes'] = expectedWorkMinutes

        if(!isCurrentWorkingWeek(checkingDayDate)) {
            if(weekDay === 'viernes') {
                dailyCheckingsByWeek[weekNumber]['missingWorkMinutes'] = expectedWorkMinutes - workedWeekMinutes
                dailyCheckingsByWeek[weekNumber]['last_work_weekday_selector'] = $(this)
                weekNumber++
            } else {
                const nextFilteredDay = filteredDays[index + 1]
                if(nextFilteredDay) {
                    const nextWeekDayText = $(nextFilteredDay).parent().prev('li.margin-top-10').text().split(', ')
                    if(nextWeekDayText[0] !== 'viernes') {
                        const checkingNextDayDate = moment(nextWeekDayText[1], 'DD de MMM');
                        if(!checkingDayDate.isSame(checkingNextDayDate, 'week')) {
                            dailyCheckingsByWeek[weekNumber]['missingWorkMinutes'] = expectedWorkMinutes - workedWeekMinutes
                            dailyCheckingsByWeek[weekNumber]['last_work_weekday_selector'] = $(this)
                            weekNumber++
                        }
                   }
                }
            }
        }

        if(moment(checkingDayDate).isSame(lastDayOfMonth, 'day')) {
            dailyCheckingsByWeek[weekNumber]['missingWorkMinutes'] = expectedWorkMinutes - workedWeekMinutes
            dailyCheckingsByWeek[weekNumber]['last_work_weekday_selector'] = $(this)
        }

        if(isCurrentWorkingWeek(checkingDayDate) && isCurrentWorkingDay(checkingDayDate)) {
            dailyCheckingsByWeek[weekNumber]['currentMissingWorkMinutes'] = expectedWorkMinutes - workedWeekMinutes
            dailyCheckingsByWeek[weekNumber]['current_work_weekday_selector'] = $(this)
        }
    })

    let missingWorkingMinutes = 0;
    for (let [weekNumber, dailyCheckings] of Object.entries(dailyCheckingsByWeek)) {
        if(dailyCheckings.missingWorkMinutes || dailyCheckings.missingWorkMinutes === 0) {
            missingWorkingMinutes += dailyCheckings.missingWorkMinutes;
        }
        if(dailyCheckings.last_work_weekday_selector && dailyCheckings.current_work_weekday_selector != dailyCheckings.last_work_weekday_selector) {
            const nextBar = dailyCheckings.last_work_weekday_selector.parent()
            nextBar.after(buildSummary(dailyCheckings.missingWorkMinutes))
        }
        if(dailyCheckings.current_work_weekday_selector) {
            const nextBar = dailyCheckings.current_work_weekday_selector.parent()
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
    $('.ssm-checks-list-days').after(buildSummary(missingWorkingMinutes, isMonthly))
})();
