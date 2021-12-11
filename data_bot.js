require('dotenv').config()
const fs = require('fs');
const CronJob = require('cron').CronJob;
const Telegraf = require('telegraf').Telegraf;
const data_bot = new Telegraf(process.env.TELEGRAM_DATA_BOT_TOKEN);
const DBSOURCE = process.env.DBSOURCE
const sqlite3 = require('sqlite3').verbose();
const {
    group_by,
    get_sum,
    insert_data_to_db,
    read_db_data,
    get_today_string,
    get_current_month,
    get_current_year
} = require('./utils.js')
const {
    READ_LAST_N_DAYS_RECORDS,
    READ_GROUP_BY_DAY_SUM_COST,
    READ_CURRENT_MONTH_RECORDS,
    READ_CURRENT_MONTH_TARGET,
    READ_CATEGORIES,
    INSERT_NEW_TARGET,
    INSERT_AUTO_EXPENSES
} = require('./sql.js')

const months = {
    'jan' : '01',
    'feb' : '02',
    'mar' : '03',
    'apr' : '04',
    'may' : '05',
    'jun' : '06',
    'jul' : '07',
    'aug' : '08',
    'sep' : '09',
    'oct' : '10',
    'nov' : '11',
    'dec' : '12'
}

let db = new sqlite3.Database(DBSOURCE, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message)
        return
    }
    console.log('Connected to SQlite database.');
});

data_bot.hears(/^target\W+(\d+)$/, async ctx => {
    let target_budget = ctx.match[1].trim()
    let current_month = get_current_month()
    await insert_data_to_db(db, INSERT_NEW_TARGET, [current_month, target_budget])
    data_bot.telegram.sendMessage(ctx.chat.id, `Target budget successfully set to ${target_budget}`, {parse_mode: 'HTML'})
})

const fill_Auto_expenses_montly = new CronJob('00 00 00 1 * *', async function() {
    let today = get_today_string()
    await insert_data_to_db(db, INSERT_AUTO_EXPENSES, [today, today, today])
});

// Daily Average Cost By Month (Auto not included)
data_bot.hears(/^avg$/, async ctx => {
    let all_records = group_by(await read_db_data(db, READ_GROUP_BY_DAY_SUM_COST, []), 'Month')
    let daily_avg_cost_str = "<b>Daily Avg Cost By Month</b>\n=============================\n"
    let montly_expenses_target_str = "<b>Total Expenses and Target By Month</b>\n=============================\n"
    for (const [month, items] of Object.entries(all_records)) {
        let monthly_expenses = get_sum(items, 'Total').toFixed(2)
        let monthly_target = items[0]['Target']
        let daily_avg_by_month = (monthly_expenses/items.length).toFixed(2)
        let over_budget = (monthly_expenses-monthly_target).toFixed(2)
        daily_avg_cost_str = daily_avg_cost_str.concat(`<b>${month}</b>: $${daily_avg_by_month}`, "\n")
        montly_expenses_target_str = montly_expenses_target_str.concat(`<b>${month}</b>: $${monthly_expenses}/$${monthly_target} \t over budget: $${over_budget > 0 ? over_budget : 0}`, "\n")
    }
    data_bot.telegram.sendMessage(ctx.chat.id, daily_avg_cost_str, {parse_mode: 'HTML'})
    data_bot.telegram.sendMessage(ctx.chat.id, montly_expenses_target_str, {parse_mode: 'HTML'})
})

data_bot.hears(/^\d+$/, async ctx => {
    let days = `-${ctx.match[0].trim()} day`
    let last_n_days_records = group_by(await read_db_data(db, READ_LAST_N_DAYS_RECORDS, [days]), 'Date')
    let last_n_days_records_str = "<b>Bills</b>\n=============================\n"

    for (const [date, items] of Object.entries(last_n_days_records)) {
        last_n_days_records_str = last_n_days_records_str.concat(`<b>${date}</b>`, "\n")
        items.forEach(item => {
            last_n_days_records_str = last_n_days_records_str.concat(item['Category'], ', ', item['Description'], ', ', '$', item['Amount'], "\n")
        })
        let sum_by_n_days = get_sum(items, 'Amount').toFixed(2)
        last_n_days_records_str = last_n_days_records_str.concat(`<b>Total</b>: $${sum_by_n_days}\n`)
        last_n_days_records_str = last_n_days_records_str.concat("=============================\n")
    }
    data_bot.telegram.sendMessage(ctx.chat.id, last_n_days_records_str, {parse_mode: 'HTML'})
})

data_bot.hears(/^jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec$/, async ctx => {
    const current_year = get_current_year()
    const month = months[ctx.match[0].trim()] + "/" + current_year
    const expense_details_by_month = await get_expense_by_month(READ_CURRENT_MONTH_RECORDS, month, ctx)
    let month_target = await get_month_target(month)
    const sum_by_month = get_sum(expense_details_by_month, 'Amount').toFixed(2)
    const category_details = group_by(expense_details_by_month, 'Category')
    let category_details_copy = JSON.parse(JSON.stringify(category_details));
    for (const [category, items] of Object.entries(category_details_copy)) {
        let sum_by_category = get_sum(items, 'Amount')
        category_details_copy[category] = sum_by_category.toFixed(2)
        if (category == 'Auto') month_target = (month_target + sum_by_category).toFixed(2)
    }

    data_bot.telegram.sendMessage(ctx.chat.id, `You have spent ${sum_by_month}/${month_target} in ${month}`)
    data_bot.telegram.sendMessage(ctx.chat.id,
        `<b>Auto</b>: $${category_details_copy['Auto'] ? category_details_copy['Auto'] : 0}, ${category_details['Auto'] ? category_details['Auto'].length:0}, ${category_details_copy['Auto'] ? (100*(category_details_copy['Auto']/sum_by_month)).toFixed(2) : 0}%\n<b>Food</b>: $${category_details_copy['Food'] ? category_details_copy['Food'] : 0}, ${category_details['Food'] ? category_details['Food'].length : 0}, ${category_details['Food'] ? (100*(category_details_copy['Food']/sum_by_month)).toFixed(2) : 0}%\n<b>交通</b>: $${category_details_copy['交通'] ? category_details_copy['交通'] : 0}, ${category_details['交通'] ? category_details['交通'].length : 0}, ${category_details['交通'] ? (100*(category_details_copy['交通']/sum_by_month)).toFixed(2) : 0}%\n<b>日常用品</b>: $${category_details_copy['日常用品'] ? category_details_copy['日常用品'] : 0}, ${category_details['日常用品'] ? category_details['日常用品'].length : 0}, ${category_details['日常用品'] ? (100*(category_details_copy['日常用品']/sum_by_month)).toFixed(2) : 0}%\n<b>餐厅</b>: $${category_details_copy['餐厅'] ? category_details_copy['餐厅'] : 0}, ${category_details['餐厅'] ? category_details['餐厅'].length : 0}, ${category_details['餐厅'] ? (100*(category_details_copy['餐厅']/sum_by_month)).toFixed(2) : 0}%\n<b>诊所</b>: $${category_details_copy['诊所'] ? category_details_copy['诊所'] : 0}, ${category_details['诊所'] ? category_details['诊所'].length : 0}, ${category_details['诊所'] ? (100*(category_details_copy['诊所']/sum_by_month)).toFixed(2) : 0}%`, {parse_mode: 'HTML'}
    )
})

const get_expense_by_month = async (get_by_month_command, month, ctx) => {
    const expenses = await read_db_data(db, get_by_month_command, month)
    return expenses
}

const get_month_target = async current_month => {
    let target = await read_db_data(db, READ_CURRENT_MONTH_TARGET, current_month)
    target = target[0]['Target']
    return target
}

fill_Auto_expenses_montly.start()
data_bot.launch();

process.once('SIGINT', () => data_bot.stop('SIGINT'))
process.once('SIGTERM', () => data_bot.stop('SIGTERM'))
